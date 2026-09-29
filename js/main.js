/* Kitty Brew Cat Café — site scripts */

// ---------------------------------------------------------------------------
// HOURS — edit here and the footer, "open today" bar, and status all update.
// Use 24-hour times. null = closed that day. Day 0 is Sunday.
// ---------------------------------------------------------------------------
const KB_HOURS = {
  cafe: [
    ["10:00", "16:30"], // Sunday
    ["8:30", "17:30"],  // Monday
    null,               // Tuesday
    ["8:30", "17:30"],  // Wednesday
    ["8:30", "17:30"],  // Thursday
    ["8:30", "18:30"],  // Friday
    ["9:00", "18:30"]   // Saturday
  ],
  lounge: [
    ["10:00", "17:00"],
    ["11:00", "18:00"],
    null,
    ["11:00", "18:00"],
    ["11:00", "18:00"],
    ["11:00", "19:00"],
    ["10:00", "19:00"]
  ]
};

const DAY_NAMES = ["Sundays", "Mondays", "Tuesdays", "Wednesdays", "Thursdays", "Fridays", "Saturdays"];
const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const toMinutes = (t) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
const fmt = (t) => {
  let [h, m] = t.split(":").map(Number);
  h = h % 12 || 12;
  return `${h}:${String(m).padStart(2, "0")}`;
};

// Current day/time in the café's time zone, regardless of where the visitor is.
function cafeNow() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York", weekday: "short", hour: "numeric", minute: "numeric", hourCycle: "h23"
  }).formatToParts(new Date());
  const get = (type) => parts.find((p) => p.type === type).value;
  return { day: DAY_SHORT.indexOf(get("weekday")), minutes: Number(get("hour")) * 60 + Number(get("minute")) };
}

function nextOpening(schedule, day, minutes) {
  for (let i = 0; i < 8; i++) {
    const d = (day + i) % 7;
    const hrs = schedule[d];
    if (hrs && (i > 0 || minutes < toMinutes(hrs[0]))) {
      const when = i === 0 ? "today" : i === 1 ? "tomorrow" : DAY_SHORT[d];
      return `${when} at ${fmt(hrs[0])}`;
    }
  }
  return "";
}

function renderTodayBar() {
  const el = document.querySelector("[data-today-status]");
  if (!el) return;
  const { day, minutes } = cafeNow();
  const cafe = KB_HOURS.cafe[day];
  const lounge = KB_HOURS.lounge[day];
  const cafeOpen = cafe && minutes >= toMinutes(cafe[0]) && minutes < toMinutes(cafe[1]);
  const loungeOpen = lounge && minutes >= toMinutes(lounge[0]) && minutes < toMinutes(lounge[1]);

  let html;
  if (cafeOpen || loungeOpen) {
    const bits = [];
    bits.push(cafeOpen ? `Café until <strong>${fmt(cafe[1])}</strong>` : "Café closed");
    if (loungeOpen) bits.push(`Cat lounge until <strong>${fmt(lounge[1])}</strong>`);
    else if (lounge && minutes < toMinutes(lounge[0])) bits.push(`Cat lounge opens <strong>${fmt(lounge[0])}</strong>`);
    html = `<span class="status-dot is-open"></span><strong>Open now</strong> <span class="today-bar__sep">·</span> ${bits.join(' <span class="today-bar__sep">·</span> ')}`;
  } else {
    html = `<span class="status-dot"></span><strong>Closed now</strong> <span class="today-bar__sep">·</span> Opens ${nextOpening(KB_HOURS.cafe, day, minutes)}`;
  }
  el.innerHTML = html;
}

function renderHoursLists() {
  const { day } = cafeNow();
  document.querySelectorAll("[data-hours]").forEach((list) => {
    const schedule = KB_HOURS[list.dataset.hours];
    // Start the week on Monday, like the original site.
    const order = [1, 2, 3, 4, 5, 6, 0];
    list.innerHTML = order.map((d) => {
      const hrs = schedule[d];
      const text = hrs ? `${fmt(hrs[0])} – ${fmt(hrs[1])}` : "Closed";
      return `<li${d === day ? ' class="is-today"' : ""}><b>${DAY_NAMES[d]}</b> ${text}</li>`;
    }).join("");
  });
}

