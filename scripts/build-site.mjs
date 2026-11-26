// Monta a pasta site/ que vai para o ar:
//   site/index.html          → site aberto do Instituto Íris (cursos e inscrições ligados ao banco)
//   site/gestao/             → site de gestão da equipe (o mesmo de sempre, agora em /gestao)
// Antes, rode: node scripts/build-gestao.mjs
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, rmSync, readdirSync } from 'node:fs';

rmSync('site', { recursive: true, force: true });
mkdirSync('site/gestao', { recursive: true });

const icone = 'data:image/png;base64,' + readFileSync('assets/icone-iris.png').toString('base64');
const URL_SITE = 'https://instituto-iris.web.app';
const desc = 'Instituto Íris: cursos gratuitos em São João de Meriti. Informática, pilates e mais. Oportunidade para todos!';

// No site publicado, as fotos e logos vão como arquivos separados (carrega mais rápido no celular).
const pagina = readFileSync('portal/portal.src.html', 'utf8')
  .replace(/<title>[^<]*<\/title>\n?/, '')
  .replace('%%LOGO%%', '/logo-iris.webp')
  .replace(/%%PARC:([a-z0-9-]+)%%/g, (_, n) => `/parceiros/${n}.webp`)
  .replace(/%%FOTO:([a-z0-9-]+)%%/g, (_, n) => `/fotos/${n}.webp`);
const corte = pagina.indexOf('<div id="gate"></div>');
if (corte < 0) throw new Error('Marcador <div id="gate"> não encontrado em portal/portal.html');

writeFileSync('site/index.html', `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#1c2d6b">
<title>Instituto Íris · Oportunidade para todos</title>
<meta name="description" content="${desc}">
<meta property="og:type" content="website">
<meta property="og:title" content="Instituto Íris · Oportunidade para todos">
<meta property="og:description" content="${desc}">
<meta property="og:url" content="${URL_SITE}/">
<meta property="og:image" content="${URL_SITE}/compartilhar.jpg">
<link rel="icon" type="image/png" href="${icone}">
<link rel="apple-touch-icon" href="${icone}">
<script>window.IRIS_SITE = true;</script>
<script src="/firebase-config.js"></script>
${pagina.slice(0, corte)}</head>
<body>
${pagina.slice(corte)}
</body>
</html>
`);
copyFileSync('assets/fotos/compartilhar.jpg', 'site/compartilhar.jpg');
copyFileSync('assets/logo-iris.webp', 'site/logo-iris.webp');
for (const pasta of ['fotos', 'parceiros']) {
  mkdirSync(`site/${pasta}`, { recursive: true });
  for (const f of readdirSync(`assets/${pasta}`)) if (f.endsWith('.webp')) copyFileSync(`assets/${pasta}/${f}`, `site/${pasta}/${f}`);
}
copyFileSync('gestao/firebase-config.js', 'site/firebase-config.js');
for (const f of ['index.html', 'backend.js', 'firebase-config.js']) copyFileSync(`gestao/${f}`, `site/gestao/${f}`);
console.log('site/ montado: site aberto em / e gestão em /gestao/');
