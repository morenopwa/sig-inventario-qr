import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import useAuth from '../hooks/useAuth'; 
import RegisterItemModal from '../components/RegisterItemModal';
import LoanModal from '../components/LoanModal';

const apiUrl = import.meta.env.VITE_API_URL;

const InventoryPage = () => { 
    const { user, isUsuario } = useAuth();
    
    // Estados principales
    const [items, setItems] = useState([]);
    const [activeLoans, setActiveLoans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('Herramientas');
    const [refreshTrigger, setRefreshTrigger] = useState(0); 
    
    // Estados de Modales
    const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
    const [selectedItemForLoan, setSelectedItemForLoan] = useState(null);

    // Permisos
    const isAlmacenero = ['SuperAdmin', 'Admin'].includes(user?.nivelAcceso) || user?.role === 'Almacenero';

    // Función para obtener datos (Items o Préstamos según pestaña)
    const fetchData = useCallback(async () => {
        if (isUsuario) return;
        setLoading(true);
        try {
            if (activeTab === 'Préstamos') {
                const response = await axios.get(`${apiUrl}/api/inventory/active-loans`);
                setActiveLoans(response.data);
            } else {
                const response = await axios.get(`${apiUrl}/api/inventory/items`);
                setItems(response.data);
            }
        } catch (error) {
            console.error('Error al cargar datos:', error);
        } finally {
            setLoading(false);
        }
    }, [activeTab, isUsuario, refreshTrigger]);

    useEffect(() => { 
        fetchData(); 
    }, [fetchData]);

    // Filtrado de Items (Herramientas, Consumibles, Maquinaria)
    const filteredItems = useMemo(() => {
        if (activeTab === 'Préstamos') return [];
        return items.filter(item => {
            const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                 item.customId?.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesTab = item.category === activeTab;
            return matchesSearch && matchesTab;
        });
    }, [items, searchTerm, activeTab]);

    // Lógica para devolver herramienta
    const handleReturn = async (loanId) => {
        if (!window.confirm("¿Confirmar que el trabajador devolvió la herramienta?")) return;
        try {
            const res = await axios.put(`${apiUrl}/api/inventory/return/${loanId}`);
            alert("✅ " + res.data.message);
            setRefreshTrigger(t => t + 1);
        } catch (error) {
            alert("❌ Error al procesar devolución");
        }
    };

    return (
        <div style={s.layout}>
            {/* CABECERA */}
            <header style={s.header}>
                <div style={s.userInfo}>
                    <div style={s.onlineDot}></div>
                    <span style={s.userName}>
                        <strong>{user?.name}</strong> <small>({user?.role || user?.nivelAcceso})</small>
                    </span>
                </div>
                <h2 style={s.title}>Control de Inventario 📦</h2>
            </header>

            {/* BARRA DE PESTAÑAS */}
            <div style={s.tabBar}>
                {['Herramientas', 'Consumibles', 'Maquinaria', 'Préstamos'].map(tab => (
                    <button 
                        key={tab} 
                        onClick={() => { setActiveTab(tab); setSearchTerm(''); }} 
                        style={activeTab === tab ? s.tabActive : s.tabInactive}
                    >
                        {tab}
                        {tab === 'Préstamos' && activeLoans.length > 0 && (
                            <span style={s.badge}>{activeLoans.length}</span>
                        )}
                    </button>
                ))}
            </div>

            <main style={s.mainContent}>
                <div style={{padding: '20px'}}>
                    {/* CONTROLES (Buscador y botón nuevo) */}
                    <div style={s.controls}>
                        {isAlmacenero && activeTab !== 'Préstamos' && (
                            <button onClick={() => setIsRegisterModalOpen(true)} style={s.btnPrimary}>
                                ➕ Nuevo Item
                            </button>
                        )}
                        {activeTab !== 'Préstamos' && (
                            <input
                                type="text"
                                placeholder={`Buscar en ${activeTab}...`}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={s.searchInput}
                            />
                        )}
                    </div>

                    {loading ? (
                        <div style={s.loader}>Cargando datos...</div>
                    ) : (
                        <div style={s.tableContainer}>
                            <table style={s.table}>
                                <thead style={s.thead}>
                                    {activeTab === 'Préstamos' ? (
                                        <tr>
                                            <th style={s.th}>Trabajador</th>
                                            <th style={s.th}>Herramienta</th>
                                            <th style={s.th}>Fecha Salida</th>
                                            <th style={s.th}>Acción</th>
                                        </tr>
                                    ) : (
                                        <tr>
                                            <th style={s.th}>Código/QR</th>
                                            <th style={s.th}>Nombre</th>
                                            <th style={s.th}>Stock</th>
                                            <th style={s.th}>Unidad</th>
                                            <th style={s.th}>Acción</th>
                                        </tr>
                                    )}
                                </thead>
                                <tbody>
                                    {/* RENDERIZADO DE PRÉSTAMOS */}
                                    {activeTab === 'Préstamos' ? (
                                        activeLoans.map(loan => (
                                            <tr key={loan._id} style={s.tr}>
                                                <td style={s.td}>
                                                    <div style={{fontWeight: 'bold'}}>{loan.worker?.name} {loan.worker?.lastName}</div>
                                                    <small style={{color: '#8696a0'}}>{loan.worker?.customId}</small>
                                                </td>
                                                <td style={s.td}>{loan.item?.name}</td>
                                                <td style={s.td}>{new Date(loan.createdAt).toLocaleString()}</td>
                                                <td style={s.td}>
                                                    <button onClick={() => handleReturn(loan._id)} style={s.btnReturn}>
                                                        Recibir
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        /* RENDERIZADO DE ITEMS */
                                        filteredItems.map(item => (
                                            <tr key={item._id} style={s.tr}>
                                                <td style={s.td}>{item.customId}</td>
                                                <td style={s.td}>{item.name}</td>
                                                <td style={{...s.td, color: item.stock <= item.minStock ? '#ff4d4d' : '#00a884', fontWeight: 'bold'}}>
                                                    {item.stock}
                                                </td>
                                                <td style={s.td}>{item.unit}</td>
                                                <td style={s.td}>
                                                    {item.category === 'Herramientas' ? (
                                                        <button 
                                                            onClick={() => setSelectedItemForLoan(item)}
                                                            disabled={item.stock <= 0}
                                                            style={item.stock > 0 ? s.btnAction : s.btnDisabled}
                                                        >
                                                            {item.stock > 0 ? 'Prestar' : 'Sin Stock'}
                                                        </button>
                                                    ) : (
                                                        <span style={{color: '#8696a0', fontSize: '12px'}}>Solo lectura</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                            {((activeTab === 'Préstamos' && activeLoans.length === 0) || (activeTab !== 'Préstamos' && filteredItems.length === 0)) && (
                                <div style={s.emptyState}>No hay registros para mostrar.</div>
                            )}
                        </div>
                    )}
                </div>
            </main>

            {/* MODAL REGISTRO NUEVO ITEM */}
            {isRegisterModalOpen && (
                <RegisterItemModal 
                    onClose={() => setIsRegisterModalOpen(false)} 
                    onSuccess={() => {setRefreshTrigger(t => t+1); setIsRegisterModalOpen(false);}} 
                />
            )}

            {/* MODAL ESCANEO PRÉSTAMO */}
            {selectedItemForLoan && (
                <LoanModal 
                    item={selectedItemForLoan} 
                    onClose={() => setSelectedItemForLoan(null)}
                    onSuccess={() => {setRefreshTrigger(t => t+1); setSelectedItemForLoan(null);}}
                />
            )}
        </div>
    );
};

// ESTILOS (WhatsApp Dark Theme)
const s = {
    layout: { display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#0b141a', fontFamily: 'Segoe UI, Roboto, Helvetica, Arial, sans-serif' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 20px', backgroundColor: '#202c33', borderBottom: '1px solid #2a3942' },
    userInfo: { display: 'flex', alignItems: 'center', gap: '8px' },
    onlineDot: { width: '8px', height: '8px', backgroundColor: '#00a884', borderRadius: '50%' },
    userName: { color: '#e9edef', fontSize: '13px' },
    title: { color: 'white', margin: 0, fontSize: '16px' },
    tabBar: { display: 'flex', backgroundColor: '#202c33', padding: '0 10px', gap: '5px' },
    tabActive: { padding: '12px 20px', backgroundColor: 'transparent', color: '#00a884', border: 'none', borderBottom: '3px solid #00a884', cursor: 'pointer', fontWeight: 'bold', position: 'relative' },
    tabInactive: { padding: '12px 20px', backgroundColor: 'transparent', color: '#8696a0', border: 'none', cursor: 'pointer' },
    badge: { backgroundColor: '#00a884', color: 'white', fontSize: '10px', padding: '2px 6px', borderRadius: '10px', marginLeft: '5px' },
    mainContent: { flex: 1, overflowY: 'auto' },
    controls: { display: 'flex', gap: '10px', marginBottom: '20px' },
    searchInput: { flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #2a3942', backgroundColor: '#111b21', color: 'white', outline: 'none' },
    btnPrimary: { backgroundColor: '#00a884', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' },
    btnAction: { backgroundColor: '#00a88422', color: '#00a884', border: '1px solid #00a884', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' },
    btnReturn: { backgroundColor: '#34b7f122', color: '#34b7f1', border: '1px solid #34b7f1', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' },
    btnDisabled: { backgroundColor: '#2a3942', color: '#8696a0', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'not-allowed', fontSize: '12px' },
    tableContainer: { backgroundColor: '#111b21', borderRadius: '12px', overflow: 'hidden', border: '1px solid #2a3942' },
    table: { width: '100%', borderCollapse: 'collapse' },
    thead: { backgroundColor: '#202c33' },
    th: { padding: '15px', textAlign: 'left', color: '#8696a0', fontSize: '13px', fontWeight: 'normal' },
    td: { padding: '15px', color: '#e9edef', borderBottom: '1px solid #222d34', fontSize: '14px' },
    tr: { transition: 'background 0.2s' },
    loader: { color: '#8696a0', textAlign: 'center', padding: '40px' },
    emptyState: { padding: '30px', textAlign: 'center', color: '#8696a0', fontSize: '14px' }
};

export default InventoryPage;