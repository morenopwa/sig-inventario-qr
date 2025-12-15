import React, { useState, useEffect } from 'react';
import axios from 'axios';

const apiUrl = import.meta.env.VITE_API_URL;
const CATEGORY_OPTIONS = [
    'Consumibles',
    'EPP',
    'Equipo',
    'Herramientas',
    'Otros'
];

const RegisterItemModal = ({ registeredBy, initialData, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        name: '',
        category: CATEGORY_OPTIONS[0] || '', // Establecer la primera categoría por defecto
        stock: 1,
        isConsumible: false,
    });

    const handleBackdropClick = (e) => {
        // Si el clic ocurrió directamente en el 'modal-backdrop' (el div padre), cierra el modal.
        if (e.target.className === 'modal-backdrop') {
            onClose();
        }
    }
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Aplicar initialData (si viene de la voz)
    useEffect(() => {
        if (initialData) {
            setFormData(prev => ({
                ...prev,
                name: initialData.name || '',
                stock: initialData.stock || 1,
                isConsumible: initialData.isConsumible !== undefined ? initialData.isConsumible : false
            }));
        }
    }, [initialData]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const dataToSend = {
            name: formData.name,
            category: formData.category,
            stock: formData.isConsumible ? parseInt(formData.stock, 10) : 1,
            isConsumible: formData.isConsumible,
            registeredBy: registeredBy,
        };

        if (dataToSend.stock < 1) {
            setError("El stock debe ser al menos 1.");
            setLoading(false);
            return;
        }

        try {
            const response = await axios.post(`${apiUrl}/api/items`, dataToSend);
            
            alert(`✅ Ítem registrado con éxito. QR asignado: ${response.data.qrCode}`);
            onSuccess();
        } catch (error) {
            console.error('Error al registrar ítem:', error.response?.data || error);
            
            let errorMessage = "Ocurrió un error desconocido al registrar.";

            if (error.response && error.response.data) {
                const responseData = error.response.data;
                if (responseData.error && responseData.error.includes('E11000')) {
                    // Mensaje para el error de duplicado (G004)
                    errorMessage = "Error de duplicado de QR. Por favor, intenta de nuevo.";
                } else if (responseData.message) {
                    errorMessage = responseData.message;
                } else if (responseData.error) {
                    errorMessage = `Error del servidor: ${responseData.error}`;
                }
            } else {
                errorMessage = `Error de conexión: ${error.message}`;
            }

            setError(errorMessage);
        } finally {
            // 🔑 Corrección: Asegura que loading se desactive para permitir reintentar
            setLoading(false); 
        }
    };

    // La categoría debe estar seleccionada
    const isSubmitDisabled = loading || !formData.name || !formData.category;

    return (
        <div className="modal-backdrop" onClick={handleBackdropClick}>
            <div className="modal-content-centered">
                <h2>➕ Registrar Nuevo Ítem</h2>
                <form onSubmit={handleSubmit}>
                    
                    <div className="form-group">
                        <label>Nombre del Ítem:</label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    
                    {/* 🔑 CORRECCIÓN: Volver a menú desplegable */}
                    <div className="form-group">
                        <label>Categoría:</label>
                        <select
                            name="category"
                            value={formData.category}
                            onChange={handleChange}
                            required
                        >
                            {CATEGORY_OPTIONS.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group checkbox-group d-flex">
                        <label style={{ display: 'flex', alignItems: 'center' }}  className="d-inline-block">
                            <span class="d-inline-block">Es Consumible?</span>
                            <input className="d-inline-block"
                                type="checkbox"
                                name="isConsumible"
                                checked={formData.isConsumible}
                                onChange={handleChange}
                            />
                        </label>
                    </div>

                    {formData.isConsumible && (
                        <div className="form-group ">
                            <label>Stock Inicial:</label>
                            <input
                                type="number"
                                name="stock"
                                value={formData.stock}
                                onChange={handleChange}
                                min="1"
                                required
                            />
                        </div>
                    )}
                    
                    <p className="registered-by-info m-3">
                        Registrado por: <strong>{registeredBy}</strong>
                    </p>

                    <br/>

                    {error && <p className="error-message">{error}</p>}
                    
                    <div className="modal-actions">
                        <button type="submit" className="btn btn-primary" disabled={isSubmitDisabled}>
                            {loading ? 'Registrando...' : 'Registrar Ítem'}
                        </button>
                        <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
                            Cancelar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default RegisterItemModal;