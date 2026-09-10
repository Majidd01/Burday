/* ============================================
   Gaming Room Birthday Story
   Three.js room + GSAP ScrollTrigger
   ============================================ */

const birthdayData = {
  name: "Zainab Aleem",
  firstName: "Zainab",
  musicSrc: "music/song.wav",
  lockCode: "7577",
};

const LOCK_STORAGE_KEY = "birthday-quest-unlocked";

const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)"
).matches;

const $ = (sel, root = document) => root.querySelector(sel);

/* ---------- Mobile: ask to rotate for widescreen ---------- */

function initRotateHint() {
  const hint = $("#rotateHint");
  if (!hint) return;

  const update = () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const isTouch =
      window.matchMedia("(hover: none) and (pointer: coarse)").matches ||
      navigator.maxTouchPoints > 0;
    const isNarrow = Math.min(w, h) <= 768;
    const isMobile = isNarrow || (isTouch && w < 1024);
    const isPortrait = h >= w;
    // Show when landing on mobile in portrait — ask for widescreen
    const show = isMobile && isPortrait;
    hint.classList.toggle("is-visible", show);
    hint.setAttribute("aria-hidden", show ? "false" : "true");
    document.body.classList.toggle("is-rotate-locked", show);
  };

  update();
  window.addEventListener("resize", update, { passive: true });
  window.addEventListener("orientationchange", () => {
    window.setTimeout(update, 120);
  });
}

/* ---------- Canvas helpers: screens + LEGO heroes ---------- */

