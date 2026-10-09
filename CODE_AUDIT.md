# Kitty Brew site: code audit against the Web Design I & II principles

**Date:** October 9, 2026
**Scope:** design E production site: five pages (`index.html`, `visit/`, `cafe-menu/`, `live/`, `faq/`), [`css/styles.css`](css/styles.css) (2,132 lines), [`js/main.js`](js/main.js) (723 lines). The archived `v1/` and `design-mockups/` folders were not audited.
**Method:** source inspection, a parser check for well-formed markup (nesting, heading outline, duplicate IDs), an unused-CSS-class scan, WCAG contrast calculations, and earlier browser testing. Items that need a full validator or real browsers are marked as requiring runtime testing.

This was an audit only. No code was changed. Line numbers refer to the code as of the date above.

---

## A. Overall assessment

**Overall: about 7/10 against the course philosophy.** The foundation fits what the courses teach. It's plain HTML, CSS and vanilla JS with no framework and no build step. It uses semantic landmarks, Grid and Flexbox throughout, custom properties, and heavy explanatory comments. The main gap is how much of the visual design lives in markup and JavaScript instead of CSS, plus a few genuine accessibility and progressive-enhancement bugs.

### Greatest strengths
- **No framework, no build step, no package manager.** View-source on any page shows exactly what runs.
- **Strong landmark and heading structure.** Every page has `header`, a labeled `nav`, `main` and `footer`, a single `h1`, and a logical `h2`/`h3` outline. The parser found no nesting errors or duplicate IDs on any page.
- **Native HTML where it fits.** The FAQ uses `<details>`/`<summary>` with zero JavaScript, reviews use `figure`/`blockquote`/`figcaption`, and the address uses `<address>`.
- **Modern CSS.** 20 Grid and 19 Flexbox layouts, 163 uses of custom properties, rem-based type and spacing, em breakpoints, and a `prefers-reduced-motion` block.
- **Very readable JavaScript.** Each feature is a small named function that exits early if its element isn't on the page, and the comments teach as they go.

### Biggest differences from the course approach
1. **Presentation in the markup.** About 15 decorative `<img>` tags per page (leaves and flowers), an inline wave SVG with hard-coded colors repeated on every page, and class names like `c1`, `c2`, `c-orange` and `hl`.
2. **Content and presentation in JavaScript.** The footer hours and the 42-image mural band only exist after JS runs. Turn JS off and the footer hours are empty lists.
3. **Two progressive-enhancement bugs.** Content with the `.reveal` class is invisible without JavaScript, and the closed phone menu is still reachable by keyboard.

### Architectural choices that add real complexity
- **The mural band:** 42 absolutely positioned images, built by JS, sized with ~50 CSS rules, then scaled with `transform` on phones. It looks great, but it's the clearest case of complexity bought for design convenience.
- **The shrinking header:** CSS margin compensation plus JS reading CSS custom properties as pixel values. It works (tested), but the JS and CSS are tightly coupled.

---

## B. Category-by-category evaluation

| # | Category | Rating |
|---|---|---|
| 1 | Semantic HTML and document structure | 8/10 |
| 2 | HTML standards compliance | 8/10 |
| 3 | Separation of content, presentation and behavior | 6/10 |
| 4 | CSS organization and layout techniques | 7/10 |
| 5 | Responsive design | 8/10 |
| 6 | JavaScript usage and complexity | 7/10 |
| 7 | Accessibility and usability | 7/10 |
| 8 | Readability, organization and maintainability | 7/10 |
| 9 | Dependencies, frameworks and complexity | 8/10 |
| 10 | Suitability as an educational example | 7/10 |

### 1. Semantic HTML and document structure: 8/10

