// modus-app.js - Versión Final con Historial Recuperado
const FB_CFG = {
    apiKey: "AIzaSyC1GiJitT0QegrVe9o6CHCsvf7sEZELwRk",
    authDomain: "credilistosv.firebaseapp.com",
    databaseURL: "https://credilistosv-default-rtdb.firebaseio.com",
    projectId: "credilistosv",
    storageBucket: "credilistosv.firebasestorage.app"
};

firebase.initializeApp(FB_CFG);
const db = firebase.database();

let currentInver = 1;
let allData = {
    clients: {},
    rawRecords: [],
    historyRecords: [],
    finanzas: {}
};

document.addEventListener('DOMContentLoaded', () => {
    loadPortfolioData();
});

function switchView(view) {
    document.getElementById('view-dashboard').style.display = view === 'dashboard' ? 'block' : 'none';
    document.getElementById('view-financial-report').style.display = view === 'history' ? 'block' : 'none';
    
    document.querySelectorAll('.sidebar .btn-premium').forEach(btn => btn.classList.remove('active'));
    if (view === 'dashboard') document.querySelector('button[onclick*="dashboard"]').classList.add('active');
    if (view === 'history') {
        document.querySelector('button[onclick*="history"]').classList.add('active');
        renderFinancialReport();
    }
}

function selectInver(num) {
    currentInver = num;
    document.querySelectorAll('.portfolio-tab').forEach(t => t.classList.remove('active'));
    const target = document.querySelector(`[data-inver="${num}"]`);
    if (target) target.classList.add('active');
    loadPortfolioData();
}

function loadPortfolioData() {
    // 1. Configuración de Portfolio
    db.ref(`config/invers/inver${currentInver}`).on('value', snap => {
        allData.finanzas = snap.val() || { capitalInicial: 2100, cajaChica: 0 };
        renderDashboard();
    });

    // 2. Créditos Activos
    db.ref('clientes').on('value', snap => {
        const data = snap.val() || {};
        allData.rawRecords = Object.keys(data).map(key => ({ ...data[key], _key: key }));
        processData();
        renderDashboard();
    });

    // 3. Historial (Créditos recuperados)
    db.ref('clientes_historial').on('value', snap => {
        const data = snap.val() || {};
        allData.historyRecords = Object.keys(data).map(key => ({ ...data[key], _key: key }));
        processData();
        renderDashboard();
    });
}

function processData() {
    const clients = {};
    const combined = [...allData.rawRecords, ...allData.historyRecords];
    
    combined.forEach(record => {
        const nameClean = (record.nombre_completo || record.nombre || '').trim().toUpperCase();
        const id = record.dui || nameClean;

        if (!clients[id]) {
            clients[id] = {
                id: id,
                nombre: record.nombre_completo || record.nombre,
                dui: record.dui,
                telefono: record.telefono || record.tel,
                creditos: []
            };
        }
        clients[id].creditos.push(record);
    });

    allData.clients = clients;
}

function renderDashboard() {
    const hoy = getFechaHoySV();
    let moneyInPlay = 0;
    let collectedToday = 0;

    // Filtrar para el portfolio actual
    const activeCredits = allData.rawRecords.filter(c => (c.portfolio || 1) == currentInver && c.tipo === 'ACTIVO');

    activeCredits.forEach(c => {
        const totalCredito = parseFloat(c.total_pagar || c.total || 0);
        const totalPagado = (c.cuotas || []).reduce((sum, q) => sum + (q.pagada ? parseFloat(q.valorPagado || 0) : 0), 0);
        moneyInPlay += (totalCredito - totalPagado);

        (c.cuotas || []).forEach(q => {
            if (q.pagada && q.fecha_ISO === hoy) {
                collectedToday += parseFloat(q.valorPagado || 0);
            }
        });
    });

    // Totales Globales
    const initialCap = parseFloat(allData.finanzas.capitalInicial || 0);
    const cajaChica = parseFloat(allData.finanzas.cajaChica || 0);
    const totalInPlay = moneyInPlay;

    // Calcular Intereses Ganados (Histórico de cobros)
    let totalInterestsEarned = 0;
    const combined = [...allData.rawRecords, ...allData.historyRecords].filter(c => (c.portfolio || 1) == currentInver);
    combined.forEach(c => {
        const t = parseFloat(c.total_pagar || c.total || 1);
        const m = parseFloat(c.monto_solicitado || c.monto || 0);
        const profitRatio = (t - m) / t;
        (c.cuotas || []).forEach(q => {
            if (q.pagada) totalInterestsEarned += parseFloat(q.valorPagado || 0) * profitRatio;
        });
    });

    // Actualizar UI
    document.getElementById('initial-capital').textContent = `$${initialCap.toFixed(2)}`;
    document.getElementById('money-in-play').textContent = `$${totalInPlay.toFixed(2)}`;
    document.getElementById('petty-cash-display').textContent = `$${cajaChica.toFixed(2)}`;
    document.getElementById('earned-interest').textContent = `$${totalInterestsEarned.toFixed(2)}`;
    
    const totalAssets = totalInPlay + cajaChica;
    document.getElementById('total-investment-display').textContent = `$${totalAssets.toFixed(2)}`;

    renderClientsTable(activeCredits);
}

