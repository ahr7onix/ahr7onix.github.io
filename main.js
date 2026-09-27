import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";

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
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x05030a, 0.008);
const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 200);
camera.position.set(0, 0, 9);

const cA = new THREE.Color(P.accent), cB = new THREE.Color(P.accent2);
const dotTex = (() => {
  const c = document.createElement("canvas"); c.width = c.height = 64;
  const g = c.getContext("2d"), grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grd.addColorStop(0, "rgba(255,255,255,1)"); grd.addColorStop(0.4, "rgba(255,255,255,.5)"); grd.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grd; g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
})();

// ============ BURACO NEGRO ============
const bhUniforms = { uTime: { value: 0 }, uAudio: { value: 0 }, uA: { value: cA } };

// Função de "plasma" girando, compartilhada pelo disco e pela lente
const swirlGLSL = /* glsl */ `
  uniform float uTime; uniform float uAudio; uniform vec3 uA;
  float swirl(float r, float a) {
    float t = uTime * (1.0 + uAudio * 1.5);
    float n = sin(a * 6.0 + log(r) * 14.0 - t * 4.0 / r) * sin(a * 11.0 - log(r) * 9.0 - t * 6.0 / r);
    n += 0.5 * sin(r * 22.0 - t * 3.0);
    return 0.55 + 0.45 * n;
  }
  vec3 heat(float h) {
    vec3 hot = vec3(1.0, 0.92, 0.75);
    vec3 mid = mix(uA, vec3(1.0, 0.55, 0.15), 0.5);
    vec3 cold = uA * 0.35;
    return h > 0.5 ? mix(mid, hot, (h - 0.5) * 2.0) : mix(cold, mid, h * 2.0);
  }
`;
const vPass = /* glsl */ `varying vec2 vP; void main(){ vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`;

const bh = new THREE.Group();          // tudo que gira junto com o disco
bh.rotation.set(0.38, 0, -0.2);
const bhRoot = new THREE.Group();      // posição geral
bhRoot.add(bh);
scene.add(bhRoot);

// Horizonte de eventos
const horizon = new THREE.Mesh(new THREE.SphereGeometry(1.2, 64, 64), new THREE.MeshBasicMaterial({ color: 0x000000, fog: false }));
bhRoot.add(horizon);

// Disco de acreção
const INNER = 1.5, OUTER = 5.8;
const disk = new THREE.Mesh(
  new THREE.RingGeometry(INNER, OUTER, 256, 16),
  new THREE.ShaderMaterial({
    uniforms: bhUniforms, vertexShader: vPass,
    fragmentShader: swirlGLSL + /* glsl */ `
      varying vec2 vP;
      void main() {
        float r = length(vP), a = atan(vP.y, vP.x);
        float k = 1.0 - (r - ${INNER.toFixed(1)}) / ${(OUTER - INNER).toFixed(1)};
        float I = pow(k, 2.4) * smoothstep(${INNER.toFixed(1)}, ${(INNER + 0.25).toFixed(2)}, r);
        I *= swirl(r, a);
        I *= 1.0 + 0.7 * cos(a);                 // efeito Doppler: um lado mais brilhante
        I *= 1.1 + uAudio * 1.2;
        gl_FragColor = vec4(heat(pow(k, 1.5)) * I * 0.9, 1.0);
      }`,
    transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
  })
);
disk.rotation.x = -Math.PI / 2;
bh.add(disk);

