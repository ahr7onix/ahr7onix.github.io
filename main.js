import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { STLLoader } from "three/addons/loaders/STLLoader.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";

const P = window.PROFILE;
const $ = (id) => document.getElementById(id);
const root = document.documentElement;

root.style.setProperty("--accent", P.accent);
root.style.setProperty("--accent2", P.accent2);
document.title = `${P.name} ${P.tag ? "· " + P.tag : ""}`;

/* ============================================================
   UI
   ============================================================ */
$("enter-name").textContent = P.name;
$("enter-name").dataset.text = P.name;
$("name").textContent = P.name;
$("name").dataset.text = P.name;
$("tag").textContent = P.tag;
$("bio").textContent = P.bio;
$("year").textContent = new Date().getFullYear();
$("track-name").textContent = `♪ ${P.music.title} — ${P.music.artist}`;

function setAvatar(url) {
  const a = $("avatar");
  if (url) { a.style.backgroundImage = `url("${url}")`; a.textContent = ""; }
  else a.textContent = P.name.slice(0, 1).toUpperCase();
}
setAvatar(P.avatar);

P.badges.forEach((b) => {
  const el = document.createElement("span");
  el.className = "badge";
  el.textContent = `${b.icon || ""} ${b.label}`.trim();
  if (b.tip) el.dataset.tip = b.tip;
  el.style.animationDelay = `${0.2 + $("badges").children.length * 0.07}s`;
  $("badges").appendChild(el);
});

P.links.forEach((l, i) => {
  const el = document.createElement(l.copy ? "button" : "a");
  el.className = "link";
  el.style.setProperty("--c", l.color || P.accent);
  el.style.setProperty("--icon", `url(https://cdn.jsdelivr.net/npm/simple-icons@13/icons/${l.platform}.svg)`);
  el.style.animationDelay = `${0.35 + i * 0.08}s`;
  el.innerHTML = `<span class="link-icon"><i></i></span><span class="link-text"><strong></strong><span></span></span>`;
  el.querySelector("strong").textContent = l.label;
  el.querySelector(".link-text span").textContent = l.handle;
  if (l.copy) {
    el.type = "button";
    el.addEventListener("click", () => {
      navigator.clipboard?.writeText(l.handle);
      toast(`${l.label} copiado: ${l.handle}`);
    });
  } else {
    el.href = l.url; el.target = "_blank"; el.rel = "noopener";
  }
  $("links").appendChild(el);
});

if (P.featured?.length) {
  $("featured-wrap").classList.remove("hidden");
  P.featured.forEach((f) => {
    const a = document.createElement("a");
    a.className = "feat"; a.href = f.url; a.target = "_blank"; a.rel = "noopener";
    a.innerHTML = `<div><strong></strong><small></small></div><span class="arrow">→</span>`;
    a.querySelector("strong").textContent = f.title;
    a.querySelector("small").textContent = f.subtitle || "";
    $("featured").appendChild(a);
  });
}

let toastTimer;
function toast(msg) {
  const t = $("toast");
  t.textContent = msg; t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 1800);
}

// Typewriter
(function typer() {
  const el = $("typer");
  let r = 0, c = 0, del = false;
  (function tick() {
    const word = P.roles[r % P.roles.length];
    c += del ? -1 : 1;
    el.textContent = word.slice(0, c);
    let wait = del ? 40 : 90;
    if (!del && c === word.length) { del = true; wait = 1600; }
    else if (del && c === 0) { del = false; r++; wait = 300; }
    setTimeout(tick, wait);
  })();
})();

// Cursor
const cur = $("cursor"), ring = $("cursor-ring");
let cx = innerWidth / 2, cy = innerHeight / 2, rx = cx, ry = cy;
addEventListener("mousemove", (e) => { cx = e.clientX; cy = e.clientY; });
document.addEventListener("mouseover", (e) => ring.classList.toggle("hover", !!e.target.closest("a,button,.badge,input")));

// Relógio: que horas são aqui
function tickClock() {
  const tz = P.timezone || "America/Sao_Paulo";
  const time = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: tz });
  const h = +new Date().toLocaleString("en-US", { hour: "numeric", hour12: false, timeZone: tz });
  const mood = h < 6 ? "provavelmente acordado de madrugada 🌙" : h < 12 ? "bom dia ☀️" : h < 18 ? "boa tarde 🌤️" : "boa noite 🌃";
  $("clock").textContent = `${time} aqui · ${mood}`;
}
tickClock();
setInterval(tickClock, 15000);

// Clique no avatar: explosão de emojis + pulso de supernova no buraco negro
let boost = 0;
$("avatar").addEventListener("click", (e) => {
  const r = $("avatar").getBoundingClientRect();
  const ox = r.left + r.width / 2, oy = r.top + r.height / 2;
  const list = P.burst || ["✨"];
  for (let i = 0; i < 22; i++) {
    const s = document.createElement("span");
    s.className = "burst";
    s.textContent = list[i % list.length];
    const ang = (i / 22) * Math.PI * 2 + Math.random() * 0.3, dist = 90 + Math.random() * 140;
    s.style.left = `${ox}px`; s.style.top = `${oy}px`;
    s.style.setProperty("--dx", `${Math.cos(ang) * dist}px`);
    s.style.setProperty("--dy", `${Math.sin(ang) * dist}px`);
    s.style.setProperty("--rot", `${(Math.random() - 0.5) * 720}deg`);
    document.body.appendChild(s);
    setTimeout(() => s.remove(), 1100);
  }
  boost = 1;
});

// Rastro de faíscas no cursor (só com mouse)
if (matchMedia("(pointer: fine)").matches) {
  let last = 0;
  addEventListener("mousemove", (e) => {
    const now = performance.now();
    if (now - last < 28) return;
    last = now;
    const d = document.createElement("span");
    d.className = "spark";
    d.style.left = `${e.clientX}px`; d.style.top = `${e.clientY}px`;
    d.style.setProperty("--dx", `${(Math.random() - 0.5) * 30}px`);
    d.style.setProperty("--dy", `${10 + Math.random() * 25}px`);
    document.body.appendChild(d);
    setTimeout(() => d.remove(), 700);
  });
}

