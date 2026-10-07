import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { studio } from './src/data/studio.ts';

// Relative public URLs also work when the cloud preview is forwarded under a
// path prefix; assets must stay inside that prefix instead of requesting /assets.
const base = './';
let resolvedBase = base;
const escapeHtml = (text: string) => text.replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]!);
function realSiteUrl() {
  if (studio.demoMode || !studio.productionContentApproved || !studio.address || !/^[1-9]\d{7,14}$/.test(studio.whatsappNumber)) return null;
  try {
    const url = new URL(studio.siteUrl);
    return url.protocol === 'https:' && !url.username && !url.password && !url.search && !url.hash ? url.href : null;
  } catch { return null; }
}

export default defineConfig({
  plugins: [react(), {
    name: 'studio-publication-metadata',
    configResolved(config) { resolvedBase = config.base; },
    transformIndexHtml(html) {
      const replaceMeta = (name: string, value: string) => {
        const pattern = new RegExp(`(<meta (?:name|property)="${name}" content=")[^"]*("\\s*\\/?>)`);
        html = html.replace(pattern, (_, before, after) => `${before}${escapeHtml(value)}${after}`);
      };
      html = html.replace(/<title>.*?<\/title>/, `<title>${escapeHtml(studio.pageTitle)}</title>`);
      replaceMeta('description', studio.metaDescription);
      replaceMeta('og:title', studio.pageTitle);
      replaceMeta('og:description', studio.metaDescription);
      replaceMeta('robots', studio.demoMode || !studio.productionContentApproved ? 'noindex, nofollow' : 'index, follow');
      const site = realSiteUrl();
      if (site) {
        const business = { '@context': 'https://schema.org', '@type': 'TattooParlor', name: studio.studioName, url: site, address: studio.address, telephone: `+${studio.whatsappNumber}`, description: studio.metaDescription };
        const image = new URL(`${resolvedBase}${studio.ogImage.replace(/^\//, '')}`, site).href;
        html = html.replace('</head>', `<link rel="canonical" href="${escapeHtml(site)}" /><meta property="og:url" content="${escapeHtml(site)}" /><meta property="og:image" content="${escapeHtml(image)}" /><script type="application/ld+json">${JSON.stringify(business).replace(/</g, '\\u003c')}</script></head>`);
      }
      return html;
    },
    generateBundle() {
      const site = realSiteUrl();
      this.emitFile({ type: 'asset', fileName: 'robots.txt', source: studio.demoMode || !studio.productionContentApproved ? 'User-agent: *\nDisallow: /\n' : `User-agent: *\nAllow: /\n${site ? `Sitemap: ${new URL('sitemap.xml', site.endsWith('/') ? site : `${site}/`).href}\n` : ''}` });
      if (site) this.emitFile({ type: 'asset', fileName: 'sitemap.xml', source: `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${escapeHtml(site)}</loc></url></urlset>` });
    },
  }],
  base,
  server: { host: '0.0.0.0', port: 3000, strictPort: true },
  preview: {
    host: '0.0.0.0',
    port: 3000,
    strictPort: true,
    // The authenticated cloud proxy forwards a variable Host header. Preview
    // serves only the public build in dist; development host checks stay intact.
    allowedHosts: true,
  },
  build: { target: 'es2022' },
});
