import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { HardDrive, AlertCircle, Loader2, Calendar, Hash } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import useAuth from '../hooks/useAuth';

const UserLoansPage = () => {
    const { user } = useAuth();
    const [loans, setLoans] = useState([]);
    const [loading, setLoading] = useState(true);
    const apiUrl = import.meta.env.VITE_API_URL;

    useEffect(() => {
        const fetchLoans = async () => {
            if (!user?.name) return;
            try {
                setLoading(true);
                const res = await axios.get(`${apiUrl}/api/inventory/items`);
                const userFullName = `${user.name} ${user.lastName || ''}`.trim().toUpperCase();
                
                const myActiveLoans = [];
                res.data.forEach(item => {
                    if (item.activeLoans?.length > 0) {
                        item.activeLoans.forEach(loan => {
                            const loanWorker = (loan.workerName || "").trim().toUpperCase();
                            if (loanWorker !== "" && (userFullName.includes(loanWorker) || loanWorker.includes(userFullName)) && loan.quantity > 0) {
                                myActiveLoans.push({
                                    id: item._id + loan.date,
                                    name: item.name,
                                    unit: item.unit,
                                    quantity: loan.quantity,
                                    date: loan.date,
                                    category: item.category
                                });
                            }
                        });
                    }
                });
                setLoans(myActiveLoans.sort((a, b) => new Date(b.date) - new Date(a.date)));
            } catch (e) { console.error(e); }
            finally { setLoading(false); }
        };
        fetchLoans();
    }, [user, apiUrl]);

    const formatDate = (dateString) => {
        if (!dateString) return "-";
        const date = parseISO(dateString);
        return format(date, "dd/MM/yy HH:mm", { locale: es });
    };

    if (loading) return <div style={ss.empty}><Loader2 className="spin" color="#00ffa3" /> Cargando tabla...</div>;

    return (
        <div style={ss.container}>
            <header style={ss.header}>
                <h2 style={ss.title}>📋 Mi Inventario Personal</h2>
                <p style={ss.subtitle}>Listado detallado de bienes asignados</p>
            </header>

            {loans.length === 0 ? (
                <div style={ss.empty}>
                    <AlertCircle size={40} color="#8696a0" />
                    <p>No se encontraron herramientas registradas.</p>
                </div>
            ) : (
                <div style={ss.tableWrapper}>
                    <table style={ss.table}>
                        <thead>
                            <tr>
                                <th style={ss.th}><Calendar size={14} /> FECHA ENTREGA</th>
                                <th style={ss.th}><HardDrive size={14} /> HERRAMIENTA / MATERIAL</th>
                                <th style={ss.th}><Hash size={14} /> CANT.</th>
                                <th style={ss.th}>UNIDAD</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loans.map((loan) => (
                                <tr key={loan.id} style={ss.tr}>
                                    <td style={ss.td}>
                                        <span style={ss.dateText}>{formatDate(loan.date)}</span>
                                    </td>
                                    <td style={ss.td}>
                                        <div style={ss.itemCol}>
                                            <span style={ss.itemName}>{loan.name}</span>
                                        </div>
                                    </td>
                                    <td style={{ ...ss.td, textAlign: 'center' }}>
                                        <span style={ss.qtyText}>{loan.quantity}</span>
                                    </td>
                                    <td style={ss.td}>
                                        <span style={ss.unitText}>{loan.unit}</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

const ss = {
    container: { padding: '15px', backgroundColor: '#0b141a', minHeight: '100vh' },
    header: { marginBottom: '20px' },
    title: { color: '#00ffa3', fontSize: '20px', fontWeight: 'bold', margin: 0 },
    subtitle: { color: '#8696a0', fontSize: '13px' },
    tableWrapper: { 
        backgroundColor: '#111b21', 
        borderRadius: '12px', 
        border: '1px solid #2a3942', 
        overflowX: 'auto', // Permite scroll horizontal en móvil
        boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
    },
    table: { width: '100%', borderCollapse: 'collapse', minWidth: '500px' },
    th: { 
        padding: '12px 15px', 
        textAlign: 'left', 
        backgroundColor: '#202c33', 
        color: '#8696a0', 
        fontSize: '11px', 
        fontWeight: 'bold',
        letterSpacing: '0.5px',
        borderBottom: '2px solid #2a3942'
    },
    td: { padding: '12px 15px', borderBottom: '1px solid #222d34', verticalAlign: 'middle' },
    tr: { transition: 'background 0.2s' },
    dateText: { color: '#d1d7db', fontSize: '12px', fontFamily: 'monospace' },
    itemCol: { display: 'flex', flexDirection: 'column', gap: '2px' },
    itemName: { color: '#e9edef', fontWeight: '600', fontSize: '14px', textTransform: 'uppercase' },
    itemCat: { color: '#34b7f1', fontSize: '10px', fontWeight: 'bold' },
    qtyText: { color: '#00ffa3', fontWeight: 'bold', fontSize: '15px' },
    unitText: { color: '#8696a0', fontSize: '12px', textTransform: 'lowercase' },
    empty: { textAlign: 'center', color: '#8696a0', marginTop: '60px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }
};

export default UserLoansPage;