import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import SmartScanner from '../components/SmartScanner';
import { FileSpreadsheet, Share2, Calendar, UserCheck, Clock } from 'lucide-react';

const AttendancePage = () => {
    const [asistencias, setAsistencias] = useState([]);
    const [fechaFiltro, setFechaFiltro] = useState(new Date().toLocaleDateString('en-CA', { timeZone: 'America/Lima' }));
    const [loading, setLoading] = useState(false);
    const [isScannerActive, setIsScannerActive] = useState(false);
    const apiUrl = import.meta.env.VITE_API_URL;

    // --- LÓGICA DE NEGOCIO ---

    const aplicarReglasHorarias = (isoString, tipo) => {
        if (!isoString) return null;
        const date = new Date(isoString);
        const hours = date.getHours();
        const minutes = date.getMinutes();

        if (tipo === 'IN') {
            if (hours < 8) date.setHours(8, 0, 0, 0);
        } else if (tipo === 'OUT') {
            if (minutes >= 55) {
                date.setHours(hours + 1, 0, 0, 0);
            }
        }
        return date;
    };

    const calcularDiferenciaHoras = (entrada, salida) => {
    if (!entrada || !salida) return 0;
    
    const dEntrada = new Date(entrada);
    const dSalida = new Date(salida);
    
    let ms = dSalida - dEntrada;
    let horas = ms / (1000 * 60 * 60);

    // Definimos los límites del almuerzo para ese día específico
    const inicioAlmuerzo = new Date(entrada);
    inicioAlmuerzo.setHours(13, 0, 0, 0); // 1:00 PM

    const finAlmuerzo = new Date(entrada);
    finAlmuerzo.setHours(14, 0, 0, 0); // 2:00 PM

    // REGLA: Si el trabajador estuvo presente durante todo el rango de almuerzo
    if (dEntrada < inicioAlmuerzo && dSalida > finAlmuerzo) {
        horas -= 1; // Restamos la hora de refrigerio
    } 
    // OPCIONAL: Si quieres ser más estricto y restar proporcionalmente 
    // si sale en medio del almuerzo, podrías agregar más lógica, 
    // pero usualmente se resta la hora completa si cruzan el umbral.

    return horas > 0 ? horas : 0;
};

    const cargarDatos = useCallback(async () => {
        try {
            setLoading(true);
            const [resUsers, resAtt] = await Promise.all([
                axios.get(`${apiUrl}/api/users`),
                axios.get(`${apiUrl}/api/attendance?date=${fechaFiltro}`),
            ]);

            const trabajadores = resUsers.data.filter(u => u.type === 'Trabajador');
            const marcasDeHoy = resAtt.data;

            const listaFinal = trabajadores.map(user => {
                const marca = marcasDeHoy.find(m => {
                    const idWorker = m.worker?._id || m.worker;
                    return String(idWorker) === String(user._id);
                });
                
                const checkInAjustado = marca?.checkIn ? aplicarReglasHorarias(marca.checkIn, 'IN') : null;
                const checkOutAjustado = marca?.checkOut ? aplicarReglasHorarias(marca.checkOut, 'OUT') : null;

                return {
                    id: user._id,
                    attendanceId: marca?._id || null,
                    fullName: `${user.lastName}, ${user.name}`,
                    dni: user.dni,
                    checkIn: marca?.checkIn || null,
                    checkOut: marca?.checkOut || null,
                    displayIn: checkInAjustado,
                    displayOut: checkOutAjustado,
                    totalHours: calcularDiferenciaHoras(checkInAjustado, checkOutAjustado),
                    status: marca ? (marca.checkOut ? 'COMPLETO' : 'PRESENTE') : 'AUSENTE'
                };
            });

            setAsistencias(listaFinal.sort((a, b) => a.fullName.localeCompare(b.fullName)));
        } catch (e) {
            console.error("Error cargando datos:", e);
        } finally {
            setLoading(false);
        }
    }, [apiUrl, fechaFiltro]);

    useEffect(() => {
        cargarDatos();
    }, [cargarDatos]);

    // --- ACCIONES ---

    const handleManualEdit = async (attendanceId, workerId, field, newTime) => {
        if (!newTime) return;
        
        try {
            const [hours, minutes] = newTime.split(':');
            const ISOString = `${fechaFiltro}T${hours}:${minutes}:00`;
            const dateToSave = new Date(ISOString);

            if (isNaN(dateToSave.getTime())) return;

            await axios.patch(`${apiUrl}/api/attendance/editar`, {
                attendanceId: attendanceId, 
                workerId: workerId,
                date: fechaFiltro,
                field: field,
                value: dateToSave.toISOString()
            });

            await cargarDatos(); 
        } catch (err) {
            alert("Error al actualizar la hora manual");
        }
    };

    const handleScan = async (codigo) => {
        if (!codigo || loading) return;
        setLoading(true);
        try {
            const res = await axios.post(`${apiUrl}/api/attendance/registrar`, { workerId: codigo.trim() });
            new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3').play().catch(() => {});
            alert(res.data.message);
            await cargarDatos();
            setIsScannerActive(false);
        } catch (err) {
            alert(err.response?.data?.message || "Error QR");
        } finally {
            setLoading(false);
        }
    };

    const exportarExcel = () => {
        const dataParaExcel = asistencias.map((a, index) => ({
            'N°': index + 1,
            'Personal': a.fullName,
            'DNI': a.dni,
            'Entrada Real': a.checkIn ? new Date(a.checkIn).toLocaleTimeString('es-PE') : '---',
            'Salida Real': a.checkOut ? new Date(a.checkOut).toLocaleTimeString('es-PE') : '---',
            'Horas Calc.': a.totalHours.toFixed(2),
            'Estado': a.status
        }));
        const ws = XLSX.utils.json_to_sheet(dataParaExcel);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Asistencias");
        XLSX.writeFile(wb, `Reporte_${fechaFiltro}.xlsx`);
    };

    const enviarResumenWhatsApp = () => {
        const presentes = asistencias.filter(a => a.status !== 'AUSENTE');
        let mensaje = `*RESUMEN ASISTENCIA - ${fechaFiltro}*%0A%0A`;
        presentes.forEach((a, i) => {
            mensaje += `${i + 1}. ${a.fullName} ➔ ${a.totalHours.toFixed(1)}h%0A`;
        });
        window.open(`https://wa.me/?text=${mensaje}`, '_blank');
    };

    const formatearHoraParaInput = (iso) => {
        if (!iso) return "";
        const d = new Date(iso);
        return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
    };

    const formatearHoraDisplay = (iso) => {
        if (!iso) return '--:--';
        return new Date(iso).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: true });
    };

    return (
        <div style={st.container}>
            <header style={st.header}>
                <h1 style={st.title}>Panel de Control de Asistencias 📋</h1>
                <p style={st.subtitle}>Los cambios realizados solo afectan a la fecha seleccionada</p>
            </header>

            <div style={st.scanSection}>
                <button 
                    onClick={() => setIsScannerActive(!isScannerActive)} 
                    style={st.btnScanner(isScannerActive)}
                    disabled={loading}
                >
                    <UserCheck size={22} />
                    {loading ? "PROCESANDO..." : isScannerActive ? "CERRAR CÁMARA" : "ESCANEAR QR DE PERSONAL"}
                </button>
                {isScannerActive && (
                    <div style={st.scannerContainer}>
                        <SmartScanner onScanSuccess={handleScan} />
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
                    <button onClick={exportarExcel} style={st.btnExcel}><FileSpreadsheet size={18} /> Excel</button>
                    <button onClick={enviarResumenWhatsApp} style={st.btnWA}><Share2 size={18} /> WhatsApp</button>
                </div>
            </div>

            <div style={st.tableWrapper}>
                {/* La Key en la tabla garantiza independencia total entre fechas */}
                <table style={st.table} key={fechaFiltro}>
                    <thead>
                        <tr style={st.thead}>
                            <th style={st.th}>N°</th>
                            <th style={st.th}>Personal</th>
                            <th style={st.th}>Entrada (Real)</th>
                            <th style={st.th}>Salida (Real)</th>
                            <th style={st.th}>Horas Calc.</th>
                            <th style={st.th}>Estado</th>
                        </tr>
                    </thead>
                    <tbody>
                        {asistencias.map((a, index) => (
                            <tr key={`${a.id}-${fechaFiltro}`} style={st.tr}>
                                <td style={st.tdNum}>{index + 1}</td>
                                <td style={st.tdName}>
                                    <div style={st.nameText}>{a.fullName}</div>
                                    <div style={st.dniText}>DNI: {a.dni}</div>
                                </td>
                                
                                <td style={st.tdTime}>
                                    <div style={st.editContainer}>
                                        <input 
                                            type="time" 
                                            defaultValue={formatearHoraParaInput(a.checkIn)}
                                            onBlur={(e) => handleManualEdit(a.attendanceId, a.id, 'checkIn', e.target.value)}
                                            style={st.timeInput}
                                        />
                                        <span style={st.miniLabel}>Ajuste: {formatearHoraDisplay(a.displayIn)}</span>
                                    </div>
                                </td>

                                <td style={st.tdTime}>
                                    <div style={st.editContainer}>
                                        <input 
                                            type="time" 
                                            defaultValue={formatearHoraParaInput(a.checkOut)}
                                            onBlur={(e) => handleManualEdit(a.attendanceId, a.id, 'checkOut', e.target.value)}
                                            style={st.timeInput}
                                        />
                                        <span style={st.miniLabel}>Ajuste: {formatearHoraDisplay(a.displayOut)}</span>
                                    </div>
                                </td>

                                <td style={st.tdHours}>
                                    <Clock size={14} style={{marginRight: '5px'}} />
                                    {a.totalHours.toFixed(1)} h
                                </td>
                                
                                <td style={st.td}>
                                    {a.status === 'PRESENTE' && <span style={st.badgePresente}>✅ EN PLANTA</span>}
                                    {a.status === 'COMPLETO' && <span style={st.badgeCompleto}>🏁 TERMINADO</span>}
                                    {a.status === 'AUSENTE' && <span style={st.badgeAusente}>⏳ FALTÓ</span>}
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
    header: { marginBottom: '25px', textAlign: 'center' },
    title: { color: '#00ffa3', fontSize: '26px', margin: 0, fontWeight: 'bold' },
    subtitle: { color: '#8696a0', fontSize: '13px', marginTop: '5px' },
    scanSection: { display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '25px' },
    btnScanner: (active) => ({ 
        display: 'flex', alignItems: 'center', gap: '12px', padding: '15px 35px', 
        fontSize: '16px', fontWeight: 'bold', color: 'white', cursor: 'pointer', 
        backgroundColor: active ? '#ff2e5e' : '#00a884', border: 'none', borderRadius: '50px'
    }),
    scannerContainer: { 
        width: '100%', maxWidth: '400px', marginTop: '15px', borderRadius: '15px', 
        overflow: 'hidden', border: '4px solid #00ffa3'
    },
    actionBar: { 
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
        marginBottom: '20px', flexWrap: 'wrap', gap: '15px', backgroundColor: '#111b21', 
        padding: '20px', borderRadius: '15px', border: '1px solid #2a3942' 
    },
    filterGroup: { display: 'flex', alignItems: 'center', gap: '15px' },
    dateBox: { display: 'flex', flexDirection: 'column', gap: '4px' },
    dateLabel: { fontSize: '10px', color: '#00ffa3', fontWeight: 'bold' },
    dateInput: { 
        padding: '10px 15px', borderRadius: '10px', border: '2px solid #00ffa3', 
        backgroundColor: '#202c33', color: 'white', fontSize: '16px' 
    },
    buttonGroup: { display: 'flex', gap: '12px' },
    btnExcel: { 
        display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', 
        backgroundColor: '#1d6f42', color: 'white', border: 'none', borderRadius: '10px', 
        cursor: 'pointer', fontWeight: 'bold' 
    },
    btnWA: { 
        display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', 
        backgroundColor: '#25D366', color: 'white', border: 'none', borderRadius: '10px', 
        cursor: 'pointer', fontWeight: 'bold' 
    },
    tableWrapper: { backgroundColor: '#111b21', borderRadius: '15px', overflowX: 'auto', border: '1px solid #2a3942' },
    table: { width: '100%', borderCollapse: 'collapse', minWidth: '800px' },
    thead: { backgroundColor: '#202c33' },
    th: { padding: '18px', color: '#8696a0', textAlign: 'center', fontSize: '11px', textTransform: 'uppercase' },
    tr: { borderBottom: '1px solid #222d34' },
    td: { padding: '15px', textAlign: 'center' },
    tdNum: { textAlign: 'center', color: '#8696a0', fontSize: '12px' },
    tdName: { padding: '15px' },
    nameText: { fontWeight: '600', color: '#e9edef' },
    dniText: { fontSize: '11px', color: '#8696a0' },
    tdTime: { padding: '10px' },
    editContainer: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' },
    timeInput: { 
        backgroundColor: '#2a3942', border: '1px solid #3b4a54', color: '#00ffa3', 
        padding: '5px', borderRadius: '5px', fontSize: '14px', width: '90px', 
        textAlign: 'center', outline: 'none' 
    },
    miniLabel: { fontSize: '9px', color: '#8696a0', textTransform: 'uppercase' },
    tdHours: { fontWeight: '800', color: '#e9edef', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    badgePresente: { backgroundColor: 'rgba(0,255,163,0.1)', color: '#00ffa3', padding: '6px 12px', borderRadius: '8px', fontSize: '11px' },
    badgeCompleto: { backgroundColor: 'rgba(52,183,241,0.1)', color: '#34b7f1', padding: '6px 12px', borderRadius: '8px', fontSize: '11px' },
    badgeAusente: { color: '#8696a0', fontSize: '11px', fontStyle: 'italic' },
};

export default AttendancePage;