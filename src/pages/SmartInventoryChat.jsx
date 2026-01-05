import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

// --- COMPONENTE DE BOTÓN CON BORRADO ---
const ItemShortcut = ({ item, onDelete, onClick }) => {
    const [isDeleting, setIsDeleting] = useState(false);
    const [timer, setTimer] = useState(null);

    const startTimer = () => {
        const t = setTimeout(() => setIsDeleting(true), 2000);
        setTimer(t);
    };

    const stopTimer = () => {
        if (timer) {
            clearTimeout(timer);
            setTimer(null);
        }
    };

    const handleClick = () => {
        if (isDeleting) {
            onDelete(item.name);
            setIsDeleting(false);
        } else {
            onClick(item.name);
        }
    };

    return (
        <button
            onMouseDown={startTimer}
            onMouseUp={stopTimer}
            onMouseLeave={stopTimer}
            onTouchStart={startTimer}
            onTouchEnd={stopTimer}
            onClick={handleClick}
            style={{
                backgroundColor: isDeleting ? '#ff4d4d' : '#111b21',
                color: isDeleting ? 'white' : '#00a884',
                border: isDeleting ? 'none' : '1px solid #00a884',
                padding: '8px 15px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: 'bold',
                whiteSpace: 'nowrap',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                flexShrink: 0
            }}
        >
            {isDeleting ? `Eliminar ${item.name} X` : item.name}
        </button>
    );
};

