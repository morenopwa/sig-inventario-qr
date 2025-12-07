import React from 'react';
import './EquipmentTable.css';

const EquipmentTable = ({ 
  equipments, 
  isScannerView = false, 
  onAssignUser, 
  onRemoveAssignment,
  searchTerm = '' 
}) => {
  
  const filteredEquipments = equipments.filter(equip => 
    equip.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    equip.currentHolder?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    equip.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    equip.qrCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getLastUpdateDate = (equipment) => {
    if (!equipment.history || equipment.history.length === 0) {
      return new Date(equipment.updatedAt).toLocaleDateString();
    }
    const lastAction = equipment.history[equipment.history.length - 1];
    return new Date(lastAction.timestamp).toLocaleDateString();
  };

  // Vista para Escanear QR
  if (isScannerView) {
    return (
      <div className="table-container">
        <div className="table-header">
          <h3>Equipos Disponibles</h3>
          <span className="table-count">{filteredEquipments.length} equipos</span>
        </div>
        <table className="equipment-table scanner-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Persona</th>
              <th>Estado</th>
              <th>Categoría</th>
              <th>Fecha</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            {filteredEquipments.map(equip => (
              <TableRowScanner 
                key={equip._id}
                equipment={equip}
                onAssignUser={onAssignUser}
                onRemoveAssignment={onRemoveAssignment}
                getLastUpdateDate={getLastUpdateDate}
              />
            ))}
          </tbody>
        </table>
        {filteredEquipments.length === 0 && (
          <EmptyState searchTerm={searchTerm} />
        )}
      </div>
    );
  }

  // Vista Principal
  return (
    <div className="table-container">
      <div className="table-header">
        <h3>Inventario General</h3>
        <span className="table-count">{filteredEquipments.length} equipos</span>
      </div>
      <table className="equipment-table main-table">
        <thead>
          <tr>
            <th>Equipo</th>
            <th>Persona Actual</th>
            <th>Categoría</th>
            <th>Estado</th>
            <th>Código QR</th>
            <th>Última Actualización</th>
          </tr>
        </thead>
        <tbody>
          {filteredEquipments.map(equip => (
            <TableRowMain 
              key={equip._id}
              equipment={equip}
              getLastUpdateDate={getLastUpdateDate}
            />
          ))}
        </tbody>
      </table>
      {filteredEquipments.length === 0 && (
        <EmptyState searchTerm={searchTerm} />
      )}
    </div>
  );
};

// Subcomponente para filas en vista Scanner
const TableRowScanner = ({ equipment, onAssignUser, onRemoveAssignment, getLastUpdateDate }) => (
  <tr className={equipment.status}>
    <td className="equipment-name">
      <div>
        <strong>{equipment.name}</strong>
        <small>{equipment.qrCode}</small>
      </div>
    </td>
    <td className="person">
      {equipment.currentHolder || 'Sin asignar'}
    </td>
    <td>
      <span className={`status ${equipment.status}`}>
        {equipment.status === 'prestado' ? 'Prestado' : 'Disponible'}
      </span>
    </td>
    <td className="category">{equipment.category || '-'}</td>
    <td className="date">
      {getLastUpdateDate(equipment)}
    </td>
    <td className="actions">
      {equipment.status === 'disponible' ? (
        <button 
          className="btn-action btn-assign"
          onClick={() => onAssignUser(equipment)}
          title="Asignar persona"
        >
          +
        </button>
      ) : (
        <button 
          className="btn-action btn-remove"
          onClick={() => onRemoveAssignment(equipment)}
          title="Quitar asignación"
        >
          -
        </button>
      )}
    </td>
  </tr>
);

// Subcomponente para filas en vista Principal (SIMPLIFICADO)
const TableRowMain = ({ equipment, getLastUpdateDate }) => (
  <tr className={equipment.status}>
    <td className="equipment-name">
      <strong>{equipment.name}</strong>
    </td>
    <td className="person">
      {equipment.currentHolder || 'Sin asignar'}
    </td>
    <td className="category">{equipment.category || '-'}</td>
    <td>
      <span className={`status ${equipment.status}`}>
        {equipment.status === 'prestado' ? 'Prestado' : 'Disponible'}
      </span>
    </td>
    <td className="qr-code">{equipment.qrCode}</td>
    <td className="date">
      {getLastUpdateDate(equipment)}
    </td>
  </tr>
);

// Subcomponente para estado vacío
const EmptyState = ({ searchTerm }) => (
  <div className="empty-state">
    {searchTerm ? 'No se encontraron resultados' : 'No hay equipos registrados'}
  </div>
);

export default EquipmentTable;