// Easter egg: digitar "jester" ativa o modo caos
let typed = "";
addEventListener("keydown", (e) => {
  if (e.target.closest?.("input") || e.key.length !== 1) return;
  typed = (typed + e.key.toLowerCase()).slice(-6);
  if (typed === "jester" && !document.body.classList.contains("chaos")) {
    typed = "";
    document.body.classList.add("chaos");
    toast("🃏 MODO CAOS ATIVADO");
    boost = 1.4;
    setTimeout(() => document.body.classList.remove("chaos"), 6000);
  }
});

// 3D tilt on card
const card = $("profile-card");
card.addEventListener("mousemove", (e) => {
  const r = card.getBoundingClientRect();
  const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
  card.style.transform = `rotateY(${(x - 0.5) * 14}deg) rotateX(${(0.5 - y) * 14}deg)`;
  card.style.setProperty("--mx", `${x * 100}%`);
  card.style.setProperty("--my", `${y * 100}%`);
});
card.addEventListener("mouseleave", () => { card.style.transform = ""; });

/* ============================================================
   Discord (Lanyard)
   ============================================================ */
async function lanyard() {
  if (!P.discordId) return;
  try {
    const res = await fetch(`https://api.lanyard.rest/v1/users/${P.discordId}`);
    const { data } = await res.json();
    if (!data) return;
    const dot = $("status-dot");
    dot.className = `status-dot ${data.discord_status}`;
    dot.title = data.discord_status;
    const u = data.discord_user;
    if (!P.avatar && u.avatar) setAvatar(`https://cdn.discordapp.com/avatars/${u.id}/${u.avatar}.png?size=256`);

    const box = $("presence");
    if (data.listening_to_spotify && data.spotify) {
      box.classList.remove("hidden");
      $("presence-label").textContent = "ouvindo no Spotify";
      $("presence-title").textContent = data.spotify.song;
      $("presence-sub").textContent = data.spotify.artist;
      $("presence-img").style.backgroundImage = `url("${data.spotify.album_art_url}")`;
      return;
    }
    const act = data.activities.find((a) => a.type === 0);
    if (act) {
      box.classList.remove("hidden");
      $("presence-label").textContent = "jogando";
      $("presence-title").textContent = act.name;
      $("presence-sub").textContent = act.details || act.state || "";
      const img = act.assets?.large_image;
      if (img && act.application_id && !img.startsWith("mp:"))
        $("presence-img").style.backgroundImage = `url("https://cdn.discordapp.com/app-assets/${act.application_id}/${img}.png")`;
      else if (img?.startsWith("mp:"))
        $("presence-img").style.backgroundImage = `url("https://media.discordapp.net/${img.slice(3)}")`;
    } else box.classList.add("hidden");
  } catch (_) { /* sem Lanyard, segue a vida */ }
}
lanyard();
setInterval(lanyard, 30000);

/* ============================================================
   Áudio
   ============================================================ */
const audio = $("audio");
let actx, analyser, master, freq, usingSynth = false, playing = false;
let yt = null, ytReady = false, ytWanted = false;
// Playlist: aceita a lista nova (music.playlist) ou o formato antigo de um vídeo só (music.youtube)
const playlist = (P.music.playlist || (P.music.youtube ? [{ youtube: P.music.youtube, title: P.music.title, artist: P.music.artist, bpm: P.music.bpm }] : []))
  .filter((t) => t.youtube);
let ytMode = playlist.length > 0, track = 0, failed = 0;
if (P.music.shuffle) playlist.sort(() => Math.random() - 0.5);

function showTrack() {
  const t = playlist[track];
  $("track-name").textContent = `♪ ${t.title || "Música " + (track + 1)}${t.artist ? " — " + t.artist : ""}  (${track + 1}/${playlist.length})`;
}
function loadTrack(i, autoplay = true) {
  track = (i + playlist.length) % playlist.length;
  showTrack();
  if (!ytReady) return;
  const t = playlist[track];
  if (autoplay) yt.loadVideoById({ videoId: t.youtube, startSeconds: t.start || 0 });
  else yt.cueVideoById({ videoId: t.youtube, startSeconds: t.start || 0 });
}

function initAudio() {
  actx = new (window.AudioContext || window.webkitAudioContext)();
  analyser = actx.createAnalyser();
  analyser.fftSize = 256;
  analyser.smoothingTimeConstant = 0.8;
  freq = new Uint8Array(analyser.frequencyBinCount);
  master = actx.createGain();
  master.gain.value = +$("volume").value;
  master.connect(analyser);
  analyser.connect(actx.destination);
}

// ---- Música pelo player do YouTube (carrega já na abertura, toca no clique de entrar) ----
if (ytMode) {
  showTrack();
  const box = document.createElement("div");
  box.id = "yt-box";
  box.innerHTML = '<div id="yt"></div>';
  document.body.appendChild(box);
  window.onYouTubeIframeAPIReady = () => {
    const first = playlist[track];
    yt = new YT.Player("yt", {
      width: 200, height: 200, videoId: first.youtube,
      playerVars: { autoplay: 0, controls: 0, start: first.start || 0, playsinline: 1 },
      events: {
        onReady: () => {
          ytReady = true;
          yt.setVolume(+$("volume").value * 100);
          if (ytWanted) yt.playVideo();
        },
        onStateChange: (e) => {
          if (e.data === YT.PlayerState.PLAYING) failed = 0;
          if (e.data === YT.PlayerState.ENDED) loadTrack(track + 1);
        },
        onError: () => {
          // vídeo bloqueado para embed: pula para o próximo; se todos falharem, usa a trilha synthwave
          if (++failed < playlist.length) return loadTrack(track + 1, ytWanted);
          ytMode = false;
          if (ytWanted) { initAudio(); startSynth(); }
        },
      },
    });
  };
  const tag = document.createElement("script");
  tag.src = "https://www.youtube.com/iframe_api";
  tag.onerror = () => { ytMode = false; };
  document.head.appendChild(tag);
}

