// Gera demo/teste.html: versão de teste (dados de exemplo, nada é salvo) para mostrar a quem não tem acesso.
import { readFileSync, writeFileSync } from 'node:fs';
const app = readFileSync('iris.html', 'utf8').replace('<title>Gestão Instituto Íris</title>', '<title>Íris — versão de teste</title>');
writeFileSync('demo/teste.html', `<script>window.IRIS_DEMO = true;</script>\n${app}`);
console.log('demo/teste.html gerado');
