// Configuración de Firebase que ya manejábamos
const firebaseConfig = {
    apiKey: "AIzaSy...", // Tu API Key que está en la consola de Firebase
    authDomain: "credilisto-sm.firebaseapp.com",
    projectId: "credilisto-sm",
    storageBucket: "credilisto-sm.appspot.com",
    messagingSenderId: "XXXXXXXXXXXX",
    appId: "1:XXXXXXXXXXXX:web:XXXXXXXXXXXX"
};

// Inicialización
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();