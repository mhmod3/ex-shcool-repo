/*
 * MSFetch: the single fetch wrapper used by the app's JS.
 *
 * What it adds on top of fetch():
 *  - same-origin credentials and the current X-CSRFToken on writes,
 *  - a fresh token from /auth/csrf + one retry when the server says the
 *    token no longer matches the session (old page / renewed cookie),
 *  - one retry after Retry-After for rate limits (short waits only),
 *  - typed errors so callers can tell a REAL network failure ("انقطع
 *    الاتصال") from 429, an expired session and an expired CSRF token.
 *
 * Loaded by base.html before every other script.
 */
(function (global) {
    'use strict';

    function csrfToken() {
        if (typeof global.MS_CSRF !== 'undefined' && global.MS_CSRF) return global.MS_CSRF;
        var el = document.getElementById('csrf-token');
        return el ? el.value : '';
    }

    function setCsrfToken(token) {
        global.MS_CSRF = token;
        var el = document.getElementById('csrf-token');
        if (el) el.value = token;
    }

    function sleep(ms) {
        return new Promise(function (resolve) { setTimeout(resolve, ms); });
    }

    function makeError(kind, message, status, retryAfter) {
        var err = new Error(message || kind);
        err.name = 'MSFetchError';
        err.kind = kind;
        err.status = status || 0;
        err.retryAfter = retryAfter || 0;
        return err;
    }

    function isLoginUrl(url) {
        try {
            return new URL(url, global.location.href).pathname.indexOf('/auth/login') === 0;
        } catch (e) {
            return false;
        }
    }

    function retryAfterSeconds(response) {
        var raw = response.headers.get('Retry-After');
        if (!raw) return 0;
        var seconds = parseInt(raw, 10);
        if (!isNaN(seconds)) return Math.max(0, seconds);
        var date = Date.parse(raw);
        return isNaN(date) ? 0 : Math.max(0, Math.ceil((date - Date.now()) / 1000));
    }

    async function peekJson(response) {
        try { return await response.clone().json(); } catch (e) { return null; }
    }

    async function refreshCsrf() {
        try {
            var response = await global.fetch('/auth/csrf', {
                credentials: 'same-origin',
                cache: 'no-store',
                headers: { 'Accept': 'application/json' },
            });
            if (!response.ok) return null;
            var data = await response.json();
            if (data && data.success && data.token) {
                setCsrfToken(data.token);
                return data.token;
            }
        } catch (e) { /* network failure: caller reports it */ }
        return null;
    }

    async function MSFetch(url, options) {
        options = options || {};
        var method = (options.method || 'GET').toUpperCase();
        var headers = new Headers(options.headers || {});
        if (!headers.has('Accept')) headers.set('Accept', 'application/json');
        if (method !== 'GET' && method !== 'HEAD' && !headers.has('X-CSRFToken')) {
            headers.set('X-CSRFToken', csrfToken());
        }

        var init = Object.assign({}, options, {
            method: method,
            headers: headers,
            credentials: options.credentials || 'same-origin',
        });

        var csrfRetried = false;
        var rateRetried = false;

        while (true) {
            var response;
            try {
                response = await global.fetch(url, init);
            } catch (e) {
                if (e && e.name === 'AbortError') throw e;
                throw makeError('network', 'تعذر الاتصال بالخادم — تحقق من اتصالك ثم أعد المحاولة');
            }

            // Session expired: Flask-Login redirects to /auth/login and fetch
            // follows that redirect, so the status may still look like 200.
            if (response.redirected && isLoginUrl(response.url)) {
                throw makeError('auth', 'انتهت الجلسة، يرجى تسجيل الدخول من جديد', 401);
            }
            if (response.status === 401) {
                throw makeError('auth', 'انتهت الجلسة، يرجى تسجيل الدخول من جديد', 401);
            }

            if (response.status === 400 && !csrfRetried) {
                var body = await peekJson(response);
                if (body && body.error === 'csrf') {
                    csrfRetried = true;
                    if (await refreshCsrf()) {
                        if (method !== 'GET' && method !== 'HEAD') {
                            init.headers.set('X-CSRFToken', csrfToken());
                        }
                        continue;
                    }
                    throw makeError(
                        'csrf',
                        'انتهت صلاحية الصفحة، حدّثها وأعد المحاولة',
                        400
                    );
                }
            }

            // Rate limit. Structured 429s (chat daily limit, push device
            // limit) are business answers and are returned to the caller.
            if (response.status === 429 && !rateRetried) {
                var rateBody = await peekJson(response);
                if (!rateBody || rateBody.error === 'rate_limit') {
                    var wait = retryAfterSeconds(response);
                    if (wait > 0 && wait <= 10) {
                        rateRetried = true;
                        await sleep(wait * 1000);
                        continue;
                    }
                    throw makeError(
                        'rate',
                        wait > 0
                            ? 'طلبات كثيرة، انتظر ' + wait + ' ثانية'
                            : 'طلبات كثيرة، انتظر قليلاً',
                        429,
                        wait
                    );
                }
            }

            return response;
        }
    }

    MSFetch.errorText = function (error, fallback) {
        if (!error) return fallback || '';
        if (error.kind === 'network') {
            return 'تعذر الاتصال بالخادم — تحقق من اتصالك ثم أعد المحاولة';
        }
        if (error.kind === 'rate') {
            return error.retryAfter > 0
                ? 'طلبات كثيرة، انتظر ' + error.retryAfter + ' ثانية'
                : 'طلبات كثيرة، انتظر قليلاً';
        }
        if (error.kind === 'auth') return 'انتهت الجلسة، يرجى تسجيل الدخول من جديد';
        if (error.kind === 'csrf') return 'انتهت صلاحية الصفحة، حدّثها وأعد المحاولة';
        return fallback || (error && error.message) || 'حدث خطأ غير متوقع';
    };
    MSFetch.csrfToken = csrfToken;
    MSFetch.refreshCsrf = refreshCsrf;
    MSFetch.isNetworkError = function (error) {
        return !!error && error.kind === 'network';
    };
    MSFetch.isAuthError = function (error) {
        return !!error && error.kind === 'auth';
    };

    global.MSFetch = MSFetch;
})(window);
