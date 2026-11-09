# TubeDX backend – imagem de deploy (Render / Railway / Fly)
FROM node:20-slim

# yt-dlp (Python) em /usr/local/bin
RUN apt-get update \
 && apt-get install -y --no-install-recommends python3 python3-pip \
 && pip3 install --no-cache-dir --break-system-packages yt-dlp \
 && apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json ./
RUN npm install --omit=dev

COPY server.js ./

ENV PORT=3001
EXPOSE 3001

CMD ["node", "server.js"]
