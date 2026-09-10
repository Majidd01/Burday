/* ============================================
   Midnight Birthday Party
   Customize everything in birthdayData below
   ============================================ */

const birthdayData = {
  name: "Zainab Aleem",

  /**
   * TEST MODE: unlocks automatically after N minutes from page load
   * so you can wait and see the full timer → party flow.
   * Set testMode: false and it will unlock at midnight instead.
   */
  testMode: false,
  testUnlockMinutes: 5,

  /** Used when testMode is false */
  unlockDateTime: null, // filled with tonight midnight if needed

  allowPreview: true,

  revealSub: "It’s your birthday, Zainab… and your hero brought cake 🎂🦇",

  partyHeading: "Happy Birthday, birthday girl! 🥳",

  heartfeltMessage:
    "Happy Birthday, Zainab ❤️\n\nI hope this year brings you happiness, success, peace, and countless reasons to smile.\n\nYou deserve all the good things coming your way.\n\nEnjoy your day — it’s all yours.",

  musicSrc: "music/song.wav",
};

function getTonightMidnightISO() {
  const d = new Date();
  d.setHours(24, 0, 0, 0);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T00:00:00`;
}

function getUnlockISO() {
  if (birthdayData.testMode) {
    const d = new Date(Date.now() + birthdayData.testUnlockMinutes * 60 * 1000);
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  }
  return birthdayData.unlockDateTime || getTonightMidnightISO();
}

const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)"
).matches;

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

let unlocked = false;
let countdownId = null;
let unlockAt = null;

document.addEventListener("DOMContentLoaded", () => {
  unlockAt = new Date(getUnlockISO()).getTime();
  applyConfig();
  buildStars();
  initLoader();
  initMusic();
  if (!prefersReducedMotion) initParticles();
  initCountdown();
  initCakeFlow();
});

function applyConfig() {
  const name = birthdayData.name;
  const map = {
    greeting: `Happy Birthday, ${name}! 🎂❤️`,
    revealSub: birthdayData.revealSub,
    partyHeading: birthdayData.partyHeading.replace(
      "birthday girl",
      name.split(" ")[0]
    ),
    girlLabel: name.split(" ")[0],
    heartfeltMessage: birthdayData.heartfeltMessage,
  };

  $$("[data-bind]").forEach((el) => {
    const key = el.getAttribute("data-bind");
    if (map[key] != null) el.textContent = map[key];
  });

  const audio = $("#bgMusic");
  if (audio && birthdayData.musicSrc) {
    audio.src = birthdayData.musicSrc;
    audio.load();
  }

  document.title = `Happy Birthday, ${name} 🎂`;

  if (birthdayData.testMode) {
    const title = $("#gateTitle");
    const sub = $("#gateSub");
    if (title) title.textContent = "A little test countdown…";
    if (sub) {
      sub.innerHTML = `For testing, this unlocks in <strong>${birthdayData.testUnlockMinutes} minutes</strong> — then the full surprise plays ✨`;
    }
  } else {
    const title = $("#gateTitle");
    const sub = $("#gateSub");
    if (title) title.textContent = "The surprise unlocks at midnight";
    if (sub) {
      sub.innerHTML =
        "When the clock hits <strong>12:00 AM</strong>, the party begins ✨";
    }
  }

  if (birthdayData.allowPreview) {
    const preview = $("#previewBtn");
    if (preview) preview.hidden = false;
  }
}

function buildStars() {
  const sky = $("#gateSky");
  if (!sky) return;
  const frag = document.createDocumentFragment();
  for (let i = 0; i < 48; i++) {
    const s = document.createElement("span");
    s.className = "star";
    const size = 1.5 + Math.random() * 3.5;
    s.style.width = `${size}px`;
    s.style.height = `${size}px`;
    s.style.left = `${Math.random() * 100}%`;
    s.style.top = `${Math.random() * 72}%`;
    s.style.animationDelay = `${Math.random() * 3}s`;
    s.style.animationDuration = `${1.8 + Math.random() * 2.4}s`;
    if (Math.random() > 0.82) s.classList.add("star--bright");
    frag.appendChild(s);
  }
  sky.insertBefore(frag, sky.firstChild);
}

function initLoader() {
  document.body.classList.add("is-locked");
  const loader = $("#loader");
  const wait = prefersReducedMotion ? 250 : 900;
  window.setTimeout(() => {
    loader?.classList.add("is-done");
    loader?.setAttribute("aria-busy", "false");
  }, wait);
}

/* ---------- Music ---------- */

function initMusic() {
  const btn = $("#musicToggle");
  const audio = $("#bgMusic");
  if (!btn || !audio) return;

  const candidates = [
    birthdayData.musicSrc,
    "music/song.wav",
    "music/song.mp3",
  ].filter(Boolean);

  let srcIndex = 0;
  const tryLoad = () => {
    if (srcIndex >= candidates.length) return;
    audio.src = candidates[srcIndex];
    audio.load();
  };
  tryLoad();
  audio.addEventListener("error", () => {
    srcIndex += 1;
    tryLoad();
  });

  const setPlaying = (on) => {
    btn.setAttribute("aria-pressed", on ? "true" : "false");
    btn.setAttribute(
      "aria-label",
      on ? "Pause background music" : "Play background music"
    );
    btn.classList.toggle("is-playing", on);
  };

  btn.addEventListener("click", async () => {
    try {
      if (audio.paused) {
        audio.volume = 0.55;
        await audio.play();
        setPlaying(true);
      } else {
        audio.pause();
        setPlaying(false);
      }
    } catch (err) {
      console.warn("Music play failed:", err);
      try {
        playFallbackChime();
        setPlaying(true);
        window.setTimeout(() => setPlaying(false), 1800);
      } catch {
        setPlaying(false);
      }
    }
  });

  audio.addEventListener("pause", () => setPlaying(false));
  audio.addEventListener("play", () => setPlaying(true));
}

function playFallbackChime() {
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return;
  const ctx = new Ctx();
  [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.value = 0.0001;
    osc.connect(gain);
    gain.connect(ctx.destination);
    const t = ctx.currentTime + i * 0.18;
    gain.gain.exponentialRampToValueAtTime(0.12, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
    osc.start(t);
    osc.stop(t + 0.4);
  });
}

/* ---------- Countdown ---------- */

function initCountdown() {
  $("#previewBtn")?.addEventListener("click", () => unlockParty("preview"));
  $("#unlockWishBtn")?.addEventListener("click", () => unlockParty("wish"));
  tickCountdown();
  countdownId = window.setInterval(tickCountdown, 250);
}

function showUnlockButton() {
  const unlockBtn = $("#unlockWishBtn");
  const preview = $("#previewBtn");
  const hint = $("#countdownHint");
  if (unlockBtn) {
    unlockBtn.hidden = false;
    unlockBtn.classList.add("is-ready");
  }
  if (preview) preview.hidden = true;
  if (hint) {
    hint.textContent = "Timer done! Tap below to start your wish 💫";
  }
  $("#gateTitle") && ($("#gateTitle").textContent = "Your surprise is ready");
  $("#gateSub") &&
    ($("#gateSub").innerHTML =
      "The wait is over — make a wish and continue ✨");
}

function tickCountdown() {
  const diff = unlockAt - Date.now();

  if (diff <= 0) {
    updateTimerDisplay(0, 0, 0);
    if (countdownId) {
      window.clearInterval(countdownId);
      countdownId = null;
    }
    // Don't auto-jump — show a clear button to start & move next
    if (!unlocked) showUnlockButton();
    return;
  }

  const totalSec = Math.floor(diff / 1000);
  const hours = Math.floor(totalSec / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;
  updateTimerDisplay(hours, minutes, seconds);

  const hint = $("#countdownHint");
  if (hours === 0 && minutes < 2) {
    hint.textContent = "Almost there… get ready! ✨";
  }
}

function updateTimerDisplay(hours, minutes = 0, seconds = 0) {
  const pad = (n) => String(n).padStart(2, "0");
  const h = $("#tHours");
  const m = $("#tMinutes");
  const s = $("#tSeconds");
  if (h) h.textContent = pad(hours);
  if (m) m.textContent = pad(minutes);
  if (s) s.textContent = pad(seconds);
}

function unlockParty(reason) {
  if (unlocked) return;
  unlocked = true;
  if (countdownId) window.clearInterval(countdownId);

  const gate = $("#countdownGate");
  const party = $("#party");
  const welcome = $("#welcome");

  gate?.classList.add("is-leaving");

  window.setTimeout(
    () => {
      if (gate) gate.style.display = "none";
      if (party) party.hidden = false;
      if (welcome) welcome.hidden = false;
      document.body.classList.remove("is-locked");
      burstConfetti($("#confettiWelcome"), prefersReducedMotion ? 28 : 110);
      window.scrollTo({ top: 0, behavior: "auto" });
    },
    prefersReducedMotion ? 80 : 650
  );

  void reason;
}

/* ---------- Cake + Teddy flow ---------- */

function initCakeFlow() {
  $("#startCakeBtn")?.addEventListener("click", () => {
    $("#welcome").hidden = true;
    const cake = $("#cakeScene");
    cake.hidden = false;
    cake.classList.add("is-entering");
    startFlowingHeroes();
    cake.scrollIntoView({
      behavior: prefersReducedMotion ? "auto" : "smooth",
      block: "start",
    });
  });

  $("#cutCakeBtn")?.addEventListener("click", runTeddySequence);

  $("#toHeroesBtn")?.addEventListener("click", () => {
    $("#cakeScene").hidden = true;
    showScene("heroesScene");
    const stage = $("#toyStage");
    stage?.classList.remove("is-partying");
    void stage?.offsetWidth;
    stage?.classList.add("is-partying");
    burstConfetti($("#confettiHeroes"), prefersReducedMotion ? 36 : 130, true);
  });

  $("#toMessageBtn")?.addEventListener("click", () => {
    $("#heroesScene").hidden = true;
    showScene("message");
  });
}

function showScene(id) {
  const el = $(`#${id}`);
  if (!el) return;
  el.hidden = false;
  el.scrollIntoView({
    behavior: prefersReducedMotion ? "auto" : "smooth",
    block: "start",
  });
}

