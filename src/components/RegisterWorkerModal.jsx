// src/components/RegisterWorkerModal.jsx

import React, { useState } from 'react';
import axios from 'axios';
import useAuth from '../hooks/useAuth';

const apiUrl = 'https://sig-inventario-qr-backend.onrender.com';

const RegisterWorkerModal = ({ onClose, onSuccess }) => {

    
    const { isSuperAdmin } = useAuth(); // <- Obtener el rol

    const [formData, setFormData] = useState({
        name: '',
        position: '',
        role: 'Trabajador', // Opción por defecto
        pin: '', // Asegúrate de que el pin inicial esté aquí
    });
    
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await axios.post(`${apiUrl}/api/workers/register`, formData);

            if (response.data.success) {
                alert(`✅ ${response.data.message}. Su código QR es: ${response.data.worker.qrCode}`);
                onSuccess();
            } else {
                alert('❌ Error al registrar: ' + response.data.error);
            }
        } catch (error) {
            console.error('Error de API:', error.response?.data?.error || error.message);
            alert(`❌ Error al conectar o al guardar: ${error.response?.data?.error || error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal">
                <h2>👤 Registrar Nuevo Usuario</h2>
                
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Nombre Completo *</label>
                        <input type="text" name="name" value={formData.name} onChange={handleChange} required />
                    </div>
                    
                    <div className="form-group">
                        <label>Cargo/Puesto *</label>
                        <input type="text" name="position" value={formData.position} onChange={handleChange} required />
                    </div>
                    
                    <div className="form-group">
                        <label>Rol de Usuario *</label>
                        <select name="role" value={formData.role} onChange={handleChange} required>
                            <option value="Trabajador">Trabajador</option>
                            <option value="Almacenero">Almacenero</option>
                            {isSuperAdmin && ( // <--- SOLO VISIBLE PARA SUPERADMIN
                                <option value="SuperAdmin">SuperAdmin</option>
                            )}
                        </select>
                    </div>

                    <div className="form-group">
                        <label>PIN/Contraseña Inicial *</label>
                        <input type="password" name="pin" value={formData.pin} onChange={handleChange} required /> 
                        {/* Asegúrate de que 'name="pin"' esté correcto y 'required' esté presente */}
                    </div>

                    <div className="button-group">
                        <button type="button" className="btn btn-cancel" onClick={onClose} disabled={loading}>
                            Cancelar
                        </button>
                        <button type="submit" className="btn btn-confirm" disabled={loading}>
                            {loading ? '⏳ Registrando...' : '👤 Registrar Usuario'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default RegisterWorkerModal;