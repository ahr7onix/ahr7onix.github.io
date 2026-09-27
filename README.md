# Perfil 3D

Página de perfil com um universo 3D (Three.js): buraco negro com disco de acreção e lente gravitacional, planetas orbitando, cinturão de asteroides, nebulosas, galáxias e cometas, tudo reagindo à música. Também tem card com inclinação 3D, efeito glitch, status ao vivo do Discord e música com visualizador.

## Personalizar

Tudo fica em **`config.js`**: nome, cargos (HR, Jester...), bio, cores, links (Discord, Roblox, Instagram...) e destaques.

- **Música:** coloque um arquivo em `assets/music.mp3`. Sem arquivo, toca uma trilha synthwave gerada pelo próprio navegador.
- **Avatar:** coloque a URL em `avatar`, ou salve em `assets/avatar.png` e use `"assets/avatar.png"`.
- **Status do Discord ao vivo:** preencha `discordId` e entre no servidor do [Lanyard](https://discord.gg/lanyard). Assim aparece a bolinha online/ausente, o jogo que você está jogando ou a música do Spotify.
- **Ícones:** o campo `platform` usa os nomes do [Simple Icons](https://simpleicons.org) (`discord`, `roblox`, `instagram`, `tiktok`, `youtube`, `github`, `x`, `twitch`, `spotify`, `steam`...).

## Rodar localmente

Módulos JS não funcionam abrindo o arquivo direto; rode um servidor:

```bash
python -m http.server 8000
```

Depois abra http://localhost:8000

## Publicar no GitHub Pages

1. Crie um repositório (ex.: `seunick.github.io`) e suba estes arquivos.
2. No repositório: **Settings → Pages → Source: Deploy from a branch → `main` / root**.
3. Em cerca de 1 minuto o site fica no ar em `https://seunick.github.io`.
