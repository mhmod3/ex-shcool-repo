/* =====================================================
   مدرستي — بوابة الطالب
   النسخة الثابتة: لوحات، عمق من الهاش، حالة محلية،
   وحالات صادقة لكل إجراء لا يعمل دون الخادم الأصلي.
   طبقة حركة «ساعة الدرس» (steer 9f2c1d74): تسلسل فتح
   مرّة واحدة، انتقال اتجاهي بين اللوحات، كسكيد قوائم،
   مؤشرات نشطة منزلاقة، ومساحات حبرية مرّة واحدة.
   transform/opacity فقط، بلا حركة دائمة وبلا اعتماديات.
   ===================================================== */
(function () {
    "use strict";

    function $(sel, ctx) { return (ctx || document).querySelector(sel); }
    function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }

    /* ---------- Motion gate ----------
       Under reduced motion the CSS degrades every spatial move to a
       gentle opacity fade (Motion safety block in css/app.css); the JS
       skips only the purely-spatial layers: View Transitions page
       turns and the two-layer exit. Boot, cascades, sweeps, and entry
       classes still apply — the reduced state stays alive. */

    var reducedMQ = window.matchMedia("(prefers-reduced-motion: reduce)");
    function fullMotion() { return !reducedMQ.matches; }

    /* Page-open sequence ("the lesson clock strikes"): one-shot, gated on
       the data-boot attribute the CSS reads. Runs only on a clean load —
       a deep link or hash skips it so the data comes straight through. */
    function bootSequence() {
        document.documentElement.setAttribute("data-boot", "");
        setTimeout(function () { document.documentElement.removeAttribute("data-boot"); }, 1400);
    }

    /* List cascade: when a panel or subview is shown, its lists enter as
       lists — rows/note/settings/chat/table-rows take .stag with --i set
       per sibling; the panel carries --stag-base. Reruns on every entry. */
    var STAG_SEL = [
        ".classlist .crow", ".periodlist .prow", ".statline > div",
        ".info-list > div", ".setting", ".note", ".msg", ".chat-day",
        ".exam-summary > span", "thead tr", "tbody tr"
    ].join(",");

    function startStagger(panel, baseMs) {
        if (!panel) return;
        var items = $$(STAG_SEL, panel);
        items.forEach(function (el) {
            el.classList.remove("stag");
            el.style.removeProperty("--i");
        });
        void panel.offsetWidth;
        panel.style.setProperty("--stag-base", (baseMs || 40) + "ms");
        items.forEach(function (el, i) {
            el.style.setProperty("--i", String(Math.min(i, 12)));
            el.classList.add("stag");
        });
    }

    /* One-shot sweeps: the amber today column is inked on the first
       display of the weekly view; the upcoming exam row flashes red ink
       on the first display of the exams view. The is-sweep class is
       removed on animationend so the sweep can never run twice. */
    var swept = { weekly: false, exams: false };

    function firstSweep(name) {
        var table;
        if (name === "weekly" && !swept.weekly) {
            table = $(".gridtable");
            if (!table) return;
            swept.weekly = true;
        } else if (name === "exams" && !swept.exams) {
            table = $(".examtable");
            if (!table) return;
            swept.exams = true;
        } else {
            return;
        }
        table.classList.add("is-sweep");
        table.addEventListener("animationend", function () {
            table.classList.remove("is-sweep");
        }, { once: true });
    }

    /* ---------- Toasts ---------- */

    var toasts = $("#toasts");

    function toast(msg) {
        var t = document.createElement("div");
        t.className = "toast";
        var p = document.createElement("p");
        p.textContent = msg;
        var prog = document.createElement("span");
        prog.className = "toast-progress";
        prog.setAttribute("aria-hidden", "true");
        var x = document.createElement("button");
        x.type = "button";
        x.className = "toast-x";
        x.setAttribute("aria-label", "إغلاق");
        var use = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        use.setAttribute("class", "ic");
        use.innerHTML = '<use href="#i-close"></use>';
        x.appendChild(use);
        t.appendChild(p);
        t.appendChild(x);
        t.appendChild(prog);
        toasts.appendChild(t);
        var close = function () {
            t.style.transition = "opacity .2s ease-out";
            t.style.opacity = "0";
            setTimeout(function () { t.remove(); }, 200);
        };
        x.addEventListener("click", close);
        setTimeout(close, 5000);
        while (toasts.children.length > 3) toasts.firstElementChild.remove();
    }

    /* ---------- Static-only actions: honest states, no invented claims ---------- */

    $$("[data-static]").forEach(function (btn) {
        btn.addEventListener("click", function () {
            toast(btn.getAttribute("data-static"));
        });
    });

    $("#logout-link").addEventListener("click", function (e) {
        e.preventDefault();
        toast("النسخة الثابتة لا تُنهِي الجلسة، والخروج يتم عبر الخادم الأصلي لمدرستي.");
    });

    /* ---------- Panel activation (rail, bottom nav, flags, deep links) ---------- */

    var panels = $$(".stage > .panel");
    var railItems = $$(".rail .rail-item");
    var bnItems = $$(".bottomnav .bn-item");
    var swipeOrder = $$(".rail .rail-item").map(function (a) { return a.getAttribute("data-goto"); });

    function syncNav(panelId) {
        railItems.forEach(function (a) {
            var on = a.getAttribute("data-goto") === panelId;
            a.classList.toggle("is-active", on);
            a.setAttribute("aria-current", on ? "page" : "false");
        });
        bnItems.forEach(function (a) {
            var on = a.getAttribute("data-goto") === panelId;
            a.classList.toggle("is-active", on);
            a.setAttribute("aria-current", on ? "page" : "false");
        });
    }

    /* The panel currently on screen, tracked explicitly so direction is
       computed from the true current page even mid-turn (while the
       leaving and arriving panels are briefly both visible). */
    var currentPanelId = "panel-today";
    var exitingPanel = null;
    var currentVT = null;

    /* The leaving page is retired by its own animationend; releaseExit
       is the single place that retires it, and finishExit is the
       fast-forward used when a faster switch interrupts it. */
    function releaseExit(panel) {
        panel.classList.remove("turn-out-fwd", "turn-out-bwd", "enter-fwd", "enter-bwd");
        panel.classList.remove("is-active");
        panel.hidden = true;
        panel.style.position = "";
        panel.style.top = "";
        panel.style.width = "";
        panel.style.insetInlineStart = "";
        if (exitingPanel === panel) exitingPanel = null;
    }

    function finishExit() {
        if (exitingPanel) releaseExit(exitingPanel);
    }

    function setHash(panelId) {
        try { history.replaceState(null, "", "#" + panelId); } catch (e) { /* file:// origins */ }
    }

    /* Directional panel switch (steer 9f2c1d74): forward (in reading
       order) enters from the left, backward from the right — the RTL
       forward-left convention shared with the touch swipe. steer
       b7e2d94a (page-turn): with the View Transitions API the whole
       stage turns directionally — the old page departs toward the side
       it left from while the new page arrives from the opposite side —
       so the panel-level slide is skipped (it would double the motion)
       and only the list cascade runs inside the arriving page.
       data-vt-dir is pinned on <html> for the transition's duration.
       Without the API the two-layer DOM turn runs instead: the leaving
       panel is pinned out of flow and departs on top of the arriving
       one, so every browser shows the same turn. */
    function activatePanel(panelId, sub, dirIn) {
        if (currentPanelId === panelId && !sub) {
            setHash(panelId);
            return;
        }
        var dir = dirIn || (currentPanelId !== panelId
            ? (swipeOrder.indexOf(panelId) > swipeOrder.indexOf(currentPanelId) ? "fwd" : "bwd")
            : null);
        var target = document.getElementById(panelId);
        var old = document.getElementById(currentPanelId);
        var useVT = !!dir && "startViewTransition" in document && fullMotion();
        var twoLayer = !useVT && !!dir && fullMotion() && old && old !== target;
        var apply = function () {
            finishExit();
            if (twoLayer) {
                /* Capture the leaving page's in-flow box, then pin it out
                   of flow so the arriving page flows into its place and
                   the old page departs on top. */
                var top = old.offsetTop;
                var width = old.offsetWidth;
                old.classList.remove("enter-fwd", "enter-bwd");
                old.style.position = "absolute";
                old.style.top = top + "px";
                old.style.insetInlineStart = "0";
                old.style.width = width + "px";
            }
            panels.forEach(function (p) {
                if (twoLayer && p === old) return; // retired by its own animationend
                var on = p.id === panelId;
                p.classList.toggle("is-active", on);
                p.classList.remove("enter-fwd", "enter-bwd");
                p.hidden = !on;
            });
            if (twoLayer) {
                old.classList.add(dir === "fwd" ? "turn-out-fwd" : "turn-out-bwd");
                exitingPanel = old;
                old.addEventListener("animationend", function handler(e) {
                    if (e.target !== old) return; // child cascades bubble; only the panel's own turn retires it
                    old.removeEventListener("animationend", handler);
                    releaseExit(old);
                });
            }
            void target.offsetWidth;
            if (twoLayer) target.classList.add(dir === "fwd" ? "enter-fwd" : "enter-bwd");
            startStagger(target, 40);
            syncNav(panelId);
            setHash(panelId);
            currentPanelId = panelId;
            if (sub) activateSub(sub);
            firstSweep(sub || "weekly");
        };
        if (useVT) {
            document.documentElement.setAttribute("data-vt-dir", dir);
            var vt = document.startViewTransition(apply);
            currentVT = vt;
            /* A faster switch cancels this transition; only the
               latest one may clear the direction pin. */
            vt.finished
                .catch(function () {})
                .then(function () {
                    if (currentVT === vt) document.documentElement.removeAttribute("data-vt-dir");
                });
        } else {
            apply();
        }
    }

    /* ---------- Subtabs (schedule: weekly / exams) ---------- */

    var subtabs = $$(".subtabs .subtab");
    var subviews = $$(".subview");
    var subOrder = ["weekly", "exams"];
    var lastSub = "weekly";

    /* Directional subview switch (steer 9f2c1d74): forward slides in from
       the left in RTL, backward from the right. dirIn lets a caller
       (panel entry with a subtarget) pin the direction explicitly. */
    function activateSub(name, dirIn) {
        var cur = lastSub;
        var dir = (dirIn === "fwd" || dirIn === "bwd")
            ? dirIn
            : (subOrder.indexOf(name) > subOrder.indexOf(cur) ? "fwd"
             : (subOrder.indexOf(name) < subOrder.indexOf(cur) ? "bwd" : null));
        subtabs.forEach(function (s) {
            var on = s.getAttribute("data-subtab") === name;
            s.classList.toggle("is-active", on);
            s.setAttribute("aria-selected", on ? "true" : "false");
            s.tabIndex = on ? 0 : -1;
        });
        subviews.forEach(function (v) {
            var on = v.id === "subview-" + name;
            v.classList.toggle("is-active", on);
            v.classList.remove("sub-fwd", "sub-bwd");
            v.hidden = !on;
        });
        var v = document.getElementById("subview-" + name);
        void v.offsetWidth;
        if (dir && fullMotion()) v.classList.add(dir === "fwd" ? "sub-fwd" : "sub-bwd");
        startStagger(v, 40);
        lastSub = name;
        firstSweep(name);
    }

    subtabs.forEach(function (s) {
        s.addEventListener("click", function () { activateSub(s.getAttribute("data-subtab")); });
    });

    /* ---------- Generic navigation: rail, bottom nav, flags, links ---------- */

    $$(".rail [data-goto], .bottomnav [data-goto]").forEach(function (el) {
        el.addEventListener("click", function () {
            activatePanel(el.getAttribute("data-goto"), el.getAttribute("data-subtab"));
        });
    });

    $$("[data-goto]").forEach(function (el) {
        if (el.closest(".rail, .bottomnav")) return; // already wired above
        var go = function () {
            activatePanel(el.getAttribute("data-goto"), el.getAttribute("data-subtab"));
        };
        el.addEventListener("click", go);
        if (el.getAttribute("role") === "button") {
            el.addEventListener("keydown", function (e) {
                if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); }
            });
        }
    });

    /* ---------- Mobile panel swipes: next/previous with wrap-around ---------- */

    // Sequence = the rail order (اليوم first, الإعدادات last).
    // A right swipe goes to the next panel; a left swipe to the previous.
    // At the ends the sequence wraps: settings + right → today, today + left → settings.
    // (swipeOrder is declared with the panel section above.)
    var SWIPE_MIN = 48; // px of horizontal travel before a swipe counts

    function inHScroller(el) {
        // A horizontal scroller (the weekly grid) owns its own swipe.
        while (el && el !== document.body) {
            if (el.scrollWidth > el.clientWidth + 2) return true;
            el = el.parentElement;
        }
        return false;
    }

    if ("ontouchstart" in window) {
        var swipeX = null, swipeY = null;
        $(".stage").addEventListener("touchstart", function (e) {
            var t = e.touches[0];
            swipeX = t.clientX;
            swipeY = t.clientY;
        }, { passive: true });
        $(".stage").addEventListener("touchend", function (e) {
            if (swipeX === null) return;
            var t = e.changedTouches[0];
            var dx = t.clientX - swipeX;
            var dy = t.clientY - swipeY;
            swipeX = swipeY = null;
            if (window.matchMedia("(min-width: 1024px)").matches) return; // desktop navigates by rail
            if (Math.abs(dx) < SWIPE_MIN || Math.abs(dx) <= Math.abs(dy)) return;
            if (inHScroller(e.target)) return;
            var idx = swipeOrder.indexOf(currentPanelId);
            if (idx === -1) return;
            var step = dx > 0 ? 1 : -1;
            var nextId = swipeOrder[(idx + step + swipeOrder.length) % swipeOrder.length];
            // The direction follows the touch step, so wrap-around keeps the
            // geometric side; activatePanel carries the list cascade and the
            // directional page-turn transition (steer b7e2d94a).
            activatePanel(nextId, null, step > 0 ? "fwd" : "bwd");
        }, { passive: true });
    }

    /* ---------- Keyboard: roving tabindex, RTL-aware ---------- */

    function initTabKeyboard(listEl, listTabs, activate) {
        if (!listEl) return;
        listEl.addEventListener("keydown", function (e) {
            if (["ArrowLeft", "ArrowRight", "Home", "End"].indexOf(e.key) === -1) return;
            var current = listTabs.indexOf(e.target);
            if (current === -1) return;
            e.preventDefault();
            var next;
            if (e.key === "Home") next = 0;
            else if (e.key === "End") next = listTabs.length - 1;
            else {
                var step = e.key === "ArrowRight" ? 1 : -1;
                // RTL: the next tab sits to the left.
                var rtl = document.documentElement.getAttribute("dir") === "rtl";
                next = current + (rtl ? -step : step);
            }
            if (next < 0 || next >= listTabs.length) return;
            listTabs[next].focus();
            activate(listTabs[next]);
        });
    }

    initTabKeyboard($(".subtabs"), subtabs, function (t) { activateSub(t.getAttribute("data-subtab")); });

    /* ---------- Unread state: local, honest ---------- */

    $("#mark-all-read").addEventListener("click", function () {
        $$(".note.is-unread").forEach(function (n) { n.classList.remove("is-unread"); });
        $$("[data-unread-count]").forEach(function (c) {
            c.textContent = "";
            c.style.display = "none";
        });
        toast("تم تحديد كل الإشعارات كمقروءة، وحالة القراءة محلية في هذه النسخة الثابتة.");
    });

    /* ---------- Deep links ---------- */

    function fromHash() {
        var id = location.hash.substring(1);
        var panel = document.getElementById(id);
        if (panel && panels.indexOf(panel) !== -1) activatePanel(id);
    }

    window.addEventListener("hashchange", fromHash);

    var params = new URLSearchParams(location.search);
    if (params.get("exams") === "1") {
        activatePanel("panel-schedule", "exams");
    } else if (location.hash) {
        fromHash();
    } else {
        /* Clean load: the one-shot open sequence runs, and the today
           panel's lists cascade after it (base 500ms). */
        bootSequence();
        syncNav("panel-today");
        startStagger(document.getElementById("panel-today"), 500);
    }

    /* ---------- Lightbox with focus containment ---------- */

    var lb = $("#lightbox");
    var lbImg = $("#lightbox-img");
    var lbReturn = null;

    function openLightbox(src) {
        lbImg.src = src;
        lbReturn = document.activeElement;
        lb.hidden = false;
        document.body.style.overflow = "hidden";
        lb.focus();
    }

    function closeLightbox() {
        if (lb.hidden) return;
        lb.hidden = true;
        document.body.style.overflow = "";
        if (lbReturn && lbReturn.focus) lbReturn.focus();
        lbReturn = null;
    }

    $$(".msg-img").forEach(function (img) {
        img.addEventListener("click", function () { openLightbox(img.src); });
    });

    $("#lightbox-close").addEventListener("click", closeLightbox);
    lb.addEventListener("click", function (e) { if (e.target === lb) closeLightbox(); });
    document.addEventListener("keydown", function (e) {
        if (e.key === "Escape") closeLightbox();
    });

    lb.addEventListener("keydown", function (e) {
        if (e.key !== "Tab") return;
        var focusables = $$("#lightbox-close").filter(function (el) { return el.offsetParent !== null; });
        if (!focusables.length) return;
        var first = focusables[0], last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
})();
