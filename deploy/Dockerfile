# Slika za namestitev na Render.
# Aplikacije tu NE gradimo: job build v CI že pripravi paket (frontend, backend in produkcijske
# odvisnosti za Linux). Ta datoteka gre v paket, job deploy pa paket samo skopira v sliko.
# Različica Node.js mora biti enaka kot v jobu build (binarni modul better-sqlite3).
FROM node:24-slim

ENV NODE_ENV=production \
    TRUST_PROXY=1 \
    PORT=10000

WORKDIR /app
COPY --chown=node:node . .
RUN rm -f Dockerfile

ARG APP_VERSION=razvoj
ENV APP_VERSION=$APP_VERSION

USER node
WORKDIR /app/backend
EXPOSE 10000

# Baza SQLite je v backend/data. Brezplačna instanca na Renderju nima trajnega diska, zato je baza
# ob vsakem zagonu prazna: seed vpiše začetne podatke (obstoječih ne spreminja), nato se zažene strežnik.
CMD ["sh", "-c", "node src/seed.js && exec node src/streznik.js"]
