import { initializeApp } from 'firebase/app';
import { getFirestore, initializeFirestore, memoryLocalCache } from 'firebase/firestore';

// ============================================================================
// CONFIGURARE FIREBASE
// Înlocuiește valorile de mai jos cu cele din consola ta Firebase dacă rulezi
// aplicația în afara AI Studio. (Project Settings -> General -> Your apps -> Web)
// ============================================================================
export const FIREBASE_CONFIG = {
  apiKey: "AIzaSyAmEK1Y9_6Xp6m9ygYUgE0XGm9nq4Tznww",
  authDomain: "masaj-maria-folfa.firebaseapp.com",
  projectId: "masaj-maria-folfa",
  storageBucket: "masaj-maria-folfa.firebasestorage.app",
  messagingSenderId: "2115750018",
  appId: "1:2115750018:web:f9f9ee6160188b73164c9b"
};

// Obține configurarea Firebase injectată (Păstrăm configul manual ca sursă unică de adevăr)
const config = FIREBASE_CONFIG;

const app = initializeApp(config);
export const db = initializeFirestore(app, {
  localCache: memoryLocalCache(),
  experimentalForceLongPolling: true
});
