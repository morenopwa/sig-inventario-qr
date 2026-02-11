import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { HardDrive, User, ArrowLeftRight, RotateCcw, AlertTriangle } from 'lucide-react';

const InventoryPage = () => {
    const [items, setItems] = useState([]);
    const [movements, setMovements] = useState([]);
    const [activeTab, setActiveTab] = useState('Kardex Activo'); 
    const [searchTerm, setSearchTerm] = useState('');
    const apiUrl = import.meta.env.VITE_API_URL;

    const classifyCategory = (name) => {
        if (!name) return 'Consumibles';
        const n = name.toUpperCase();
        const epp = ['LENTE', 'GUANTE', 'CASCO', 'ZAPATO', 'CHALECO', 'ARNES', 'MASCARILLA', 'TAPON', 'OREJERA', 'RESPIRADOR', 'BOTAS', 'CONO'];
        const tools = ['MARTILLO', 'LLAVE', 'ALICATE', 'TALADRO', 'AMOLADORA', 'MAQUINA', 'SIERRA', 'ROTOMARTILLO', 'PALA', 'PICO', 'ANDAMIO', 'PUNTAL', 'APUNTALAR'];
        if (epp.some(p => n.includes(p))) return 'EPP';
        if (tools.some(p => n.includes(p))) return 'Herramientas';
        return 'Consumibles';
    };

    const fetchData = useCallback(async () => {
        try {
            const [resItems, resMovs] = await Promise.all([
                axios.get(`${apiUrl}/api/inventory/items`),
                axios.get(`${apiUrl}/api/movements`) 
            ]);
            setItems(resItems.data || []);
            setMovements(resMovs.data || []);
        } catch (e) { 
            console.error("Error cargando inventario:", e); 
        }
    }, [apiUrl]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const formatDisplayDate = (dateString) => {
        if (!dateString) return { dia: '-', completa: '-' };
        const cleanDate = dateString.split('.')[0].replace('Z', '');
        const date = parseISO(cleanDate);
        return {
            dia: format(date, "EEEE", { locale: es }),
            completa: format(date, "dd/MM/yy HH:mm")
        };
    };

const loansByWorker = useMemo(() => {
    const workers = {};
    items.forEach(item => {
        // 1. Determinar categoría para filtrar
        const category = item.category && item.category !== 'General' 
            ? item.category 
            : classifyCategory(item.name);

        // 2. Solo procesar si NO es consumible
        if (category !== 'Consumibles' && item.activeLoans && item.activeLoans.length > 0) {
            item.activeLoans.forEach(loan => {
                if (loan.quantity > 0) {
                    if (!workers[loan.workerName]) workers[loan.workerName] = [];
                    workers[loan.workerName].push({
                        ...loan,
                        itemName: item.name,
                        unit: item.unit,
                        itemId: item._id
                    });
                }
            });
        }
    });
    return workers;
}, [items]);

    const filteredData = useMemo(() => {
        const search = searchTerm.toLowerCase();
        
        if (activeTab === 'Kardex Activo') {
            return movements
                .filter(m => (m.materialName || "").toLowerCase().includes(search) || (m.workerName || "").toLowerCase().includes(search))
                .sort((a, b) => new Date(b.date) - new Date(a.date));
        }

        if (activeTab === 'Préstamos') return []; // Se maneja por loansByWorker

        return items.filter(i => {
            const cat = i.category && i.category !== 'General' ? i.category : classifyCategory(i.name);
            return cat.toLowerCase() === activeTab.toLowerCase() && (i.name || "").toLowerCase().includes(search);
        });
    }, [activeTab, items, movements, searchTerm]);

    // Función para procesar devolución rápida (mismo formato que el chat)
    const handleQuickReturn = async (loan) => {
        if (!window.confirm(`¿Confirmar devolución de ${loan.quantity} ${loan.unit} de ${loan.itemName}?`)) return;
        try {
            const now = new Date();
            const timestampLocal = format(now, "yyyy-MM-dd'T'HH:mm:ss");
            await axios.post(`${apiUrl}/api/transactions`, {
                quantity: loan.quantity,
                unit: loan.unit,
                itemName: loan.itemName,
                personName: 'SIMA', // Al devolver a SIMA, el sistema lo procesa como IN
                type: 'IN',
                timestamp: timestampLocal
            });
            fetchData();
        } catch (e) { alert("Error al devolver"); }
    };

    return (
        <div style={ss.layout}>
            <div style={ss.tabBar}>
                {['Kardex Activo', 'Préstamos', 'Herramientas', 'Consumibles', 'EPP'].map(t => (
                    <button 
                        key={t} 
                        onClick={() => setActiveTab(t)} 
                        style={activeTab === t ? ss.tabActive : ss.tabInactive}
                    >
                        {t.toUpperCase()}
                    </button>
                ))}
            </div>

            <main style={ss.mainContent}>
                <input 
                    placeholder="🔍 Buscar material, trabajador o herramienta..." 
                    value={searchTerm} 
                    onChange={e => setSearchTerm(e.target.value)} 
                    style={ss.searchInput} 
                />
                
                {activeTab === 'Préstamos' ? (
                    <div style={ss.loanGrid}>
                        {Object.entries(loansByWorker).map(([worker, userLoans]) => (
                            <div key={worker} style={ss.workerCard}>
                                <div style={ss.workerHeader}>
                                    <User size={16} color="#00ffa3" />
                                    <span style={ss.workerName}>{worker}</span>
                                </div>
                                {userLoans.map((loan, idx) => (
                                    <div key={idx} style={ss.loanItem}>
                                        <div style={ss.loanInfo}>
                                            <span style={ss.loanQty}>{loan.quantity} {loan.unit}</span>
                                            <span style={ss.loanName}>{loan.itemName}</span>
                                        </div>
                                        <div style={ss.loanActions}>
                                            <button onClick={() => handleQuickReturn(loan)} style={ss.actionBtn} title="Devolver">
                                                <RotateCcw size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div style={ss.tableContainer}>
                        <table style={ss.table}>
                            <thead style={ss.thead}>
                                {activeTab === 'Kardex Activo' ? (
                                    <tr>
                                        <th style={ss.th}>Día</th>
                                        <th style={ss.th}>Fecha / Hora</th>
                                        <th style={ss.th}>Material</th>
                                        <th style={ss.th}>Und.</th>
                                        <th style={ss.th}>Tipo Operación</th>
                                        <th style={ss.th}>Entradas</th>
                                        <th style={ss.th}>Salidas</th>
                                        <th style={ss.th}>Trabajador</th>
                                    </tr>
                                ) : (
                                    <tr>
                                        <th style={ss.th}>Material</th>
                                        <th style={ss.th}>Und.</th>
                                        <th style={ss.th}>Stock Propio</th>
                                        <th style={ss.th}>Total (Patrimonio)</th>
                                        <th style={ss.th}>En posesión de</th>
                                    </tr>
                                )}
                            </thead>
                            <tbody>
                                {filteredData.length === 0 ? (
                                    <tr>
                                        <td colSpan="8" style={{textAlign:'center', padding:'30px', color:'#8696a0'}}>
                                            No hay registros.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredData.map((row, i) => (
                                        activeTab === 'Kardex Activo' ? (
                                            <tr key={i} style={ss.tr}>
                                                <td style={{...ss.td, color: '#00ffa3', textTransform: 'capitalize'}}>{formatDisplayDate(row.date).dia}</td>
                                                <td style={ss.td}>{formatDisplayDate(row.date).completa}</td>
                                                <td style={ss.td}><strong>{row.materialName}</strong></td>
                                                <td style={ss.td}>{row.unit}</td>
                                                <td style={ss.td}><span style={ss.opBadge((row.type || "").includes('SALIDA'))}>{row.type}</span></td>
                                                <td style={{...ss.td, color: '#00ffa3'}}>{!(row.type || "").includes('SALIDA') ? row.quantity : '-'}</td>
                                                <td style={{...ss.td, color: '#ff5555'}}>{(row.type || "").includes('SALIDA') ? row.quantity : '-'}</td>
                                                <td style={ss.td}><strong>{row.workerName}</strong></td>
                                            </tr>
                                        ) : (
                                            <tr key={i} style={ss.tr}>
                                                <td style={ss.td}><strong>{row.name}</strong></td>
                                                <td style={ss.td}>{row.unit}</td>
                                                <td style={{...ss.td, color: row.stock <= 0 ? '#ff5555' : '#00ffa3', fontWeight: 'bold'}}>{row.stock}</td>
                                                <td style={{...ss.td, color: '#34b7f1'}}>{row.totalStock || row.stock}</td>
                                                <td style={ss.td}>
                                                    {row.activeLoans?.filter(l => l.quantity > 0).map((l, idx) => (
                                                        <div key={idx} style={ss.badge}>{l.workerName} ({l.quantity})</div>
                                                    )) || <span style={{color: '#3b4a54'}}>Almacén</span>}
                                                </td>
                                            </tr>
                                        )
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </main>
        </div>
    );
};

const ss = {
    layout: { backgroundColor: '#0b141a', minHeight: '100vh', color: '#e9edef', fontFamily: 'Segoe UI, Roboto, Helvetica, Arial, sans-serif' },
    tabBar: { display: 'flex', backgroundColor: '#202c33', borderBottom: '1px solid #2a3942', overflowX: 'auto' },
    tabActive: { flex: 1, padding: '15px', color: '#00ffa3', border: 'none', borderBottom: '3px solid #00ffa3', backgroundColor: 'transparent', cursor: 'pointer', fontWeight: 'bold', fontSize: '11px', minWidth: '130px' },
    tabInactive: { flex: 1, padding: '15px', color: '#8696a0', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', fontSize: '11px', minWidth: '130px' },
    mainContent: { padding: '15px' },
    searchInput: { width: '100%', padding: '12px', borderRadius: '8px', border: 'none', backgroundColor: '#202c33', color: 'white', marginBottom: '15px', outline: 'none', boxSizing: 'border-box' },
    loanGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '15px' },
    workerCard: { backgroundColor: '#111b21', borderRadius: '10px', padding: '15px', border: '1px solid #2a3942' },
    workerHeader: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px', borderBottom: '1px solid #202c33', paddingBottom: '8px' },
    workerName: { fontWeight: 'bold', color: '#e9edef', fontSize: '14px' },
    loanItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #1c272d' },
    loanInfo: { display: 'flex', flexDirection: 'column' },
    loanQty: { color: '#00ffa3', fontSize: '12px', fontWeight: 'bold' },
    loanName: { fontSize: '13px', color: '#d1d7db' },
    loanActions: { display: 'flex', gap: '8px' },
    actionBtn: { background: '#202c33', border: 'none', color: '#34b7f1', padding: '6px', borderRadius: '5px', cursor: 'pointer' },
    tableContainer: { backgroundColor: '#111b21', borderRadius: '10px', overflowX: 'auto' },
    table: { width: '100%', borderCollapse: 'collapse', minWidth: '950px' },
    th: { padding: '12px', textAlign: 'left', color: '#8696a0', backgroundColor: '#202c33', fontSize: '11px', textTransform: 'uppercase' },
    td: { padding: '12px', borderBottom: '1px solid #222d34', fontSize: '13px' },
    tr: { borderBottom: '1px solid #2a3942' },
    opBadge: (isSalida) => ({ padding: '3px 7px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold', backgroundColor: isSalida ? '#3d1a1a' : '#1a3d2e', color: isSalida ? '#ff5555' : '#00ffa3' }),
    badge: { backgroundColor: '#2a3942', color: '#34b7f1', padding: '2px 8px', borderRadius: '10px', fontSize: '10px', display: 'inline-block', marginRight: '4px' }
};

export default InventoryPage;