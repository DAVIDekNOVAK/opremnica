# 07 – Pregled projekta

Pregled ob prevzemu projekta (naloga 5). Pregledana je bila veja `main` (zadnji commit `8b26c7f`, združen PR #16).

Pregledovalec: David Novak, 20. 11. 2026.

## Kako je bil projekt pregledan

- Prebrana dokumentacija v `docs/` (01–06), vseh šest ADR-jev in README.
- Pregledana koda v `backend/src/` (Express, SQLite) in `frontend/` (HTML, CSS, JS brez ogrodja) ter testi v `backend/test/`.
- Aplikacija je bila lokalno zagnana po navodilih iz README (`npm ci`, `.env` s `SESSION_SECRET`, `npm run seed`, `npm start`) na Node.js 22.23. Zagon je uspel brez težav.
- `npm test`: **90 testov, vsi uspejo**.
- V brskalniku sta bila preverjena prijava in zaslon skrbnika *Rezervacije*. Seznami *Čakajoče*, *Za prevzem*, *Izposojeno* (z opozorilom »Zamuda 1 dan«) in *Odobrene za pozneje* se pravilno napolnijo iz začetnih podatkov.

## Uspešno implementirane funkcionalnosti za MVP

Avtor je MVP opredelil kot funkcionalnosti F01–F06 (zgodbe US-01 do US-06). Vse so implementirane:

| Funkcionalnost | Kaj deluje |
|---|---|
| F01 Prijava in dostop po vlogi | Prijava z e-naslovom in geslom, odjava, preusmeritev na začetni zaslon vloge, 401 za neprijavljene in 403 za napačno vlogo. Gesla so zgoščena s `scrypt`. |
| F02 Pregled opreme in razpoložljivosti | Seznam kosov s filtrom po kategoriji in terminu ter razpoložljivostjo »Prost«, »Zaseden v terminu« ali »V popravilu«. Član ne vidi, kdo je kos rezerviral. |
| F03 Oddaja rezervacije | Rezervacija prostega kosa v stanju `ODDANA`. Preverja se prekrivanje, termin (od danes do +60 dni, največ 14 dni) in stanje kosa. Preverjanje in vpis sta v eni transakciji, zato hkratni oddaji ne moreta obe uspeti. |
| F04 Odobritev ali zavrnitev | Seznam *Čakajoče* po času oddaje, odobritev, zavrnitev z obveznim razlogom, zapis skrbnika in časa. |
| F05 Evidentiranje prevzema | Seznam *Za prevzem*. Prevzem je mogoč samo v terminu, za uporaben kos in če kos ni še pri drugem članu. |
| F06 Evidentiranje vračila | Vračilo s stanjem kosa (»brez poškodb« ali »potrebuje popravilo« z obvezno opombo), izračun zamude in seznam prizadetih prihodnjih rezervacij kosa v popravilu. |

Poleg MVP sta delno narejeni še zgodbi, ki ju MVP potrebuje:

- **US-07 (delno):** lastnik prekliče svojo rezervacijo pred prevzemom, skrbnik prekliče odobreno rezervacijo z razlogom.
- **US-08 (delno):** *Moje rezervacije* s stanjem, razlogom in zamudo, vendar brez izbire aktivne/pretekle.

Zgodbe US-09 do US-12 (urejanje opreme, upravljanje uporabnikov, zamujena vračila, zgodovina kosa) niso implementirane. Administrator ima samo seznam računov za branje.

## Ali implementacija zadošča uporabniškim zgodbam

Pregledanih je bilo pet domensko specifičnih zgodb MVP (US-02 do US-06). Za vsako so bili sprejemni kriteriji iz `docs/05-uporabniske-zgodbe.md` primerjani s kodo, testi in delovanjem aplikacije.

### US-02 Pregled opreme in razpoložljivosti – **zadošča**

Vseh pet kriterijev je izpolnjenih. Odpisani kosi niso prikazani, »Prost« se izračuna po definiciji aktivne rezervacije, odgovor API ne vsebuje podatkov o članu, obrnjeni datumi vrnejo sporočilo »Datum do ne sme biti pred datumom od«. Gumb *Rezerviraj* je prikazan samo pri prostih kosih (`frontend/oprema.js`). Ta kriterij edini nima samodejnega testa, ker frontend ni testiran v brskalniku, a ga backend vseeno varuje: rezervacijo zasedenega kosa API zavrne.

### US-03 Oddaja rezervacije s preverjanjem prekrivanja – **zadošča**

Vseh pet kriterijev je izpolnjenih in pokritih s testi. Testirani so vsi robni primeri iz tabele v zgodbi (skupni dan, vrnjena, preklicana in zavrnjena rezervacija) ter meje 14 in 60 dni. Pravilo R1 je preverjeno v backendu, kot zahteva ADR 0006. Hkratni oddaji rešuje transakcija.

### US-04 Odobritev ali zavrnitev rezervacije – **zadošča**

Vseh pet kriterijev je izpolnjenih. Zavrnitev brez razloga (tudi samo s presledki) ni mogoča, član razlog vidi v *Moje rezervacije*. Ponovljena ali hkratna odločitev vrne »Rezervacija ni več v stanju ODDANA«, član in administrator dobita 403. Odprto ostaja vprašanje OPEN-2 (ali sme skrbnik odobriti lastno rezervacijo); zdaj je to dovoljeno.

### US-05 Evidentiranje prevzema – **zadošča**

Vseh pet kriterijev je izpolnjenih. Prevzem zunaj termina je zavrnjen (meja je polnoč po ljubljanskem času), pri nevrnjenem kosu sistem pove, pri katerem članu je kos in do kdaj bi ga moral vrniti. Kos v popravilu ali odpisan kos ni mogoče prevzeti. Neprevzete rezervacije se ne prekličejo samodejno (P6); skrbnik jih mora preklicati ročno.

### US-06 Evidentiranje vračila in stanja kosa – **zadošča, z omejitvijo**

Vseh pet kriterijev je izpolnjenih: vračilo samo iz `PREVZETA`, stanje kosa ob vračilu, izračun zamude (tudi ob premiku ure), zavrnitev ponovnega vračila in seznam prizadetih rezervacij. Omejitev je zunaj te zgodbe: ker urejanje opreme (US-09) ni narejeno, kosa, ki je šel v popravilo, v aplikaciji ni mogoče več označiti kot `UPORABEN`. Za nadaljnjo uporabo kosa je treba ponastaviti začetne podatke.

### Povzetek

Implementacija zadošča vsem petim pregledanim zgodbam. Zgodbe niso izpolnjene samo »na zaslonu«, ampak so poslovna pravila preverjena v backendu in pokrita s samodejnimi testi, ki jih dokument 05 poveže s posameznimi kriteriji. MVP je za demonstracijo celotne poti (rezervacija → odobritev → prevzem → vračilo) uporaben.

## Opažene pomanjkljivosti in priporočila

- **Ni testov frontenda.** Preusmeritev na prijavo in prikaz gumba *Rezerviraj* sta preverjena samo ročno. Smiselno bi bilo dodati nekaj testov v brskalniku (npr. Playwright).
- **Ni linterja.** `package.json` ima samo skripte `start`, `seed` in `test`. Za CI je treba dodati ESLint in skripto `lint`.
- **Ni CI/CD.** Mape `.github/workflows/` ni; testi se zaganjajo samo ročno.
- **Postavitev ni predvidena.** Dokument 02 jo uvršča med stvari izven obsega, ADR 0001 pa predvideva lokalni zagon. Za namestitev bo potrebna storitev, ki poganja Node.js, ima trajen disk za datoteko SQLite in omogoča nastavitev skrivnosti `SESSION_SECRET`.
- **Upravljanje podatkov samo s seedom.** Uporabnikov, kategorij in opreme ni mogoče urejati v aplikaciji (US-09, US-10), kar omejuje realno uporabo po namestitvi.
