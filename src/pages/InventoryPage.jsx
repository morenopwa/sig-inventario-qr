import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

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
            console.error("Error cargando inventario/kardex:", e); 
        }
    }, [apiUrl]);

    useEffect(() => { 
        fetchData(); 
    }, [fetchData]);

    // SOLUCIÓN DEFINITIVA PARA LA FECHA:
    // Forzamos la interpretación de la fecha como local ignorando desfases UTC
    const formatDisplayDate = (dateString) => {
        if (!dateString) return { dia: '-', hora: '-' };
        
        // Reemplazamos la 'Z' o cualquier desfase para tratarlo como hora local pura
        const cleanDate = dateString.split('.')[0].replace('Z', '');
        const date = parseISO(cleanDate);

        return {
            dia: format(date, "EEEE", { locale: es }),
            completa: format(date, "dd/MM/yy HH:mm")
        };
    };

    const filteredData = useMemo(() => {
        const search = searchTerm.toLowerCase();
        
        if (activeTab === 'Kardex Activo') {
            return movements
                .filter(m => 
                    (m.materialName || "").toLowerCase().includes(search) || 
                    (m.workerName || "").toLowerCase().includes(search)
                )
                .sort((a, b) => new Date(b.date) - new Date(a.date));
        }

        return items.filter(i => {
            const cat = i.category && i.category !== 'General' ? i.category : classifyCategory(i.name);
            return cat.toLowerCase() === activeTab.toLowerCase() && 
                    (i.name || "").toLowerCase().includes(search);
        });
    }, [activeTab, items, movements, searchTerm]);

    return (
        <div style={ss.layout}>
            <div style={ss.tabBar}>
                {['Kardex Activo', 'Herramientas', 'Consumibles', 'EPP'].map(t => (
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
                    placeholder="🔍 Buscar material o trabajador..." 
                    value={searchTerm} 
                    onChange={e => setSearchTerm(e.target.value)} 
                    style={ss.searchInput} 
                />
                
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
                                        No se encontraron registros en {activeTab}
                                    </td>
                                </tr>
                            ) : (
                                filteredData.map((row, i) => {
                                    if (activeTab === 'Kardex Activo') {
                                        const isSalida = (row.type || "").includes('SALIDA');
                                        const fechaInfo = formatDisplayDate(row.date);
                                        
                                        return (
                                            <tr key={i} style={ss.tr}>
                                                <td style={{...ss.td, color: '#00ffa3', textTransform: 'capitalize'}}>
                                                    {fechaInfo.dia}
                                                </td>
                                                <td style={ss.td}>{fechaInfo.completa}</td>
                                                <td style={ss.td}><strong>{row.materialName}</strong></td>
                                                <td style={ss.td}>{row.unit}</td>
                                                <td style={ss.td}>
                                                    <span style={ss.opBadge(isSalida)}>{row.type}</span>
                                                </td>
                                                <td style={{...ss.td, color: '#00ffa3'}}>
                                                    {!isSalida ? row.quantity : '-'}
                                                </td>
                                                <td style={{...ss.td, color: '#ff5555'}}>
                                                    {isSalida ? row.quantity : '-'}
                                                </td>
                                                <td style={ss.td}><strong>{row.workerName}</strong></td>
                                            </tr>
                                        );
                                    } else {
                                        const total = row.totalStock || row.stock;
                                        return (
                                            <tr key={i} style={ss.tr}>
                                                <td style={ss.td}><strong>{row.name}</strong></td>
                                                <td style={ss.td}>{row.unit}</td>
                                                <td style={{...ss.td, color: row.stock <= 0 ? '#ff5555' : '#00ffa3', fontWeight: 'bold'}}>
                                                    {row.stock}
                                                </td>
                                                <td style={{...ss.td, color: '#34b7f1'}}>{total}</td>
                                                <td style={ss.td}>
                                                    {(() => {
                                                        const grouped = row.activeLoans?.reduce((acc, curr) => {
                                                            acc[curr.workerName] = (acc[curr.workerName] || 0) + curr.quantity;
                                                            return acc;
                                                        }, {});
                                                        const entries = Object.entries(grouped || {}).filter(([_, q]) => q > 0);
                                                        return entries.length > 0 ? entries.map(([name, qty], idx) => (
                                                            <div key={idx} style={ss.badge}>{name} ({qty})</div>
                                                        )) : <span style={{color: '#3b4a54'}}>Almacén</span>;
                                                    })()}
                                                </td>
                                            </tr>
                                        );
                                    }
                                })
                            )}
                        </tbody>
                    </table>
                </div>
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
    tableContainer: { backgroundColor: '#111b21', borderRadius: '10px', overflowX: 'auto' },
    table: { width: '100%', borderCollapse: 'collapse', minWidth: '950px' },
    th: { padding: '12px', textAlign: 'left', color: '#8696a0', backgroundColor: '#202c33', fontSize: '11px', textTransform: 'uppercase' },
    td: { padding: '12px', borderBottom: '1px solid #222d34', fontSize: '13px' },
    tr: { borderBottom: '1px solid #2a3942' },
    opBadge: (isSalida) => ({ padding: '3px 7px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold', backgroundColor: isSalida ? '#3d1a1a' : '#1a3d2e', color: isSalida ? '#ff5555' : '#00ffa3' }),
    badge: { backgroundColor: '#2a3942', color: '#34b7f1', padding: '2px 8px', borderRadius: '10px', fontSize: '10px', display: 'inline-block', marginRight: '4px', marginBottom: '2px', border: '1px solid #3b4a54' }
};

export default InventoryPage;