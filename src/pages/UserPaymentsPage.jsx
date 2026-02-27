import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { 
    format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, 
    isSameDay, getDay, subDays, isAfter, isBefore, startOfDay, isSunday, addDays
} from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Wallet, TrendingUp, User as UserIcon, Save, Edit2, Gift } from 'lucide-react';
import useAuth from '../hooks/useAuth';

const UserPaymentsPage = () => {
    const { id: paramId } = useParams();
    const { user: authUser } = useAuth();
    const targetUserId = paramId || authUser?._id || authUser?.id;

    const [fullProfile, setFullProfile] = useState(null);
    const [attendance, setAttendance] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentDate, setCurrentDate] = useState(new Date());
    
    // Estados de edición
    const [isEditingRates, setIsEditingRates] = useState(false);
    const [isEditingBonus, setIsEditingBonus] = useState(false);
    
    const [tempRates, setTempRates] = useState({ hourlyRate: 0, extraRate: 0 });
    const [globalWeeklyBonus, setGlobalWeeklyBonus] = useState(0);

    const apiUrl = import.meta.env.VITE_API_URL;

    // --- REGLAS DE NEGOCIO ---
    const aplicarReglasHorarias = (isoString, tipo) => {
        if (!isoString) return null;
        const date = new Date(isoString);
        const hours = date.getHours();
        const minutes = date.getMinutes();
        if (tipo === 'IN' && hours < 8) date.setHours(8, 0, 0, 0);
        else if (tipo === 'OUT' && minutes >= 55) date.setHours(hours + 1, 0, 0, 0);
        return date;
    };

    const calcularDiferenciaHoras = (entrada, salida) => {
        if (!entrada || !salida) return 0;
        const dEntrada = new Date(entrada);
        const dSalida = new Date(salida);
        let horas = (dSalida - dEntrada) / (1000 * 60 * 60);
        const inicioAlmuerzo = new Date(dEntrada);
        inicioAlmuerzo.setHours(13, 0, 0, 0);
        const finAlmuerzo = new Date(dEntrada);
        finAlmuerzo.setHours(14, 0, 0, 0);
        if (dEntrada < inicioAlmuerzo && dSalida > finAlmuerzo) horas -= 1;
        return horas > 0 ? horas : 0;
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
                
                const baseH = Number(profile?.hourlyRate || 0);
                setTempRates({ 
                    hourlyRate: baseH, 
                    extraRate: Number(profile?.extraRate || (baseH * 1.25)) 
                });
                setGlobalWeeklyBonus(Number(profile?.weeklyBonus || 0));
                setAttendance(resAtt.data || []);
            } catch (error) { console.error(error); } 
            finally { setLoading(false); }
        };
        loadData();
    }, [targetUserId, apiUrl, currentDate]);

    const handleSaveRates = async () => {
        try {
            const data = { 
                hourlyRate: Number(tempRates.hourlyRate), 
                extraRate: Number(tempRates.extraRate) 
            };
            await axios.put(`${apiUrl}/api/users/${targetUserId}`, data);
            setFullProfile(prev => ({ ...prev, ...data }));
            setIsEditingRates(false);
        } catch (error) { alert("Error al guardar tarifas"); }
    };

    const handleSaveBonus = async () => {
        try {
            await axios.put(`${apiUrl}/api/users/${targetUserId}`, { weeklyBonus: globalWeeklyBonus });
            setFullProfile(prev => ({ ...prev, weeklyBonus: globalWeeklyBonus }));
            setIsEditingBonus(false);
        } catch (error) { alert("Error al guardar bono"); }
    };

    const stats = useMemo(() => {
        const hoy = startOfDay(new Date());
        let inicioCicloActual = hoy;
        while (getDay(inicioCicloActual) !== 4) inicioCicloActual = subDays(inicioCicloActual, 1);
        const finCicloActual = addDays(inicioCicloActual, 6);

        const viewMonthStart = startOfMonth(currentDate);
        const viewMonthEnd = endOfMonth(currentDate);
        let displayStart = viewMonthStart;
        while (getDay(displayStart) !== 4) displayStart = subDays(displayStart, 1);
        
        const allDays = eachDayOfInterval({ start: displayStart, end: viewMonthEnd });

        const ciclosMap = {};
        const rate = Number(fullProfile?.hourlyRate || 0);
        const extraRate = Number(fullProfile?.extraRate || (rate * 1.25));

        const days = allDays.map(day => {
            const marca = attendance.find(a => isSameDay(parseISO(a.date), day));
            let nH = 0, eH = 0, nPay = 0, ePay = 0, dayTotal = 0, debtH = 0;

            if (isSunday(day)) {
                nH = 8;
                nPay = nH * rate;
                dayTotal = nPay;
            } 
            else if (marca) {
                const dIn = aplicarReglasHorarias(marca.checkIn, 'IN');
                const dOut = aplicarReglasHorarias(marca.checkOut, 'OUT');
                const totalH = Number(marca.manualHours ?? calcularDiferenciaHoras(dIn, dOut));
                
                nH = Math.min(totalH, 8);
                eH = Math.max(0, totalH - 8);
                debtH = totalH < 8 ? 8 - totalH : 0;
                nPay = nH * rate;
                ePay = eH * extraRate;
                dayTotal = nPay + ePay;
            }

            let refJueves = day;
            while (getDay(refJueves) !== 4) refJueves = subDays(refJueves, 1);
            const keyCiclo = format(refJueves, 'yyyy-MM-dd');
            
            if (!ciclosMap[keyCiclo]) ciclosMap[keyCiclo] = 0;
            ciclosMap[keyCiclo] += dayTotal;

            return { 
                date: day, nH, eH, debtH, nPay, ePay, dayTotal, 
                hasRecord: !!marca, isSunday: isSunday(day),
                isOtherMonth: day.getMonth() !== currentDate.getMonth(),
                cicloRef: keyCiclo
            };
        });

        // Cálculo dinámico para la tarjeta "POR COBRAR" (Ciclo en curso)
        const keyCicloActual = format(inicioCicloActual, 'yyyy-MM-dd');
        const acumuladoSinBono = ciclosMap[keyCicloActual] || 0;

        return { 
            days, 
            ciclosMap, 
            porCobrarTotal: acumuladoSinBono + Number(globalWeeklyBonus),
            rangoCicloActual: `${format(inicioCicloActual, 'dd/MM')} al ${format(finCicloActual, 'dd/MM')}`,
            currentRate: rate,
            currentExtraRate: extraRate
        };
    }, [currentDate, attendance, fullProfile, globalWeeklyBonus]);

    if (loading) return <div style={ss.loading}>Cargando Planilla...</div>;

    return (
        <div style={ss.container}>
            {paramId && (
                <div style={ss.adminHeader}>
                    <UserIcon size={20} color="#34b7f1" />
                    <span style={ss.adminTitle}>Personal: {fullProfile?.name} {fullProfile?.lastName}</span>
                </div>
            )}

            <div style={ss.topRow}>
                {/* TARJETA POR COBRAR */}
                <div style={{...ss.summaryCard, borderLeft: '4px solid #00ffa3'}}>
                    <TrendingUp size={20} color="#00ffa3" />
                    <div>
                        <span style={ss.label}>POR COBRAR ESTE CICLO</span>
                        <div style={{...ss.val, color: '#00ffa3'}}>S/ {stats.porCobrarTotal.toFixed(2)}</div>
                        <span style={ss.subLabel}>{stats.rangoCicloActual}</span>
                    </div>
                </div>

                {/* TARJETA TARIFA EDITABLE */}
                <div style={{...ss.summaryCard, borderLeft: '4px solid #34b7f1'}}>
                    <Wallet size={18} color="#34b7f1" />
                    <div style={{ flex: 1 }}>
                        <span style={ss.label}>TARIFAS (BASE / EXTRA)</span>
                        {isEditingRates ? (
                            <div style={ss.editBox}>
                                <input style={ss.inputSmall} type="number" value={tempRates.hourlyRate} onChange={(e) => setTempRates({...tempRates, hourlyRate: e.target.value})}/>
                                <input style={ss.inputSmall} type="number" value={tempRates.extraRate} onChange={(e) => setTempRates({...tempRates, extraRate: e.target.value})}/>
                                <button onClick={handleSaveRates} style={ss.saveBtn}><Save size={14}/></button>
                            </div>
                        ) : (
                            <div style={ss.valRow} onClick={() => setIsEditingRates(true)}>
                                <div style={ss.val}>S/ {stats.currentRate.toFixed(2)} / {stats.currentExtraRate.toFixed(2)}</div>
                                <Edit2 size={12} color="#8696a0" />
                            </div>
                        )}
                    </div>
                </div>

                {/* TARJETA BONO SEMANAL EDITABLE */}
                <div style={{...ss.summaryCard, borderLeft: '4px solid #ffbc00'}}>
                    <Gift size={18} color="#ffbc00" />
                    <div style={{ flex: 1 }}>
                        <span style={ss.label}>BONO SEMANAL FIJO</span>
                        {isEditingBonus ? (
                            <div style={ss.editBox}>
                                <input style={ss.inputSmall} type="number" value={globalWeeklyBonus} onChange={(e) => setGlobalWeeklyBonus(e.target.value)}/>
                                <button onClick={handleSaveBonus} style={ss.saveBtn}><Save size={14}/></button>
                            </div>
                        ) : (
                            <div style={ss.valRow} onClick={() => setIsEditingBonus(true)}>
                                <div style={{...ss.val, color: '#ffbc00'}}>S/ {Number(globalWeeklyBonus).toFixed(2)}</div>
                                <Edit2 size={12} color="#8696a0" />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div style={ss.monthNav}>
                <button onClick={() => setCurrentDate(subDays(startOfMonth(currentDate), 1))} style={ss.navBtn}><ChevronLeft /></button>
                <span style={ss.monthName}>{format(currentDate, 'MMMM yyyy', { locale: es })}</span>
                <button onClick={() => setCurrentDate(addDays(endOfMonth(currentDate), 1))} style={ss.navBtn}><ChevronRight /></button>
            </div>

            <div style={ss.cardWrapper}>
                <table style={ss.table}>
                    <thead style={ss.thead}>
                        <tr>
                            <th style={ss.th}>FECHA</th>
                            <th style={ss.th}>HORAS (N/E)</th>
                            <th style={ss.th}>GANANCIA DÍA</th>
                            <th style={ss.th}>ESTADO</th>
                            <th style={{...ss.th, textAlign: 'right'}}>SUBTOTAL</th>
                        </tr>
                    </thead>
                    <tbody>
                        {stats.days.map((d, i) => {
                            const esMiercoles = getDay(d.date) === 3;
                            const fechaSabadoPago = addDays(d.date, 3); 
                            const totalHorasMoney = d.nPay + d.ePay;
                            const totalCicloConBono = (stats.ciclosMap[d.cicloRef] || 0) + Number(globalWeeklyBonus);

                            return (
                                <React.Fragment key={i}>
                                    <tr style={{...ss.tr, opacity: (d.hasRecord || d.isSunday) ? 1 : 0.35}}>
                                        <td style={ss.td}>
                                            <div style={ss.dateBox}>
                                                <span style={{...ss.dNum, color: d.isSunday ? '#ff4d4d' : d.isOtherMonth ? '#34b7f1' : '#fff'}}>{format(d.date, 'dd')}</span>
                                                <span style={ss.dName}>{format(d.date, 'eee', { locale: es })}</span>
                                            </div>
                                        </td>
                                        <td style={ss.td}>
                                            <div style={ss.cellCol}>
                                                <span style={ss.hNormal}>{d.nH.toFixed(1)}h / <span style={{color:'#ffbc00'}}>{d.eH.toFixed(1)}h</span></span>
                                                <span style={ss.moneySub}>S/ {d.nPay.toFixed(2)} + S/ {d.ePay.toFixed(2)}</span>
                                            </div>
                                        </td>
                                        <td style={ss.td}>
                                            <span style={ss.dayPay}>S/ {totalHorasMoney.toFixed(2)}</span>
                                        </td>
                                        <td style={ss.td}>
                                            {d.isSunday ? <span style={{color:'#00ffa3', fontSize:'9px', fontWeight:'bold'}}>DOMINICAL</span> : d.debtH > 0 ? <span style={ss.debtText}>-{d.debtH.toFixed(1)}h</span> : d.hasRecord ? '✅' : '-'}
                                        </td>
                                        <td style={{...ss.td, textAlign: 'right'}}>
                                            <span style={ss.moneySub}>S/ {stats.ciclosMap[d.cicloRef].toFixed(2)}</span>
                                        </td>
                                    </tr>
                                    {esMiercoles && (
                                        <tr style={ss.rowCicloTotal}>
                                            <td colSpan="2" style={ss.tdCicloLabel}>
                                                📅 PAGO EL SÁBADO {format(fechaSabadoPago, 'dd/MM')}
                                            </td>
                                            <td colSpan="2" style={ss.tdBonusDesc}>
                                                <span style={{color: '#ffbc00'}}>+ S/ {Number(globalWeeklyBonus).toFixed(2)} Bono Semanal</span>
                                            </td>
                                            <td style={ss.tdCicloMonto}>
                                                <div style={ss.totalLabel}>TOTAL A PAGAR</div>
                                                S/ {totalCicloConBono.toFixed(2)}
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const ss = {
    container: { padding: '16px', backgroundColor: '#0b141a', minHeight: '100vh', color: '#e9edef', fontFamily: 'sans-serif' },
    loading: { height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#0b141a', color: '#00ffa3' },
    adminHeader: { backgroundColor: '#1a2429', padding: '12px', borderRadius: '10px', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px', border: '1px solid #34b7f1' },
    adminTitle: { fontSize: '13px', fontWeight: 'bold' },
    topRow: { display: 'flex', gap: '12px', marginBottom: '20px', overflowX: 'auto', paddingBottom: '10px' },
    summaryCard: { minWidth: '240px', flex: 1, backgroundColor: '#111b21', padding: '15px', borderRadius: '15px', border: '1px solid #2a3942', display: 'flex', alignItems: 'center', gap: '12px' },
    label: { fontSize: '9px', color: '#8696a0', fontWeight: 'bold', textTransform: 'uppercase', display: 'block', marginBottom: '4px' },
    valRow: { display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' },
    val: { fontSize: '17px', fontWeight: 'bold' },
    subLabel: { fontSize: '10px', color: '#8696a0' },
    editBox: { display: 'flex', gap: '5px', alignItems: 'center' },
    inputSmall: { width: '70px', backgroundColor: '#202c33', border: '1px solid #34b7f1', color: '#fff', borderRadius: '4px', padding: '4px', fontSize: '13px' },
    saveBtn: { background: '#34b7f1', border: 'none', borderRadius: '4px', padding: '6px', cursor: 'pointer', color: '#fff', display: 'flex' },
    monthNav: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#202c33', padding: '10px', borderRadius: '12px', marginBottom: '15px' },
    monthName: { textTransform: 'capitalize', fontWeight: 'bold', color: '#00ffa3', fontSize: '14px' },
    navBtn: { background: 'none', border: 'none', color: '#8696a0', cursor: 'pointer' },
    cardWrapper: { backgroundColor: '#111b21', borderRadius: '16px', border: '1px solid #2a3942', overflow: 'auto', maxHeight: '65vh' },
    table: { width: '100%', borderCollapse: 'separate', borderSpacing: 0, minWidth: '800px' },
    thead: { position: 'sticky', top: 0, zIndex: 10 },
    th: { position: 'sticky', top: 0, padding: '12px', textAlign: 'left', color: '#8696a0', fontSize: '9px', backgroundColor: '#1a2429', textTransform: 'uppercase', borderBottom: '2px solid #222d34' },
    tr: { borderBottom: '1px solid #222d34' },
    td: { padding: '12px', borderBottom: '1px solid #222d34' },
    dateBox: { display: 'flex', flexDirection: 'column', alignItems: 'center' },
    dNum: { fontSize: '18px', fontWeight: 'bold' },
    dName: { fontSize: '10px', color: '#8696a0', textTransform: 'uppercase' },
    cellCol: { display: 'flex', flexDirection: 'column' },
    hNormal: { color: '#34b7f1', fontWeight: 'bold', fontSize: '13px' },
    moneySub: { fontSize: '10px', color: '#8696a0' },
    debtText: { color: '#ff4d4d', fontWeight: 'bold', fontSize: '12px' },
    dayPay: { color: '#fff', fontWeight: 'bold', fontSize: '14px' },
    rowCicloTotal: { backgroundColor: 'rgba(0, 255, 163, 0.05)', borderBottom: '2px solid #00ffa3' },
    tdCicloLabel: { padding: '15px', fontSize: '11px', color: '#00ffa3', fontWeight: 'bold' },
    tdBonusDesc: { padding: '15px', fontSize: '12px', fontWeight: 'bold' },
    tdCicloMonto: { padding: '15px', textAlign: 'right', fontSize: '20px', fontWeight: '900', color: '#00ffa3' },
    totalLabel: { fontSize: '9px', color: '#8696a0', fontWeight: 'normal' }
};

export default UserPaymentsPage;