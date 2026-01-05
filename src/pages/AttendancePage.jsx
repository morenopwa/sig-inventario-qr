import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import SmartScanner from '../components/SmartScanner';

const AttendancePage = () => {
    const [asistencias, setAsistencias] = useState([]);
    const [fechaFiltro, setFechaFiltro] = useState(new Date().toLocaleDateString('en-CA', {timeZone: 'America/Lima'}));
    const [loading, setLoading] = useState(false);
    const [isScannerActive, setIsScannerActive] = useState(false);
    const apiUrl = import.meta.env.VITE_API_URL;

    const cargarDatos = useCallback(async () => {
        try {
            // 1. Pedimos usuarios y asistencias en paralelo para ganar velocidad
            const [resUsers, resAtt] = await Promise.all([
                axios.get(`${apiUrl}/api/users`),
                axios.get(`${apiUrl}/api/attendance?date=${fechaFiltro}`),
            ]);

            const trabajadores = resUsers.data.filter(u => u.tipo === 'Trabajador');
            const marcasDeHoy = resAtt.data;

            // 2. Cruzamos los datos
            const listaFinal = trabajadores.map(user => {
                const marca = marcasDeHoy.find(m => m.dni === user.dni);
                return {
                    id: user._id,
                    fullName: `${user.lastName}, ${user.name}`,
                    dni: user.dni,
                    entryTime: marca ? marca.entryTime : null,
                    exitTime: marca ? marca.exitTime : null,
                    observations: marca ? marca.observations : 'Sin marca'
                };
            });

            setAsistencias(listaFinal.sort((a,b) => a.fullName.localeCompare(b.fullName)));
        } catch (e) {
            console.error("Error al cargar:", e);
        }
    }, [apiUrl, fechaFiltro]);

    useEffect(() => { 
        cargarDatos(); 
    }, [cargarDatos]);

    const handleScan = async (codigo) => {
        if (!codigo || loading) return;
        setLoading(true);
        try {
            await axios.post(`${apiUrl}/api/attendance/registrar`, { workerId: codigo.trim() });
            new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3').play().catch(()=>{});
            await cargarDatos(); // Recarga automática
        } catch (err) {
            alert(err.response?.data?.message || "Error");
        } finally {
            setLoading(false);
        }
    };

    const formatearHora = (iso) => {
        if (!iso) return '--:--';
        return new Date(iso).toLocaleTimeString('es-PE', {
            timeZone: 'America/Lima', hour: '2-digit', minute: '2-digit', hour12: true
        });
    };

    return (
        
        <div style={st.container}>
            <header  className="inventory-controls-bar" style={st.header}>
                <h1 style={st.title}>Panel de Asistencias</h1>
                <div style={st.actions}>
                  </div>
            </header>

            <button 
                onClick={() => setIsScannerActive(!isScannerActive)}
                style={st.btnScanner(isScannerActive)}
            >
                <span style={st.icon}>{isScannerActive ? "⏹️" : "📷"}</span>
             {isScannerActive ? "DETENER ESCÁNER" : "ACTIVAR ESCANER"}
            </button>
            {/* SCANNER CONDICIONAL */}
            <div style={{maxWidth: '400px', margin: '0 auto'}}>
                {isScannerActive && <SmartScanner onScanSuccess={(c) => {
                    handleScan(c); // Tu función de axios.post
                    setIsScannerActive(false); // Opcional: apagar tras leer
                }} />}
            </div>

            {/* FILTRO DE HISTORIAL */}
            <div style={{ margin: '20px 0', textAlign: 'center' }}>
                <label>Ver fecha: </label>
                <input 
                    type="date" 
                    value={fechaFiltro} 
                    onChange={(e) => setFechaFiltro(e.target.value)}
                    style={{ padding: '8px', borderRadius: '5px', backgroundColor: '#202c33', color: 'white' }}
                />
            </div>

            <div style={st.tableWrapper}>
            <table style={st.table}>
    <thead>
        <tr style={st.thead}>
            <th style={st.th}>#</th> {/* Numeración de vuelta */}
            <th style={st.th}>Personal</th>
            <th style={st.th}>DNI</th>
            <th style={st.th}>Entrada</th>
            <th style={st.th}>Salida</th>
            <th style={st.th}>Estado</th>
        </tr>
    </thead>
    <tbody>
        {asistencias.map((a, index) => (
            <tr key={a.id} style={st.tr}>
                <td style={st.td}>{index + 1}</td>
                <td style={{...st.td, textAlign: 'left'}}>{a.fullName}</td>
                <td style={st.td}>{a.dni}</td>
                <td style={st.td}>{formatearHora(a.entryTime)}</td>
                <td style={st.td}>{formatearHora(a.exitTime)}</td>
                <td style={st.td}>
                    {a.entryTime ? 
                        <span style={st.badgeOk}>✅ PRESENTE</span> : 
                        <span style={st.badgeNo}>⏳ AUSENTE</span>}
                </td>
            </tr>
        ))}
    </tbody>
</table>
</div>
        </div>
    );
};

// Estilos básicos
const st = {
    container: { padding: '20px', backgroundColor: '#0b141a', minHeight: '100vh', color: 'white' },
    header: { display: 1, justifyContent: 'space-between', marginBottom: '20px', gap: '10px', overflowY: 'auto'  },
    title: { textAlign: 'center', color: '#00a884' },
    scannerContainer: { maxWidth: '350px', margin: '20px auto', border: '2px solid #00a884', borderRadius: '10px', overflow: 'hidden' },
    loadingText: { textAlign: 'center', color: '#00a884', fontWeight: 'bold' },
    tableWrapper: { backgroundColor: '#111b21', borderRadius: '12px', overflowX: 'auto' },
    table: { width: '100%', borderCollapse: 'collapse' },
    thead: { backgroundColor: '#00a884' },
    th: { padding: '12px', border: '1px solid #2a3942' },
    td: { padding: '12px', border: '1px solid #2a3942', textAlign: 'center' },
    tr: { backgroundColor: '#111b21' },
    badgeOk: { color: '#00a884', fontWeight: 'bold' },
    badgeNo: { color: '#8696a0' },
    btnScanner: (active) => ({
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px',
        margin: '20px auto',
        padding: '15px 30px',
        fontSize: '16px',
        fontWeight: 'bold',
        color: 'white',
        backgroundColor: active ? '#ea0038' : '#00a884', // Rojo si está activo, Verde si no
        border: 'none',
        borderRadius: '50px',
        cursor: 'pointer',
        boxShadow: active ? '0 0 15px rgba(234, 0, 56, 0.4)' : '0 4px 10px rgba(0, 168, 132, 0.3)',
        transition: 'all 0.3s ease',
        transform: active ? 'scale(1.05)' : 'scale(1)',
    }),
    icon: {
        fontSize: '20px'
    }
};

export default AttendancePage;