**Does well**
- Landmarks and a skip link: [index.html:64](index.html#L64) (skip link), [67](index.html#L67) (`header`), [73](index.html#L73) (`nav aria-label="Main"`), [93](index.html#L93) (`main id="main"`), [276](index.html#L276) (`footer`), [316](index.html#L316) (second `nav`, labeled "Quick actions").
- Reviews as quotations with attribution: [index.html:188](index.html#L188).
- `<address>` for the street address: [index.html:258](index.html#L258).
- The FAQ is built on `details`/`summary`: [faq/index.html:86](faq/index.html#L86).
- `aria-current="page"` on the active nav link: [index.html:76](index.html#L76).
- Sections use `aria-labelledby` pointing at their headings.

**Conflicts with the course preferences**
- **Menu items: the price is inside the heading, and the list isn't a list.** [cafe-menu/index.html:89](cafe-menu/index.html#L89):
  ```html
  <div class="menu-item"><h3>Drip Coffee <span class="price">$2.50 / $2.95</span></h3><p>…</p></div>
  ```
  The heading outline literally reads "Drip Coffee $2.50 / $2.95." Each section is a list of items but is marked up as a `div` grid. This is a genuine semantic issue, though minor.
- **Visit page key facts use `<b>` + `<span>` for term/description pairs.** [visit/index.html:81-84](visit/index.html#L81). This is textbook `<dl>` content.
- **`<b>` and `<span class="hl">` used where `<strong>` is meant.** [index.html:102](index.html#L102), [158](index.html#L158), [visit/index.html:108](visit/index.html#L108), [116](visit/index.html#L116). These are important facts (pricing, policies), not just visually bold text.
- **`<div class="big">` holding a price sentence:** [visit/index.html:115](visit/index.html#L115). That should be a `<p>`.
- **The policy cards are `div`s** ([visit/index.html:106](visit/index.html#L106)). They're self-contained topics, so `<section>` or `<article>` would carry more meaning. This one is closer to style preference.

**Recommendations:** restructure menu items as list items, make the Visit facts a `<dl>`, and replace `b`/`span.hl` with `strong`.

### 2. HTML standards compliance: 8/10

**Does well:** consistent doctype, `lang`, viewport and charset. No unclosed or misnested tags and no duplicate IDs (parser check on all five pages). Every `<img>` has an `alt`, and all scripts load with `defer`.

**Conflicts**
- **`role="img"` on a `div` used as a CSS background photo:** [index.html:149](index.html#L149). It's valid ARIA, but it works around a content image living in CSS (see category 3).
- **A redundant `type="text/javascript"`** in the Bookeo embed: [visit/index.html:94](visit/index.html#L94). It's harmless and comes from Bookeo's own snippet.
- **Font Awesome's `<i>` elements for icons** (about 20 per page). The `<i>` element is meant for alternate voice or terms, not icons. That's the library's convention, and every icon has `aria-hidden`, but it's not what the courses teach.

**Needs runtime testing:** a full check with the W3C Nu validator. The parser check covers structure, not content-model rules.

### 3. Separation of content, presentation and behavior: 6/10

**Does well:** zero `style=""` attributes across all five pages. All styling is in one external stylesheet and all behavior in one external script. Line breaks in the hero `h1` are done with CSS (`span { display: block }`), not `<br>`.

**Conflicts (the weakest category)**
- **Decorative images in the HTML.**
  - Leaves and flowers are `<img class="deco" alt="">`, for example [index.html:97-98](index.html#L97) and [122](index.html#L122), about 6–8 per page. They're pure decoration, which by the course rule belongs in CSS (background images or `::before`/`::after`).
  - The painted cats are more debatable, since they're brand illustrations, so markup with `alt=""` is defensible there.
- **The inline wave SVG repeated on every page with hard-coded fills.** [index.html:115](index.html#L115) has `fill="#2b2a55"`, the same value as the `--night` token, duplicated in markup on five pages.
- **A content photo set as a CSS background.**
  - [styles.css:559](css/styles.css#L559) sets the adoption photo as `background: url(...)`, and the HTML compensates with `role="img"` + `aria-label` ([index.html:149](index.html#L149)).
  - That's the reverse problem: content placed in CSS. The hero ([index.html:110](index.html#L110)) does it correctly with `<img>` + `object-fit`.
- **Content generated by JavaScript.**
  - The footer hours `<ul data-hours="cafe"></ul>` ([index.html:282](index.html#L282)) are empty until `renderHoursLists()` ([main.js:286](js/main.js#L286)) fills them.
  - The mural band list lives in JS (`MURAL_BAND`, [main.js:541](js/main.js#L541)) and is injected with `innerHTML` ([main.js:592](js/main.js#L592)).
- **Presentational class names.** `.c1`/`.c2`/`.c3` ([index.html:100](index.html#L100), [styles.css:460](css/styles.css#L460)), `.c-orange` ([styles.css:539](css/styles.css#L539)) and `.hl` ([styles.css:158](css/styles.css#L158)) describe appearance, not meaning.

**Which of these are genuine problems:** the empty hours lists and the background-image photo are real issues (content depends on JS or CSS). The decorative `<img>`s and class names are mostly philosophy and style. The band in JS is a deliberate trade-off (one list instead of five copies), but it moves content into the script.

### 4. CSS organization and layout techniques: 7/10

**Does well**
- **Clear numbered sections** with a table of contents at the top ([styles.css:1-17](css/styles.css#L1)).
- **One `:root` token block** ([styles.css:23](css/styles.css#L23)) with named, commented colors from the mural palette.
- **Grid and Flexbox everywhere,** with `minmax(0, 1fr)` used correctly to prevent overflow.
- **Low specificity overall.** The only `!important` is in the standard `.visually-hidden` pattern.
- **Only one unused class** in the whole file (`.visually-hidden`).

**Conflicts**
- **Repeated declarations instead of a reusable class.** `font-size: 3rem` for section headings is written five times ([506](css/styles.css#L506), [617](css/styles.css#L617), [670](css/styles.css#L670), [794](css/styles.css#L794), [889](css/styles.css#L889)), even though a `.section-title` class exists ([888](css/styles.css#L888)). The homepage just doesn't use it.
- **Two class names for one thing.** `.wrap, .container` ([styles.css:115](css/styles.css#L115)): the homepage uses `wrap` ([index.html:124](index.html#L124)) and the inner pages use `container` ([index.html:68](index.html#L68), carried over from v1). It's inconsistent and confusing to students.
- **A clever full-bleed alignment formula:** `padding: … max(24px, calc((100vw - var(--container)) / 2 + 24px))` ([styles.css:449](css/styles.css#L449), [568](css/styles.css#L568)). It works and it's justified (text aligns with the page while the photo bleeds to the edge), but it's hard to explain in Web Design I.
- **A specificity workaround.** `.step-art .cat-step-cafe` ([styles.css:2014-2016](css/styles.css#L2014)) exists only to outrank `.step-art img`, and `.band .band-…` doubles every band selector for the same reason.
- **Mural band built with absolute positioning.** About 50 position rules ([styles.css:2061](css/styles.css#L2061) onward) plus a `width: max(100%, 1400px)` / `translateX(-50%)` centering trick ([styles.css:1518](css/styles.css#L1518)) and `scale(0.8)` on phones ([styles.css:1826](css/styles.css#L1826)). A collage really does need absolute positioning, but it's a lot of rules for one decorative strip.
- **Colors written outside the tokens.** Nine hard-coded values, for example `#cfd9da` (three times, at [950](css/styles.css#L950), [1389](css/styles.css#L1389), [1734](css/styles.css#L1734)), `#1c1b38` (twice) and `#3a3846`.
- **The file is long.** At 2,132 lines it's well organized, but intimidating to open in class.

### 5. Responsive design: 8/10

**Does well:**
- **Units:** em breakpoints and rem type and spacing, each explained in comments ([styles.css:1657-1662](css/styles.css#L1657)).
- **Layouts:** Grid layouts collapse to one column with `minmax(0, 1fr)`, and photos use `aspect-ratio` on phones.
- **Phones:** the action bar accounts for the iPhone home bar with `env(safe-area-inset-bottom)`.
- **Tested earlier:** 320–1920px, at 16/20/24px browser text sizes, with no sideways scrolling.

**Conflicts**
- **Media queries are in two places.** Breakpoint rules are split between section 11 and the art block ([styles.css:1687](css/styles.css#L1687) and [2124](css/styles.css#L2124) both target `53.75em`, plus [2114](css/styles.css#L2114) at `76em`). That was a deliberate choice to keep art tweaks together, but it scatters the responsive logic.
- **Some fixed dimensions:**
  - The `300px` sidebar column ([styles.css:932](css/styles.css#L932)) could be `minmax(16rem, 20rem)`.
  - The 200px and 290px art boxes ([519](css/styles.css#L519), [1507](css/styles.css#L1507)) are justified, since they're sized around the drawings.
- **The band scales with `transform`** on phones instead of reflowing. That's acceptable for decoration.

### 6. JavaScript usage and complexity: 7/10

**Good uses:** behavior that genuinely needs JS.
- **"Open now / Closed now" in café time:** `cafeNow()` uses `Intl.DateTimeFormat` with a time zone ([main.js:135](js/main.js#L135)). That's the right native API and a great teaching example.
- **The phone menu toggle** keeps `aria-expanded` in sync and closes on Escape ([main.js:320-410](js/main.js#L320)).
- **Random reviews** ([main.js:506](js/main.js#L506)): a Fisher–Yates shuffle that reorders existing HTML. Without JS the first three show, which is proper progressive enhancement.
- **The Kitty Cam** ([main.js:614](js/main.js#L614)): uses Safari's built-in support first and falls back to hls.js, with a timeout that shows the offline message.

**Conflicts**
- **Reveal-on-scroll hides content when JS fails** (genuine bug). `.reveal { opacity: 0 }` ([styles.css:171-172](css/styles.css#L171)) applies unconditionally, so if `main.js` doesn't load, the How it works steps, the gallery and all four Visit policy cards stay invisible ([visit/index.html:106](visit/index.html#L106)). The simple fix is to scope it:
  ```css
  .js .reveal { opacity: 0; transform: translateY(1.5rem); }
  ```
  ```js
  document.documentElement.classList.add("js"); // first line of main.js
  ```
- **Hours rendered by JS** ([main.js:286-310](js/main.js#L286)). Essential business information disappears without JS, and search engines see empty lists. The benefit is a single source of truth (`KB_HOURS`) shared with the "Open now" bar. One alternative: put the hours in the HTML and have JS read them, using `data-open`/`data-close` attributes, then only add the highlight.
- **Icon swapping with `innerHTML`** ([main.js:395-397](js/main.js#L395)) could be pure CSS driven by the attribute JS already sets:
  ```css
  .nav-toggle[aria-expanded="true"] .icon-bars,
  .nav-toggle[aria-expanded="false"] .icon-close { display: none; }
  ```
- **The header shrink reads CSS variables as pixels** ([main.js:345-349](js/main.js#L345), with `--header-h` at [styles.css:50](css/styles.css#L50)). If anyone converts those to rem, `parseFloat("7.25rem")` returns 7.25 and the switch point silently breaks. The coupling is documented in comments, but it's fragile.
- **The hero photo downloads twice.** [index.html:110](index.html#L110) loads `hero-cat-drink.jpg`, then [main.js:497](js/main.js#L497) swaps in a random photo, so most visits download two hero images. How much this costs needs measuring in the browser's Network panel.
- **A preview-only `?hero=` parameter** ([main.js:494](js/main.js#L494)) is left in the production code.

### 7. Accessibility and usability: 7/10

**Does well:**
- **Keyboard:** a skip link that's hidden until focused, and `:focus-visible` outlines.
- **Labels:** `aria-label` on icon-only links, and `aria-hidden` on decorative icons.
- **Images:** meaningful `alt` text on photos and `alt=""` on decoration.
- **Motion:** reduced-motion support.
- **Visitor-focused touches:** the phone action bar (Call, Directions, Book), the "Open now" bar, landmarks in plain English, and `<details>` FAQs.

**Genuine problems**
- **The closed phone menu is still keyboard-focusable.** [styles.css:1705-1717](css/styles.css#L1705) hides it with `opacity: 0; pointer-events: none` but not `visibility: hidden`. A keyboard user on a phone or tablet tabs through five invisible links. Fix:
  ```css
  .nav__list { visibility: hidden; transition: opacity .2s, transform .2s, visibility .2s; }
  .nav__list.is-open { visibility: visible; }
  ```
- **The "Open now" bar fails contrast.** White on `--periwinkle` ([styles.css:384-387](css/styles.css#L384)) measures **3.48:1** at 14px, below the WCAG AA minimum of 4.5:1. Every other pair checked passes:

  | Color pair | Ratio | Result |
  |---|---|---|
  | White on "Open now" bar (periwinkle), 14px | 3.48:1 | **Fails** (needs 4.5) |
  | Button text: white on terracotta | 4.73:1 | Passes |
  | Body text on indigo | 9.91:1 | Passes |
  | Footer legal text on indigo | 5.85:1 | Passes |
  | Terracotta headings on wall (large text) | 4.02:1 | Passes (needs 3) |
  | Hand-lettered subheads on wall | 8.02:1 | Passes |
  | Muted text on wall / on white | 5.59:1 / 6.59:1 | Passes |
  | Mustard headings on indigo (large) | 6.28:1 | Passes |
  | Today's hours row (tangerine on indigo) | 6.97:1 | Passes |

- **Invisible content without JS** (`.reveal`, above).
- **A confusing button label.** The menu toggle is labeled "Menu" ([index.html:74](index.html#L74)), and the site also has a "Menu" page link. A screen-reader user hears "Menu, button" next to "Menu, link." "Main menu" or "Site navigation" would be clearer.

**Needs runtime testing:** an automated check (axe or Lighthouse), a real VoiceOver or NVDA pass, and the third-party Bookeo widget's own accessibility, which is outside the site's control.

### 8. Readability, organization and maintainability: 7/10

**Does well:**
- **Thorough comments.** The JS header ([main.js:1-39](js/main.js#L1)) explains `const`/`let`, arrow functions, template literals, `querySelector` and `classList`.
- **Editable lists live in one place** and are clearly labeled: hours (`KB_HOURS`, [main.js:64](js/main.js#L64)), hero photos ([main.js:468](js/main.js#L468)) and mural band images ([main.js:541](js/main.js#L541)).
- **The art block** ([styles.css:1988](css/styles.css#L1988)) is self-documenting.

**Conflicts**
- **Changing the mural band means editing three places:** the list in JS, the positions in CSS, and the image files.
- **The header and footer are duplicated across five HTML files.** That's normal for a static site with no build step, and a deliberate trade-off (no tooling), but a nav or footer change means five edits.
- **The CSS–JS coupling** described in category 6.

### 9. Dependencies, frameworks and unnecessary complexity: 8/10

| Dependency | Verdict |
|---|---|
| No framework, no build tools | Excellent |
| hls.js (Kitty Cam only) | Justified: Chrome and Firefox can't play HLS streams on their own |
| Bookeo, Google Maps embed | Business requirements |
| **Font Awesome, full CSS** (around 100 KB of CSS plus icon fonts) for ~20 icons | Heavy for what it does. A handful of inline SVGs or icon files would replace it |
| **4 Google Font families** (Bebas, Roboto, Patrick Hand SC, Montserrat Alternates) | Montserrat Alternates is only used for the small "Kitty Brew" wordmark in the shrunken header |

### 10. Suitability as an educational example: 7/10

There's plenty that's excellent to teach from (section D). Two things hold the score back: the JS-dependent content and a few clever tricks that need extra explanation before students can follow them.

---

## C. Specific examples

### Particularly good semantic HTML
[index.html:188-191](index.html#L188):
```html
<figure class="review">
  <blockquote>If you like cats and want to play with them…</blockquote>
  <figcaption>Lexington S</figcaption>
</figure>
```
Also the FAQ, [faq/index.html:86](faq/index.html#L86): `<details><summary>Do I need a reservation…</summary>…</details>`. That's an accordion with no JavaScript and full keyboard support built in.

### HTML that could be more semantic
- **Menu items** ([cafe-menu/index.html:89](cafe-menu/index.html#L89)). A simpler alternative:
  ```html
  <ul class="menu-grid">
    <li class="menu-item">
      <h3>Drip Coffee</h3>
      <p class="price">$2.50 / $2.95</p>
      <p>House-brewed medium roast.</p>
    </li>
  </ul>
  ```
- **Visit facts** ([visit/index.html:81](visit/index.html#L81)) as a description list:
  ```html
  <dl class="facts__list">
    <dt>50 minutes</dt><dd>in the cat lounge with 20–25 adoptable cats</dd>
  </dl>
  ```

### Well-written, straightforward CSS
- **The token block** ([styles.css:23-55](css/styles.css#L23)).
- **The menu's dotted leader line,** done with a Flexbox pseudo-element ([styles.css:1196-1210](css/styles.css#L1196)). It's a great Flexbox `order` demo.
- **The FAQ `summary` styling,** with a rotating "+".

### CSS that's unnecessarily complex
- **The mural band** ([styles.css:1503-1531](css/styles.css#L1503) plus ~50 rules from [2061](css/styles.css#L2061)). The simpler alternative, once the design is final, is to export the composed band as one WebP and use `background: url(band.webp) center bottom / auto 100% repeat-x`. That means one file, about five lines of CSS, and no JS. You lose easy per-cat tweaking.
- **The header margin compensation** ([styles.css:299-302](css/styles.css#L299)). It's justified (it fixes the scroll flicker), but it only exists because of the shrinking header. A fixed-height sticky header would need none of it.

### Good uses of JavaScript
`cafeNow()` ([main.js:135](js/main.js#L135)), `initReviews()` ([main.js:506](js/main.js#L506)) and `initCam()` ([main.js:614](js/main.js#L614)).

### JavaScript that native HTML or CSS could replace
- **The icon swap** ([main.js:395](js/main.js#L395)) can be done with a CSS attribute selector (shown in category 6).
- **The reveal fallback** ([main.js:434](js/main.js#L434)) handles browsers without IntersectionObserver, which every current browser supports. It doesn't handle the case that matters, JS not running at all.

### Code that looks overengineered
The JS-built mural band (an 81-line list plus a builder function, then 50 CSS rules, for a decorative strip). The shrinking header is moderately overengineered: two systems working together for a cosmetic effect.

### Genuine problem vs. preference vs. justified

| Finding | Category |
|---|---|
| `.reveal` hides content without JS; hidden menu is focusable; today-bar contrast; hours exist only in JS | **Genuine problems** |
| Photo as CSS background + `role="img"`; price inside `<h3>`; `b`/`span.hl` for importance | **Genuine but minor semantic issues** |
| `.c1`/`.hl` names; `wrap`/`container` alias; decorative `<img>`s; Font Awesome's `<i>` | **Style and philosophy preferences** |
| hls.js; `Intl` time zones; the full-bleed `max()/calc()`; absolute positioning for the collage | **Advanced but justified** |

---

## D. Educational suitability

### Good to demonstrate
- **Web Design I:**
  - landmarks, skip link and `aria-current` ([index.html:64-93](index.html#L64))
  - `figure`/`blockquote` reviews
  - `<address>`
  - `<details>` FAQ
  - in-page jump links with `scroll-margin-top` ([cafe-menu/index.html:75](cafe-menu/index.html#L75))
  - the `:root` token block
  - rem vs. px explained in the CSS header comment
- **Web Design II:**
  - Grid layouts collapsing with `minmax(0, 1fr)`
  - em breakpoints
  - `prefers-reduced-motion`
  - the Flexbox dotted-leader menu
  - `Intl.DateTimeFormat` with a time zone
  - Fisher–Yates progressive enhancement in `initReviews`
  - the defensive "return early if the element isn't on this page" pattern throughout `main.js`
  - choosing hls.js only where native support falls short

### Hard to teach from right now
- **The mural band** (JS plus 50 absolute-position rules plus transform scaling).
- **The full-bleed `max(24px, calc(…))` padding.**
- **The shrinking header's CSS–JS coupling.**
- **Specificity-doubling selectors** like `.band .band-…`.
- **JS-rendered hours.** This one teaches the opposite of progressive enhancement.
- **The 2,132-line stylesheet.** Show excerpts rather than the whole file.

---

## E. Prioritized recommendations

### High priority

| # | Change | Effort | Benefit | Risk |
|---|---|---|---|---|
| 1 | Scope `.reveal` to a `.js` class so content shows without JS | ~10 min | No invisible content; correct progressive enhancement | Very low |
| 2 | Add `visibility: hidden` to the closed phone menu | ~10 min | Fixes keyboard and screen-reader access on phones and tablets | Very low (check the open/close transition) |
| 3 | Fix the "Open now" bar contrast (darker background such as `--periwinkle-deep`, or dark text) | ~10 min | Meets WCAG AA | Small visual change |
| 4 | Put the footer hours in the HTML; JS only highlights today (and optionally reads the times from data attributes) | 1–2 hrs | Hours visible without JS and to search engines; good teaching pattern | Hours then live in five footers unless JS reads one source; changes the "edit once" workflow |

### Medium priority

| # | Change | Effort | Benefit | Risk |
|---|---|---|---|---|
| 5 | Adoption photo: CSS background → `<img>` with `alt` and `object-fit` | ~20 min | Content in HTML; drop `role="img"` | Very low |
| 6 | Menu items as `ul`/`li` with the price outside `<h3>`; Visit facts as `<dl>`; `b`/`span.hl` → `strong` | 1–2 hrs | Cleaner semantics; better class examples | Low (restyle the new elements) |
| 7 | One `.section-title` class for all section headings; pick `.container` *or* `.wrap` | ~45 min | Less repetition; consistent naming | Low |
| 8 | Move the wave and decorative leaves into CSS (backgrounds or pseudo-elements) | 2–3 hrs | Presentation out of HTML; about 40 fewer tags per page | Medium: the `CAT ART` tweak workflow changes for decorations |
| 9 | Swap the menu icon with CSS instead of `innerHTML` | ~15 min | Shows CSS replacing JS | Very low |
| 10 | Replace Font Awesome with ~20 inline SVG icons | 2–3 hrs | Removes a large dependency; faster pages | Medium: touches every page |
| 11 | Avoid the double hero download (e.g. no default `src` plus a `<noscript>` fallback, or accept it) | ~30 min | Faster homepage load | Low; measure first |

### Low priority

| # | Change | Effort | Benefit | Risk |
|---|---|---|---|---|
| 12 | Once the band is final, bake it into one image (keep the source layout in the mockups folder) | ~1 hr | Removes about 130 lines of JS and CSS | You lose easy cat-by-cat tweaks |
| 13 | Simplify the header shrink (fixed height), or store its heights as JS constants | 30–60 min | Less coupling | Design change |
| 14 | Move hard-coded colors into tokens; rename `.c1`/`.c-orange`/`.hl` | ~45 min | Consistency | Very low |
| 15 | Remove the `?hero=` preview code, `type="text/javascript"` and the unused `.visually-hidden` (or use it) | ~10 min | Tidiness | None |
| 16 | Rename the toggle's label to "Main menu" | ~5 min | Clearer for screen readers | None |
| 17 | Drop Montserrat Alternates (use a small logo image for the wordmark) | ~20 min | One fewer font download | Very low |

### Runtime checks to run before revising
- W3C Nu validator on all five pages
- Lighthouse or axe for accessibility and performance
- A VoiceOver pass on the phone menu and FAQ
- The browser's Network panel to measure the hero double-download