$("prev-btn").addEventListener("click", () => { if (ytMode) { playing = true; syncPlayIcon(); loadTrack(track - 1); } });
$("next-btn").addEventListener("click", () => { if (ytMode) { playing = true; syncPlayIcon(); loadTrack(track + 1); } });
if (!ytMode || playlist.length < 2) { $("prev-btn").classList.add("hidden"); $("next-btn").classList.add("hidden"); }
function syncPlayIcon() {
  $("icon-play").classList.toggle("hidden", playing);
  $("icon-pause").classList.toggle("hidden", !playing);
}

async function startMusic() {
  playing = true;
  if (ytMode) {
    ytWanted = true;
    if (ytReady) yt.playVideo();
    return;
  }
  initAudio();
  audio.src = P.music.src;
  audio.volume = 1;
  try {
    const src = actx.createMediaElementSource(audio);
    src.connect(master);
    await audio.play();
  } catch (_) {
    startSynth();
  }
}

function startSynth() {
  if (usingSynth || !actx) return;
  usingSynth = true;
  audio.removeAttribute("src");
  $("track-name").textContent = "♪ synthwave gerado ao vivo — coloque seu mp3 em assets/music.mp3";
  synth.start();
}
audio.addEventListener("error", startSynth);

$("play-btn").addEventListener("click", () => {
  if (!actx && !ytMode) return;
  playing = !playing;
  if (ytMode) { if (ytReady) playing ? yt.playVideo() : yt.pauseVideo(); }
  else if (playing) { actx.resume(); if (!usingSynth) audio.play(); }
  else { actx.suspend(); if (!usingSynth) audio.pause(); }
  syncPlayIcon();
});
$("volume").addEventListener("input", (e) => {
  if (master) master.gain.value = +e.target.value;
  if (ytReady) yt.setVolume(+e.target.value * 100);
});

// O YouTube não deixa ler o som, então no modo YouTube a batida é simulada no BPM da música
const fakeBins = new Uint8Array(128);
function simulatedBeat(t) {
  const bpm = (playlist[track] && playlist[track].bpm) || P.music.bpm || 120, ph = (t * bpm / 60) % 1;
  const kick = Math.pow(1 - ph, 6);
  const vol = +$("volume").value;
  for (let i = 0; i < fakeBins.length; i++) {
    const v = (0.35 + 0.25 * Math.sin(t * 3 + i * 0.7) * Math.sin(t * 1.3 + i * 0.23)) * (1 - i / 160) + kick * Math.max(0, 0.6 - i / 60);
    fakeBins[i] = Math.max(0, Math.min(255, v * 255 * (0.4 + vol)));
  }
  return { level: Math.min(1, (0.25 + kick * 0.75) * (0.5 + vol)), bins: fakeBins };
}

// Synthwave procedural (fallback quando não há mp3)
const synth = {
  bpm: 96, step: 0, next: 0, timer: null,
  chords: [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]], // Am F C G
  hz: (m) => 440 * Math.pow(2, (m - 69) / 12),
  start() {
    this.bus = actx.createGain(); this.bus.gain.value = 0.6;
    const delay = actx.createDelay(); delay.delayTime.value = (60 / this.bpm) * 0.75;
    const fb = actx.createGain(); fb.gain.value = 0.35;
    delay.connect(fb); fb.connect(delay);
    this.bus.connect(master); this.bus.connect(delay); delay.connect(master);
    this.next = actx.currentTime + 0.1;
    this.timer = setInterval(() => this.schedule(), 25);
  },
  schedule() {
    const s16 = 60 / this.bpm / 4;
    while (this.next < actx.currentTime + 0.12) {
      this.play(this.step, this.next, s16);
      this.next += s16; this.step++;
    }
  },
  osc(type, f, t, dur, vol, cutoff = 4000, dest = this.bus) {
    const o = actx.createOscillator(), g = actx.createGain(), fl = actx.createBiquadFilter();
    o.type = type; o.frequency.value = f;
    fl.type = "lowpass"; fl.frequency.value = cutoff;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(fl); fl.connect(g); g.connect(dest);
    o.start(t); o.stop(t + dur + 0.05);
  },
  play(step, t, s16) {
    const bar = Math.floor(step / 16) % 4, s = step % 16, ch = this.chords[bar];
    // kick
    if (s % 4 === 0) {
      const o = actx.createOscillator(), g = actx.createGain();
      o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(40, t + 0.15);
      g.gain.setValueAtTime(0.9, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
      o.connect(g); g.connect(master); o.start(t); o.stop(t + 0.35);
    }
    // snare / clap
    if (s === 4 || s === 12) {
      const buf = actx.createBuffer(1, actx.sampleRate * 0.2, actx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
      const n = actx.createBufferSource(), f = actx.createBiquadFilter(), g = actx.createGain();
      n.buffer = buf; f.type = "highpass"; f.frequency.value = 1200; g.gain.value = 0.35;
      n.connect(f); f.connect(g); g.connect(master); n.start(t);
    }
    // hat
    if (s % 2 === 1) this.osc("square", 9000 + Math.random() * 2000, t, 0.04, 0.03, 12000, master);
    // bass
    if (s % 2 === 0) this.osc("sawtooth", this.hz(ch[0] - 24), t, s16 * 1.8, 0.22, 600);
    // pad
    if (s === 0) ch.forEach((m) => this.osc("sawtooth", this.hz(m), t, s16 * 16, 0.05, 1400));
    // arp
    const arp = [0, 1, 2, 1, 2, 0, 2, 1];
    if (s % 2 === 0) this.osc("triangle", this.hz(ch[arp[(s / 2) % 8]] + 12), t, s16 * 1.5, 0.08, 3000);
  },
};

// Visualizador
const viz = $("viz"), vctx = viz.getContext("2d");
function drawViz(bins) {
  const w = viz.width, h = viz.height, n = 48;
  vctx.clearRect(0, 0, w, h);
  const bw = w / n;
  for (let i = 0; i < n; i++) {
    const v = bins ? bins[Math.floor(i * 1.6)] / 255 : 0.05;
    const bh = Math.max(2, v * h);
    const grad = vctx.createLinearGradient(0, h, 0, 0);
    grad.addColorStop(0, P.accent); grad.addColorStop(1, P.accent2);
    vctx.fillStyle = grad;
    vctx.fillRect(i * bw + 1, h - bh, bw - 2, bh);
  }
}

/* ============================================================
   Cena 3D
   ============================================================ */
const canvas = $("bg");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 200);
camera.position.set(0, 0, 9);

