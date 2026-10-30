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

    /* One-shot sweeps: the amber next-study-day column is inked on the
       first display of the weekly view; the upcoming exam row flashes
       red ink on the first display of the exams view. The is-sweep class
       is removed on animationend so the sweep can never run twice. */
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

    /* ---------- Date-aware views: one load-time pass against the real clock ----------
       The weekly grid is the single source of truth for the day's
       lessons, the exam table for exam dates. This pass reads both and
       aligns every date-bound view: the day head (number + weekday —
       the real day), the amber next-study-day column and its class
       list (tomorrow; Sunday straight after a weekend), exam row
       states (past / next), the summary chips, the exam line, and the
       attention flag — with relative labels (اليوم / غدًا / بعد غد /
       بعد N أيام) instead of fixture copy. Dated records (absence log,
       chat days, pinned note) stay history; only day-relative claims
       are re-derived. Runs once at load, before the boot sequence and
       deep-link handling. */

    var pad2 = function (n) { return (n < 10 ? "0" : "") + n; };
    var AR_DAYS = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

    function relLabel(diff) {
        if (diff === 0) return "اليوم";
        if (diff === 1) return "غدًا";
        if (diff === 2) return "بعد غد";
        if (diff < 7) return "بعد " + diff + " أيام";
        return null; // beyond a week: the date speaks for itself
    }

    function alignToToday() {
        var now = new Date();
        var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        var day = now.getDay(); // 0 = الأحد … 6 = السبت; the grid carries 0..4
        /* The portal reads the next study day, not the one in progress:
           tomorrow on Sat–Thu, Sunday straight after Fri/Sat. Always a
           grid column (0..4). The day head above keeps the real day. */
        var focus = (day + 1) % 7;
        if (focus === 5 || focus === 6) focus = 0;
        var grid = $(".gridtable");

        /* The big date + weekday (the real day) */
        var num = $(".dayhead .date-num");
        var meta = $(".dayhead .date-meta");
        if (num) num.textContent = today.getDate() + "/" + pad2(today.getMonth() + 1);
        if (meta) meta.textContent = AR_DAYS[day];

        /* Amber next-study-day column (also the first-display sweep target) */
        if (grid) {
            $$(".is-next", grid).forEach(function (el) { el.classList.remove("is-next"); });
            var head = $("thead th:nth-child(" + (focus + 2) + ")", grid);
            if (head) head.classList.add("is-next");
            $$("tbody tr", grid).forEach(function (tr) {
                if (tr.cells[focus + 1]) tr.cells[focus + 1].classList.add("is-next");
            });
        }

        /* Next-study-day class list, rebuilt from the grid's focus column */
        var list = $(".classlist");
        if (list && grid) {
            var html = "";
            var no = 0;
            $$("tbody tr", grid).forEach(function (tr) {
                var td = tr.cells[focus + 1];
                if (!td) return;
                var s = td.querySelector("strong");
                if (!s) return;
                no += 1;
                var t = td.querySelector("small");
                var time = tr.cells[0] ? tr.cells[0].querySelector("small") : null;
                html += '<div class="crow"><span class="c-no">' + no + "</span>" +
                    '<span class="c-subject">' + s.textContent + "</span>" +
                    '<span class="c-teacher">' + (t ? t.textContent : "") + "</span>" +
                    '<span class="c-time" dir="ltr">' + (time ? time.textContent : "") + "</span></div>";
            });
            list.innerHTML = html !== ""
                ? html
                : '<div class="empty"><p>لا دروس</p><p class="empty-sub">لا دروس يوم ' + AR_DAYS[focus] + " في الجدول الأسبوعي.</p></div>";
        }
        /* The list's head names the focus day: الغد whenever it is literally
           tomorrow (Sat–Thu and Saturday, whose tomorrow is Sunday), الأحد
           when Friday skips the weekend. */
        var listHead = $("#panel-today h2");
        if (listHead) listHead.textContent = focus === (day + 1) % 7 ? "دروس الغد" : "دروس الأحد";

        /* Exam rows: past attenuated, the next upcoming red-tinted */
        function examDate(cell) {
            var host = cell.querySelector("span[dir=ltr]") || cell;
            var m = host.textContent.trim().match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
            if (!m) return null;
            return new Date(+m[3], +m[2] - 1, +m[1]);
        }
        var exams = $$(".examtable tbody tr").map(function (tr) {
            var date = examDate(tr.cells[1]);
            if (!date) return null;
            return { tr: tr, date: date, diff: Math.round((date - today) / 86400000) };
        }).filter(Boolean);
        exams.sort(function (a, b) { return a.date - b.date; });
        var next = null;
        exams.forEach(function (e) { if (!next && e.diff >= 0) next = e; });

        exams.forEach(function (e) {
            var cell = e.tr.cells[2];
            var chip = cell.querySelector(".chip");
            if (!chip) {
                chip = document.createElement("span");
                chip.className = "chip";
                cell.appendChild(chip);
            }
            if (e.diff < 0) {
                chip.textContent = "منقضي";
                chip.className = "chip chip-muted";
                e.tr.classList.remove("is-upcoming");
                e.tr.classList.add("is-past");
            } else if (e === next) {
                chip.textContent = relLabel(e.diff) || (e.date.getDate() + "/" + pad2(e.date.getMonth() + 1));
                chip.className = "chip chip-red";
                e.tr.classList.remove("is-past");
                e.tr.classList.add("is-upcoming");
            } else {
                chip.textContent = "قادم";
                chip.className = "chip";
                e.tr.classList.remove("is-upcoming", "is-past");
            }
        });

        /* Summary chips: subject count + the closest exam */
        var chips = $$(".exam-summary .chip");
        if (chips[0]) chips[0].textContent = "المواد: " + exams.length;
        if (chips[1]) {
            if (next) {
                var nsub = next.tr.cells[0].textContent.trim();
                chips[1].textContent = (relLabel(next.diff) || "القادم") + ": " + nsub + " · " +
                    next.date.getDate() + "/" + pad2(next.date.getMonth() + 1);
                chips[1].className = "chip chip-red";
            } else {
                chips[1].textContent = "لا امتحانات قادمة";
                chips[1].className = "chip chip-muted";
            }
        }

        /* Today's attention line (the next exam, relative) */
        var line = $(".examline");
        if (line) {
            var lc = line.querySelector(".chip");
            var lt = line.querySelector(".examline-text");
            if (next) {
                if (lc) {
                    lc.textContent = relLabel(next.diff) || "قادم";
                    lc.className = "chip chip-red";
                }
                if (lt) lt.textContent = next.tr.cells[0].textContent.trim() + " · " +
                    AR_DAYS[next.date.getDay()] + " " + next.date.getDate() + "/" + pad2(next.date.getMonth() + 1);
            } else {
                if (lc) { lc.textContent = "لا امتحانات"; lc.className = "chip chip-muted"; }
                if (lt) lt.textContent = "لا امتحانات قادمة في هذا الجدول.";
            }
        }

        /* Attention flag under the day head */
        var flag = $(".ruler-flag");
        if (flag) {
            if (next) {
                var fsub = next.tr.cells[0].textContent.trim();
                var rel = relLabel(next.diff);
                var dsl = next.date.getDate() + "/" + pad2(next.date.getMonth() + 1);
                var ft = $(".ruler-flag-text", flag);
                var fd = $(".ruler-flag-date", flag);
                if (ft) ft.textContent = rel ? rel + " · امتحان " + fsub : "امتحان " + fsub + " · " + dsl;
                if (fd) fd.textContent = dsl;
                flag.setAttribute("aria-label", (rel ? rel + " " : "") + "امتحان " + fsub + " " + dsl);
            } else {
                flag.hidden = true;
            }
        }
    }

    alignToToday();

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

    var panels = $$(".panel");
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

    var currentPanelId = "panel-today";
    var currentVT = null;

    function setHash(panelId) {
        try { history.replaceState(null, "", "#" + panelId); } catch (e) { /* file:// origins */ }
    }

    /* Authored directional panel switch across phone and desktop:
       Target panel enters with hardware-accelerated 3D slide + soft opacity reveal.
       RTL forward (swiping right or clicking subsequent tabs) arrives from the left.
       RTL backward arrives from the right. Zero ghosting, zero empty frames. */
    function activatePanel(panelId, sub, dirIn) {
        if (currentPanelId === panelId && !sub) {
            setHash(panelId);
            return;
        }
        var dir = dirIn || (currentPanelId !== panelId
            ? (swipeOrder.indexOf(panelId) > swipeOrder.indexOf(currentPanelId) ? "fwd" : "bwd")
            : null);
        var target = document.getElementById(panelId);
        var acadHeader = $("#academic-header");
        var isAcademic = (panelId !== "panel-chat" && panelId !== "panel-settings");
        var isMobile = window.matchMedia("(max-width: 1023px)").matches;

        if (acadHeader) {
            acadHeader.hidden = !isAcademic;
        }

        panels.forEach(function (p) {
            var on = p.id === panelId;
            p.classList.toggle("is-active", on);
            p.classList.remove("enter-fwd", "enter-bwd", "panel-fade-in");
            p.hidden = !on;
        });

        if (target && fullMotion()) {
            void target.offsetWidth;
            if (dir) {
                target.classList.add(dir === "fwd" ? "enter-fwd" : "enter-bwd");
            } else {
                target.classList.add("panel-fade-in");
            }
            target.addEventListener("animationend", function handler(e) {
                if (e.target !== target) return;
                target.removeEventListener("animationend", handler);
                target.classList.remove("enter-fwd", "enter-bwd", "panel-fade-in");
            });
        }

        syncNav(panelId);
        setHash(panelId);
        currentPanelId = panelId;
        if (isMobile) {
            window.scrollTo(0, 0);
        }
        if (sub) activateSub(sub);
        firstSweep(sub || "weekly");
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
        if (v && fullMotion()) {
            v.classList.remove("sub-fwd", "sub-bwd");
            void v.offsetWidth;
            if (dir) v.classList.add(dir === "fwd" ? "sub-fwd" : "sub-bwd");
            v.addEventListener("animationend", function handler(e) {
                if (e.target !== v) return;
                v.removeEventListener("animationend", handler);
                v.classList.remove("sub-fwd", "sub-bwd");
            });
        }
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
