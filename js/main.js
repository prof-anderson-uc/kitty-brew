/* ====================================
   Kitty Brew Cat Café — site scripts
   ====================================

   This one file runs on every page of the site. It handles:

     1. Hours          — the "Open now / Closed now" bar under the header and
                         the hours lists in the footer
     2. Header         — shrinking the header when you scroll, and the mobile
                         (hamburger) menu
     3. Scroll reveal  — sections that fade in as you scroll down
     4. Homepage       — a random hero photo and 3 random reviews each visit
     5. Mural band     — the strip of painted cats above the footer (every page)
     6. Kitty Cam      — the live video player (Kitty Cam page only)

   HOW THE PIECES CONNECT
   Each feature is a function (a named, reusable block of code). Nothing runs
   until the very bottom of this file, where we wait for the page to finish
   loading and then call each function in turn.

   Every feature first looks for the HTML element it needs. If that element
   isn't on the current page (for example, there's no video player on the
   Menu page), the function simply stops. That's what lets one script work
   safely on every page.

   A FEW JAVASCRIPT BASICS YOU'LL SEE A LOT
   - const / let      Create a variable (a named box that holds a value).
                      `const` can't be reassigned later; `let` can.
   - (x) => { ... }   An "arrow function": a short way to write a function.
                      `(x) => x * 2` means "take x, give back x times 2".
   - `text ${value}`  A "template literal" (note the backticks). Whatever is
                      inside ${ } is inserted into the text.
   - document.querySelector("...")
                      Finds the first HTML element matching a CSS selector,
                      e.g. ".site-header" finds class="site-header".
   - element.classList.add / remove / toggle("name")
                      Adds or removes a CSS class on an element. Most visual
                      changes work this way: JavaScript flips a class and the
                      CSS in styles.css decides what that class looks like.
   ==================================== */


/* ====================================
   1. HOURS
   ==================================== */

// ------------------------------------
// THE HOURS THEMSELVES — this is the part to edit when your hours change.
// The footer lists and the "Open now" bar are both built from this, so you
// only ever have to change the hours in this one place.
//
// KB_HOURS is an "object": a set of named values inside { }. It has two
// names, `cafe` and `lounge`, and each holds an "array" (a list inside [ ]).
//
// Each list has exactly 7 entries, one per day, in this order:
// Sunday, Monday, Tuesday, Wednesday, Thursday, Friday, Saturday.
// (JavaScript counts from 0, so Sunday is entry 0 and Saturday is entry 6.
//  We start on Sunday because that's how JavaScript numbers weekdays.)
//
// Each day is either:
//   ["opening time", "closing time"]  in 24-hour format ("17:30" = 5:30 pm)
//   null                              meaning closed all day
// ------------------------------------
const KB_HOURS = {
  cafe: [
    ["10:00", "16:30"], // Sunday
    ["8:30", "17:30"],  // Monday
    null,               // Tuesday (closed)
    ["8:30", "17:30"],  // Wednesday
    ["8:30", "17:30"],  // Thursday
    ["8:30", "18:30"],  // Friday
    ["9:00", "18:30"]   // Saturday
  ],
  lounge: [
    ["10:00", "17:00"], // Sunday
    ["11:00", "18:00"], // Monday
    null,               // Tuesday (closed)
    ["11:00", "18:00"], // Wednesday
    ["11:00", "18:00"], // Thursday
    ["11:00", "19:00"], // Friday
    ["10:00", "19:00"]  // Saturday
  ]
};

// Day names, in the same Sunday-first order as the hours above.
// DAY_NAMES[1] is "Mondays", DAY_SHORT[1] is "Mon", and so on.
// DAY_NAMES is used in the footer lists; DAY_SHORT is used when reading the
// current day and in messages like "Opens Wed at 8:30".
const DAY_NAMES = ["Sundays", "Mondays", "Tuesdays", "Wednesdays", "Thursdays", "Fridays", "Saturdays"];
const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// ------------------------------------
// toMinutes("17:30") → 1050
//
// Turns a time like "17:30" into "minutes since midnight" (17 × 60 + 30).
// Comparing plain numbers is much easier than comparing text: is 1050
// bigger than 510? Yes, so 5:30 pm is later than 8:30 am.
// ------------------------------------
const toMinutes = (t) => {
  // "17:30".split(":") cuts the text at the colon → ["17", "30"] (still text).
  // .map(Number) runs Number() on each piece to turn it into a real number
  // → [17, 30].
  // `const [h, m] = ...` is "destructuring": it unpacks the two-item list
  // into two variables at once, so h = 17 and m = 30.
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};

