import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import useAuth from '../hooks/useAuth';
import SmartScanner from '../components/SmartScanner';
import { FileSpreadsheet, Share2, Calendar, UserCheck, Clock, Star, CheckCircle, AlertCircle } from 'lucide-react';

const AttendancePage = () => {
    const { user, isAdmin, isSuperAdmin } = useAuth();
    const [asistencias, setAsistencias] = useState([]);
    // La fecha por defecto es hoy en Lima
    const [fechaFiltro, setFechaFiltro] = useState(new Date().toLocaleDateString('en-CA', { timeZone: 'America/Lima' }));
    const [loading, setLoading] = useState(false);
    const [isScannerActive, setIsScannerActive] = useState(false);
    
    const [scannedId, setScannedId] = useState(null); 
    const [notificacion, setNotificacion] = useState({ show: false, msg: '', type: 'success' });
    const rowRefs = useRef({}); 

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

        const inicioAlmuerzo = new Date(entrada);
        inicioAlmuerzo.setHours(13, 0, 0, 0); 
        const finAlmuerzo = new Date(entrada);
        finAlmuerzo.setHours(14, 0, 0, 0); 

        if (dEntrada < inicioAlmuerzo && dSalida > finAlmuerzo) {
            horas -= 1; 
        } 
        return horas > 0 ? horas : 0;
    };

    // --- CARGA DE DATOS ---

    const cargarDatos = useCallback(async () => {
        try {
            setLoading(true);
            const [resUsers, resAtt] = await Promise.all([
                axios.get(`${apiUrl}/api/users`),
                axios.get(`${apiUrl}/api/attendance?date=${fechaFiltro}`),
            ]);

            const trabajadores = resUsers.data.filter(u => u.type === 'Trabajador');
            const marcasDeHoy = resAtt.data;

            const listaFinal = trabajadores.map(t => {
                const marca = marcasDeHoy.find(m => {
                    const idWorker = m.worker?._id || m.worker;
                    return String(idWorker) === String(t._id);
                });
                
                const checkInAjustado = marca?.checkIn ? aplicarReglasHorarias(marca.checkIn, 'IN') : null;
                const checkOutAjustado = marca?.checkOut ? aplicarReglasHorarias(marca.checkOut, 'OUT') : null;

                return {
                    id: t._id,
                    customId: t.customId,
                    dni: t.dni,
                    attendanceId: marca?._id || null,
                    fullName: `${t.lastName}, ${t.name}`,
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

    const mostrarToast = (msg, type = 'success') => {
        setNotificacion({ show: true, msg, type });
        setTimeout(() => setNotificacion({ show: false, msg: '', type: 'success' }), 5000);
    };

    // --- ACCIONES ---

    const handleManualEdit = async (attendanceId, workerId, field, newTime) => {
        if (!newTime) return;
        try {
            const [hours, minutes] = newTime.split(':');
            const ISOString = `${fechaFiltro}T${hours}:${minutes}:00`;
            const dateToSave = new Date(ISOString);

            await axios.patch(`${apiUrl}/api/attendance/editar`, {
                attendanceId, workerId, date: fechaFiltro, field, value: dateToSave.toISOString()
            });

            await cargarDatos(); 
            mostrarToast("Registro actualizado correctamente");
        } catch (err) {
            mostrarToast("Error al actualizar la hora", "error");
        }
    };

    // --- HANDLE SCAN CORREGIDO PARA LA FECHA SELECCIONADA ---
    const handleScan = async (codigo) => {
        if (!codigo || loading) return;
        setLoading(true);
        const idLimpio = codigo.trim();

        try {
            // ENVIAMOS LA fechaFiltro PARA QUE EL BACKEND REGISTRE EN EL DÍA CORRECTO
            const res = await axios.post(`${apiUrl}/api/attendance/registrar`, { 
                workerId: idLimpio,
                date: fechaFiltro 
            });
            
            new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3').play().catch(() => {});
            
            await cargarDatos();
            setIsScannerActive(false);

            const trabajador = asistencias.find(a => 
                String(a.customId) === idLimpio || String(a.dni) === idLimpio || String(a.id) === idLimpio
            );

            ejecutarEnfoque(trabajador ? trabajador.id : idLimpio, res.data.message);

        } catch (err) {
            const mensajeError = err.response?.data?.message || "Error al procesar QR";
            
            if (mensajeError.includes("ya tiene registradas entrada y salida")) {
                setIsScannerActive(false);
                const trabajador = asistencias.find(a => 
                    String(a.customId) === idLimpio || String(a.dni) === idLimpio || String(a.id) === idLimpio
                );
                ejecutarEnfoque(trabajador ? trabajador.id : idLimpio, "Consulta: Jornada ya completada 🔎");
            } else {
                mostrarToast(mensajeError, "error");
            }
        } finally {
            setLoading(false);
        }
    };

    const ejecutarEnfoque = (id, msg) => {
        setScannedId(id);
        mostrarToast(msg);
        setTimeout(() => {
            if (rowRefs.current[id]) {
                rowRefs.current[id].scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }, 300);
        setTimeout(() => setScannedId(null), 5000);
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
        XLSX.writeFile(wb, `Reporte_Asistencia_${fechaFiltro}.xlsx`);
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
            {notificacion.show && (
                <div style={{ ...st.toast, backgroundColor: notificacion.type === 'success' ? '#00a884' : '#e91e63' }}>
                    {notificacion.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                    {notificacion.msg}
                </div>
            )}

            <header style={st.header}>
                <h1 style={st.title}>Registro de Asistencia General 📋</h1>
                <p style={st.subtitle}>
                    {(isAdmin || isSuperAdmin) ? "Modo Administrador" : "Modo Personal"}
                </p>
            </header>

            <div style={st.scanSection}>
                <button 
                    onClick={() => setIsScannerActive(!isScannerActive)} 
                    style={st.btnScanner(isScannerActive)}
                    disabled={loading}
                >
                    <UserCheck size={22} />
                    {loading ? "PROCESANDO..." : isScannerActive ? "CERRAR CÁMARA" : "ESCANEAR QR"}
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
                        <label style={st.dateLabel}>FECHA SELECCIONADA:</label>
                        <input 
                            type="date" 
                            value={fechaFiltro} 
                            onChange={(e) => setFechaFiltro(e.target.value)} 
                            style={st.dateInput} 
                        />
                    </div>
                </div>

                {(isAdmin || isSuperAdmin) && (
                    <div style={st.buttonGroup}>
                        <button onClick={exportarExcel} style={st.btnExcel}><FileSpreadsheet size={18} /> Excel</button>
                        <button onClick={enviarResumenWhatsApp} style={st.btnWA}><Share2 size={18} /> WhatsApp</button>
                    </div>
                )}
            </div>

            <div style={st.tableWrapper}>
                <table style={st.table}>
                    <thead>
                        <tr style={st.thead}>
                            <th style={st.th}>Ref</th>
                            <th style={st.th}>Personal</th>
                            <th style={st.th}>Entrada</th>
                            <th style={st.th}>Salida</th>
                            <th style={st.th}>Horas</th>
                            <th style={st.th}>Estado</th>
                        </tr>
                    </thead>
                    <tbody>
                        {asistencias.map((a, index) => {
                            const esMiFila = String(a.id) === String(user?._id);
                            const estaSiendoEscaneado = String(a.id) === String(scannedId);
                            const puedeEditar = isAdmin || isSuperAdmin || esMiFila;

                            return (
                                <tr 
                                    key={`${a.id}-${fechaFiltro}`}
                                    ref={el => rowRefs.current[a.id] = el}
                                    style={{
                                        ...st.tr,
                                        backgroundColor: estaSiendoEscaneado ? 'rgba(0, 255, 163, 0.2)' : (esMiFila ? 'rgba(0, 255, 163, 0.08)' : 'transparent'),
                                        transform: estaSiendoEscaneado ? 'scale(1.02)' : 'scale(1)',
                                        borderLeft: (estaSiendoEscaneado || esMiFila) ? '4px solid #00ffa3' : '1px solid #222d34'
                                    }}
                                >
                                    <td style={st.tdNum}>{estaSiendoEscaneado ? '🎯' : (esMiFila ? <Star size={14} color="#00ffa3" fill="#00ffa3" /> : index + 1)}</td>
                                    <td style={st.tdName}>
                                        <div style={{ ...st.nameText, color: (estaSiendoEscaneado || esMiFila) ? '#00ffa3' : '#e9edef' }}>{a.fullName}</div>
                                        <div style={st.dniText}>DNI: {a.dni}</div>
                                    </td>
                                    <td style={st.tdTime}>
                                        <input type="time" 
                                        key={`in-${a.id}-${fechaFiltro}`}
                                        defaultValue={formatearHoraParaInput(a.checkIn)} onBlur={(e) => 
                                        handleManualEdit(a.attendanceId, a.id, 'checkIn', e.target.value)} 
                                        disabled={!puedeEditar}
                                         style={st.timeInput} />
                                    </td>
                                    <td style={st.tdTime}>
                                        <input type="time" 
                                        key={`out-${a.id}-${fechaFiltro}`}
                                        defaultValue={formatearHoraParaInput(a.checkOut)} onBlur={(e) => 
                                        handleManualEdit(a.attendanceId, a.id, 'checkOut', e.target.value)} 
                                        disabled={!puedeEditar} 
                                        style={st.timeInput} />
                                    </td>
                                    <td style={st.tdHours}><Clock size={14} style={{marginRight: '5px', color: '#00ffa3'}} />{a.totalHours.toFixed(1)} h</td>
                                    <td style={st.td}>
                                        {estaSiendoEscaneado ? <span style={st.badgeScanned}>OK</span> : (
                                            <>
                                                {a.status === 'PRESENTE' && <span style={st.badgePresente}>✅ PLANTA</span>}
                                                {a.status === 'COMPLETO' && <span style={st.badgeCompleto}>🏁 FIN</span>}
                                                {a.status === 'AUSENTE' && <span style={st.badgeAusente}>⏳ ---</span>}
                                            </>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const st = {
    container: { padding: '20px', backgroundColor: '#0b141a', minHeight: '100vh', color: 'white', fontFamily: 'Segoe UI, sans-serif' },
    toast: { position: 'fixed', top: '20px', right: '20px', padding: '15px 25px', borderRadius: '12px', color: 'white', display: 'flex', alignItems: 'center', gap: '12px', zIndex: 9999, fontWeight: 'bold', boxShadow: '0 8px 20px rgba(0,0,0,0.4)', transition: '0.3s' },
    header: { marginBottom: '25px', textAlign: 'center' },
    title: { color: '#00ffa3', fontSize: '24px', margin: 0, fontWeight: 'bold' },
    subtitle: { color: '#8696a0', fontSize: '13px', marginTop: '5px' },
    scanSection: { display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '25px' },
    btnScanner: (active) => ({ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 25px', fontSize: '15px', fontWeight: 'bold', color: 'white', cursor: 'pointer', backgroundColor: active ? '#ff2e5e' : '#00a884', border: 'none', borderRadius: '50px', transition: '0.3s' }),
    scannerContainer: { width: '100%', maxWidth: '380px', marginTop: '15px', borderRadius: '15px', overflow: 'hidden', border: '4px solid #00ffa3' },
    actionBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px', backgroundColor: '#111b21', padding: '15px 20px', borderRadius: '15px' },
    filterGroup: { display: 'flex', alignItems: 'center', gap: '15px' },
    dateBox: { display: 'flex', flexDirection: 'column', gap: '4px' },
    dateLabel: { fontSize: '10px', color: '#00ffa3', fontWeight: 'bold' },
    dateInput: { padding: '8px 12px', borderRadius: '8px', border: '1px solid #00ffa3', backgroundColor: '#202c33', color: 'white' },
    buttonGroup: { display: 'flex', gap: '10px' },
    btnExcel: { display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 15px', backgroundColor: '#1d6f42', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' },
    btnWA: { display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 15px', backgroundColor: '#25D366', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' },
    tableWrapper: { backgroundColor: '#111b21', borderRadius: '15px', overflowX: 'auto' },
    table: { width: '100%', borderCollapse: 'collapse', minWidth: '800px' },
    thead: { backgroundColor: '#202c33' },
    th: { padding: '15px', color: '#8696a0', fontSize: '11px', textTransform: 'uppercase' },
    tr: { transition: '0.3s' },
    td: { padding: '12px', textAlign: 'center' },
    tdNum: { color: '#8696a0', fontSize: '12px' },
    tdName: { padding: '12px' },
    nameText: { fontWeight: '600' },
    dniText: { fontSize: '11px', color: '#8696a0' },
    tdTime: { padding: '8px' },
    timeInput: { backgroundColor: '#2a3942', border: '1px solid #3b4a54', color: '#00ffa3', padding: '6px', borderRadius: '6px', width: '90px', textAlign: 'center' },
    tdHours: { fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    badgePresente: { backgroundColor: 'rgba(0,255,163,0.1)', color: '#00ffa3', padding: '5px 10px', borderRadius: '6px', fontSize: '11px' },
    badgeCompleto: { backgroundColor: 'rgba(52,183,241,0.1)', color: '#34b7f1', padding: '5px 10px', borderRadius: '6px', fontSize: '11px' },
    badgeAusente: { color: '#616d73', fontSize: '11px' },
    badgeScanned: { backgroundColor: '#00ffa3', color: '#0b141a', padding: '5px 12px', borderRadius: '50px', fontWeight: 'bold' }
};

export default AttendancePage;