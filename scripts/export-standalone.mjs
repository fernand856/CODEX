import { access, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Script } from 'node:vm';
import { build } from 'vite';
import react from '@vitejs/plugin-react';

// A second, in-memory build of the same application makes a portable demo.
// It does not change the normal website build, sources, or studio settings.
const projectRoot = fileURLToPath(new URL('../', import.meta.url));
const publicRoot = path.join(projectRoot, 'public');
const templateFile = path.join(projectRoot, 'dist', 'index.html');
const targetFile = path.join(projectRoot, 'entrega', 'traco-beta-abrir.html');
const assetModule = path.join(projectRoot, 'src', 'lib', 'assets.ts');
const mimeTypes = {
  '.webp': 'image/webp', '.avif': 'image/avif', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml',
  '.gif': 'image/gif',
};

async function embedImages(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(entries.map(async entry => {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) return embedImages(absolute);
    const mime = mimeTypes[path.extname(entry.name).toLowerCase()];
    if (!entry.isFile() || !mime) return {};
    const key = `/${path.relative(publicRoot, absolute).split(path.sep).join('/')}`;
    return { [key]: `data:${mime};base64,${(await readFile(absolute)).toString('base64')}` };
  }));
  return Object.assign({}, ...files);
}

try {
  await access(templateFile);
} catch {
  throw new Error('Gere primeiro o build: npm run build. Depois execute npm run export:standalone.');
}

const images = await embedImages(path.join(publicRoot, 'images'));
if (!Object.keys(images).length) throw new Error('Nenhuma imagem local encontrada em public/images.');

const portableAssets = {
  name: 'traco-portable-local-assets',
  enforce: 'pre',
  load(id) {
    if (id.split('?')[0] !== assetModule) return null;
    // Resolve images at build time, rather than asking file:// for sibling files.
    // Missing or remote media is reported instead of silently requiring a server.
    return `const images = ${JSON.stringify(images)};
      export function asset(input) {
        const key = '/' + input.replace(/^\\/+/, '');
        if (!Object.hasOwn(images, key)) throw new Error('Imagem não incorporada à demonstração: ' + input);
        return images[key];
      }`;
  },
};

const result = await build({
  configFile: false,
  root: projectRoot,
  publicDir: false,
  base: './',
  mode: 'production',
  define: { 'process.env.NODE_ENV': JSON.stringify('production') },
  plugins: [portableAssets, react()],
  build: {
    write: false,
    target: 'es2022',
    sourcemap: false,
    cssCodeSplit: false,
    lib: {
      entry: path.join(projectRoot, 'src', 'main.tsx'),
      name: 'TracoTattooDemo',
      formats: ['iife'],
      fileName: () => 'traco-beta.js',
    },
  },
});

const outputs = Array.isArray(result) ? result.flatMap(bundle => bundle.output) : result.output;
const chunks = outputs.filter(output => output.type === 'chunk');
if (chunks.length !== 1 || chunks[0].imports.length || chunks[0].dynamicImports.length) {
  throw new Error('O arquivo portátil precisa de um único script sem imports externos.');
}
const cssAssets = outputs.filter(output => output.type === 'asset' && output.fileName.endsWith('.css'));
const css = cssAssets.map(output => typeof output.source === 'string' ? output.source : Buffer.from(output.source).toString('utf8')).join('\n');
if (!css) throw new Error('O build portátil não produziu os estilos da aplicação.');
if (/@import\s|url\s*\(\s*['"]?(?!data:|#)/i.test(css)) {
  throw new Error('Os estilos ainda dependem de um recurso externo; incorpore-o antes de exportar.');
}

const favicon = `data:image/svg+xml;base64,${(await readFile(path.join(publicRoot, 'favicon.svg'))).toString('base64')}`;
let html = await readFile(templateFile, 'utf8');
// Keep generated metadata from the regular build, including noindex in the demo.
html = html
  .replace(/<script\b[^>]*\bsrc=["'][^"']+["'][^>]*>\s*<\/script\s*>/gi, '')
  .replace(/<link\b[^>]*\brel=["'](?:stylesheet|modulepreload|preload)["'][^>]*\/?\s*>/gi, '')
  .replace(/(<link\b[^>]*\brel=["']icon["'][^>]*\bhref=)["'][^"']+["']/i, (_, before) => `${before}"${favicon}"`)
  .replace(/^[\t ]+$/gm, '');

if (/<script\b[^>]*\bsrc=|<link\b[^>]*\brel=["'](?:stylesheet|modulepreload)["']/i.test(html)) {
  throw new Error('O HTML portátil ainda contém um script ou uma folha de estilos externos.');
}
const inlineCss = css.replace(/<\/style/gi, '<\\/style');
const inlineScript = chunks[0].code.replace(/<\/script/gi, '<\\/script');
// Callbacks preserve literal $&, $', and $` sequences inside bundled code.
// A replacement string would reinterpret those sequences and corrupt React.
html = html.replace('</head>', () => `<style>${inlineCss}</style>\n</head>`)
  .replace('</body>', () => `<script>${inlineScript}</script>\n</body>`);
html = html.replace('<!doctype html>', '<!doctype html>\n<!-- Demonstração portátil TRAÇO: abra este arquivo HTML no navegador. A cópia da mensagem possui alternativa manual; contatos e agenda continuam demonstrativos. -->');

const serializedScripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
if (serializedScripts.length !== 1 || serializedScripts[0][1] !== inlineScript) {
  throw new Error('A serialização do HTML alterou o script da aplicação.');
}
// Parse, without executing, the exact script that the browser will receive.
new Script(serializedScripts[0][1], { filename: 'traco-beta-inline.js' });

await mkdir(path.dirname(targetFile), { recursive: true });
await writeFile(targetFile, html);
console.log(`Arquivo portátil: ${path.relative(projectRoot, targetFile)}`);
console.log(`${Object.keys(images).length} imagens locais incorporadas; ${(Buffer.byteLength(html) / 1024 / 1024).toFixed(2)} MiB; sem servidor ou conexão para visualizar.`);
