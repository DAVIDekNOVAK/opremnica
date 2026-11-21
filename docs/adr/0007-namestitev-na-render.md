# 0007 Namestitev na Render iz Docker slike, zgrajene v CI

- Status: sprejeto
- Datum: 2026-11-21

## Kontekst in problem

Pri prevzemu projekta (naloga 5) mora biti aplikacija po vsaki združitvi v `main` samodejno nameščena in dostopna na javnem URL-ju. Dokument 02 je postavitev v oblak prvotno uvrstil izven obsega, ADR 0001 pa predvideva lokalni zagon. Namestitev mora uporabiti paket, ki ga pripravi job `build`, brez ponovne gradnje. Kam in kako namestimo aplikacijo (Express streže API in frontend, baza je SQLite)?

## Obravnavane možnosti

* Render, spletna storitev iz Docker slike v GitHub Container Registry (brezplačno, brez trajnega diska)
* Render, gradnja iz repozitorija (Render sam namesti odvisnosti)
* Ločen frontend (npr. GitHub Pages) in backend (Render)
* Fly.io ali Railway s trajnim diskom za SQLite (zahtevata kartico oziroma sta plačljiva)

## Odločitev

Izbrana možnost: "Render iz Docker slike", ker je brezplačna in ne zahteva kartice, slika pa nastane samo s kopiranjem paketa iz joba `build` (`deploy/Dockerfile`), zato se aplikacija ne gradi znova. Frontend in backend ostaneta ena aplikacija na istem naslovu (ADR 0001), zato frontend kliče relativno pot `/api` in ne potrebuje ločenega URL-ja backenda ter nastavitev CORS. Javni URL je v okolju `production` shranjen kot spremenljivka `APP_URL`; job `deploy` z njo preveri, da je nameščena prav nova različica (`/api/zdravje`).

### Posledice

* Dobro, ker se v produkcijo namesti natanko preizkušen paket; job `build` isto sliko pred tem zažene in preveri.
* Dobro, ker so skrivnosti (`RENDER_DEPLOY_HOOK_URL`, `SESSION_SECRET`) samo v GitHub Secrets oziroma v nastavitvah Renderja.
* Slabo, ker brezplačna instanca nima trajnega diska: baza SQLite se ob vsakem zagonu (namestitev, ponovni zagon, prebujenje) ustvari na novo z začetnimi podatki. Za predstavitev je to dovolj, za resno rabo bi potrebovali plačljiv disk ali zunanjo bazo.
* Slabo, ker brezplačna instanca po 15 minutah nedejavnosti zaspi; prvi obisk nato traja do približno minute.
* Za varno sejo za proxyjem Renderja aplikacija zaupa glavi `X-Forwarded-Proto` (`TRUST_PROXY=1`) in pošilja piškotek seje samo prek HTTPS.
