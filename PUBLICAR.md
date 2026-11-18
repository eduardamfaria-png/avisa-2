# Publicar a gestão do Instituto Íris fora do Claude

O sistema fica num endereço próprio (ex.: `instituto-iris.web.app`), hospedado no
Firebase (Google). Login por e-mail com link (sem senha) ou conta Google. Só os
e-mails liberados entram; o bloqueio é feito pelo servidor (`firestore.rules`).
O site não aparece em buscas do Google (tem dados pessoais de alunos).

## Arquivos

- `iris.html` — o sistema (o mesmo usado no link do Claude).
- `gestao/` — versão para a internet: `index.html` (gerado por `scripts/build-gestao.mjs`),
  `backend.js` (login e banco no Firebase) e `firebase-config.js` (dados do projeto).
- `firestore.rules` — quem pode ler e escrever.
- `.github/workflows/publicar-gestao.yml` — publica sozinho a cada atualização.

## Passo a passo (uma vez só)

1. Em https://console.firebase.google.com crie o projeto (ex.: "instituto-iris").
   Pode desativar o Google Analytics. Plano gratuito (Spark).
2. **Authentication → Começar → Método de login**: ative **E-mail/senha** com a opção
   **Link de e-mail (login sem senha)**, e ative **Google**.
3. **Firestore Database → Criar banco de dados** → modo de produção → local `southamerica-east1` (São Paulo).
4. **Configurações do projeto → Seus apps → Web (</>)** → registre o app e copie o
   bloco `firebaseConfig` para `gestao/firebase-config.js`.
5. Em `firestore.rules`, troque `EMAIL_DA_COORDENACAO` pelo e-mail da coordenação.
6. **Configurações do projeto → Contas de serviço → Gerar nova chave privada** (baixa um .json).
   No GitHub do repositório: **Settings → Secrets and variables → Actions**:
   - *Secrets* → `FIREBASE_SERVICE_ACCOUNT` = conteúdo inteiro do .json
   - *Variables* → `FIREBASE_PROJECT_ID` = ID do projeto
7. Rode a ação **Publicar gestão** (aba Actions) ou faça qualquer atualização. O endereço
   fica `https://<ID-do-projeto>.web.app`.
8. Entre com o e-mail da coordenação e libere as outras pessoas em **Equipe**.

Se a publicação falhar por permissão, no Google Cloud (IAM) dê à conta de serviço os papéis
"Administrador do Firebase Hosting" e "Administrador das regras do Firebase".
