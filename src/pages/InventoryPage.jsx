import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import useAuth from '../hooks/useAuth'; 
import SpeechRecognition from '../components/SpeechRecognition'; 
import ItemRow from '../components/ItemRow'; // Nota: ItemRow ya no se usa directamente en la tabla, pero se mantiene si lo necesitas en otro lugar
import RegisterItemModal from '../components/RegisterItemModal';
import ItemHistoryModal from '../components/ItemHistoryModal';

const apiUrl = import.meta.env.VITE_API_URL;

const InventoryPage = () => { 
    const { user } = useAuth();
    const isAlmacenero = user?.role === 'Almacenero' || user?.role === 'SuperAdmin';
    
    // Estados de datos y UI
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [refreshTrigger, setRefreshTrigger] = useState(0); 

    // Estados para Ordenamiento
    const [sortConfig, setSortConfig] = useState({ key: 'qrCode', direction: 'ascending' });

    // Estados de Modales
    const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [selectedItemData, setSelectedItemData] = useState(null);

    // Función para recargar la lista de ítems
    const fetchItems = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${apiUrl}/api/items`);
            const sorted = response.data.sort((a, b) => 
                new Date(b.updatedAt) - new Date(a.updatedAt)
            );
            setItems(sorted);
        } catch (error) {
            console.error('Error al obtener la lista de ítems:', error);
        } finally {
            setLoading(false);
        }
    }, []); 

    useEffect(() => {
        fetchItems();
    }, [fetchItems, refreshTrigger]); 
    
    // --- Lógica de Eliminación de Ítem ---
    const handleDeleteItem = async (item) => {
        if (!isAlmacenero) {
            alert("Permiso denegado. Solo Almaceneros o SuperAdmins pueden eliminar ítems.");
            return;
        }

        const confirmDelete = window.confirm(
            `¿Estás seguro de que quieres eliminar COMPLETAMENTE el ítem: ${item.name} (${item.qrCode})? Esta acción es irreversible.`
        );

        if (confirmDelete) {
            try {
                // Asumiendo que tu backend tiene una ruta DELETE /api/items/:id
                await axios.delete(`${apiUrl}/api/items/${item._id}`);
                alert(`Ítem "${item.name}" eliminado exitosamente.`);
                setRefreshTrigger(prev => prev + 1); // Forzar la recarga de la tabla
            } catch (error) {
                console.error('Error al eliminar el ítem:', error);
                alert(`Fallo al eliminar el ítem: ${error.response?.data?.message || error.message}`);
            }
        }
    };
    // -------------------------------------

    // --- Lógica de Stock ---
    const handleAddStock = async (item) => {
        if (!isAlmacenero) {
        alert("Permiso denegado.");
        return;
        }
        const newStock = prompt(`Añadir stock a ${item.name} (Stock actual: ${item.stock}). Ingrese cantidad a añadir:`);
        const quantityToAdd = parseInt(newStock, 10);
        
        if (isNaN(quantityToAdd) || quantityToAdd <= 0) {
            alert("Cantidad inválida.");
            return;
        }
         try {
            // 🔑 LLAMADA A LA API PARA AÑADIR STOCK
            // Se asume el endpoint: POST /api/items/stock
            await axios.post(`${apiUrl}/api/items/stock`, { 
                itemId: item._id, 
                quantity: quantityToAdd,
                validatedBy: user?.name // Registrar quién hizo la adición
            });

            alert(`Stock de ${item.name} aumentado en ${quantityToAdd} unidades.`);
            
            // Disparar la recarga y actualizar el orden (se verá primero)
            setRefreshTrigger(prev => prev + 1); 

        } catch (error) {
            console.error('Error al añadir stock:', error);
            alert(`Fallo al añadir stock: ${error.response?.data?.message || error.message}`);
        }
        alert(`Simulando: Añadiendo ${quantityToAdd} unidades a ${item.name}.`);
        setRefreshTrigger(prev => prev + 1);
    };


    const closeAllModals = () => {
        setIsRegisterModalOpen(false);
        setIsHistoryModalOpen(false);
        setSelectedItemData(null);
    };

    // --- Lógica de Ordenamiento (Sin cambios) ---
    const sortedItems = React.useMemo(() => {
        let sortableItems = [...items];
        if (sortConfig !== null) {
            sortableItems.sort((a, b) => {
                const aValue = a[sortConfig.key];
                const bValue = b[sortConfig.key];

                if (aValue < bValue) {
                    return sortConfig.direction === 'ascending' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'ascending' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableItems;
    }, [items, sortConfig]);

    const requestSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const getClassNamesFor = (name) => {
        if (!sortConfig) {
            return;
        }
        return sortConfig.key === name ? sortConfig.direction : undefined;
    };
    
    // --- Lógica de Registro por Voz (Sin cambios) ---
    const handleVoiceAction = async (command, data) => {
        if (command !== 'REGISTER') return;
        
        try {
            const almacenero = user?.name || 'Sistema Voz'; 
            const dataToSend = {
                name: data.name,
                category: data.category || 'Otros',
                stock: data.stock || 1,
                isConsumible: data.isConsumible || false,
                registeredBy: almacenero,
            };

            await axios.post(`${apiUrl}/api/items`, dataToSend);
            console.log(`✅ Registro de ${data.name} exitoso (Voz).`);
            setRefreshTrigger(prev => prev + 1); 
            
        } catch (error) {
            console.error(`❌ Error en registro por Voz:`, 
                error.response?.data?.message || error.message || error);
        }
    };
    // -----------------------------------------------------

    const filteredItems = sortedItems.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.qrCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <main className="inventory-page-container">
            <h1>Inventario General de Stock 📦</h1>
            
            <div className="inventory-controls-bar">
                
                {isAlmacenero && (
                    <button 
                        onClick={() => setIsRegisterModalOpen(true)} 
                        className="btn btn-register-manual"
                    >
                        ➕ Registro Manual
                    </button>
                )}
                
                <div className="search-input-group">
                    <input
                        type="text"
                        placeholder="Buscar QR, Nombre o Categoría..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input-fancy"
                    />
                </div>
                
                <SpeechRecognition 
                    onCommandDetected={handleVoiceAction} 
                    isAlmacenero={isAlmacenero}
                />
            </div>
            
            {loading ? (
                <p>Cargando inventario...</p>
            ) : (
                <div className="inventory-table-wrapper">
                    <div className="table-responsive-scroll"> 
                        <table className="item-table sortable-table">
                            <thead>
                                <tr>
                                    {/* Columnas para ordenar */}
                                    <th className={`sortable ${getClassNamesFor('qrCode')}`} onClick={() => requestSort('qrCode')}>
                                        QR Code
                                    </th>
                                    <th className={`sortable ${getClassNamesFor('name')}`} onClick={() => requestSort('name')}>
                                        Nombre
                                    </th>
                                    
                                    <th className={`sortable ${getClassNamesFor('stock')}`} onClick={() => requestSort('stock')}>
                                        Stock
                                    </th>
                                    <th className={`sortable ${getClassNamesFor('updatedAt')}`} onClick={() => requestSort('updatedAt')}>
                                        Última Modificación
                                    </th>
                                    <th className={`sortable ${getClassNamesFor('category')}`} onClick={() => requestSort('category')}>
                                        Categoría
                                    </th>
                                    {/* Columnas de Acciones */}
                                    {isAlmacenero && (
                                        <th className="action-col">
                                            Añadir Stock
                                        </th>
                                    )}
                                    {isAlmacenero && (
                                        <th className="action-col">
                                            Eliminar
                                        </th>
                                    )}
                                </tr>
                            </thead>
                            <tbody>
                                {filteredItems.map(item => (
                                    <tr key={item._id}>
                                        <td>{item.qrCode}</td>
                                        <td>{item.name}</td>
                                        <td>{item.stock}</td>
                                        <td>{new Date(item.updatedAt).toLocaleDateString()}</td>
                                        <td>{item.category}</td>
                                        
                                        {/* Botón de Añadir Stock */}
                                        {isAlmacenero && (
                                            <td>
                                                <button 
                                                    onClick={() => handleAddStock(item)} 
                                                    className="btn btn-add-stock"
                                                >
                                                    + Stock
                                                </button>
                                            </td>
                                        )}
                                        
                                        {/* 🔑 Botón de Eliminar Elemento */}
                                        {isAlmacenero && (
                                            <td>
                                                <button 
                                                    onClick={() => handleDeleteItem(item)} 
                                                    className="btn btn-delete-item"
                                                >
                                                    ❌ Eliminar
                                                </button>
                                            </td>
                                        )}

                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
            
            {isRegisterModalOpen && (
                <RegisterItemModal
                    registeredBy={user?.name}
                    onClose={closeAllModals}
                    onSuccess={() => {
                    // Asegúrate de que ambas cosas sucedan: recargar Y cerrar
                    setRefreshTrigger(prev => prev + 1);
                    closeAllModals(); // ⬅️ Asegurar que closeAllModals se ejecuta
        }}
                />
            )}
            
            {/* El modal ItemHistoryModal ahora solo muestra historial, sin botones de eliminar */}
            {isHistoryModalOpen && selectedItemData && (
                <ItemHistoryModal
                    item={selectedItemData}
                    onClose={closeAllModals}
                />
            )}
        </main>
    );
};

export default InventoryPage;