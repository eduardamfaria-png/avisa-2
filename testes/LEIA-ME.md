# Testes das regras de segurança

Confere, no simulador oficial do Firebase (sem tocar no banco real), quem pode ler e escrever cada coleção.

```bash
npm i @firebase/rules-unit-testing@3 firebase@10
cp ../firestore.rules .
npx firebase-tools@13 emulators:exec --only firestore --project demo-iris "node regras.test.mjs"
```
