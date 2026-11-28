# Fondslupe: Node-Server liefert die Website (prototype/) aus und stellt die
# Analyse-API bereit. Railway setzt PORT; lokal wird 8080 verwendet.
FROM node:22-alpine

ENV NODE_ENV=production PORT=8080 WEB_ROOT=/app/prototype
WORKDIR /app/server

COPY server/package.json server/package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY server/src ./src
COPY prototype /app/prototype

USER node
EXPOSE 8080
CMD ["node", "src/server.js"]