// Lente gravitacional: o disco "dobrando" por cima e por baixo do buraco (sempre virado pra câmera)
const lens = new THREE.Mesh(
  new THREE.RingGeometry(1.26, 3.0, 256, 8),
  new THREE.ShaderMaterial({
    uniforms: bhUniforms, vertexShader: vPass,
    fragmentShader: swirlGLSL + /* glsl */ `
      varying vec2 vP;
      void main() {
        float r = length(vP), a = atan(vP.y, vP.x);
        float k = 1.0 - (r - 1.26) / 1.74;
        float I = pow(k, 4.0) * swirl(r * 1.7, a * 0.5 + 1.0);
        I *= 0.55 + 0.45 * sin(a);                 // arco de cima mais forte
        I *= 1.0 + uAudio;
        gl_FragColor = vec4(heat(0.3 + k * 0.5) * I * 0.6, 1.0);
      }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  })
);
bhRoot.add(lens);

// Anel de fótons: fio de luz colado no horizonte
const photon = new THREE.Mesh(
  new THREE.RingGeometry(1.2, 1.3, 256),
  new THREE.ShaderMaterial({
    uniforms: bhUniforms, vertexShader: vPass,
    fragmentShader: /* glsl */ `
      uniform float uAudio; uniform vec3 uA; varying vec2 vP;
      void main() {
        float r = length(vP);
        float I = 1.0 - abs(r - 1.235) / 0.065;
        I = pow(max(I, 0.0), 2.0) * (1.0 + uAudio * 1.5);
        gl_FragColor = vec4(mix(uA, vec3(1.0, 0.95, 0.85), 0.7) * I, 1.0);
      }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  })
);
bhRoot.add(photon);

// Matéria sendo sugada em espiral
const INFALL = 3000;
const inf = { r: new Float32Array(INFALL), a: new Float32Array(INFALL), y: new Float32Array(INFALL) };
const infPos = new Float32Array(INFALL * 3), infCol = new Float32Array(INFALL * 3);
const hotC = new THREE.Color(1, 0.9, 0.7), tmpC = new THREE.Color();
function spawn(i, anywhere) {
  inf.r[i] = anywhere ? 1.4 + Math.random() * 9 : 7 + Math.random() * 4;
  inf.a[i] = Math.random() * Math.PI * 2;
  inf.y[i] = (Math.random() - 0.5) * 0.25 * inf.r[i] * 0.3;
}
for (let i = 0; i < INFALL; i++) spawn(i, true);
const infGeo = new THREE.BufferGeometry();
infGeo.setAttribute("position", new THREE.BufferAttribute(infPos, 3));
infGeo.setAttribute("color", new THREE.BufferAttribute(infCol, 3));
const infall = new THREE.Points(infGeo, new THREE.PointsMaterial({
  size: 0.09, map: dotTex, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
}));
bh.add(infall);

function updateInfall(dt, energy) {
  const speed = 1 + energy * 2;
  for (let i = 0; i < INFALL; i++) {
    const r = inf.r[i];
    inf.a[i] += (2.2 / Math.pow(r, 1.5)) * dt * speed;
    inf.r[i] -= (0.35 / Math.sqrt(r)) * dt * speed;
    inf.y[i] *= 0.995;
    if (inf.r[i] < 1.35) spawn(i, false);
    const rr = inf.r[i];
    infPos[i * 3] = Math.cos(inf.a[i]) * rr;
    infPos[i * 3 + 1] = inf.y[i];
    infPos[i * 3 + 2] = Math.sin(inf.a[i]) * rr;
    const h = Math.max(0, 1 - (rr - 1.35) / 8);
    tmpC.copy(cB).lerp(cA, Math.min(1, h * 1.6)).lerp(hotC, h * h);
    const fade = Math.min(1, (rr - 1.35) * 2) * (0.15 + h * 0.6);
    infCol[i * 3] = tmpC.r * fade; infCol[i * 3 + 1] = tmpC.g * fade; infCol[i * 3 + 2] = tmpC.b * fade;
  }
  infGeo.attributes.position.needsUpdate = true;
  infGeo.attributes.color.needsUpdate = true;
}

// ============ UNIVERSO ============
const rand = (a, b) => a + Math.random() * (b - a);
const CYAN = new THREE.Color("#22d3ee"), PINK = new THREE.Color("#ec4899");

