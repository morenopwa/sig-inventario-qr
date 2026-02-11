import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { Wallet, Clock, Calendar as CalendarIcon, ChevronLeft, ChevronRight, TrendingUp } from 'lucide-react';
import useAuth from '../hooks/useAuth';

const UserPaymentsPage = () => {
    const { user } = useAuth();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [attendance, setAttendance] = useState([]);
    const [loading, setLoading] = useState(true);
    const apiUrl = import.meta.env.VITE_API_URL;

    // Configuración de Pago (Viene del modelo User)
    const hourlyRate = user?.hourlyRate || 0;

    useEffect(() => {
        const fetchAttendance = async () => {
            if (!user?.id && !user?._id) return;
            try {
                setLoading(true);
                const userId = user.id || user._id;
                const res = await axios.get(`${apiUrl}/api/attendance/user/${userId}`);
                setAttendance(res.data || []);
            } catch (e) {
                console.error("Error al cargar asistencia:", e);
            } finally {
                setLoading(false);
            }
        };
        fetchAttendance();
    }, [user, apiUrl]);

    // Lógica de Ciclos y Cálculos
    const stats = useMemo(() => {
        const start = startOfMonth(currentDate);
        const end = endOfMonth(currentDate);
        const days = eachDayOfInterval({ start, end });

        let totalHours = 0;
        const processedDays = days.map(day => {
            const record = attendance.find(a => isSameDay(parseISO(a.date), day));
            const hours = record?.totalHours || 0;
            totalHours += hours;

            return {
                date: day,
                hours: hours,
                isClosed: day.getDate() <= 15, // Ejemplo: Ciclo 1 (1-15), Ciclo 2 (16-fin)
                hasRecord: !!record
            };
        });

        return {
            days: processedDays,
            totalHours,
            totalAmount: totalHours * hourlyRate,
            firstPeriodHours: processedDays.filter(d => d.isClosed).reduce((acc, d) => acc + d.hours, 0),
            secondPeriodHours: processedDays.filter(d => !d.isClosed).reduce((acc, d) => acc + d.hours, 0)
        };
    }, [currentDate, attendance, hourlyRate]);

    if (loading) return <div style={ss.loading}>Calculando planilla...</div>;

    return (
        <div style={ss.container}>
            <header style={ss.header}>
                <h2 style={ss.title}>💰 Mis Pagos</h2>
                <div style={ss.rateBadge}>Tarifa: S/ {hourlyRate.toFixed(2)} / hr</div>
            </header>

            {/* Resumen de Ganancias */}
            <div style={ss.summaryGrid}>
                <div style={ss.statCard}>
                    <Clock size={20} color="#00ffa3" />
                    <div>
                        <span style={ss.statLabel}>Total Horas</span>
                        <span style={ss.statValue}>{stats.totalHours.toFixed(1)}h</span>
                    </div>
                </div>
                <div style={{ ...ss.statCard, borderLeft: '4px solid #00ffa3' }}>
                    <Wallet size={20} color="#00ffa3" />
                    <div>
                        <span style={ss.statLabel}>Monto Estimado</span>
                        <span style={ss.statValue}>S/ {stats.totalAmount.toFixed(2)}</span>
                    </div>
                </div>
            </div>

            {/* Selector de Mes */}
            <div style={ss.monthSelector}>
                <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))} style={ss.navBtn}><ChevronLeft /></button>
                <span style={ss.monthName}>{format(currentDate, 'MMMM yyyy', { locale: es })}</span>
                <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))} style={ss.navBtn}><ChevronRight /></button>
            </div>

            {/* Tabla de Detalle */}
            <div style={ss.tableWrapper}>
                <table style={ss.table}>
                    <thead>
                        <tr>
                            <th style={ss.th}>FECHA</th>
                            <th style={ss.th}>CICLO</th>
                            <th style={ss.th}>HORAS</th>
                            <th style={ss.th}>SUBTOTAL</th>
                        </tr>
                    </thead>
                    <tbody>
                        {stats.days.map((d, i) => (
                            <tr key={i} style={{ ...ss.tr, opacity: d.hasRecord ? 1 : 0.4 }}>
                                <td style={ss.td}>
                                    <div style={ss.dateCol}>
                                        <span style={ss.dayNum}>{format(d.date, 'dd')}</span>
                                        <span style={ss.dayName}>{format(d.date, 'EEE', { locale: es })}</span>
                                    </div>
                                </td>
                                <td style={ss.td}>
                                    <span style={d.isClosed ? ss.badge1 : ss.badge2}>
                                        {d.isClosed ? '1er Ciclo' : '2do Ciclo'}
                                    </span>
                                </td>
                                <td style={ss.td}>
                                    <span style={ss.hoursText}>{d.hours > 0 ? `${d.hours}h` : '--'}</span>
                                </td>
                                <td style={{ ...ss.td, textAlign: 'right', fontWeight: 'bold', color: '#00ffa3' }}>
                                    {d.hours > 0 ? `S/ ${(d.hours * hourlyRate).toFixed(2)}` : '-'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const ss = {
    container: { padding: '20px', backgroundColor: '#0b141a', minHeight: '100vh', color: '#e9edef' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
    title: { color: '#e9edef', fontSize: '22px', margin: 0 },
    rateBadge: { backgroundColor: '#1a3d2e', color: '#00ffa3', padding: '5px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' },
    summaryGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' },
    statCard: { backgroundColor: '#111b21', padding: '15px', borderRadius: '12px', border: '1px solid #2a3942', display: 'flex', alignItems: 'center', gap: '12px' },
    statLabel: { display: 'block', color: '#8696a0', fontSize: '11px', textTransform: 'uppercase' },
    statValue: { display: 'block', color: '#e9edef', fontSize: '18px', fontWeight: 'bold' },
    monthSelector: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', backgroundColor: '#202c33', padding: '10px', borderRadius: '8px' },
    monthName: { textTransform: 'capitalize', fontWeight: 'bold', color: '#00ffa3' },
    navBtn: { background: 'none', border: 'none', color: '#8696a0', cursor: 'pointer' },
    tableWrapper: { backgroundColor: '#111b21', borderRadius: '12px', border: '1px solid #2a3942', overflow: 'hidden' },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: { padding: '12px', textAlign: 'left', backgroundColor: '#202c33', color: '#8696a0', fontSize: '10px', fontWeight: 'bold' },
    td: { padding: '12px', borderBottom: '1px solid #222d34' },
    tr: { transition: 'background 0.2s' },
    dateCol: { display: 'flex', alignItems: 'baseline', gap: '5px' },
    dayNum: { fontSize: '16px', fontWeight: 'bold', color: '#e9edef' },
    dayName: { fontSize: '12px', color: '#8696a0', textTransform: 'capitalize' },
    badge1: { fontSize: '10px', backgroundColor: '#054740', color: '#00ffa3', padding: '2px 6px', borderRadius: '4px' },
    badge2: { fontSize: '10px', backgroundColor: '#3d3005', color: '#ffbc00', padding: '2px 6px', borderRadius: '4px' },
    hoursText: { fontSize: '14px', color: '#34b7f1' },
    loading: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#0b141a', color: '#00ffa3' }
};

export default UserPaymentsPage;