const cA = new THREE.Color(P.accent), cB = new THREE.Color(P.accent2);

// ============ BURACO NEGRO (raytracing relativístico) + UNIVERSO REAL ============
// Texturas: Solar System Scope (CC BY 4.0, baseadas em dados da NASA/ESO) · Asteroides: modelos 3D da NASA
const texLoader = new THREE.TextureLoader();
function loadTex(path, srgb = true) {
  const t = texLoader.load(path);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return t;
}
const rand = (a, b) => a + Math.random() * (b - a);

const bhRoot = new THREE.Group();
scene.add(bhRoot);
const RS = 0.5; // raio de Schwarzschild em unidades do mundo

// Orientação do disco de acreção e da Via Láctea no céu
const diskN = new THREE.Vector3(0, 1, 0).applyEuler(new THREE.Euler(0.3, 0, -0.18)).normalize();
const diskU = new THREE.Vector3().crossVectors(diskN, new THREE.Vector3(0, 0, 1)).normalize();
const diskV = new THREE.Vector3().crossVectors(diskN, diskU).normalize();
// centro da galáxia bem atrás do buraco negro, com a faixa da Via Láctea inclinada
const skyRot = new THREE.Matrix3().setFromMatrix4(
  new THREE.Matrix4().makeRotationX(0.55).multiply(new THREE.Matrix4().makeRotationY(-Math.PI / 2 - 0.32))
);

const skyTex = loadTex("assets/tex/8k_stars_milky_way.jpg");
skyTex.minFilter = THREE.LinearMipmapLinearFilter;
skyTex.mapping = THREE.EquirectangularReflectionMapping; // o nível do mipmap é escolhido no shader (textureLod), sem costura

// Galáxias reais do Hubble (ESA/Hubble, CC BY 4.0) pregadas no céu — também são curvadas pela lente
function galaxyDecal(path, dir, rollDeg, halfDeg, aspect, bright) {
  const tex = loadTex(path);
  const d = new THREE.Vector3(...dir).normalize();
  const right = new THREE.Vector3().crossVectors(d, new THREE.Vector3(0, 1, 0)).normalize();
  const up = new THREE.Vector3().crossVectors(right, d).normalize();
  const q = new THREE.Quaternion().setFromAxisAngle(d, THREE.MathUtils.degToRad(rollDeg));
  right.applyQuaternion(q); up.applyQuaternion(q);
  const halfTan = Math.tan(THREE.MathUtils.degToRad(halfDeg));
  return { tex, d, right, up, params: new THREE.Vector3(halfTan, aspect, bright), halfDeg };
}
const galA = galaxyDecal("assets/tex/gal_heic0506a.jpg", [0.2, 0.36, -0.9], -18, 12, 1280 / 886, 1.5);   // Rodamoinho (M51)
const galB = galaxyDecal("assets/tex/gal_opo0328a.jpg", [0.58, -0.3, -0.76], 14, 9, 1280 / 717, 1.3);   // Sombrero (M104)

const bhUniforms = {
  uGalA: { value: galA.tex }, uGalADir: { value: galA.d }, uGalARight: { value: galA.right }, uGalAUp: { value: galA.up }, uGalAPrm: { value: galA.params },
  uGalB: { value: galB.tex }, uGalBDir: { value: galB.d }, uGalBRight: { value: galB.right }, uGalBUp: { value: galB.up }, uGalBPrm: { value: galB.params },
  uGalLod: { value: 0 },
  uSky: { value: skyTex },
  uSkyRot: { value: skyRot },
  uCamWorld: { value: new THREE.Matrix4() },
  uProjInv: { value: new THREE.Matrix4() },
  uViewProj: { value: new THREE.Matrix4() },
  uCamPos: { value: new THREE.Vector3() },
  uCenter: { value: new THREE.Vector3() },
  uDiskN: { value: diskN }, uDiskU: { value: diskU }, uDiskV: { value: diskV },
  uRs: { value: RS },
  uSkyLod: { value: 0 },
  uTime: { value: 0 },
  uAudio: { value: 0 },
};