// ------------------------------------
// fmt("17:30") → "5:30"
//
// Formats a 24-hour time for display in 12-hour style. (We leave off
// am/pm, matching how the original site listed hours.)
// ------------------------------------
const fmt = (t) => {
  let [h, m] = t.split(":").map(Number);

  // `%` is "remainder after dividing": 17 % 12 = 5, 12 % 12 = 0, 8 % 12 = 8.
  // `|| 12` means "if the left side is 0 (or empty), use 12 instead", so
  // noon shows as 12 rather than 0.
  h = h % 12 || 12;

  // padStart(2, "0") makes sure minutes always have two digits:
  // 0 → "00", 5 → "05", 30 stays "30".
  return `${h}:${String(m).padStart(2, "0")}`;
};

// ------------------------------------
// cafeNow() → { day: 1, minutes: 630 }   (e.g. Monday at 10:30 am)
//
// Works out the current day and time *in Ohio*, even if the visitor is in
// another time zone. Someone browsing from California at 9 am should still
// see "Open now" if it's noon at the café.
// ------------------------------------
function cafeNow() {
  // Intl.DateTimeFormat is JavaScript's built-in tool for formatting dates.
  // We ask for the current moment (new Date()) as it would read in the
  // America/New_York time zone (Eastern Time, which includes Ohio).
  // hourCycle: "h23" gives 24-hour hours (0–23) so the math stays simple.
  //
  // formatToParts gives the answer back as labeled pieces instead of one
  // string, something like:
  //   [ {type: "weekday", value: "Mon"}, {type: "hour", value: "10"}, ... ]
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    weekday: "short",
    hour: "numeric",
    minute: "numeric",
    hourCycle: "h23"
  }).formatToParts(new Date());

  // A small helper: find the piece with a given label and return its value.
  // e.g. get("weekday") → "Mon"
  const get = (type) => parts.find((p) => p.type === type).value;

  return {
    // indexOf finds where "Mon" sits in DAY_SHORT → 1. That number lines up
    // with the day positions in KB_HOURS.
    day: DAY_SHORT.indexOf(get("weekday")),
    minutes: Number(get("hour")) * 60 + Number(get("minute"))
  };
}

// ------------------------------------
// nextOpening(KB_HOURS.cafe, 2, 600) → "tomorrow at 8:30"
//
// When we're closed, figures out when we open next so the bar can say
// "Closed now · Opens tomorrow at 8:30".
//
//   schedule — one of the hour lists (KB_HOURS.cafe or KB_HOURS.lounge)
//   day      — today's day number (0 = Sunday)
//   minutes  — the current time in minutes since midnight
// ------------------------------------
function nextOpening(schedule, day, minutes) {
  // A `for` loop repeats a block of code. Here `i` counts 0, 1, 2 … 7,
  // meaning "today", "1 day from now", "2 days from now", and so on.
  // We check 8 days (not 7) so that if we're past closing today, the loop
  // can wrap all the way around to the same weekday next week.
  for (let i = 0; i < 8; i++) {
    // Which weekday is `i` days from today? `% 7` wraps around the week:
    // Saturday (6) + 1 day = 7, and 7 % 7 = 0, which is Sunday.
    const d = (day + i) % 7;
    const hrs = schedule[d];

    // We've found the next opening if that day isn't closed (hrs is not
    // null) AND either it's a future day (i > 0), or it's today but opening
    // time hasn't arrived yet.
    if (hrs && (i > 0 || minutes < toMinutes(hrs[0]))) {
      // The `? :` below is a "ternary", a compact if/else:
      //   condition ? valueIfTrue : valueIfFalse
      // Chained together, it reads: if i is 0 say "today", otherwise if
      // i is 1 say "tomorrow", otherwise use the short day name ("Wed").
      const when = i === 0 ? "today" : i === 1 ? "tomorrow" : DAY_SHORT[d];

      // `return` hands back the answer and stops the function (and the loop)
      // right here.
      return `${when} at ${fmt(hrs[0])}`;
    }
  }

  // Only reached if every single day is closed, which shouldn't happen.
  return "";
}

