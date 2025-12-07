import React, { useState } from 'react';
import './ManualAddForm.css';

const ManualAddForm = ({ onAdd, loading }) => {
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    qrCode: ''
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.category) return;

    const result = await onAdd({
      qrCode: formData.qrCode || `MANUAL_${Date.now()}`,
      name: formData.name,
      category: formData.category
    });

    if (result.success) {
      setFormData({ name: '', category: '', qrCode: '' });
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="manual-add-section">
      <h3>Agregar Equipo Manualmente</h3>
      <form onSubmit={handleSubmit} className="manual-form">
        <div className="form-row">
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Nombre del equipo *"
            required
          />
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="category-select"
            required
          >
            <option value="">Seleccionar categoría *</option>
            {categories.map(category => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
          <input
            type="text"
            name="qrCode"
            value={formData.qrCode}
            onChange={handleChange}
            placeholder="Código QR"
          />
          <button type="submit" disabled={loading} className="btn-add">
            {loading ? '...' : '➕ Agregar'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ManualAddForm;