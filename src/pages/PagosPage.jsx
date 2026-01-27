import React, { useState, useEffect } from 'react';
import axios from 'axios';
import useAuth from '../hooks/useAuth';

const apiUrl = import.meta.env.VITE_API_URL;

const PagosPage = () => {
    const { isAdmin, isSuperAdmin } = useAuth();
    const [payrollData, setPayrollData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterMonth, setFilterMonth] = useState(new Date().toISOString().slice(0, 7));

    const fetchPayroll = async () => {
        setLoading(true);
        try {
            // Esta ruta debe devolver: nombre, horas totales, sueldo por hora y total
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

    if (!isAdmin && !isSuperAdmin) {
        return <div style={s.errorMsg}>No tienes permisos para ver esta sección.</div>;
    }

    return (
        <div style={s.container}>
            <header style={s.header}>
                <h2 style={s.title}>Cálculo de Planilla 💸</h2>
                <input 
                    type="month" 
                    value={filterMonth} 
                    onChange={(e) => setFilterMonth(e.target.value)} 
                    style={s.dateInput}
                />
            </header>

            {loading ? (
                <div style={s.loader}>Calculando montos...</div>
            ) : (
                <div style={s.tableCard}>
                    <table style={s.table}>
                        <thead>
                            <tr style={s.thr}>
                                <th style={s.th}>Trabajador</th>
                                <th style={s.th}>Días Asistidos</th>
                                <th style={s.th}>Total Horas</th>
                                <th style={s.th}>Pago x Hora</th>
                                <th style={s.th}>Total a Pagar</th>
                            </tr>
                        </thead>
                       
<tbody>
    {payrollData.length === 0 ? (
        <tr><td colSpan="5" style={s.td}>No hay datos para este mes.</td></tr>
    ) : (
        payrollData.map((p) => (
            <tr key={p._id} style={s.tr}>
                <td style={s.td}>
                    <strong>{p.name} {p.lastName}</strong>
                    <div style={s.roleLabel}>{p.role}</div>
                </td>
                <td style={s.td}>{p.daysCount} días</td>
                {/* Usamos Number() por si acaso el dato viene como string */}
                <td style={s.td}>{Number(p.totalHours).toFixed(1)} hrs</td>
                <td style={s.td}>S/ {p.hourlyRate}</td>
                <td style={{...s.td, color: '#00a884', fontWeight: 'bold'}}>
                    S/ {(p.totalHours * p.hourlyRate).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
            </tr>
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
    container: { padding: '20px', backgroundColor: '#0b141a', minHeight: '100vh' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
    title: { color: 'white', fontSize: '20px' },
    dateInput: { backgroundColor: '#2a3942', color: 'white', border: 'none', padding: '10px', borderRadius: '8px', outline: 'none' },
    tableCard: { backgroundColor: '#111b21', borderRadius: '12px', border: '1px solid #2a3942', overflow: 'hidden' },
    table: { width: '100%', borderCollapse: 'collapse' },
    thr: { backgroundColor: '#202c33' },
    th: { padding: '15px', color: '#8696a0', textAlign: 'left', fontSize: '13px' },
    td: { padding: '15px', color: '#e9edef', borderBottom: '1px solid #222d34' },
    roleLabel: { fontSize: '11px', color: '#8696a0' },
    loader: { color: '#00a884', textAlign: 'center', marginTop: '50px' },
    errorMsg: { color: '#ff5555', textAlign: 'center', padding: '50px' }
};

export default PagosPage;