// ------------------------------------
// renderTodayBar()
//
// Fills in the dark strip under the header with the live status, e.g.
//   ● Open now · Café until 5:30 · Cat lounge until 6:00
//   ● Closed now · Opens tomorrow at 8:30
//
// In the HTML, the spot to fill looks like:
//   <span data-today-status>...</span>
// ------------------------------------
function renderTodayBar() {
  // Square brackets in a selector match an attribute, so this finds the
  // element that has the data-today-status attribute.
  const el = document.querySelector("[data-today-status]");

  // If this page doesn't have the bar, stop here. `return` with nothing
  // after it just exits the function.
  if (!el) return;

  // Destructuring again: pull `day` and `minutes` out of the object that
  // cafeNow() returns.
  const { day, minutes } = cafeNow();

  // Today's hours for each side of the business: either ["8:30", "17:30"]
  // or null if closed today.
  const cafe = KB_HOURS.cafe[day];
  const lounge = KB_HOURS.lounge[day];

  // Is each side open right now? It is if it's open today (not null) AND
  // it's after opening time AND before closing time.
  // `&&` means "and": every part has to be true. If `cafe` is null, the
  // check stops at the first part, which avoids an error from trying to
  // read cafe[0] when there's nothing there.
  const cafeOpen = cafe && minutes >= toMinutes(cafe[0]) && minutes < toMinutes(cafe[1]);
  const loungeOpen = lounge && minutes >= toMinutes(lounge[0]) && minutes < toMinutes(lounge[1]);

  // We'll build the bar's contents as a string of HTML, then insert it.
  let html;

  // `||` means "or": true if either side is open.
  if (cafeOpen || loungeOpen) {
    // `bits` collects the pieces of the message, which get joined with
    // " · " separators at the end.
    const bits = [];

    // .push adds an item to the end of a list.
    bits.push(cafeOpen ? `Café until <strong>${fmt(cafe[1])}</strong>` : "Café closed");

    if (loungeOpen) {
      bits.push(`Cat lounge until <strong>${fmt(lounge[1])}</strong>`);
    } else if (lounge && minutes < toMinutes(lounge[0])) {
      // The café opens before the lounge, so in the morning we say when
      // the lounge will open.
      bits.push(`Cat lounge opens <strong>${fmt(lounge[0])}</strong>`);
    }

    // The green dot is a <span> styled in styles.css (.status-dot.is-open).
    // .join(...) glues the list items into one string, putting the
    // separator between each pair.
    html = `<span class="status-dot is-open"></span><strong>Open now</strong> <span class="today-bar__sep">·</span> ${bits.join(' <span class="today-bar__sep">·</span> ')}`;
  } else {
    // Closed: grey dot plus when the café opens next.
    html = `<span class="status-dot"></span><strong>Closed now</strong> <span class="today-bar__sep">·</span> Opens ${nextOpening(KB_HOURS.cafe, day, minutes)}`;
  }

  // innerHTML replaces everything inside the element with our new HTML.
  // (This is safe here because all the text comes from this file, not from
  // anything a visitor typed.)
  el.innerHTML = html;
}

// ------------------------------------
// renderHoursLists()
//
// Builds the "Café Hours" and "Cat Lounge Hours" lists in the footer, and
// highlights today's row in red.
//
// In the HTML, each list is an empty <ul> that says which schedule it wants:
//   <ul class="hours" data-hours="cafe"></ul>
//   <ul class="hours" data-hours="lounge"></ul>
// ------------------------------------
function renderHoursLists() {
  // We only need today's day number here, not the time.
  const { day } = cafeNow();

  // querySelectorAll finds EVERY matching element (querySelector only finds
  // the first). .forEach then runs the code once for each one found.
  document.querySelectorAll("[data-hours]").forEach((list) => {
    // list.dataset.hours reads the data-hours attribute: "cafe" or "lounge".
    // KB_HOURS["cafe"] is the same as KB_HOURS.cafe; square brackets let
    // us use a name that's stored in a variable.
    const schedule = KB_HOURS[list.dataset.hours];

    // KB_HOURS is stored Sunday-first, but the footer lists Monday first
    // (like the original site), so this is the order to display the days in.
    const order = [1, 2, 3, 4, 5, 6, 0];

    // .map turns each day number into a line of HTML, giving a new list of
    // seven <li> strings. .join("") glues them together with nothing in
    // between.
    list.innerHTML = order.map((d) => {
      const hrs = schedule[d];
      const text = hrs ? `${fmt(hrs[0])} – ${fmt(hrs[1])}` : "Closed";

      // If this row is today, add class="is-today" so the CSS colors it red.
      return `<li${d === day ? ' class="is-today"' : ""}><b>${DAY_NAMES[d]}</b> ${text}</li>`;
    }).join("");
  });
}


