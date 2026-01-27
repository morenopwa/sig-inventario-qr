import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import SmartScanner from '../components/SmartScanner';
import { FileSpreadsheet, Share2, Calendar, UserCheck } from 'lucide-react';

const AttendancePage = () => {
    const [asistencias, setAsistencias] = useState([]);
    const [fechaFiltro, setFechaFiltro] = useState(new Date().toLocaleDateString('en-CA', {timeZone: 'America/Lima'}));
    const [loading, setLoading] = useState(false);
    const [isScannerActive, setIsScannerActive] = useState(false);
    const apiUrl = import.meta.env.VITE_API_URL;

    const cargarDatos = useCallback(async () => {
        try {
            const [resUsers, resAtt] = await Promise.all([
                axios.get(`${apiUrl}/api/users`),
                axios.get(`${apiUrl}/api/attendance?date=${fechaFiltro}`),
            ]);

            const trabajadores = resUsers.data.filter(u => u.type === 'Trabajador');
            const marcasDeHoy = resAtt.data;

            const listaFinal = trabajadores.map(user => {
                const marca = marcasDeHoy.find(m => 
                    (m.dni && String(m.dni) === String(user.dni)) || 
                    (m.worker && String(m.worker) === String(user._id))
                );
                
                return {
                    id: user._id,
                    fullName: `${user.lastName}, ${user.name}`,
                    dni: user.dni,
                    checkIn: marca?.checkIn || null,
                    checkOut: marca?.checkOut || null,
                    status: marca ? (marca.checkOut ? 'COMPLETO' : 'PRESENTE') : 'AUSENTE'
                };
            });

            setAsistencias(listaFinal.sort((a,b) => a.fullName.localeCompare(b.fullName)));
        } catch (e) {
            console.error("Error al cargar datos:", e);
        }
    }, [apiUrl, fechaFiltro]);

    useEffect(() => { 
        cargarDatos(); 
    }, [cargarDatos]);

    const handleScan = async (codigo) => {
        if (!codigo || loading) return;
        setLoading(true);
        try {
            await axios.post(`${apiUrl}/api/attendance/registrar`, { 
                workerId: codigo.trim() 
            });
            new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3').play().catch(()=>{});
            await cargarDatos(); 
            setIsScannerActive(false); 
        } catch (err) {
            alert(err.response?.data?.message || "Error al procesar la marca");
        } finally {
            setLoading(false);
        }
    };

    const exportarExcel = () => {
        const dataParaExcel = asistencias.map(a => ({
            'Personal': a.fullName,
            'DNI': a.dni,
            'Entrada': a.checkIn ? new Date(a.checkIn).toLocaleTimeString('es-PE', {timeZone: 'America/Lima'}) : '---',
            'Salida': a.checkOut ? new Date(a.checkOut).toLocaleTimeString('es-PE', {timeZone: 'America/Lima'}) : '---',
            'Estado': a.status
        }));

        const ws = XLSX.utils.json_to_sheet(dataParaExcel);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Asistencias");
        XLSX.writeFile(wb, `Asistencias_${fechaFiltro}.xlsx`);
    };

    const enviarResumenWhatsApp = () => {
        const presentes = asistencias.filter(a => a.status !== 'AUSENTE');
        const total = asistencias.length;
        
        let mensaje = `*RESUMEN DE ASISTENCIA - ${fechaFiltro}*%0A`;
        mensaje += `--------------------------------%0A`;
        mensaje += `✅ *Firmas registradas:* ${presentes.length} de ${total}%0A%0A`;
        
        mensaje += `*LISTA DE PRESENTES:*%0A`;
        presentes.forEach((a, i) => {
            mensaje += `${i + 1}. ${a.fullName}%0A`;
        });

        if (presentes.length === 0) mensaje += "No hay registros hoy.%0A";

        const url = `https://wa.me/?text=${mensaje}`;
        window.open(url, '_blank');
    };

    const formatearHora = (iso) => {
        if (!iso) return '--:--';
        try {
            const date = new Date(iso);
            return isNaN(date.getTime()) ? '--:--' : date.toLocaleTimeString('es-PE', {
                timeZone: 'America/Lima', hour: '2-digit', minute: '2-digit', hour12: true
            });
        } catch (e) { return '--:--'; }
    };

    return (
        <div style={st.container}>
            <header style={st.header}>
                <h1 style={st.title}>Panel de Asistencias 📋</h1>
            </header>

            <div style={st.scanSection}>
                <button 
                    onClick={() => setIsScannerActive(!isScannerActive)} 
                    style={st.btnScanner(isScannerActive)} 
                    disabled={loading}
                >
                    <UserCheck size={20} />
                    {loading ? "PROCESANDO..." : isScannerActive ? "CANCELAR" : "MARCAR ENTRADA / SALIDA"}
                </button>

                {isScannerActive && (
                    <div style={st.scannerContainer}>
                        <SmartScanner onScanSuccess={(c) => handleScan(c)} />
                    </div>
                )}
            </div>

            <div style={st.actionBar}>
                <div style={st.filterGroup}>
                    <Calendar size={18} color="#8696a0" />
                    <label style={st.label}>Fecha:</label>
                    <input 
                        type="date" 
                        value={fechaFiltro} 
                        onChange={(e) => setFechaFiltro(e.target.value)} 
                        style={st.dateInput} 
                    />
                </div>
                
                <div style={st.buttonGroup}>
                    <button onClick={exportarExcel} style={st.btnExcel}>
                        <FileSpreadsheet size={18} /> Excel
                    </button>
                    <button onClick={enviarResumenWhatsApp} style={st.btnWA}>
                        <Share2 size={18} /> WhatsApp
                    </button>
                </div>
            </div>

            <div style={st.tableWrapper}>
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
                        {asistencias.map((a) => (
                            <tr key={a.id} style={st.tr}>
                                <td style={{...st.td, textAlign: 'left', fontWeight: '500'}}>{a.fullName}</td>
                                <td style={{...st.td, color: '#8696a0'}}>{a.dni}</td>
                                <td style={{...st.td, color: '#00a884', fontWeight: 'bold'}}>{formatearHora(a.checkIn)}</td>
                                <td style={{...st.td, color: '#34b7f1', fontWeight: 'bold'}}>{formatearHora(a.checkOut)}</td>
                                <td style={st.td}>
                                    {a.status === 'PRESENTE' && <span style={st.badgePresente}>✅ PRESENTE</span>}
                                    {a.status === 'COMPLETO' && <span style={st.badgeCompleto}>🏁 FINALIZADO</span>}
                                    {a.status === 'AUSENTE' && <span style={st.badgeAusente}>⏳ AUSENTE</span>}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const st = {
    container: { padding: '20px', backgroundColor: '#0b141a', minHeight: '100vh', color: 'white', fontFamily: 'Segoe UI, sans-serif' },
    header: { marginBottom: '20px', textAlign: 'center' },
    title: { color: '#00a884', fontSize: '24px', margin: 0 },
    scanSection: { display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '20px' },
    scannerContainer: { width: '100%', maxWidth: '450px', marginTop: '15px', borderRadius: '15px', overflow: 'hidden', border: '3px solid #00a884' },
    actionBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap', gap: '10px', backgroundColor: '#111b21', padding: '15px', borderRadius: '12px', border: '1px solid #2a3942' },
    filterGroup: { display: 'flex', alignItems: 'center', gap: '10px' },
    label: { fontSize: '14px', color: '#8696a0' },
    dateInput: { padding: '8px 12px', borderRadius: '8px', border: 'none', backgroundColor: '#2a3942', color: 'white', outline: 'none' },
    buttonGroup: { display: 'flex', gap: '10px' },
    btnExcel: { display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', backgroundColor: '#1d6f42', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' },
    btnWA: { display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', backgroundColor: '#25D366', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' },
    tableWrapper: { backgroundColor: '#111b21', borderRadius: '12px', overflowX: 'auto', border: '1px solid #2a3942' },
    table: { width: '100%', borderCollapse: 'collapse', minWidth: '600px' },
    thead: { backgroundColor: '#202c33' },
    th: { padding: '15px', color: '#8696a0', textAlign: 'center', fontSize: '13px', textTransform: 'uppercase' },
    td: { padding: '15px', borderBottom: '1px solid #2a3942', textAlign: 'center', fontSize: '14px' },
    tr: { transition: 'background 0.2s' },
    badgePresente: { backgroundColor: 'rgba(0,168,132,0.1)', color: '#00a884', padding: '5px 10px', borderRadius: '6px', fontWeight: 'bold', fontSize: '11px' },
    badgeCompleto: { backgroundColor: 'rgba(52,183,241,0.1)', color: '#34b7f1', padding: '5px 10px', borderRadius: '6px', fontWeight: 'bold', fontSize: '11px' },
    badgeAusente: { color: '#8696a0', fontSize: '11px' },
    btnScanner: (active) => ({
        display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 30px',
        fontSize: '15px', fontWeight: 'bold', color: 'white', cursor: 'pointer',
        backgroundColor: active ? '#ff2e5e' : '#00a884',
        border: 'none', borderRadius: '50px', transition: '0.3s'
    })
};

export default AttendancePage;