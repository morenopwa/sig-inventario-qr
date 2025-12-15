import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import useAuth from '../hooks/useAuth'; 
import SpeechRecognition from '../components/SpeechRecognition'; // Asumiendo que has adaptado los comandos aquí
// Importamos un ícono simple para el micrófono
import { MicFill } from 'react-bootstrap-icons'; // Asegúrate de tener 'react-bootstrap-icons' instalado

const apiUrl = import.meta.env.VITE_API_URL;
const STATUS_TRANSLATIONS = {
    available: { text: 'Disponible', class: 'available' },
    borrowed: { text: 'Prestado', class: 'borrowed' },
    new: { text: 'Nuevo', class: 'new' }, // Si usas el estado 'new'
    // Puedes añadir más estados si los manejas en el backend
};

// -------------------------------------------------------------------
// 🔑 Componente Modal Genérico (Base para Préstamo/Devolución)
// -------------------------------------------------------------------
const TransactionModal = ({ isOpen, title, children, onClose }) => {
    if (!isOpen) return null;

    const handleBackdropClick = (e) => {
        // Si el clic ocurrió directamente en el 'modal-backdrop' (el div padre), cierra el modal.
        if (e.target.className === 'modal-backdrop') {
            onClose();
        }
    };
    // Estilos internos para asegurar que sea centrado y contrastado
    return (
        <div className="modal-backdrop" onClick={handleBackdropClick}>
            <div className="modal-content-centered">
                <div className="modal-header">
                    <h2>{title}</h2>
                    <button onClick={onClose} className="modal-close-btn">&times;</button>
                </div>
                <div className="modal-body">
                    {children}
                </div>
            </div>
        </div>
    );
};

