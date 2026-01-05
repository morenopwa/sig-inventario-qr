import React, { useState } from 'react';
import axios from 'axios';
import SmartScanner from './SmartScanner'; // Reutilizamos tu scanner

const apiUrl = import.meta.env.VITE_API_URL;

const RegisterItemModal = ({ onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        customId: '', // El código QR / ID manual
        name: '',
        category: 'Herramientas', // Valor por defecto
        stock: 0,
        minStock: 2,
        unit: 'Unidades'
    });
    const [showScanner, setShowScanner] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleScanSuccess = (code) => {
        setFormData({ ...formData, customId: code });
        setShowScanner(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.customId || !formData.name) return alert("Código y Nombre son obligatorios");
        
        setLoading(true);
        try {
            await axios.post(`${apiUrl}/api/inventory/items`, formData);
            alert("✅ Item registrado correctamente");
            onSuccess();
        } catch (error) {
            alert("❌ Error: " + (error.response?.data?.message || "No se pudo registrar"));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={st.overlay}>
            <div style={st.modal}>
                <h3 style={st.title}>Registrar Nuevo Ingreso</h3>
                
                <form onSubmit={handleSubmit} style={st.form}>
                    {/* CODIGO QR */}
                    <div style={st.inputGroup}>
                        <label style={st.label}>Código QR / ID</label>
                        <div style={{display: 'flex', gap: '5px'}}>
                            <input 
                                name="customId"
                                value={formData.customId}
                                onChange={handleChange}
                                placeholder="Escanear o escribir..."
                                style={st.input}
                            />
                            <button type="button" onClick={() => setShowScanner(!showScanner)} style={st.btnScan}>
                                📷
                            </button>
                        </div>
                    </div>

                    {showScanner && (
                        <div style={st.scannerContainer}>
                            <SmartScanner onScanSuccess={handleScanSuccess} />
                        </div>
                    )}

                    {/* NOMBRE */}
                    <div style={st.inputGroup}>
                        <label style={st.label}>Descripción / Nombre</label>
                        <input name="name" onChange={handleChange} placeholder="Ej. Taladro Bosch" style={st.input} />
                    </div>

                    {/* CATEGORÍA (Vital para las pestañas) */}
                    <div style={st.inputGroup}>
                        <label style={st.label}>Categoría</label>
                        <select name="category" value={formData.category} onChange={handleChange} style={st.input}>
                            <option value="Herramientas">Herramientas (Se prestan)</option>
                            <option value="Consumibles">Consumibles (Se gastan)</option>
                            <option value="Maquinaria">Maquinaria (Equipos)</option>
                        </select>
                    </div>

                    <div style={{display: 'flex', gap: '10px'}}>
                        <div style={st.inputGroup}>
                            <label style={st.label}>Stock Inicial</label>
                            <input type="number" name="stock" onChange={handleChange} style={st.input} />
                        </div>
                        <div style={st.inputGroup}>
                            <label style={st.label}>Unidad</label>
                            <select name="unit" onChange={handleChange} style={st.input}>
                                <option value="Unidades">Unid.</option>
                                <option value="Metros">Metros</option>
                                <option value="Kilos">Kilos</option>
                                <option value="Bolsas">Bolsas</option>
                            </select>
                        </div>
                    </div>

                    <div style={st.actions}>
                        <button type="button" onClick={onClose} style={st.btnCancel}>Cancelar</button>
                        <button type="submit" disabled={loading} style={st.btnSave}>
                            {loading ? 'Guardando...' : 'Guardar Item'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const st = {
    overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.9)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1200 },
    modal: { backgroundColor: '#202c33', padding: '20px', borderRadius: '12px', width: '90%', maxWidth: '450px', color: 'white' },
    title: { margin: '0 0 20px 0', color: '#00a884', textAlign: 'center' },
    form: { display: 'flex', flexDirection: 'column', gap: '15px' },
    inputGroup: { display: 'flex', flexDirection: 'column', gap: '5px', flex: 1 },
    label: { fontSize: '12px', color: '#8696a0' },
    input: { padding: '10px', backgroundColor: '#111b21', border: '1px solid #2a3942', borderRadius: '6px', color: 'white', outline: 'none' },
    btnScan: { backgroundColor: '#00a884', border: 'none', borderRadius: '6px', padding: '0 15px', cursor: 'pointer' },
    scannerContainer: { borderRadius: '10px', overflow: 'hidden', border: '2px solid #00a884', marginBottom: '10px' },
    actions: { display: 'flex', justifyContent: 'space-between', marginTop: '10px' },
    btnCancel: { backgroundColor: 'transparent', color: '#ff4d4d', border: 'none', cursor: 'pointer' },
    btnSave: { backgroundColor: '#00a884', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }
};

export default RegisterItemModal;