// Testi skupnih funkcij frontenda (frontend/skupno.js).
// DOM priskrbi jsdom, klice API pa nadomesti lažni fetch, zato strežnik ni potreben.
import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, test } from 'node:test';
import { JSDOM } from 'jsdom';
import { api, dni, el, gumb, lepCas, lepDatum, lepTermin, napolni, pokazi, vrstica, znacka } from '../../frontend/skupno.js';

let dom;

beforeEach(() => {
  dom = new JSDOM('<!doctype html><body></body>', { url: 'http://localhost/oprema.html' });
  globalThis.document = dom.window.document;
  globalThis.location = dom.window.location;
});

afterEach(() => {
  delete globalThis.document;
  delete globalThis.location;
  delete globalThis.fetch;
  dom.window.close();
});

// lažen odgovor strežnika v obliki, ki jo pričakuje api()
function odgovor(status, telo) {
  return { ok: status >= 200 && status < 300, status, json: async () => telo };
}

describe('oblikovanje datumov in dni', () => {
  test('lepDatum pretvori ISO datum v slovensko obliko brez vodilnih ničel', () => {
    assert.equal(lepDatum('2026-11-13'), '13. 11. 2026');
    assert.equal(lepDatum('2026-01-05'), '5. 1. 2026');
  });

  test('lepCas doda uro in minute, sekunde izpusti', () => {
    assert.equal(lepCas('2026-11-13T17:05:42'), '13. 11. 2026 17:05');
  });

  test('lepTermin pokaže oba dneva termina', () => {
    assert.equal(lepTermin('2026-11-13', '2026-11-16'), '13. 11. 2026 – 16. 11. 2026');
  });

  test('lepTermin pri enodnevnem terminu pokaže datum samo enkrat', () => {
    assert.equal(lepTermin('2026-12-06', '2026-12-06'), '6. 12. 2026');
  });

  test('dni uporabi pravilno slovensko obliko (ednina, dvojina, množina)', () => {
    assert.equal(dni(1), '1 dan');
    assert.equal(dni(2), '2 dneva');
    assert.equal(dni(3), '3 dni');
    assert.equal(dni(14), '14 dni');
  });
});

describe('elementi strani', () => {
  test('el naredi element z lastnostmi in vsebino', () => {
    const povezava = el('a', { href: '/moje.html', className: 'tukaj' }, 'Moje ', el('strong', {}, 'rezervacije'));
    assert.equal(povezava.tagName, 'A');
    assert.equal(povezava.getAttribute('href'), '/moje.html');
    assert.equal(povezava.className, 'tukaj');
    assert.equal(povezava.textContent, 'Moje rezervacije');
    assert.equal(povezava.querySelector('strong').textContent, 'rezervacije');
  });

  test('vrstica naredi vrstico tabele z eno celico za vsak podatek', () => {
    const tr = vrstica('FOTO-02', 'Fotoaparat', el('span', {}, 'Prost'));
    assert.equal(tr.tagName, 'TR');
    assert.deepEqual([...tr.children].map((td) => td.textContent), ['FOTO-02', 'Fotoaparat', 'Prost']);
  });

  test('znacka dobi razred po kodi z malimi črkami in prikaže besedilo', () => {
    const z = znacka('V_POPRAVILU', 'V popravilu');
    assert.equal(z.className, 'znacka v_popravilu');
    assert.equal(z.textContent, 'V popravilu');
    assert.equal(znacka('ODDANA').textContent, 'ODDANA');
  });

  test('napolni zamenja stare vrstice tabele z novimi', () => {
    const telo = el('tbody', {}, vrstica('stara'));
    napolni(telo, [vrstica('a'), vrstica('b')], 'Ni podatkov.');
    assert.deepEqual([...telo.rows].map((r) => r.textContent), ['a', 'b']);
  });

  test('napolni pri praznem seznamu pokaže sporočilo čez vse stolpce', () => {
    const telo = el('tbody', {}, vrstica('stara'));
    napolni(telo, [], 'Nimaš še nobene rezervacije.');
    assert.equal(telo.rows.length, 1);
    assert.equal(telo.textContent, 'Nimaš še nobene rezervacije.');
    assert.equal(telo.querySelector('td').className, 'opomba');
  });

  test('pokazi prikaže besedilo, prazno besedilo element skrije', () => {
    const p = el('p', { hidden: true });
    pokazi(p, 'Kos je v izbranem terminu že rezerviran');
    assert.equal(p.hidden, false);
    assert.equal(p.textContent, 'Kos je v izbranem terminu že rezerviran');
    pokazi(p, '');
    assert.equal(p.hidden, true);
  });

  test('gumb je med izvajanjem dejanja onemogočen, nato spet omogočen', async () => {
    let sprosti;
    const g = gumb('Odobri', () => new Promise((r) => { sprosti = r; }));
    g.click();
    assert.equal(g.disabled, true, 'drugi klik med čakanjem ne sme poslati nove zahteve');
    sprosti();
    await new Promise((r) => setTimeout(r));
    assert.equal(g.disabled, false);
  });

});

