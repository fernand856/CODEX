import assert from 'node:assert/strict';
import test from 'node:test';
import { artists, styles, works } from '../src/data/content';
import { studio } from '../src/data/studio';
import { addDays, formatDate, getAvailability, isValidDate, reconcileDate, todayInSaoPaulo } from '../src/lib/dates';
import { buildMessage, buildWhatsAppUrl, initialRequest, validateIdea, validateReview, validateScheduling } from '../src/lib/request';
import type { TattooRequest } from '../src/types';

const sample = (overrides: Partial<TattooRequest> = {}): TattooRequest => ({
  ...initialRequest,
  style: 'fine-line',
  artist: 'nina',
  bodyRegion: 'Antebraço',
  size: 'Entre 5 e 10 cm',
  description: 'Um ramo de alecrim com desenho autoral.',
  name: 'Ana',
  ...overrides,
});

test('São Paulo calendar day is used at UTC midnight and across years', () => {
  assert.equal(todayInSaoPaulo(new Date('2026-10-08T01:30:00Z')), '2026-10-07');
  assert.equal(todayInSaoPaulo(new Date('2026-10-08T03:00:00Z')), '2026-10-08');
  assert.equal(todayInSaoPaulo(new Date('2027-01-01T01:00:00Z')), '2026-12-31');
  assert.throws(() => todayInSaoPaulo(new Date('invalid')), RangeError);
});

test('date-only arithmetic preserves leap days, month and year boundaries', () => {
  assert.equal(addDays('2024-02-28', 1), '2024-02-29');
  assert.equal(addDays('2024-02-29', 1), '2024-03-01');
  assert.equal(addDays('2026-12-31', 1), '2027-01-01');
  assert.equal(addDays('2026-01-01', -1), '2025-12-31');
  assert.equal(addDays('2026-10-07', 0), '2026-10-07');
  assert.equal(formatDate('2026-10-07'), '07 de outubro de 2026');
  assert.equal(isValidDate('2026-02-29'), false);
  assert.equal(isValidDate('2024-02-29'), true);
  assert.equal(isValidDate('2026-13-01'), false);
  assert.equal(isValidDate('2026-10-7'), false);
  assert.throws(() => addDays('2026-02-30', 1), RangeError);
  assert.throws(() => addDays('2026-10-07', 1.5), RangeError);
  assert.throws(() => formatDate('2026-11-31'), RangeError);
});

test('availability is deterministic, artist-specific, bounded and ordered', () => {
  const today = '2026-10-07';
  const caio = getAvailability('caio', today);
  assert.deepEqual(caio, getAvailability('caio', today));
  assert.notDeepEqual(caio, getAvailability('nina', today));
  assert.ok(caio.length > 10);
  assert.equal(new Set(caio.map(day => day.date)).size, caio.length);
  assert.deepEqual(caio.map(day => day.date), caio.map(day => day.date).sort());
  for (const day of caio) {
    assert.ok(day.date >= today && day.date <= addDays(today, 59));
    assert.ok(day.periods.length > 0);
    assert.ok(day.periods.every(period => ['morning', 'afternoon'].includes(period)));
  }
  const help = getAvailability('help', today);
  for (const artist of artists) {
    for (const day of getAvailability(artist.id, today)) {
      const sharedDay = help.find(slot => slot.date === day.date);
      assert.ok(sharedDay);
      assert.ok(day.periods.every(period => sharedDay.periods.includes(period)));
    }
  }
});

test('changing artists clears an incompatible date without mutating request data', () => {
  const today = '2026-10-07';
  const caioSlot = getAvailability('caio', today)[0];
  const original = sample({ artist: 'nina', scheduling: 'date', date: caioSlot.date, period: caioSlot.periods[0] });
  const reconciled = reconcileDate(original, today);
  assert.equal(reconciled.date, '');
  assert.equal(reconciled.period, '');
  assert.equal(reconciled.description, original.description);
  assert.equal(original.date, caioSlot.date);
  const ninaSlot = getAvailability('nina', today).find(day => day.periods.length === 1)!;
  const wrongPeriod = ninaSlot.periods[0] === 'morning' ? 'afternoon' : 'morning';
  const periodOnly = reconcileDate(sample({ scheduling: 'date', date: ninaSlot.date, period: wrongPeriod }), today);
  assert.equal(periodOnly.date, ninaSlot.date);
  assert.equal(periodOnly.period, '');
  const unchanged = sample({ scheduling: 'date', date: ninaSlot.date, period: ninaSlot.periods[0] });
  assert.deepEqual(reconcileDate(unchanged, today), unchanged);
  assert.deepEqual(reconcileDate(sample({ date: '', period: 'morning' }), today).period, '');
});

test('scheduling rejects past, impossible, unavailable and out-of-horizon dates', () => {
  const today = '2026-10-07';
  const available = getAvailability('nina', today)[0];
  assert.deepEqual(validateScheduling(sample({ scheduling: 'date', date: available.date, period: available.periods[0] }), today), {});
  assert.match(validateScheduling(sample({ scheduling: 'date', date: '2026-10-06', period: 'morning' }), today).date, /hoje/);
  assert.ok(validateScheduling(sample({ scheduling: 'date', date: '2026-02-30', period: 'morning' }), today).date);
  assert.ok(validateScheduling(sample({ scheduling: 'date', date: addDays(today, 60), period: 'morning' }), today).date);
  const unavailable = getAvailability('caio', today)[0];
  assert.ok(validateScheduling(sample({ scheduling: 'date', date: unavailable.date, period: 'morning' }), today).date);
  assert.ok(validateScheduling(sample({ scheduling: 'date', date: available.date, period: '' }), today).period);
  assert.deepEqual(validateScheduling(sample({ scheduling: 'whatsapp', date: '', period: '' }), today), {});
});

