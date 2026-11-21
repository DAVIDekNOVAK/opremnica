// nastavitve za namestitev: stanje strežnika in piškotek seje za HTTPS proxyjem gostitelja
import assert from 'node:assert/strict';
import { test } from 'node:test';
import request from 'supertest';
import { ustvariApp } from '../src/app.js';
import { odpriBazo } from '../src/baza.js';
import { TESTNO_GESLO, vpisiZacetnePodatke } from '../src/zacetniPodatki.js';
import { ANA, DANES } from './pomoc.js';

function aplikacija(moznosti = {}) {
  const baza = odpriBazo(':memory:');
  vpisiZacetnePodatke(baza, DANES);
  return ustvariApp({ baza, skrivnost: 'samo-za-teste', ...moznosti });
}

test('/api/zdravje je dostopen brez prijave in pove nameščeno različico', async () => {
  const odgovor = await request(aplikacija({ verzija: 'abc1234' })).get('/api/zdravje');
  assert.equal(odgovor.status, 200);
  assert.deepEqual(odgovor.body, { stanje: 'ok', verzija: 'abc1234' });
});

test('/api/zdravje brez podane različice vrne »razvoj«', async () => {
  const odgovor = await request(aplikacija()).get('/api/zdravje');
  assert.equal(odgovor.body.verzija, 'razvoj');
});

test('lokalno (brez proxyja) piškotek seje ni omejen na HTTPS', async () => {
  const odgovor = await request(aplikacija())
    .post('/api/prijava').send({ email: ANA, geslo: TESTNO_GESLO });
  assert.equal(odgovor.status, 200);
  assert.doesNotMatch(odgovor.headers['set-cookie'][0], /Secure/);
});

test('za HTTPS proxyjem je piškotek seje Secure', async () => {
  const odgovor = await request(aplikacija({ zaProxyjem: true }))
    .post('/api/prijava').set('X-Forwarded-Proto', 'https').send({ email: ANA, geslo: TESTNO_GESLO });
  assert.equal(odgovor.status, 200);
  assert.match(odgovor.headers['set-cookie'][0], /Secure/);
  assert.match(odgovor.headers['set-cookie'][0], /HttpOnly/);
});

test('glave X-Forwarded-Proto brez proxyja ne upošteva', async () => {
  const odgovor = await request(aplikacija())
    .post('/api/prijava').set('X-Forwarded-Proto', 'https').send({ email: ANA, geslo: TESTNO_GESLO });
  assert.doesNotMatch(odgovor.headers['set-cookie'][0], /Secure/);
});
