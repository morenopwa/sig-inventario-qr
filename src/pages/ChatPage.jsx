import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import useAuth from '../hooks/useAuth'; 
import { Send, ChevronLeft, ChevronRight, Mic, MicOff } from 'lucide-react';
import { format, parseISO } from 'date-fns';

// --- CONFIGURACIÓN DE INTELIGENCIA DEL ALMACÉN ---
const NICKNAMES = {
    // Apodos de Materiales -> Nombre Real en DB
    'discos chicos': 'DISCO DE CORTE 4 1/2',
    'discos grandes': 'DISCO DE CORTE 7',
    'chicos': '4 1/2',
    'grandes': '7',
    'huincha': 'HUINCHA DE 5M',
    // Apodos de Trabajadores -> Apellido en DB
    'el chato': 'CASTILLO',
    'maestro': 'GONZALES',
    'colorao': 'RODRIGUEZ'
};

const ChatPage = ({ onRefreshInventory }) => {
    const { user } = useAuth(); 
    const [input, setInput] = useState('');
    const [logs, setLogs] = useState([]);
    const [dbWorkers, setDbWorkers] = useState([]); 
    const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [isListening, setIsListening] = useState(false);
    const chatEndRef = useRef(null);
    const processingRef = useRef(false);
    const apiUrl = import.meta.env.VITE_API_URL;

    // --- MOTOR DE TRADUCCIÓN INTELIGENTE ---
    const interpretCommand = (text) => {
        let t = text.toLowerCase();
        
        // 1. Reemplazar apodos conocidos
        Object.keys(NICKNAMES).forEach(nick => {
            if (t.includes(nick)) {
                t = t.replace(nick, NICKNAMES[nick]);
            }
        });

        // 2. Normalización básica
        t = t.replace('un ', '1 ').replace('una ', '1 ').replace('par de ', '2 ');
        
        return t.toUpperCase();
    };

    const normalizeText = (text) => {
        let n = text.toUpperCase().trim();
        // Singularización básica para evitar duplicados en DB
        if (n.endsWith('S') && n.length > 4) n = n.slice(0, -1);
        return n;
    };

    const fetchData = useCallback(async () => {
        try {
            const [txRes, userRes] = await Promise.all([
                axios.get(`${apiUrl}/api/transactions?date=${selectedDate}`),
                axios.get(`${apiUrl}/api/users`)
            ]);
            setLogs(txRes.data || []);
            setDbWorkers(userRes.data || []);
        } catch (e) { console.error("Error", e); }
    }, [apiUrl, selectedDate]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const processInput = async (textToProcess = null) => {
        let rawText = (textToProcess || input).trim().toLowerCase();
        if (!rawText) return;

        if (processingRef.current) return;
        processingRef.current = true;

        // INTERPRETACIÓN
        const interpretedText = interpretCommand(rawText);
        const words = interpretedText.split(/\s+/);

        // 1. EXTRAER CANTIDAD
        let quantity = 1;
        const potentialNum = parseFloat(words.find(w => !isNaN(parseFloat(w))));
        if (!isNaN(potentialNum)) quantity = potentialNum;

        // 2. DETECTAR TRABAJADOR (Por apellido o apodo ya traducido)
        let personName = "SISTEMA";
        dbWorkers.forEach(w => {
            const lastName = w.lastName.split(' ')[0].toUpperCase();
            if (interpretedText.includes(lastName)) {
                personName = lastName;
            }
        });

        // 3. DETERMINAR TIPO (Si tú dices el nombre del trabajador suele ser préstamo = OUT)
        let type = (interpretedText.includes('INGRESO') || interpretedText.includes('ENTRO')) ? 'IN' : 'OUT';

        // 4. LIMPIAR NOMBRE DEL ITEM
        // Filtramos números, palabras de enlace y el nombre del trabajador
        const noise = ['PARA', 'DE', 'SE', 'LLEVA', 'DAME', 'ESTA', 'NUEVO', 'ENTREGA', personName, ...Object.values(NICKNAMES)];
        const itemWords = words.filter(w => isNaN(parseFloat(w)) && !noise.includes(w) && w.length > 2);
        
        const itemName = normalizeText(itemWords.join(' '));

        if (!itemName || itemName.length < 3) {
            processingRef.current = false;
            return;
        }

        const timestampLocal = `${selectedDate}T${format(new Date(), 'HH:mm:ss')}`;

        try {
            await axios.post(`${apiUrl}/api/transactions`, {
                quantity, 
                unit: 'UND', 
                itemName, 
                personName,
                category: 'GENERAL', // El backend reclasificará
                type, 
                timestamp: timestampLocal
            });
            
            setInput('');
            fetchData();
            if (onRefreshInventory) onRefreshInventory();
            new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3').play().catch(()=>{});
        } catch (e) {
            console.error("Error registro");
        } finally {
            processingRef.current = false;
        }
    };

    const handleVoice = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) return alert("No compatible");

        const rec = new SpeechRecognition();
        rec.lang = 'es-PE';
        rec.continuous = true;
        rec.interimResults = true;

        rec.onstart = () => setIsListening(true);
        rec.onend = () => setIsListening(false);

        rec.onresult = (e) => {
            for (let i = e.resultIndex; i < e.results.length; ++i) {
                const transcript = e.results[i][0].transcript.toLowerCase();
                setInput(transcript);

                // LÓGICA DE ACTIVACIÓN:
                // Solo procesa si detecta que mencionas a un trabajador DE LA BASE DE DATOS
                const mentionedWorker = dbWorkers.some(w => {
                    const lastName = w.lastName.split(' ')[0].toLowerCase();
                    return transcript.includes(lastName);
                }) || Object.keys(NICKNAMES).some(nick => transcript.includes(nick));

                if (mentionedWorker && e.results[i].isFinal) {
                    processInput(transcript);
                }
            }
        };

        isListening ? rec.stop() : rec.start();
    };

    // ... (El resto del return se mantiene igual que tu código original)
    return (
        <div style={s.container}>
             <div style={s.dateHeader}>
                <button onClick={() => {
                    const d = new Date(selectedDate + "T12:00:00");
                    d.setDate(d.getDate() - 1);
                    setSelectedDate(format(d, 'yyyy-MM-dd'));
                }} style={s.dateNavBtn}><ChevronLeft/></button>
                <input type="date" value={selectedDate} onChange={e=>setSelectedDate(e.target.value)} style={s.dateInput}/>
                <button onClick={() => {
                    const d = new Date(selectedDate + "T12:00:00");
                    d.setDate(d.getDate() + 1);
                    setSelectedDate(format(d, 'yyyy-MM-dd'));
                }} style={s.dateNavBtn}><ChevronRight/></button>
            </div>

            <div style={s.chatArea}>
                {logs.map((log, i) => (
                    <div key={i} style={s.bubbleWrap(log.type)}>
                        <div style={s.bubble(log.type)}>
                            <div style={s.bubbleRow}>
                                <span style={s.typeIcon(log.type)}>{log.type === 'IN' ? '↓' : '↑'}</span>
                                <span style={s.itemName}>{log.quantity} {log.itemName}</span>
                                <span style={s.personTag}>{log.personName}</span>
                            </div>
                        </div>
                    </div>
                ))}
                <div ref={chatEndRef} />
            </div>

            <div style={s.controlPanel}>
                <div style={s.inputRow}>
                    <button onClick={handleVoice} style={s.voiceBtn(isListening)}>
                        <Mic size={20} color={isListening ? "white" : "#00ffa3"}/>
                    </button>
                    <input 
                        style={s.input} 
                        value={input} 
                        onChange={e=>setInput(e.target.value)} 
                        onKeyDown={e=>e.key==='Enter' && processInput()} 
                        placeholder={isListening ? "Dictando comando..." : "Ej: 3 discos chicos para Castillo"}
                    />
                    <button onClick={() => processInput()} style={s.sendBtn}><Send size={18} color="white"/></button>
                </div>
            </div>
        </div>
    );
};

