/* ── FIREBASE INIT ── loaded after Firebase CDN compat scripts */

const firebaseConfig = {
  apiKey: "AIzaSyD3gG-yoFop3-X-8zd_s4fGmUdtNaXMMUE",
  authDomain: "sutasensei-c5a85.firebaseapp.com",
  projectId: "sutasensei-c5a85",
  storageBucket: "sutasensei-c5a85.firebasestorage.app",
  messagingSenderId: "158798008982",
  appId: "1:158798008982:web:e52db205cbe0dbdf16e8b7",
  measurementId: "G-GXES7K24VZ",
};

firebase.initializeApp(firebaseConfig);

const _auth = firebase.auth();
const _db = firebase.firestore();
