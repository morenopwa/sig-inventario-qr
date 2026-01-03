import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import useAuth from '../hooks/useAuth'; 
import SpeechRecognition from '../components/SpeechRecognition'; 
import RegisterItemModal from '../components/RegisterItemModal';

const apiUrl = import.meta.env.VITE_API_URL;

const InventoryPage = () => { 
    // 1. Extraemos los datos del hook de autenticación
    const { user, isUsuario } = useAuth();
    const nivel = user?.nivelAcceso;
    const cargo = user?.cargo;

    // 2. Definimos quién puede editar (SuperAdmin, Admin o el cargo Almacenero)
    const isAlmacenero = ['SuperAdmin', 'Admin'].includes(nivel) || cargo === 'Almacenero';

    // 3. ESTADOS (Faltaban en tu código anterior)
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [refreshTrigger, setRefreshTrigger] = useState(0); 
    const [sortConfig, setSortConfig] = useState({ key: 'qrCode', direction: 'ascending' });
    const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

    // 4. Cargar datos de la API
    const fetchItems = useCallback(async () => {
        if (isUsuario) return; // Si es un usuario externo, no ve inventario
        setLoading(true);
        try {
            const response = await axios.get(`${apiUrl}/api/inventory/items`);
            setItems(response.data);
        } catch (error) {
            console.error('Error al cargar items:', error);
        } finally {
            setLoading(false);
        }
    }, [isUsuario]); 

    useEffect(() => {
        fetchItems();
    }, [fetchItems, refreshTrigger]); 

    // 5. Lógica de Ordenamiento y Filtro
    const requestSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') direction = 'descending';
        setSortConfig({ key, direction });
    };

    const sortedItems = useMemo(() => {
        let sortableItems = [...items];
        sortableItems.sort((a, b) => {
            if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'ascending' ? -1 : 1;
            if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'ascending' ? 1 : -1;
            return 0;
        });
        return sortableItems;
    }, [items, sortConfig]);

    const filteredItems = sortedItems.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.qrCode.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // 6. Funciones de Acción
    const handleAddStock = async (item, cantidadSolicitada) => {
        try {
            const res = await axios.post(`${apiUrl}/api/transactions`, {
                cantidad: cantidadSolicitada,
                itemName: item.name,
                persona: user?.name || 'Admin', // Corregido de currentUser a user
                tipo: 'ingreso',
                timestamp: new Date().toISOString()
            });

            if (res.data.success) {
                await fetchItems(); 
                console.log("Stock actualizado");
            }
        } catch (error) {
            alert("Error: " + (error.response?.data?.error || "No se pudo actualizar"));
        }
    };

    return (
        <div style={s.layout}>
            <header style={s.header}>
                <div style={s.userInfo}>
                    <div style={s.onlineDot}></div>
                    <span style={s.userName}>
                        <strong>{user?.name}</strong> <small style={{color: '#8696a0'}}>({cargo || nivel})</small>
                    </span>
                </div>
                <h2 style={{color: 'white', margin: 0, fontSize: '16px'}}>Inventario General 📦</h2>
            </header>

            <main style={s.mainContent}>
                <div className="inventory-page-container" style={{padding: '20px'}}>
                    <div className="inventory-controls-bar" style={{display: 'flex', gap: '10px', marginBottom: '20px'}}>
                        {isAlmacenero && (
                            <button onClick={() => setIsRegisterModalOpen(true)} style={s.btnPrimary}>
                                ➕ Registro Manual
                            </button>
                        )}
                        <input
                            type="text"
                            placeholder="Buscar herramienta o QR..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={s.searchInput}
                        />
                        <SpeechRecognition onCommandDetected={() => setRefreshTrigger(t => t+1)} isAlmacenero={isAlmacenero} />
                    </div>

                    {loading ? <p style={{color: 'white'}}>Cargando inventario...</p> : (
                        <div className="inventory-table-wrapper" style={s.tableContainer}>
                            <table style={s.table}>
                                <thead style={s.thead}>
                                    <tr>
                                        <th style={s.th} onClick={() => requestSort('qrCode')}>QR</th>
                                        <th style={s.th} onClick={() => requestSort('name')}>Nombre</th>
                                        <th style={s.th} onClick={() => requestSort('stock')}>Stock</th>
                                        <th style={s.th} onClick={() => requestSort('category')}>Categoría</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredItems.map(item => (
                                        <tr key={item._id} style={s.tr}>
                                            <td style={s.td}>{item.qrCode}</td>
                                            <td style={s.td}>{item.name}</td>
                                            <td style={{...s.td, fontWeight: 'bold', color: item.stock < 5 ? '#ff4d4d' : '#00a884'}}>
                                                {item.stock}
                                            </td>
                                            <td style={s.td}>{item.category}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </main>

            {isRegisterModalOpen && (
                <RegisterItemModal 
                    registeredBy={user?.name} 
                    onClose={() => setIsRegisterModalOpen(false)} 
                    onSuccess={() => {setRefreshTrigger(t => t+1); setIsRegisterModalOpen(false);}} 
                />
            )}
        </div>
    );
};

const s = {
    layout: { display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#0b141a' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 20px', backgroundColor: '#202c33', borderBottom: '1px solid #2a3942' },
    userInfo: { display: 'flex', alignItems: 'center', gap: '8px' },
    onlineDot: { width: '8px', height: '8px', backgroundColor: '#00a884', borderRadius: '50%' },
    userName: { color: '#e9edef', fontSize: '13px' },
    mainContent: { flex: 1, overflowY: 'auto' },
    searchInput: { flex: 1, padding: '10px', borderRadius: '5px', border: '1px solid #2a3942', backgroundColor: '#111b21', color: 'white' },
    btnPrimary: { backgroundColor: '#00a884', color: 'white', border: 'none', padding: '10px 15px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' },
    tableContainer: { backgroundColor: '#111b21', borderRadius: '10px', overflow: 'hidden' },
    table: { width: '100%', borderCollapse: 'collapse' },
    thead: { backgroundColor: '#202c33', color: '#8696a0' },
    th: { padding: '15px', textAlign: 'left', cursor: 'pointer', borderBottom: '1px solid #2a3942' },
    td: { padding: '15px', color: '#e9edef', borderBottom: '1px solid #222d34' },
    tr: { transition: 'background 0.2s' }
};

export default InventoryPage;