function makeWishTexture(lines, theme = "cyan") {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 320;
  const ctx = c.getContext("2d");
  const themes = {
    cyan: ["#061018", "#0b2a36", "#2de2e6", "#ffffff"],
    pink: ["#140814", "#3a1028", "#ff2e97", "#ffe3f1"],
    gold: ["#141006", "#3a2a08", "#ffd166", "#fff6d6"],
    lime: ["#08140a", "#1a3a12", "#b6ff3b", "#f3ffe0"],
  };
  const [bg1, bg2, accent, text] = themes[theme] || themes.cyan;

  const grad = ctx.createLinearGradient(0, 0, 512, 320);
  grad.addColorStop(0, bg1);
  grad.addColorStop(1, bg2);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 320);

  // birthday confetti dots
  for (let i = 0; i < 40; i++) {
    ctx.fillStyle = i % 2 ? accent : text;
    ctx.globalAlpha = 0.25 + Math.random() * 0.4;
    ctx.beginPath();
    ctx.arc(Math.random() * 512, Math.random() * 320, 2 + Math.random() * 4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  ctx.strokeStyle = accent;
  ctx.lineWidth = 8;
  ctx.strokeRect(14, 14, 484, 292);

  ctx.fillStyle = accent;
  ctx.font = "700 22px Outfit, sans-serif";
  ctx.fillText("🎂 BIRTHDAY STREAM", 36, 56);

  ctx.fillStyle = text;
  ctx.font = "800 42px Orbitron, sans-serif";
  let y = 120;
  lines.forEach((line, idx) => {
    ctx.font = idx === 0 ? "800 46px Orbitron, sans-serif" : "600 28px Outfit, sans-serif";
    ctx.fillStyle = idx === 0 ? accent : text;
    ctx.fillText(line, 36, y);
    y += idx === 0 ? 58 : 40;
  });

  ctx.fillStyle = accent;
  ctx.globalAlpha = 0.9;
  ctx.font = "700 20px Outfit, sans-serif";
  ctx.fillText("Press START to celebrate →", 36, 280);
  ctx.globalAlpha = 1;

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

function makeLegoTexture(hero) {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 384;
  const ctx = c.getContext("2d");
  // transparent bg
  ctx.clearRect(0, 0, 256, 384);

  const presets = {
    spidey: {
      head: "#c62828",
      torso: "#c62828",
      torso2: "#1565c0",
      legs: "#1565c0",
      arms: "#c62828",
      hands: "#c62828",
      eyes: "#ffffff",
      emblem: null,
      detail: "web",
    },
    ironman: {
      head: "#c62828",
      torso: "#c62828",
      torso2: "#f9a825",
      legs: "#c62828",
      arms: "#c62828",
      hands: "#f9a825",
      eyes: "#80d8ff",
      emblem: "arc",
      detail: null,
    },
    hulk: {
      head: "#43a047",
      torso: "#43a047",
      torso2: "#43a047",
      legs: "#6a1b9a",
      arms: "#43a047",
      hands: "#43a047",
      eyes: "#fff",
      emblem: null,
      detail: "angry",
    },
    thor: {
      head: "#ffcc80",
      hair: "#f9a825",
      torso: "#37474f",
      torso2: "#c62828",
      legs: "#37474f",
      arms: "#ffcc80",
      hands: "#ffcc80",
      eyes: "#222",
      emblem: "cape",
      detail: "hammer",
    },
    cap: {
      head: "#ffcc80",
      torso: "#1565c0",
      torso2: "#c62828",
      legs: "#1565c0",
      arms: "#1565c0",
      hands: "#ffcc80",
      eyes: "#222",
      emblem: "star",
      detail: "shield",
    },
    widow: {
      head: "#ffcc80",
      hair: "#212121",
      torso: "#212121",
      torso2: "#b71c1c",
      legs: "#212121",
      arms: "#212121",
      hands: "#ffcc80",
      eyes: "#222",
      emblem: null,
      detail: null,
    },
    batwoman: {
      head: "#0a0a0a",
      // no hair — full black cowl like LEGO Batwoman
      torso: "#111111",
      torso2: "#f5c518",
      legs: "#111111",
      arms: "#111111",
      hands: "#111111",
      eyes: "#ffffff",
      emblem: "bat",
      detail: "cowl",
    },
  };

  const p = presets[hero] || presets.spidey;
  const cx = 128;

  // cape (thor)
  if (p.emblem === "cape") {
    ctx.fillStyle = "#c62828";
    ctx.beginPath();
    ctx.moveTo(70, 140);
    ctx.lineTo(40, 300);
    ctx.lineTo(90, 280);
    ctx.lineTo(128, 160);
    ctx.lineTo(166, 280);
    ctx.lineTo(216, 300);
    ctx.lineTo(186, 140);
    ctx.closePath();
    ctx.fill();
  }

  // legs
  ctx.fillStyle = p.legs;
  roundRect(ctx, 88, 250, 32, 70, 6);
  roundRect(ctx, 136, 250, 32, 70, 6);
  ctx.fillStyle = "#111";
  roundRect(ctx, 84, 312, 40, 14, 4);
  roundRect(ctx, 132, 312, 40, 14, 4);

  // hips / belt
  ctx.fillStyle = p.torso2 || p.torso;
  roundRect(ctx, 86, 236, 84, 22, 6);

  // torso
  ctx.fillStyle = p.torso;
  ctx.beginPath();
  ctx.moveTo(86, 140);
  ctx.lineTo(170, 140);
  ctx.lineTo(176, 240);
  ctx.lineTo(80, 240);
  ctx.closePath();
  ctx.fill();

  // torso secondary band
  ctx.fillStyle = p.torso2;
  ctx.fillRect(86, 190, 84, 18);

  if (p.emblem === "arc") {
    ctx.fillStyle = "#80d8ff";
    ctx.beginPath();
    ctx.arc(cx, 175, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  if (p.emblem === "star") {
    ctx.fillStyle = "#fff";
    drawStar(ctx, cx, 175, 5, 14, 6);
  }
  if (p.emblem === "bat") {
    ctx.fillStyle = "#f5c518";
    ctx.beginPath();
    ctx.ellipse(cx, 175, 22, 14, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#0a0a0a";
    ctx.beginPath();
    ctx.moveTo(cx, 186);
    ctx.quadraticCurveTo(cx - 18, 168, cx - 26, 162);
    ctx.quadraticCurveTo(cx - 10, 166, cx - 8, 172);
    ctx.quadraticCurveTo(cx - 4, 158, cx, 154);
    ctx.quadraticCurveTo(cx + 4, 158, cx + 8, 172);
    ctx.quadraticCurveTo(cx + 10, 166, cx + 26, 162);
    ctx.quadraticCurveTo(cx + 18, 168, cx, 186);
    ctx.fill();
  }
  if (p.detail === "web") {
    ctx.strokeStyle = "rgba(0,0,0,0.35)";
    ctx.lineWidth = 2;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(100 + i * 14, 150);
      ctx.quadraticCurveTo(cx, 190, 100 + i * 14, 230);
      ctx.stroke();
    }
  }

  // arms
  ctx.fillStyle = p.arms;
  roundRect(ctx, 52, 148, 28, 78, 10);
  roundRect(ctx, 176, 148, 28, 78, 10);
  ctx.fillStyle = p.hands;
  ctx.beginPath();
  ctx.arc(66, 236, 12, 0, Math.PI * 2);
  ctx.arc(190, 236, 12, 0, Math.PI * 2);
  ctx.fill();

  // neck
  ctx.fillStyle = p.head;
  roundRect(ctx, 116, 126, 24, 16, 3);

  // head
  ctx.fillStyle = p.head;
  roundRect(ctx, 96, 58, 64, 72, 10);

  // hair
  if (p.hair) {
    ctx.fillStyle = p.hair;
    if (hero === "thor") {
      roundRect(ctx, 90, 52, 76, 28, 8);
      ctx.fillRect(88, 70, 14, 50);
      ctx.fillRect(154, 70, 14, 50);
    } else {
      roundRect(ctx, 94, 50, 68, 26, 8);
      ctx.fillRect(92, 70, 12, 40);
      ctx.fillRect(152, 70, 12, 40);
    }
  }

  // eyes (skip batwoman — cowl draws lenses)
  ctx.fillStyle = p.eyes;
  if (hero === "spidey" || hero === "ironman") {
    ctx.beginPath();
    ctx.ellipse(114, 92, 12, 8, 0, 0, Math.PI * 2);
    ctx.ellipse(142, 92, 12, 8, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (hero !== "batwoman") {
    ctx.fillRect(110, 88, 10, 10);
    ctx.fillRect(136, 88, 10, 10);
    ctx.fillStyle = "#5d4037";
    ctx.fillRect(118, 112, 20, 4);
  }

  if (p.detail === "cowl") {
    // Full black Batwoman cowl (no red hair)
    ctx.fillStyle = "#0a0a0a";
    roundRect(ctx, 94, 48, 68, 82, 12);
    // bat ears
    ctx.beginPath();
    ctx.moveTo(102, 54);
    ctx.lineTo(110, 22);
    ctx.lineTo(118, 54);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(138, 54);
    ctx.lineTo(146, 22);
    ctx.lineTo(154, 54);
    ctx.closePath();
    ctx.fill();
    // white eye lenses
    ctx.fillStyle = "#f5f5f5";
    ctx.beginPath();
    ctx.ellipse(114, 88, 11, 7, -0.15, 0, Math.PI * 2);
    ctx.ellipse(142, 88, 11, 7, 0.15, 0, Math.PI * 2);
    ctx.fill();
  }

  if (p.detail === "angry") {
    ctx.strokeStyle = "#1b5e20";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(108, 82);
    ctx.lineTo(122, 88);
    ctx.moveTo(148, 82);
    ctx.lineTo(134, 88);
    ctx.stroke();
  }

  // shield for cap
  if (p.detail === "shield") {
    ctx.fillStyle = "#c62828";
    ctx.beginPath();
    ctx.arc(198, 200, 28, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#1565c0";
    ctx.beginPath();
    ctx.arc(198, 200, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fff";
    drawStar(ctx, 198, 200, 5, 10, 4);
  }

  // hammer for thor
  if (p.detail === "hammer") {
    ctx.fillStyle = "#90a4ae";
    roundRect(ctx, 198, 200, 36, 22, 3);
    ctx.fillStyle = "#6d4c41";
    roundRect(ctx, 210, 222, 10, 40, 2);
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

function roundRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
  ctx.fill();
}

function drawStar(ctx, x, y, spikes, outer, inner) {
  let rot = (Math.PI / 2) * 3;
  let cx = x;
  let cy = y;
  const step = Math.PI / spikes;
  ctx.beginPath();
  ctx.moveTo(cx, cy - outer);
  for (let i = 0; i < spikes; i++) {
    ctx.lineTo(cx + Math.cos(rot) * outer, cy + Math.sin(rot) * outer);
    rot += step;
    ctx.lineTo(cx + Math.cos(rot) * inner, cy + Math.sin(rot) * inner);
    rot += step;
  }
  ctx.lineTo(cx, cy - outer);
  ctx.closePath();
  ctx.fill();
}

function makeBalloonMesh(color) {
  const g = new THREE.Group();
  const ball = new THREE.Mesh(
    new THREE.SphereGeometry(0.18, 16, 16),
    new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 0.25,
      roughness: 0.35,
    })
  );
  ball.scale.y = 1.15;
  g.add(ball);
  const string = new THREE.Mesh(
    new THREE.CylinderGeometry(0.008, 0.008, 0.55, 6),
    new THREE.MeshBasicMaterial({ color: 0xffffff })
  );
  string.position.y = -0.45;
  g.add(string);
  return g;
}

/* ---------- Lock gate (PIN 7577) ---------- */

function isPartyUnlocked() {
  try {
    return sessionStorage.getItem(LOCK_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function markPartyUnlocked() {
  try {
    sessionStorage.setItem(LOCK_STORAGE_KEY, "1");
  } catch {
    /* ignore private-mode storage failures */
  }
}

function openLockGate() {
  const gate = $("#lockGate");
  if (!gate) return;
  gate.classList.remove("is-open");
  document.body.classList.add("is-locked");
  window.setTimeout(() => $("#lockPin")?.focus(), 80);
}

function closeLockGate() {
  const gate = $("#lockGate");
  if (gate) gate.classList.add("is-open");
  document.body.classList.remove("is-locked");
}

function initLockGate() {
  const gate = $("#lockGate");
  const form = $("#lockForm");
  const input = $("#lockPin");
  const error = $("#lockError");
  if (!gate || !form || !input) return;

  if (isPartyUnlocked()) {
    closeLockGate();
    return;
  }

  openLockGate();

  const showError = () => {
    if (error) error.hidden = false;
    gate.classList.remove("is-shake");
    void gate.offsetWidth;
    gate.classList.add("is-shake");
    input.value = "";
    input.focus();
  };

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const code = String(input.value || "").trim();
    if (code === birthdayData.lockCode) {
      if (error) error.hidden = true;
      markPartyUnlocked();
      closeLockGate();
      return;
    }
    showError();
  });

  input.addEventListener("input", () => {
    if (error) error.hidden = true;
    input.value = input.value.replace(/\D/g, "").slice(0, 4);
  });
}

/* ---------- Boot ---------- */

document.addEventListener("DOMContentLoaded", async () => {
  document.body.classList.add("is-loading");
  applyCopy();
  initRotateHint();
  initMusic();

  const room = await initRoom();
  if (!prefersReducedMotion) {
    initStory(room);
  } else {
    initReducedStory(room);
  }

  window.setTimeout(() => {
    $("#loader")?.classList.add("is-done");
    $("#loader")?.setAttribute("aria-busy", "false");
    document.body.classList.remove("is-loading");
    initLockGate();
  }, prefersReducedMotion ? 200 : 900);
});

function applyCopy() {
  document.querySelectorAll("[data-first]").forEach((el) => {
    el.textContent = birthdayData.firstName;
  });
  const titleName = $(".birthday-title__name");
  if (titleName) titleName.textContent = birthdayData.firstName;
  const finaleH2 = $("#ch-finale h2");
  if (finaleH2) finaleH2.textContent = `Happy Birthday, ${birthdayData.name}`;
  document.title = `Happy Birthday, ${birthdayData.firstName} 🎂`;
}

/* ---------- Music ---------- */

function initMusic() {
  const btn = $("#musicToggle");
  const audio = $("#bgMusic");
  if (!btn || !audio) return;

  if (birthdayData.musicSrc) {
    audio.src = birthdayData.musicSrc;
    audio.load();
  }

  const setPlaying = (on) => {
    btn.setAttribute("aria-pressed", on ? "true" : "false");
    btn.setAttribute("aria-label", on ? "Pause music" : "Play music");
  };

  btn.addEventListener("click", async () => {
    try {
      if (audio.paused) {
        audio.volume = 0.5;
        await audio.play();
        setPlaying(true);
      } else {
        audio.pause();
        setPlaying(false);
      }
    } catch {
      setPlaying(false);
    }
  });
}

/* ---------- Three.js gaming room ---------- */

async function initRoom() {
  const canvas = $("#room");
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x07090f, 0.045);

  const isMobile = window.matchMedia("(max-width: 768px)").matches;
  const isTiny = window.matchMedia("(max-width: 480px)").matches;

  const camera = new THREE.PerspectiveCamera(
    isMobile ? 62 : 55,
    window.innerWidth / Math.max(window.innerHeight, 1),
    0.1,
    100
  );
  camera.position.set(0, 1.5, isMobile ? 9.2 : 8.5);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: !isMobile,
    alpha: false,
    powerPreference: isMobile ? "low-power" : "high-performance",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x07090f, 1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  // Lights
  scene.add(new THREE.AmbientLight(0x6a7a9a, 0.35));
  const key = new THREE.DirectionalLight(0xffffff, 0.55);
  key.position.set(2, 6, 4);
  scene.add(key);

  const cyan = new THREE.PointLight(0x2de2e6, 2.2, 14);
  cyan.position.set(-2.2, 2.2, -1);
  scene.add(cyan);

  const magenta = new THREE.PointLight(0xff2e97, 1.8, 12);
  magenta.position.set(2.4, 1.8, 0.5);
  scene.add(magenta);

  const gold = new THREE.PointLight(0xffd166, 1.2, 8);
  gold.position.set(0, 1.6, -1.8);
  scene.add(gold);

  // Extra warm cozy lamp light
  const warmLamp = new THREE.PointLight(0xffb070, 1.4, 7);
  warmLamp.position.set(4.2, 1.5, 1.5);
  scene.add(warmLamp);

  const softFill = new THREE.PointLight(0xffc8a0, 0.55, 10);
  softFill.position.set(-1, 2.4, 2);
  scene.add(softFill);

  // Roof wash — lights aimed at the ceiling so it isn't a black void
  const roofWash = new THREE.PointLight(0xe8f0ff, 2.8, 16);
  roofWash.position.set(0, 2.85, -1);
  scene.add(roofWash);

  const roofCyan = new THREE.PointLight(0x2de2e6, 1.6, 10);
  roofCyan.position.set(-2.5, 2.9, -2.5);
  scene.add(roofCyan);

  const roofMagenta = new THREE.PointLight(0xff2e97, 1.4, 10);
  roofMagenta.position.set(2.5, 2.9, -2.5);
  scene.add(roofMagenta);

  const roofGold = new THREE.PointLight(0xffd166, 1.2, 9);
  roofGold.position.set(0, 2.9, 1.5);
  scene.add(roofGold);

  // Room shell
  const roomGroup = new THREE.Group();
  scene.add(roomGroup);

  const wallMat = new THREE.MeshStandardMaterial({
    color: 0x121826,
    roughness: 0.88,
    metalness: 0.1,
  });
  const floorMat = new THREE.MeshStandardMaterial({
    color: 0x14101a,
    roughness: 0.82,
    metalness: 0.12,
  });
  const accentMat = new THREE.MeshStandardMaterial({
    color: 0x1a2236,
    roughness: 0.6,
    metalness: 0.25,
  });

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(12, 14), floorMat);
  floor.rotation.x = -Math.PI / 2;
  roomGroup.add(floor);

  const ceilingMat = new THREE.MeshStandardMaterial({
    color: 0x1a2236,
    roughness: 0.78,
    metalness: 0.15,
  });
  const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(12, 14), ceilingMat);
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.y = 3.2;
  roomGroup.add(ceiling);

  const back = new THREE.Mesh(new THREE.PlaneGeometry(12, 3.2), wallMat);
  back.position.set(0, 1.6, -5);
  roomGroup.add(back);

  const left = new THREE.Mesh(new THREE.PlaneGeometry(14, 3.2), wallMat);
  left.rotation.y = Math.PI / 2;
  left.position.set(-6, 1.6, 0);
  roomGroup.add(left);

  const right = new THREE.Mesh(new THREE.PlaneGeometry(14, 3.2), wallMat);
  right.rotation.y = -Math.PI / 2;
  right.position.set(6, 1.6, 0);
  roomGroup.add(right);

  // LED strips
  const ledGeo = new THREE.BoxGeometry(0.06, 0.06, 8);
  const ledCyan = new THREE.Mesh(
    ledGeo,
    new THREE.MeshStandardMaterial({
      color: 0x2de2e6,
      emissive: 0x2de2e6,
      emissiveIntensity: 2.4,
    })
  );
  ledCyan.position.set(-5.7, 2.7, -1);
  roomGroup.add(ledCyan);

  const ledMagenta = ledCyan.clone();
  ledMagenta.material = new THREE.MeshStandardMaterial({
    color: 0xff2e97,
    emissive: 0xff2e97,
    emissiveIntensity: 2.2,
  });
  ledMagenta.position.set(5.7, 2.7, -1);
  roomGroup.add(ledMagenta);

  // Ceiling LED rails + soft panels
  const roofLedGeo = new THREE.BoxGeometry(9, 0.05, 0.08);
  [
    { z: -3.8, color: 0x2de2e6, intensity: 2.6 },
    { z: -1.2, color: 0xffd166, intensity: 2.2 },
    { z: 1.4, color: 0xff2e97, intensity: 2.4 },
  ].forEach(({ z, color, intensity }) => {
    const rail = new THREE.Mesh(
      roofLedGeo,
      new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: intensity,
      })
    );
    rail.position.set(0, 3.12, z);
    roomGroup.add(rail);
  });

  if (!isTiny) {
    [
      [-2.2, -2.4, 0x88a0ff],
      [2.2, -2.4, 0xff9ad5],
      [0, 0.2, 0xffe0a0],
    ].forEach(([x, z, color]) => {
      const panel = new THREE.Mesh(
        new THREE.PlaneGeometry(1.6, 1.1),
        new THREE.MeshStandardMaterial({
          color,
          emissive: color,
          emissiveIntensity: 0.55,
          side: THREE.DoubleSide,
        })
      );
      panel.rotation.x = Math.PI / 2;
      panel.position.set(x, 3.14, z);
      roomGroup.add(panel);
    });
  }

  // Door (outside start)
  const doorGroup = new THREE.Group();
  doorGroup.position.set(0, 0, 5.8);
  roomGroup.add(doorGroup);

  const doorFrame = new THREE.Mesh(
    new THREE.BoxGeometry(2.2, 3, 0.25),
    accentMat
  );
  doorFrame.position.y = 1.5;
  doorGroup.add(doorFrame);

  const door = new THREE.Mesh(
    new THREE.BoxGeometry(1.8, 2.6, 0.12),
    new THREE.MeshStandardMaterial({
      color: 0x24304a,
      roughness: 0.45,
      metalness: 0.35,
    })
  );
  door.position.set(0, 1.35, 0.1);
  doorGroup.add(door);

  const knob = new THREE.Mesh(
    new THREE.SphereGeometry(0.07, 16, 16),
    new THREE.MeshStandardMaterial({
      color: 0xffd166,
      emissive: 0xffd166,
      emissiveIntensity: 0.6,
      metalness: 0.8,
      roughness: 0.25,
    })
  );
  knob.position.set(0.7, 1.3, 0.2);
  doorGroup.add(knob);

  // Gaming desk + birthday wish monitors
  const desk = new THREE.Mesh(
    new THREE.BoxGeometry(3.2, 0.12, 1.1),
    new THREE.MeshStandardMaterial({ color: 0x171c2a, roughness: 0.4, metalness: 0.3 })
  );
  desk.position.set(-2.4, 0.85, -3.4);
  roomGroup.add(desk);

  const wishScreens = [
    {
      x: -3.05,
      y: 1.48,
      z: -3.52,
      theme: "pink",
      lines: ["Happy Birthday", birthdayData.firstName + "!", "Party mode unlocked"],
    },
    {
      x: -1.85,
      y: 1.48,
      z: -3.52,
      theme: "cyan",
      lines: ["Make a wish ✨", "Cake loading…", "Heroes standing by"],
    },
  ];

  // Third wide TV on back wall
  const wallWish = {
    x: 2.2,
    y: 2.0,
    z: -4.85,
    w: 2.4,
    h: 1.2,
    theme: "gold",
    lines: ["HBD " + birthdayData.firstName, "Best year loading…", "From your squad 🎉"],
  };

  const makeMonitor = (cfg) => {
    const frame = new THREE.Mesh(
      new THREE.BoxGeometry(1.15, 0.75, 0.08),
      new THREE.MeshStandardMaterial({ color: 0x0a0c12, roughness: 0.35 })
    );
    frame.position.set(cfg.x, cfg.y, cfg.z);
    roomGroup.add(frame);

    const tex = makeWishTexture(cfg.lines, cfg.theme);
    const screen = new THREE.Mesh(
      new THREE.PlaneGeometry(1.0, 0.58),
      new THREE.MeshStandardMaterial({
        map: tex,
        emissiveMap: tex,
        emissive: 0xffffff,
        emissiveIntensity: 0.85,
        roughness: 0.35,
      })
    );
    screen.position.set(cfg.x, cfg.y, cfg.z + 0.05);
    roomGroup.add(screen);
  };
  wishScreens.forEach(makeMonitor);

  // Wall birthday display
  {
    const frame = new THREE.Mesh(
      new THREE.BoxGeometry(wallWish.w + 0.12, wallWish.h + 0.12, 0.08),
      new THREE.MeshStandardMaterial({ color: 0x0a0c12 })
    );
    frame.position.set(wallWish.x, wallWish.y, wallWish.z);
    roomGroup.add(frame);
    const tex = makeWishTexture(wallWish.lines, wallWish.theme);
    const screen = new THREE.Mesh(
      new THREE.PlaneGeometry(wallWish.w, wallWish.h),
      new THREE.MeshStandardMaterial({
        map: tex,
        emissiveMap: tex,
        emissive: 0xffffff,
        emissiveIntensity: 0.9,
      })
    );
    screen.position.set(wallWish.x, wallWish.y, wallWish.z + 0.05);
    roomGroup.add(screen);
  }

  // Birthday banner above door exit into room
  {
    const bannerTex = makeWishTexture(
      ["🎉 HAPPY BIRTHDAY", birthdayData.firstName.toUpperCase(), "Let the party begin"],
      "lime"
    );
    const banner = new THREE.Mesh(
      new THREE.PlaneGeometry(3.2, 0.7),
      new THREE.MeshStandardMaterial({
        map: bannerTex,
        emissiveMap: bannerTex,
        emissive: 0xffffff,
        emissiveIntensity: 0.7,
      })
    );
    banner.position.set(0, 2.7, -4.9);
    roomGroup.add(banner);
  }

  // Wall graffiti: "pagal"
  {
    const c = document.createElement("canvas");
    c.width = 512;
    c.height = 256;
    const ctx = c.getContext("2d");
    ctx.clearRect(0, 0, 512, 256);
    ctx.fillStyle = "#ff2e97";
    ctx.font = "800 96px Orbitron, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = "#2de2e6";
    ctx.shadowBlur = 12;
    ctx.fillText("pagal", 256, 128);
    ctx.shadowBlur = 0;
    ctx.strokeStyle = "#ffd166";
    ctx.lineWidth = 3;
    ctx.strokeText("pagal", 256, 128);

    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    const sign = new THREE.Mesh(
      new THREE.PlaneGeometry(1.15, 0.55),
      new THREE.MeshStandardMaterial({
        map: tex,
        transparent: true,
        emissiveMap: tex,
        emissive: 0xffffff,
        emissiveIntensity: 0.55,
        roughness: 0.6,
      })
    );
    // Left wall
    sign.position.set(-5.92, 1.85, -1.2);
    sign.rotation.y = Math.PI / 2;
    roomGroup.add(sign);
  }

  /* ---------- Cozy room extras ---------- */
  const fabric = new THREE.MeshStandardMaterial({
    color: 0x3d2a4a,
    roughness: 0.92,
    metalness: 0.05,
  });
  const fabricPink = new THREE.MeshStandardMaterial({
    color: 0x6b3a55,
    roughness: 0.9,
  });
  const wood = new THREE.MeshStandardMaterial({
    color: 0x5c3d2e,
    roughness: 0.7,
    metalness: 0.08,
  });
  const plantGreen = new THREE.MeshStandardMaterial({
    color: 0x2f6b45,
    roughness: 0.85,
  });
  const potMat = new THREE.MeshStandardMaterial({
    color: 0xc4a484,
    roughness: 0.65,
  });

  // Soft rug under party table
  const rug = new THREE.Mesh(
    new THREE.CircleGeometry(2.1, 32),
    new THREE.MeshStandardMaterial({ color: 0x4a2040, roughness: 0.95 })
  );
  rug.rotation.x = -Math.PI / 2;
  rug.position.set(1.4, 0.02, -1.2);
  roomGroup.add(rug);
  const rugTrim = new THREE.Mesh(
    new THREE.RingGeometry(1.95, 2.1, 32),
    new THREE.MeshStandardMaterial({ color: 0xffd166, roughness: 0.7 })
  );
  rugTrim.rotation.x = -Math.PI / 2;
  rugTrim.position.set(1.4, 0.025, -1.2);
  roomGroup.add(rugTrim);

  // Cozy sofa on the right
  const sofa = new THREE.Group();
  sofa.position.set(4.3, 0, 0.8);
  sofa.rotation.y = -0.55;
  const sofaSeat = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.35, 0.95), fabric);
  sofaSeat.position.y = 0.4;
  sofa.add(sofaSeat);
  const sofaBack = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.75, 0.22), fabricPink);
  sofaBack.position.set(0, 0.85, -0.38);
  sofa.add(sofaBack);
  const armL = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.45, 0.95), fabric);
  armL.position.set(-1.1, 0.55, 0);
  sofa.add(armL);
  const armR = armL.clone();
  armR.position.x = 1.1;
  sofa.add(armR);
  // pillows
  [[-0.55, 0.7, 0.05, 0xff7eb3], [0.45, 0.7, 0.08, 0x2de2e6]].forEach(([x, y, z, col]) => {
    const p = new THREE.Mesh(
      new THREE.BoxGeometry(0.45, 0.28, 0.35),
      new THREE.MeshStandardMaterial({ color: col, roughness: 0.9 })
    );
    p.position.set(x, y, z);
    p.rotation.y = 0.25;
    sofa.add(p);
  });
  roomGroup.add(sofa);

  // Floor lamp next to sofa
  const lamp = new THREE.Group();
  lamp.position.set(5.2, 0, 2.1);
  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04, 0.06, 1.5, 10),
    new THREE.MeshStandardMaterial({ color: 0x2a2a32, metalness: 0.6, roughness: 0.3 })
  );
  pole.position.y = 0.75;
  lamp.add(pole);
  const shade = new THREE.Mesh(
    new THREE.CylinderGeometry(0.28, 0.35, 0.35, 16, 1, true),
    new THREE.MeshStandardMaterial({
      color: 0xffd9a8,
      emissive: 0xffb070,
      emissiveIntensity: 0.7,
      side: THREE.DoubleSide,
      roughness: 0.8,
    })
  );
  shade.position.y = 1.55;
  lamp.add(shade);
  const bulb = new THREE.PointLight(0xffc090, 0.9, 4);
  bulb.position.y = 1.45;
  lamp.add(bulb);
  roomGroup.add(lamp);

  // Bean bag near desk
  const bean = new THREE.Mesh(
    new THREE.SphereGeometry(0.55, 16, 12),
    new THREE.MeshStandardMaterial({ color: 0x5b2c6f, roughness: 0.95 })
  );
  bean.scale.set(1.15, 0.65, 1.1);
  bean.position.set(-4.5, 0.32, -1.6);
  roomGroup.add(bean);

  // Side table + mug
  const sideTable = new THREE.Mesh(
    new THREE.CylinderGeometry(0.32, 0.35, 0.08, 16),
    wood
  );
  sideTable.position.set(3.3, 0.45, 1.8);
  roomGroup.add(sideTable);
  const sideLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.42, 8), wood);
  sideLeg.position.set(3.3, 0.22, 1.8);
  roomGroup.add(sideLeg);
  const mug = new THREE.Mesh(
    new THREE.CylinderGeometry(0.06, 0.05, 0.1, 12),
    new THREE.MeshStandardMaterial({ color: 0xffe8d6, roughness: 0.4 })
  );
  mug.position.set(3.25, 0.55, 1.75);
  roomGroup.add(mug);

  // Plants
  const makePlant = (x, z, scale = 1) => {
    const g = new THREE.Group();
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.14 * scale, 0.12 * scale, 0.22 * scale, 10), potMat);
    pot.position.y = 0.11 * scale;
    g.add(pot);
    const leaves = new THREE.Mesh(new THREE.SphereGeometry(0.28 * scale, 10, 10), plantGreen);
    leaves.position.y = 0.42 * scale;
    leaves.scale.y = 1.25;
    g.add(leaves);
    const leaf2 = leaves.clone();
    leaf2.scale.set(0.7 * scale, 0.9 * scale, 0.7 * scale);
    leaf2.position.set(0.12 * scale, 0.5 * scale, -0.05 * scale);
    g.add(leaf2);
    g.position.set(x, 0, z);
    roomGroup.add(g);
  };
  makePlant(-5.2, 2.2, 1.1);
  makePlant(5.3, -2.4, 0.95);
  makePlant(-0.6, -4.3, 0.8);

  // Bookshelf on right wall
  const shelf = new THREE.Group();
  shelf.position.set(5.7, 0, -2.5);
  const shelfBack = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1.8, 1.4), wood);
  shelfBack.position.set(0, 1.1, 0);
  shelf.add(shelfBack);
  for (let i = 0; i < 3; i++) {
    const board = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.06, 1.35), wood);
    board.position.set(-0.1, 0.45 + i * 0.5, 0);
    shelf.add(board);
  }
  const bookColors = [0xff2e97, 0x2de2e6, 0xffd166, 0xb6ff3b, 0xff7eb3, 0xa78bfa, 0xffffff];
  bookColors.forEach((col, i) => {
    const book = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.28, 0.18),
      new THREE.MeshStandardMaterial({ color: col, roughness: 0.7 })
    );
    book.position.set(-0.18, 0.62 + (i % 3) * 0.5, -0.45 + Math.floor(i / 3) * 0.4);
    shelf.add(book);
  });
  roomGroup.add(shelf);

  // Fairy string lights across ceiling (+ real glow so the roof lights up)
  const fairyGroup = new THREE.Group();
  const fairyColors = [0xffd166, 0xff7eb3, 0x2de2e6, 0xffffff, 0xb6ff3b];
  const fairyCount = isTiny ? 14 : isMobile ? 22 : 32;
  for (let i = 0; i < fairyCount; i++) {
    const t = i / (fairyCount - 1);
    const col = fairyColors[i % fairyColors.length];
    const bulb = new THREE.Mesh(
      new THREE.SphereGeometry(0.05, 8, 8),
      new THREE.MeshStandardMaterial({
        color: col,
        emissive: col,
        emissiveIntensity: 2.4,
      })
    );
    const x = -4 + t * 8;
    const y = 2.95 + Math.sin(t * Math.PI * 2) * 0.12;
    const z = -3.2 + Math.sin(t * 6) * 0.8;
    bulb.position.set(x, y, z);
    fairyGroup.add(bulb);

    // Sparse real lights so the ceiling catches color without melting FPS
    if (i % (isTiny ? 5 : isMobile ? 4 : 3) === 0) {
      const glow = new THREE.PointLight(col, 0.55, 3.5);
      glow.position.set(x, y - 0.05, z);
      fairyGroup.add(glow);
    }
  }
  roomGroup.add(fairyGroup);

  // Desk keyboard + mouse for gaming cozy
  const keyboard = new THREE.Mesh(
    new THREE.BoxGeometry(0.7, 0.04, 0.28),
    new THREE.MeshStandardMaterial({ color: 0x1a1f2c, roughness: 0.45 })
  );
  keyboard.position.set(-2.2, 0.94, -3.15);
  roomGroup.add(keyboard);
  const mouse = new THREE.Mesh(
    new THREE.BoxGeometry(0.1, 0.04, 0.16),
    new THREE.MeshStandardMaterial({ color: 0x2de2e6, emissive: 0x2de2e6, emissiveIntensity: 0.3 })
  );
  mouse.position.set(-1.55, 0.94, -3.15);
  roomGroup.add(mouse);

  // Soft floor pouf cushions
  if (!isTiny) {
    [[-1.2, 1.5, 0xff7eb3], [2.8, -3.2, 0x2de2e6]].forEach(([x, z, col]) => {
      const pouf = new THREE.Mesh(
        new THREE.CylinderGeometry(0.35, 0.38, 0.28, 16),
        new THREE.MeshStandardMaterial({ color: col, roughness: 0.92 })
      );
      pouf.position.set(x, 0.14, z);
      roomGroup.add(pouf);
    });
  }

  // Poster frames on back wall
  const posterColors = [0xff2e97, 0xffd166, 0x2de2e6];
  posterColors.forEach((col, i) => {
    const frame = new THREE.Mesh(
      new THREE.BoxGeometry(0.7, 0.9, 0.05),
      new THREE.MeshStandardMaterial({ color: 0x1a1208, roughness: 0.5 })
    );
    frame.position.set(-3.5 + i * 1.0, 1.9, -4.92);
    roomGroup.add(frame);
    const art = new THREE.Mesh(
      new THREE.PlaneGeometry(0.55, 0.72),
      new THREE.MeshStandardMaterial({
        color: col,
        emissive: col,
        emissiveIntensity: 0.35,
      })
    );
    art.position.set(-3.5 + i * 1.0, 1.9, -4.88);
    roomGroup.add(art);
  });

  // RGB tower
  const tower = new THREE.Mesh(
    new THREE.BoxGeometry(0.45, 1.1, 0.55),
    new THREE.MeshStandardMaterial({ color: 0x101522, metalness: 0.5, roughness: 0.3 })
  );
  tower.position.set(-4.1, 0.9, -3.2);
  roomGroup.add(tower);
  const towerGlow = new THREE.Mesh(
    new THREE.BoxGeometry(0.1, 0.9, 0.08),
    new THREE.MeshStandardMaterial({
      color: 0xb6ff3b,
      emissive: 0xb6ff3b,
      emissiveIntensity: 2,
    })
  );
  towerGlow.position.set(-3.9, 0.9, -2.9);
  roomGroup.add(towerGlow);

  // Party table + cake
  const table = new THREE.Mesh(
    new THREE.CylinderGeometry(1.15, 1.2, 0.12, 32),
    new THREE.MeshStandardMaterial({ color: 0x222a3d, roughness: 0.45, metalness: 0.25 })
  );
  table.position.set(1.4, 0.85, -1.2);
  roomGroup.add(table);

  const tableLeg = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12, 0.16, 0.85, 12),
    accentMat
  );
  tableLeg.position.set(1.4, 0.4, -1.2);
  roomGroup.add(tableLeg);

  const cakeGroup = new THREE.Group();
  cakeGroup.position.set(1.4, 0.95, -1.2);
  roomGroup.add(cakeGroup);

  const cakeWhole = new THREE.Group();
  const cakeSlice = new THREE.Group();
  cakeGroup.add(cakeWhole);
  cakeGroup.add(cakeSlice);

  const addLayer = (parent, r, h, y, color, start = 0, end = Math.PI * 2) => {
    const m = new THREE.Mesh(
      new THREE.CylinderGeometry(r, r * 1.02, h, 24, 1, false, start, end - start),
      new THREE.MeshStandardMaterial({ color, roughness: 0.55, side: THREE.DoubleSide })
    );
    m.position.y = y;
    parent.add(m);
    return m;
  };

  // Whole cake (3/4) + slice (1/4) so they can split on cut
  const almost = Math.PI * 1.5;
  addLayer(cakeWhole, 0.32, 0.16, 0.08, 0xff4d8d, 0, almost);
  addLayer(cakeWhole, 0.26, 0.14, 0.22, 0xffd166, 0, almost);
  addLayer(cakeWhole, 0.2, 0.12, 0.34, 0xff7eb3, 0, almost);

  addLayer(cakeSlice, 0.32, 0.16, 0.08, 0xff4d8d, almost, Math.PI * 2);
  addLayer(cakeSlice, 0.26, 0.14, 0.22, 0xffd166, almost, Math.PI * 2);
  addLayer(cakeSlice, 0.2, 0.12, 0.34, 0xff7eb3, almost, Math.PI * 2);

  // Inner frosting faces on the cut
  const frostMat = new THREE.MeshStandardMaterial({ color: 0xffe4ec, roughness: 0.7 });
  const frost = new THREE.Mesh(new THREE.PlaneGeometry(0.32, 0.42), frostMat);
  frost.position.set(0.02, 0.22, 0.01);
  frost.rotation.y = almost;
  cakeWhole.add(frost);

  const flames = [];
  for (let i = 0; i < 4; i++) {
    const candle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.015, 0.015, 0.14, 8),
      new THREE.MeshStandardMaterial({ color: 0xfff1b8 })
    );
    const a = (i / 4) * Math.PI * 2;
    candle.position.set(Math.cos(a) * 0.08, 0.48, Math.sin(a) * 0.08);
    cakeGroup.add(candle);
    const flame = new THREE.Mesh(
      new THREE.SphereGeometry(0.025, 8, 8),
      new THREE.MeshStandardMaterial({
        color: 0xff7a3d,
        emissive: 0xff7a3d,
        emissiveIntensity: 2.5,
      })
    );
    flame.position.set(Math.cos(a) * 0.08, 0.58, Math.sin(a) * 0.08);
    cakeGroup.add(flame);
    flames.push(flame);
  }

  // Knife (shown during cut)
  const knife = new THREE.Group();
  const blade = new THREE.Mesh(
    new THREE.BoxGeometry(0.28, 0.02, 0.06),
    new THREE.MeshStandardMaterial({ color: 0xdce3ec, metalness: 0.85, roughness: 0.2 })
  );
  blade.position.x = 0.12;
  knife.add(blade);
  const handle = new THREE.Mesh(
    new THREE.BoxGeometry(0.1, 0.035, 0.035),
    new THREE.MeshStandardMaterial({ color: 0x6d4c41 })
  );
  handle.position.x = -0.06;
  knife.add(handle);
  knife.position.set(0.15, 0.55, 0.35);
  knife.visible = false;
  cakeGroup.add(knife);

  // LEGO Batwoman cutter — black cowl (no red hair), matches popup figure
  const batwomanFallback = makeLegoTexture("batwoman");
  const cutterMat = new THREE.SpriteMaterial({
    map: batwomanFallback,
    transparent: true,
    depthWrite: false,
    alphaTest: 0.15,
  });
  const cutter = new THREE.Sprite(cutterMat);
  cutter.scale.set(isMobile ? 0.92 : 1.05, isMobile ? 1.35 : 1.55, 1);
  const cutterStart = new THREE.Vector3(3.2, 0.9, 0.4);
  const cutterEnd = new THREE.Vector3(1.85, 0.9, -0.55);
  cutter.position.copy(cutterStart);
  roomGroup.add(cutter);

  // Use the same LEGO Batwoman PNG as the popup (black cowl)
  new THREE.TextureLoader().load(
    "images/batwoman-lego.png",
    (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.premultiplyAlpha = false;
      tex.needsUpdate = true;
      cutter.material.map = tex;
      cutter.material.needsUpdate = true;
    },
    undefined,
    () => {
      // keep canvas fallback (black cowl, no red hair)
      cutter.material.map = batwomanFallback;
      cutter.material.needsUpdate = true;
    }
  );

  let cutProgress = 0;
  let setCutProgress = () => {};

  // Standing LEGO Marvel heroes around the cake
  const heroes = ["spidey", "ironman", "hulk", "thor", "cap", "widow"];
  const legoGuests = [];
  const guestScale = isMobile ? 0.82 : 0.95;
  heroes.forEach((hero, i) => {
    const ang = (i / heroes.length) * Math.PI * 2 + 0.2;
    const tex = makeLegoTexture(hero);
    const mat = new THREE.SpriteMaterial({
      map: tex,
      transparent: true,
      depthWrite: false,
    });
    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(guestScale, guestScale * 1.47, 1);
    sprite.position.set(
      1.4 + Math.cos(ang) * 1.85,
      0.85,
      -1.2 + Math.sin(ang) * 1.85
    );
    sprite.userData.baseY = 0.85;
    sprite.userData.phase = i * 0.7;
    roomGroup.add(sprite);
    legoGuests.push(sprite);
  });

  setCutProgress = (t) => {
    cutProgress = Math.min(1, Math.max(0, t));
    const walk = THREE.MathUtils.smoothstep(cutProgress, 0, 0.35);
    cutter.position.lerpVectors(cutterStart, cutterEnd, walk);
    cutter.position.y = 0.9 + Math.sin(walk * Math.PI) * 0.05;

    const raise = THREE.MathUtils.smoothstep(cutProgress, 0.3, 0.55);
    knife.visible = raise > 0.05;
    knife.position.set(
      0.2 - raise * 0.05,
      0.7 - raise * 0.28,
      0.4 - raise * 0.4
    );
    knife.rotation.z = -0.5 + raise * 1.35;
    knife.rotation.y = 0;

    const sliceT = THREE.MathUtils.smoothstep(cutProgress, 0.45, 0.9);
    cakeSlice.position.set(sliceT * 0.5, sliceT * 0.14, sliceT * 0.22);
    cakeSlice.rotation.z = sliceT * 0.4;
    cakeWhole.rotation.z = -sliceT * 0.05;

    const blow = THREE.MathUtils.smoothstep(cutProgress, 0.5, 0.72);
    flames.forEach((f) => {
      f.scale.setScalar(Math.max(0.01, 1 - blow));
      f.material.emissiveIntensity = 2.5 * (1 - blow);
      f.visible = blow < 0.98;
    });

    legoGuests.forEach((s, i) => {
      if (cutProgress > 0.45) {
        s.position.y =
          s.userData.baseY + Math.abs(Math.sin(cutProgress * 14 + i)) * 0.1;
      }
    });
  };

  // Balloons around the room
  const balloonColors = [0xff2e97, 0x2de2e6, 0xffd166, 0xb6ff3b, 0xff7eb3, 0xa78bfa];
  const balloons = [];
  const balloonCount = isTiny ? 7 : isMobile ? 10 : 14;
  for (let i = 0; i < balloonCount; i++) {
    const b = makeBalloonMesh(balloonColors[i % balloonColors.length]);
    b.position.set(
      (Math.random() - 0.5) * 8,
      1.6 + Math.random() * 1.2,
      (Math.random() - 0.5) * 7
    );
    b.userData.baseY = b.position.y;
    b.userData.phase = Math.random() * Math.PI * 2;
    roomGroup.add(b);
    balloons.push(b);
  }

  // Floating confetti particles
  const confettiCount = isTiny ? 40 : isMobile ? 70 : 120;
  const confetti = new THREE.Group();
  const confettiMats = [
    new THREE.MeshBasicMaterial({ color: 0x2de2e6 }),
    new THREE.MeshBasicMaterial({ color: 0xff2e97 }),
    new THREE.MeshBasicMaterial({ color: 0xffd166 }),
    new THREE.MeshBasicMaterial({ color: 0xb6ff3b }),
    new THREE.MeshBasicMaterial({ color: 0xffffff }),
  ];
  for (let i = 0; i < confettiCount; i++) {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.05, 0.05, 0.01),
      confettiMats[i % confettiMats.length]
    );
    mesh.position.set(
      (Math.random() - 0.5) * 10,
      Math.random() * 3,
      (Math.random() - 0.5) * 10
    );
    mesh.userData.speed = 0.2 + Math.random() * 0.5;
    mesh.userData.spin = (Math.random() - 0.5) * 2;
    confetti.add(mesh);
  }
  scene.add(confetti);

  // Camera path targets (scroll progress 0→1)
  const zPush = isMobile ? 0.55 : 0;
  const cameraPath = [
    { p: new THREE.Vector3(0, 1.45, 8.2 + zPush), l: new THREE.Vector3(0, 1.3, 5.5) },
    { p: new THREE.Vector3(0, 1.5, 4.4 + zPush * 0.4), l: new THREE.Vector3(0, 1.4, 0) },
    { p: new THREE.Vector3(0.2, 1.7, 1.8 + zPush * 0.3), l: new THREE.Vector3(0, 1.5, -2) },
    { p: new THREE.Vector3(-1.5, 1.65, 0.55 + zPush * 0.25), l: new THREE.Vector3(-2.4, 1.3, -3.4) },
    { p: new THREE.Vector3(0.15, 1.6, 1.7 + zPush * 0.2), l: new THREE.Vector3(1.4, 1.1, -1.2) },
    { p: new THREE.Vector3(0.85, 1.4, 0.65 + zPush * 0.15), l: new THREE.Vector3(1.4, 1.15, -1.2) },
    { p: new THREE.Vector3(0.35, 1.7, 2.5 + zPush * 0.2), l: new THREE.Vector3(0.5, 1.2, -1) },
  ];

  const look = new THREE.Vector3().copy(cameraPath[0].l);
  camera.position.copy(cameraPath[0].p);
  camera.lookAt(look);

  let progress = 0;
  const tmpP = new THREE.Vector3();
  const tmpL = new THREE.Vector3();

  function setProgress(t) {
    progress = Math.min(1, Math.max(0, t));
    const scaled = progress * (cameraPath.length - 1);
    const i = Math.floor(scaled);
    const f = scaled - i;
    const a = cameraPath[i];
    const b = cameraPath[Math.min(i + 1, cameraPath.length - 1)];
    tmpP.lerpVectors(a.p, b.p, f);
    tmpL.lerpVectors(a.l, b.l, f);
    camera.position.copy(tmpP);
    look.copy(tmpL);
    camera.lookAt(look);

    // Soft door open near start
    const doorOpen = THREE.MathUtils.smoothstep(progress, 0.08, 0.22);
    door.rotation.y = -doorOpen * 1.15;
  }

  let raf = 0;
  const clock = new THREE.Clock();
  function animate() {
    raf = requestAnimationFrame(animate);
    const t = clock.getElapsedTime();
    cyan.intensity = 1.8 + Math.sin(t * 1.4) * 0.35;
    magenta.intensity = 1.5 + Math.cos(t * 1.1) * 0.3;
    confetti.children.forEach((m) => {
      m.position.y -= m.userData.speed * 0.01;
      m.rotation.z += m.userData.spin * 0.02;
      if (m.position.y < 0) m.position.y = 3.1;
    });
    cakeGroup.rotation.y =
      cutProgress < 0.2 ? Math.sin(t * 0.6) * 0.08 : cakeGroup.rotation.y * 0.9;
    legoGuests.forEach((s) => {
      if (cutProgress < 0.4) {
        s.position.y = s.userData.baseY + Math.sin(t * 1.6 + s.userData.phase) * 0.04;
      }
    });
    balloons.forEach((b) => {
      b.position.y = b.userData.baseY + Math.sin(t * 1.1 + b.userData.phase) * 0.12;
      b.rotation.z = Math.sin(t * 0.8 + b.userData.phase) * 0.08;
    });
    renderer.render(scene, camera);
  }
  animate();

  function onResize() {
    const w = window.innerWidth;
    const h = Math.max(window.innerHeight, 1);
    const mobileNow = w <= 768;
    camera.aspect = w / h;
    camera.fov = mobileNow ? 62 : 55;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobileNow ? 1.5 : 2));
    renderer.setSize(w, h);
    if (window.ScrollTrigger) ScrollTrigger.refresh();
  }
  window.addEventListener("resize", onResize, { passive: true });
  window.addEventListener("orientationchange", () => {
    window.setTimeout(onResize, 180);
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) cancelAnimationFrame(raf);
    else animate();
  });

  return { setProgress, setCutProgress, camera, scene, renderer };
}