function renderClientsTable(activeCredits) {
    const tbody = document.getElementById('clients-tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    activeCredits.sort((a,b) => (a.nombre_completo || a.nombre || '').localeCompare(b.nombre_completo || b.nombre || '')).forEach(c => {
        const totalCredito = parseFloat(c.total_pagar || c.total || 0);
        const totalPagado = (c.cuotas || []).reduce((sum, q) => sum + (q.pagada ? parseFloat(q.valorPagado || 0) : 0), 0);
        const saldo = totalCredito - totalPagado;

        const tr = document.createElement('tr');
        tr.className = "animate-fade";
        tr.innerHTML = `
            <td class="syne">
                <div style="font-weight:700">${c.nombre_completo || c.nombre}</div>
                <div style="font-size:0.6rem; color:var(--text-muted)">${c.dui || 'SIN DUI'}</div>
            </td>
            <td class="mono">$${parseFloat(c.monto_solicitado || c.monto || 0).toFixed(2)}</td>
            <td class="mono" style="color: var(--accent)">$${saldo.toFixed(2)}</td>
            <td class="mono" style="font-size:0.75rem">${getNextPaymentDate(c)}</td>
            <td><span style="background: var(--success-glow); color: var(--success); padding: 4px 8px; border-radius: 4px; font-size: 0.6rem; font-weight:800">ACTIVO</span></td>
            <td>
                <button class="btn-premium" style="padding: 4px 10px; font-size: 0.6rem;" onclick="viewClientDetail('${c._key}')">DETALLES</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function getNextPaymentDate(c) {
    const next = (c.cuotas || []).find(q => !q.pagada);
    return next ? (next.fecha_prog || next.fecha_prog_sv || 'N/D') : 'PAGADO';
}

function getFechaHoySV() {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/El_Salvador' }).format(new Date());
}

// PANEL DE CAJA CHICA
function closePanels() {
    document.querySelectorAll('.side-panel').forEach(p => p.classList.remove('open'));
    document.getElementById('modal-overlay').style.display = 'none';
}

function openPettyCash() {
    document.getElementById('petty-cash-panel').classList.add('open');
    document.getElementById('modal-overlay').style.display = 'block';
    document.getElementById('pc-panel-balance').textContent = `$${parseFloat(allData.finanzas.cajaChica || 0).toFixed(2)}`;
}

async function savePettyCashAdjustment() {
    const type = document.getElementById('pc-type').value;
    const amount = parseFloat(document.getElementById('pc-amount').value);
    const reason = document.getElementById('pc-reason').value;
    
    if (isNaN(amount) || amount <= 0) return alert('Monto inválido');

    const currentCaja = parseFloat(allData.finanzas.cajaChica || 0);
    const newCaja = type === 'ingreso' ? currentCaja + amount : currentCaja - amount;

    try {
        await db.ref(`config/invers/inver${currentInver}`).update({
            cajaChica: newCaja
        });
        
        await db.ref(`logs/cajaChica/inver${currentInver}`).push({
            fecha: new Date().toISOString(),
            tipo: type,
            monto: amount,
            motivo: reason,
            saldoResultante: newCaja
        });

        alert('Ajuste procesado');
        document.getElementById('pc-amount').value = '';
        document.getElementById('pc-reason').value = '';
        closePanels();
        renderFinancialReport(); // Actualizar si estamos en la vista de informe
    } catch (e) {
        alert('Error: ' + e.message);
    }
}

// CORTE DE MES
function openMonthlyCut() {
    const diaX = prompt("Ingresa la fecha de corte (YYYY-MM-DD):", getFechaHoySV());
    if (!diaX) return;

    let totalRecibido = 0;
    let interesGanado = 0;

    // Procesar cobros de activos
    allData.rawRecords.filter(c => (c.portfolio || 1) == currentInver).forEach(c => {
        const t = parseFloat(c.total_pagar || c.total || 1);
        const m = parseFloat(c.monto_solicitado || c.monto || 0);
        const profitRatio = (t - m) / t;

        (c.cuotas || []).forEach(q => {
            if (q.pagada && q.fecha_ISO <= diaX) {
                const pago = parseFloat(q.valorPagado || 0);
                totalRecibido += pago;
                interesGanado += pago * profitRatio;
            }
        });
    });

    // Procesar cobros de historial (si tienen cuotas)
    allData.historyRecords.filter(c => (c.portfolio || 1) == currentInver).forEach(c => {
         // Si son saldados antes, los intereses ya se cuentan
    });

    alert(`CORTE DE MES AL ${diaX}\n\nIngresos Totales: $${totalRecibido.toFixed(2)}\nGanancia Bruta: $${interesGanado.toFixed(2)}`);
}

function viewClientDetail(key) {
    const record = allData.rawRecords.find(r => r._key === key) || allData.historyRecords.find(r => r._key === key);
    if (!record) return;

    const nameClean = (record.nombre_completo || record.nombre || '').trim().toUpperCase();
    const id = record.dui || nameClean;
    const client = allData.clients[id];

    const content = document.getElementById('details-content');
    
    // Cálculos de saldo
    const totalPagado = (record.cuotas || []).reduce((sum, q) => sum + (q.pagada ? parseFloat(q.valorPagado || 0) : 0), 0);
    const saldo = parseFloat(record.total_pagar || record.total || 0) - totalPagado;

    content.innerHTML = `
        <div class="glass-card" style="padding: 1.5rem; margin-bottom: 1rem; border-color: var(--accent); background: rgba(0, 242, 255, 0.05);">
            <h3 class="syne" style="color: var(--accent); margin: 0;">${client.nombre}</h3>
            <p style="font-size: 0.65rem; color: var(--text-muted); margin-top: 5px;">ID REGISTRO: ${record._key}</p>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-bottom: 1.5rem;">
            <div class="glass-card" style="padding: 10px; border-radius: 10px;">
                <div class="stat-label" style="font-size: 0.55rem;">DUI</div>
                <div class="stat-value" style="font-size: 0.9rem;">${record.dui || 'N/D'}</div>
            </div>
            <div class="glass-card" style="padding: 10px; border-radius: 10px;">
                <div class="stat-label" style="font-size: 0.55rem;">TELÉFONO</div>
                <div class="stat-value" style="font-size: 0.9rem;">${record.telefono || record.tel || 'N/D'}</div>
            </div>
            <div class="glass-card" style="padding: 10px; border-radius: 10px;">
                <div class="stat-label" style="font-size: 0.55rem;">NIT</div>
                <div class="stat-value" style="font-size: 0.9rem;">${record.nit || 'N/D'}</div>
            </div>
            <div class="glass-card" style="padding: 10px; border-radius: 10px;">
                <div class="stat-label" style="font-size: 0.55rem;">NACIMIENTO</div>
                <div class="stat-value" style="font-size: 0.9rem;">${record.fecha_nacimiento || 'N/D'}</div>
            </div>
        </div>

        <h4 class="syne" style="font-size: 0.7rem; color: var(--accent); margin-bottom: 0.75rem; text-transform: uppercase; letter-spacing: 1px;">Información Laboral</h4>
        <div class="glass-card" style="padding: 1rem; margin-bottom: 1.5rem; font-size: 0.8rem; line-height: 1.6;">
            <div><strong style="color: var(--text-secondary);">Trabajo:</strong> ${record.lugar_trabajo || 'N/D'}</div>
            <div><strong style="color: var(--text-secondary);">Ingresos:</strong> $${parseFloat(record.ingresos_mensuales || 0).toFixed(2)}</div>
            <div><strong style="color: var(--text-secondary);">Dirección:</strong> ${record.direccion || 'N/D'}</div>
            <div><strong style="color: var(--text-secondary);">Email:</strong> ${record.email || 'N/D'}</div>
        </div>

        <h4 class="syne" style="font-size: 0.7rem; color: var(--success); margin-bottom: 0.75rem; text-transform: uppercase; letter-spacing: 1px;">Estado de este Crédito</h4>
        <div class="glass-card" style="padding: 1rem; display: flex; justify-content: space-between; align-items: center; background: rgba(0, 255, 136, 0.03);">
            <div>
                <div class="stat-label" style="font-size: 0.6rem;">Saldo Pendiente</div>
                <div class="stat-value mono" style="font-size: 1.3rem; color: ${saldo > 0 ? 'var(--danger)' : 'var(--success)'};">$${saldo.toFixed(2)}</div>
            </div>
            <div style="text-align: right;">
                <div class="stat-label" style="font-size: 0.6rem;">Total a Pagar</div>
                <div class="stat-value mono" style="font-size: 1rem;">$${parseFloat(record.total_pagar || record.total || 0).toFixed(2)}</div>
            </div>
        </div>

        <h4 class="syne" style="font-size: 0.7rem; color: var(--warning); margin-top: 1.5rem; margin-bottom: 0.75rem; text-transform: uppercase; letter-spacing: 1px;">Historial del Cliente</h4>
        <div id="client-history-list" style="max-height: 200px; overflow-y: auto; padding-right: 5px;">
            ${client.creditos.map(c => `
                <div style="padding: 10px; border-bottom: 1px solid var(--border-glass); font-size: 0.75rem; display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <div style="font-weight: 700; color: white;">$${parseFloat(c.monto || c.monto_solicitado || 0).toFixed(2)}</div>
                        <div style="font-size: 0.6rem; color: var(--text-muted);">${c.fecha_inicio || c.fecha || 'N/D'}</div>
                    </div>
                    <span style="background: ${c.tipo === 'ACTIVO' ? 'var(--accent-glow)' : 'var(--success-glow)'}; color: ${c.tipo === 'ACTIVO' ? 'var(--accent)' : 'var(--success)'}; padding: 2px 8px; border-radius: 4px; font-size: 0.6rem; font-weight: 800;">
                        ${c.estado || (c.tipo === 'ACTIVO' ? 'ACTIVO' : 'SALDADO')}
                    </span>
                </div>
            `).join('')}
        </div>
    `;

    document.getElementById('details-modal').classList.add('open');
    document.getElementById('modal-overlay').style.display = 'block';
}

function renderFinancialReport() {
    let totalCollected = 0;
    let capitalRecovered = 0;
    let interestsEarned = 0;
    let principalPending = 0;
    let expectedInterest = 0;

    const combined = [...allData.rawRecords, ...allData.historyRecords].filter(c => (c.portfolio || 1) == currentInver);

    combined.forEach(c => {
        const totalC = parseFloat(c.total_pagar || c.total || 1);
        const capitalC = parseFloat(c.monto_solicitado || c.monto || 0);
        const profitRatio = (totalC - capitalC) / totalC;
        const principalRatio = capitalC / totalC;

        (c.cuotas || []).forEach(q => {
            const monto = parseFloat(q.valorPagado || 0);
            if (q.pagada) {
                totalCollected += monto;
                capitalRecovered += monto * principalRatio;
                interestsEarned += monto * profitRatio;
            } else {
                // Cuotas pendientes
                const valorCuota = parseFloat(q.monto || (totalC / (c.cuotas.length || 1)));
                principalPending += valorCuota * principalRatio;
                expectedInterest += valorCuota * profitRatio;
            }
        });
    });

    document.getElementById('rep-total-collected').textContent = `$${totalCollected.toFixed(2)}`;
    document.getElementById('rep-capital-recovered').textContent = `$${capitalRecovered.toFixed(2)}`;
    document.getElementById('rep-earned-interest').textContent = `$${interestsEarned.toFixed(2)}`;
    document.getElementById('rep-principal-pending').textContent = `$${principalPending.toFixed(2)}`;
    document.getElementById('rep-expected-interest').textContent = `$${expectedInterest.toFixed(2)}`;
    document.getElementById('rep-total-pending').textContent = `$${(principalPending + expectedInterest).toFixed(2)}`;

    // Cargar Logs de Caja Chica
    db.ref(`logs/cajaChica/inver${currentInver}`).limitToLast(20).once('value', snap => {
        const logs = snap.val() || {};
        const container = document.getElementById('rep-cashflow-logs');
        container.innerHTML = Object.values(logs).reverse().map(l => `
            <div style="display:flex; justify-content:space-between; font-size:0.75rem; padding:8px 0; border-bottom:1px solid #f1f5f9;">
                <span><strong style="color:${l.tipo === 'ingreso' ? 'var(--success)' : 'var(--danger)'}">${l.tipo.toUpperCase()}</strong>: ${l.motivo}</span>
                <span class="mono">$${parseFloat(l.monto).toFixed(2)}</span>
            </div>
        `).join('') || '<div style="color:var(--text-muted); font-size:0.8rem; text-align:center; padding:2rem;">Sin movimientos registrados</div>';
    });
}

function printContract() { alert("Generando Contrato PDF..."); }
function printPromissory() { alert("Generando Letra de Cambio PDF..."); }

