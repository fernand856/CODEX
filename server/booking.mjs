import { DatabaseSync } from 'node:sqlite';
import { randomUUID, createHash } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

export const schedule = { artist: 'lucas', artistName: 'Lucas', style: 'blackwork', timezone: 'America/Sao_Paulo', durationMinutes: 120, hours: ['10:00', '12:00', '14:00', '16:00'], weekdays: [2, 3, 4, 5, 6], horizonDays: 60 };
export class BookingError extends Error { constructor(status, message) { super(message); this.status = status; } }
export function createBookings(filename, now = () => new Date()) {
  mkdirSync(dirname(filename), { recursive: true, mode: 0o700 });
  const db = new DatabaseSync(filename);
  db.exec(`PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;
    CREATE TABLE IF NOT EXISTS bookings (id TEXT PRIMARY KEY, artist TEXT NOT NULL, style TEXT NOT NULL, start INTEGER NOT NULL, end INTEGER NOT NULL, date TEXT NOT NULL, time TEXT NOT NULL, name TEXT NOT NULL, contact TEXT NOT NULL, request_key TEXT UNIQUE NOT NULL, request_hash TEXT NOT NULL, created_at TEXT NOT NULL);
    CREATE INDEX IF NOT EXISTS bookings_artist_interval ON bookings(artist,start,end);`);
  const day = () => new Intl.DateTimeFormat('en-CA', { timeZone: schedule.timezone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now());
  function validateSlot(artist, style, date, time) {
    if (artist !== schedule.artist || style !== schedule.style) throw new BookingError(422, 'Escolha Lucas e o estilo Blackwork.');
    if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new BookingError(422, 'Data inválida.');
    const parsed = new Date(`${date}T12:00:00Z`);
    if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date) throw new BookingError(422, 'Data inválida.');
    const distance = (parsed.getTime() - Date.parse(`${day()}T12:00:00Z`)) / 86400000;
    if (distance < 0 || distance > schedule.horizonDays || !schedule.weekdays.includes(parsed.getUTCDay())) throw new BookingError(422, 'Data fora da agenda disponível.');
    if (!schedule.hours.includes(time)) throw new BookingError(422, 'Horário fora da agenda disponível.');
    // São Paulo observes UTC-03 for the configured booking horizon.
    const start = Date.parse(`${date}T${time}:00-03:00`);
    if (start <= now().getTime()) throw new BookingError(422, 'Escolha um horário futuro.');
    return { start, end: start + schedule.durationMinutes * 60000 };
  }
  const occupied = (start, end) => !!db.prepare('SELECT 1 FROM bookings WHERE artist=? AND start<? AND end>? LIMIT 1').get(schedule.artist, end, start);
  const confirmation = row => ({ id: row.id, status: 'confirmed', artist: schedule.artistName, style: 'Blackwork', date: row.date, time: row.time, timezone: schedule.timezone, durationMinutes: schedule.durationMinutes });
  return {
    availability(artist, style, date) {
      // Validate the date even when all time slots have elapsed.
      const slots = schedule.hours.map(time => {
        try { const { start, end } = validateSlot(artist, style, date, time); return { time, available: !occupied(start, end) }; }
        catch (error) { if (error.message === 'Escolha um horário futuro.') return { time, available: false }; throw error; }
      });
      return { date, timezone: schedule.timezone, durationMinutes: schedule.durationMinutes, slots };
    },
    book(input, key) {
      if (!input || typeof input !== 'object' || Array.isArray(input)) throw new BookingError(422, 'Pedido inválido.');
      if (typeof key !== 'string' || !/^[a-zA-Z0-9-]{16,80}$/.test(key)) throw new BookingError(422, 'Identificador do pedido inválido.');
      const { artist, style, date, time } = input;
      const name = typeof input.name === 'string' ? input.name.trim() : '';
      const contact = typeof input.contact === 'string' ? input.contact.trim() : '';
      if (name.length < 2 || name.length > 80 || /[\x00-\x1f]/.test(name)) throw new BookingError(422, 'Informe seu nome (2 a 80 caracteres).');
      if (!/^\+?[\d ()-]{10,25}$/.test(contact) || contact.replace(/\D/g, '').length < 10 || contact.replace(/\D/g, '').length > 15) throw new BookingError(422, 'Informe um telefone com DDD.');
      const hash = createHash('sha256').update(JSON.stringify({ artist, style, date, time, name, contact })).digest('hex');
      db.exec('BEGIN IMMEDIATE');
      try {
        const previous = db.prepare('SELECT * FROM bookings WHERE request_key=?').get(key);
        if (previous) {
          if (previous.request_hash !== hash) throw new BookingError(409, 'O pedido foi alterado. Atualize os dados e tente novamente.');
          db.exec('COMMIT'); return confirmation(previous);
        }
        const { start, end } = validateSlot(artist, style, date, time);
        if (occupied(start, end)) throw new BookingError(409, 'Este horário acabou de ser reservado. Escolha outro.');
        const id = randomUUID();
        db.prepare('INSERT INTO bookings VALUES(?,?,?,?,?,?,?,?,?,?,?,?)').run(id, artist, style, start, end, date, time, name, contact, key, hash, now().toISOString());
        db.exec('COMMIT'); return confirmation({ id, date, time });
      } catch (error) { db.exec('ROLLBACK'); throw error; }
    },
    close() { db.close(); },
  };
}
