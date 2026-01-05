import React, { useState } from 'react';
import axios from 'axios';
import SmartScanner from './SmartScanner';

const LoanModal = ({ item, onClose, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [workerName, setWorkerName] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [useScanner, setUseScanner] = useState(true); // Toggle entre scanner y manual
    const apiUrl = import.meta.env.VITE_API_URL;

    // Función para procesar el préstamo (usada por scanner y manual)
    const processLoan = async (targetWorker) => {
        if (loading) return;
        if (!targetWorker.trim()) {
            alert("❌ Por favor, ingrese o escanee el nombre del trabajador");
            return;
        }
        if (quantity > item.stock) {
            alert(`❌ Stock insuficiente. Disponible: ${item.stock}`);
            return;
        }

        setLoading(true);
        try {
            // Usamos la ruta de transacciones para que se descuente el stock automáticamente
            const res = await axios.post(`${apiUrl}/api/transactions`, {
                quantity: parseInt(quantity),
                itemName: item.name,
                personName: targetWorker.trim().toUpperCase(),
                type: 'OUT',
                category: item.category
            });

            alert("✅ " + (res.data.message || "Préstamo registrado correctamente"));
            onSuccess(); // Refresca inventario y chat
        } catch (err) {
            console.error(err);
            alert("❌ " + (err.response?.data?.message || "Error al procesar el préstamo"));
        } finally {
            setLoading(false);
        }
    };

    // Manejador del Escáner
    const handleScanWorker = (scannedData) => {
        processLoan(scannedData);
    };

    // Manejador del Formulario Manual
    const handleManualSubmit = (e) => {
        e.preventDefault();
        processLoan(workerName);
    };

    return (
        <div style={st.overlay}>
            <div style={st.modal}>
                <h3 style={{color: '#00a884', marginBottom: '5px'}}>Prestar Herramienta</h3>
                <p style={{fontSize: '14px', color: '#8696a0', marginBottom: '15px'}}>
                    Entregando: <strong>{item.name}</strong> (Stock: {item.stock})
                </p>

                {/* Switcher de modo */}
                <div style={st.tabs}>
                    <button 
                        onClick={() => setUseScanner(true)} 
                        style={useScanner ? st.tabActive : st.tab}
                    >⌨️ Manual</button>
                    <button 
                        onClick={() => setUseScanner(false)} 
                        style={!useScanner ? st.tabActive : st.tab}
                    >📷 Escáner</button>
                </div>

                <div style={st.contentArea}>
                    {useScanner ?  (
                        <form onSubmit={handleManualSubmit} style={st.form}>
                            <label style={st.label}>Nombre del Trabajador</label>
                            <input 
                                style={st.input}
                                type="text"
                                value={workerName}
                                onChange={(e) => setWorkerName(e.target.value)}
                                placeholder="Ej: PEPITO"
                                autoFocus
                            />
                            <label style={st.label}>Cantidad a Prestar</label>
                            <input 
                                style={st.input}
                                type="number"
                                min="1"
                                max={item.stock}
                                value={quantity}
                                onChange={(e) => setQuantity(e.target.value)}
                            />
                            <button type="submit" style={st.btnConfirm} disabled={loading}>
                                {loading ? 'Registrando...' : 'Confirmar Préstamo'}
                            </button>
                        </form>
                    ) :(
                        <div style={st.scannerWrap}>
                            {!loading ? (
                                <SmartScanner onScanSuccess={handleScanWorker} />
                            ) : (
                                <p>Procesando registro...</p>
                            )}
                        </div>
                    ) }
                </div>

                <button onClick={onClose} style={st.btnCancel}>Cerrar</button>
            </div>
        </div>
    );
};

const st = {
    overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.9)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1100 },
    modal: { backgroundColor: '#202c33', padding: '20px', borderRadius: '15px', color: 'white', textAlign: 'center', width: '90%', maxWidth: '400px', border: '1px solid #2a3942' },
    tabs: { display: 'flex', gap: '5px', marginBottom: '15px', backgroundColor: '#0b141a', padding: '4px', borderRadius: '8px' },
    tab: { flex: 1, padding: '8px', border: 'none', backgroundColor: 'transparent', color: '#8696a0', cursor: 'pointer', borderRadius: '6px' },
    tabActive: { flex: 1, padding: '8px', border: 'none', backgroundColor: '#2a3942', color: '#00a884', fontWeight: 'bold', borderRadius: '6px', cursor: 'default' },
    contentArea: { minHeight: '280px', display: 'flex', flexDirection: 'column', justifyContent: 'center' },
    scannerWrap: { borderRadius: '12px', overflow: 'hidden', border: '2px solid #00a884', backgroundColor: '#0b141a', minHeight: '250px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    form: { display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'left' },
    label: { fontSize: '12px', color: '#8696a0', marginLeft: '5px' },
    input: { padding: '12px', borderRadius: '8px', border: 'none', backgroundColor: '#2a3942', color: 'white', outline: 'none', fontSize: '16px' },
    btnConfirm: { backgroundColor: '#00a884', color: 'white', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' },
    btnCancel: { backgroundColor: 'transparent', color: '#ff4d4d', border: '1px solid #ff4d4d', padding: '8px 20px', borderRadius: '8px', cursor: 'pointer', marginTop: '15px', width: '100%' }
};

export default LoanModal;