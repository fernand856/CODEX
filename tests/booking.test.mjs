import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createApp } from '../server/index.mjs';

const input = { artist: 'lucas', style: 'blackwork', date: '2026-10-15', time: '14:00', name: 'Cliente Teste', contact: '27999999999' };
test('HTTP: disponibilidade, concorrência, idempotência, validação e persistência', async () => {
  const folder = await mkdtemp(join(tmpdir(), 'traco-booking-'));
  const database = join(folder, 'bookings.sqlite');
  const now = () => new Date('2026-10-08T22:00:00Z');
  let server;
  async function launch() { server = createApp({ database, now }); await new Promise(resolve => server.listen(0, '127.0.0.1', resolve)); return `http://127.0.0.1:${server.address().port}`; }
  async function close() { await new Promise(resolve => server.close(resolve)); }
  try {
    let base = await launch();
    const availability = () => fetch(`${base}/api/availability?artist=lucas&style=blackwork&date=2026-10-15`).then(r => r.json());
    const book = (key, body = input, extra = {}) => fetch(`${base}/api/bookings`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': key, ...extra }, body: JSON.stringify(body) });
    assert.equal((await availability()).slots.find(s => s.time === '14:00').available, true);
    const keys = ['concurrent-request-0001', 'concurrent-request-0002'];
    const results = await Promise.all(keys.map(key => book(key)));
    assert.deepEqual(results.map(r => r.status).sort(), [201, 409]);
    const winner = results.findIndex(r => r.status === 201);
    const confirmed = await results[winner].json();
    assert.equal(confirmed.status, 'confirmed'); assert.equal(confirmed.time, '14:00');
    assert.equal((await availability()).slots.find(s => s.time === '14:00').available, false);
    const repeat = await book(keys[winner]); assert.equal(repeat.status, 201); assert.equal((await repeat.json()).id, confirmed.id);
    assert.equal((await book(keys[winner], { ...input, name: 'Outra pessoa' })).status, 409);
    for (const values of [{ date: '2026-10-01' }, { date: '2026-02-30' }, { date: '2026-10-18' }, { date: '2027-01-01' }, { time: '15:00' }, { artist: 'nina' }, { style: 'realismo' }, { name: 'x' }, { contact: '123' }]) {
      assert.equal((await book('invalid-request-0001', { ...input, ...values })).status, 422);
    }
    assert.equal((await book('cross-site-request-01', input, { Origin: 'https://other.example' })).status, 403);
    const invalid = await fetch(`${base}/api/bookings`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{' }); assert.equal(invalid.status, 400);
    await close(); base = await launch();
    assert.equal((await availability()).slots.find(s => s.time === '14:00').available, false);
    assert.equal((await book('after-restart-request01')).status, 409);
    // A retry of a confirmed request must work even after its date has elapsed.
    await close(); server = createApp({ database, now: () => new Date('2026-10-20T22:00:00Z') });
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve)); base = `http://127.0.0.1:${server.address().port}`;
    assert.equal((await book(keys[winner])).status, 201);
  } finally { if (server?.listening) await close(); await rm(folder, { recursive: true, force: true }); }
});
