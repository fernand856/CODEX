import { test, expect } from '@playwright/test';
import { createServer, request } from 'node:http';
import type { AddressInfo } from 'node:net';

test('build carrega scripts, CSS e imagens sob /CODEX/ com hostname encaminhado', async ({ page, baseURL }) => {
  const prefix = '/CODEX/';
  const failures: string[] = [];
  page.on('pageerror', error => failures.push(error.message));
  page.on('response', response => { if (response.status() >= 400) failures.push(`${response.status()} ${response.url()}`); });
  const proxy = createServer((incoming, outgoing) => {
    if (!incoming.url?.startsWith(prefix)) {
      outgoing.writeHead(404).end('Outside preview prefix');
      return;
    }
    const target = new URL(incoming.url, baseURL);
    const upstream = request(target, {
      method: incoming.method,
      headers: { ...incoming.headers, host: 'preview.example.test' },
    }, response => {
      outgoing.writeHead(response.statusCode ?? 502, response.headers);
      response.pipe(outgoing);
    });
    upstream.on('error', () => { outgoing.writeHead(502).end('Preview upstream unavailable'); });
    incoming.pipe(upstream);
  });
  await new Promise<void>(resolve => proxy.listen(0, '127.0.0.1', resolve));
  const port = (proxy.address() as AddressInfo).port;
  try {
    await page.goto(`http://127.0.0.1:${port}${prefix}`);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(/Sua história,\s*em traços\./);
    await page.locator('.hero-figure img').evaluate(image => (image as HTMLImageElement).decode());
    expect(await page.locator('.hero-figure img').evaluate(image => (image as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
    await page.getByRole('button', { name: 'Ver mais trabalhos', exact: true }).click();
    const images = page.locator('img');
    expect(await images.count()).toBe(22);
    for (const image of await images.all()) {
      await image.scrollIntoViewIfNeeded();
      await expect.poll(() => image.evaluate(element => (element as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
    }
    const paths = await page.evaluate(() => [
      ...Array.from(document.querySelectorAll<HTMLScriptElement>('script[src]'), element => element.src),
      ...Array.from(document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"], link[rel="icon"]'), element => element.href),
      ...Array.from(document.images, image => image.src),
    ].map(value => new URL(value).pathname));
    expect(paths.every(path => path.startsWith(prefix))).toBe(true);
    await page.locator('#trabalhos').getByRole('button', { name: /^Ampliar Entre sombras,/ }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.getByRole('button', { name: 'Quero uma tattoo nesse estilo', exact: true }).click();
    await expect(page.locator('#booking-style')).toHaveValue('blackwork');
    await expect(page.locator('#booking-artist')).toHaveValue('caio');
    expect(failures).toEqual([]);
  } finally {
    await page.goto('about:blank');
    proxy.closeAllConnections();
    await new Promise<void>((resolve, reject) => proxy.close(error => error ? reject(error) : resolve()));
  }
});
