import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyB672oHekE8neskCTawJoJK-MTUgA5HpMA",
  authDomain: "v-1-j1-tracking.firebaseapp.com",
  projectId: "v-1-j1-tracking",
  storageBucket: "v-1-j1-tracking.firebasestorage.app",
  messagingSenderId: "624393995850",
  appId: "1:624393995850:web:162975d13598bc4eb508b3",
  measurementId: "G-KXKVMYR9YX"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
