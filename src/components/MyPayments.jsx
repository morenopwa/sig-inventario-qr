import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const MyPayments = ({ user }) => {
    const [history, setHistory] = useState([]);
    const [totals, setTotals] = useState({ hours: 0, money: 0 });
    const apiUrl = import.meta.env.VITE_API_URL;
    
    // Usamos la tarifa del usuario guardada en la BD, si no hay, por defecto 15
    const HOURLY_RATE = user.hourlyRate || 15; 

    const fetchMyAttendance = useCallback(async () => {
        try {
            // 1. LÓGICA DE CICLO: Jueves a Miércoles
            const hoy = new Date();
            const diaSemana = hoy.getDay(); // 0: Dom, 1: Lun, ..., 4: Jue, 5: Vie, 6: Sab

            // Calculamos el jueves de esta semana de pago
            const inicioCiclo = new Date(hoy);
            const diferenciaAlJueves = (diaSemana < 4) ? (diaSemana + 3) : (diaSemana - 4);
            inicioCiclo.setDate(hoy.getDate() - diferenciaAlJueves);
            inicioCiclo.setHours(0, 0, 0, 0);

            const finCiclo = new Date(inicioCiclo);
            finCiclo.setDate(inicioCiclo.getDate() + 6);
            finCiclo.setHours(23, 59, 59, 999);

            // 2. PETICIÓN AL BACKEND
            const res = await axios.get(`${apiUrl}/api/attendance/user/${user._id}`);
            
            // 3. FILTRADO POR FECHAS DEL CICLO
            const logsDelCiclo = res.data.filter(log => {
                const fechaLog = new Date(log.date);
                return fechaLog >= inicioCiclo && fechaLog <= finCiclo;
            });

            let accumHours = 0;
            let accumMoney = 0;

            const processed = logsDelCiclo.map(log => {
                if (!log.entryTime || !log.exitTime) {
                    return { ...log, fullHours: 0, dayPay: 0 };
                }

                const entry = new Date(log.entryTime);
                const exit = new Date(log.exitTime);
                
                // Diferencia en horas reales
                const diffHours = (exit - entry) / (1000 * 60 * 60);

                // REGLA: Solo horas completas
                const fullHours = Math.floor(diffHours); 
                const dayPay = fullHours * HOURLY_RATE;

                accumHours += fullHours;
                accumMoney += dayPay;

                return { ...log, fullHours, dayPay };
            });

            setHistory(processed.sort((a, b) => new Date(b.date) - new Date(a.date)));
            setTotals({ hours: accumHours, money: accumMoney });
        } catch (error) {
            console.error("Error al cargar pagos:", error);
        }
    }, [user, apiUrl, HOURLY_RATE]);

    useEffect(() => {
        if (user?._id) fetchMyAttendance();
    }, [user, fetchMyAttendance]);

    return (
        <div style={s.card}>
            <div style={s.periodTag}>Ciclo: Jueves a Miércoles (Pago Sábado)</div>
            
            <div style={s.summaryContainer}>
                <div style={s.statBox}>
                    <small style={s.label}>HORAS SEMANALES</small>
                    <div style={s.value}>{totals.hours} h</div>
                </div>
                <div style={{ ...s.statBox, borderLeft: '1px solid #2a3942' }}>
                    <small style={s.label}>PAGO ESTE SÁBADO</small>
                    <div style={{ ...s.value, color: '#00a884' }}>S/ {totals.money.toLocaleString()}</div>
                </div>
            </div>

            <p style={s.infoText}>* Horas completas trabajadas a S/ {HOURLY_RATE}/hr</p>

            <div style={s.list}>
                {history.length > 0 ? history.map((day, i) => (
                    <div key={i} style={s.row}>
                        <div>
                            <div style={s.dateText}>{new Date(day.date).toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric' })}</div>
                            <small style={s.timeDetail}>
                                {new Date(day.entryTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - 
                                {new Date(day.exitTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </small>
                        </div>
                        <div style={s.amountSide}>
                            <div style={s.dayHours}>{day.fullHours} h</div>
                            <div style={s.dayMoney}>S/ {day.dayPay}</div>
                        </div>
                    </div>
                )) : (
                    <p style={{textAlign: 'center', color: '#8696a0', padding: '20px'}}>No hay marcas en el ciclo actual.</p>
                )}
            </div>
        </div>
    );
};

const s = {
    card: { margin: '0 15px', backgroundColor: '#202c33', borderRadius: '12px', padding: '15px', boxShadow: '0 4px 10px rgba(0,0,0,0.3)' },
    periodTag: { textAlign: 'center', fontSize: '11px', color: '#8696a0', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '1px' },
    summaryContainer: { display: 'flex', justifyContent: 'space-around', marginBottom: '15px', padding: '10px 0', borderBottom: '1px solid #2a3942' },
    statBox: { textAlign: 'center', flex: 1 },
    label: { color: '#8696a0', fontSize: '10px', fontWeight: 'bold' },
    value: { fontSize: '20px', color: '#e9edef', fontWeight: 'bold' },
    infoText: { fontSize: '11px', color: '#00a884', textAlign: 'center', marginBottom: '15px', fontStyle: 'italic' },
    list: { display: 'flex', flexDirection: 'column', gap: '8px' },
    row: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', backgroundColor: '#111b21', borderRadius: '8px' },
    dateText: { color: '#e9edef', fontSize: '14px', textTransform: 'capitalize' },
    timeDetail: { color: '#8696a0', fontSize: '11px' },
    amountSide: { textAlign: 'right' },
    dayHours: { color: '#8696a0', fontSize: '12px' },
    dayMoney: { color: '#e9edef', fontWeight: 'bold', fontSize: '14px' }
};

export default MyPayments;