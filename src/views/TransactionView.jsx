import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import useAuth from '../hooks/useAuth'; 
import SmartScanner from '../components/SmartScanner';

const API_URL = import.meta.env.VITE_API_URL || 'https://sig-inventario-qr-backend.onrender.com';

const TransactionView = () => {
    const { user } = useAuth();
    const { tabId } = useParams();
    const navigate = useNavigate();
    
    const [activeTab, setActiveTab] = useState(tabId || 'registro'); 
    const [input, setInput] = useState('');
    const [isInputMode, setIsInputMode] = useState(false);
    const [logs, setLogs] = useState([]); 
    const [inventory, setInventory] = useState([]);
    const [frequent, setFrequent] = useState({ items: [], people: [] });
    const chatEndRef = useRef(null);

    const fetchData = useCallback(async () => {
        try {
            const [resTrans, resInv, resFreq] = await Promise.all([
                axios.get(`${API_URL}/api/transactions`),
                axios.get(`${API_URL}/api/inventory/items`),
                axios.get(`${API_URL}/api/frequent-data`)
            ]);
            setLogs(resTrans.data.reverse());
            setInventory(resInv.data);
            setFrequent(resFreq.data);
        } catch (e) { console.error("Error cargando datos"); }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);
    useEffect(() => { setActiveTab(tabId || 'registro'); }, [tabId]);
    useEffect(() => {
        if (activeTab === 'registro') chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs, activeTab]);

    // LÓGICA DEL ESCÁNER INTELIGENTE
    const handleScan = async (data) => {
        if (!data) return;
        const qr = data.trim();

        // 1. ¿Es un trabajador? (8 dígitos de DNI o empieza con TRAB)
        const esTrabajador = (qr.length === 8 && !isNaN(qr)) || qr.startsWith('TRAB-') || qr.startsWith('W-');
        alert(esTrabajador);
        if (esTrabajador) {
            try {
                const res = await axios.post(`${API_URL}/api/users/asistencia`, { workerId: qr });
                alert(`✅ ASISTENCIA REGISTRADA: ${res.data.message}`);
                navigate('/asistencia'); // Redirigir a vista de asistencia
            } catch (e) {
                alert("❌ ERROR: El trabajador con código " + qr + " no existe.");
                navigate('/almacen');
            }
        } else {
            // 2. Es un producto: lo mandamos al chat de inventario
            setInput(`1 ${qr} `);
            setActiveTab('registro');
            navigate('/almacen');
        }
    };

    const processInput = async (forcedText = null) => {
        const text = forcedText || input;
        if (!text.trim()) return;
        const match = text.match(/^(\d+)\s+(.*)$/);
        const payload = {
            cantidad: match ? parseInt(match[1]) : 1,
            itemName: (match ? match[2] : text).toUpperCase().trim(),
            persona: user?.name || "Operario",
            tipo: isInputMode ? 'ingreso' : 'salida'
        };
        try {
            await axios.post(`${API_URL}/api/transactions`, payload);
            setInput('');
            fetchData();
        } catch (e) { alert("Error al registrar"); }
    };

    const deleteItem = async (id) => {
        if (!window.confirm("¿Eliminar este item del inventario?")) return;
        try {
            await axios.delete(`${API_URL}/api/inventory/items/${id}`);
            fetchData();
        } catch (e) { alert("Error al eliminar"); }
    };

    return (
        <div style={s.container}>
            <div style={s.body}>
                {/* CHAT ESTILO WHATSAPP */}
                {activeTab === 'registro' && (
                    <div style={s.chatBg}>
                        {logs.map((log, i) => (
                            <div key={i} style={s.bubble(log.tipo)}>
                                <small style={s.userLabel}>{log.persona}</small>
                                <div>{log.tipo === 'ingreso' ? '➕' : '➖'} {log.cantidad} {log.itemName}</div>
                            </div>
                        ))}
                        <div ref={chatEndRef} />
                    </div>
                )}

                {/* ESCÁNER (Solo se monta si la pestaña es scanner) */}
                {activeTab === 'scanner' && (
                    <div style={{ padding: '20px', textAlign: 'center' }}>
                        <h3 style={{color: 'white', marginBottom: '15px'}}>Enfoque el código QR</h3>
                        <SmartScanner onScanSuccess={handleScan} />
                        <button onClick={() => navigate('/almacen')} style={s.cancelBtn}>Cancelar</button>
                    </div>
                )}

                {/* TABLA DE INVENTARIO ORGANIZADA */}
                {activeTab === 'inventario' && (
                    <div style={{ padding: '15px' }}>
                        <table style={s.table}>
                            <thead>
                                <tr>
                                    <th style={s.th}>Producto</th>
                                    <th style={s.th}>Stock</th>
                                    <th style={s.th}>Acción</th>
                                </tr>
                            </thead>
                            <tbody>
                                {inventory.map(item => (
                                    <tr key={item._id}>
                                        <td style={s.td}>{item.name}</td>
                                        <td style={{...s.td, color: item.stock > 0 ? '#00ffb2' : '#ff5252'}}>{item.stock}</td>
                                        <td style={s.td}>
                                            <button onClick={() => deleteItem(item._id)} style={{background:'none', border:'none', cursor:'pointer'}}>🗑️</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* BARRA DE ENTRADA CON BOTONES RÁPIDOS */}
            {activeTab === 'registro' && (
                <div style={s.footer}>
                    <div style={s.shortcuts}>
                        {frequent.items.map((item, i) => (
                            <button key={i} onClick={() => processInput(`1 ${item.name}`)} style={s.shortBtn}>
                                {item.name.split(' ')[0]}
                            </button>
                        ))}
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <button onClick={() => setIsInputMode(!isInputMode)} style={s.toggle(isInputMode)}>
                            {isInputMode ? '+' : '-'}
                        </button>
                        <input style={s.input} value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && processInput()} placeholder="1 martillo..." />
                        <button onClick={() => processInput()} style={s.send}>➤</button>
                    </div>
                </div>
            )}
        </div>
    );
};

const s = {
    container: { display: 'flex', flexDirection: 'column', height: 'calc(100vh - 65px)', backgroundColor: '#0b141a' },
    body: { flex: 1, overflowY: 'auto' },
    chatBg: { padding: '15px', display: 'flex', flexDirection: 'column', backgroundImage: "url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded51.png')", backgroundSize: '400px', minHeight: '100%' },
    bubble: (t) => ({ alignSelf: t === 'salida' ? 'flex-end' : 'flex-start', backgroundColor: t === 'salida' ? '#005c4b' : '#202c33', color: 'white', padding: '10px', borderRadius: '10px', marginBottom: '8px', maxWidth: '85%' }),
    userLabel: { fontSize: '10px', color: '#ffd700', fontWeight: 'bold' },
    footer: { padding: '10px', backgroundColor: '#202c33' },
    shortcuts: { display: 'flex', gap: '5px', overflowX: 'auto', marginBottom: '8px' },
    shortBtn: { backgroundColor: '#3b4a54', border: 'none', color: 'white', padding: '5px 12px', borderRadius: '15px', fontSize: '12px', whiteSpace: 'nowrap' },
    input: { flex: 1, borderRadius: '20px', border: 'none', padding: '12px', backgroundColor: '#2a3942', color: 'white', outline: 'none' },
    toggle: (is) => ({ borderRadius: '50%', width: '40px', height: '40px', border: 'none', backgroundColor: is ? '#00a884' : '#ff5252', color: 'white', fontSize: '20px' }),
    send: { borderRadius: '50%', width: '40px', height: '40px', border: 'none', backgroundColor: '#00a884', color: 'white' },
    cancelBtn: { marginTop: '20px', backgroundColor: '#ff5252', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px' },
    table: { width: '100%', color: 'white', borderCollapse: 'collapse' },
    th: { textAlign: 'left', padding: '10px', borderBottom: '1px solid #2a3942', color: '#8696a0' },
    td: { padding: '10px', borderBottom: '1px solid #111b21' }
};

export default TransactionView;