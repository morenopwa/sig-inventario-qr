import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom'; // IMPORTANTE
import axios from 'axios';
import { 
    format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, 
    isSameDay, isWednesday, getDay, subDays, isAfter, isBefore, startOfDay
} from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Wallet, TrendingUp, AlertCircle, User as UserIcon } from 'lucide-react';
import useAuth from '../hooks/useAuth';

const UserPaymentsPage = () => {
    const { id: paramId } = useParams(); // ID que viene por la URL (si es admin)
    const { user: authUser } = useAuth();
    
    // El ID objetivo es el de la URL o, en su defecto, el del usuario logueado
    const targetUserId = paramId || authUser?._id || authUser?.id;

    const [fullProfile, setFullProfile] = useState(null);
    const [attendance, setAttendance] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentDate, setCurrentDate] = useState(new Date());
    const apiUrl = import.meta.env.VITE_API_URL;

    const rate = fullProfile?.hourlyRate || 0;
    const extraRate = rate * 1.25;

    // ... (Mantener funciones aplicarReglasHorarias y calcularDiferenciaHoras igual que antes) ...
    const aplicarReglasHorarias = (isoString, tipo) => {
        if (!isoString) return null;
        const date = new Date(isoString);
        const hours = date.getHours();
        if (tipo === 'IN' && hours < 8) date.setHours(8, 0, 0, 0);
        else if (tipo === 'OUT' && date.getMinutes() >= 55) date.setHours(hours + 1, 0, 0, 0);
        return date;
    };

    const calcularDiferenciaHoras = (entrada, salida) => {
        if (!entrada || !salida) return 0;
        const bruto = (new Date(salida) - new Date(entrada)) / (1000 * 60 * 60);
        const neto = bruto > 5 ? bruto - 1 : bruto; 
        return Math.max(0, neto);
    };

    useEffect(() => {
        const loadData = async () => {
            if (!targetUserId) return;
            try {
                setLoading(true);
                const [resUsers, resAtt] = await Promise.all([
                    axios.get(`${apiUrl}/api/users`),
                    axios.get(`${apiUrl}/api/attendance/worker/${targetUserId}`)
                ]);
                const profile = resUsers.data.find(u => u._id === targetUserId);
                setFullProfile(profile);
                setAttendance(resAtt.data || []);
            } catch (error) { console.error(error); } 
            finally { setLoading(false); }
        };
        loadData();
    }, [targetUserId, apiUrl]);

    const stats = useMemo(() => {
        // ... (Mantener toda la lógica del useMemo exactamente igual que la versión anterior) ...
        const hoy = startOfDay(new Date());
        const diaSemana = getDay(hoy);
        let fechaRef = hoy;
        if (diaSemana >= 4 && diaSemana <= 6) fechaRef = subDays(hoy, 3);
        let inicioCicloResumen = startOfDay(fechaRef);
        while (getDay(inicioCicloResumen) !== 4) inicioCicloResumen = subDays(inicioCicloResumen, 1);
        const finCicloResumen = startOfDay(new Date(inicioCicloResumen));
        finCicloResumen.setDate(finCicloResumen.getDate() + 6);
        const viewMonthStart = startOfMonth(currentDate);
        const viewMonthEnd = endOfMonth(currentDate);
        let displayStart = viewMonthStart;
        while (getDay(displayStart) !== 4) displayStart = subDays(displayStart, 1);
        const allDays = eachDayOfInterval({ start: displayStart, end: viewMonthEnd });
        let montoResumenCard = 0;
        let deudaTotalHoras = 0;

        const days = allDays.map(day => {
            const marca = attendance.find(a => isSameDay(parseISO(a.date), day));
            let nH = 0, eH = 0, nPay = 0, ePay = 0, dayTotal = 0, debtH = 0;
            if (marca) {
                const totalH = marca.manualHours ?? calcularDiferenciaHoras(
                    aplicarReglasHorarias(marca.checkIn, 'IN'),
                    aplicarReglasHorarias(marca.checkOut, 'OUT')
                );
                nH = Math.min(totalH, 8);
                eH = Math.max(0, totalH - 8);
                debtH = totalH < 8 ? 8 - totalH : 0;
                nPay = nH * rate;
                ePay = eH * extraRate;
                dayTotal = nPay + ePay;
                const d = startOfDay(day);
                if (!isBefore(d, inicioCicloResumen) && !isAfter(d, finCicloResumen)) {
                    montoResumenCard += dayTotal;
                    deudaTotalHoras += debtH;
                }
            }
            return { date: day, nH, eH, debtH, nPay, ePay, dayTotal, hasRecord: !!marca, isOtherMonth: day.getMonth() !== currentDate.getMonth() };
        });

        return { days, montoResumenCard, deudaTotalHoras, rangoResumen: `${format(inicioCicloResumen, 'dd/MM')} al ${format(finCicloResumen, 'dd/MM')}` };
    }, [currentDate, attendance, rate, extraRate]);

    if (loading) return <div style={ss.loading}>Cargando información...</div>;

    return (
        <div style={ss.container}>
            {/* ENCABEZADO PARA ADMIN */}
            {paramId && (
                <div style={ss.adminHeader}>
                    <UserIcon size={20} color="#34b7f1" />
                    <span style={ss.adminTitle}>Viendo Planilla de: **{fullProfile?.name} {fullProfile?.lastName}**</span>
                </div>
            )}

            <div style={ss.topRow}>
                {/* ... (Las 3 tarjetas superiores Wallet, TrendingUp, AlertCircle se mantienen igual) ... */}
                <div style={ss.summaryCard}>
                    <Wallet size={16} color="#00ffa3" />
                    <div>
                        <span style={ss.label}>POR COBRAR ({stats.rangoResumen})</span>
                        <div style={ss.val}>S/ {stats.montoResumenCard.toFixed(2)}</div>
                    </div>
                </div>
                <div style={ss.summaryCard}>
                    <TrendingUp size={16} color="#34b7f1" />
                    <div>
                        <span style={ss.label}>TARIFA ACTUAL</span>
                        <div style={ss.val}>S/ {rate.toFixed(2)} /h</div>
                    </div>
                </div>
                <div style={{...ss.summaryCard, borderLeft: '3px solid #ff4d4d'}}>
                    <AlertCircle size={16} color="#ff4d4d" />
                    <div>
                        <span style={ss.label}>DEUDA CICLO</span>
                        <div style={{...ss.val, color: '#ff4d4d'}}>{stats.deudaTotalHoras.toFixed(1)}h</div>
                    </div>
                </div>
            </div>

            {/* ... (El resto del render: monthNav y tabla, se mantienen igual) ... */}
            <div style={ss.monthNav}>
                <button onClick={() => setCurrentDate(subDays(startOfMonth(currentDate), 1))} style={ss.navBtn}><ChevronLeft /></button>
                <span style={ss.monthName}>{format(currentDate, 'MMMM yyyy', { locale: es })}</span>
                <button onClick={() => setCurrentDate(startOfMonth(new Date(currentDate.setMonth(currentDate.getMonth() + 1))))} style={ss.navBtn}><ChevronRight /></button>
            </div>

            <div style={ss.cardWrapper}>
                <table style={ss.table}>
                    <thead>
                        <tr>
                            <th style={ss.th}>FECHA</th>
                            <th style={ss.th}>NORMALES</th>
                            <th style={ss.th}>EXTRAS</th>
                            <th style={ss.th}>DEUDA</th>
                            <th style={{...ss.th, textAlign: 'right'}}>SUBTOTAL</th>
                        </tr>
                    </thead>
                    <tbody>
                        {stats.days.map((d, i) => (
                            <tr key={i} style={{...ss.tr, opacity: d.hasRecord ? 1 : 0.35}}>
                                <td style={ss.td}>
                                    <div style={ss.dateBox}>
                                        <span style={{...ss.dNum, color: d.isOtherMonth ? '#34b7f1' : '#fff'}}>{format(d.date, 'dd')}</span>
                                        <span style={ss.dName}>{format(d.date, 'eee', { locale: es })}</span>
                                    </div>
                                </td>
                                <td style={ss.td}>
                                    <div style={ss.cellCol}>
                                        <span style={ss.hNormal}>{d.nH.toFixed(1)}h</span>
                                        <span style={ss.moneySub}>S/ {d.nPay.toFixed(2)}</span>
                                    </div>
                                </td>
                                <td style={ss.td}>
                                    <div style={ss.cellCol}>
                                        <span style={ss.hExtra}>{d.eH > 0 ? `${d.eH.toFixed(1)}h` : '-'}</span>
                                        <span style={ss.moneySub}>{d.eH > 0 ? `S/ ${d.ePay.toFixed(2)}` : '-'}</span>
                                    </div>
                                </td>
                                <td style={ss.td}>
                                    {d.debtH > 0 ? (
                                        <span style={ss.debtText}>-{d.debtH.toFixed(1)}h</span>
                                    ) : d.hasRecord ? (
                                        <span style={{color: '#00ffa3', fontSize: '9px', fontWeight: 'bold'}}>OK</span>
                                    ) : '-'}
                                </td>
                                <td style={{...ss.td, textAlign: 'right'}}>
                                    <span style={ss.dayPay}>S/ {d.dayTotal.toFixed(2)}</span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// Agregar este estilo al objeto ss
const ss = {
    // ... los estilos anteriores ...
    adminHeader: {
        backgroundColor: '#1a2429',
        padding: '12px',
        borderRadius: '10px',
        marginBottom: '15px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        border: '1px solid #34b7f1'
    },
    adminTitle: {
        fontSize: '14px',
        fontWeight: 'bold',
        color: '#e9edef'
    },
   container: { padding: '16px', backgroundColor: '#0b141a', minHeight: '100vh', color: '#e9edef', fontFamily: 'sans-serif' },
    topRow: { display: 'flex', gap: '8px', marginBottom: '16px', overflowX: 'auto', paddingBottom: '5px' },
    summaryCard: { minWidth: '120px', flex: 1, backgroundColor: '#111b21', padding: '10px', borderRadius: '12px', border: '1px solid #2a3942', display: 'flex', alignItems: 'center', gap: '8px' },
    label: { fontSize: '7.5px', color: '#8696a0', fontWeight: 'bold', display: 'block', textTransform: 'uppercase' },
    val: { fontSize: '13px', fontWeight: 'bold' },
    monthNav: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#202c33', padding: '8px', borderRadius: '10px', marginBottom: '12px' },
    monthName: { textTransform: 'capitalize', fontWeight: 'bold', fontSize: '13px', color: '#00ffa3' },
    navBtn: { background: 'none', border: 'none', color: '#8696a0' },
    cardWrapper: { backgroundColor: '#111b21', borderRadius: '16px', border: '1px solid #2a3942', overflowX: 'auto' },
    table: { width: '100%', borderCollapse: 'collapse', minWidth: '500px' },
    th: { padding: '12px', textAlign: 'left', color: '#8696a0', fontSize: '9px', backgroundColor: '#1a2429', textTransform: 'uppercase' },
    td: { padding: '12px', borderBottom: '1px solid #222d34' },
    tr: { transition: '0.2s' },
    dateBox: { display: 'flex', flexDirection: 'column', alignItems: 'center' },
    dNum: { fontSize: '16px', fontWeight: 'bold' },
    dName: { fontSize: '10px', color: '#8696a0', textTransform: 'uppercase' },
    cellCol: { display: 'flex', flexDirection: 'column' },
    hNormal: { color: '#34b7f1', fontWeight: 'bold', fontSize: '13px' },
    hExtra: { color: '#ffbc00', fontWeight: 'bold', fontSize: '13px' },
    moneySub: { fontSize: '10px', color: '#8696a0' },
    debtText: { color: '#ff4d4d', fontWeight: 'bold', fontSize: '13px' },
    dayPay: { color: '#00ffa3', fontWeight: 'bold', fontSize: '14px' },
    loading: { height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#0b141a', color: '#00ffa3' }

};

export default UserPaymentsPage;