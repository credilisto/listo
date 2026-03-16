// app.js - VERSIÓN DE DIAGNÓSTICO PROFUNDO

import { initializeApp } from "firebase/app";
// Importamos getDatabase y ref/get para Realtime Database
import { getDatabase, ref, get, child } from "firebase/database"; 

// 1. Tu configuración de Firebase (LA QUE PEGASTE ANTES)
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

console.log("1. Iniciando Firebase...");
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
console.log("2. Conexión a Realtime Database establecida (en teoría).");

// =========================================
// LÓGICA DE CARGADO (REPARADA)
// =========================================

function mapearDatosAFicha(datos) {
    console.log("5. Mapeando datos al HTML:", datos);
    // Usamos los nombres exactos que suelen usarse en Realtime DB
    document.getElementById('data-nombre').innerText = datos.nombre_completo || datos.nombre || 'N/D';
    document.getElementById('data-dui').innerText = datos.dui || 'N/D';
    document.getElementById('data-nit').innerText = datos.nit || 'N/D';
    document.getElementById('data-nacimiento').innerText = datos.fecha_nacimiento || 'N/D';
    document.getElementById('data-telefono').innerText = datos.telefono || 'N/D';
    document.getElementById('data-email').innerText = datos.email || 'N/D';
    document.getElementById('data-direccion').innerText = datos.direccion || 'N/D';
    document.getElementById('data-trabajo').innerText = datos.lugar_trabajo || 'N/D';
    
    const ingresos = datos.ingresos_mensuales ? `$${parseFloat(datos.ingresos_mensuales).toFixed(2)}` : 'N/D';
    document.getElementById('data-ingresos').innerText = ingresos;
}

async function cargarFichaCliente(idCliente) {
    const loadingEl = document.getElementById('datosClienteCargando');
    const contenidoEl = document.getElementById('contenidoFicha');
    
    console.log(`3. Intentando buscar cliente con ID: ${idCliente}...`);

    try {
        // En Realtime Database, la estructura es diferente.
        // Asumimos que tienes un nodo 'clientes' y dentro los IDs.
        const dbRef = ref(getDatabase());
        const snapshot = await get(child(dbRef, `clientes/${idCliente}`));

        if (snapshot.exists()) {
            console.log("4. ¡Datos encontrados en Firebase!");
            const datos = snapshot.val();
            mapearDatosAFicha(datos);

            loadingEl.style.display = 'none';
            contenidoEl.style.display = 'block';
        } else {
            console.log("4. El nodo no existe en esa ruta.");
            loadingEl.innerText = `Error: El cliente con ID "${idCliente}" no existe en Realtime Database. Revisa la ruta 'clientes/${idCliente}'.`;
        }
    } catch (error) {
        console.error("❌ ERROR CRÍTICO DE FIREBASE:", error);
        loadingEl.innerText = `Error técnico: ${error.message}. Revisa la consola (F12) para más detalles.`;
    }
}

// =========================================
// INICIAR PROCESO
// =========================================

// ⚠️ IMPORTANTE: ESTE ID DEBE EXISTIR EN TU BASE DE DATOS
// Entra a tu consola de Firebase -> Realtime Database y copia un ID real.
const ID_CLIENTE_REAL = "REEMPLAZA_CON_UN_ID_EXISTENTE_EN_TU_BASE_DE_DATOS"; 

if (ID_CLIENTE_REAL === "REEMPLAZA_CON_UN_ID_EXISTENTE_EN_TU_BASE_DE_DATOS") {
    document.getElementById('datosClienteCargando').innerText = "ERROR: Debes editar 'app.js' y poner un ID de cliente real en la variable ID_CLIENTE_REAL.";
} else {
    cargarFichaCliente(ID_CLIENTE_REAL);
}

document.getElementById('btnImprimir').addEventListener('click', () => { window.print(); });
