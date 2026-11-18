// Gera gestao/index.html (site fora do Claude) a partir de iris.html.
import { readFileSync, writeFileSync } from 'node:fs';

const app = readFileSync('iris.html', 'utf8');
const html = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex, nofollow">
<meta name="theme-color" content="#1c2d6b">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'%3E%3Ccircle cx='20' cy='20' r='18' fill='%23fff' stroke='%231c2d6b' stroke-width='3'/%3E%3Cpath d='M6 24a14.5 14.5 0 0 0 28 0' fill='none' stroke='%23d99a12' stroke-width='3'/%3E%3C/svg%3E">
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
