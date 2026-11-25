// Gera portal/portal.html (protótipo do Portal do Aluno) com o logo embutido.
import { readFileSync, writeFileSync } from 'node:fs';
const logo = 'data:image/webp;base64,' + readFileSync('assets/logo-iris.webp').toString('base64');
writeFileSync('portal/portal.html', readFileSync('portal/portal.src.html', 'utf8').replace('%%LOGO%%', logo));
console.log('portal/portal.html gerado');
