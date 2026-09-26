// Gera um único HTML autocontido (JS e CSS embutidos) para publicar o AVISÊ como link.
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const dir = 'dist-artifact';
const assets = readdirSync(join(dir, 'assets'));
const js = readFileSync(join(dir, 'assets', assets.find((f) => f.endsWith('.js'))), 'utf8').replace(/<\/script/gi, '<\\/script');
const css = readFileSync(join(dir, 'assets', assets.find((f) => f.endsWith('.css'))), 'utf8');

const html = `<title>AVISÊ</title>
<meta name="theme-color" content="#0B0B12">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Manrope:wght@600;700;800&display=swap">
<style>:root{color-scheme:dark}html,body{background:#0B0B12}${css}</style>
<div id="root"></div>
<script type="module">${js}</script>
`;
writeFileSync(join(dir, 'avise.html'), html);
console.log(`dist-artifact/avise.html (${(html.length / 1024).toFixed(0)} KB)`);
