import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

const MyPayments = ({ user }) => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSalary = async () => {
            try {
                // Usamos el ID del usuario logueado
                const res = await axios.get(`${API_URL}/api/salary/${user.id || user._id}`);
                setStats(res.data);
            } catch (err) {
                console.error("Error al cargar sueldo");
            } finally {
                setLoading(false);
            }
        };
        fetchSalary();
    }, [user]);

    if (loading) return <div style={{color: 'white', padding: '20px'}}>Calculando...</div>;

    return (
        <div style={p.container}>
            <div style={p.card}>
                <span style={p.label}>PAGO ACUMULADO (Semana Actual)</span>
                <div style={p.amount}>S/ {stats?.totalAcumulado.toFixed(2)}</div>
                
                <div style={p.divider} />

                <div style={p.grid}>
                    <div style={p.item}>
                        <span style={p.subLabel}>Días Trabajados</span>
                        <span style={p.value}>{stats?.diasTrabajados} días</span>
                    </div>
                    <div style={p.item}>
                        <span style={p.subLabel}>Tarifa Pactada</span>
                        <span style={p.value}>S/ {stats?.tarifaDiaria} / día</span>
                    </div>
                </div>
            </div>

            <div style={p.infoBox}>
                <p>Monto es un estimado basado en tus escaneos de entrada realizados con el QR. Si falta algún día, contacta con Administracion.</p>
            </div>
        </div>
    );
};

const p = {
    container: { padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center' },
    card: { 
        width: '100%', maxWidth: '400px', backgroundColor: '#202c33', padding: '25px', 
        borderRadius: '20px', boxShadow: '0 4px 15px rgba(0,0,0,0.3)', textAlign: 'left'
    },
    label: { color: '#8696a0', fontSize: '12px', letterSpacing: '1px' },
    amount: { color: '#00a884', fontSize: '42px', fontWeight: 'bold', margin: '10px 0' },
    divider: { height: '1px', backgroundColor: '#2a3942', margin: '20px 0' },
    grid: { display: 'flex', justifyContent: 'space-between' },
    item: { display: 'flex', flexDirection: 'column' },
    subLabel: { color: '#8696a0', fontSize: '11px' },
    value: { color: '#e9edef', fontSize: '16px', fontWeight: '500' },
    infoBox: { 
        marginTop: '20px', maxWidth: '400px', padding: '15px', 
        backgroundColor: '#111b21', borderRadius: '10px', color: '#8696a0', fontSize: '12px' 
    }
};

export default MyPayments;