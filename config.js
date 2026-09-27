// ============================================================
//  EDITE AQUI — tudo do seu perfil fica neste arquivo
// ============================================================
window.PROFILE = {
  name: "jester",
  tag: "@zynxvoid_",
  // Foto do avatar (baixada do seu Roblox). Deixe "" para usar o avatar do Discord (se discordId estiver preenchido)
  avatar: "assets/avatar.png",
  // Frases que ficam "digitando" embaixo do nome
  roles: ["Jester", "HR", "Vida complicado"],
  // Etiquetas/cargos que aparecem como badges
  badges: [
    { label: "Jester", icon: "🃏" },
    { label: "HR", icon: "👑" },
    { label: "Roblox", icon: "🎮" },
  ],
  bio: "Me acha nas plataformas aí embaixo.",

  // ID do seu usuário no Discord (Configurações > Avançado > Modo desenvolvedor > clique direito no seu perfil > Copiar ID)
  // Para o status ao vivo funcionar, entre no servidor do Lanyard: https://discord.gg/lanyard
  discordId: "",

  // Cor principal do tema
  accent: "#ff5e1a",
  accent2: "#8b5cf6",

  // Músicas do YouTube. Para adicionar, copie um bloco { ... } e troque o ID (o que vem depois de "watch?v=").
  // bpm = ritmo da música, usado para a pulsação do universo. shuffle: true = ordem aleatória.
  music: {
    shuffle: false,
    playlist: [
      { youtube: "-Q8rb4OGHak", title: "BLUE LOCK: BIG BANG DRIVE (Thesius Remix)", artist: "THESIUS MUSICAL", bpm: 140 },
      { youtube: "m4NMSr837Y0", title: "Nightcore - Doktorspiele", artist: "Maikel6311's Nightcore", bpm: 150 },
      { youtube: "lWuxtLzMcjE", title: "Itoshi Sae vs Everyone Theme (Cover)", artist: "Hamon Music", bpm: 130 },
      { youtube: "6ldn3K0JcLg", title: "Undertale - Tears in the Rain", artist: "Dreamer 6093", bpm: 80 },
    ],
    // reserva, se nenhum vídeo carregar
    src: "assets/music.mp3",
    title: "Trilha do perfil",
    artist: "jester",
  },

  // Plataformas. platform = nome do ícone do simple-icons (discord, roblox, instagram, tiktok, youtube, github, x, twitch, spotify, steam...)
  // Se "copy" for true, clicar copia o handle em vez de abrir link.
  links: [
    { platform: "discord",   label: "Discord",   handle: "zynxvoid_",  url: "", copy: true, color: "#5865F2" },
    { platform: "roblox",    label: "Roblox",    handle: "@ahr7onix",  url: "https://www.roblox.com/users/7582222957/profile", color: "#e2e2e2" },
    { platform: "instagram", label: "Instagram", handle: "@ahr7onix",  url: "https://www.instagram.com/ahr7onix/", color: "#E4405F" },
  ],

  // Opcional: jogos/grupos em destaque (deixe [] para esconder)
  featured: [],
};