// -------------------------------------------------------------------
// 🔑 Componente Principal TransactionView
// -------------------------------------------------------------------
const TransactionView = () => {
    const { user } = useAuth();
    const isAlmacenero = user?.role === 'Almacenero' || user?.role === 'SuperAdmin';
    const almaceneroName = user?.name || 'Sistema'; 

    // Estado para datos de la tabla
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusMessage, setStatusMessage] = useState({ type: '', message: '' });

    // Estado para modales
    const [isBorrowModalOpen, setIsBorrowModalOpen] = useState(false);
    const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null); // Ítem de la fila seleccionada

    // Estado para formularios (usado en modales)
    const [personName, setPersonName] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [notes, setNotes] = useState('');
    
    // Estado para pre-llenado de Voz
    const [voicePrefillData, setVoicePrefillData] = useState(null);

    // --- Funciones de Utilidad ---
    const clearFormStates = () => {
        setPersonName('');
        setQuantity(1);
        setNotes('');
        setVoicePrefillData(null);
    };

    const closeModal = () => {
        setIsBorrowModalOpen(false);
        setIsReturnModalOpen(false);
        setSelectedItem(null);
        clearFormStates();
    };

    // --- Carga y Ordenamiento de Datos ---
    const fetchItems = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${apiUrl}/api/items`);
            // 🔑 Ordenar por fecha de registro (createdAt) descendente por defecto
            const sorted = response.data.sort((a, b) => 
                new Date(b.createdAt) - new Date(a.createdAt)
            );
            setItems(sorted);
        } catch (error) {
            console.error('Error al obtener la lista de ítems:', error);
            setStatusMessage({ type: 'error', message: 'Fallo al cargar el inventario.' });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchItems();
    }, [fetchItems]);

    const filteredItems = useMemo(() => {
        const lowerCaseSearch = searchTerm.toLowerCase();
        return items.filter(item =>
            item.name.toLowerCase().includes(lowerCaseSearch) ||
            item.qrCode.toLowerCase().includes(lowerCaseSearch) ||
            (item.currentHolder && item.currentHolder.toLowerCase().includes(lowerCaseSearch))
        );
    }, [items, searchTerm]);

    // --- Lógica de Voz ---
    const handleVoiceAction = (command, data) => {
        if (!isAlmacenero || command !== 'BORROW_FLEX') return; 
        
        // Asume que la acción BORROW_FLEX del SpeechRecognition te devuelve: { itemName: string, quantity: number, personName: string }
        
        // 1. Buscamos el ítem por nombre (o QR)
        const itemMatch = items.find(item => 
            item.name.toLowerCase().includes(data.itemName.toLowerCase()) || 
            item.qrCode.toLowerCase() === data.itemName.toLowerCase()
        );

        if (!itemMatch) {
            setStatusMessage({ type: 'error', message: `❌ Ítem "${data.itemName}" no encontrado.` });
            return;
        }

        // 2. Pre-llenar el estado del formulario y abrir el modal
        setSelectedItem(itemMatch);
        setPersonName(data.personName);
        setQuantity(data.quantity);
        setNotes('Registro por comando de voz.');
        
        setStatusMessage({ type: 'info', message: `Comando de voz procesado. Revise y acepte el préstamo.` });
        setIsBorrowModalOpen(true);
    };

    // --- Handlers de Modales ---
    const handleOpenTransaction = (item, type) => {
        setSelectedItem(item);
        clearFormStates();
        if (type === 'borrow') {
            setIsBorrowModalOpen(true);
        } else {
            // Pre-llenar persona para devolución si está disponible
            setPersonName(item.currentHolder || ''); 
            setIsReturnModalOpen(true);
        }
    };

    // --- Lógica de Préstamo (Submit) ---
    const handleBorrowSubmit = async (e) => {
        e.preventDefault();
        if (!selectedItem || !isAlmacenero) return;
        setStatusMessage({ type: 'info', message: 'Procesando préstamo...' });

        if (quantity > selectedItem.stock) {
            setStatusMessage({ type: 'error', message: `Cantidad (${quantity}) excede el stock disponible (${selectedItem.stock}).` });
            return;
        }

        try {
            await axios.post(`${apiUrl}/api/borrow`, { 
                qrCode: selectedItem.qrCode, 
                personName, 
                validatedBy: almaceneroName, 
                quantity, 
                notes 
            });

            setStatusMessage({ type: 'success', message: `Préstamo de ${quantity} unidad(es) de ${selectedItem.name} a ${personName} exitoso.` });
            closeModal();
            fetchItems(); // Recargar la tabla
        } catch (error) {
            const msg = error.response?.data?.message || 'Error desconocido al prestar.';
            setStatusMessage({ type: 'error', message: `Fallo en Préstamo: ${msg}` });
        }
    };
    
    // --- Lógica de Devolución (Submit) ---
    const handleReturnSubmit = async (e) => {
        e.preventDefault();
        if (!selectedItem || !isAlmacenero) return;
        setStatusMessage({ type: 'info', message: 'Procesando devolución...' });

        try {
            // Asumiendo que la devolución es de 1 unidad por transacción simple, 
            // o ajustamos el backend para manejar devoluciones parciales.
            // Para simplicidad, asumimos devolución de UNA UNIDAD y se elimina el holder.
            
            await axios.post(`${apiUrl}/api/return`, { 
                qrCode: selectedItem.qrCode, 
                personReturning: personName, // Usamos personName del estado para quien devuelve
                almaceneroName, 
                notes 
            });

            setStatusMessage({ type: 'success', message: `Devolución de ${selectedItem.name} por ${personName} registrada.` });
            closeModal();
            fetchItems(); // Recargar la tabla
        } catch (error) {
            const msg = error.response?.data?.message || 'Error desconocido al devolver.';
            setStatusMessage({ type: 'error', message: `Fallo en Devolución: ${msg}` });
        }
    };
    
    // --- Renderizado de Modales ---
    const renderBorrowModal = () => (
        <TransactionModal 
            isOpen={isBorrowModalOpen}
            title={`Prestar/Consumir: ${selectedItem?.name}`}
            onClose={closeModal}
        >
            <form onSubmit={handleBorrowSubmit} className="modal-form">
                <p className="modal-item-code">**Código:** {selectedItem?.qrCode}</p>
                
                <label>
                    Persona a la que se prestará:
                    <input 
                        type="text" 
                        value={personName} 
                        onChange={(e) => setPersonName(e.target.value)}
                        required
                        placeholder="Nombre completo"
                    />
                </label>
                
                <label>
                    Cantidad a prestar/consumir: (Stock: {selectedItem?.stock})
                    <input 
                        type="number" 
                        value={quantity} 
                        onChange={(e) => setQuantity(parseInt(e.target.value))}
                        min="1"
                        max={selectedItem?.stock || 1}
                        required
                    />
                </label>

                <label>
                    Notas / Detalles (Opcional):
                    <textarea 
                        value={notes} 
                        onChange={(e) => setNotes(e.target.value)}
                        rows="3"
                    />
                </label>

                <button type="submit" className="btn btn-primary-modal">
                    Aceptar Préstamo y Descontar Stock
                </button>
            </form>
        </TransactionModal>
    );

    const renderReturnModal = () => (
        <TransactionModal 
            isOpen={isReturnModalOpen}
            title={`Registrar Devolución: ${selectedItem?.name}`}
            onClose={closeModal}
        >
            <form onSubmit={handleReturnSubmit} className="modal-form">
                <p>Elemento: **{selectedItem?.name}** ({selectedItem?.qrCode})</p>
                <p>Prestado a: **{selectedItem?.currentHolder || 'N/A'}**</p>
                
                <label>
                    Persona que devuelve (Confirmar):
                    <input 
                        type="text" 
                        value={personName} 
                        onChange={(e) => setPersonName(e.target.value)}
                        required
                    />
                </label>

                <label>
                    Notas de Devolución (Estado del ítem):
                    <textarea 
                        value={notes} 
                        onChange={(e) => setNotes(e.target.value)}
                        rows="3"
                    />
                </label>

                <button type="submit" className="btn btn-secondary-modal">
                    Confirmar Devolución y Añadir Stock
                </button>
            </form>
        </TransactionModal>
    );

    return (
        <main className="transaction-container">
            <h1>Panel de Transacciones 💾</h1>
            
            {statusMessage.message && (
                <div className={`status-box status-${statusMessage.type}`}>
                    {statusMessage.message}
                </div>
            )}
            
            {/* 🔑 Barra de Búsqueda y Voz */}
            <div className="search-voice-bar">
                <input
                    type="text"
                    placeholder="Buscar por Elemento (QR/Nombre) o Persona Prestada..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input-transaction"
                />
                <SpeechRecognition 
                    onCommandDetected={handleVoiceAction} 
                    isAlmacenero={isAlmacenero}
                    // Asumimos que SpeechRecognition tiene un diseño de botón de micrófono
                    iconOnly={true} 
                />
            </div>

            {loading ? (
                <p>Cargando lista de transacciones...</p>
            ) : (
                <div className="transaction-table-wrapper">
                    <div className="table-responsive-scroll"> 
                        <table className="transaction-item-table">
                            <thead>
                                <tr>
                                    <th>Código</th>
                                    <th>Nombre del Elemento</th>
                                    <th>Stock Actual</th>
                                    <th>Estado</th>
                                    <th>Persona Prestada</th>
                                    <th>Último Movimiento</th>
                                    <th>Acción</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredItems.map(item => {
                                    const isAvailable = item.stock > 0 && item.status === 'available';
                                    const actionType = item.status === 'borrowed' ? 'return' : 'borrow';
                                    const actionText = item.status === 'borrowed' ? 'Devolución' : 'Prestar';
                                    
                                    // Determina la fecha de movimiento: Préstamo si prestado, si no, registro
                                    const lastMovementDate = item.status === 'borrowed' && item.loanDate 
                                        ? new Date(item.loanDate)
                                        : new Date(item.createdAt); 
                                    
                                    const statusClass = item.status;

                                    // 🔑 TRADUCCIÓN DEL ESTADO
                                    const statusKey = item.status.toLowerCase();
                                    const translatedStatus = STATUS_TRANSLATIONS[statusKey] || { text: 'Desconocido', class: 'unknown' };

                                    return (
                                        <tr key={item._id}>
                                            <td>{item.qrCode}</td>
                                            <td>{item.name}</td>
                                            <td>{item.stock}</td>
                                            <td className={`status-cell status-${statusClass}`}>{item.status.toUpperCase()}</td>
                                            <td>{item.currentHolder || '-'}</td>
                                            <td>{format(lastMovementDate, 'dd/MM/yyyy HH:mm')}</td>
                                            <td>
                                                <button 
                                                    onClick={() => handleOpenTransaction(item, actionType)}
                                                    className={`btn btn-${actionType}-action`}
                                                    disabled={!isAlmacenero || (actionType === 'borrow' && item.stock <= 0)}
                                                >
                                                    {actionText}
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {renderBorrowModal()}
            {renderReturnModal()}

            
        </main>
    );
};

export default TransactionView;