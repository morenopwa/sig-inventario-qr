import React, { useState, useEffect } from 'react';
import axios from 'axios';
import useAuth from '../hooks/useAuth';
import { ChevronDown, ChevronUp, Calendar, Clock, DollarSign, Users, AlertCircle } from 'lucide-react';

const apiUrl = import.meta.env.VITE_API_URL;

const PagosPage = () => {
    const { isAdmin, isSuperAdmin } = useAuth();
    const [payrollData, setPayrollData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterMonth, setFilterMonth] = useState(new Date().toISOString().slice(0, 7));
    const [expandedWorker, setExpandedWorker] = useState(null);

    const fetchPayroll = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${apiUrl}/api/attendance/payroll-report?month=${filterMonth}`);
            setPayrollData(res.data);
        } catch (error) {
            console.error("Error al obtener pagos:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isAdmin || isSuperAdmin) fetchPayroll();
    }, [filterMonth]);

    // Lógica para agrupar detalles diarios por semanas del mes
    const getGroupedByWeeks = (details) => {
        const weeks = {};
        details.forEach(day => {
            const date = new Date(day.date + "T12:00:00");
            const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
            const dayOfMonth = date.getDate();
            // Cálculo simple de número de semana en el mes
            const weekNum = Math.ceil((dayOfMonth + firstDayOfMonth.getDay()) / 7);
            
            if (!weeks[weekNum]) weeks[weekNum] = { days: [], total: 0 };
            weeks[weekNum].days.push(day);
            weeks[weekNum].total += day.hours;
        });
        return weeks;
    };

    const handleAdjustHours = async (attendanceId, dayLabel) => {
        const newHours = window.prompt(`Ajustar horas para ${dayLabel}:`, "8");
        if (newHours !== null && !isNaN(newHours) && newHours.trim() !== "") {
            try {
                await axios.patch(`${apiUrl}/api/attendance/update-hours/${attendanceId}`, {
                    manualHours: parseFloat(newHours)
                });
                fetchPayroll();
            } catch (e) {
                alert("Error al actualizar");
            }
        }
    };

    if (!isAdmin && !isSuperAdmin) {
        return (
            <div style={s.centerBox}>
                <AlertCircle size={48} color="#ff5555" />
                <h3 style={{marginTop: '15px'}}>Acceso Denegado</h3>
                <p style={{color: '#8696a0'}}>Solo administradores pueden ver la planilla.</p>
            </div>
        );
    }

    const totalPlanilla = payrollData.reduce((acc, p) => acc + (p.totalHours * (p.hourlyRate || 0)), 0);

    return (
        <div style={s.container}>
            <header style={s.header}>
                <div>
                    <h2 style={s.title}>Gestión de Planilla 💸</h2>
                    <p style={s.subtitle}>Reporte mensual y acumulado semanal</p>
                </div>
                <div style={s.filterGroup}>
                    <Calendar size={18} color="#00ffa3" />
                    <input 
                        type="month" 
                        value={filterMonth} 
                        onChange={(e) => setFilterMonth(e.target.value)} 
                        style={s.dateInput}
                    />
                </div>
            </header>

            <div style={s.statsGrid}>
                <div style={s.statCard}>
                    <div style={s.statIcon}><DollarSign size={20} color="#00ffa3"/></div>
                    <div>
                        <span style={s.statLabel}>PRESUPUESTO MES</span>
                        <div style={s.statValue}>S/ {totalPlanilla.toLocaleString(undefined, {minimumFractionDigits: 2})}</div>
                    </div>
                </div>
                <div style={s.statCard}>
                    <div style={s.statIcon}><Users size={20} color="#34b7f1"/></div>
                    <div>
                        <span style={s.statLabel}>PERSONAL ACTIVO</span>
                        <div style={s.statValue}>{payrollData.length} Operarios</div>
                    </div>
                </div>
            </div>

            {loading ? (
                <div style={s.loader}>Calculando planilla...</div>
            ) : (
                <div style={s.tableCard}>
                    <table style={s.table}>
                        <thead>
                            <tr style={s.thr}>
                                <th style={s.th}>Trabajador / Cargo</th>
                                <th style={s.th}>Total Horas</th>
                                <th style={s.th}>Total a Pagar</th>
                                <th style={s.th}>Detalle</th>
                            </tr>
                        </thead>
                        <tbody>
                            {payrollData.length === 0 ? (
                                <tr><td colSpan="4" style={s.tdCenter}>No hay registros de asistencia este mes.</td></tr>
                            ) : (
                                payrollData.map((p) => {
                                    const groupedWeeks = getGroupedByWeeks(p.dailyDetails);
                                    return (
                                        <React.Fragment key={p._id}>
                                            <tr style={s.tr} onClick={() => setExpandedWorker(expandedWorker === p._id ? null : p._id)}>
                                                <td style={s.td}>
                                                    <div style={s.workerName}>{p.lastName}, {p.name}</div>
                                                    <div style={s.roleLabel}>{p.role} • S/ {p.hourlyRate}/h</div>
                                                </td>
                                                <td style={s.td}>
                                                    <div style={s.hoursBadge}>{p.totalHours.toFixed(1)} hrs</div>
                                                    <div style={s.daysLabel}>{p.daysCount} días trabajados</div>
                                                </td>
                                                <td style={s.tdAmount}>
                                                    S/ {(p.totalHours * p.hourlyRate).toLocaleString(undefined, {minimumFractionDigits: 2})}
                                                </td>
                                                <td style={s.td}>
                                                    {expandedWorker === p._id ? <ChevronUp color="#8696a0"/> : <ChevronDown color="#8696a0"/>}
                                                </td>
                                            </tr>
                                            
                                            {expandedWorker === p._id && (
                                                <tr>
                                                    <td colSpan="4" style={s.detailCell}>
                                                        {Object.entries(groupedWeeks).map(([weekNum, data]) => (
                                                            <div key={weekNum} style={s.weekContainer}>
                                                                <div style={s.weekHeader}>
                                                                    <span>SEMANA {weekNum}</span>
                                                                    <span style={s.weekTotal}>Subtotal: S/ {(data.total * p.hourlyRate).toFixed(2)}</span>
                                                                </div>
                                                                <div style={s.daysGrid}>
                                                                    {data.days.map((day, idx) => (
                                                                        <div key={idx} style={s.dayItem}>
                                                                            <div style={s.dayInfo}>
                                                                                <span style={s.dayText}>{day.dayName}</span>
                                                                                <span style={s.dayHours}>{day.hours}h {day.isManual && '✎'}</span>
                                                                            </div>
                                                                            <button 
                                                                                onClick={(e) => { e.stopPropagation(); handleAdjustHours(day.attendanceId, day.dayName); }}
                                                                                style={s.adjustBtn}
                                                                            >Ajustar</button>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

const s = {
    container: { padding: '25px', backgroundColor: '#0b141a', minHeight: '100vh', color: '#e9edef' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' },
    title: { fontSize: '22px', margin: 0, color: '#00ffa3' },
    subtitle: { color: '#8696a0', fontSize: '13px', margin: 0 },
    filterGroup: { display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#111b21', padding: '8px 15px', borderRadius: '10px', border: '1px solid #2a3942' },
    dateInput: { backgroundColor: 'transparent', color: 'white', border: 'none', outline: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' },
    statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '25px' },
    statCard: { backgroundColor: '#111b21', padding: '20px', borderRadius: '15px', border: '1px solid #2a3942', display: 'flex', gap: '15px', alignItems: 'center' },
    statIcon: { backgroundColor: 'rgba(255,255,255,0.05)', padding: '10px', borderRadius: '12px' },
    statLabel: { color: '#8696a0', fontSize: '10px', fontWeight: 'bold', letterSpacing: '1px' },
    statValue: { fontSize: '20px', fontWeight: 'bold' },
    tableCard: { backgroundColor: '#111b21', borderRadius: '15px', border: '1px solid #2a3942', overflow: 'hidden' },
    table: { width: '100%', borderCollapse: 'collapse' },
    thr: { backgroundColor: '#202c33' },
    th: { padding: '15px', color: '#8696a0', textAlign: 'left', fontSize: '11px', textTransform: 'uppercase' },
    tr: { cursor: 'pointer', borderBottom: '1px solid #222d34' },
    td: { padding: '15px', verticalAlign: 'middle' },
    tdCenter: { padding: '40px', textAlign: 'center', color: '#8696a0' },
    workerName: { fontWeight: 'bold', fontSize: '15px' },
    roleLabel: { fontSize: '12px', color: '#8696a0', marginTop: '3px' },
    hoursBadge: { backgroundColor: '#2a3942', color: '#e9edef', padding: '4px 10px', borderRadius: '6px', display: 'inline-block', fontSize: '13px', fontWeight: 'bold' },
    daysLabel: { fontSize: '11px', color: '#8696a0', marginTop: '5px' },
    tdAmount: { padding: '15px', color: '#00ffa3', fontWeight: 'bold', fontSize: '16px' },
    detailCell: { backgroundColor: '#0b141a', padding: '20px' },
    
    // Estilos de agrupación por semana
    weekContainer: { marginBottom: '20px', backgroundColor: '#111b21', borderRadius: '12px', border: '1px solid #2a3942', overflow: 'hidden' },
    weekHeader: { backgroundColor: '#202c33', padding: '10px 15px', display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 'bold', color: '#34b7f1' },
    weekTotal: { color: '#00ffa3' },
    daysGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '10px', padding: '15px' },
    dayItem: { backgroundColor: '#2a3942', padding: '10px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '8px' },
    dayInfo: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    dayText: { fontSize: '12px', textTransform: 'capitalize' },
    dayHours: { fontSize: '12px', fontWeight: 'bold' },
    adjustBtn: { backgroundColor: '#0b141a', border: '1px solid #3b4a54', color: '#34b7f1', padding: '5px', borderRadius: '5px', cursor: 'pointer', fontSize: '10px' },
    
    loader: { textAlign: 'center', padding: '100px', color: '#00ffa3', fontSize: '18px' },
    centerBox: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80vh' }
};

export default PagosPage;