const s = {
    // ... (Mantén tus estilos originales aquí)
    container: { display: 'flex', flexDirection: 'column', height: 'calc(100vh - 85px)', backgroundColor: '#0b141a' },
    dateHeader: { display: 'flex', justifyContent: 'center', padding: '10px', backgroundColor: '#111b21', gap: '10px' },
    dateNavBtn: { background: 'none', border: 'none', color: '#00ffa3', cursor: 'pointer' },
    dateInput: { background: '#202c33', border: 'none', color: 'white', padding: '5px 10px', borderRadius: '10px' },
    chatArea: { flex: 1, overflowY: 'auto', padding: '15px', display: 'flex', flexDirection: 'column', gap: '10px' },
    bubbleWrap: (type) => ({ alignSelf: type === 'IN' ? 'flex-start' : 'flex-end', maxWidth: '85%' }),
    bubble: (type) => ({ backgroundColor: type === 'IN' ? '#202c33' : '#005c4b', padding: '10px 15px', borderRadius: '12px', border: '1px solid #ffffff10' }),
    bubbleRow: { display: 'flex', alignItems: 'center', gap: '8px' },
    typeIcon: (type) => ({ color: type === 'IN' ? '#00ffa3' : '#34b7f1', fontWeight: 'bold' }),
    itemName: { color: '#e9edef', fontSize: '14px', textTransform: 'uppercase', fontWeight: '500' },
    personTag: { color: '#00ffa3', fontSize: '10px', marginLeft: '10px', border: '1px solid #00ffa333', padding: '2px 4px', borderRadius: '4px' },
    controlPanel: { padding: '15px', backgroundColor: '#111b21', borderTop: '1px solid #222d34' },
    inputRow: { display: 'flex', gap: '10px', alignItems: 'center' },
    voiceBtn: (a) => ({ width: '45px', height: '45px', borderRadius: '50%', border: 'none', backgroundColor: a ? '#ea4335' : '#2a3942', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', transition: '0.3s' }),
    input: { flex: 1, backgroundColor: '#2a3942', border: 'none', borderRadius: '25px', padding: '0 20px', color: 'white', height: '45px', outline: 'none' },
    sendBtn: { width: '45px', height: '45px', borderRadius: '50%', border: 'none', backgroundColor: '#00a884', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer' }
};

export default ChatPage;