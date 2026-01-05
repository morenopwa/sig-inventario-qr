import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';

const ChatPage = ({ onRefreshInventory }) => {
    const [input, setInput] = useState('');
    const [logs, setLogs] = useState([]); // Historial de consultas
    const [workers, setWorkers] = useState([]); // Apellidos para los botones
    const chatEndRef = useRef(null);
    const apiUrl = import.meta.env.VITE_API_URL;

    // 1. CARGA DE DATOS (Asegura que si uno falla, el otro no bloquee todo)
    const fetchData = useCallback(async () => {
        try {
            // Cargar Historial
            const txRes = await axios.get(`${apiUrl}/api/transactions`);
            if (txRes.data) setLogs(txRes.data);

            // Cargar Apellidos (Asegúrate que esta ruta devuelva un array de strings)
            const workerRes = await axios.get(`${apiUrl}/api/workers/lastnames`);
            if (workerRes.data) setWorkers(workerRes.data);
        } catch (e) {
            console.error("Error conectando con el servidor:", e);
        }
    }, [apiUrl]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [logs]);

    // 2. FUNCIÓN PARA AGREGAR APELLIDO AL INPUT
    const handleAddWorker = (lastName) => {
        const currentText = input.trim();
        // Si el apellido ya está al final, no lo duplica
        if (currentText.endsWith(lastName)) return;
        setInput(`${currentText} ${lastName}`.trim());
    };

    // 3. PROCESAR EL REGISTRO
    const processInput = async () => {
        let text = input.trim();
        if (!text) return;

        // Si no empieza con número, lo limpiamos (mensaje de ayuda no se guarda en inventario)
        if (isNaN(text.split(' ')[0])) {
            console.log("Mensaje informativo detectado");
            setInput('');
            return; 
        }

        let parts = text.split(' ');
        let quantity = parseInt(parts.shift());
        
        let personName = "GENERAL";
        if (parts.length > 1) {
            personName = parts.pop().toUpperCase();
        }

        const itemName = parts.join(' ').toUpperCase();

        const payload = {
            quantity: quantity,
            itemName: itemName,
            personName: personName,
            type: 'OUT', // Por defecto es préstamo/entrega
            category: 'HERRAMIENTA'
        };

        try {
            const res = await axios.post(`${apiUrl}/api/transactions`, payload);
            if (res.data.success) {
                setInput('');
                fetchData(); // Recarga consultas
                if (onRefreshInventory) onRefreshInventory(); // Recarga tabla inventario
            }
        } catch (e) {
            alert(e.response?.data?.message || "Error al registrar movimiento");
        }
    };

    return (
        <div style={s.container}>
            {/* HISTORIAL DE CONSULTAS */}
            <div style={s.chatArea}>
                {logs && logs.length > 0 ? logs.map((log, i) => (
                    <div key={log._id || i} style={s.bubbleWrap(log.type)}>
                        <div style={s.bubble(log.type)}>
                            <small style={s.workerLabel}>{log.personName}</small>
                            <div style={s.bubbleBody}>
                                <span>{log.type === 'IN' ? '➕' : '➖'} {log.quantity} {log.itemName}</span>
                                <small style={s.time}>{new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</small>
                            </div>
                        </div>
                    </div>
                )) : (
                    <p style={{textAlign: 'center', color: '#8696a0', marginTop: '20px'}}>No hay registros recientes</p>
                )}
                <div ref={chatEndRef} />
            </div>

            {/* PANEL INFERIOR (BOTONES Y INPUT) */}
            <div style={s.controlPanel}>
                {/* BOTONES DE TRABAJADORES (Apellidos) */}
                <div style={s.workerBar}>
                    {workers && workers.length > 0 ? workers.map((lastName, idx) => (
                        <button 
                            key={idx} 
                            onClick={() => handleAddWorker(lastName)} 
                            style={s.workerBtn}
                        >
                            {lastName}
                        </button>
                    )) : (
                        <small style={{color: '#8696a0'}}>Cargando trabajadores...</small>
                    )}
                </div>

                <div style={s.inputRow}>
                    <input 
                        style={s.input}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && processInput()}
                        placeholder="Ej: 10 GUANTES GARCIA"
                    />
                    <button onClick={processInput} style={s.sendBtn}>REGISTRAR</button>
                </div>
            </div>
        </div>
    );
};

const s = {
    container: { display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#0b141a', color: 'white' },
    chatArea: { flex: 1, overflowY: 'auto', padding: '15px', display: 'flex', flexDirection: 'column' },
    bubbleWrap: (type) => ({ alignSelf: type === 'IN' ? 'flex-start' : 'flex-end', marginBottom: '10px', maxWidth: '85%' }),
    bubble: (type) => ({
        backgroundColor: type === 'IN' ? '#202c33' : '#005c4b', 
        padding: '10px 14px', 
        borderRadius: '12px',
        borderBottomRightRadius: type === 'OUT' ? '2px' : '12px',
        borderBottomLeftRadius: type === 'IN' ? '2px' : '12px'
    }),
    workerLabel: { fontSize: '10px', color: '#8696a0', fontWeight: 'bold', marginBottom: '4px', display: 'block' },
    bubbleBody: { display: 'flex', alignItems: 'flex-end', gap: '10px' },
    time: { fontSize: '9px', color: 'rgba(255,255,255,0.5)' },
    controlPanel: { padding: '15px', backgroundColor: '#202c33', borderTop: '1px solid #2a3942' },
    workerBar: { display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '12px', scrollbarWidth: 'none' },
    workerBtn: {
        backgroundColor: '#2a3942', color: '#00a884', border: '1px solid #00a884',
        borderRadius: '20px', padding: '6px 15px', fontSize: '12px', cursor: 'pointer', whiteSpace: 'nowrap'
    },
    inputRow: { display: 'flex', gap: '10px' },
    input: { flex: 1, backgroundColor: '#2a3942', border: 'none', borderRadius: '8px', padding: '12px', color: 'white', outline: 'none' },
    sendBtn: { backgroundColor: '#00a884', color: 'white', border: 'none', borderRadius: '8px', padding: '0 20px', fontWeight: 'bold', cursor: 'pointer' }
};

export default ChatPage;