test('idea validation accepts explicit guidance options and validates trimmed lengths', () => {
  assert.deepEqual(validateIdea(sample()), {});
  assert.deepEqual(validateIdea(sample({ style: 'undecided', artist: 'help', bodyRegion: 'Quero orientação', size: 'Ainda não sei', description: '  1234567890  ' })), {});
  const empty = validateIdea({ ...initialRequest });
  assert.deepEqual(Object.keys(empty), ['style', 'artist', 'bodyRegion', 'size', 'description']);
  assert.ok(validateIdea(sample({ description: '  123456789  ' })).description);
  assert.equal(validateIdea(sample({ description: ` ${'a'.repeat(1000)} ` })).description, undefined);
  assert.ok(validateIdea(sample({ description: 'a'.repeat(1001) })).description);
  assert.ok(validateIdea(sample({ style: 'unknown' as TattooRequest['style'] })).style);
  assert.ok(validateIdea(sample({ artist: 'unknown' as TattooRequest['artist'] })).artist);
  assert.ok(validateIdea(sample({ referenceWork: 'unavailable-work' })).referenceWork);
});

test('reference URLs allow HTTP(S) and reject executable, malformed or credentialed links', () => {
  for (const referenceUrl of ['', '  https://example.com/refs?style=flowers&tone=black#ideas  ', 'http://example.com/reference']) {
    assert.equal(validateIdea(sample({ referenceUrl })).referenceUrl, undefined);
  }
  for (const referenceUrl of ['javascript:alert(1)', 'data:text/html,<p>test</p>', 'ftp://example.com', '//example.com', 'example.com', 'https://exa mple.com', 'https://example.com/a\nb', 'https://user:password@example.com', `https://example.com/${'a'.repeat(2048)}`]) {
    assert.ok(validateIdea(sample({ referenceUrl })).referenceUrl, referenceUrl);
  }
});

test('review validates name length after trimming without storing personal data', () => {
  assert.deepEqual(validateReview(sample({ name: '  Ana  ' })), {});
  assert.deepEqual(validateReview(sample({ name: 'a'.repeat(80) })), {});
  assert.ok(validateReview(sample({ name: ' A ' })).name);
  assert.ok(validateReview(sample({ name: 'a'.repeat(81) })).name);
  assert.ok(validateReview(sample({ name: 'Ana\nMaria' })).name);
  assert.ok(validateScheduling(sample({ budget: 'a'.repeat(161) })).budget);
});

test('message contains reviewed choices, optional reference and honest availability wording', () => {
  const request = sample({ referenceWork: 'work-02', referenceUrl: ' https://example.com/ref?a=1&b=2 ', budget: 'Prefiro conversar', name: ' Ana ', description: ' Um ramo de alecrim com desenho autoral. ' });
  const message = buildMessage(request);
  assert.match(message, /^Olá! Meu nome é Ana/);
  assert.match(message, /Estilo: Fine line/);
  assert.match(message, /Artista: Nina Duarte/);
  assert.match(message, /Referência do portfólio ilustrativo: Jardim particular/);
  assert.match(message, /A referência orienta um projeto próprio/);
  assert.match(message, /Referência: https:\/\/example.com\/ref\?a=1&b=2/);
  assert.match(message, /Data\/período de preferência: Combinar pelo WhatsApp/);
  assert.match(message, /Orçamento: Prefiro conversar/);
  assert.equal(request.name, ' Ana ');
  assert.doesNotMatch(buildMessage(sample()), /Referência:|Orçamento:/);
  assert.throws(() => buildMessage(sample({ description: 'curta' })), /description/);
  assert.throws(() => buildMessage(sample({ name: '' })), /name/);
});

test('WhatsApp URL preserves accents, emoji, newlines and query characters in one encoded text parameter', () => {
  const request = sample({ name: 'João', description: 'Uma flor 🌿 & formas + espaço? Gostaria de conversar.', referenceUrl: 'https://example.com/a?one=1&two=2' });
  const expected = buildMessage(request);
  const url = new URL(buildWhatsAppUrl('5511999999999', request));
  assert.equal(url.origin, 'https://wa.me');
  assert.equal(url.pathname, '/5511999999999');
  assert.deepEqual([...url.searchParams.keys()], ['text']);
  assert.equal(url.searchParams.get('text'), expected);
  assert.throws(() => buildWhatsAppUrl('+55 11 99999-9999', request), /dígitos/);
  assert.throws(() => buildWhatsAppUrl('0123456789', request), /dígitos/);
  assert.throws(() => buildWhatsAppUrl('1', request), /dígitos/);
  assert.throws(() => buildWhatsAppUrl('5511999999999', sample({ style: '' })), /style/);
  assert.throws(() => buildWhatsAppUrl('5511999999999', sample({ scheduling: 'date', date: '2020-01-01', period: 'morning' })), /date/);
});

test('demonstration content is linked and never invents public contact details', () => {
  assert.equal(works.length, 12);
  assert.equal(new Set(works.map(work => work.image)).size, 12);
  for (const work of works) {
    assert.ok(artists.some(artist => artist.id === work.artistId));
    assert.ok(styles.some(style => style.id === work.styleId));
    assert.ok(work.alt && work.origin);
  }
  assert.equal(studio.demoMode, true);
  assert.equal(studio.whatsappNumber, '');
  assert.equal(studio.instagramUrl, '');
  assert.equal(studio.address, '');
  assert.equal(studio.siteUrl, '');
});
