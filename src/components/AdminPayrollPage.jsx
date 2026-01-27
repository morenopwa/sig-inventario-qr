// src/pages/AdminPayrollPage.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AdminPayrollPage = () => {
    const [payroll, setPayroll] = useState([]);
    const apiUrl = import.meta.env.VITE_API_URL;

    const cargarPlanillaTodos = async () => {
        try {
            // 1. Pedimos todos los usuarios y toda la asistencia del tirón
            const [resUsers, resAtt] = await Promise.all([
                axios.get(`${apiUrl}/api/users`),
                axios.get(`${apiUrl}/api/attendance`) 
            ]);

            const hoy = new Date();
            const diaSemana = hoy.getDay(); 
            
            // Lógica Jueves a Miércoles
            const inicioCiclo = new Date(hoy);
            const diff = (diaSemana < 4) ? (diaSemana + 3) : (diaSemana - 4);
            inicioCiclo.setDate(hoy.getDate() - diff);
            inicioCiclo.setHours(0,0,0,0);

            const finCiclo = new Date(inicioCiclo);
            finCiclo.setDate(inicioCiclo.getDate() + 6);
            finCiclo.setHours(23,59,59,999);

            // 2. Procesamos a todos los que son 'TRABAJADOR'
            const tablaGeneral = resUsers.data
                .filter(u => (u.tipo || u.type || "").toUpperCase() === 'TRABAJADOR')
                .map(worker => {
                    const susMarcas = resAtt.data.filter(log => 
                        log.worker === worker._id && 
                        new Date(log.date) >= inicioCiclo && 
                        new Date(log.date) <= finCiclo
                    );

                    let horasSemanales = 0;
                    susMarcas.forEach(m => {
                        if(m.entryTime && m.exitTime) {
                            horasSemanales += Math.floor((new Date(m.exitTime) - new Date(m.entryTime)) / (1000 * 60 * 60));
                        }
                    });

                    return {
                        nombre: `${worker.lastName}, ${worker.name}`.toUpperCase(),
                        tarifa: worker.hourlyRate || 0,
                        horas: horasSemanales,
                        total: horasSemanales * (worker.hourlyRate || 0)
                    };
                });

            setPayroll(tablaGeneral);
        } catch (error) {
            console.error("Error:", error);
        }
    };

    useEffect(() => { cargarPlanillaTodos(); }, []);

    return (
        <div style={{padding: '20px', color: 'white'}}>
            <h2 style={{color: '#00a884'}}>Planilla General de la Semana</h2>
            <table style={{width: '100%', borderCollapse: 'collapse', marginTop: '20px'}}>
                <thead>
                    <tr style={{backgroundColor: '#00a884'}}>
                        <th style={st.th}>Trabajador</th>
                        <th style={st.th}>S/ por Hora</th>
                        <th style={st.th}>Horas Jue-Mié</th>
                        <th style={st.th}>Total a Pagar</th>
                    </tr>
                </thead>
                <tbody>
                    {payroll.map((p, i) => (
                        <tr key={i} style={{borderBottom: '1px solid #2a3942'}}>
                            <td style={st.td}>{p.nombre}</td>
                            <td style={st.td}>S/ {p.tarifa}</td>
                            <td style={st.td}>{p.horas} h</td>
                            <td style={{...st.td, color: '#00a884', fontWeight: 'bold'}}>S/ {p.total}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

const st = {
    th: { padding: '12px', textAlign: 'left' },
    td: { padding: '12px' }
};

export default AdminPayrollPage;