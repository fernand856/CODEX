import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createBookings, BookingError } from './booking.mjs';

export function createApp({ database = process.env.BOOKING_DB || './var/bookings.sqlite', root = './dist', now } = {}) {
  const bookings = createBookings(database, now);
  const directory = resolve(root);
  const rate = new Map();
  const json = (res, code, value) => { res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' }); res.end(JSON.stringify(value)); };
  const server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://localhost');
      if (url.pathname.startsWith('/api/')) {
        if (req.method === 'GET' && url.pathname === '/api/availability') return json(res, 200, bookings.availability(url.searchParams.get('artist'), url.searchParams.get('style'), url.searchParams.get('date')));
        if (req.method === 'POST' && url.pathname === '/api/bookings') {
          const address = req.socket.remoteAddress;
          const current = rate.get(address);
          const counter = current && current.until > Date.now() ? current : { count: 0, until: Date.now() + 60000 };
          if (++counter.count > 20) return json(res, 429, { error: 'Muitas tentativas. Aguarde um minuto.' });
          if (rate.size > 10000) for (const [key, value] of rate) if (value.until <= Date.now()) rate.delete(key);
          rate.set(address, counter);
          if (req.headers['sec-fetch-site'] === 'cross-site') throw new BookingError(403, 'Origem não permitida.');
          if (req.headers.origin) {
            const origin = new URL(req.headers.origin);
            const allowed = process.env.PUBLIC_ORIGIN ? new URL(process.env.PUBLIC_ORIGIN).origin : `http://${req.headers.host}`;
            if (origin.origin !== allowed) throw new BookingError(403, 'Origem não permitida.');
          }
          if (!req.headers['content-type']?.startsWith('application/json')) throw new BookingError(415, 'Envie JSON.');
          let body = ''; let size = 0;
          for await (const chunk of req) { size += chunk.length; if (size > 4096) throw new BookingError(413, 'Pedido muito grande.'); body += chunk.toString(); }
          let input; try { input = JSON.parse(body); } catch { throw new BookingError(400, 'JSON inválido.'); }
          return json(res, 201, bookings.book(input, req.headers['idempotency-key']));
        }
        return json(res, 404, { error: 'Endpoint não encontrado.' });
      }
      if (!['GET', 'HEAD'].includes(req.method)) return json(res, 405, { error: 'Método não permitido.' });
      const path = resolve(directory, '.' + decodeURIComponent(url.pathname));
      if (path !== directory && !path.startsWith(directory + sep)) return json(res, 404, { error: 'Não encontrado.' });
      const target = url.pathname === '/' ? resolve(directory, 'index.html') : path;
      const content = await readFile(target);
      const type = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.webp': 'image/webp', '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.txt': 'text/plain' }[extname(target)] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': type, 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'same-origin' }); res.end(req.method === 'HEAD' ? undefined : content);
    } catch (error) {
      if (error instanceof BookingError) return json(res, error.status, { error: error.message });
      if (error.code === 'ENOENT' || error.code === 'EISDIR' || error instanceof URIError) return json(res, 404, { error: 'Não encontrado.' });
      console.error('Booking service failure:', error.code || error.name);
      json(res, 503, { error: 'Não foi possível concluir agora. Tente novamente com os mesmos dados.' });
    }
  });
  server.on('close', () => bookings.close());
  return server;
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT || 3001);
  createApp().listen(port, process.env.HOST || '127.0.0.1', () => console.log(`Traço server listening on ${port}`));
}
