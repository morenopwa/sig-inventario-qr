import React, { useState, useEffect } from 'react';
import './ScanModal.css';

const ScanModal = ({ 
  isOpen, 
  type, 
  qrData, 
  equipment, 
  onClose, 
  onSubmit, 
  loading = false 
}) => {
  const [formData, setFormData] = useState({
    personName: '',
    notes: '',
    equipmentName: '',
    category: ''
  });

  // Categorías predefinidas
  const categories = [
    'EPP',
    'Herramientas', 
    'Oxicorte',
    'Soldaduria',
    'Caldereria',
    'Consumibles',
    'Otros'
  ];

  // Resetear form cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      setFormData({
        personName: '',
        notes: '',
        equipmentName: equipment?.name || '',
        category: equipment?.category || ''
      });
    }
  }, [isOpen, equipment]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      qrData,
      type
    });
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const getModalTitle = () => {
    switch (type) {
      case 'loan': return 'Registrar Préstamo';
      case 'return': return 'Registrar Devolución';
      case 'new': return 'Agregar Equipo';
      default: return '';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{getModalTitle()}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          <div className="qr-preview">
            <span>QR escaneado: <strong>{qrData}</strong></span>
          </div>

          <form onSubmit={handleSubmit} className="modal-form">
            {type === 'loan' && (
              <>
                <div className="input-group">
                  <label>Persona que recibe *</label>
                  <input
                    type="text"
                    name="personName"
                    value={formData.personName}
                    onChange={handleInputChange}
                    required
                    placeholder="Nombre completo"
                    autoFocus
                  />
                </div>
                <div className="input-group">
                  <label>Notas (opcional)</label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    placeholder="Observaciones del préstamo..."
                    rows="2"
                  />
                </div>
              </>
            )}

            {type === 'return' && (
              <div className="input-group">
                <label>Notas de devolución (opcional)</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  placeholder="Observaciones de la devolución..."
                  rows="2"
                />
              </div>
            )}

            {type === 'new' && (
              <>
                <div className="input-group">
                  <label>Nombre del equipo *</label>
                  <input
                    type="text"
                    name="equipmentName"
                    value={formData.equipmentName}
                    onChange={handleInputChange}
                    required
                    placeholder="Ej: Laptop Dell, Soldadora..."
                    autoFocus
                  />
                </div>
                <div className="input-group">
                  <label>Categoría *</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="category-select"
                    required
                  >
                    <option value="">Seleccionar categoría</option>
                    {categories.map(category => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}

            <div className="modal-actions">
              <button type="button" onClick={onClose} className="btn btn-cancel">
                Cancelar
              </button>
              <button type="submit" className="btn btn-confirm" disabled={loading}>
                {loading ? 'Procesando...' : 'Confirmar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ScanModal;