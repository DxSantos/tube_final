// TubeDX – backend de extração de áudio do YouTube (yt-dlp)
// Uso: node server.js   (porta via env PORT, padrão 3001)
// Endpoint: GET /audio?videoId=VIDEO_ID  ->  { url: "https://...audio..." }
// Endpoint: GET /health -> { ok: true }

const express = require('express');
const cors = require('cors');
const { execFile } = require('child_process');
const { promisify } = require('util');
const path = require('path');
const fs = require('fs');

const run = promisify(execFile);

// yt-dlp: usa o executável local (backend/yt-dlp.exe no Windows) se existir,
// senão tenta o comando `yt-dlp` na PATH.
const YT_DLP_CMD = (() => {
  try {
    const local = path.join(__dirname, process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp');
    if (fs.existsSync(local)) return local;
  } catch (e) {
    console.log('yt-dlp local check error', e);
  }
  return 'yt-dlp';
})();

const app = express();
app.use(cors());
app.use((req, res, next) => {
  res.setHeader('Content-Type', 'application/json');
  next();
});

const PORT = process.env.PORT || 3001;
const CACHE_TTL_MS = 2 * 60 * 60 * 1000; // URLs do YouTube expiram rápido
const cache = new Map(); // videoId -> { url, at }

const isValidVideoId = (id) => /^[a-zA-Z0-9_-]{6,20}$/.test(id);

async function getAudioUrl(videoId) {
  const hit = cache.get(videoId);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.url;

  // -f bestaudio: melhor áudio direto (sem mux de vídeo)
  // --get-url: só imprime a URL (não baixa o arquivo)
  // --no-playlist: só o vídeo pedido
  const { stdout } = await run(YT_DLP_CMD, [
    '-f', 'bestaudio',
    '--get-url',
    '--no-playlist',
    `https://www.youtube.com/watch?v=${videoId}`,
  ]);

  const url = stdout.trim().split('\n')[0].trim();
  if (!url) throw new Error('yt-dlp não retornou URL');

  cache.set(videoId, { url, at: Date.now() });
  return url;
}

app.get('/health', (req, res) => {
  res.json({ ok: true, cacheSize: cache.size });
});

app.get('/audio', async (req, res) => {
  const videoId = String(req.query.videoId || '').trim();
  if (!isValidVideoId(videoId)) {
    return res.status(400).json({ error: 'videoId inválido' });
  }
  try {
    const url = await getAudioUrl(videoId);
    res.json({ url });
  } catch (e) {
    const msg = String((e && e.stderr) || (e && e.message) || e).slice(0, 300);
    console.error('extract error', videoId, msg);
    res.status(502).json({ error: 'extração falhou', detail: msg });
  }
});

// status simples
app.listen(PORT, () => {
  console.log(`TubeDX backend ouvindo em http://localhost:${PORT}`);
});