const SmartInventoryChat = ({ onRefreshInventory }) => {
    const [input, setInput] = useState('');
    const [isInputMode, setIsInputMode] = useState(false); // false = Salida (-), true = Ingreso (+)
    const [logs, setLogs] = useState([]);
    const [frequent, setFrequent] = useState({ items: [], people: [] });
    const chatEndRef = useRef(null);

    // Cargar historial de burbujas y atajos
    const fetchData = async () => {
        try {
            const logsRes = await axios.get(`${API_URL}/api/transactions`);
            setLogs(logsRes.data);
            const freqRes = await axios.get(`${API_URL}/api/frequent-data`);
            setFrequent(freqRes.data);
        } catch (e) {
            console.error("Error cargando datos del chat:", e);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [logs]);

    // Manejo de clicks en burbujas de atajos
    const handleItemClick = (itemName) => {
        const regex = /^(\d+)\s+(.+)$/;
        const match = input.match(regex);
        
        if (match && match[2].trim().toUpperCase() === itemName.toUpperCase()) {
            const newQty = parseInt(match[1]) + 1;
            setInput(`${newQty} ${itemName} `);
        } else {
            setInput(`1 ${itemName} `);
        }
    };

    const handlePersonClick = (nombre) => {
        if (input.includes(nombre)) {
            setInput(prev => prev.replace(nombre, '').trim());
        } else {
            setInput(prev => `${prev.trim()} ${nombre}`.trim());
        }
    };

    const handleDeleteItem = async (name) => {
        if (window.confirm(`¿Quitar "${name}" de los atajos rápidos?`)) {
            try {
                await axios.delete(`${API_URL}/api/frequent-data/item/${encodeURIComponent(name)}`);
                fetchData(); 
            } catch (err) {
                console.error("Error al eliminar atajo:", err);
            }
        }
    };

    // PROCESAR EL TEXTO Y ENVIAR AL BACKEND
    const processInput = async () => {
        let text = input.trim();
        if (!text) return;

        let quantity = 1;
        const qtyMatch = text.match(/^(\d+)\s+(.*)$/);
        
        if (qtyMatch) {
            quantity = parseInt(qtyMatch[1]);
            text = qtyMatch[2];
        }

        const words = text.split(' ');
        let persona = words.length > 1 ? words.pop() : "General";
        let itemName = (words.join(' ') || text).toUpperCase();
        
        persona = persona.charAt(0).toUpperCase() + persona.slice(1).toLowerCase();

        // Creamos el objeto exactamente como lo espera tu backend
        const newLog = {
            cantidad: quantity,
            itemName: itemName.trim(),
            persona: persona.trim(),
            tipo: isInputMode ? 'ingreso' : 'salida',
            timestamp: new Date().toISOString()
        };

        try {
            // 1. Guardar la transacción
            await axios.post(`${API_URL}/api/transactions`, newLog);
            
            // 2. Limpiar UI
            setInput('');
            setIsInputMode(false); 
            
            // 3. Recargar datos locales del chat
            await fetchData(); 
            
            // 4. 🔥 SINCRO: Avisar a la InventoryPage que el stock cambió
            if (onRefreshInventory) {
                onRefreshInventory(); 
            }
            
        } catch (e) {
            alert(e.response?.data?.error || "Error al registrar. Asegúrate que el item existe.");
        }
    };

    // --- ESTILOS INTERNOS ---
    const s = {
        container: { display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: '#0b141a' },
        chatArea: { 
            flex: 1, overflowY: 'auto', padding: '15px', 
            backgroundImage: "url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded51.png')", 
            backgroundSize: '400px', display: 'flex', flexDirection: 'column'
        },
        bubble: (tipo) => ({
            alignSelf: tipo === 'salida' ? 'flex-end' : 'flex-start',
            backgroundColor: tipo === 'salida' ? '#005c4b' : '#202c33',
            padding: '8px 12px', borderRadius: '8px', marginBottom: '10px',
            maxWidth: '85%', minWidth: '150px', boxShadow: '0 1px 2px rgba(0,0,0,0.5)',
            borderLeft: tipo === 'salida' ? 'none' : '4px solid #00a884'
        }),
        footer: { backgroundColor: '#202c33', padding: '12px', borderTop: '1px solid #2a3942' },
        inputRow: { display: 'flex', gap: '10px', alignItems: 'center', margin: '10px 0', position: 'relative' },
        btnCircle: (active, mode) => ({
            width: '45px', height: '45px', borderRadius: '50%', border: 'none',
            backgroundColor: active ? (mode ? '#00a884' : '#ea0038') : '#3b4a54', 
            color: 'white', fontSize: '24px', cursor: 'pointer', transition: 'all 0.2s'
        }),
        clearBtn: {
            position: 'absolute', right: '15px', background: 'none', border: 'none', color: '#8696a0', fontSize: '20px', cursor: 'pointer', zIndex: 10
        }
    };

    return (
        <div style={s.container}>
            <div style={s.chatArea} className="no-scrollbar">
                {logs.map((log, idx) => (
                    <div key={log._id || idx} style={s.bubble(log.tipo)}>
                        <div style={{ fontSize: '11px', color: '#00a884', fontWeight: 'bold', textTransform: 'uppercase' }}>
                            {log.persona}
                        </div>
                        <div style={{ fontSize: '16px', color: '#e9edef', margin: '4px 0' }}>
                            {log.tipo === 'salida' ? '−' : '+'} {log.cantidad} {log.itemName}
                        </div>
                        <div style={{ textAlign: 'right', fontSize: '10px', color: '#8696a0' }}>
                            {log.timestamp ? new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Reciente'} ✓✓
                        </div>
                    </div>
                ))}
                <div ref={chatEndRef} />
            </div>

            <div style={s.footer}>
                {/* Atajos de Items */}
                <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '10px' }} className="no-scrollbar">
                    {frequent.items.map((item, idx) => (
                        <ItemShortcut 
                            key={item._id || `item-${idx}`} 
                            item={item} 
                            onClick={handleItemClick} 
                            onDelete={handleDeleteItem} 
                        />
                    ))}
                </div>

                <div style={s.inputRow}>
                    <button 
                        style={s.btnCircle(isInputMode, isInputMode)} 
                        onClick={() => setIsInputMode(!isInputMode)}
                    >
                        {isInputMode ? '+' : '−'}
                    </button>
                    
                    <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <input 
                            style={{ 
                                width: '100%', backgroundColor: '#2a3942', border: 'none', 
                                borderRadius: '25px', padding: '12px 40px 12px 20px', 
                                color: 'white', outline: 'none', fontSize: '15px' 
                            }}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && processInput()}
                            placeholder="Cantidad Elemento Persona..."
                        />
                        {input && (
                            <button onClick={() => setInput('')} style={s.clearBtn}>✕</button>
                        )}
                    </div>

                    <button 
                        onClick={processInput} 
                        style={{ 
                            backgroundColor: '#00a884', color: 'white', border: 'none', 
                            padding: '12px 25px', borderRadius: '25px', fontWeight: 'bold', cursor: 'pointer' 
                        }}
                    >
                        OK
                    </button>
                </div>

                {/* Atajos de Personas */}
                <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingTop: '5px' }} className="no-scrollbar">
                    {frequent.people.map((p, idx) => (
                        <button 
                            key={`person-${idx}`} 
                            onClick={() => handlePersonClick(p)}
                            style={{
                                padding: '8px 15px', borderRadius: '20px', border: 'none', whiteSpace: 'nowrap',
                                backgroundColor: input.includes(p) ? '#00a884' : '#2a3942',
                                color: input.includes(p) ? 'white' : '#aebac1', 
                                fontSize: '12px', fontWeight: 'bold', cursor: 'pointer'
                            }}
                        >
                            {p}
                        </button>
                    ))}
                </div>
            </div>

            <style>{`
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </div>
    );
};

export default SmartInventoryChat;