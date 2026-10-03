import { cp, mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const suite = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = path.resolve(suite, '../blueline');
const src = path.join(source, 'src');
const destination = path.join(suite, 'public/blueline');
const read = (file) => readFile(path.join(src, file), 'utf8');
const scripts = (await readdir(src)).filter((file) => /^\d\d-.*\.js$/.test(file)).sort();
const js = (await Promise.all(scripts.map(read))).join('\n');
const html = `<!doctype html>
<html lang="en">
<head>
${await read('head.html')}
<style>${await read('style.css')}</style>
</head>
<body>
${await read('shell.html')}
<script src="https://cdn.jsdelivr.net/npm/paper@0.12.18/dist/paper-core.min.js" async></script>
<script>
${js}
if (document.readyState !== 'loading') { document.removeEventListener('DOMContentLoaded', init); init(); }
</script>
</body>
</html>
`;
await mkdir(destination, { recursive: true });
await writeFile(path.join(source, 'index.html'), html);
await writeFile(path.join(destination, 'index.html'), html);
for (const file of ['README.md', 'llms.txt', 'tools.json', 'docs', 'examples']) {
  await cp(path.join(source, file), path.join(destination, file), { recursive: true });
}
console.log('Built Blueline and staged its app, tool manifest, docs, and examples.');
