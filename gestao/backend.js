// Conexão do sistema de gestão com o Firebase (Google): login por e-mail e banco de dados.
// A configuração do projeto fica em firebase-config.js.
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import {
  getAuth, onAuthStateChanged, sendSignInLinkToEmail, isSignInWithEmailLink, signInWithEmailLink,
  GoogleAuthProvider, signInWithPopup, signOut, browserLocalPersistence, setPersistence,
} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import {
  getFirestore, collection, doc, onSnapshot, setDoc, updateDoc, deleteDoc, getDoc,
} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';

// "Impressão digital" (SHA-256) dos e-mails da coordenação, os mesmos de firestore.rules.
// Permite conferir um e-mail antes de mandar o link sem deixar os e-mails escritos no site.
const DONOS = [
  '03a067252babae4d64c0ac339111f8e4b206d1d31186a47204a447569241ec60',
  '32afe39baaa612fa373ac4bfbed3baaee6dc5d44aa4616eec51b2cf6493a1d47',
  '864005209240bd63e9649f1da3c7a22c4e3a4ede539bf195bfeaa624c04f8c27',
  'c446a8456260764b5c06469f95b156eb188a489ba04087b035f66491da89c93f',
];
// Quem vê as Finanças (os mesmos de "financeiro()" em firestore.rules).
const FINANCEIRO = [
  '03a067252babae4d64c0ac339111f8e4b206d1d31186a47204a447569241ec60',
  '32afe39baaa612fa373ac4bfbed3baaee6dc5d44aa4616eec51b2cf6493a1d47',
  '864005209240bd63e9649f1da3c7a22c4e3a4ede539bf195bfeaa624c04f8c27',
];
async function hashEmail(email) {
  const bytes = new TextEncoder().encode(String(email).trim().toLowerCase());
  const d = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

const EMAIL_KEY = 'iris:loginEmail';
const store = {
  get: (k) => { try { return localStorage.getItem(k); } catch { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, v); } catch {} },
  del: (k) => { try { localStorage.removeItem(k); } catch {} },
};

function create(config) {
  const app = initializeApp(config);
  const auth = getAuth(app);
  auth.languageCode = 'pt';
  setPersistence(auth, browserLocalPersistence).catch(() => {});
  const fs = getFirestore(app);
  const pageUrl = () => location.origin + location.pathname;

  // Mesmo formato usado pelo app: collection(nome).onSnapshot / doc(id).set|update|delete
  const db = {
    collection(col) {
      return {
        onSnapshot(next, error) {
          return onSnapshot(collection(fs, col), { includeMetadataChanges: false }, (snap) => next({
            docs: snap.docs.map((d) => ({ id: d.id, data: () => d.data() })),
            metadata: { fromCache: snap.metadata.fromCache, hasPendingWrites: snap.metadata.hasPendingWrites },
          }), (e) => error && error({ code: e.code === 'permission-denied' ? 'invalid_argument' : 'unavailable', message: e.message }));
        },
        doc(id) {
          const ref = doc(fs, col, id);
          const wrap = (p) => p.catch((e) => { throw { code: e.code === 'permission-denied' ? 'invalid_argument' : 'unavailable', message: e.message }; });
          return { set: (b) => wrap(setDoc(ref, b)), update: (b) => wrap(updateDoc(ref, b)), delete: () => wrap(deleteDoc(ref)) };
        },
      };
    },
  };

  return {
    kind: 'firebase',
    db,
    onAuth: (cb) => onAuthStateChanged(auth, cb),
    async sendLink(email) {
      await sendSignInLinkToEmail(auth, email, { url: pageUrl(), handleCodeInApp: true });
      store.set(EMAIL_KEY, email);
    },
    linkPending: async () => isSignInWithEmailLink(auth, location.href),
    savedEmail: () => store.get(EMAIL_KEY),
    async completeLink(email) {
      await signInWithEmailLink(auth, email, location.href);
      store.del(EMAIL_KEY);
      history.replaceState(null, '', pageUrl());
    },
    googleSignIn: () => signInWithPopup(auth, new GoogleAuthProvider()),
    signOut: () => signOut(auth),
    // Quem não está na lista da equipe recebe "permissão negada" do servidor.
    // Confere se o e-mail está liberado ANTES de mandar o link (coleção "permitidos": só leitura de um item, sem listar).
    canFinance: async (email) => FINANCEIRO.includes(await hashEmail(email)),
    async isAllowedEmail(email) {
      const h = await hashEmail(email);
      if (DONOS.includes(h)) return true;
      try { return (await getDoc(doc(fs, 'permitidos', h))).exists(); } catch { return true; }
    },
    // Mantém a coleção "permitidos" igual à lista da equipe.
    async syncPermitidos(emails, removidos) {
      for (const e of emails) await setDoc(doc(fs, 'permitidos', await hashEmail(e)), { ok: true });
      for (const e of removidos) await deleteDoc(doc(fs, 'permitidos', await hashEmail(e)));
    },
    async isMember() {
      try { await getDoc(doc(fs, 'config', 'acesso')); return true; }
      catch (e) { if (e.code === 'permission-denied') return false; throw e; }
    },
  };
}

const cfg = window.IRIS_FIREBASE_CONFIG;
if (!cfg || !cfg.apiKey || String(cfg.apiKey).includes('COLE')) window.__irisBackendReject(new Error('config'));
else { try { window.__irisBackendResolve(create(cfg)); } catch (e) { window.__irisBackendReject(e); } }