describe('klici API', () => {
  test('brez telesa pošlje GET na /api/... in vrne podatke', async () => {
    const klici = [];
    globalThis.fetch = async (url, moznosti) => {
      klici.push({ url, moznosti });
      return odgovor(200, [{ id: 1 }]);
    };
    assert.deepEqual(await api('oprema?od=2026-11-20'), [{ id: 1 }]);
    assert.equal(klici[0].url, '/api/oprema?od=2026-11-20');
    assert.equal(klici[0].moznosti, undefined);
  });

  test('s telesom pošlje POST z JSON', async () => {
    let poslano;
    globalThis.fetch = async (url, moznosti) => {
      poslano = { url, ...moznosti };
      return odgovor(201, { id: 7, stanje: 'ODDANA' });
    };
    const rezultat = await api('rezervacije', { kos_id: 2, datum_od: '2026-11-20', datum_do: '2026-11-21' });
    assert.equal(rezultat.stanje, 'ODDANA');
    assert.equal(poslano.url, '/api/rezervacije');
    assert.equal(poslano.method, 'POST');
    assert.equal(poslano.headers['Content-Type'], 'application/json');
    assert.deepEqual(JSON.parse(poslano.body), { kos_id: 2, datum_od: '2026-11-20', datum_do: '2026-11-21' });
  });

  test('ob napaki vrže sporočilo strežnika', async () => {
    globalThis.fetch = async () => odgovor(409, { napaka: 'Kos je v izbranem terminu že rezerviran' });
    await assert.rejects(api('rezervacije', {}), { message: 'Kos je v izbranem terminu že rezerviran' });
  });

  test('ob napaki brez sporočila (ali brez JSON) vrže splošno sporočilo', async () => {
    globalThis.fetch = async () => ({ ok: false, status: 500, json: async () => { throw new SyntaxError(); } });
    await assert.rejects(api('oprema'), { message: 'Nekaj je šlo narobe' });
  });

  test('ob 401 (seja ne velja) preusmeri na prijavo in ne vrže napake', async () => {
    const preusmeritve = [];
    globalThis.location = { pathname: '/oprema.html', replace: (pot) => preusmeritve.push(pot) };
    globalThis.fetch = async () => odgovor(401, { napaka: 'Prijava je potrebna' });
    const obljuba = api('jaz');
    await new Promise((r) => setTimeout(r, 10));
    assert.deepEqual(preusmeritve, ['/']);
    // obljuba ostane nerazrešena, ker stran zamenja nova
    const izid = await Promise.race([obljuba.then(() => 'razrešena', () => 'zavrnjena'), Promise.resolve('čaka')]);
    assert.equal(izid, 'čaka');
  });

  test('na prijavni strani 401 ne preusmerja, ampak vrže napako', async () => {
    globalThis.location = { pathname: '/', replace: () => assert.fail('ne sme preusmeriti') };
    globalThis.fetch = async () => odgovor(401, { napaka: 'Napačen e-naslov ali geslo' });
    await assert.rejects(api('prijava', {}), { message: 'Napačen e-naslov ali geslo' });
  });
});