/* ---------- GSAP story ---------- */

function initStory(room) {
  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({ ignoreMobileResize: true });

  const chapters = gsap.utils.toArray(".chapter");
  const progressBar = $("#progressBar");
  const scrollHint = $("#scrollHint");
  const knock = gsap.utils.toArray("#knockBurst span");
  const crowd = gsap.utils.toArray(".crowd span");
  const cutStage = $("#cutStage");

  // Master scroll → camera
  ScrollTrigger.create({
    trigger: "#story",
    start: "top top",
    end: "bottom bottom",
    scrub: 1,
    invalidateOnRefresh: true,
    onUpdate: (self) => {
      room.setProgress(self.progress);
      if (progressBar) progressBar.style.width = `${self.progress * 100}%`;
      if (scrollHint) {
        scrollHint.classList.toggle("is-hidden", self.progress > 0.04);
      }
    },
  });

  chapters.forEach((chapter) => {
    const caption = chapter.querySelector(".caption");
    if (!caption) return;
    const isFinale = chapter.dataset.chapter === "finale";
    const isCut = chapter.dataset.chapter === "cut";

    // Cut chapter uses a custom stagger timeline below
    if (isCut) return;

    // One timeline per caption so scroll-back restores it (door unlock included)
    gsap.set(caption, { opacity: 0, y: 28, scale: 0.97 });

    if (isFinale) {
      gsap.fromTo(
        caption,
        { opacity: 0, y: 28, scale: 0.97 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: chapter,
            start: "top 65%",
            end: "top 30%",
            scrub: true,
            invalidateOnRefresh: true,
          },
        }
      );
      return;
    }

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: chapter,
        start: "top 70%",
        end: "bottom 25%",
        scrub: true,
        invalidateOnRefresh: true,
      },
    });

    tl.fromTo(
      caption,
      { opacity: 0, y: 28, scale: 0.97 },
      { opacity: 1, y: 0, scale: 1, ease: "power2.out", duration: 0.35 }
    ).to(caption, {
      opacity: 0,
      y: -24,
      scale: 0.98,
      ease: "power2.in",
      duration: 0.35,
    });
  });

  // Door unlock chips — fromTo so it reverses cleanly when scrolling up
  gsap.set(knock, { opacity: 0, scale: 0.6 });
  gsap.fromTo(
    knock,
    { opacity: 0, scale: 0.6 },
    {
      opacity: 1,
      scale: 1,
      stagger: 0.12,
      ease: "back.out(2)",
      scrollTrigger: {
        trigger: "#ch-door",
        start: "top 55%",
        end: "top 15%",
        scrub: true,
        invalidateOnRefresh: true,
      },
    }
  );

  // Birthday title cascade
  gsap.fromTo(
    ".birthday-title span",
    { y: 40, opacity: 0 },
    {
      y: 0,
      opacity: 1,
      stagger: 0.12,
      ease: "power3.out",
      scrollTrigger: {
        trigger: "#ch-birthday",
        start: "top 55%",
        end: "top 20%",
        scrub: true,
        invalidateOnRefresh: true,
      },
    }
  );

  // Crowd pop
  gsap.fromTo(
    crowd,
    { opacity: 0, y: 12 },
    {
      opacity: 1,
      y: 0,
      stagger: 0.08,
      ease: "back.out(1.6)",
      scrollTrigger: {
        trigger: "#ch-party",
        start: "top 50%",
        end: "top 20%",
        scrub: true,
        invalidateOnRefresh: true,
      },
    }
  );

  // Cake cut: 3D room first, then LEGO popup replay
  const cutCaption = $("#cutCaption");
  const cutWatch = $(".cut-caption__watch");
  const cutReplay = $(".cut-caption__replay");

  // Phase A — slim top text only; 3D cut stays fully visible
  if (cutCaption) {
    gsap.set(cutCaption, { opacity: 0 });
    gsap.to(cutCaption, {
      opacity: 1,
      ease: "power2.out",
      scrollTrigger: {
        trigger: "#ch-cut",
        start: "top 75%",
        end: "top 45%",
        scrub: true,
      },
    });
  }

  ScrollTrigger.create({
    trigger: "#ch-cut",
    start: "top 80%",
    end: "center center",
    scrub: 0.5,
    onUpdate: (self) => {
      room.setCutProgress?.(self.progress);
      cutCaption?.classList.add("is-watching");
      cutCaption?.classList.remove("is-replaying");
      if (cutCaption) gsap.set(cutCaption, { clearProps: "transform" });
      cutStage?.classList.remove("is-show", "is-cutting");
      cutStage?.querySelector(".mini-cake")?.classList.remove("is-blown");
      if (cutStage) cutStage.setAttribute("aria-hidden", "true");
      if (cutWatch) cutWatch.hidden = false;
      if (cutReplay) cutReplay.hidden = true;
    },
    onLeaveBack: () => {
      room.setCutProgress?.(0);
      cutCaption?.classList.remove("is-watching", "is-replaying");
    },
  });

  // Phase B — after 3D cut, show LEGO + cake popup replay
  ScrollTrigger.create({
    trigger: "#ch-cut",
    start: "center center",
    end: "bottom 25%",
    scrub: 0.45,
    onUpdate: (self) => {
      room.setCutProgress?.(1);
      cutCaption?.classList.add("is-replaying");
      cutCaption?.classList.remove("is-watching");
      if (cutWatch) cutWatch.hidden = true;
      if (cutReplay) cutReplay.hidden = false;
      if (cutStage) {
        cutStage.setAttribute("aria-hidden", "false");
        cutStage.classList.add("is-show");
        if (self.progress > 0.2) {
          cutStage.classList.add("is-cutting");
          cutStage.querySelector(".mini-cake")?.classList.add("is-blown");
        } else {
          cutStage.classList.remove("is-cutting");
          cutStage.querySelector(".mini-cake")?.classList.remove("is-blown");
        }
      }
    },
  });

  // Fade cut caption out into finale
  if (cutCaption) {
    gsap.to(cutCaption, {
      opacity: 0,
      ease: "power2.in",
      scrollTrigger: {
        trigger: "#ch-cut",
        start: "bottom 40%",
        end: "bottom 15%",
        scrub: true,
      },
    });
  }
}

function initReducedStory(room) {
  room.setProgress(0.75);
  room.setCutProgress?.(1);
  document.querySelectorAll(".caption").forEach((el) => {
    el.style.opacity = "1";
    el.style.transform = "none";
  });
  $("#scrollHint")?.classList.add("is-hidden");
  const cutStage = $("#cutStage");
  cutStage?.classList.add("is-show", "is-cutting");
  cutStage?.querySelector(".mini-cake")?.classList.add("is-blown");
  $("#cutCaption")?.classList.add("is-replaying");
  const watch = $(".cut-caption__watch");
  const replay = $(".cut-caption__replay");
  if (watch) watch.hidden = true;
  if (replay) replay.hidden = false;
}
