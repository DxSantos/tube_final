# TubeDX — Backend de extração de áudio do YouTube

Extrai o **áudio real** de um vídeo do YouTube usando `yt-dlp` e devolve a URL direta do stream.
O app TubeDX usa essa URL no Android (na web o vídeo é tocado pelo player oficial do YouTube).

## Endpoints

| Rota | Resposta |
| --- | --- |
| `GET /health` | `{ "ok": true }` |
| `GET /audio?videoId=VIDEO_ID` | `{ "url": "https://...googlevideo.com/..." }` (expira em poucas horas) |

## Pré-requisitos

- **Node.js** (já usado pelo Expo) — `npm install`
- **`yt-dlp`** na PATH — baixe o executável em <https://github.com/yt-dlp/yt-dlp/releases>
  (Windows: `yt-dlp.exe`; Linux/macOS: binário `yt-dlp` chmod +x). Os binários públicos são atualizados continuamente (o YouTube muda o site com frequência).
- **Python** (opcional, alternativo): `pipx install yt-dlp` ou `pip install yt-dlp` e renomear o script para `yt-dlp`.

## Rodar local (testar no emulador)

```powershell
cd C:\tube_final\backend
npm install
node server.js
```

O app no **emulador Android** deve apontar `BACKEND_URL` para `http://10.0.2.2:3001`
(`10.0.2.2` é o host do PC visto de dentro do emulador).

No **celular físico** na mesma rede Wi-Fi, use `http://<IP-DO-PC>:3001`
(PowerShell: `ipconfig` → IPv4 da sua Wi-Fi).

## Deploy gratuito (para celular real / público)

### Opção A — Render gratuito (recomendado)
1. Crie conta grátis em <https://render.com> (pode usar conta GitHub/Google).
2. No painel: **New → Blueprint** e conecte este repositório/pasta
   (o arquivo `render.yaml` já configura o serviço `tubedx-audio` com Docker).
   Alternativa manual: **New → Web Service** → runtime **Docker** → aponte para
   a pasta `backend/` (o `Dockerfile` instala `yt-dlp` automaticamente).
3. Aguarde o build terminar (fica "Live" com uma URL tipo
   `https://tubedx-audio.onrender.com`).
4. Copie essa URL para o `BACKEND_URL` no `C:\tube_final\App.js` e regenere o APK.

> No plano gratuito o Render desliga o serviço após ~15 min sem uso e demora
> ~50 segundos para acordar na primeira chamada. O app usa timeout de 20s e
> toca o MP3 demo se o backend não responder a tempo (sem travar).
> Para uso real, considere o plano pago do Render ou outro host sempre ligado
> (Railway/Fly.io são equivalentes).

### Alternativa temporária — túnel público (ngrok/cloudflared)
Se quiser testar num celular real **hoje**, sem hospedar:
1. Rode `node server.js` nesta pasta.
2. Exponha com `ngrok http 3001` (ou Cloudflare Tunnel) e copie a URL `https://...`.
3. Cole no `BACKEND_URL` e regenere o APK.
> O túnel só funciona enquanto seu PC estiver ligado.

### Opção B — Railway / Fly.io
Processo equivalente: suba um container Node + binário `yt-dlp` e aponte
`BACKEND_URL` para a URL pública.

### Dockerfile mínimo (para qualquer opção)

```dockerfile
FROM node:20-slim
RUN apt-get update && apt-get install -y python3-pip \
 && pip3 install --break-system-packages yt-dlp
WORKDIR /app
COPY package.json server.js ./
RUN npm install --omit=dev
EXPOSE 3001
CMD ["node", "server.js"]
```

## Configurar o app

No `C:\tube_final\App.js`, na constante `BACKEND_URL`:

```js
const BACKEND_URL = 'http://10.0.2.2:3001'; // emulador
// const BACKEND_URL = 'http://192.168.1.20:3001'; // celular na mesma rede
// const BACKEND_URL = 'https://tubedx-audio.onrender.com'; // deploy
```

Deixe vazio (`''`) para desativar (o app volta ao MP3 demo no Android).

## Observações

- A URL devolvida pelo YouTube **expira em poucas horas** — por isso o backend usa cache de 2h e o app cacheia por sessão.
- Respeite os Termos do YouTube: uso pessoal/educacional. Para uso comercial, avalie licenciamento.
