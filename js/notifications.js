/*
 * Shared notification UI for every role:
 *  - unread badge(s) next to the "الإشعارات" nav entry / portal tab
 *    (values come from the server, never from a hard-coded constant),
 *  - explicit per-notification read actions + "mark all read",
 *  - phone push opt-in box (permission -> subscribe -> server save -> verify).
 *
 * Relies on globals defined by base.html: MS_CSRF, MS_SW_READY,
 * swRegistration, urlBase64ToUint8Array. Bell icon/dropdown: removed.
 */
(function () {
    'use strict';

    function onReady(fn) {
        if (document.readyState !== 'loading') fn();
        else document.addEventListener('DOMContentLoaded', fn);
    }

    function csrfToken() {
        if (typeof MS_CSRF !== 'undefined' && MS_CSRF) return MS_CSRF;
        const el = document.getElementById('csrf-token');
        return el ? el.value : '';
    }

    // POST helper: auto-refreshes the CSRF token on 400 (long-lived PWA
    // pages outlive the 1h token) and retries once. Falls back to a plain
    // fetch when base.html's MSPostJSON is unavailable.
    async function postJSON(url, body) {
        if (typeof MSFetch === 'function') {
            return MSFetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
        }
        return fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrfToken() },
            body: JSON.stringify(body),
        });
    }

    function getJSON(url) {
        if (typeof MSFetch === 'function') return MSFetch(url);
        return fetch(url);
    }

    function errorText(err, fallback) {
        if (typeof MSFetch === 'function') return MSFetch.errorText(err, fallback);
        return fallback || 'حدث خطأ';
    }

    onReady(function () {
        /* --------------------------------------------------------------
         * Unread badges (nav link + student portal tab)
         * -------------------------------------------------------------- */
        const badges = Array.prototype.slice.call(
            document.querySelectorAll('[data-unread-badge]')
        );
        const markAllBtn = document.getElementById('mark-all-read');

        function setUnread(count) {
            const n = Number(count) || 0;
            badges.forEach(function (b) {
                b.textContent = n > 99 ? '99+' : String(n);
                b.classList.toggle('d-none', n <= 0);
                if (n > 0) b.setAttribute('aria-label', n + ' إشعار غير مقروء');
                else b.removeAttribute('aria-label');
            });
            if (markAllBtn) markAllBtn.classList.toggle('d-none', n <= 0);
        }

        function markItemRead(item) {
            if (!item) return;
            item.classList.remove('unread');
            const tag = item.querySelector('.nt-new');
            if (tag) tag.remove();
            const btn = item.querySelector('.ms-mark-read');
            if (btn) btn.remove();
        }

        // Opening a page/tab never marks anything read: only these buttons do.
        Array.prototype.forEach.call(
            document.querySelectorAll('.ms-mark-read'),
            function (btn) {
                btn.addEventListener('click', async function () {
                    btn.disabled = true;
                    try {
                        const r = await postJSON('/notifications/api/mark-read/' + btn.dataset.nid, {});
                        const d = await r.json();
                        if (d.ok) {
                            // The same notification can be rendered more than once
                            // (e.g. a general one under every class): mark them all.
                            const cards = document.querySelectorAll(
                                '.notification-item[data-nid="' + btn.dataset.nid + '"], ' +
                                '.notif-card[data-nid="' + btn.dataset.nid + '"]'
                            );
                            if (cards.length) {
                                cards.forEach(markItemRead);
                            } else {
                                markItemRead(btn.closest('.notification-item, .notif-card'));
                            }
                            setUnread(d.count);
                        } else {
                            btn.disabled = false;
                        }
                    } catch (e) {
                        console.error('mark-read failed', e);
                        btn.disabled = false;
                    }
                });
            }
        );

        if (markAllBtn) {
            markAllBtn.addEventListener('click', async function () {
                markAllBtn.disabled = true;
                try {
                    const r = await postJSON('/notifications/api/mark-all-read', {});
                    const d = await r.json();
                    if (d.ok) {
                        Array.prototype.forEach.call(
                            document.querySelectorAll('.notification-item.unread, .notif-card.unread'),
                            markItemRead
                        );
                        setUnread(0);
                    }
                } catch (e) {
                    console.error('mark-all-read failed', e);
                }
                markAllBtn.disabled = false;
            });
        }

        /* --------------------------------------------------------------
         * Phone push opt-in box
         * -------------------------------------------------------------- */
        const pushBox = document.getElementById('push-optin');
        const pushMsg = document.getElementById('push-optin-msg');
        const pushBtn = document.getElementById('push-optin-btn');
        if (!pushBox || !pushBtn || !pushMsg) return;

        const PUSH_UI = {
            loading:     { msg: 'جارٍ التحقق من حالة إشعارات الهاتف…', btn: null, cls: '' },
            prompt:      { msg: 'لم تفعّل إشعارات الهاتف بعد. فعّلها ليصلك كل جديد فورًا على جهازك — وتبقى كل الإشعارات متاحة هنا داخل الموقع في أي حال.', btn: 'تفعيل إشعارات الهاتف', cls: '' },
            denied:      { msg: 'تم رفض إذن الإشعارات لهذا المتصفح. لتفعيله يدويًا: اضغط أيقونة القفل/الإشعارات بجانب عنوان الموقع، اختر "السماح" أو "الإشعارات"، ثم أعد المحاولة.', btn: 'إعادة المحاولة', cls: 'state-denied' },
            error:       { msg: 'تعذر تفعيل إشعارات الهاتف ولم يتم حفظ الاشتراك على الخادم. انتظر لحظة ثم حاول مجددًا.', btn: 'المحاولة مجددًا', cls: 'state-error' },
            unsupported: { msg: 'متصفحك لا يدعم إشعارات الهاتف، لكن كل الإشعارات تبقى متاحة هنا داخل الموقع.', btn: null, cls: '' },
            unavailable: { msg: 'إشعارات الهاتف غير متاحة حاليًا على الخادم، لكن كل الإشعارات تبقى متاحة هنا داخل الموقع.', btn: null, cls: '' },
            enabled:     { msg: 'إشعارات الهاتف مفعّلة على هذا الجهاز ✓', btn: null, cls: 'state-enabled' },
        };

        function unreliableBrowserNote() {
            const ua = navigator.userAgent || '';
            if (/MiuiBrowser|; wv\)|FBAN|FBAV|Instagram|LinkedInApp|MicroMessenger|Line\//.test(ua)) {
                return ' تنبيه: هذا المتصفح لا يضمن وصول الإشعارات إلى شريط الحالة — الأفضل فتح الموقع من Chrome أو تثبيته كتطبيق منه.';
            }
            return '';
        }

        function setPushState(key) {
            const ui = PUSH_UI[key] || PUSH_UI.error;
            pushBox.dataset.state = key;
            pushBox.className = 'push-optin ' + ui.cls;
            pushMsg.textContent = ui.msg + unreliableBrowserNote();
            if (ui.btn) {
                pushBtn.textContent = ui.btn;
                pushBtn.classList.remove('d-none');
            } else {
                pushBtn.classList.add('d-none');
            }
        }

        async function getSwRegistration() {
            let reg = null;
            if (typeof MS_SW_READY !== 'undefined' && MS_SW_READY && MS_SW_READY.then) {
                reg = await Promise.race([
                    MS_SW_READY,
                    new Promise(function (res) { setTimeout(function () { res(null); }, 4000); }),
                ]);
            }
            if (!reg && typeof swRegistration !== 'undefined') reg = swRegistration;
            return reg;
        }

        async function fetchPushStatus(endpoint) {
            const url = endpoint
                ? '/push/status?endpoint=' + encodeURIComponent(endpoint)
                : '/push/status';
            try {
                const r = await getJSON(url);
                if (!r.ok) return null;
                const d = await r.json();
                return d.success ? d : null;
            } catch (e) {
                // Unknown is treated the same as "not saved": every caller
                // (saveSubscription, evaluatePushState) must not break on it.
                return null;
            }
        }

        async function saveSubscription(sub) {
            // The server is the source of truth: skip the POST while this
            // endpoint is already stored (page loads must not rewrite rows).
            // fetchPushStatus never throws (expired session -> HTML body ->
            // JSON parse error is swallowed there), so this gate cannot break
            // the flow: an unknown answer falls through to the POST below.
            const known = await fetchPushStatus(sub.endpoint);
            if (known && known.has_subscription) return true;
            const r = await postJSON('/push/subscribe', sub);
            const d = await r.json().catch(function () { return {}; });
            if (r.ok && d.success) return true;
            if (d.stale && typeof window.MSSubscribePush === 'function') {
                const repaired = await window.MSSubscribePush();
                return !!(repaired && repaired.ok);
            }
            console.error('push/subscribe failed', r.status, d);
            return false;
        }

        async function verifySubscriptionSaved(endpoint) {
            const st = await fetchPushStatus(endpoint);
            return !!(st && st.has_subscription);
        }

        // Create (if needed) + save + verify; true only after the server
        // confirms the subscription is stored.
        async function activatePush() {
            if (typeof window.MSSubscribePush === 'function') {
                const r = await window.MSSubscribePush();
                if (r && r.ok && r.endpoint) return verifySubscriptionSaved(r.endpoint);
                return false;
            }
            const reg = await getSwRegistration();
            if (!reg || !('PushManager' in window)) return false;
            // Check first: an existing subscription is reused as-is and
            // subscribe() is never called again for it.
            let sub = await reg.pushManager.getSubscription();
            if (!sub) {
                const keyResp = await getJSON('/push/public-key');
                const keyData = await keyResp.json().catch(function () { return {}; });
                if (!keyData.success) return false;
                sub = await reg.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: urlBase64ToUint8Array(keyData.publicKey),
                });
            }
            if (!sub) return false;
            if (!(await saveSubscription(sub))) return false;
            return verifySubscriptionSaved(sub.endpoint);
        }

        async function evaluatePushState() {
            if (!('Notification' in window) || !('PushManager' in window) || !('serviceWorker' in navigator)) {
                return 'unsupported';
            }
            const perm = Notification.permission;
            if (perm === 'denied') return 'denied';
            if (perm === 'default') return 'prompt';

            // 'granted': report "enabled" only when the subscription is stored.
            const reg = await getSwRegistration();
            if (!reg || !('PushManager' in window)) return 'unsupported';

            const keyResp = await getJSON('/push/public-key');
            const keyData = await keyResp.json().catch(function () { return {}; });
            if (!keyData.success) return 'unavailable';

            let sub = await reg.pushManager.getSubscription();
            if (!sub) {
                // Permission kept but subscription lost/expired: repair it.
                return (await activatePush()) ? 'enabled' : 'error';
            }
            const status = await fetchPushStatus(sub.endpoint);
            if (!status) return 'error';
            if (!status.configured) return 'unavailable';
            if (status.has_subscription) return 'enabled';
            return (await activatePush()) ? 'enabled' : 'error';
        }

        async function refreshPushOptin() {
            try {
                setPushState('loading');
                setPushState(await evaluatePushState());
            } catch (e) {
                console.error('push state evaluation failed', e);
                setPushState('error');
            }
        }

        pushBtn.addEventListener('click', async function () {
            pushBtn.disabled = true;
            try {
                const state = pushBox.dataset.state;
                if (state === 'prompt' || state === 'loading') {
                    // Permission request from a direct user interaction.
                    const perm = await Notification.requestPermission();
                    if (perm === 'granted') {
                        setPushState((await activatePush()) ? 'enabled' : 'error');
                    } else {
                        setPushState(perm === 'denied' ? 'denied' : 'prompt');
                    }
                } else {
                    // denied / error: re-check (may have been changed manually).
                    setPushState(await evaluatePushState());
                }
            } catch (e) {
                console.error('push activation failed', e);
                setPushState('error');
            }
            pushBtn.disabled = false;
        });

        refreshPushOptin();

        // Let pages re-check when their notification surface is opened.
        window.MSNotifRefreshPush = refreshPushOptin;
    });
})();
