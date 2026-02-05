import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import SmartScanner from '../components/SmartScanner';
import { FileSpreadsheet, Share2, Calendar, UserCheck } from 'lucide-react';

const AttendancePage = () => {
    const [asistencias, setAsistencias] = useState([]);
    const [fechaFiltro, setFechaFiltro] = useState(new Date().toLocaleDateString('en-CA', { timeZone: 'America/Lima' }));
    const [loading, setLoading] = useState(false);
    const [isScannerActive, setIsScannerActive] = useState(false);
    const apiUrl = import.meta.env.VITE_API_URL;

    /**
     * Lógica de Redondeo (Reglas de Negocio):
     * 1. IN: Si es antes de las 8:00 AM -> 8:00 AM. Si es después -> Hora real.
     * 2. OUT: Si faltan 5 min o menos para la hora en punto -> Redondea arriba.
     */
    const aplicarReglasHorarias = (isoString, tipo) => {
        if (!isoString) return null;
        const date = new Date(isoString);
        const hours = date.getHours();
        const minutes = date.getMinutes();

        if (tipo === 'IN') {
            // Regla: Ingreso antes de las 8 am se marca como 8 am
            if (hours < 8) {
                date.setHours(8, 0, 0, 0);
            }
        } else if (tipo === 'OUT') {
            // Regla: 5 minutos antes de la hora en punto redondea a la hora siguiente
            if (minutes >= 55) {
                date.setHours(hours + 1, 0, 0, 0);
            }
        }
        return date;
    };

    const calcularDiferenciaHoras = (entrada, salida) => {
        if (!entrada || !salida) return 0;
        const ms = new Date(salida) - new Date(entrada);
        const horas = ms / (1000 * 60 * 60);
        return horas > 0 ? horas : 0;
    };

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
                
                // Aplicar reglas de ajuste para el cálculo y visualización
                const checkInAjustado = marca?.checkIn ? aplicarReglasHorarias(marca.checkIn, 'IN') : null;
                const checkOutAjustado = marca?.checkOut ? aplicarReglasHorarias(marca.checkOut, 'OUT') : null;
                const horasTotales = calcularDiferenciaHoras(checkInAjustado, checkOutAjustado);

                return {
                    id: user._id,
                    fullName: `${user.lastName}, ${user.name}`,
                    dni: user.dni,
                    checkIn: checkInAjustado,
                    checkOut: checkOutAjustado,
                    totalHours: horasTotales,
                    status: marca ? (marca.checkOut ? 'COMPLETO' : 'PRESENTE') : 'AUSENTE'
                };
            });

            setAsistencias(listaFinal.sort((a, b) => a.fullName.localeCompare(b.fullName)));
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
            // Sonido de éxito
            new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3').play().catch(() => {});
            await cargarDatos(); 
            setIsScannerActive(false); 
        } catch (err) {
            alert(err.response?.data?.message || "Error al procesar la marca");
        } finally {
            setLoading(false);
        }
    };

    const exportarExcel = () => {
        const dataParaExcel = asistencias.map((a, index) => ({
            'N°': index + 1,
            'Personal': a.fullName,
            'DNI': a.dni,
            'Entrada (Ajustada)': a.checkIn ? new Date(a.checkIn).toLocaleTimeString('es-PE') : '---',
            'Salida (Ajustada)': a.checkOut ? new Date(a.checkOut).toLocaleTimeString('es-PE') : '---',
            'Horas Realizadas': a.totalHours.toFixed(2),
            'Estado': a.status
        }));

        const ws = XLSX.utils.json_to_sheet(dataParaExcel);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Asistencias");
        XLSX.writeFile(wb, `Reporte_Asistencia_${fechaFiltro}.xlsx`);
    };

    const enviarResumenWhatsApp = () => {
        const presentes = asistencias.filter(a => a.status !== 'AUSENTE');
        const total = asistencias.length;
        
        let mensaje = `*RESUMEN DE ASISTENCIA - ${fechaFiltro}*%0A`;
        mensaje += `--------------------------------%0A`;
        mensaje += `✅ *Presentes:* ${presentes.length} de ${total}%0A%0A`;
        
        presentes.forEach((a, i) => {
            mensaje += `${i + 1}. ${a.fullName} (${a.totalHours.toFixed(1)}h)%0A`;
        });

        const url = `https://wa.me/?text=${mensaje}`;
        window.open(url, '_blank');
    };

    const formatearHora = (iso) => {
        if (!iso) return '--:--';
        try {
            const date = new Date(iso);
            return date.toLocaleTimeString('es-PE', {
                hour: '2-digit', minute: '2-digit', hour12: true
            });
        } catch (e) { return '--:--'; }
    };

    return (
        <div style={st.container}>
            <header style={st.header}>
                <h1 style={st.title}>Panel de Asistencias 📋</h1>
                <p style={st.subtitle}>Regla: Entrada 8:00 AM | Salida: Gracia 5min</p>
            </header>

            <div style={st.scanSection}>
                <button 
                    onClick={() => setIsScannerActive(!isScannerActive)} 
                    style={st.btnScanner(isScannerActive)} 
                    disabled={loading}
                >
                    <UserCheck size={20} />
                    {loading ? "PROCESANDO..." : isScannerActive ? "CANCELAR ESCÁNER" : "MARCAR ENTRADA / SALIDA"}
                </button>

                {isScannerActive && (
                    <div style={st.scannerContainer}>
                        <SmartScanner onScanSuccess={(c) => handleScan(c)} />
                    </div>
                )}
            </div>

            <div style={st.actionBar}>
                <div style={st.filterGroup}>
                    <Calendar size={22} color="#00ffa3" />
                    <div style={st.dateBox}>
                        <label style={st.dateLabel}>FECHA DE CONSULTA:</label>
                        <input 
                            type="date" 
                            value={fechaFiltro} 
                            onChange={(e) => setFechaFiltro(e.target.value)} 
                            style={st.dateInput} 
                        />
                    </div>
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
                            <th style={st.th}>N°</th>
                            <th style={st.th}>Personal</th>
                            <th style={st.th}>Entrada</th>
                            <th style={st.th}>Salida</th>
                            <th style={st.th}>Horas</th>
                            <th style={st.th}>Estado</th>
                        </tr>
                    </thead>
                    <tbody>
                        {asistencias.length === 0 ? (
                            <tr><td colSpan="6" style={st.td}>Cargando datos...</td></tr>
                        ) : (
                            asistencias.map((a, index) => (
                                <tr key={a.id} style={st.tr}>
                                    <td style={st.tdNum}>{index + 1}</td>
                                    <td style={st.tdName}>
                                        <div style={st.nameText}>{a.fullName}</div>
                                        <div style={st.dniText}>DNI: {a.dni}</div>
                                    </td>
                                    <td style={st.tdTimeIn}>{formatearHora(a.checkIn)}</td>
                                    <td style={st.tdTimeOut}>{formatearHora(a.checkOut)}</td>
                                    <td style={st.tdHours}>{a.totalHours.toFixed(1)} h</td>
                                    <td style={st.td}>
                                        {a.status === 'PRESENTE' && <span style={st.badgePresente}>✅ EN PLANTA</span>}
                                        {a.status === 'COMPLETO' && <span style={st.badgeCompleto}>🏁 TERMINADO</span>}
                                        {a.status === 'AUSENTE' && <span style={st.badgeAusente}>⏳ FALTÓ</span>}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const st = {
    container: { padding: '20px', backgroundColor: '#0b141a', minHeight: '100vh', color: 'white', fontFamily: 'Segoe UI, sans-serif' },
    header: { marginBottom: '25px', textAlign: 'center' },
    title: { color: '#00ffa3', fontSize: '26px', margin: 0, fontWeight: 'bold' },
    subtitle: { color: '#8696a0', fontSize: '12px', marginTop: '5px' },
    scanSection: { display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '25px' },
    scannerContainer: { width: '100%', maxWidth: '400px', marginTop: '15px', borderRadius: '15px', overflow: 'hidden', border: '4px solid #00ffa3', boxShadow: '0 0 20px rgba(0, 255, 163, 0.2)' },
    
    actionBar: { 
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
        marginBottom: '20px', flexWrap: 'wrap', gap: '15px', 
        backgroundColor: '#111b21', padding: '20px', borderRadius: '15px', 
        border: '1px solid #2a3942' 
    },
    filterGroup: { display: 'flex', alignItems: 'center', gap: '15px' },
    dateBox: { display: 'flex', flexDirection: 'column', gap: '4px' },
    dateLabel: { fontSize: '10px', color: '#00ffa3', fontWeight: 'bold', marginLeft: '2px' },
    dateInput: { 
        padding: '10px 15px', borderRadius: '10px', border: '2px solid #00ffa3', 
        backgroundColor: '#202c33', color: 'white', outline: 'none', 
        fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' 
    },
    
    buttonGroup: { display: 'flex', gap: '12px' },
    btnExcel: { display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', backgroundColor: '#1d6f42', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' },
    btnWA: { display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', backgroundColor: '#25D366', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' },
    
    tableWrapper: { backgroundColor: '#111b21', borderRadius: '15px', overflowX: 'auto', border: '1px solid #2a3942' },
    table: { width: '100%', borderCollapse: 'collapse', minWidth: '700px' },
    thead: { backgroundColor: '#202c33' },
    th: { padding: '18px', color: '#8696a0', textAlign: 'center', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' },
    tr: { borderBottom: '1px solid #222d34', transition: '0.2s' },
    td: { padding: '15px', textAlign: 'center', fontSize: '14px' },
    tdNum: { padding: '15px', textAlign: 'center', fontSize: '13px', color: '#8696a0' },
    tdName: { padding: '15px', textAlign: 'left' },
    nameText: { fontWeight: '600', color: '#e9edef' },
    dniText: { fontSize: '11px', color: '#8696a0', marginTop: '2px' },
    tdTimeIn: { padding: '15px', color: '#00ffa3', fontWeight: 'bold' },
    tdTimeOut: { padding: '15px', color: '#34b7f1', fontWeight: 'bold' },
    tdHours: { padding: '15px', fontWeight: '800', color: '#e9edef', backgroundColor: 'rgba(255,255,255,0.03)' },
    
    badgePresente: { backgroundColor: 'rgba(0,255,163,0.1)', color: '#00ffa3', padding: '6px 12px', borderRadius: '8px', fontWeight: 'bold', fontSize: '11px', border: '1px solid rgba(0,255,163,0.2)' },
    badgeCompleto: { backgroundColor: 'rgba(52,183,241,0.1)', color: '#34b7f1', padding: '6px 12px', borderRadius: '8px', fontWeight: 'bold', fontSize: '11px', border: '1px solid rgba(52,183,241,0.2)' },
    badgeAusente: { color: '#8696a0', fontSize: '11px', fontStyle: 'italic' },
    
    btnScanner: (active) => ({
        display: 'flex', alignItems: 'center', gap: '12px', padding: '15px 35px',
        fontSize: '16px', fontWeight: 'bold', color: 'white', cursor: 'pointer',
        backgroundColor: active ? '#ff2e5e' : '#00a884',
        border: 'none', borderRadius: '50px', transition: '0.3s',
        boxShadow: active ? '0 4px 15px rgba(255,46,94,0.3)' : '0 4px 15px rgba(0,168,132,0.3)'
    })
};

export default AttendancePage;