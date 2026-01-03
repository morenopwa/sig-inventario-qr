import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import SmartScanner from '../components/SmartScanner';

const AttendancePage = () => {
    const [asistencias, setAsistencias] = useState([]);
    const [loading, setLoading] = useState(false);
    const apiUrl = import.meta.env.VITE_API_URL;

    const cargarDatos = useCallback(async () => {
        try {
            const hoyPeru = new Intl.DateTimeFormat('en-CA', {timeZone: 'America/Lima'}).format(new Date());
            
            // 1. Pedimos usuarios y asistencias en paralelo para ganar velocidad
            const [resUsers, resAtt] = await Promise.all([
                axios.get(`${apiUrl}/api/users`),
                axios.get(`${apiUrl}/api/attendance?date=${hoyPeru}`)
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
    }, [apiUrl]);

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
            <h2 style={st.title}>Panel de Asistencia Diaria</h2>
            <div style={st.scannerContainer}>
                <SmartScanner onScanSuccess={handleScan} />
                {loading && <p style={st.loadingText}>Procesando...</p>}
            </div>
            
            <table style={st.table}>
                <thead>
                    <tr style={st.thead}>
                        <th style={st.th}>Personal</th>
                        <th style={st.th}>DNI</th>
                        <th style={st.th}>Entrada</th>
                        <th style={st.th}>Salida</th>
                        <th style={st.th}>Estado</th>
                    </tr>
                </thead>
                <tbody>
                    {asistencias.map(a => (
                        <tr key={a.id} style={st.tr}>
                            <td style={st.td}>{a.fullName}</td>
                            <td style={st.td}>{a.dni}</td>
                            <td style={st.td}>{formatearHora(a.entryTime)}</td>
                            <td style={st.td}>{formatearHora(a.exitTime)}</td>
                            <td style={st.td}>
                                {a.entryTime ? 
                                    <span style={st.badgeOk}>PRESENTE</span> : 
                                    <span style={st.badgeNo}>AUSENTE</span>}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

// Estilos básicos
const st = {
    container: { padding: '20px', backgroundColor: '#0b141a', minHeight: '100vh', color: 'white' },
    title: { textAlign: 'center', color: '#00a884' },
    scannerContainer: { maxWidth: '350px', margin: '20px auto', border: '2px solid #00a884', borderRadius: '10px', overflow: 'hidden' },
    loadingText: { textAlign: 'center', color: '#00a884', fontWeight: 'bold' },
    table: { width: '100%', borderCollapse: 'collapse', marginTop: '30px' },
    thead: { backgroundColor: '#00a884' },
    th: { padding: '12px', border: '1px solid #2a3942' },
    td: { padding: '12px', border: '1px solid #2a3942', textAlign: 'center' },
    tr: { backgroundColor: '#111b21' },
    badgeOk: { color: '#00a884', fontWeight: 'bold' },
    badgeNo: { color: '#8696a0' }
};

export default AttendancePage;