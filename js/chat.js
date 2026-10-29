/*
 * Private chat (student <-> admin/assistant).
 *
 * Used by two pages with the same markup contract:
 *  - the staff conversation page (/chat/<id>)  -> MSChat.initWindow()
 *  - the student portal chat tab               -> MSChat.initWindow()
 * plus MSChat.initInbox() for the staff inbox list.
 *
 * Polls every 10s while the window is visible (and the tab is focused);
 * only fetches messages the client is missing (since_id).
 *
 * Relies on globals from base.html: MS_CSRF, MSPostJSON (not required).
 */
(function () {
    'use strict';

    var POLL_MS = 10000;
    var POLL_IDLE_MS = 30000;
    var IDLE_AFTER = 3;
    var authRedirectScheduled = false;

    function isAuthError(err) {
        return !!err && err.kind === 'auth';
    }

    function redirectToLogin() {
        if (authRedirectScheduled) return;
        authRedirectScheduled = true;
        setTimeout(function () {
            window.location.href = '/auth/login';
        }, 1500);
    }

    function fetchJson(url, options) {
        if (typeof MSFetch === 'function') return MSFetch(url, options);
        return fetch(url, options);
    }

    function errorText(err, fallback) {
        if (typeof MSFetch === 'function') return MSFetch.errorText(err, fallback);
        return fallback || 'تعذر الاتصال بالخادم — حاول مجدداً';
    }

    function csrfToken() {
        if (typeof MS_CSRF !== 'undefined' && MS_CSRF) return MS_CSRF;
        var el = document.getElementById('csrf-token');
        return el ? el.value : '';
    }

    function mediaUrl(path) {
        if (!path) return '';
        if (/^https?:\/\//i.test(path)) return path;
        return '/static/' + path;
    }

    function esc(value) {
        var d = document.createElement('div');
        d.textContent = value == null ? '' : String(value);
        return d.innerHTML;
    }

    function setBadges(count) {
        var n = Number(count) || 0;
        document.querySelectorAll('[data-chat-unread-badge]').forEach(function (b) {
            b.textContent = n > 99 ? '99+' : String(n);
            b.classList.toggle('d-none', n <= 0);
        });
    }

    function messageMarkup(m, opts) {
        var parts = [];
        parts.push('<div class="chat-msg ' + (m.is_mine ? 'mine' : 'theirs') + '" data-mid="' + m.id + '">');
        if (opts.showSender && !m.is_mine) {
            parts.push('<div class="chat-msg-sender">' + esc(m.sender_name) +
                (m.sender_role ? ' · ' + esc(m.sender_role) : '') + '</div>');
        }
        if (m.image_path) {
            parts.push('<a class="chat-msg-image" href="' + esc(mediaUrl(m.image_path)) +
                '" target="_blank" rel="noopener"><img src="' + esc(mediaUrl(m.image_path)) +
                '" alt="صورة" loading="lazy"></a>');
        }
        if (m.body) {
            parts.push('<div class="chat-msg-body">' + esc(m.body) + '</div>');
        }
        parts.push('<div class="chat-msg-meta"><span>' + esc(m.time || '') + '</span>' +
            (m.is_mine && m.read ? '<span class="chat-tick">✓✓</span>' : '') + '</div>');
        parts.push('</div>');
        return parts.join('');
    }

    function renderMessages(container, messages, opts) {
        if (!messages.length) {
            container.innerHTML = '<div class="chat-empty">' +
                (opts.emptyText || 'لا توجد رسائل بعد — ابدأ المحادثة.') + '</div>';
            return;
        }
        var html = '';
        var lastDate = '';
        messages.forEach(function (m) {
            if (m.date && m.date !== lastDate) {
                html += '<div class="chat-date-sep">' + esc(m.date) + '</div>';
                lastDate = m.date;
            }
            html += messageMarkup(m, opts);
        });
        container.innerHTML = html;
        container.scrollTop = container.scrollHeight;
    }

    function appendMessages(container, messages, opts) {
        if (!messages.length) return;
        var scrollNearBottom =
            container.scrollHeight - container.scrollTop - container.clientHeight < 120;
        var dateSeps = container.querySelectorAll('.chat-date-sep');
        var lastDate = dateSeps.length
            ? dateSeps[dateSeps.length - 1].textContent.trim() : '';
        var frag = document.createElement('div');
        var html = '';
        messages.forEach(function (m) {
            if (m.date && m.date !== lastDate) {
                html += '<div class="chat-date-sep">' + esc(m.date) + '</div>';
                lastDate = m.date;
            }
            html += messageMarkup(m, opts);
        });
        var empty = container.querySelector('.chat-empty');
        if (empty) empty.remove();
        frag.innerHTML = html;
        while (frag.firstChild) container.appendChild(frag.firstChild);
        if (scrollNearBottom) container.scrollTop = container.scrollHeight;
    }

    /* ------------------------------------------------------------------
     * Conversation window (both roles)
     * ------------------------------------------------------------------ */
    function initWindow(root) {
        if (!root) return null;
        var mode = root.getAttribute('data-mode') || 'staff';
        var urls = {
            messages: root.getAttribute('data-messages-url'),
            send: root.getAttribute('data-send-url'),
            markRead: root.getAttribute('data-mark-read-url'),
        };
        var container = root.querySelector('#chat-messages') ||
            root.querySelector('.chat-messages');
        var form = root.querySelector('[data-chat-form]');
        var input = root.querySelector('[data-chat-input]');
        var imageInput = root.querySelector('[data-chat-image]');
        var sendBtn = root.querySelector('[data-chat-send]');
        var errorBox = root.querySelector('[data-chat-error]');
        var statusEl = root.querySelector('[data-chat-status]');
        var remainingEl = root.querySelector('[data-chat-remaining]');

        var state = { messages: [], lastId: 0, busy: false, limited: false };
        var opts = { showSender: mode !== 'student' };
        var pollTimer = null;
        var idleStreak = 0;
        var authFailed = false;

        function showError(text) {
            if (!errorBox) return;
            errorBox.textContent = text || '';
            errorBox.classList.toggle('show', !!text);
        }

        // Offline/stale notice: an info state, not an error. The .chat-error
        // box stays reserved for failures; this strip tells the user the
        // view is frozen and that recovery happens by itself.
        function setStatus(text) {
            if (!statusEl) return;
            statusEl.textContent = text || '';
            statusEl.classList.toggle('show', !!text);
        }

        function isConnDown(err) {
            // A connection drop, not a business answer: MSFetch's "network"
            // kind, or a raw fetch TypeError when MSFetch is absent.
            return !!err && (err.kind === 'network' || !err.kind);
        }

        function offlineNotice() {
            return state.messages.length
                ? 'أنت غير متصل الآن — المحادثة المعروضة آخر ما وصلك، وستصلك الرسائل الجديدة تلقائيًا عند عودة الاتصال.'
                : 'أنت غير متصل الآن — ستصلك الرسائل تلقائيًا عند عودة الاتصال.';
        }

        function handleAuthError(err) {
            if (!isAuthError(err)) return false;
            authFailed = true;
            stopPolling();
            showError(errorText(err));
            redirectToLogin();
            return true;
        }

        function visible() {
            if (document.hidden) return false;
            if (mode === 'student') {
                // Only poll while the portal chat tab is the active panel.
                return !!root.closest('.portal-panel.active');
            }
            return true;
        }

        function withSince(id) {
            var sep = urls.messages.indexOf('?') >= 0 ? '&' : '?';
            return urls.messages + sep + 'since_id=' + id;
        }

        function markRead() {
            if (!urls.markRead || !visible()) return;
            fetchJson(urls.markRead, {
                method: 'POST',
                headers: { 'X-CSRFToken': csrfToken() },
            }).then(function (r) { return r.json(); })
                .then(function (d) { if (d && d.ok) setBadges(d.count); })
                .catch(function (err) {
                    if (!handleAuthError(err)) { /* next poll */ }
                });
        }

        function applyPayload(data, mode2) {
            if (!data || !data.ok) return;
            var incoming = data.messages || [];
            if (mode2 === 'replace') {
                state.messages = incoming;
                renderMessages(container, incoming, opts);
            } else if (incoming.length) {
                state.messages = state.messages.concat(incoming);
                appendMessages(container, incoming, opts);
            }
            if (state.messages.length) {
                state.lastId = state.messages[state.messages.length - 1].id;
            }
            if (typeof data.unread === 'number') setBadges(data.unread);
            if (typeof data.remaining_today === 'number' && remainingEl) {
                remainingEl.textContent = 'المتبقي اليوم: ' + data.remaining_today +
                    (data.daily_limit ? ' من ' + data.daily_limit : '');
                if (data.remaining_today <= 0) lockComposer(true);
            }
            var fromOther = incoming.some(function (m) { return !m.is_mine; });
            if (fromOther) markRead();
        }

        function poll() {
            if (!visible() || state.busy) return Promise.resolve(0);
            var url = state.lastId ? withSince(state.lastId) : urls.messages;
            var before = state.messages.length;
            return fetchJson(url, { headers: { 'Accept': 'application/json' } })
                .then(function (r) { return r.json(); })
                .then(function (d) {
                    setStatus('');
                    applyPayload(d, state.lastId ? 'append' : 'replace');
                    return Math.max(0, state.messages.length - before);
                })
                .catch(function (err) {
                    if (!handleAuthError(err) && isConnDown(err)) setStatus(offlineNotice());
                    return 0;
                });
        }

        function stopPolling() {
            if (pollTimer) { clearTimeout(pollTimer); pollTimer = null; }
        }

        function scheduleNextPoll() {
            if (authFailed) return;
            stopPolling();
            var delay = idleStreak >= IDLE_AFTER ? POLL_IDLE_MS : POLL_MS;
            pollTimer = setTimeout(tick, delay);
        }

        function tick() {
            pollTimer = null;
            if (authFailed) return;
            if (!visible()) { scheduleNextPoll(); return; }
            poll().then(function (added) {
                if (authFailed) return;
                idleStreak = added > 0 ? 0 : idleStreak + 1;
                scheduleNextPoll();
            });
        }

        function lockComposer(locked) {
            state.limited = !!locked;
            if (input) input.disabled = locked;
            if (sendBtn) sendBtn.disabled = locked;
            if (locked && input) {
                input.placeholder = 'وصلت للحد اليومي من الرسائل — حاول غداً';
            }
        }

        function send() {
            if (state.busy || !form) return;
            var body = (input && input.value || '').trim();
            var file = imageInput && imageInput.files && imageInput.files[0];
            if (!body && !file) return;

            state.busy = true;
            if (sendBtn) { sendBtn.disabled = true; sendBtn.textContent = 'جارٍ الإرسال…'; }
            showError('');

            var fd = new FormData();
            fd.append('body', body);
            if (file) fd.append('image', file);

            fetchJson(urls.send, {
                method: 'POST',
                headers: { 'X-CSRFToken': csrfToken() },
                body: fd,
            }).then(function (r) {
                return r.json().then(function (d) { return { status: r.status, data: d }; });
            }).then(function (res) {
                setStatus(''); // the server answered: connection is up
                var d = res.data || {};
                if (!d.ok) {
                    showError(d.error || 'تعذر إرسال الرسالة');
                    if (d.code === 'daily_limit') lockComposer(true);
                    return;
                }
                if (input) input.value = '';
                if (imageInput) imageInput.value = '';
                if (input) input.style.height = '';
                state.messages.push(d.message);
                state.lastId = d.message.id;
                appendMessages(container, [d.message], opts);
                if (typeof d.remaining_today === 'number' && remainingEl) {
                    remainingEl.textContent = 'المتبقي اليوم: ' + d.remaining_today +
                        (d.daily_limit ? ' من ' + d.daily_limit : '');
                    if (d.remaining_today <= 0) lockComposer(true);
                }
            }).catch(function (err) {
                // Keep the typed text / chosen image so nothing is lost.
                if (!handleAuthError(err)) {
                    showError(errorText(err, 'تعذر إرسال الرسالة'));
                    if (isConnDown(err)) setStatus(offlineNotice());
                }
            }).then(function () {
                state.busy = false;
                if (sendBtn) { sendBtn.disabled = state.limited; sendBtn.textContent = 'إرسال'; }
            });
        }

        if (form) {
            form.addEventListener('submit', function (e) { e.preventDefault(); send(); });
        }
        if (input) {
            input.addEventListener('keydown', function (e) {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    send();
                }
            });
            input.addEventListener('input', function () {
                input.style.height = 'auto';
                input.style.height = Math.min(input.scrollHeight, 140) + 'px';
            });
        }

        var api = {
            poll: poll,
            markRead: markRead,
            state: state,
            refresh: function () {
                return poll().then(markRead);
            },
        };

        // Initial load, then adaptive polling: fast while active, slower
        // after several quiet polls, and stopped while the tab is hidden.
        api.refresh();
        if (!document.hidden) pollTimer = setTimeout(tick, POLL_MS);
        document.addEventListener('visibilitychange', function () {
            if (document.hidden) { stopPolling(); return; }
            idleStreak = 0;
            stopPolling();
            tick();
        });

        // The last initialized window is the one a page acts on (portal
        // tab activation calls MSChat.refresh()).
        window.MSChat.activeWindow = api;

        return api;
    }

    /* ------------------------------------------------------------------
     * Staff inbox list (poll refresh every 10s)
     * ------------------------------------------------------------------ */
    function initInbox(container) {
        if (!container) return;
        var inboxUrl = container.getAttribute('data-inbox-url');
        if (!inboxUrl) return;
        var activeId = container.getAttribute('data-active');
        var lastSignature = '';
        var inboxTimer = null;
        var inboxIdle = 0;
        var authStopped = false;

        function poll() {
            if (authStopped || document.hidden) return Promise.resolve(false);
            return fetchJson(inboxUrl, { headers: { 'Accept': 'application/json' } })
                .then(function (r) { return r.json(); })
                .then(function (d) {
                    if (!d || !d.ok) return false;
                    if (typeof d.unread_total === 'number') setBadges(d.unread_total);
                    var items = d.items || [];
                    var signature = JSON.stringify(items);
                    if (signature === lastSignature) return false;
                    lastSignature = signature;
                    if (!items.length) {
                        container.innerHTML = '<div class="chat-empty">' +
                            'لا توجد محادثات بعد — تظهر هنا أول مرة يرسل فيها طالب رسالة.</div>';
                        return true;
                    }
                    var html = items.map(function (it) {
                        var badge = it.unread
                            ? '<span class="chat-inbox-badge" data-unread>' + it.unread + '</span>' : '';
                        var preview = it.last_preview
                            ? '<div class="chat-inbox-preview">' +
                              (it.last_is_from_student ? '' : 'أنت: ') +
                              esc(it.last_preview) + '</div>' : '';
                        return '<a class="chat-inbox-item ' +
                            (String(it.id) === String(activeId) ? 'active' : '') +
                            '" href="/chat/' + it.id + '" data-conv-id="' + it.id + '">' +
                            '<div class="chat-inbox-top">' +
                            '<span class="chat-inbox-name">' + esc(it.student_name) + '</span>' +
                            badge + '</div>' +
                            '<div class="chat-inbox-meta">🏫 ' + esc(it.class_name) +
                            (it.class_number ? ' · رقم ' + it.class_number : '') + '</div>' +
                            preview + '</a>';
                    }).join('');
                    container.innerHTML = html;
                    return true;
                })
                .catch(function (err) {
                    if (isAuthError(err)) {
                        authStopped = true;
                        if (inboxTimer) { clearTimeout(inboxTimer); inboxTimer = null; }
                        redirectToLogin();
                    }
                    return false; /* transient */
                });
        }

        function scheduleInbox() {
            if (authStopped) return;
            if (inboxTimer) clearTimeout(inboxTimer);
            inboxTimer = setTimeout(tickInbox, inboxIdle >= IDLE_AFTER ? POLL_IDLE_MS : POLL_MS);
        }

        function tickInbox() {
            inboxTimer = null;
            if (authStopped) return;
            if (document.hidden) { scheduleInbox(); return; }
            poll().then(function (changed) {
                if (authStopped) return;
                inboxIdle = changed ? 0 : inboxIdle + 1;
                scheduleInbox();
            });
        }

        poll();
        if (!document.hidden) inboxTimer = setTimeout(tickInbox, POLL_MS);
        document.addEventListener('visibilitychange', function () {
            if (authStopped) return;
            if (document.hidden) {
                if (inboxTimer) { clearTimeout(inboxTimer); inboxTimer = null; }
                return;
            }
            inboxIdle = 0;
            if (inboxTimer) { clearTimeout(inboxTimer); inboxTimer = null; }
            tickInbox();
        });
    }

    window.MSChat = {
        initWindow: initWindow,
        initInbox: initInbox,
        setBadges: setBadges,
        activeWindow: null,
        refresh: function () {
            if (window.MSChat.activeWindow) return window.MSChat.activeWindow.refresh();
            return Promise.resolve();
        },
    };

    document.addEventListener('DOMContentLoaded', function () {
        document.querySelectorAll('[data-chat-window]').forEach(function (el) {
            initWindow(el);
        });
        initInbox(document.getElementById('chat-inbox'));
    });
})();
