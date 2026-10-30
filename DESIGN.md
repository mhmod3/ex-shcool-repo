---
name: مدرستي — بوابة الطالب (ساعة الدرس)
description: "The day read on the head and the exam flag: ink ground, amber now, honest static."
colors:
  ink: "#0D1420"
  ink-2: "#121E30"
  ink-3: "#1A2941"
  hair: "#24344E"
  hair-soft: "#1B2A40"
  paper: "#E8EDF4"
  paper-dim: "#C3CCDA"
  muted: "#8A94A6"
  faint: "#7C8798"
  amber: "#F5B83D"
  amber-tint: "rgba(245, 184, 61, 0.12)"
  red: "#C23030"
  red-tint: "#2A1316"
  red-text: "#E8988E"
  green: "#4CC48F"
  green-dot: "#2E9E6B"
  green-tint: "#12291F"
typography:
  display:
    fontFamily: "'Cairo', 'Almarai', sans-serif"
    fontSize: "84px"
    fontWeight: 900
    lineHeight: 0.95
    letterSpacing: "-0.02em"
    fontFeature: "tnum"
  headline:
    fontFamily: "'Cairo', 'Almarai', sans-serif"
    fontSize: "22px"
    fontWeight: 700
  title:
    fontFamily: "'Cairo', 'Almarai', sans-serif"
    fontSize: "17px"
    fontWeight: 700
  body:
    fontFamily: "'Almarai', sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "'Almarai', sans-serif"
    fontSize: "13px"
    fontWeight: 700
rounded:
  sm: "6px"
  md: "10px"
  pill: "999px"
  circle: "50%"
spacing:
  sp-1: "4px"
  sp-2: "8px"
  sp-3: "12px"
  sp-4: "16px"
  sp-5: "20px"
  sp-6: "28px"
  sp-7: "40px"
components:
  button-primary:
    backgroundColor: "{colors.amber}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: "9px 16px"
  button-primary-hover:
    backgroundColor: "#FFC95E"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "9px 16px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.paper}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: "9px 16px"
  chip:
    backgroundColor: "{colors.ink-2}"
    textColor: "{colors.paper-dim}"
    rounded: "{rounded.pill}"
    padding: "3px 11px"
    typography: "{typography.label}"
  chip-red:
    backgroundColor: "{colors.red}"
    textColor: "{colors.paper}"
    rounded: "{rounded.pill}"
    padding: "3px 11px"
  chip-green:
    backgroundColor: "{colors.green-dot}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "3px 11px"
  rail-item-active:
    backgroundColor: "{colors.ink-3}"
    textColor: "{colors.paper}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: "10px 12px"
---

# Design System: ساعة الدرس — بوابة الطالب

## Overview

**Creative North Star: «ساعة الدرس» (The Lesson Clock)** — the day read in one second. The page rejects the category's default card-grid staging and owns one idea: the centered day head (the big date, weekday stacked beneath) names the day, and what matters (the exam) is a flag, not a card. The current-period state is no longer displayed anywhere: the period ruler, the now-line, and the class list's state column were each removed by decision (`a8680017`, `fac942f2`, `a7068299`).

Personality: an ink-ground operate tool. Dense but calm — one screen-height of primary content, 1px hairline lists, wide unprinted margins. One live colour (amber) and two attention colours (red, green), each with a single job. The snapshot is fully static: every server-dependent action carries an honest local state (disabled affordance + toast), never a fabricated success.

