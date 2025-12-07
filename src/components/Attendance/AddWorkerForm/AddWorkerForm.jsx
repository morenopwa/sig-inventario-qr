// src/components/Attendance/AddWorkerForm/AddWorkerForm.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../auth/AuthContext'; // ✅ Agregar import
import './AddWorkerForm.css';

const AddWorkerForm = ({ onAdd, loading }) => {
  const { user, isAdmin } = useAuth(); // ✅ Usar auth
  const [formData, setFormData] = useState({
    name: '',
    position: '',
    department: ''
  });

  // Si no es admin, no mostrar el formulario
  if (!user || !isAdmin) {
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Por favor ingresa el nombre del trabajador');
      return;
    }

    const result = await onAdd(formData);
    if (result.success) {
      setFormData({ name: '', position: '', department: '' });
      // El QR se mostrará en el modal desde WorkersTab
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="add-worker-form">
      <div className="form-header">
        <h3>➕ Agregar Nuevo Trabajador</h3>
        <div className="form-subtitle">
          <span className="admin-badge-small">👑 Modo Administrador</span>
          <span className="user-indicator">Usuario: {user.name}</span>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="worker-form">
        <div className="form-group">
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Nombre completo *"
            required
            disabled={loading}
            className="form-input"
          />
          <input
            type="text"
            name="position"
            value={formData.position}
            onChange={handleChange}
            placeholder="Cargo (opcional)"
            disabled={loading}
            className="form-input"
          />
          <input
            type="text"
            name="department"
            value={formData.department}
            onChange={handleChange}
            placeholder="Departamento (opcional)"
            disabled={loading}
            className="form-input"
          />
          <button 
            type="submit" 
            disabled={loading} 
            className="btn-add-worker"
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                Generando QR...
              </>
            ) : (
              '➕ Agregar Trabajador'
            )}
          </button>
        </div>
        
        <div className="form-note">
          <p>📋 <strong>Nota:</strong> Se generará automáticamente un código QR único para este trabajador.</p>
          <p>Podrás descargar e imprimir el QR después de crearlo.</p>
        </div>
      </form>
    </div>
  );
};

export default AddWorkerForm;