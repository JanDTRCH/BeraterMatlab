# Statische Auslieferung des Prototyps mit Caddy.
# Railway setzt die Variable PORT; lokal wird 8080 verwendet.
FROM caddy:2-alpine

COPY Caddyfile /etc/caddy/Caddyfile
COPY prototype/ /srv/

ENV PORT=8080
EXPOSE 8080

CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile", "--adapter", "caddyfile"]