**Key Characteristics:**
- Ink ground (#0D1420) with tonal layering (#121E30 / #1A2941); depth from 1px hairlines, not shadows or stacked cards.
- Amber (#F5B83D) appears only in now/live states; red family only in exam/absence attention; green only in completion/presence.
- Cairo (700/900) owns display numerals and heads; Almarai (400/700) owns UI; all numerals tabular.
- No emoji: a 14-symbol, one-weight stroke SVG set (1.6px stroke, round caps/joins, 24 grid, 20px default).
- RTL is the architecture, not a skin: grid placement, logical properties, arrow semantics, caret and selection all ship RTL.

## Colors

A night-desk palette: blue-black inks for ground and tone, cool papers for type, and three functional hues whose rarity is the point. Values are the `:root` tokens in `css/app.css`; the front matter is normative.

### Primary (the one live colour)
- **Live Amber** (`#F5B83D`): now/live only — the today column of the weekly grid (tint + header), the active rail/bottom-nav icon, the "عرض الجدول" link button, and all focus rings. Its tint `rgba(245, 184, 61, 0.12)` tints the today column of the weekly grid.
- **Amber Hover** (`#FFC95E`): primary button hover only.

### Secondary (attention)
- **Exam Red** (`#C23030`): exam/absence attention only — the unread-count badge, red chips ("بعد غد", "جديد", absence chips), the absence statline dot, and the exam flag border family.
- **Red Tint** (`#2A1316`): background for the exam flag and upcoming exam table rows.
- **Red Text** (`#E8988E`): the readable red-on-ink voice — flag icon, flag date, absence state words ("غائب"), and the top-bar logout link (live `328f26d0`).

### Tertiary (completion)
- **Completion Green** (`#4CC48F`): completion/presence — the palette's completion voice; no live reference in the shipped CSS since the today-absence check was removed (live `1fcd5471`) — do not assume it is live.
- **Green Dot** (`#2E9E6B`): the green chip base. The green chip uses this darker green (not #4CC48F) so ink-on-green text keeps its contrast — the ink-on-green fix.
- **Green Tint** (`#12291F`): declared in `:root` for completion tinting; no reference in the shipped CSS yet — do not assume it is live.

### Neutral
- **Ink** (`#0D1420`): ground of html/body, top bar, PWA `background_color`/`theme_color`, amber text's ink counterpart.
- **Ink-2** (`#121E30`): the raised surface — chat bubbles/day separators, chips, hover fills.
- **Ink-3** (`#1A2941`): the active surface — active rail item, active tab, sent chat message, toasts, disabled buttons.
- **Hair** (`#24344E`): 1px structural lines — top bar edge, rail edge, container borders, primary row dividers, scrollbars.
- **Hair-Soft** (`#1B2A40`): 1px quiet lines — list row dividers, segment borders, secondary borders.
- **Paper** (`#E8EDF4`): primary text.
- **Paper-Dim** (`#C3CCDA`): secondary text, chip text, table cells.
- **Muted** (`#8A94A6`): labels, metadata, idle text, borders-as-text substitute.
- **Faint** (`#7C8798`): tertiary text (disabled buttons, message timestamps, empty-state icon, placeholders). Raised to this value so tertiary text clears 4.5:1 on ink.

### Named Rules
**The Now-Amber Rule.** Amber means "now / live" and nothing else; if it is not the present moment, it is not amber. **The Attention-Red Rule.** Red (family: #C23030, #2A1316, #E8988E) marks exam/absence attention only — with one sanctioned exception: the top-bar logout link speaks in red-text (#E8988E), because a session end is the user's own action, not content attention (live `328f26d0`). **The One Hairline Rule.** Surfaces are separated by 1px hairlines (#24344E / #1B2A40) and tonal steps (ink → ink-2 → ink-3), never by shadow, never by card-on-card.

## Typography

**Display Font:** Cairo (weights 900/700), fallback stack `'Cairo', 'Almarai', sans-serif`.
**Body Font:** Almarai (weights 400/700), fallback `'Almarai', sans-serif`.
Loaded via Google Fonts CDN with preconnect (`Almarai:wght@400;700 & Cairo:wght@700;900`, `display=swap`) — the project convention; no local font files.

**Character:** Cairo is the instrument face — numerals, dates, period numbers, and heads; Almarai is the work face — rows, lists, buttons, chat. Bold (700) carries all emphasis; 400 is the only quiet weight.

### Hierarchy
- **Display** (Cairo 900, 84px/0.95, letter-spacing −0.02em, tabular-nums): the day numeral in the day head; 62px at ≤1023px.
- **Headline** (Cairo 700, 22px): panel `h2`, 28px top margin / 12px bottom.
- **Title** (Cairo 700, 17px): panel `h3`, 24px / 10px margins.
- **Body** (Almarai 400, 15px/1.6): page base; note bodies 14px/1.8 capped at 68ch; list rows 14–15px.
- **Label** (Almarai 700, 13px): buttons, chips, badges, tab/subtab labels; small metadata 11–12px; tabular-nums everywhere numerals appear.

### Named Rules
**The Tabular Rule.** Every numeral that can align — dates, times, period numbers, counts, scores, statline values — carries `font-variant-numeric: tabular-nums`; LTR time ranges are isolated with `dir="ltr"`.

## Layout

RTL shell: a sticky 52px top bar (brand right, user left), then a two-column grid `232px minmax(0, 1fr)` — in RTL, column 1 is the right column, so the rail is pinned `grid-column: 1; grid-row: 1` (right) and the stage `grid-column: 2; grid-row: 1` (left) explicitly (sparse auto-placement would stack them). Content (day head, exam flag, panels) is capped at 960px.

- **Desktop ≥1024px:** right rail (232px, sticky at `top: 52px`, `border-inline-end` hair, full-bleed min-height), stage padding `20px 28px 40px`.
- **Mobile ≤1023px:** single column; rail `display: none`; a floating capsule dock takes over — a content-width pill (`width: fit-content`, capped at `min(98vw, 620px)`; the cap widened from 92vw in steer `capsule-smart`) centered with `margin-inline: auto` and floating `16px` off the bottom edge (`calc(16px + env(safe-area-inset-bottom, 0px))`): ink-2 fill + 1px hair border, no shadow (elevation declared once: the border); 7 items as content-width pill buttons (`flex: 0 0 auto`, full labels, no ellipsis) on smart density (steer `capsule-smart`): label `clamp(8px, 2.2vw + 1px, 11px)`, icon `clamp(16px, 5.2vw, 20px)`, side padding `clamp(4px, 1.4vw, 11px)`, min-width `clamp(38px, 11vw, 48px)`, row gap `clamp(2px, 0.5vw, 4px)`, capsule padding `clamp(4px, 1vw, 6px)` — every measure scales with the viewport so all seven full names hold in a single row from 320px up (at 320: 8px labels, 288px dock; stock 11px/48px from ≈455px up); hover and active as ink-3 pills; toasts raised to `bottom: 84px`; stage padding `16px 16px 110px`; day numeral drops to 62px.
- **Compact ≤559px:** the exam flag tightens to 12px / 8px 12px; class rows reflow from five narrow columns to a two-row grid (`24px / minmax(0,1fr) / auto`, subject+no+time row 1, teacher+state row 2, explicit `grid-row` placement); absence rows drop the teacher column; the top bar keeps only the user role.
- **Tablet portrait 768–1023px (steer adapt):** the band stops inheriting the phone layout wholesale — one-thumb usage: the capsule dock clusters in the middle (`flex: 0 0 auto`, `min-width: 72px`, 22px icons, 12px labels, 8px/6px padding) so the outer items sit in thumb reach; day numeral steps to 72px; toasts rise to `bottom: 96px` above the taller bar.
- **Phone landscape, height ≤480px (steer adapt):** the stacked day head folds into one line — `.dayhead-date` becomes `row / baseline` with the numeral at 44px beside the 14px weekday; stage padding `12px 24px 72px`, flag `margin-bottom: 10px`, section heads tighten to `16px 0 10px` (first at 4px top), toasts `bottom: 72px`, the capsule dock tightens (4px padding, `12px` bottom lift, 44px items, 18px icons, 10px labels) — the class list reaches the first 390px viewport instead of the head spending it.
- **Wide desktop ≥1440px (steer adapt):** the content cluster (day head, exam flag, panels) centers in the stage (`margin-inline: auto` on the 960-capped elements) so the unprinted margin becomes symmetric instead of dead ground on the far side; stage padding `24px 40px 48px`. At ≥1700px the cap widens to 1120px.
- **PWA safe areas (steer adapt):** the top bar grows with `env(safe-area-inset-top)` (height `calc(52px + …)`), and its inline paddings, the bottom nav's side paddings, and the rail's sticky offset use physical `env(safe-area-inset-*)` values — physical, because a landscape notch sits on the notch side regardless of RTL direction; the skip link docks at the inset on focus. In normal browser context every inset resolves to 0 and the layout is unchanged.
- **Verification criteria:** 390px, 768px (tablet), 844×390 (landscape), 1440px and 1920px are the measurement standards. 390/320 verified through CDP device-metrics overrides (plain `--window-size` shots clamp below 504px and mis-scroll RTL documents — unreliable); 768–1920 verified with headless screenshots; the user re-verified all sizes manually.

**Spacing rhythm:** 4px base grid — tokens sp-1…sp-7 = 4 / 8 / 12 / 16 / 20 / 28 / 40px. List rows carry 9–11px vertical padding; sections open at 18–28px.

## Elevation & Depth

Flat-by-default, hairline-lit. Depth is the tonal step (ink → ink-2 → ink-3) plus one 1px line: structural edges use `hair` (#24344E), row dividers and quiet borders use `hair-soft` (#1B2A40). No card-on-card: a bordered container (exam line, day block, settings) sits directly on the ground; the chat frame is borderless since live `1ae2e14e` (its bubbles and capsule carry the structure); nested content is fill-surface (ink-2/ink-3), not a second border layer.

### Shadow Vocabulary
- **Toast shadow** (`box-shadow: 0 8px 24px rgba(4, 8, 14, 0.45)` on `.toast`, ink-3 fill + 1px hair border): the only shadow in the system — a detached overlay is the only thing that may lift.

**The Flat-By-Default Rule.** Resting surfaces carry no shadow; the one shadow belongs to the one transient object (the toast).

## Shapes

Corners are restrained: **soft-small** (6px, `--r-sm`) for interactive elements — exam flag, rail items, buttons; **soft-medium** (10px, `--r-md`) for containers — exam line, notes, day blocks, settings, empty state; chat bubbles take a uniform 12px (live `1ae2e14e`) and chat media 10px; **pill** (999px) for chips, badges, day separators, and the chat composer capsule; **circle** (50%) for the 8px status dots, the chat attach/send buttons, and the 44px lightbox close. The exam flag and toasts take `--r-sm` / `--r-md`; the skip link takes a deliberate asymmetric `0 0 8px 8px` (it docks from the top edge). Borders are always 1px; the dashed variant appears exactly once, on the empty state.

## Components

### Buttons
- **Shape:** 6px radius, `9px 16px` padding, Almarai 700 13px, 8px icon gap (icon 17px).
- **Primary:** amber fill, 1px amber border, ink text; hover `#FFC95E`.
- **Ghost:** transparent, 1px hair border, paper text; hover ink-3 fill.
- **Disabled / static-only:** ink-3 fill, hair-soft border, faint text, `cursor: not-allowed` — used whenever the action needs the original server (chat send, attach, Web Push enable, Telegram unlink); the click either does nothing (truly disabled) or fires its `data-static` toast.
- **Chat capsule buttons (live `1ae2e14e`):** circular attach (34px, ink-3 fill) and send (36px, ink-3 + hair-soft border) inside the capsule composer; the send button is icon-only — its "إرسال" word was removed, and the square `.btn-icon` treatment it replaced was deleted from the stylesheet. Both stay visually disabled (static snapshot), and the attach icon (`#i-image`) was redrawn with a softer 2.5px-corner frame.
- **Link button:** the underlined amber text link (13px 700, underline-offset 4px, hover thickens to 2px) — the exam line's "عرض الجدول".

### Chips
Pill (999px), 12px 700, `3px 11px`; small variant 11px / `2px 9px`.
- **Base:** ink-2 fill, 1px hair border, paper-dim text (totals, "نسخة ثابتة").
- **Red:** #C23030 fill/border, paper text — exams, "جديد", absence states.
- **Amber:** removed (live `fabbc523`) — the "الآن" chip was the last amber chip; the today column of the weekly grid carries the amber now-state instead.
- **Green:** #2E9E6B fill, **ink** text — the ink-on-green contrast fix: the darker green-dot value is the chip base so ink text passes where #4CC48F would not.
- **Muted:** transparent, muted text — inactive channel state ("لم تفعّل").

### Tabs & Navigation
Panel switchers: the desktop rail and the mobile bottom nav. The former primary APG tab strip across the stage was removed (live acceptance `fc12fe35`); panels are plain sections and switching is carried by the rail (14px items on 10px/12px padding, active = ink-3 + paper + 700 + amber icon, `aria-current="page"`) and the bottom nav — a floating capsule dock on phones: a content-width ink-2 pill with a 1px hair border and no shadow, items as 48px pill buttons (11px labels, 20px icons), the active item an ink-3 pill (red unread pill, same `aria-current` sync). Subtabs (weekly / exams) are bordered buttons — 1px hair-soft stroke, 6px radius, `8px 15px` padding, 13px 700 — active = ink-3 fill + hair border.

### Rows & Lists
Class rows: 4-column grid (`34px / 1.1fr / 0.9fr / auto`), baseline-aligned, 11px vertical padding, 1px hair-soft dividers; no state column and no per-row "now" cue (removed in `a7068299`). Absence rows: 6-column grid, 13px, red-text state words. Weekly grid: min-width 640px in an overflow-x wrapper, 9px cell padding, hair-soft row dividers, hair thead divider; **the next study day's column** (`is-next`, set by the date pass) takes the amber tint with amber 700 header. Exam table: 300px min-width, right-aligned, 11px/12px cells; upcoming rows take the red tint. Statline: definition list of `min-width: 90px` columns — label 12px muted over Cairo 700 20px value with an 8px status dot. Info list and note meta use the same hair-soft divider language.

### Empty State
Centered, 56px/16px padding, 1px **dashed** hair border, 10px radius: a 42px stroke icon in faint at 60% opacity, paper 700 16px title, muted 13px sub-line. One per panel maximum (grades).

### Toasts
Fixed bottom-end (16px/24px inset; 84px bottom on mobile), max-width `min(340px, 100vw − 32px)`, ink-3 fill, 1px hair border, 10px radius, `12px 14px` padding, the system's one shadow; 13px paper-dim copy, 15px close icon; enters over 0.2s (translateY 8px), auto-dismisses at 5s with a 0.2s opacity fade; max 3 stacked. `aria-live="polite"`.

### Lightbox
Fixed full-viewport center grid, image capped at 92% width / 82vh height, 0.92 rgba(4,8,14) scrim, 44px circular close (ink-2, hair border, ink-3 hover). Chat images open it; focus is trapped (Tab loops the close button), Escape closes, focus returns to the trigger, body scroll locks.

### Signature: The Exam Flag
The move that owns the first viewport after the period-ruler band was removed (live acceptance `a8680017`). The centered, stacked day head names the day (number, weekday beneath); the **exam flag** tells what matters — a compact marker start-anchored under the head (`width: fit-content`, `margin-inline-end: auto` in RTL; the width knob was accepted at "fit"): red-tint fill, 1px `rgba(194,48,48,0.55)` border, 6px radius, flag icon in red-text, 13px 700 copy, and the exam date left-anchored in red-text tabular 12px; hover deepens to #34181C. It is the primary action into the exam view (`data-goto` → schedule → exams subtab, Enter/Space activatable) — the exam's hook is a flag, not a hero button.

The six period boxes (number, time, subject, done/now/next/idle states, the `segpulse` breath) are gone; the class list's state column and its amber now-row were removed afterwards (`a7068299`), and the weekly grid's amber "الآن" chip was removed with `fabbc523` — the amber now-state on the page is the today column of the weekly grid (tint + header), not a word.

## Motion

The «ساعة الدرس» language (steer `9f2c1d74`, motion-signature): one authored open sequence, directional continuity between views, list cascades, and bounded one-shot sweeps — plus the crafted page turn (steer `b7e2d94a`). Transform/opacity only, no perpetual motion, no dependencies (the View Transitions API is native).

- **Open sequence** (one-shot, ~0.9s, clean loads only): the top bar settles, the day number lands with a confident deceleration (`cubic-bezier(0.16,1,0.3,1)`), the weekday rises, the exam flag unfurls from its pole via clip-path, the bottom nav slides up on phones, and the today lists cascade after it. Gated on `data-boot` set by `js/app.js` — without JS the page is static; a deep link skips it.
- **Page turn** (steer `b7e2d94a`): every panel switch — desktop rail, phone bottom-nav tap, or touch swipe — turns the stage region directionally. With the View Transitions API the whole stage turns: the old page departs toward the side it left from (0.3s, ease-in) while the new page arrives from the opposite side (0.38s, `--ease-out`). Forward (in reading order) = the new page comes from the left in RTL; backward = from the right. Slide distance 48px desktop / 32px phone (`--vt-slide`). `data-vt-dir` is pinned on `<html>` for the transition; the panel-level entry classes are skipped while the stage carries the direction so the motion never doubles. **Without the API a two-layer DOM turn runs instead:** the leaving panel is pinned out of flow (`position:absolute` at its in-flow box, `.stage` is `position:relative`) and departs on top of the arriving one (`turn-out-fwd` / `turn-out-bwd`, 0.3s ease-in; `enter-fwd` / `enter-bwd`, 0.38s `--ease-out`), so every browser shows the same turn.
- **Subview entry** (`sub-fwd` / `sub-bwd`, 0.22s / 16px): the weekly/exams subtabs slide in from the side they came from.
- **List cascade**: lists enter as lists when a panel or subview is shown — rows, notes, chat messages, table rows, settings rows; opacity + 6px rise, 24ms per sibling (table rows opacity-only), capped at 12 siblings, `--i` / `--stag-base` set by JS. Reruns on every entry.
- **Sliding active indicators**: a 2px amber bar at the rail item's inline-end edge (scaleY 0.25→1) and a 2px amber line under the bottom-nav label word, word-width (scaleX, bnlabel pass) — the now-state carries its own mark.
- **One-shot sweeps**: first display of the weekly view inks the amber next-study-day column (`is-next`, transparent → amber-tint, 0.6s); first display of the exams view flashes the upcoming exam row strong red ink → red tint (0.5s). `is-sweep`, removed on `animationend`.
- **Feedback**: press scale on buttons (0.97), flag (0.99), rail items (0.985), bottom-nav items (0.96); toast entry 0.2s + a 2px amber progress hairline that consumes over the 5s life (the "now" reading); lightbox scrim fade 0.18s + image scale-in 0.94→1 (0.24s), exit a plain cut.
- **Swipe semantics (unchanged)**: right swipe = next, left = previous, wrap at both ends (الإعدادات → اليوم, اليوم → الإعدادات); the weekly grid's horizontal scroll stays exempt. Swipes now ride the same page-turn path as button navigation.
- **No perpetual motion.** "Live" is carried by the amber now-states, not by loops.
- **Reduced motion (softened, steer `b7e2d94a`):** `prefers-reduced-motion: reduce` no longer hard-kills the layer. Every spatial move (transforms, clip-path, View Transitions turns, the two-layer exit) comes off; the state changes degrade to a single 0.2s opacity fade (`reduce-fade`) so a panel/subview entry still reads as "new content arrived", and the colour-only sweeps survive. JS additionally skips the two-layer exit and View Transitions (the two purely-spatial layers). Content is always visible at rest.

## Accessibility

- **RTL-aware roving tabindex on subtabs:** only the selected subtab is tabbable; ArrowRight/ArrowLeft/Home/End move and activate; in RTL, ArrowLeft advances forward (visually left, the forward reading direction) and ArrowRight retreats, per the APG RTL convention, enforced by a `dir` check. Rail and bottom-nav items are individually tabbable buttons; the active panel is announced through `aria-current="page"` on both.
- **Skip link:** visually docked off-screen until focus (0.15s slide), amber fill / ink text, 700 13px, target `#main`.
- **Focus treatments:** global `:focus-visible` = 2px amber outline, 2px offset, 4px corner; the lightbox contains Tab.
- **Themed browser surfaces:** amber caret, amber selection with ink text, hair-toned thin scrollbars (10px, #24344E thumb, #31445F hover, transparent track), and `theme-color` #0D1420 so browser chrome matches the ground.
- **Structure:** panels are plain sections (the strip-derived `tabpanel` roles were removed in `fc12fe35`); toasts announce politely; the exam flag carries a full Arabic `aria-label` including its date.

## Decisions Carried From the Surface Brief

- **Period ruler removed on both devices** (live acceptance `a8680017`): the six period boxes (number / time / subject / done-now-next-idle states) and the `segpulse` are gone. The exam flag took the ruler's slot as a compact start-anchored marker (`ruler-flag-compact`, width accepted at "fit") and remains the single red-attention surface and the primary hook into the exam view.
- **Now-line removed and the desktop rail moved to the right** (steer `fac942f2`): the "الحصة الآن" line left the day head — the head is the number and the weekday only; the day's state is read from the lists themselves. The rail's grid template flipped to `232px minmax(0, 1fr)` (rail pinned `grid-column: 1` = right, stage `grid-column: 2`), and the rail's hairline moved to `border-inline-end`. The mobile shell (single column + bottom nav) is untouched.
- **Class-list state column removed** (live acceptance `a7068299`): the state words (تمت / الآن / التالية / قادمة) and all their colour cues (amber now-row tint, amber "الآن" pill) are gone from the today panel; rows are four cells.
- **Weekly-grid "الآن" chip removed** (live acceptance `fabbc523`): the word "الآن" left the weekly grid; today's amber column (tint + amber header) remains as the amber now-state. The `.chip-amber` style and its front-matter entry were deleted with it.
- **Day head and exam flag hidden on the chat and settings panels** (steer `382603f3`): the two panels that are conversation/account in nature (not academic day-state) drop the head and the flag; on every other panel they return. Implemented declaratively — `:has()` rules in `css/app.css` key off the active panel's `hidden` state, so panel switching keeps working untouched.
- **Chat modernized** (live acceptance `1ae2e14e`, "quiet" variant baked at spacious density, bubble width 82%): the composer is a borderless capsule with circular attach (34px) / send (36px) buttons, and the send button is icon-only — its "إرسال" word is gone (`aria-label` carries the name). The `#i-image` symbol was redrawn with a softer frame. Messages are uniform 12px bubbles (theirs ink-2, yours ink-3, no borders) on a 16px rhythm with 10px/0.85 meta; the chat frame itself lost its border, and the now-unused `.btn-icon` rule was deleted.
- **Chat panel left-shift accepted then reverted** (live `19efcdf0`): a 40px left margin on `#panel-chat` was accepted, then rolled back at the user's request — the panel sits flush with the content edge as in `1ae2e14e`; no margin rule was kept.
- **Today-absence line removed** (live acceptance `1fcd5471`, the pure-removal reading of "ازل هذه"): the green `attline` ("الغياب اليوم: لا يوجد") between the exam line and the "معلّق عليك" heading is gone; absence state is read only from the absence panel, and the h2 opens its section at the stock 28px. The `.attline`, `.attline strong`, and `.ic-green` rules plus the `i-check` symbol were deleted from source with it; `--green` now has no live reference, like `--green-tint`.
- **Notes heading renamed to "الواجبات"** (live acceptance `43940e2f`, the pure-rename variant): the today panel's third section head now reads «الواجبات» — assignments as a task ledger, not a passive "pending on you" observation. The count-carrying variant (heading + section tally) was declined; the head stays bare text. No styles moved; the section's pinned note is unchanged.
- **Pinned note title renamed to "واجبات الغد"** (live acceptance `0a2814a3`, the literal-swap variant): the today panel's pinned note title went from «تخصيصات الغد» to «واجبات الغد», aligning its word with the «الواجبات» section head; the time-qualifier variant (muted «الغد» suffix) was declined. The notifications panel's copy of the same fixture note (nid 279) followed on live `877b7f98` — both instances now read «واجبات الغد», divergence closed.
- **Terminology sweep: الحصة/الحصص → الدرس/الدروس** (steer `1faf7661`): page-wide word change — the weekly grid column head "الحصة" → "الدرس", absence log rows "الحصة 1..6" → "الدرس 1..6", the today head "حصص اليوم" → "دروس اليوم", and the absence statline labels ("حصص متفرقة", "حصص إذن", "الإجازات (أيام، حصص)") → their "دروس" forms. The creative concept was renamed with the word: «ساعة الحصة / The Period Clock» is now «ساعة الدرس / The Lesson Clock» in DESIGN.md, app.css, and PRODUCT.md. Historical decision records and the surface brief's direction contract keep their original wording.
- **Logout link restyled as «تسجيل الخروج» in red** (live acceptance `328f26d0`, the quiet-red-link variant): the top-bar link went from muted bare «خروج» to red-text (#E8988E) «تسجيل الخروج» with a 17px exit-door icon; the ghost-pill and solid-red-button variants were declined. A new `i-exit` symbol joined the icon set, drawn RTL (door frame right, exit arrow pointing left); the static toast behavior is untouched. Red-text usage gained this one voice outside exam/absence attention — see the amended Attention-Red Rule.
- **Touch swipes navigate between panels on phones** (steer `4472af0f`): on ≤1023px, a right swipe across the stage goes to the next panel in the rail sequence and a left swipe to the previous; at the ends the sequence wraps (الإعدادات → اليوم forward, اليوم → الإعدادات backward). The reached panel slides in from the side it came from (0.28s, 28px, `swipe-next` / `swipe-prev`); the weekly grid's horizontal scroll is exempt, desktop keeps the rail, and reduced motion collapses the entrance to a plain switch.
- **Day head centered at the top** (live acceptance `5199e8e0`): the day head takes top-center — `justify-content: center` on the flex row, and the weekday stacked as a caption under the number (`flex-direction: column; align-items: center` on `.dayhead-date`). The exam flag below keeps its start-anchored position.
- **Primary tab strip removed on both devices** (live acceptance `fc12fe35`): panel switching is carried solely by the desktop rail and the mobile bottom nav; panels ship as plain sections (no `tabpanel` role, no strip-derived focus stops), and the bottom nav syncs `aria-current="page"` alongside the rail so the active panel stays announced on every device.
- **No unread badge on the chat tab.** The snapshot's chat is fully read (three messages ending in the administration's reply); assuming an unread counter would violate the no-fabrication stance. Recorded instead of an invented badge.
- **Static-only actions toast their unavailability.** `data-static` buttons (Web Push, Telegram unlink) and logout fire a toast stating the action runs only through the original server; the chat composer ships disabled with a "نسخة ثابتة" chip and a note explaining the daily message limit belongs to the live service.
- **PWA manifest without a service worker.** `manifest.webmanifest` declares standalone display, 32/192 icons, and ink ground/theme; no service worker, no push — the page works fully offline by being static.
- **`vendor/` untouched.** `css/vendor/bootstrap.rtl.min.css` and `js/vendor/bootstrap.bundle.min.js` remain unmodified external library files and are no longer referenced by the shipped page (the page links only `css/app.css` and `js/app.js`).
- **Superseded incumbents stay on disk, unreferenced:** `js/ms-fetch.js`, `js/chat.js`, `js/notifications.js`, `css/chat.css` are the original app's live-server layers; the shipped page does not load them, and they remain for provenance.
- **Motion language «ساعة الدرس» added site-wide (steer `9f2c1d74`, motion-signature):** the user asked the site to stop reading dry, then chose the «ساعة الدرس — مُميَّزة» level from three options. The whole site (phone + desktop) now carries one motion language: a one-shot open sequence (number settle, weekday rise, flag unfurl via clip-path from the pole, bottom nav slide-up on phones; gated on `data-boot`, skipped on deep links), directional panel/subview entry (forward = from the left in RTL, shared with the swipe), a View Transitions crossfade scoped to `.stage`, list cascades (24ms per sibling, capped), sliding amber active indicators on the rail and bottom nav, one-shot amber/red first-display sweeps, press feedback on controls, a 5s amber toast progress hairline, and a lightbox scale-in. Transform/opacity only, no perpetual motion, no new dependencies; `swipe-next` / `swipe-prev` were replaced by `enter-fwd` / `enter-bwd`; the reduced-motion hard kill stays and JS skips the layer entirely when it is set.
- **Panel switches become crafted page turns (steer `b7e2d94a`, page-turn):** the user asked for a beautiful navigation transition on every path — desktop rail, phone buttons, and the phone swipe — and to keep it. When the View Transitions API is available the stage region turns directionally: the old page departs toward the side it left from (0.3s, `cubic-bezier(0.4,0,1,1)`) while the new page arrives from the opposite side (0.38s, `--ease-out`), 48px on desktop / 32px on phones (`--vt-slide`); `data-vt-dir` is pinned on `<html>` for the transition's duration with a cancellation-safe cleanup (only the latest transition may clear it). While the stage carries the direction the panel-level entry classes are skipped so the motion never doubles; without the API the old cut + incoming slide remains. The subview entry, cascade, and sweeps run inside the arriving page.
- **Device-band adaptation: tablet, landscape, wide (steer adapt, session 2026-10-29):** the user requested adapting the portal beyond the shipped 390/1440 standards to three underserved contexts — tablet portrait 768–1023 (one-thumb usage), phone landscape (height ≤480), and wide desktop 1440–1920+. Three new media bands landed in `css/app.css` in cascade order after the compact band: (1) **tablet portrait** — the bottom nav keeps its full-width shelf but its items cluster centered (`flex: 0 0 auto`, 84px min targets, 22px icons, 12px labels, indicator at `top: 34px`) so the seven items sit in thumb reach on a 10-inch screen; the day numeral steps 62→72px; toasts rise to 96px. (2) **phone landscape** — the stacked day head folds into one line (`.dayhead-date` row/baseline, numeral 44px beside the 14px weekday); stage padding `12px 24px 72px`, first section head opens at 4px, toasts at 72px — the class list now reaches the first viewport. (3) **wide desktop** — at ≥1440px the 960-capped cluster (day head, exam flag, panels) centers in the stage (`margin-inline: auto`), turning the far-side dead ground into a symmetric unprinted margin; at ≥1700px the cap widens to 1120px. Plus a **PWA safe-area pass**: the top bar height and all side/top paddings (top bar, bottom nav sides, rail sticky offset, skip link dock) read physical `env(safe-area-inset-*)` — zero in normal browser context, active in standalone/notch. No information-architecture change, no new tokens, no JS; the bands are pure CSS in cascade order (mobile → compact → tablet → landscape → wide) so a landscape phone in the 768–1023 width range reads the landscape head, not the tablet's 72px one. Caught in verification: the base shell pins the stage to grid column 2 (the rail's column is 1), and with the single-column mobile template that placement falls into an implicit auto track — the stage shrank to its max-content and dead ground opened on the start side from 768 up; the mobile band now pins `.stage { grid-column: 1 }` and the content runs full width.
- **Date-aware views: the portal reads the real clock (steer datepass, session 2026-10-29):** the page shipped as a snapshot pinned to Tuesday 27/10 — day head, amber today column, today class list, and every exam state carried fixture copy. The user asked the portal to know the actual day and re-derive everything date-bound from it. One load-time pass in `js/app.js` (`alignToToday`) reads the two sources of truth — the weekly grid (the day's lessons) and the exam table (exam dates) — and aligns: the day head (number `d/m` + Arabic weekday), the amber today column (grid columns map JS `getDay()` 0–4; weekend days carry no column and become the sweep's no-op), the today class list rebuilt from the grid column (weekend days fall back to the grades-style empty box «لا دروس اليوم»), exam row states (past rows take `tr.is-past` — attenuated at 0.55 opacity, chip-muted «منقضي» — the next exam keeps the red tint with a relative chip اليوم / غدًا / بعد غد / بعد N أيام, farther exams read neutral «قادم»), the summary chips (subject count + closest exam, or muted «لا امتحانات قادمة»), the exam line (relative chip + «المادة · اليوم التاريخ»), and the attention flag (relative copy, or `hidden` when no exam remains). Dated records stay history — the absence log, chat day separators, and the pinned note are not re-derived; only day-relative claims move. The static-ness principle holds: no server, no new dependencies, one pass at load, before the boot sequence and deep links.
- **The portal reads the next study day, not the day in progress (steer `nextday`, session 2026-10-29):** the user asked «اليوم» to preview what comes next, and to jump straight to Sunday after a weekend. `alignToToday` now derives a *focus day*: tomorrow on Sat–Thu, Sunday on Fri/Sat — always a grid column (0–4), so the weekend empty state is unreachable and the sweep always has a target. The amber column re-points from `is-today` to `is-next` (CSS renamed in three rules, sweep target unchanged), the class list rebuilds from the focus column, and its head names it «دروس الغد» — or «دروس الأحد» when Friday skips the weekend (Saturday keeps «دروس الغد», its tomorrow being Sunday). The no-JS fallback in `index.html` now ships Sunday's six lessons under «دروس الأحد» and carries no amber column. The day head stays the real day; exam states (rows, summary chips, exam line, attention flag) keep their date-relative logic untouched.
- **Bottom-nav indicator re-aimed under the label word (steer `bnlabel`, session 2026-10-29):** the user asked the active item's amber line to sit under the word («الإشعارات» and the like), not under the icon, and to be as wide as the word. The fixed-width `.bn-item::after` bar (18px, `top: 28px` under the icon; tablet 20px/`top: 34px`) is replaced by a `span::after` on the label: the span is content-width in the centered grid, so `left: 0; right: 0` gives the smart word-width in every band — the tablet override is deleted, not ported. The span gains `position: relative` + 4px bottom padding so the 2px bar rests in the padding zone (visible inside the span's `overflow: hidden` ellipsis box, 4px below the text); the scaleX-from-center transition and the reduced-motion selector (`transition: none`) follow the new pseudo-element. The unread count pill and press scale are untouched.

- **Weekly-view section head renamed to «الجدول» (live acceptance `26a2a067`, pure-rename reading):** the subview head inside `#subview-weekly` went from «الشبكة الأسبوعية» to the bare word «الجدول» as the user asked — no counter, no qualifier. Supersedes the `7c4d2a91` note that the head «بقي كما هو»: that note recorded the state at the time; this acceptance is the requested change itself.

- **Bottom nav becomes a floating capsule dock** (live acceptance `22b5afc1`, "ink shelf" variant, comfortable density + default lift): the mobile bottom nav stopped being a full-bleed shelf glued to the bottom edge and the side edges. It is now a content-width pill (`width: fit-content` capped at `min(92vw, 620px)`, centered with `margin-inline: auto`) floating `16px` off the bottom edge plus the PWA safe-area inset. Elevation is declared once: ink-2 fill + 1px hair border, no shadow (the toast keeps the system's one shadow). Items became 48px pill buttons (11px labels, 20px icons); hover and the active state are ink-3 pills; the word-width amber indicator under the active label is unchanged. Tablet band: items cluster at `min-width: 72px` / 8px 6px padding. Landscape-short band: the dock tightens (4px padding, `12px` lift, 44px items, 18px icons, 10px labels). The two declined variants: a translucent glass dock (backdrop blur + a lifted shadow — blur as decoration and a second shadow break the flat-by-default rule) and a container-query dock that morphs to icon-only on narrow screens (the labels are the dock's value at 390px).

- **Smart-density capsule: all seven full names in one row on every phone (steer `capsule-smart`, user steer session 2026-10-30):** on narrow phones the `min(92vw, 620px)` cap squeezed the content-shrunk items, so the label spans ellipsized — "الإشعارات" and friends were clipped at 390px. The user demanded the full names, no overlaps between them, no second row, and no harm to the capsule's look or legibility. A two-row "smart wrap" variant (items `flex: 0 0 auto`, dock `flex-wrap: wrap` with the compact band reserving the second row's height) was built, tested by the user, and rejected: "كل شيء بسطر واحد" (everything in one row). The shipped mechanism is smart density, pure CSS: the cap widens to `min(98vw, 620px)`; items are content-width (`flex: 0 0 auto`, the label span lost its `overflow: hidden` / ellipsis and keeps `white-space: nowrap`); and every measure scales with the viewport — label `clamp(8px, 2.2vw + 1px, 11px)`, icon `clamp(16px, 5.2vw, 20px)`, side padding `clamp(4px, 1.4vw, 11px)`, min-width `clamp(38px, 11vw, 48px)`, row gap `clamp(2px, 0.5vw, 4px)`, capsule padding `clamp(4px, 1vw, 6px)`. Result: one row at every width from 320px up (at 320: 8px labels, 288px dock, 8px margins each side; at 390: 9.6px labels, 343px dock; stock 11px/48px from ≈455px up). The tablet (72px targets) and landscape-short (44px/10px) bands override unchanged and still hold one row; no JS. Verified through CDP device-metrics at 320/360/390/430/560/768/844×390: one row, zero clipped labels, symmetric gutters, Almarai/Cairo confirmed loaded.

## Raster Provenance

- `images/logo.png` — incumbent brand asset from the original application snapshot (the fixture chat image); pre-existing, unmodified in this run.
- `images/icon-32.png` — incumbent favicon/PWA brand asset from the original application snapshot; pre-existing, unmodified in this run.
- `images/icon-192.png` — incumbent PWA/apple-touch brand asset from the original application snapshot; pre-existing, unmodified in this run.
- No rasters were generated in this run.
