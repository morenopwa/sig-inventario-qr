import React, { useState } from 'react';
import axios from 'axios';

const apiUrl = import.meta.env.VITE_API_URL;

const ReturnModal = ({ item, almaceneroName, onClose, onSuccess }) => {
    const [personReturning, setPersonReturning] = useState(''); // Estado para la persona que devuelve
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleBackdropClick = (e) => {
        // Si el clic ocurrió directamente en el 'modal-backdrop' (el div padre), cierra el modal.
        if (e.target.className === 'modal-backdrop') {
            onClose();
        }
    };
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (!personReturning) {
            setError('Por favor, ingresa el nombre de la persona que devuelve el ítem.');
            setLoading(false);
            return;
        }

        const dataToSend = {
            qrCode: item.qrCode,
            almaceneroName: almaceneroName, // Nombre del usuario actual (Almacenero)
            personReturning: personReturning, // 🔑 Dato clave que el backend espera
            notes: notes,
            // Si el backend necesita el estado, podrías incluirlo, pero generalmente no es necesario para la devolución.
        };

        try {
            // 🔑 Asegúrate de que la ruta POST sea /api/return
            await axios.post(`${apiUrl}/api/return`, dataToSend);
            alert(`✅ Ítem "${item.name}" devuelto con éxito.`);
            onSuccess();
        } catch (err) {
            console.error('Error de API:', err);
            setError(`Error al registrar devolución. ${err.response?.data?.message || 'Verifica la conexión y el QR del ítem.'}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content modal-return">
                <h2>📦 Devolución de Ítem</h2>
                <p>Devolviendo: <strong>{item.name}</strong> (Código: {item.qrCode})</p>
                <p>Actualmente en manos de: <strong>{item.currentHolder || 'N/A'}</strong></p>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Persona que Devuelve:</label>
                        <input
                            type="text"
                            value={personReturning}
                            onChange={(e) => setPersonReturning(e.target.value)}
                            placeholder="Nombre del trabajador"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Notas Adicionales (Opcional):</label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Ej: Ítem requiere mantenimiento ligero."
                        />
                    </div>
                    
                    {error && <p className="error-message">{error}</p>}

                    <div className="modal-actions">
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? 'Procesando...' : 'Confirmar Devolución'}
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

export default ReturnModal;