/* ====================================
   2. HEADER — shrink on scroll + mobile menu
  ==================================== */

function initHeader() {
  const header = document.querySelector(".site-header");
  if (!header) return;

  // ---- Shrinking header ------------------------------------
  //
  // When you scroll down, we add the class "is-scrolled" to the header. The
  // CSS then swaps the big logo for the small "Kitty Brew" wordmark and
  // makes the header shorter. Scroll back to the top and the class comes
  // off again.
  //
  // `threshold` is how many pixels you have to scroll before it switches.
  // It equals the height the header gives up when it shrinks (the full
  // height minus the small height), so the small header lines up exactly
  // with the page content and no gap appears.
  let threshold = 0;

  // Reads the two header heights from the CSS variables in styles.css
  // (--header-h and --header-h-small) and works out the threshold.
  // Reading them from the CSS means that if we ever change the header
  // sizes there, this keeps working without editing any JavaScript.
  const measure = () => {
    // getComputedStyle gives the styles the browser is actually using right
    // now. Our variables are defined on :root, which is the <html> element
    // (document.documentElement).
    const css = getComputedStyle(document.documentElement);

    // The values come back as text like "140px". parseFloat reads the number
    // at the start of the text and ignores the "px" → 140.
    threshold = parseFloat(css.getPropertyValue("--header-h")) - parseFloat(css.getPropertyValue("--header-h-small"));
  };

  // classList.toggle(name, condition) adds the class when the condition is
  // true and removes it when false. window.scrollY is how far down the page
  // has been scrolled, in pixels.
  const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > threshold);

  // Run both once right away, in case the page loads already scrolled down
  // (for example, after pressing the back button).
  measure();
  onScroll();

  // addEventListener("event", function) says "whenever this happens, run
  // this function". Here, run onScroll every time the page scrolls.
  // { passive: true } promises the browser we won't block scrolling, which
  // keeps scrolling smooth on phones.
  window.addEventListener("scroll", onScroll, { passive: true });

  // The header heights are different on phones (set in styles.css), so if
  // the window is resized, measure again.
  window.addEventListener("resize", () => {
    measure();
    onScroll();
  });

  // ---- Mobile (hamburger) menu ------------------------------------
  //
  // On small screens the menu links are hidden and the ☰ button shows
  // instead. Tapping it adds the class "is-open" to the list, and the CSS
  // slides the menu into view.
  const toggle = document.querySelector(".nav-toggle"); // the ☰ button
  const list = document.querySelector(".nav__list");    // the menu links
  if (!toggle || !list) return;

  // setOpen(true) opens the menu; setOpen(false) closes it.
  const setOpen = (open) => {
    list.classList.toggle("is-open", open);

    // aria-expanded tells screen readers (software that reads the page
    // aloud for blind visitors) whether the menu is currently open.
    // setAttribute needs text, so String(true) turns it into "true".
    toggle.setAttribute("aria-expanded", String(open));

    // Swap the icon: an ✕ when open, ☰ when closed. These are Font Awesome
    // icons, which are drawn by giving an <i> tag the right class names.
    toggle.innerHTML = open
      ? '<i class="fa-solid fa-xmark" aria-hidden="true"></i>'
      : '<i class="fa-solid fa-bars" aria-hidden="true"></i>';
  };

  // Tapping the button flips the menu: if it's open, close it, and if it's
  // closed, open it. `!` means "not", so this passes the opposite of the
  // menu's current state.
  toggle.addEventListener("click", () => setOpen(!list.classList.contains("is-open")));

  // Close the menu after a link inside it is tapped.
  // `e` is the "event" object the browser hands us, describing the click.
  // e.target is the exact element that was clicked, and .closest("a")
  // checks whether it is (or is inside) a link.
  list.addEventListener("click", (e) => {
    if (e.target.closest("a")) setOpen(false);
  });

  // Pressing the Escape key closes the menu too, for keyboard users.
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") setOpen(false);
  });
}


