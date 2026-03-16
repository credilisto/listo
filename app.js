// app.js - Gestión de Firebase y Ficha de Cliente

// 1. Importar las funciones necesarias del SDK (Versión Modular v9+)
import { initializeApp } from "firebase/app";
// Importamos Firestore (Base de datos)
import { getFirestore, doc, getDoc } from "firebase/firestore"; 

// 2. Tu configuración de Firebase (LA QUE PEGASTE ANTES)
const firebaseConfig = {
  apiKey: "AIzaSyC1GiJitT0QegrVe9o6CHCsvf7sEZELwRk",
  authDomain: "credilistosv.firebaseapp.com",
  databaseURL: "https://credilistosv-default-rtdb.firebaseio.com",
  projectId: "credilistosv",
  storageBucket: "credilistosv.firebasestorage.app",
  messagingSenderId: "285358928455",
  appId: "1:285358928455:web:3bf56f7d5d1ebc16537762",
  measurementId: "G-2V85PVCFTZ"
};

// 3. Inicializar Firebase
const app = initializeApp(firebaseConfig);
// Inicializar Firestore
const db = getFirestore(app);

// =========================================
// LÓGICA PARA CARGAR LA FICHA
// =========================================

// Función para rellenar el HTML con los datos de Firebase
function mapearDatosAFicha(datos) {
    document.getElementById('data-nombre').innerText = datos.nombreCompleto || 'N/D';
    document.getElementById('data-dui').innerText = datos.dui || 'N/D';
    document.getElementById('data-nit').innerText = datos.nit || 'N/D';
    document.getElementById('data-nacimiento').innerText = datos.fechaNacimiento || 'N/D';
    document.getElementById('data-telefono').innerText = datos.telefono || 'N/D';
    document.getElementById('data-email').innerText = datos.email || 'N/D';
    document.getElementById('data-direccion').innerText = datos.direccion || 'N/D';
    document.getElementById('data-trabajo').innerText = datos.lugarTrabajo || 'N/D';
    
    // Formatear dinero (suponiendo que viene como número)
    const ingresos = datos.ingresosMensuales ? `$${parseFloat(datos.ingresosMensuales).toFixed(2)}` : 'N/D';
    document.getElementById('data-ingresos').innerText = ingresos;
}

// Función principal para obtener un cliente de la colección 'clientes'
async function cargarFichaCliente(idCliente) {
    const loadingEl = document.getElementById('datosClienteCargando');
    const contenidoEl = document.getElementById('contenidoFicha');
    const idDisplayEl = document.getElementById('clienteIdDisplay');
    
    idDisplayEl.innerText = idCliente;

    try {
        // Referencia al documento específico: db -> colección 'clientes' -> id del documento
        const docRef = doc(db, "clientes", idCliente);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            // Si el cliente existe en Firebase
            console.log("Datos del cliente:", docSnap.data());
            
            // Pasar los datos raw a la función que llena el HTML
            mapearDatosAFicha(docSnap.data());

            // Mostrar la ficha y ocultar el 'Cargando...'
            loadingEl.style.display = 'none';
            contenidoEl.style.display = 'block';
        } else {
            // doc.exists() will be false if the document does not exist
            loadingEl.innerText = "Error: El cliente con ese ID no existe en la base de datos.";
            console.log("No such document!");
        }
    } catch (error) {
        console.error("Error obteniendo documento:", error);
        loadingEl.innerText = "Error crítico al conectar con Firebase.";
    }
}

// =========================================
// INICIAR PROCESO
// =========================================

// EJEMPLO: Vamos a cargar un cliente fijo para probar.
// En producción, este ID vendría de la URL (ej: ficha.html?id=123)
const ID_CLIENTE_PRUEBA = "REEMPLAZA_CON_UN_ID_REAL_DE_TU_COLECCION_CLIENTES"; 

// Si no tienes Firestore configurado con datos, esto fallará.
// Comenta la línea de abajo si solo quieres ver el diseño HTML sin Firebase.
cargarFichaCliente(ID_CLIENTE_PRUEBA);


// Configurar el botón de imprimir
document.getElementById('btnImprimir').addEventListener('click', () => {
    window.print(); // Esto abre el diálogo de impresión del navegador
});