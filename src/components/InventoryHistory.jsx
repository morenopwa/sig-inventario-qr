import React, { useState, useEffect } from 'react';
import axios from 'axios';

const apiUrl = import.meta.env.VITE_API_URL;

const InventoryHistory = () => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const res = await axios.get(`${apiUrl}/api/transactions`);
                // Ordenamos por fecha descendente (lo más nuevo arriba)
                const sorted = res.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                setHistory(sorted);
            } catch (err) {
                console.error("Error cargando historial:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, []);

    if (loading) return <div style={{ color: 'white', padding: '20px' }}>Cargando registros...</div>;

    return (
        <div style={{ padding: '20px' }}>
            <h2 style={{ color: '#e9edef', marginBottom: '20px' }}>Movimientos Recientes 📋</h2>
            <div style={s.listContainer}>
                {history.map((log) => (
                    <div key={log._id} style={s.card}>
                        <div style={s.left}>
                            <div style={s.icon(log.tipo)}>
                                {log.tipo === 'ingreso' ? '↓' : '↑'}
                            </div>
                            <div>
                                <div style={s.itemText}>{log.itemName}</div>
                                <div style={s.metaText}>{log.persona} • {new Date(log.createdAt).toLocaleDateString()}</div>
                            </div>
                        </div>
                        <div style={s.right(log.tipo)}>
                            {log.tipo === 'ingreso' ? '+' : '-'}{log.cantidad}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const s = {
    listContainer: { display: 'flex', flexDirection: 'column', gap: '10px' },
    card: { 
        backgroundColor: '#202c33', padding: '15px', borderRadius: '10px', 
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        borderLeft: '4px solid #3b4a54'
    },
    left: { display: 'flex', alignItems: 'center', gap: '15px' },
    icon: (tipo) => ({
        width: '35px', height: '35px', borderRadius: '50%', 
        backgroundColor: tipo === 'ingreso' ? '#00a88422' : '#ff4d4d22',
        color: tipo === 'ingreso' ? '#00a884' : '#ff4d4d',
        display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold'
    }),
    itemText: { color: '#e9edef', fontWeight: 'bold', fontSize: '15px', textTransform: 'uppercase' },
    metaText: { color: '#8696a0', fontSize: '12px' },
    right: (tipo) => ({
        fontSize: '18px', fontWeight: 'bold',
        color: tipo === 'ingreso' ? '#00a884' : '#ff4d4d'
    })
};

export default InventoryHistory;