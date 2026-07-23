// ==========================================================
// CONFIGURATION FIREBASE
// Remplace les valeurs ci-dessous par celles de TON projet
// Firebase (Console Firebase > Paramètres du projet > Général
// > "Vos applications" > SDK config).
// ==========================================================
const firebaseConfig = {
  apiKey: "AIzaSyCmXH6GfkqsN8gTt0heNGpTRNp1e_uaQNU",
  authDomain: "nbapple-3f0ce.firebaseapp.com",
  projectId: "nbapple-3f0ce",
  storageBucket: "nbapple-3f0ce.firebasestorage.app",
  messagingSenderId: "401275393539",
  appId: "1:401275393539:web:4a9791abbaf7faffc32036",
  measurementId: "G-TXSWB47DM4"
};

// Initialisation (SDK compat, chargé en <script> dans les pages HTML)
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

// Identifiant fixe du document d'élection (une seule élection à la fois)
const ELECTION_DOC_ID = "actuelle";