/* ====================================
   3. SCROLL REVEAL — sections fade in as they come into view
   ====================================
   Any element with class="reveal" starts invisible and slightly lower
   (see .reveal in styles.css). When it scrolls onto the screen we add
   "is-visible", and the CSS animates it into place.
   ==================================== */

function initReveal() {
  const items = document.querySelectorAll(".reveal");

  // IntersectionObserver is a built-in browser tool that tells us when an
  // element enters or leaves the screen. Very old browsers don't have it; in
  // that case just show everything immediately so nothing stays invisible.
  if (!("IntersectionObserver" in window)) {
    items.forEach((el) => el.classList.add("is-visible"));
    return;
  }

  // Create the observer. The function we give it runs whenever any watched
  // element crosses into or out of view. `entries` is a list describing
  // each element that changed.
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");

        // Once it has faded in, stop watching it, so it doesn't fade out and
        // back in every time you scroll past.
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 }); // trigger when 12% of the element is on screen

  // Start watching each .reveal element.
  items.forEach((el) => io.observe(el));
}


/* ====================================
   4. HOMEPAGE EXTRAS: random hero photo + random reviews
   ==================================== */

// ---------------------------------------------------------------------------
// HERO PHOTOS — a different one each visit.
// To add a photo: save it in images/photos/ (landscape works best, roughly
// 1600px wide, with the subject near the middle) and add its file name here.
// ---------------------------------------------------------------------------
const HERO_PHOTOS = [
  "hero-mural-calico.jpg",
  "hero-cat-tree.jpg",
  "hero-siamese-basket.jpg",
  "hero-fireplace-tent.jpg",
  "hero-black-cat.jpg",
  "hero-tabby.jpg",
  "hero-calico.jpg",
  "hero-cat-table.jpg",
  "hero-cat-drink.jpg"
];

function initHeroPhoto() {
  // The hero <img> has data-hero-photo on it. Its starting src is the photo
  // that shows if JavaScript is off; we swap it for a random one.
  const img = document.querySelector("[data-hero-photo]");
  if (!img) return; // not on the homepage

  // Math.random() gives a number from 0 up to (not including) 1. Multiplying
  // by the list length and rounding down with Math.floor gives a valid
  // position in the list: 0, 1, 2 … up to the last one.
  let pick = Math.floor(Math.random() * HERO_PHOTOS.length);

  // Handy for previewing: add ?hero=3 to the page address to always show the
  // third photo (counting from 1). URLSearchParams reads the part of the
  // address after the "?".
  const forced = parseInt(new URLSearchParams(location.search).get("hero"), 10);
  if (forced >= 1 && forced <= HERO_PHOTOS.length) pick = forced - 1;

  img.src = "images/photos/" + HERO_PHOTOS[pick];
}

// ---------------------------------------------------------------------------
// REVIEWS — show 3 of them, picked at random each visit.
// All the reviews are written in index.html. The CSS shows only the first 3
// (that's what visitors see if JavaScript is off), so this just shuffles the
// list and moves 3 random ones to the front.
// ---------------------------------------------------------------------------
function initReviews() {
  const list = document.querySelector("[data-reviews]");
  if (!list) return;

  const reviews = [...list.children];

  // "Fisher–Yates shuffle": walk backwards through the list, swapping each
  // item with a random one at or before it. It gives every order an equal
  // chance. `[a, b] = [b, a]` swaps two values in one line.
  for (let i = reviews.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [reviews[i], reviews[j]] = [reviews[j], reviews[i]];
  }

  // append() moves an element that's already on the page to the end of its
  // parent. Doing that for every review in shuffled order rebuilds the list
  // in the new order.
  reviews.forEach((review) => list.append(review));
}


/* ====================================
   5. MURAL BAND (above the footer, every page)
   ====================================
   Rather than copying ~50 <img> tags into all five pages, each page has an
   empty placeholder:
     <div class="band" data-mural-band data-art-path="../images/art/"></div>
   and this code fills it in. To change which pieces appear, edit the list
   below. To change a piece's size or position, edit its line in the CAT ART
   section at the bottom of css/styles.css (the class names match).
   ==================================== */

