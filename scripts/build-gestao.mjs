// Gera gestao/index.html (site fora do Claude) a partir de iris.html.
import { readFileSync, writeFileSync } from 'node:fs';

const icone = 'data:image/png;base64,' + readFileSync('assets/icone-iris.png').toString('base64');

const app = readFileSync('iris.html', 'utf8');
const html = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex, nofollow">
<meta name="theme-color" content="#1c2d6b">
<link rel="icon" type="image/png" href="${icone}">
<link rel="apple-touch-icon" href="${icone}">
<title>Instituto Íris · Gestão</title>
<script>
  window.irisBackend = new Promise((res, rej) => { window.__irisBackendResolve = res; window.__irisBackendReject = rej; });
  window.irisBackend.catch(() => {});
</script>
<script src="firebase-config.js"></script>
<script type="module" src="backend.js"></script>
</head>
<body>
${app}
</body>
</html>
`;
writeFileSync('gestao/index.html', html);
console.log('gestao/index.html gerado');