const blackHole = new THREE.Mesh(
  new THREE.PlaneGeometry(2, 2),
  new THREE.ShaderMaterial({
    uniforms: bhUniforms,
    depthTest: true, depthWrite: true, depthFunc: THREE.AlwaysDepth,
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`,
    fragmentShader: /* glsl */ `
      precision highp float;
      uniform sampler2D uSky;
      uniform mat3 uSkyRot;
      uniform mat4 uCamWorld, uProjInv, uViewProj;
      uniform vec3 uCamPos, uCenter, uDiskN, uDiskU, uDiskV;
      uniform float uRs, uTime, uAudio, uSkyLod, uGalLod;
      uniform sampler2D uGalA, uGalB;
      uniform vec3 uGalADir, uGalARight, uGalAUp, uGalAPrm, uGalBDir, uGalBRight, uGalBUp, uGalBPrm;
      varying vec2 vUv;

      // Foto de galáxia projetada num pedaço do céu (projeção gnomônica)
      vec3 galaxy(sampler2D tex, vec3 d, vec3 dir, vec3 right, vec3 up, vec3 prm) {
        float c = dot(d, dir);
        if (c < 0.6) return vec3(0.0);
        vec2 l = vec2(dot(d, right), dot(d, up)) / c / prm.x;
        vec2 uv = vec2(l.x, l.y * prm.y) * 0.5 + 0.5;
        if (uv.x < 0.0 || uv.y < 0.0 || uv.x > 1.0 || uv.y > 1.0) return vec3(0.0);
        float mask = smoothstep(1.0, 0.55, length(vec2(l.x, l.y * prm.y)));
        vec3 g = max(textureLod(tex, uv, uGalLod).rgb - 0.04, 0.0);
        return g * g * 1.6 * mask * prm.z;
      }

      vec3 sky(vec3 d) {
        vec3 gal = galaxy(uGalA, d, uGalADir, uGalARight, uGalAUp, uGalAPrm)
                 + galaxy(uGalB, d, uGalBDir, uGalBRight, uGalBUp, uGalBPrm);
        d = uSkyRot * d;
        vec2 uv = vec2(atan(d.z, d.x) / 6.2831853 + 0.5, asin(clamp(d.y, -1.0, 1.0)) / 3.14159265 + 0.5);
        vec3 c = textureLod(uSky, uv, uSkyLod).rgb;
        return c * 2.6 + c * c * 3.0 + gal;   // realça a faixa da Via Láctea sem estourar o céu escuro
      }

      float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float noise(vec2 p) {
        vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
        return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
      }
      float fbm(vec2 p) { float v = 0.0, a = 0.5; for (int i = 0; i < 5; i++) { v += a * noise(p); p = p * 2.03 + 7.1; a *= 0.5; } return v; }

      // Cor de um corpo negro na temperatura T (Kelvin)
      vec3 blackbody(float T) {
        T = clamp(T, 1000.0, 40000.0) / 100.0;
        float hot = step(66.0, T);                        // sem ramos: evita pow/log de número negativo
        float tHot = max(T - 60.0, 1.0);
        vec3 c;
        c.r = mix(1.0, clamp(1.2929362 * pow(tHot, -0.1332048), 0.0, 1.0), hot);
        c.g = mix(clamp(0.3900816 * log(T) - 0.6318414, 0.0, 1.0), clamp(1.1298909 * pow(tHot, -0.0755148), 0.0, 1.0), hot);
        c.b = mix(clamp(0.5432068 * log(max(T - 10.0, 1.0)) - 1.1962541, 0.0, 1.0), 1.0, hot);
        return c;
      }

      // Disco fino: perfil de temperatura de Shakura-Sunyaev + Doppler relativístico + redshift gravitacional
      // Padrão do gás num ponto do plano do disco já girado
      float gas(vec2 q, float r) {
        float warp = fbm(q * 0.9);
        float rings = fbm(vec2(r * 3.2 + warp * 2.5, warp));
        float clumps = fbm(q * 2.6 + warp);
        return rings * clumps;
      }

      vec4 disk(vec3 p, float r, vec3 rayDir) {
        vec2 xy = vec2(dot(p, uDiskU), dot(p, uDiskV));
        // Rotação kepleriana (mais rápido perto do buraco). Duas camadas defasadas meio ciclo se
        // revezam: cada uma "reinicia" só quando está invisível, então o gás gira sem nunca enrolar/travar.
        float omega = 4.0 / pow(r, 1.5) * (1.0 + uAudio * 0.5);
        const float PERIOD = 7.0;
        float ph1 = fract(uTime / PERIOD), ph2 = fract(uTime / PERIOD + 0.5);
        float a1 = -omega * ph1 * PERIOD, a2 = -omega * ph2 * PERIOD;
        vec2 q1 = mat2(cos(a1), -sin(a1), sin(a1), cos(a1)) * xy;
        vec2 q2 = mat2(cos(a2), -sin(a2), sin(a2), cos(a2)) * xy + vec2(17.3, -9.1);
        float w1 = 1.0 - abs(ph1 * 2.0 - 1.0);
        float pattern = gas(q1, r) * w1 + gas(q2, r) * (1.0 - w1);
        float dens = (0.2 + 1.1 * pattern) * smoothstep(3.0, 3.4, r) * smoothstep(12.0, 6.5, r);

        float prof = pow(r / 3.0, -0.75) * pow(max(1.0 - sqrt(3.0 / r), 0.0), 0.25) / 0.49;
        vec3 vdir = normalize(cross(uDiskN, p));
        float beta = sqrt(0.5 / (r - 1.0)) * 0.85;
        float gamma = 1.0 / sqrt(1.0 - beta * beta);
        float dop = 1.0 / (gamma * (1.0 - beta * dot(vdir, -rayDir)));
        float g = dop * sqrt(1.0 - 1.0 / r);
        vec3 c = blackbody(3800.0 * prof * g) * pow(g, 3.0) * prof * prof * 0.9 * (1.0 + uAudio * 0.8);
        return vec4(c * dens, clamp(dens * 1.2, 0.0, 0.97));
      }

      float depthOf(vec3 pLocal) {
        vec4 clip = uViewProj * vec4(uCenter + pLocal * uRs, 1.0);
        return clamp(clip.z / clip.w * 0.5 + 0.5, 0.0, 1.0);
      }

      void main() {
        vec4 v = uProjInv * vec4(vUv * 2.0 - 1.0, 1.0, 1.0);
        vec3 dir = normalize((uCamWorld * vec4(v.xyz / v.w, 0.0)).xyz);
        vec3 pos = (uCamPos - uCenter) / uRs;              // unidades de raio de Schwarzschild
        float b = length(cross(pos, dir));                 // parâmetro de impacto

        // Longe do buraco: só a deflexão fraca de Einstein (2Rs/b), sem integrar
        if (b > 28.0) {
          vec3 toC = -(pos - dot(pos, dir) * dir);
          vec3 d = normalize(dir + toC / max(length(toC), 1e-4) * (2.0 / b));
          gl_FragColor = vec4(sky(d), 1.0);
          gl_FragDepth = 1.0;
          return;
        }

        // Perto: integra a trajetória do fóton (geodésica de Schwarzschild na forma de Binet)
        vec3 vel = dir;
        vec3 h = cross(pos, vel);
        float h2 = dot(h, h);
        vec3 col = vec3(0.0);
        float alpha = 0.0, depth = 1.0;
        bool captured = false, depthSet = false;
        for (int i = 0; i < 260; i++) {
          float r = length(pos);
          float dt = clamp(0.07 * r, 0.015, 1.2);
          vec3 prev = pos;
          vel += -1.5 * h2 * pos / pow(r, 5.0) * dt;
          pos += vel * dt;
          float s0 = dot(prev, uDiskN), s1 = dot(pos, uDiskN);
          if (s0 * s1 < 0.0) {
            vec3 p = mix(prev, pos, s0 / (s0 - s1));
            float rr = length(p);
            if (rr > 3.0 && rr < 12.0) {
              vec4 dc = disk(p, rr, normalize(vel));
              col += (1.0 - alpha) * dc.rgb;
              alpha += (1.0 - alpha) * dc.a;
              if (!depthSet && alpha > 0.18) { depth = depthOf(p); depthSet = true; }
              if (alpha > 0.98) break;
            }
          }
          if (dot(pos, pos) < 1.0) { captured = true; break; }
          if (r > 45.0 && dot(pos, vel) > 0.0) break;
        }
        if (captured) { if (!depthSet) depth = depthOf(normalize(pos)); }
        else col += (1.0 - alpha) * sky(normalize(vel));
        if (any(isnan(col)) || any(isinf(col))) col = vec3(0.0);   // um pixel inválido apagaria a tela toda no bloom
        gl_FragColor = vec4(min(col, vec3(200.0)), 1.0);
        gl_FragDepth = depth;
      }`,
  })
);
blackHole.frustumCulled = false;
blackHole.renderOrder = -1000;
scene.add(blackHole);

// Luz: o disco ilumina os planetas (quente) + um brilho azulado fraco da galáxia
const bhLight = new THREE.PointLight(0xffc48a, 70, 0, 1.3);
bhRoot.add(bhLight);
scene.add(new THREE.AmbientLight(0x8090c0, 0.06));
scene.add(new THREE.HemisphereLight(0x9ab0ff, 0x100808, 0.12));

// --- Planetas com texturas reais ---
const planets = [];
function addPlanet({ tex, r, orbit, speed, tilt = 0, ring, moon, phase }) {
  const pivot = new THREE.Group();
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(r, 96, 48),
    new THREE.MeshStandardMaterial({ map: loadTex(tex), roughness: 1, metalness: 0, envMapIntensity: 0.12 })
  );
  mesh.rotation.z = tilt;
  pivot.add(mesh);
  if (ring) {
    const inner = r * 1.25, outer = r * 2.3;
    const rg = new THREE.RingGeometry(inner, outer, 160, 1);
    const p = rg.attributes.position, uv = rg.attributes.uv;
    for (let i = 0; i < p.count; i++) uv.setXY(i, (Math.hypot(p.getX(i), p.getY(i)) - inner) / (outer - inner), 0.5);
    const rm = new THREE.Mesh(rg, new THREE.MeshStandardMaterial({
      map: loadTex(ring), transparent: true, side: THREE.DoubleSide, depthWrite: false, roughness: 1,
    }));
    rm.rotation.x = -Math.PI / 2;
    mesh.add(rm);
  }
  if (moon) {
    const m = new THREE.Mesh(new THREE.SphereGeometry(r * 0.27, 48, 24),
      new THREE.MeshStandardMaterial({ map: loadTex("assets/tex/2k_moon.jpg"), roughness: 1 }));
    pivot.add(m);
    pivot.userData.moon = m;
  }
  Object.assign(pivot.userData, { orbit, speed, phase, mesh, r });
  planets.push(pivot);
  bhRoot.add(pivot);
}
addPlanet({ tex: "assets/tex/2k_mars.jpg", r: 0.33, orbit: 7.8, speed: 0.1, phase: 1 });
addPlanet({ tex: "assets/tex/2k_saturn.jpg", r: 0.8, orbit: 11, speed: 0.06, tilt: 0.45, ring: "assets/tex/2k_saturn_ring_alpha.png", phase: 3.6 });
addPlanet({ tex: "assets/tex/2k_neptune.jpg", r: 0.5, orbit: 14, speed: 0.045, moon: true, phase: 5.3 });
addPlanet({ tex: "assets/tex/2k_jupiter.jpg", r: 1.3, orbit: 19, speed: 0.028, tilt: 0.05, phase: 2.3 });

// --- Cinturão com asteroides reais escaneados pela NASA ---
// flatShading: as normais vêm do próprio triângulo, então triângulos degenerados dos STL da NASA não geram NaN
const rockMat = new THREE.MeshStandardMaterial({ color: 0x8c8078, roughness: 1, metalness: 0, flatShading: true, envMapIntensity: 0.1 });
const belt = new THREE.Group();
belt.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), diskN);
bhRoot.add(belt);
const beltSets = [];
function normalizeGeo(g) {
  g.computeBoundingSphere();
  const s = g.boundingSphere;
  g.translate(-s.center.x, -s.center.y, -s.center.z);
  g.scale(1 / s.radius, 1 / s.radius, 1 / s.radius);
  if (!g.attributes.normal) g.computeVertexNormals();
  return g;
}
const stlLoader = new STLLoader();
["kleopatra", "toutatis", "geographos", "golevka", "mithra"].forEach((name) => {
  stlLoader.load(`assets/models/${name}.stl`, (geo) => {
    geo = normalizeGeo(geo);
    const COUNT = 70;
    const mesh = new THREE.InstancedMesh(geo, rockMat, COUNT);
    const data = [];
    for (let i = 0; i < COUNT; i++) {
      data.push({ r: rand(8.6, 10.2), a: Math.random() * Math.PI * 2, y: rand(-0.3, 0.3), s: rand(0.03, 0.12),
        rx: Math.random() * 6, ry: Math.random() * 6, spin: rand(0.2, 1) });
    }
    beltSets.push({ mesh, data });
    belt.add(mesh);
  });
});

// Bennu (OSIRIS-REx) girando em primeiro plano
let bennu = null;
new GLTFLoader().load("assets/models/bennu.glb", (gltf) => {
  bennu = gltf.scene;
  const box = new THREE.Box3().setFromObject(bennu);
  const size = box.getSize(new THREE.Vector3()).length();
  bennu.position.sub(box.getCenter(new THREE.Vector3()));
  const holder = new THREE.Group();
  holder.add(bennu);
  holder.scale.setScalar(1.1 / size);
  bennu.traverse((o) => { if (o.isMesh) { o.material.roughness = 1; o.material.metalness = 0; } });
  bennu = holder;
  bennu.position.set(-6.5, 2.6, 1.5);
  bhRoot.add(bennu);
});

// Reflexos das naves: ambiente gerado da própria foto da Via Láctea
texLoader.manager.onLoad = () => {
  if (scene.environment) return;
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromEquirectangular(skyTex).texture;
  pmrem.dispose();
};

// Naves reais (modelos da NASA): Voyager atravessando a cena e o James Webb estacionado ao longe
// os modelos de naves da NASA vêm comprimidos com Draco
const draco = new DRACOLoader().setDecoderPath("https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/libs/draco/gltf/");
const craftLoader = new GLTFLoader().setDRACOLoader(draco);
function loadCraft(path, size, onReady) {
  craftLoader.load(path, (gltf) => {
    const model = gltf.scene;
    const box = new THREE.Box3().setFromObject(model);
    model.position.sub(box.getCenter(new THREE.Vector3()));
    const holder = new THREE.Group();
    holder.add(model);
    holder.scale.setScalar(size / box.getSize(new THREE.Vector3()).length());
    model.traverse((o) => { if (o.isMesh && o.material) o.material.envMapIntensity = 0.9; });
    onReady(holder);
  });
}
let voyager = null, webb = null;
loadCraft("assets/models/voyager.glb", 1.1, (m) => { voyager = m; scene.add(m); });
loadCraft("assets/models/webb.glb", 1.4, (m) => { webb = m; m.position.set(5.2, 3.4, -4); bhRoot.add(m); });
// Uma luz fria "da galáxia" para as naves não ficarem só com a luz do disco
const rim = new THREE.DirectionalLight(0x9fb4ff, 0.6);
rim.position.set(-5, 6, 4);
scene.add(rim);

const dummy = new THREE.Object3D();
function updateWorld(t, dt, energy) {
  const sc = innerWidth < 700 ? 0.75 : 1;
  bhRoot.scale.setScalar(sc);
  bhRoot.updateMatrixWorld();

  camera.updateMatrixWorld();
  bhUniforms.uCamWorld.value.copy(camera.matrixWorld);
  bhUniforms.uProjInv.value.copy(camera.projectionMatrixInverse);
  bhUniforms.uViewProj.value.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
  bhUniforms.uCamPos.value.copy(camera.position);
  bhRoot.getWorldPosition(bhUniforms.uCenter.value);
  bhUniforms.uRs.value = RS * sc;
  bhUniforms.uTime.value = t;
  bhUniforms.uAudio.value = energy;
  // quantos texels do céu cabem num pixel da tela -> nível de mipmap
  const texelsPerPixel = (THREE.MathUtils.degToRad(camera.fov) / renderer.domElement.height) * (8192 / (2 * Math.PI));
  bhUniforms.uSkyLod.value = Math.max(0, Math.log2(texelsPerPixel));
  const galTexels = (THREE.MathUtils.degToRad(camera.fov) / renderer.domElement.height) * (1280 / THREE.MathUtils.degToRad(galA.halfDeg * 2));
  bhUniforms.uGalLod.value = Math.max(0, Math.log2(galTexels));

  planets.forEach((p) => {
    const u = p.userData;
    const a = u.phase + t * u.speed;
    // órbitas inclinadas e atrás do buraco negro
    p.position.set(Math.cos(a) * u.orbit, Math.sin(a) * u.orbit * 0.25, Math.sin(a) * u.orbit * 0.4 - u.orbit * 0.55);
    u.mesh.rotation.y += dt * 0.12;
    if (u.moon) u.moon.position.set(Math.cos(t * 0.6) * u.r * 2.4, Math.sin(t * 0.6) * u.r * 0.5, Math.sin(t * 0.6) * u.r * 2.4);
  });

  const sp = 1 + energy * 1.2;
  beltSets.forEach(({ mesh, data }) => {
    for (let i = 0; i < data.length; i++) {
      const d = data[i];
      d.a += (0.55 / Math.pow(d.r, 1.5)) * dt * sp;
      d.rx += dt * d.spin * 0.4; d.ry += dt * d.spin * 0.3;
      dummy.position.set(Math.cos(d.a) * d.r, d.y, Math.sin(d.a) * d.r);
      dummy.rotation.set(d.rx, d.ry, 0);
      const wz = Math.sin(d.a) * d.r;   // lado mais perto da câmera
      dummy.scale.setScalar(d.s * THREE.MathUtils.smoothstep(-wz, -7.5, -4.5));
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  if (bennu) { bennu.rotation.y += dt * 0.15; bennu.rotation.x = 0.4 + Math.sin(t * 0.2) * 0.1; }
  if (voyager) {
    // passa devagar da esquerda para a direita, em primeiro plano, e recomeça (ciclo de 70 s)
    const k = (t % 70) / 70;
    voyager.position.set(THREE.MathUtils.lerp(-11, 13, k), -2.2 + Math.sin(k * Math.PI) * 1.2, THREE.MathUtils.lerp(1.5, -1, k));
    voyager.rotation.set(0.3 + t * 0.03, t * 0.07, 0.15);
  }
  if (webb) { webb.lookAt(bhUniforms.uCenter.value); webb.rotateY(Math.PI / 2); webb.position.y = 3.4 + Math.sin(t * 0.3) * 0.15; }
  bhLight.intensity = 70 + energy * 70;
}

// Pós-processamento (bloom)
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.35, 0.2, 0.85);
composer.addPass(bloom);
composer.addPass(new OutputPass());
// Acabamento de filme: aberração cromática, vinheta, grão e faixas pretas (no modo "ver o fundo")
const film = new ShaderPass({
  uniforms: { tDiffuse: { value: null }, uTime: { value: 0 }, uBars: { value: 0 }, uAspect: { value: 1 } },
  vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: `
    uniform sampler2D tDiffuse; uniform float uTime, uBars, uAspect; varying vec2 vUv;
    float rnd(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233)) + uTime * 7.13) * 43758.5453); }
    void main() {
      vec2 c = vUv - 0.5;
      vec2 off = c * 0.016 * dot(c, c);
      vec3 col = vec3(texture2D(tDiffuse, vUv + off).r, texture2D(tDiffuse, vUv).g, texture2D(tDiffuse, vUv - off).b);
      float vig = smoothstep(0.95, 0.3, length(c * vec2(uAspect, 1.0)) / max(uAspect, 1.0) * 1.1);
      col *= mix(1.0, vig, 0.55);
      col += (rnd(vUv) - 0.5) * 0.035;
      float bar = 0.1 * uBars;
      col *= step(bar, vUv.y) * step(vUv.y, 1.0 - bar);
      gl_FragColor = vec4(col, 1.0);
    }`,
});
composer.addPass(film);

// Ajusta o tamanho sempre que a janela mudar (inclusive se a página abriu com tamanho zero)
const lastSize = new THREE.Vector2();
function fitRenderer() {
  if (lastSize.x === innerWidth && lastSize.y === innerHeight) return;
  lastSize.set(innerWidth, innerHeight);
  camera.aspect = innerWidth / Math.max(1, innerHeight);
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  composer.setSize(innerWidth, innerHeight);
}
addEventListener("resize", fitRenderer);

// Posição do buraco negro: atrás do card no celular, ao lado no desktop
function coreX() { return innerWidth > 1100 ? 4.6 : 0; }

let entered = false, intro = 0, beat = 0, lastT = 0, viewMode = false, view = 0;
const clock = new THREE.Clock();

function loop() {
  requestAnimationFrame(loop);
  const t = clock.getElapsedTime();
  const dt = Math.min(0.05, t - lastT); lastT = t;

  // Áudio -> energia
  let level = 0, bins = null;
  const ytPlaying = ytMode && ytReady && playing && yt.getPlayerState?.() === YT.PlayerState.PLAYING;
  if (ytPlaying) {
    ({ level, bins } = simulatedBeat(t));
  } else if (analyser && playing) {
    analyser.getByteFrequencyData(freq);
    bins = freq;
    let bass = 0;
    for (let i = 0; i < 8; i++) bass += freq[i];
    level = bass / (8 * 255);
  }
  level = Math.max(level, boost);
  boost *= 0.96;
  if (document.body.classList.contains("chaos")) level = Math.max(level, 0.6 + 0.4 * Math.sin(t * 12));
  beat += (level - beat) * 0.25;
  root.style.setProperty("--beat", beat.toFixed(3));
  drawViz(bins);

  // Intro: câmera mergulha ao entrar
  if (entered) intro = Math.min(1, intro + dt * 0.45);
  const ease = 1 - Math.pow(1 - intro, 3);


  view += ((viewMode ? 1 : 0) - view) * 0.04;
  const tx = coreX() * ease * (1 - view);
  bhRoot.position.x += (tx - bhRoot.position.x) * 0.05;

  bloom.strength = 0.3 + beat * 0.35;
  film.uniforms.uTime.value = t;
  film.uniforms.uBars.value = view;
  film.uniforms.uAspect.value = innerWidth / Math.max(1, innerHeight);

  // Parallax do mouse + intro
  const mx = (cx / innerWidth - 0.5), my = (cy / innerHeight - 0.5);
  const targetZ = THREE.MathUtils.lerp(26, 9, ease) - view * 1.5;
  const par = 1 + view * 2.5;   // no modo "ver o fundo" o mouse gira mais a cena
  camera.position.x += (mx * 2.2 * par - camera.position.x) * 0.04;
  camera.position.y += (-my * 1.6 * par - camera.position.y) * 0.04;
  camera.position.z += (targetZ - camera.position.z) * 0.06;
  camera.lookAt(tx * 0.15, 0, 0);

  // cursor suave
  rx += (cx - rx) * 0.18; ry += (cy - ry) * 0.18;
  cur.style.transform = `translate(${cx}px, ${cy}px) translate(-50%, -50%)`;
  ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -50%)`;

  fitRenderer();
  updateWorld(t, dt, beat);
  composer.render();
}
camera.position.z = 26;
loop();

/* ============================================================
   Entrada
   ============================================================ */
$("enter").addEventListener("click", () => {
  $("enter").classList.add("gone");
  $("app").classList.remove("hidden");
  $("view-btn").classList.remove("hidden");
  entered = true;
  startMusic();
}, { once: true });

// Botão "ver o fundo": esconde o card e deixa só o universo
function toggleView() {
  viewMode = !viewMode;
  document.body.classList.toggle("view-mode", viewMode);
  $("icon-eye").classList.toggle("hidden", viewMode);
  $("icon-card").classList.toggle("hidden", !viewMode);
  $("view-label").textContent = viewMode ? "ver perfil" : "ver o fundo";
  $("view-btn").setAttribute("aria-label", viewMode ? "Ver perfil" : "Ver o fundo");
}
$("view-btn").addEventListener("click", toggleView);
addEventListener("keydown", (e) => {
  if (!entered || e.target.closest?.("input")) return;
  if (e.key === "h" || e.key === "H" || (e.key === "Escape" && viewMode)) toggleView();
});
