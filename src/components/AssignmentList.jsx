import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AssignmentList = () => {
    const [assignments, setAssignments] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const apiUrl = import.meta.env.VITE_API_URL;

    // 1. Cargar historial de asignaciones (transacciones)
    useEffect(() => {
        const fetchAssignments = async () => {
            try {
                const res = await axios.get(`${apiUrl}/api/transactions`);
                setAssignments(res.data);
            } catch (err) {
                console.error("Error al cargar asignaciones:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchAssignments();
    }, [apiUrl]);

    // 2. Filtrar por nombre de trabajador o producto
    const filteredData = assignments.filter(item => 
        item.personName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.itemName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div style={s.container}>
            <h2 style={s.title}>📋 Control de Asignaciones</h2>
            
            <div style={s.searchBar}>
                <input 
                    style={s.input}
                    type="text" 
                    placeholder="🔍 Buscar trabajador o herramienta..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div style={s.tableWrapper}>
                {loading ? (
                    <p style={{textAlign: 'center'}}>Cargando datos...</p>
                ) : (
                    <table style={s.table}>
                        <thead>
                            <tr style={s.headerRow}>
                                <th style={s.th}>Fecha</th>
                                <th style={s.th}>Trabajador</th>
                                <th style={s.th}>Producto</th>
                                <th style={s.th}>Cantidad</th>
                                <th style={s.th}>Tipo</th>
                            </tr>
                        </thead>
                        <tbody>
                            {/* Código pegado para evitar Whitespace Error */}
                            {filteredData.map((item) => (
                                <tr key={item._id} style={s.row}>
                                    <td style={s.td}>{new Date(item.timestamp).toLocaleDateString()}</td>
                                    <td style={s.td}><strong>{item.personName}</strong></td>
                                    <td style={s.td}>{item.itemName}</td>
                                    <td style={s.td}>{item.quantity}</td>
                                    <td style={s.td}>
                                        <span style={s.badge(item.type)}>
                                            {item.type === 'IN' ? 'Entrada' : 'Prestado'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
            
            {!loading && filteredData.length === 0 && (
                <p style={s.noData}>No se encontraron registros.</p>
            )}
        </div>
    );
};

const s = {
    container: { padding: '20px', backgroundColor: '#0b141a', minHeight: '100vh', color: 'white' },
    title: { color: '#00a884', marginBottom: '20px' },
    searchBar: { marginBottom: '20px' },
    input: { width: '100%', padding: '12px', borderRadius: '8px', border: 'none', backgroundColor: '#202c33', color: 'white', outline: 'none' },
    tableWrapper: { overflowX: 'auto', backgroundColor: '#202c33', borderRadius: '12px' },
    table: { width: '100%', borderCollapse: 'collapse', fontSize: '14px' },
    headerRow: { borderBottom: '2px solid #2a3942', backgroundColor: '#2a3942' },
    th: { padding: '15px', textAlign: 'left', color: '#8696a0' },
    row: { borderBottom: '1px solid #2a3942' },
    td: { padding: '15px' },
    badge: (type) => ({
        padding: '4px 8px',
        borderRadius: '4px',
        fontSize: '11px',
        fontWeight: 'bold',
        backgroundColor: type === 'IN' ? 'rgba(0, 168, 132, 0.2)' : 'rgba(244, 67, 54, 0.2)',
        color: type === 'IN' ? '#00a884' : '#f44336',
        textTransform: 'uppercase'
    }),
    noData: { textAlign: 'center', marginTop: '20px', color: '#8696a0' }
};

export default AssignmentList;