function wait(ms) {
  return new Promise((resolve) =>
    window.setTimeout(resolve, prefersReducedMotion ? Math.min(ms, 120) : ms)
  );
}

async function showSpeech(text, ms = 2200) {
  const bubble = $("#teddySpeech");
  const label = $("#teddySpeechText");
  if (!bubble || !label) return;
  label.textContent = text;
  bubble.hidden = false;
  bubble.classList.remove("is-out");
  bubble.classList.add("is-in");
  await wait(ms);
  bubble.classList.remove("is-in");
  bubble.classList.add("is-out");
  await wait(350);
  bubble.hidden = true;
}

async function runTeddySequence() {
  const stage = $("#cakeStage");
  const btn = $("#cutCakeBtn");
  const status = $("#cakeStatus");
  const banner = $("#bdayBanner");

  if (!stage || stage.classList.contains("is-done")) return;

  btn.disabled = true;
  btn.style.display = "none";
  status.textContent = "Here comes your birthday hero… 🦇";

  stage.className = "cake-stage";
  void stage.offsetWidth;

  stage.classList.add("is-walking");
  await wait(2200);

  stage.classList.remove("is-walking");
  stage.classList.add("is-beside", "is-looking");
  status.textContent = "Birthday cake for Zainab… ready!";
  await wait(1100);

  stage.classList.add("is-knife");
  status.textContent = "Time to cut your cake…";
  await wait(750);

  stage.classList.add("is-cutting");
  status.textContent = "Make a birthday wish, Zainab… ✨";
  await wait(1000);

  stage.classList.add("is-blown");
  await wait(350);

  stage.classList.add("is-sliced", "is-sparkle");
  burstConfetti($("#confettiCake"), prefersReducedMotion ? 28 : 90);
  status.textContent = "Happy Birthday slice secured! 🍰🎉";
  await wait(1000);

  stage.classList.add("is-celebrate");
  await wait(600);

  await showSpeech("Happy Birthday, Zainab! 🎂🎉", 2200);
  await showSpeech("This whole cake is for you 🦇❤️", 2400);

  stage.classList.add("is-done");
  if (banner) {
    banner.hidden = false;
    banner.classList.add("is-show");
  }
  status.textContent = "";
}

