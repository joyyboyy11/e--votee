// ==========================================================
// CONFIGURATION FIREBASE
// Remplace les valeurs ci-dessous par celles de TON projet
// Firebase (Console Firebase > Paramètres du projet > Général
// > "Vos applications" > SDK config).
// ==========================================================
const firebaseConfig = {
  apiKey: "AIzaSyCOETQUnP1HWiKV-nw2YhEgkzWWVju17rI",
  authDomain: "e--votee.firebaseapp.com",
  projectId: "e--votee",
  storageBucket: "e--votee.firebasestorage.app",
  messagingSenderId: "916221538672",
  appId: "1:916221538672:web:fe002d81d421ac68bd9fb5",
  measurementId: "G-0S6JFMVFWM"
};

// Initialisation (SDK compat, chargé en <script> dans les pages HTML)
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

// Identifiant fixe du document d'élection (une seule élection à la fois)
const ELECTION_DOC_ID = "actuelle";
