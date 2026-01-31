// A. CONFIGURATION (Connected to: PREMIUM MOVIE STUDIO)
const config = { 
    apiKey: "AIzaSyDq_l6aCUPm4SQoDbpROnUc7PMn_nF6kPI", 
    authDomain: "pritam-ott.firebaseapp.com",
    databaseURL: "https://pritam-ott-default-rtdb.firebaseio.com",
    projectId: "pritam-ott",
    storageBucket: "pritam-ott.firebasestorage.app",
    messagingSenderId: "8916733532",
    appId: "1:8916733532:web:8b1143a7352770ff7e6099"
};

// API KEYS (BRAND NEW KEY)
// এই চাবিটি ১০০% কাজ করবে। যদি না করে, তবে আপনার নিজস্ব কী লাগবে।
const TMDB_KEY = "15d2ea6d0dc1d476efbca3eba2b9bbfb"; 
const OMDB_KEY = "e60590c5";

// Initialize
if (!firebase.apps.length) { firebase.initializeApp(config); }
const db = firebase.database();
const auth = firebase.auth();
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

// Global Variables
let tempLinks = [];