/* ---------- Flowing Marvel icons ---------- */

const MARVEL_ICONS = ["🛡️", "⚡", "🤖", "💚", "🕷️", "🦇", "🏹", "🔴", "🟣", "❄️", "🪄", "🦸", "🦸‍♀️", "💥"];
let flowTimer = null;

function startFlowingHeroes() {
  const layer = $("#flowHeroes");
  if (!layer || prefersReducedMotion) return;
  layer.innerHTML = "";
  if (flowTimer) window.clearInterval(flowTimer);

  const spawn = () => {
    if (layer.childElementCount > 18) return;
    const el = document.createElement("span");
    el.className = "flow-icon";
    el.textContent = MARVEL_ICONS[(Math.random() * MARVEL_ICONS.length) | 0];
    const fromLeft = Math.random() > 0.5;
    const size = 1.1 + Math.random() * 1.1;
    el.style.fontSize = `${size}rem`;
    el.style.left = fromLeft
      ? `${2 + Math.random() * 16}%`
      : `${78 + Math.random() * 16}%`;
    el.style.top = `${110 + Math.random() * 20}%`;
    el.style.setProperty("--drift", `${(-40 + Math.random() * 80).toFixed(0)}px`);
    el.style.setProperty("--spin", `${(-25 + Math.random() * 50).toFixed(0)}deg`);
    el.style.animationDuration = `${6 + Math.random() * 5}s`;
    layer.appendChild(el);
    el.addEventListener("animationend", () => el.remove());
  };

  for (let i = 0; i < 6; i++) window.setTimeout(spawn, i * 280);
  flowTimer = window.setInterval(spawn, 700);
}

