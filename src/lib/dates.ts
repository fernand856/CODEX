import type { ArtistId, Availability, Period, TattooRequest } from '../types';

const DAY_MS = 86_400_000;
const months = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const artistIds: ArtistId[] = ['caio', 'nina', 'rafael'];

// Calendar values remain date-only strings. UTC is used solely for arithmetic,
// never to decide the visitor's calendar day or to format a selected date.
export function isValidDate(iso: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return false;
  const [year, month, day] = iso.split('-').map(Number);
  if (year < 1000 || year > 9999 || month < 1 || month > 12 || day < 1 || day > 31) return false;
  const candidate = new Date(Date.UTC(year, month - 1, day));
  return candidate.getUTCFullYear() === year && candidate.getUTCMonth() === month - 1 && candidate.getUTCDate() === day;
}

function dateAsUtc(iso: string): Date {
  if (!isValidDate(iso)) throw new RangeError('Data de calendário inválida. Use YYYY-MM-DD.');
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

export function todayInSaoPaulo(now: Date = new Date()): string {
  if (Number.isNaN(now.getTime())) throw new RangeError('Instante inválido.');
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(now);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function addDays(iso: string, offset: number): string {
  if (!Number.isInteger(offset)) throw new RangeError('O deslocamento deve ser um número inteiro de dias.');
  const date = dateAsUtc(iso);
  date.setUTCDate(date.getUTCDate() + offset);
  const result = date.toISOString().slice(0, 10);
  if (!isValidDate(result)) throw new RangeError('Data fora do intervalo suportado.');
  return result;
}

export function formatDate(iso: string): string {
  dateAsUtc(iso);
  const [year, month, day] = iso.split('-').map(Number);
  return `${String(day).padStart(2, '0')} de ${months[month - 1]} de ${year}`;
}

function periodsFor(artist: ArtistId, iso: string): Period[] {
  const day = dateAsUtc(iso);
  const weekday = day.getUTCDay();
  const serial = Math.floor(day.getTime() / DAY_MS);
  const index = artistIds.indexOf(artist);
  const weekdays: Record<ArtistId, number[]> = {
    caio: [2, 4, 6],
    nina: [1, 3, 5],
    rafael: [2, 3, 5, 6],
  };
  // A fixed pattern creates a plausible sample with unavailable days. This is
  // deliberately not an artist's real schedule and never confirms a booking.
  if (!weekdays[artist].includes(weekday) || (serial + index * 3) % 11 === 0) return [];
  const pattern = (serial + index) % 3;
  return pattern === 0 ? ['morning', 'afternoon'] : pattern === 1 ? ['morning'] : ['afternoon'];
}

export function getAvailability(artist: ArtistId | 'help', today: string = todayInSaoPaulo()): Availability[] {
  dateAsUtc(today);
  if (artist !== 'help' && !artistIds.includes(artist)) return [];
  const available: Availability[] = [];
  for (let offset = 0; offset < 60; offset += 1) {
    const date = addDays(today, offset);
    const periods = artist === 'help'
      ? (['morning', 'afternoon'] as Period[]).filter(period => artistIds.some(id => periodsFor(id, date).includes(period)))
      : periodsFor(artist, date);
    if (periods.length) available.push({ date, periods });
  }
  return available;
}

export function reconcileDate(request: TattooRequest, today: string = todayInSaoPaulo()): TattooRequest {
  if (!request.date) return request.period ? { ...request, period: '' } : { ...request };
  if (!request.artist || !isValidDate(request.date)) return { ...request, date: '', period: '' };
  const day = getAvailability(request.artist, today).find(slot => slot.date === request.date);
  if (!day) return { ...request, date: '', period: '' };
  if (request.period && !day.periods.includes(request.period)) return { ...request, period: '' };
  return { ...request };
}
