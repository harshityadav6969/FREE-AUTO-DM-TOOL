import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore } from 'firebase/firestore';

const firebaseConfig = {
 apiKey: "AIzaSyB-4t_Yf_oV33nURA0djrvDyxIVWpIUV6I",
  authDomain: "free-dm-sender.firebaseapp.com",
  projectId: "free-dm-sender",
  storageBucket: "free-dm-sender.firebasestorage.app",
  messagingSenderId: "463868733800",
  appId: "1:463868733800:web:0e24081b061bb676438edd",
  measurementId: "G-1CQC59TYRW"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = initializeFirestore(app, { experimentalForceLongPolling: true });

export default app;