// Each entry: [class name, file name, layer]
// layer: "lf" = leaf (back), "fl" = flower (middle), "ct" = cat or prop
// (front), "ct up" = a cat in the higher "floating" row.
const MURAL_BAND = [
  ["band-leaf-01", "leaves-01.svg", "lf"], ["band-leaf-02", "leaves-06.svg", "lf"],
  ["band-leaf-03", "leaves-03.svg", "lf"], ["band-leaf-04", "leaves-02.svg", "lf"],
  ["band-leaf-05", "leaves-04.svg", "lf"], ["band-leaf-06", "leaves-06.svg", "lf"],
  ["band-leaf-07", "leaves-01.svg", "lf"], ["band-leaf-08", "leaves-02.svg", "lf"],
  ["band-leaf-09", "leaves-03.svg", "lf"], ["band-leaf-10", "leaves-04.svg", "lf"],

  ["band-flower-01", "flower-05.svg", "fl"], ["band-flower-02", "flower-03.svg", "fl"],
  ["band-flower-03", "flower-02.svg", "fl"], ["band-flower-04", "flower-04.svg", "fl"],
  ["band-flower-05", "flower-06.svg", "fl"], ["band-flower-06", "flower-01.svg", "fl"],
  ["band-flower-07", "flower-05.svg", "fl"], ["band-flower-08", "flower-03.svg", "fl"],
  ["band-flower-09", "flower-02.svg", "fl"], ["band-flower-10", "flower-06.svg", "fl"],
  ["band-flower-11", "flower-04.svg", "fl"], ["band-flower-12", "flower-01.svg", "fl"],

  ["band-cat-cookie", "cat-cookie.webp", "ct"],
  ["band-cat-peaches", "cat-peaches.webp", "ct up"],
  ["band-cat-in-box-02", "cat-in-box-02.webp", "ct"],
  ["band-cat-stretching", "cat-stretching.webp", "ct up"],
  ["band-cat-vlad", "cat-vlad.webp", "ct"],
  ["band-cat-string", "cat-string.webp", "ct up"],
  ["band-cat-behind-plant", "cat-behind-plant.webp", "ct"],
  ["band-cat-ivan", "cat-ivan.webp", "ct up"],
  ["band-cat-josie", "cat-josie.webp", "ct"],
  ["band-cat-napping", "cat-napping.webp", "ct up"],
  ["band-cat-treat-bag", "cat-treat-bag.webp", "ct"],
  ["band-cat-spilling-mug", "cat-spilling-mug.webp", "ct up"],
  ["band-cat-morticia", "cat-morticia.webp", "ct"],
  ["band-cat-in-box", "cat-in-box.webp", "ct"],

  ["band-toy-ball-1", "cat-toy-ball.svg", "ct"], ["band-fishbone-01", "fishbone-01.svg", "ct"],
  ["band-toy-fish-1", "cat-toy-fish.svg", "ct"], ["band-fishbone-02", "fishbone-02.svg", "ct"],
  ["band-toy-ball-2", "cat-toy-ball.svg", "ct"], ["band-toy-fish-2", "cat-toy-fish.svg", "ct"]
];

function initMuralBand() {
  const band = document.querySelector("[data-mural-band]");
  if (!band) return;

  // Pages in subfolders need "../images/art/", the homepage needs
  // "images/art/". Each page says which in its data-art-path attribute.
  const path = band.dataset.artPath || "images/art/";

  // .map() turns each entry into a string of HTML; .join("") glues them.
  // The [cls, file, layer] in the arrow function's parentheses unpacks each
  // three-item entry into three named variables (destructuring again).
  // loading="lazy" tells the browser it can wait to download these until the
  // visitor scrolls near the band, so the top of the page loads first.
  const imgs = MURAL_BAND.map(([cls, file, layer]) =>
    `<img class="${layer} ${cls}" src="${path}${file}" alt="" loading="lazy">`
  ).join("");

  band.innerHTML = `<div class="band-inner">${imgs}</div>`;
}


/* ====================================
   6. LIVE KITTY CAM (Kitty Cam page)
   ====================================
   The camera in the lounge streams video in a format called HLS
   ("HTTP Live Streaming"). The address below points to the stream's
   playlist (the .m3u8 file), which lists small chunks of video that the
   player downloads one after another.

   Safari and iPhones can play HLS on their own. Most other browsers (Chrome,
   Firefox, Edge) can't, so the Kitty Cam page also loads a free library
   called hls.js (see the <script> tags in the <head> of live/index.html),
   which teaches those browsers how to play it.
  ==================================== */

