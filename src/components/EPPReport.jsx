import React, { useState, useEffect } from 'react';
import axios from 'axios';

const EPPReport = () => {
    const [data, setData] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const apiUrl = import.meta.env.VITE_API_URL;

    useEffect(() => {
        const fetchEPP = async () => {
            try {
                // Traemos todas las transacciones
                const res = await axios.get(`${apiUrl}/api/transactions`);
                // Filtramos solo las que son de tipo SALIDA (OUT) y categoría EPP
                // Nota: Asegúrate de que al registrar en el chat envíes category: 'EPP'
                const eppOnly = res.data.filter(t => t.type === 'OUT'); 
                setData(eppOnly);
            } catch (err) {
                console.error("Error al cargar reporte de EPP:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchEPP();
    }, [apiUrl]);

    // Filtrar por trabajador o por nombre del EPP (Casco, Guantes, etc.)
    const filtered = data.filter(item => 
        item.personName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.itemName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div style={s.container}>
            <h2 style={s.title}>🛡️ Entrega de EPP por Trabajador</h2>
            
            <div style={s.searchBar}>
                <input 
                    style={s.input}
                    type="text" 
                    placeholder="Buscar por apellido o EPP (ej: GARCIA o CASCO)..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div style={s.tableWrapper}>
                {loading ? (
                    <p style={{textAlign: 'center', padding: '20px'}}>Cargando historial de entregas...</p>
                ) : (
                    <table style={s.table}>
                        <thead>
                            <tr style={s.headerRow}>
                                <th style={s.th}>Fecha</th>
                                <th style={s.th}>Trabajador</th>
                                <th style={s.th}>Equipo (EPP)</th>
                                <th style={s.th}>Cantidad</th>
                                <th style={s.th}>Estado</th>
                            </tr>
                        </thead>
                        <tbody>
                            {/* Renderizado sin espacios para evitar error de Whitespace */}
                            {filtered.map((item) => (
                                <tr key={item._id} style={s.row}>
                                    <td style={s.td}>{new Date(item.timestamp).toLocaleDateString()}</td>
                                    <td style={s.td}><strong>{item.personName}</strong></td>
                                    <td style={s.td}>{item.itemName}</td>
                                    <td style={s.td}>{item.quantity}</td>
                                    <td style={s.td}><span style={s.badge}>ENTREGADO</span></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {!loading && filtered.length === 0 && (
                <p style={s.noData}>No hay registros de EPP entregados.</p>
            )}
        </div>
    );
};

const s = {
    container: { padding: '20px', backgroundColor: '#0b141a', minHeight: '100vh', color: 'white' },
    title: { color: '#00a884', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' },
    searchBar: { marginBottom: '20px' },
    input: { width: '100%', padding: '12px', borderRadius: '8px', border: 'none', backgroundColor: '#202c33', color: 'white', outline: 'none', fontSize: '16px' },
    tableWrapper: { backgroundColor: '#202c33', borderRadius: '12px', overflow: 'hidden' },
    table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left' },
    headerRow: { backgroundColor: '#2a3942' },
    th: { padding: '15px', color: '#8696a0', fontWeight: '600' },
    row: { borderBottom: '1px solid #2a3942' },
    td: { padding: '15px' },
    badge: { backgroundColor: 'rgba(0, 168, 132, 0.15)', color: '#00a884', padding: '4px 10px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' },
    noData: { textAlign: 'center', marginTop: '30px', color: '#8696a0' }
};

export default EPPReport;