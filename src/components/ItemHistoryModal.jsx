import React, { useState, useEffect } from 'react';
import axios from 'axios';
import useAuth from '../hooks/useAuth'; 

const apiUrl = import.meta.env.VITE_API_URL;

const ItemHistoryModal = ({ item, onClose, onOpenBorrowModal }) => {
    const { user } = useAuth();
    const isAlmacenero = user?.role === 'Almacenero' || user?.role === 'SuperAdmin';
    
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    const STATUS_MAP = {
        'borrow': 'Préstamo',
        'return': 'Devolución',
        'register': 'Registro Inicial',
        'repair': 'Reparación',
        'consumption': 'Consumo'
    };

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const url = `${apiUrl}/api/items/${item.qrCode}/history`;
                const response = await axios.get(url);
                setHistory(response.data.history);
            } catch (error) {
                console.error('Error al obtener el historial:', error);
                alert(`Error al cargar el historial: ${error.message}.`);
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, [item.qrCode]);

    const formatHistoryEntry = (entry) => {
        const date = new Date(entry.createdAt).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' });
        const action = STATUS_MAP[entry.action] || entry.action.toUpperCase();

        let detail = '';
        
        // 🔑 Asegura que se use el campo correcto para el nombre de la persona
        const person = entry.person || entry.personReturning || entry.currentHolder || entry.almacenero || 'Desconocido';

        if (entry.action === 'consumption') {
            detail = `Registrado por <strong>${entry.validatedBy}</strong> (Consumo: ${entry.quantity})`;
        } else if (entry.action === 'borrow') {
            detail = `Prestado a <strong>${person}</strong> (Cantidad: ${entry.quantity || 1})`;
        } else if (entry.action === 'return') {
            detail = `Devuelto por <strong>${person}</strong> (Validado por: ${entry.validatedBy})`;
        } else if (entry.action === 'register') {
            detail = `Registrado por <strong>${person}</strong>`; 
        }
        
        return (
            <div key={entry._id} className="history-entry">
                <p>
                    <span className="history-date">[{date}]</span> 
                    <span className="history-action">{action}</span>: 
                    <span dangerouslySetInnerHTML={{ __html: detail }}></span>
                    {entry.notes && <span className="history-notes"> - Notas: {entry.notes}</span>}
                </p>
            </div>
        );
    };

    const isAvailableForAction = 
        (item.isConsumible && item.stock > 0) || 
        (!item.isConsumible && (item.status === 'available' || item.status === 'new'));

    return (
        <div className="modal-overlay">
            {/* 🔑 CRÍTICO: Añadir clases para estilos responsive */}
            <div className="modal-content modal-history"> 
                <h2>📋 Historial: {item.name} ({item.qrCode})</h2>
                <p><strong>Estado Actual:</strong> {STATUS_MAP[item.status] || item.status.toUpperCase()} | 
                   {item.isConsumible ? ` Stock: ${item.stock}` : ` Prestado a: ${item.currentHolder || 'Nadie'}`}
                </p>
                <hr/>
                {loading ? (
                    <p>Cargando historial...</p>
                ) : history.length === 0 ? (
                    <p>No hay historial de movimientos para este ítem.</p>
                ) : (
                    <div className="history-list">
                        {history.map(formatHistoryEntry)}
                    </div>
                )}
                <div className="modal-actions">
                    {isAlmacenero && isAvailableForAction && (
                        <button 
                            className="btn btn-primary" 
                            // Llama a handleScan, que reabrirá el modal de Préstamo/Consumo
                            onClick={() => onOpenBorrowModal(item.qrCode)} 
                            style={{ marginRight: '10px' }}
                        >
                            {item.isConsumible ? '✅ Registrar Consumo' : '🛠️ Prestar Ítem'}
                        </button>
                    )}
                    <button className="btn btn-secondary" onClick={onClose}>Cerrar Historial</button>
                </div>
            </div>
        </div>
    );
};

export default ItemHistoryModal;