// ---------------------------------------------------------------------------
// Header: shrink on scroll + mobile menu
// ---------------------------------------------------------------------------
function initHeader() {
  const header = document.querySelector(".site-header");
  if (!header) return;
  // Shrink once the page has scrolled past the height the header gives up,
  // so the smaller header lines up with the content with no gap.
  let threshold = 0;
  const measure = () => {
    const css = getComputedStyle(document.documentElement);
    threshold = parseFloat(css.getPropertyValue("--header-h")) - parseFloat(css.getPropertyValue("--header-h-small"));
  };
  const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > threshold);
  measure();
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", () => { measure(); onScroll(); });

  const toggle = document.querySelector(".nav-toggle");
  const list = document.querySelector(".nav__list");
  if (!toggle || !list) return;
  const setOpen = (open) => {
    list.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.innerHTML = open ? '<i class="fa-solid fa-xmark" aria-hidden="true"></i>' : '<i class="fa-solid fa-bars" aria-hidden="true"></i>';
  };
  toggle.addEventListener("click", () => setOpen(!list.classList.contains("is-open")));
  list.addEventListener("click", (e) => { if (e.target.closest("a")) setOpen(false); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") setOpen(false); });
}

// ---------------------------------------------------------------------------
// Fade sections in as they scroll into view
// ---------------------------------------------------------------------------
function initReveal() {
  const items = document.querySelectorAll(".reveal");
  if (!("IntersectionObserver" in window)) { items.forEach((el) => el.classList.add("is-visible")); return; }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) { entry.target.classList.add("is-visible"); io.unobserve(entry.target); }
    });
  }, { threshold: 0.12 });
  items.forEach((el) => io.observe(el));
}

// ---------------------------------------------------------------------------
// Testimonials carousel
// ---------------------------------------------------------------------------
function initCarousel() {
  const track = document.querySelector(".carousel__track");
  if (!track) return;
  const slides = [...track.children];
  const dots = document.querySelector(".carousel__dots");
  let current = 0;
  let timer;

  slides.forEach((_, i) => {
    const b = document.createElement("button");
    b.type = "button";
    b.setAttribute("aria-label", `Show review ${i + 1}`);
    b.addEventListener("click", () => { goTo(i); restart(); });
    dots.appendChild(b);
  });

  function mark(i) {
    current = i;
    slides.forEach((s, j) => s.classList.toggle("is-active", j === i));
    [...dots.children].forEach((d, j) => d.setAttribute("aria-current", String(j === i)));
  }

  function goTo(i) {
    const s = slides[i];
    track.scrollTo({ left: s.offsetLeft - (track.clientWidth - s.clientWidth) / 2 });
    mark(i);
  }

  // Keep the highlighted card in sync when people swipe.
  let raf;
  track.addEventListener("scroll", () => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      const mid = track.scrollLeft + track.clientWidth / 2;
      let best = 0, bestDist = Infinity;
      slides.forEach((s, j) => {
        const d = Math.abs(s.offsetLeft + s.clientWidth / 2 - mid);
        if (d < bestDist) { bestDist = d; best = j; }
      });
      if (best !== current) mark(best);
    });
  }, { passive: true });

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function restart() {
    clearInterval(timer);
    if (!reduce) timer = setInterval(() => goTo((current + 1) % slides.length), 6000);
  }
  track.addEventListener("pointerdown", () => clearInterval(timer));
  track.addEventListener("mouseenter", () => clearInterval(timer));
  track.addEventListener("mouseleave", restart);

  mark(0);
  requestAnimationFrame(() => goTo(0));
  restart();
}

// ---------------------------------------------------------------------------
// Live Kitty Cam (only on the Kitty Cam page)
// ---------------------------------------------------------------------------
const CAM_STREAM = "https://kittybrew.lorexddns.net:8888/stream3/index.m3u8";

function initCam() {
  const wrap = document.querySelector("[data-cam]");
  const video = document.getElementById("kittyCam");
  if (!wrap || !video) return;

  let playing = false;
  const offline = () => { if (!playing) wrap.classList.add("is-offline"); };
  video.addEventListener("playing", () => { playing = true; wrap.classList.remove("is-offline"); });
  // If the stream hasn't started after 15 seconds, show the "napping" message.
  setTimeout(offline, 15000);

  if (window.Hls && window.Hls.isSupported()) {
    const hls = new window.Hls();
    hls.loadSource(CAM_STREAM);
    hls.attachMedia(video);
    hls.on(window.Hls.Events.MANIFEST_PARSED, () => video.play().catch(() => {}));
    hls.on(window.Hls.Events.ERROR, (_, data) => { if (data.fatal) { playing = false; wrap.classList.add("is-offline"); } });
  } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
    // Safari and iPhones play the stream natively.
    video.src = CAM_STREAM;
    video.addEventListener("loadedmetadata", () => video.play().catch(() => {}));
    video.addEventListener("error", offline);
  } else {
    offline();
  }
}

document.addEventListener("DOMContentLoaded", () => {
  renderTodayBar();
  renderHoursLists();
  setInterval(renderTodayBar, 60 * 1000);
  initHeader();
  initReveal();
  initCarousel();
  initCam();
  const y = document.querySelector("[data-year]");
  if (y) y.textContent = new Date().getFullYear();
});
