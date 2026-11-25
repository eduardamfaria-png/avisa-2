// Gera os protótipos do site com o logo embutido:
//   portal/portal.html        → abre no site aberto (quem não é aluno), com o botão Entrar
//   portal/portal-aluno.html  → mesmo site, mas já abre na tela do aluno
import { readFileSync, writeFileSync } from 'node:fs';
const logo = 'data:image/webp;base64,' + readFileSync('assets/logo-iris.webp').toString('base64');
const html = readFileSync('portal/portal.src.html', 'utf8').replace('%%LOGO%%', logo);
writeFileSync('portal/portal.html', html);
writeFileSync('portal/portal-aluno.html', `<script>window.PORTAL_INICIO = 'aluno';</script>\n` + html.replace('<title>Site Instituto Íris</title>', '<title>Portal do Aluno Íris</title>'));
console.log('portal/portal.html e portal/portal-aluno.html gerados');
