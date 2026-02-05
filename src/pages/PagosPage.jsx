import React, { useState, useEffect } from 'react';
import axios from 'axios';
import useAuth from '../hooks/useAuth';
import { ChevronDown, ChevronUp, Calendar, Clock, DollarSign, Users } from 'lucide-react';

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

    const handleAdjustHours = async (attendanceId, dayLabel) => {
        const newHours = window.prompt(`Ajustar horas para ${dayLabel}:`, "8");
        if (newHours !== null && !isNaN(newHours)) {
            try {
                await axios.patch(`${apiUrl}/api/attendance/update-hours/${attendanceId}`, {
                    manualHours: parseFloat(newHours)
                });
                    console.log(newHours);
                    console.log(manualHours);
                fetchPayroll();
            } catch (e) {
                alert("No se pudo actualizar");
            }
        }
    };

    if (!isAdmin && !isSuperAdmin) return <div style={s.errorMsg}>Acceso denegado.</div>;

    const totalPlanilla = payrollData.reduce((acc, p) => acc + (p.totalHours * p.hourlyRate), 0);

    return (
        <div style={s.container}>
            <header style={s.header}>
                <div>
                    <h2 style={s.title}>Cálculo de Planilla 💸</h2>
                    <p style={s.subtitle}>Gestión de horas y sueldos</p>
                </div>
                <input 
                    type="month" 
                    value={filterMonth} 
                    onChange={(e) => setFilterMonth(e.target.value)} 
                    style={s.dateInput}
                />
            </header>

            <div style={s.statsGrid}>
                <div style={s.statCard}>
                    <div style={s.statIcon}><DollarSign size={20} color="#00ffa3"/></div>
                    <div>
                        <span style={s.statLabel}>Total Mes</span>
                        <div style={s.statValue}>S/ {totalPlanilla.toLocaleString()}</div>
                    </div>
                </div>
                <div style={s.statCard}>
                    <div style={s.statIcon}><Users size={20} color="#34b7f1"/></div>
                    <div>
                        <span style={s.statLabel}>Personal</span>
                        <div style={s.statValue}>{payrollData.length} operarios</div>
                    </div>
                </div>
            </div>

            {loading ? (
                <div style={s.loader}>Calculando...</div>
            ) : (
                <div style={s.tableCard}>
                    <table style={s.table}>
                        <thead>
                            <tr style={s.thr}>
                                <th style={s.th}>Trabajador</th>
                                <th style={s.th}>Días</th>
                                <th style={s.th}>Horas Totales</th>
                                <th style={s.th}>Sueldo</th>
                                <th style={s.th}>Acción</th>
                            </tr>
                        </thead>
                        <tbody>
                            {payrollData.length === 0 ? (
                                <tr><td colSpan="5" style={s.td}>Sin datos en este periodo.</td></tr>
                            ) : (
                                payrollData.map((p) => (
                                    <React.Fragment key={p._id}>
                                        <tr style={s.tr} onClick={() => setExpandedWorker(expandedWorker === p._id ? null : p._id)}>
                                            <td style={s.td}>
                                                <strong>{p.name} {p.lastName}</strong>
                                                <div style={s.roleLabel}>{p.role} (S/ {p.hourlyRate}/hr)</div>
                                            </td>
                                            <td style={s.td}>{p.daysCount} d</td>
                                            <td style={s.td}>{p.totalHours.toFixed(1)} hrs</td>
                                            <td style={{...s.td, color: '#00ffa3', fontWeight: 'bold'}}>
                                                S/ {(p.totalHours * p.hourlyRate).toLocaleString(undefined, {minimumFractionDigits: 2})}
                                                 {(console.log(p.hourlyRate))}
                                            </td>
                                            <td style={s.td}>
                                                {expandedWorker === p._id ? <ChevronUp size={18}/> : <ChevronDown size={18}/>}
                                            </td>
                                        </tr>
                                        {expandedWorker === p._id && (
                                            <tr>
                                                <td colSpan="5" style={s.detailCell}>
                                                    <div style={s.detailBox}>
                                                        {p.dailyDetails.map((day, idx) => (
                                                            <div key={idx} style={s.dayRow}>
                                                                <span style={s.dayName}>{day.dayName}</span>
                                                                <span style={{...s.dayHours, color: day.isManual ? '#34b7f1' : '#e9edef'}}>
                                                                    {day.hours} hrs {day.isManual && '✎'}
                                                                </span>
                                                                <span style={s.dayAmount}>S/ {(day.hours * p.hourlyRate).toFixed(2)}</span>
                                                                <button 
                                                                    onClick={(e) => { e.stopPropagation(); handleAdjustHours(day.attendanceId, day.dayName); }}
                                                                    style={s.adjustBtn}
                                                                >
                                                                    Ajustar
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

const s = {
    container: { padding: '20px', backgroundColor: '#0b141a', minHeight: '100vh', color: '#e9edef' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
    title: { fontSize: '20px', margin: 0 },
    subtitle: { color: '#8696a0', fontSize: '13px', margin: 0 },
    dateInput: { backgroundColor: '#2a3942', color: 'white', border: 'none', padding: '10px', borderRadius: '8px', outline: 'none' },
    statsGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' },
    statCard: { backgroundColor: '#111b21', padding: '15px', borderRadius: '12px', border: '1px solid #2a3942', display: 'flex', gap: '12px', alignItems: 'center' },
    statLabel: { color: '#8696a0', fontSize: '11px', textTransform: 'uppercase' },
    statValue: { fontSize: '18px', fontWeight: 'bold' },
    tableCard: { backgroundColor: '#111b21', borderRadius: '12px', border: '1px solid #2a3942', overflow: 'hidden' },
    table: { width: '100%', borderCollapse: 'collapse' },
    thr: { backgroundColor: '#202c33' },
    th: { padding: '12px', color: '#8696a0', textAlign: 'left', fontSize: '12px' },
    td: { padding: '15px', borderBottom: '1px solid #222d34', fontSize: '14px' },
    tr: { cursor: 'pointer' },
    roleLabel: { fontSize: '11px', color: '#8696a0' },
    detailCell: { backgroundColor: '#0b141a', padding: '0 15px 15px 15px' },
    detailBox: { backgroundColor: '#202c33', borderRadius: '8px', padding: '10px' },
    dayRow: { display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #2a3942', fontSize: '13px', alignItems: 'center' },
    dayName: { flex: 1, textTransform: 'capitalize' },
    dayHours: { flex: 1, textAlign: 'center' },
    dayAmount: { flex: 1, textAlign: 'right', fontWeight: 'bold', color: '#00ffa3', marginRight: '10px' },
    adjustBtn: { backgroundColor: '#2a3942', border: '1px solid #3b4a54', color: '#34b7f1', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' },
    loader: { textAlign: 'center', marginTop: '50px', color: '#00ffa3' },
    errorMsg: { color: '#ff5555', textAlign: 'center', padding: '50px' }
};

export default PagosPage;