function canvasTex(w, h, draw) {
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  draw(c.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
const css = (c, a = 1) => `rgba(${(c.r * 255) | 0},${(c.g * 255) | 0},${(c.b * 255) | 0},${a})`;

// Luz: o disco de acreção ilumina os planetas
const bhLight = new THREE.PointLight(0xffb070, 60, 0, 1.4);
bhRoot.add(bhLight);
scene.add(new THREE.AmbientLight(0x6060a0, 0.25));

// --- Nebulosas ---
function cloudTex(c1, c2) {
  return canvasTex(256, 256, (g, w, h) => {
    for (let i = 0; i < 60; i++) {
      const x = w / 2 + rand(-70, 70), y = h / 2 + rand(-70, 70), r = rand(20, 80);
      const col = Math.random() < 0.5 ? c1 : c2;
      const grd = g.createRadialGradient(x, y, 0, x, y, r);
      grd.addColorStop(0, css(col, 0.05)); grd.addColorStop(1, css(col, 0));
      g.fillStyle = grd; g.fillRect(0, 0, w, h);
    }
  });
}
const nebulae = [];
[[cB, PINK, -60, 18, 12, 70], [cA, cB, 40, -14, -50, 60], [CYAN, cB, -25, -20, -35, 50],
 [PINK, cA, 55, 22, -70, 80], [cB, CYAN, 0, 30, -90, 90]].forEach(([c1, c2, x, y, z, s]) => {
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({
    map: cloudTex(c1, c2), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, opacity: 0.55,
  }));
  sp.position.set(x, y, z); sp.scale.setScalar(s);
  sp.userData.spin = rand(-0.02, 0.02);
  nebulae.push(sp); scene.add(sp);
});

// --- Estrelas cintilantes (duas camadas) ---
function starLayer(count, spread, size) {
  const pos = new Float32Array(count * 3), col = new Float32Array(count * 3), ph = new Float32Array(count);
  const tints = [new THREE.Color("#ffffff"), new THREE.Color("#9ecbff"), new THREE.Color("#ffd2a1"), cB];
  for (let i = 0; i < count; i++) {
    const v = new THREE.Vector3().randomDirection().multiplyScalar(rand(spread * 0.4, spread));
    pos.set([v.x, v.y, v.z], i * 3);
    const c = tints[(Math.random() * tints.length) | 0];
    col.set([c.r, c.g, c.b], i * 3);
    ph[i] = Math.random() * 100;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  g.setAttribute("color", new THREE.BufferAttribute(col, 3));
  g.setAttribute("phase", new THREE.BufferAttribute(ph, 1));
  const m = new THREE.ShaderMaterial({
    uniforms: { uTime: bhUniforms.uTime, uSize: { value: size } },
    vertexShader: /* glsl */ `
      attribute float phase; attribute vec3 color; uniform float uTime; uniform float uSize;
      varying vec3 vC; varying float vT;
      void main() {
        vC = color;
        vT = 0.55 + 0.45 * sin(uTime * (1.0 + fract(phase) * 3.0) + phase);
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = min(3.5, uSize * (0.6 + vT) * (300.0 / -mv.z));
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      varying vec3 vC; varying float vT;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        float a = smoothstep(0.5, 0.0, d);
        gl_FragColor = vec4(vC * a * vT, 1.0);
      }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  return new THREE.Points(g, m);
}
const stars = starLayer(6000, 150, 0.35);
const starsNear = starLayer(800, 60, 0.25);
scene.add(stars, starsNear);

// --- Galáxia espiral gigante ao fundo ---
function galaxyPoints(count, radius, c1, c2) {
  const pos = new Float32Array(count * 3), col = new Float32Array(count * 3);
  const arms = 3 + ((Math.random() * 3) | 0);
  for (let i = 0; i < count; i++) {
    const r = Math.pow(Math.random(), 1.6) * radius;
    const arm = ((i % arms) / arms) * Math.PI * 2;
    const spin = (r / radius) * 5;
    const rnd = () => Math.pow(Math.random(), 3) * (Math.random() < 0.5 ? 1 : -1) * radius * 0.08;
    pos[i * 3] = Math.cos(arm + spin) * r + rnd();
    pos[i * 3 + 1] = rnd() * 0.5;
    pos[i * 3 + 2] = Math.sin(arm + spin) * r + rnd();
    const c = new THREE.Color(1, 0.9, 0.8).lerp(c1, Math.min(1, r / radius * 2)).lerp(c2, r / radius);
    col.set([c.r, c.g, c.b], i * 3);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  g.setAttribute("color", new THREE.BufferAttribute(col, 3));
  return new THREE.Points(g, new THREE.PointsMaterial({
    size: radius * 0.008, map: dotTex, vertexColors: true, transparent: true, depthWrite: false,
    blending: THREE.AdditiveBlending, fog: false,
  }));
}
const galaxies = [];
const gal = galaxyPoints(12000, 30, cA, cB);
gal.position.set(-20, 8, -75); gal.rotation.set(1.1, 0, 0.4);
galaxies.push(gal);
// galáxias distantes menores
for (let i = 0; i < 6; i++) {
  const gx = galaxyPoints(1500, rand(3, 6), [cA, CYAN, PINK][i % 3], cB);
  gx.position.set(rand(-90, 90), rand(-40, 40), rand(-110, -60));
  gx.rotation.set(rand(0, Math.PI), rand(0, Math.PI), 0);
  galaxies.push(gx);
}
galaxies.forEach((g, i) => { g.userData.spin = rand(0.01, 0.04); if (i) g.material.opacity = 0.55; scene.add(g); });

// --- Planetas ---
function planetTex(type, c1, c2) {
  return canvasTex(512, 256, (g, w, h) => {
    if (type === "gas") {
      for (let y = 0; y < h; y++) {
        const t = 0.5 + 0.5 * Math.sin(y * 0.09 + Math.sin(y * 0.021) * 4);
        const c = c1.clone().lerp(c2, t).multiplyScalar(0.8 + Math.random() * 0.2);
        g.fillStyle = css(c); g.fillRect(0, y, w, 1);
      }
      // tempestade
      g.fillStyle = css(c2.clone().lerp(new THREE.Color(1, 1, 1), 0.3), 0.8);
      g.beginPath(); g.ellipse(w * 0.3, h * 0.62, 28, 12, 0, 0, Math.PI * 2); g.fill();
    } else {
      g.fillStyle = css(c1); g.fillRect(0, 0, w, h);
      for (let i = 0; i < 400; i++) {
        const x = Math.random() * w, y = Math.random() * h, r = rand(2, 22);
        g.fillStyle = css(Math.random() < 0.5 ? c2 : c1.clone().multiplyScalar(0.6), rand(0.2, 0.6));
        g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
      }
      if (type === "ice") {
        g.fillStyle = "rgba(255,255,255,.85)";
        g.fillRect(0, 0, w, 22); g.fillRect(0, h - 22, w, 22);
      }
    }
  });
}
function ringTex(c) {
  return canvasTex(512, 8, (g, w) => {
    for (let x = 0; x < w; x++) {
      const a = Math.max(0, Math.sin(x * 0.12) * 0.4 + Math.sin(x * 0.037) * 0.3 + 0.3) * (x > w * 0.1 ? 1 : 0);
      g.fillStyle = css(c, a); g.fillRect(x, 0, 1, 8);
    }
  });
}

const planets = [];
function addPlanet({ r, orbit, speed, tilt = 0, type, c1, c2, ring, moon, phase = Math.random() * 6.28 }) {
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(r, 64, 32),
    new THREE.MeshStandardMaterial({ map: planetTex(type, c1, c2), roughness: 0.9, metalness: 0 })
  );
  // atmosfera
  mesh.add(new THREE.Mesh(
    new THREE.SphereGeometry(r * 1.08, 48, 24),
    new THREE.ShaderMaterial({
      uniforms: { uC: { value: c2 } },
      vertexShader: `varying vec3 vN; varying vec3 vV; void main(){ vec4 mv = modelViewMatrix*vec4(position,1.); vN = normalize(normalMatrix*normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }`,
      fragmentShader: `uniform vec3 uC; varying vec3 vN; varying vec3 vV; void main(){ float f = pow(1.0 - abs(dot(vN, vV)), 3.0); gl_FragColor = vec4(uC * f * 1.2, f); }`,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.BackSide,
    })
  ));
  const pivot = new THREE.Group();
  pivot.add(mesh);
  mesh.rotation.z = tilt;
  if (ring) {
    const rg = new THREE.RingGeometry(r * 1.4, r * 2.4, 128, 1);
    // UV radial para a textura dos anéis
    const p = rg.attributes.position, uv = rg.attributes.uv;
    for (let i = 0; i < p.count; i++) {
      const d = Math.hypot(p.getX(i), p.getY(i));
      uv.setXY(i, (d - r * 1.4) / (r * 1.0), 0.5);
    }
    const rm = new THREE.Mesh(rg, new THREE.MeshBasicMaterial({ map: ringTex(ring), transparent: true, side: THREE.DoubleSide, depthWrite: false }));
    rm.rotation.x = -Math.PI / 2 + 0.35;
    mesh.add(rm);
  }
  if (moon) {
    const m = new THREE.Mesh(new THREE.SphereGeometry(r * 0.27, 32, 16),
      new THREE.MeshStandardMaterial({ map: planetTex("rock", new THREE.Color("#8a8a92"), new THREE.Color("#5a5a64")), roughness: 1 }));
    pivot.add(m);
    pivot.userData.moon = m;
  }
  pivot.userData = { ...pivot.userData, orbit, speed, phase, mesh, r };
  planets.push(pivot);
  bhRoot.add(pivot);
}
addPlanet({ r: 0.35, orbit: 7.2, speed: 0.12, type: "rock", c1: new THREE.Color("#b5542c"), c2: new THREE.Color("#e08a4c"), phase: 1 });
addPlanet({ r: 0.9, orbit: 10.5, speed: 0.07, tilt: 0.3, type: "gas", c1: new THREE.Color("#c9a37a"), c2: new THREE.Color("#7d5a3a"), ring: new THREE.Color("#e8d2b0"), phase: 3.5 });
addPlanet({ r: 0.55, orbit: 13.5, speed: 0.05, type: "ice", c1: new THREE.Color("#3b6fb6"), c2: new THREE.Color("#7fd3f7"), moon: true, phase: 5.2 });
addPlanet({ r: 1.3, orbit: 19, speed: 0.03, tilt: -0.2, type: "gas", c1: cB.clone(), c2: new THREE.Color("#2a1a4a"), phase: 2.2 });

// --- Cinturão de asteroides ---
const AST = 500;
const astGeo = new THREE.DodecahedronGeometry(1, 0);
const asteroids = new THREE.InstancedMesh(astGeo, new THREE.MeshStandardMaterial({ color: 0x8a7f78, roughness: 1, flatShading: true }), AST);
const astData = [];
const dummy = new THREE.Object3D();
for (let i = 0; i < AST; i++) {
  astData.push({ r: rand(8.3, 9.3), a: Math.random() * Math.PI * 2, y: rand(-0.25, 0.25), s: rand(0.02, 0.09), rot: Math.random() * 6 });
}
bh.add(asteroids);

// --- Cometas / estrelas cadentes ---
const comets = [];
function makeComet() {
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(6), 3));
  g.setAttribute("color", new THREE.BufferAttribute(new Float32Array([1, 1, 1, 0, 0, 0]), 3));
  const line = new THREE.Line(g, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, fog: false }));
  line.userData = { life: 0, pos: new THREE.Vector3(), vel: new THREE.Vector3() };
  line.visible = false;
  comets.push(line); scene.add(line);
}
for (let i = 0; i < 4; i++) makeComet();
function launchComet(c) {
  const u = c.userData;
  u.pos.set(rand(-40, 40), rand(10, 30), rand(-60, -20));
  u.vel.set(rand(-1, 1), rand(-0.6, -0.2), rand(-0.1, 0.3)).normalize().multiplyScalar(rand(30, 55));
  u.life = rand(1.2, 2.2); u.len = rand(0.08, 0.14);
  c.visible = true;
}

function updateUniverse(t, dt, energy) {
  nebulae.forEach((n) => (n.material.rotation += n.userData.spin * dt));
  galaxies.forEach((g) => (g.rotation.y += g.userData.spin * dt));
  stars.rotation.y = t * 0.004;
  starsNear.rotation.y = t * 0.01;

  planets.forEach((p) => {
    const u = p.userData;
    const a = u.phase + t * u.speed;
    // órbitas inclinadas e sempre atrás do buraco negro, para nunca cobrirem o horizonte
    p.position.set(Math.cos(a) * u.orbit, Math.sin(a) * u.orbit * 0.25, Math.sin(a) * u.orbit * 0.4 - u.orbit * 0.55);
    u.mesh.rotation.y += dt * 0.25;
    if (u.moon) u.moon.position.set(Math.cos(t * 0.9) * u.r * 2.2, Math.sin(t * 0.9) * u.r * 0.6, Math.sin(t * 0.9) * u.r * 2.2);
  });

  const sp = 1 + energy * 1.5;
  for (let i = 0; i < AST; i++) {
    const d = astData[i];
    d.a += (0.6 / Math.pow(d.r, 1.5)) * dt * sp;
    d.rot += dt * 0.5;
    dummy.position.set(Math.cos(d.a) * d.r, d.y, Math.sin(d.a) * d.r);
    dummy.rotation.set(d.rot, d.rot * 0.7, 0);
    dummy.scale.setScalar(d.s);
    dummy.updateMatrix();
    asteroids.setMatrixAt(i, dummy.matrix);
  }
  asteroids.instanceMatrix.needsUpdate = true;

  comets.forEach((c) => {
    const u = c.userData;
    if (!c.visible) { if (Math.random() < 0.004) launchComet(c); return; }
    u.life -= dt;
    if (u.life <= 0) { c.visible = false; return; }
    u.pos.addScaledVector(u.vel, dt);
    const arr = c.geometry.attributes.position.array;
    arr[0] = u.pos.x; arr[1] = u.pos.y; arr[2] = u.pos.z;
    arr[3] = u.pos.x - u.vel.x * u.len; arr[4] = u.pos.y - u.vel.y * u.len; arr[5] = u.pos.z - u.vel.z * u.len;
    c.geometry.attributes.position.needsUpdate = true;
    c.material.opacity = Math.min(1, u.life);
  });

  bhLight.intensity = 60 + energy * 80;
}

// Pós-processamento (bloom)
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.55, 0.15, 0.5);
composer.addPass(bloom);
composer.addPass(new OutputPass());

addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  composer.setSize(innerWidth, innerHeight);
});

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
  beat += (level - beat) * 0.25;
  root.style.setProperty("--beat", beat.toFixed(3));
  drawViz(bins);

  // Intro: câmera mergulha ao entrar
  if (entered) intro = Math.min(1, intro + dt * 0.45);
  const ease = 1 - Math.pow(1 - intro, 3);

  bhUniforms.uTime.value = t;
  bhUniforms.uAudio.value = beat;
  updateInfall(dt, beat);
  bhRoot.scale.setScalar((innerWidth < 700 ? 0.75 : 1) * (1 + beat * 0.06));
  lens.quaternion.copy(camera.quaternion);
  photon.quaternion.copy(camera.quaternion);
  updateUniverse(t, dt, beat);

  view += ((viewMode ? 1 : 0) - view) * 0.04;
  const tx = coreX() * ease * (1 - view);
  bhRoot.position.x += (tx - bhRoot.position.x) * 0.05;

  bloom.strength = 0.5 + beat * 0.6;

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
