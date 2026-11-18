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
    async isMember() {
      try { await getDoc(doc(fs, 'config', 'acesso')); return true; }
      catch (e) { if (e.code === 'permission-denied') return false; throw e; }
    },
  };
}

const cfg = window.IRIS_FIREBASE_CONFIG;
if (!cfg || !cfg.apiKey || String(cfg.apiKey).includes('COLE')) window.__irisBackendReject(new Error('config'));
else { try { window.__irisBackendResolve(create(cfg)); } catch (e) { window.__irisBackendReject(e); } }
