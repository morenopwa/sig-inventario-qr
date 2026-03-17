import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import axios from 'axios';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { User, RotateCcw, Search, Package, HardDrive, Settings } from 'lucide-react';

const InventoryPage = () => {
    const [items, setItems] = useState([]);
    const [movements, setMovements] = useState([]);
    const [activeTab, setActiveTab] = useState('Kardex Activo'); 
    const [searchTerm, setSearchTerm] = useState('');
    const [isSyncing, setIsSyncing] = useState(false); // Bloqueo para evitar el "reaparecido"
    const apiUrl = import.meta.env.VITE_API_URL;

    // --- CLASIFICACIÓN (Sin resumir) ---
    const classifyCategory = (name) => {
        if (!name) return 'Consumibles';
        const n = name.toUpperCase();
        const machinery = ['SOLDAR', 'ESMERIL', 'BURIL', 'COMPRESORA', 'GENERADOR', 'MOTOSIERRA', 'TROZADORA', 'APUNTALAR', 'APUNTAR', 'MAQUINA'];
        const epp = ['LENTE', 'GUANTE', 'CASCO', 'ZAPATO', 'CHALECO', 'ARNES', 'MASCARILLA', 'TAPON', 'OREJERA', 'RESPIRADOR', 'BOTAS', 'CONO'];
        const tools = ['MARTILLO', 'LLAVE', 'ALICATE', 'TALADRO', 'AMOLADORA', 'SIERRA', 'ROTOMARTILLO', 'PALA', 'PICO', 'ANDAMIO', 'PUNTAL', 'HUINCHA'];
        
        if (machinery.some(p => n.includes(p))) return 'Maquinaria';
        if (epp.some(p => n.includes(p))) return 'EPP';
        if (tools.some(p => n.includes(p))) return 'Herramientas';
        return 'Consumibles';
    };

    const fetchData = useCallback(async () => {
        if (isSyncing) return; // Si estamos devolviendo algo, no sobrescribimos el estado local todavía
        try {
            const [resItems, resMovs] = await Promise.all([
                axios.get(`${apiUrl}/api/inventory/items`),
                axios.get(`${apiUrl}/api/movements`) 
            ]);
            setItems(resItems.data || []);
            setMovements(resMovs.data || []);
        } catch (e) { console.error("Error de carga:", e); }
    }, [apiUrl, isSyncing]);

    useEffect(() => { fetchData(); }, [fetchData]);

    // --- LÓGICA DE PRÉSTAMOS: BÚSQUEDA + ORDEN ALFABÉTICO ---
    const loansByWorker = useMemo(() => {
        const workers = {};
        const search = searchTerm.toLowerCase();

        items.forEach(item => {
            const category = item.category && item.category !== 'General' ? item.category : classifyCategory(item.name);
            
            // FILTRADO: Solo Maquinaria, Herramientas y EPP en esta pestaña
            if (category !== 'Consumibles' && item.activeLoans) {
                item.activeLoans.forEach(loan => {
                    if (loan.quantity > 0) {
                        const matchesSearch = 
                            loan.workerName.toLowerCase().includes(search) || 
                            item.name.toLowerCase().includes(search);

                        if (matchesSearch) {
                            if (!workers[loan.workerName]) workers[loan.workerName] = [];
                            workers[loan.workerName].push({
                                ...loan,
                                itemName: item.name,
                                unit: item.unit,
                                itemId: item._id
                            });
                        }
                    }
                });
            }
        });

        // ORDEN ALFABÉTICO POR APELLIDO/NOMBRE (A-Z)
        return Object.keys(workers).sort((a, b) => a.localeCompare(b)).reduce((obj, key) => {
            obj[key] = workers[key];
            return obj;
        }, {});
    }, [items, searchTerm]);

    // --- FILTRADO DE TABLAS ---
    const filteredData = useMemo(() => {
        const search = searchTerm.toLowerCase();
        if (activeTab === 'Kardex Activo') {
            return movements
                .filter(m => (m.materialName || "").toLowerCase().includes(search) || (m.workerName || "").toLowerCase().includes(search))
                .sort((a, b) => new Date(b.date) - new Date(a.date));
        }
        if (activeTab === 'Préstamos') return []; 
        
        return items.filter(i => {
            const cat = i.category && i.category !== 'General' ? i.category : classifyCategory(i.name);
            return cat.toLowerCase() === activeTab.toLowerCase() && (i.name || "").toLowerCase().includes(search);
        });
    }, [activeTab, items, movements, searchTerm]);

    // --- DEVOLUCIÓN: ELIMINACIÓN REAL Y PREVENCIÓN DE REAPARICIÓN ---
    const handleQuickReturn = async (loan) => {
        if (!window.confirm(`¿Confirmar devolución de ${loan.quantity} ${loan.itemName} de ${loan.workerName}?`)) return;
        
        setIsSyncing(true); // Bloqueamos actualizaciones externas

        try {
            const timestampLocal = format(new Date(), "yyyy-MM-dd'T'HH:mm:ss");
            
            // 1. ELIMINAR DEL ESTADO LOCAL (Desaparece del card YA)
            setItems(prev => prev.map(item => {
                if (item._id === loan.itemId) {
                    return {
                        ...item,
                        stock: item.stock + loan.quantity,
                        activeLoans: item.activeLoans.filter(l => l.workerName !== loan.workerName)
                    };
                }
                return item;
            }));

            // 2. REGISTRAR EN BACKEND
            await axios.post(`${apiUrl}/api/transactions`, {
                quantity: loan.quantity,
                unit: loan.unit,
                itemName: loan.itemName,
                personName: loan.workerName,
                type: 'IN',
                timestamp: timestampLocal
            });
            
            // 3. ESPERA DE SEGURIDAD (Para que el DB procese antes de pedir datos)
            setTimeout(() => {
                setIsSyncing(false); // Desbloqueamos
                fetchData(); // Sincronizamos versión final
            }, 800);

        } catch (e) {
            alert("Error al devolver");
            setIsSyncing(false);
            fetchData();
        }
    };

    return (
        <div style={ss.layout}>
            {/* TABS */}
            <div style={ss.tabBar}>
                {['Kardex Activo', 'Préstamos', 'Maquinaria', 'Herramientas', 'Consumibles', 'EPP'].map(t => (
                    <button key={t} onClick={() => { setActiveTab(t); setSearchTerm(''); }} style={activeTab === t ? ss.tabActive : ss.tabInactive}>
                        {t.toUpperCase()}
                    </button>
                ))}
            </div>

            <main style={ss.mainContent}>
                {/* BUSCADOR GLOBAL */}
                <div style={ss.searchContainer}>
                    <Search size={18} color="#8696a0" style={ss.searchIcon} />
                    <input 
                        placeholder="Buscar material o trabajador..." 
                        value={searchTerm} 
                        onChange={e => setSearchTerm(e.target.value)} 
                        style={ss.searchInput} 
                    />
                </div>
                
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
                                        <button onClick={() => handleQuickReturn(loan)} style={ss.actionBtn}>
                                            <RotateCcw size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div style={ss.tableContainer}>
                        <table style={ss.table}>
                            <thead style={ss.thead}>
                                <tr>
                                    {activeTab === 'Kardex Activo' ? (
                                        <>
                                            <th style={ss.th}>Día</th><th style={ss.th}>Fecha</th><th style={ss.th}>Material</th>
                                            <th style={ss.th}>Und.</th><th style={ss.th}>Tipo</th><th style={ss.th}>Ent.</th>
                                            <th style={ss.th}>Sal.</th><th style={ss.th}>Responsable</th>
                                        </>
                                    ) : (
                                        <>
                                            <th style={ss.th}>Material</th><th style={ss.th}>Und.</th>
                                            <th style={ss.th}>Almacén</th><th style={ss.th}>Total</th>
                                            <th style={ss.th}>{activeTab === 'Consumibles' ? 'Últimos Entregados' : 'Préstamos Activos'}</th>
                                        </>
                                    )}
                                </tr>
                            </thead>
                            <tbody>
                                {filteredData.map((row, i) => (
                                    <tr key={i} style={ss.tr}>
                                        {activeTab === 'Kardex Activo' ? (
                                            <>
                                                <td style={{...ss.td, color: '#00ffa3'}}>{format(parseISO(row.date.split('.')[0]), "EEEE", {locale:es})}</td>
                                                <td style={ss.td}>{format(parseISO(row.date.split('.')[0]), "dd/MM HH:mm")}</td>
                                                <td style={ss.td}><strong>{row.materialName}</strong></td>
                                                <td style={ss.td}>{row.unit}</td>
                                                <td style={ss.td}><span style={ss.opBadge((row.type || "").includes('SALIDA'))}>{row.type}</span></td>
                                                <td style={{...ss.td, color: '#00ffa3'}}>{!(row.type || "").includes('SALIDA') ? row.quantity : '-'}</td>
                                                <td style={{...ss.td, color: '#ff5555'}}>{(row.type || "").includes('SALIDA') ? row.quantity : '-'}</td>
                                                <td style={ss.td}><strong>{row.workerName}</strong></td>
                                            </>
                                        ) : (
                                            <>
                                                <td style={ss.td}><strong>{row.name}</strong></td>
                                                <td style={ss.td}>{row.unit}</td>
                                                <td style={{...ss.td, color: '#00ffa3', fontWeight: 'bold'}}>{row.stock}</td>
                                                <td style={{...ss.td, color: '#34b7f1'}}>{row.totalStock || row.stock}</td>
                                                <td style={ss.td}>
                                                    {row.activeLoans?.filter(l => l.quantity > 0).map((l, idx) => (
                                                        <div key={idx} style={ss.badge}>{l.workerName} ({l.quantity})</div>
                                                    )) || <span style={{color: '#3b4a54', fontSize: '10px'}}>Sin préstamos</span>}
                                                </td>
                                            </>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </main>
        </div>
    );
};

const ss = {
    layout: { backgroundColor: '#0b141a', minHeight: '100vh', color: '#e9edef', fontFamily: 'sans-serif' },
    tabBar: { display: 'flex', backgroundColor: '#202c33', borderBottom: '1px solid #2a3942', overflowX: 'auto', position: 'sticky', top: 0, zIndex: 10 },
    tabActive: { flex: 1, padding: '15px', color: '#00ffa3', border: 'none', borderBottom: '3px solid #00ffa3', backgroundColor: 'transparent', fontWeight: 'bold', fontSize: '11px', minWidth: '120px', cursor: 'pointer' },
    tabInactive: { flex: 1, padding: '15px', color: '#8696a0', border: 'none', backgroundColor: 'transparent', fontSize: '11px', minWidth: '120px', cursor: 'pointer' },
    mainContent: { padding: '15px' },
    searchContainer: { position: 'relative', marginBottom: '15px' },
    searchIcon: { position: 'absolute', left: '12px', top: '12px' },
    searchInput: { width: '100%', padding: '12px 12px 12px 40px', borderRadius: '8px', border: 'none', backgroundColor: '#202c33', color: 'white', outline: 'none' },
    loanGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '15px' },
    workerCard: { backgroundColor: '#111b21', borderRadius: '10px', padding: '15px', border: '1px solid #2a3942' },
    workerHeader: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px', borderBottom: '1px solid #202c33', paddingBottom: '8px' },
    workerName: { fontWeight: 'bold', fontSize: '14px' },
    loanItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #1c272d' },
    loanInfo: { display: 'flex', flexDirection: 'column' },
    loanQty: { color: '#00ffa3', fontSize: '12px', fontWeight: 'bold' },
    loanName: { fontSize: '13px', color: '#8696a0' },
    actionBtn: { background: '#202c33', border: 'none', color: '#34b7f1', padding: '8px', borderRadius: '5px', cursor: 'pointer' },
    tableContainer: { backgroundColor: '#111b21', borderRadius: '10px', overflowX: 'auto' },
    table: { width: '100%', borderCollapse: 'collapse', minWidth: '900px' },
    th: { padding: '12px', textAlign: 'left', color: '#8696a0', backgroundColor: '#202c33', fontSize: '11px', textTransform: 'uppercase' },
    td: { padding: '12px', borderBottom: '1px solid #222d34', fontSize: '13px' },
    tr: { borderBottom: '1px solid #2a3942' },
    opBadge: (isS) => ({ padding: '3px 7px', borderRadius: '4px', fontSize: '10px', backgroundColor: isS ? '#3d1a1a' : '#1a3d2e', color: isS ? '#ff5555' : '#00ffa3' }),
    badge: { backgroundColor: '#2a3942', color: '#34b7f1', padding: '2px 8px', borderRadius: '10px', fontSize: '10px', marginRight: '4px', marginTop: '4px', display: 'inline-block' }
};

export default InventoryPage;