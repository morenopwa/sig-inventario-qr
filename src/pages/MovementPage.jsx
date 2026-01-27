import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';

const MovementPage = () => {
    const [movements, setMovements] = useState([]);
    const apiUrl = import.meta.env.VITE_API_URL;

    useEffect(() => {
        const fetchMovements = async () => {
            try {
                const res = await axios.get(`${apiUrl}/api/inventory/movements`);
                setMovements(res.data || []);
            } catch (e) { console.error(e); }
        };
        fetchMovements();
    }, [apiUrl]);

    return (
        <div style={ss.layout}>
            <h2 style={ss.title}>Kardex de Movimientos</h2>
            <div style={ss.tableContainer}>
                <table style={ss.table}>
                    <thead>
                        <tr style={ss.theadRow}>
                            <th style={ss.th}>Fecha</th>
                            <th style={ss.th}>Material</th>
                            <th style={ss.th}>Personal</th>
                            <th style={ss.th}>Tipo</th>
                            <th style={ss.th}>Cant.</th>
                        </tr>
                    </thead>
                    <tbody>
                        {movements.map((m, i) => (
                            <tr key={i} style={ss.tr}>
                                <td style={ss.td}>{format(new Date(m.date), "dd/MM HH:mm")}</td>
                                <td style={ss.td}>{m.materialName}</td>
                                <td style={ss.td}>{m.workerName}</td>
                                <td style={{...ss.td, color: m.type.includes('SALIDA') ? '#ff5555' : '#00ffa3'}}>{m.type}</td>
                                <td style={ss.td}>{m.quantity}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const ss = {
    layout: { padding: '20px', backgroundColor: '#0b141a', minHeight: '100vh', color: 'white' },
    title: { fontSize: '18px', marginBottom: '20px', color: '#00ffa3' },
    tableContainer: { backgroundColor: '#111b21', borderRadius: '10px', overflow: 'hidden' },
    table: { width: '100%', borderCollapse: 'collapse' },
    theadRow: { backgroundColor: '#202c33' },
    th: { padding: '12px', textAlign: 'left', color: '#8696a0', fontSize: '11px' },
    td: { padding: '12px', borderBottom: '1px solid #222d34', fontSize: '12px' },
    tr: { borderBottom: '1px solid #2a3942' }
};

export default MovementPage;