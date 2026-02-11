import React, { useState, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Clock, DollarSign } from 'lucide-react';

const UserCalendarPage = ({ userAttendance, userPayments }) => {
    const [currentMonth, setCurrentMonth] = useState(new Date());

    // Generar los días del mes actual
    const days = useMemo(() => {
        return eachDayOfInterval({
            start: startOfMonth(currentMonth),
            end: endOfMonth(currentMonth),
        });
    }, [currentMonth]);

    const getDayData = (day) => {
        const attendance = userAttendance?.find(a => isSameDay(parseISO(a.date), day));
        const payment = userPayments?.find(p => isSameDay(parseISO(p.date), day));
        return { attendance, payment };
    };

    return (
        <div style={ss.container}>
            <header style={ss.header}>
                <button onClick={() => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1))} style={ss.navBtn}>
                    <ChevronLeft />
                </button>
                <h2 style={ss.monthTitle}>{format(currentMonth, 'MMMM yyyy', { locale: es }).toUpperCase()}</h2>
                <button onClick={() => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1))} style={ss.navBtn}>
                    <ChevronRight />
                </button>
            </header>

            <div style={ss.calendarGrid}>
                {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(d => (
                    <div key={d} style={ss.weekdayHeader}>{d}</div>
                ))}
                
                {days.map((day, idx) => {
                    const { attendance, payment } = getDayData(day);
                    return (
                        <div key={idx} style={{...ss.dayCard, gridColumnStart: idx === 0 ? day.getDay() + 1 : 'auto'}}>
                            <span style={ss.dayNumber}>{format(day, 'd')}</span>
                            
                            {attendance && (
                                <div style={ss.infoRow}>
                                    <Clock size={12} color="#00ffa3" />
                                    <span style={ss.hoursText}>{attendance.hours}h</span>
                                </div>
                            )}
                            
                            {payment && (
                                <div style={ss.infoRow}>
                                    <DollarSign size={12} color="#34b7f1" />
                                    <span style={ss.balanceText}>S/ {payment.amount}</span>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const ss = {
    container: { padding: '20px', backgroundColor: '#0b141a', minHeight: '100vh', color: '#e9edef' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
    monthTitle: { fontSize: '18px', fontWeight: 'bold', color: '#00ffa3' },
    navBtn: { background: '#202c33', border: 'none', color: 'white', padding: '10px', borderRadius: '50%', cursor: 'pointer' },
    calendarGrid: { 
        display: 'grid', 
        gridTemplateColumns: 'repeat(7, 1fr)', 
        gap: '8px',
        backgroundColor: '#111b21',
        padding: '10px',
        borderRadius: '12px'
    },
    weekdayHeader: { textAlign: 'center', padding: '10px', color: '#8696a0', fontSize: '12px', fontWeight: 'bold' },
    dayCard: { 
        backgroundColor: '#202c33', 
        minHeight: '80px', 
        padding: '8px', 
        borderRadius: '8px', 
        display: 'flex', 
        flexDirection: 'column',
        gap: '4px'
    },
    dayNumber: { fontSize: '12px', color: '#8696a0', marginBottom: '4px' },
    infoRow: { display: 'flex', alignItems: 'center', gap: '4px' },
    hoursText: { fontSize: '11px', color: '#00ffa3', fontWeight: 'bold' },
    balanceText: { fontSize: '11px', color: '#34b7f1' },
};

export default UserCalendarPage;