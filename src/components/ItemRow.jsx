import React from 'react';

const LOW_STOCK_LIMIT = 5;

const STATUS_MAP = {
    'new': 'NUEVO',
    'available': 'DISPONIBLE',
    'borrowed': 'PRESTADO',
    'repair': 'REPARACIÓN'
};

const getStatusTagClass = (status) => {
    switch (status) {
        case 'available':
        case 'new':
            return 'status-tag status-available';
        case 'borrowed':
            return 'status-tag status-borrowed';
        case 'repair':
            return 'status-tag status-repair';
        default:
            return 'status-tag';
    }
};

const ItemRow = ({ item, isAlmacenero, onSelect, onViewHistory = () => {} }) => { 
    
    const statusTagClass = getStatusTagClass(item.status);
    const displayedStatus = STATUS_MAP[item.status] || item.status.toUpperCase();
    
    // Inicializar rowClass con un valor base para evitar ReferenceError
    let rowClass = `row-status-${item.status}`;
    
    if (item.isConsumible) {
        if (item.stock <= 0) {
            rowClass = 'row-status-exhausted';
        } else if (item.stock > 0 && item.stock <= LOW_STOCK_LIMIT) {
            rowClass = 'row-status-lowstock';
        }
    }
    
    const lastModifiedDate = item.updatedAt ? 
        new Date(item.updatedAt).toLocaleString('es-ES', { 
            year: 'numeric', 
            month: 'numeric', 
            day: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit'
        }) : 
        '-';

    // Función que maneja el clic en la fila.
    const handleRowClick = () => {
        
        if (item.status === 'borrowed') {
            // Ítems prestados abren el modal de DEVOLUCIÓN
            onSelect(item.qrCode); 
        } else if (item.isConsumible || item.status === 'repair') {
            // Consumibles o ítems en reparación abren Historial
            onViewHistory(item); 
        } else if (item.status === 'available' || item.status === 'new') {
            // Ítems disponibles abren el modal de PRÉSTAMO
            onSelect(item.qrCode); 
        }
    };

    return (
        // 🔑 CRÍTICO: Clase 'item-row' para aplicar estilos responsive
        <tr onClick={handleRowClick} className={`item-row ${rowClass}`}> 
            {/* 🔑 CRÍTICO: Atributo data-label para usar en mobile CSS */}
            <td data-label="QR Code">{item.qrCode}</td>
            <td data-label="Nombre">{item.name}</td>
            <td data-label="Categoría">{item.category}</td>
            <td data-label="Stock">{item.isConsumible ? item.stock : '1'}</td>
            <td data-label="Estado">
                <span className={statusTagClass}>{displayedStatus}</span> 
            </td>
            
            {isAlmacenero && (
                <td data-label="Prestado a">
                    {item.isConsumible ? 'Múltiples (Ver Historial)' : (item.status === 'borrowed' ? item.currentHolder : '-')}
                </td>
            )}
            
            <td data-label="Última Modificación">
                {lastModifiedDate} 
            </td>
        </tr>
    );
};

export default ItemRow;