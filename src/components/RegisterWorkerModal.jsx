// src/components/RegisterWorkerModal.jsx

import React, { useState } from 'react';
import axios from 'axios';
import useAuth from '../hooks/useAuth';

const apiUrl = import.meta.env.VITE_API_URL;
const [isWorker, setIsWorker] = useState(false);

const RegisterWorkerModal = ({ onClose, onSuccess }) => {

    
    const { isSuperAdmin,isAdmin } = useAuth(); // <- Obtener el rol

    const [formData, setFormData] = useState({
        name: '',
        lastName: '',
        dni: '',
        phone: '',
        password: '',
        mail: '',
        nivelAcceso: 'Usuario', 
        tipo: 'Externo',
        rol: 'Calderero',
        sueldoBase: '',
        tarifaDiaria: ''
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

        const dataToSend = {
            ...formData,
            password: `${formData.dni}`.trim(), 
            name: `${formData.name}`.trim(),
            lastName: `${formData.lastName}`.trim(),
            dni: `${formData.dni}`.trim(),
            tipo: isWorker ? 'Trabajador' : 'Externo',
            nivelAcceso: 'Usuario'
        };

        setLoading(true);

        try {
            const response = await axios.post(`${apiUrl}/api/users`, dataToSend);
            alert("Usuario creado. Su contraseña inicial es su DNI.");
            if (response.data.success) {
                alert(`✅ ${response.data.message}. Su código QR es: ${response.data.user.qrCode}`);
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
                        <label>Nombre *</label>
                        <input type="text" name="name" value={formData.name} onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                        <label>Apellido *</label>
                        <input type="text" name="name" value={formData.lastName} onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                        <label>DNI *</label>
                        <input type="text" name="name" value={formData.dni} onChange={handleChange} required />
                    </div>
                    <div className="form-group">
                        <label>Telefono</label>
                        <input type="text" name="name" value={formData.phone} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                        <label>Correo</label>
                        <input type="text" name="name" value={formData.mail} onChange={handleChange} />
                    </div>

                    <div className="flex items-center gap-2 mb-4">
                        <input 
                            type="checkbox" 
                            id="isWorker"
                            checked={isWorker}
                            onChange={(e) => setIsWorker(e.target.checked)}
                        />
                        <label htmlFor="isWorker">¿Es trabajador de la empresa?</label>
                    </div>

                    {isWorker && (
                    <div className="form-group">
                        <label>Rol en la empresa*</label>
                        <select name="role" value={formData.rol} onChange={handleChange} required>
                            <option value="Calderero">Calderero</option>
                            <option value="Maestro Calderero">Maestro Calderero</option>
                            <option value="Almacenero">Almacenero</option>
                            <option value="Prevencionista">Prevencionista</option>
                            <option value="Maniobrista">Maniobrista</option>
                            <option value="Residente">Residente</option>
                            
                        </select>
                    </div>
                    )}
                    {isSuperAdmin || isAdmin && (
                    <div className="form-group">
                        <label>Agregar Admins*</label>
                        <select name="role" value={formData.rol} onChange={handleChange} required>
                          
                            {isSuperAdmin || isAdmin && ( 
                                <option value="Admin">Admin</option>
                            )}
                        </select>
                    </div>
                    )}

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