// The stream address, stored in one place so it's easy to update if the
// camera setup ever changes.
const CAM_STREAM = "https://kittybrew.lorexddns.net:8888/stream3/index.m3u8";

function initCam() {
  // `wrap` is the box around the video. Adding "is-offline" to it makes the
  // CSS show the "The Kitty Cam is napping" message over the player.
  const wrap = document.querySelector("[data-cam]");

  // getElementById finds the element with id="kittyCam", the <video> tag.
  const video = document.getElementById("kittyCam");

  if (!wrap || !video) return; // not on the Kitty Cam page

  // Tracks whether video is actually playing, so we don't show the
  // "napping" message over a working stream.
  let playing = false;

  // Show the offline message, but only if the video never started.
  const offline = () => {
    if (!playing) wrap.classList.add("is-offline");
  };

  // The <video> element fires a "playing" event once video is really
  // moving. When that happens, remember it and hide any offline message.
  video.addEventListener("playing", () => {
    playing = true;
    wrap.classList.remove("is-offline");
  });

  // Safety net: if nothing has started after 15 seconds (15,000 ms), assume
  // the camera is down and show the message. setTimeout runs a function
  // once after a delay (setInterval, used for the "Open now" bar, runs repeatedly).
  setTimeout(offline, 15000);

  // Now pick how to play the stream, trying the options in order:

  // Option 1: hls.js loaded and this browser supports it (Chrome, Firefox,
  // Edge). `window.Hls` only exists if the hls.js <script> tag loaded, so
  // we check that first to avoid an error if it didn't.
  if (window.Hls && window.Hls.isSupported()) {
    const hls = new window.Hls();   // create a player
    hls.loadSource(CAM_STREAM);     // tell it where the stream is
    hls.attachMedia(video);         // tell it which <video> to play in

    // hls.on(event, function) works like addEventListener, for hls.js's own
    // events. MANIFEST_PARSED means "I've read the playlist and I'm ready",
    // so start playing.
    //
    // video.play() returns a "Promise": a value that finishes later, and
    // might fail. Browsers can refuse to autoplay; .catch(() => {}) quietly
    // ignores that refusal instead of logging an error, and the visitor can
    // still press play themselves.
    hls.on(window.Hls.Events.MANIFEST_PARSED, () => video.play().catch(() => {}));

    // If hls.js hits an error it can't recover from (data.fatal), the stream
    // is down, so show the offline message.
    hls.on(window.Hls.Events.ERROR, (_, data) => {
      if (data.fatal) {
        playing = false;
        wrap.classList.add("is-offline");
      }
    });

  // Option 2: the browser can play HLS by itself (Safari, iPhone, iPad).
  // canPlayType returns "maybe" or "probably" if it can, or "" if it can't.
  } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
    video.src = CAM_STREAM;

    // loadedmetadata fires once the browser knows the video's size and
    // format, which is our cue to start playing.
    video.addEventListener("loadedmetadata", () => video.play().catch(() => {}));

    // If the stream can't be loaded at all, show the offline message.
    video.addEventListener("error", offline);

  // Option 3: no way to play the stream in this browser.
  } else {
    offline();
  }
}


/* ====================================
   START EVERYTHING
   ====================================
   "DOMContentLoaded" fires once the browser has read all of the page's HTML.
   (The DOM, or "Document Object Model", is the browser's version of the
   page that JavaScript can read and change.) We wait for it so every
   element we look for with querySelector actually exists by the time we
   look.
   ==================================== */

document.addEventListener("DOMContentLoaded", () => {
  renderTodayBar();   // "Open now / Closed now" bar
  renderHoursLists(); // footer hours

  // Refresh the "Open now" bar every minute (60 × 1000 milliseconds), so
  // someone who leaves the page open sees it change at opening or closing
  // time without reloading.
  setInterval(renderTodayBar, 60 * 1000);

  initHeader();   // shrinking header + mobile menu
  initReveal();   // fade-in sections
  initHeroPhoto(); // random hero photo (homepage only)
  initReviews();   // 3 random reviews (homepage only)
  initMuralBand(); // painted cats above the footer
  initCam();      // live video (only does anything on the Kitty Cam page)

  // Keep the copyright year in the footer current:
  // <span data-year>2026</span> becomes this year automatically.
  const y = document.querySelector("[data-year]");
  if (y) y.textContent = new Date().getFullYear();
});