/* ---------- Confetti ---------- */

function burstConfetti(canvas, count = 80, longer = false) {
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const { width, height } = canvas.getBoundingClientRect();
  canvas.width = Math.max(1, Math.floor(width * dpr));
  canvas.height = Math.max(1, Math.floor(height * dpr));
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const colors = ["#ff7eb3", "#ffd76a", "#c4a1ff", "#ff4d8d", "#fff6fb", "#67e8f9"];
  const pieces = Array.from({ length: count }, () => ({
    x: Math.random() * width,
    y: -20 - Math.random() * 60,
    w: 4 + Math.random() * 6,
    h: 6 + Math.random() * 8,
    vx: -1.6 + Math.random() * 3.2,
    vy: 2 + Math.random() * 3.2,
    rot: Math.random() * Math.PI,
    vr: -0.14 + Math.random() * 0.28,
    color: colors[(Math.random() * colors.length) | 0],
    heart: Math.random() > 0.7,
  }));

  const start = performance.now();
  const duration = longer ? 4000 : 2600;

  function drawHeart(x, y, size) {
    ctx.beginPath();
    ctx.moveTo(x, y + size * 0.3);
    ctx.bezierCurveTo(x, y, x - size, y, x - size, y + size * 0.35);
    ctx.bezierCurveTo(
      x - size,
      y + size * 0.75,
      x,
      y + size * 1.1,
      x,
      y + size * 1.2
    );
    ctx.bezierCurveTo(
      x,
      y + size * 1.1,
      x + size,
      y + size * 0.75,
      x + size,
      y + size * 0.35
    );
    ctx.bezierCurveTo(x + size, y, x, y, x, y + size * 0.3);
    ctx.fill();
  }

  function frame(now) {
    const elapsed = now - start;
    ctx.clearRect(0, 0, width, height);
    pieces.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.04;
      p.rot += p.vr;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.globalAlpha = Math.max(0, 1 - elapsed / duration);
      ctx.fillStyle = p.color;
      if (p.heart) drawHeart(0, 0, p.w * 0.7);
      else ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    });
    if (elapsed < duration) requestAnimationFrame(frame);
    else ctx.clearRect(0, 0, width, height);
  }

  if (prefersReducedMotion) {
    pieces.slice(0, 10).forEach((p) => {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = 0.75;
      ctx.fillRect(p.x, height * 0.25, p.w, p.h);
    });
    window.setTimeout(() => ctx.clearRect(0, 0, width, height), 500);
    return;
  }

  requestAnimationFrame(frame);
}

/* ---------- Particles ---------- */

function initParticles() {
  const canvas = $("#particles");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  let w = 0;
  let h = 0;
  let raf = 0;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const dots = Array.from({ length: 24 }, () => ({
    x: Math.random(),
    y: Math.random(),
    r: 1 + Math.random() * 2,
    speed: 0.00012 + Math.random() * 0.0003,
    a: 0.15 + Math.random() * 0.35,
    heart: Math.random() > 0.8,
  }));

  function resize() {
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function drawHeart(x, y, size) {
    ctx.beginPath();
    ctx.moveTo(x, y + size * 0.3);
    ctx.bezierCurveTo(x, y, x - size, y, x - size, y + size * 0.35);
    ctx.bezierCurveTo(
      x - size,
      y + size * 0.75,
      x,
      y + size * 1.1,
      x,
      y + size * 1.2
    );
    ctx.bezierCurveTo(
      x,
      y + size * 1.1,
      x + size,
      y + size * 0.75,
      x + size,
      y + size * 0.35
    );
    ctx.bezierCurveTo(x + size, y, x, y, x, y + size * 0.3);
    ctx.fill();
  }

  function frame() {
    ctx.clearRect(0, 0, w, h);
    dots.forEach((p) => {
      p.y -= p.speed;
      if (p.y < -0.05) {
        p.y = 1.05;
        p.x = Math.random();
      }
      ctx.globalAlpha = p.a;
      ctx.fillStyle = p.heart ? "#ff7eb3" : "#ffd76a";
      if (p.heart) drawHeart(p.x * w, p.y * h, p.r * 2);
      else {
        ctx.beginPath();
        ctx.arc(p.x * w, p.y * h, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
    });
    raf = requestAnimationFrame(frame);
  }

  resize();
  frame();
  window.addEventListener("resize", resize, { passive: true });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) cancelAnimationFrame(raf);
    else raf = requestAnimationFrame(frame);
  });
}
