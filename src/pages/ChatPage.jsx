import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import useAuth from '../hooks/useAuth'; 
import { Send, ChevronLeft, ChevronRight, Mic, MicOff } from 'lucide-react';
import { format, parseISO } from 'date-fns';

const ChatPage = ({ onRefreshInventory }) => {
    const { user } = useAuth(); 
    const [input, setInput] = useState('');
    const [logs, setLogs] = useState([]);
    const [dbWorkers, setDbWorkers] = useState([]); 
    const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [isListening, setIsListening] = useState(false);
    const chatEndRef = useRef(null);
    const apiUrl = import.meta.env.VITE_API_URL;

    // --- MOTOR DE NORMALIZACIÓN (Singularización y Ortografía) ---
    const normalizeText = (text) => {
        let n = text.toLowerCase().trim();
        
        // Diccionario de correcciones específicas y plurales irregulares
        const corrections = {
            'wincha': 'huincha', 'winchas': 'huincha', 'huinchas': 'huincha',
            'polifanes': 'polifan', 'polifans': 'polifan',
            'micas': 'mica', 'guantes': 'guante', 'lentes': 'lente',
            'discos': 'disco', 'brocas': 'broca', 'clavos': 'clavo',
            'zapatos': 'zapato', 'botas': 'bota', 'cascos': 'casco'
        };

        const words = n.split(/\s+/).map(word => {
            // 1. Verificación en diccionario
            if (corrections[word]) return corrections[word];
            // 2. Regla general de plurales (quitar 's' final si la palabra es larga)
            if (word.endsWith('s') && word.length > 3) return word.slice(0, -1);
            return word;
        });
        return words.join(' ').toUpperCase();
    };

    const textToNumber = (text) => {
        const numbers = {
            'un': 1, 'uno': 1, 'una': 1, 'dos': 2, 'tres': 3, 'cuatro': 4, 
            'cinco': 5, 'seis': 6, 'siete': 7, 'ocho': 8, 'nueve': 9, 'diez': 10
        };
        return numbers[text.toLowerCase()] || null;
    };

    const classifyCategory = (name) => {
        const n = name.toUpperCase();
        if (['LENTE', 'GUANTE', 'CASCO', 'ZAPATO', 'BOTA', 'MICA'].some(p => n.includes(p))) return 'EPP';
        if (['MARTILLO', 'TALADRO', 'AMOLADORA', 'LLAVE', 'HUINCHA'].some(p => n.includes(p))) return 'HERRAMIENTAS';
        return 'CONSUMIBLES';
    };

    const fetchData = useCallback(async () => {
        try {
            const [txRes, userRes] = await Promise.all([
                axios.get(`${apiUrl}/api/transactions?date=${selectedDate}`),
                axios.get(`${apiUrl}/api/users`)
            ]);
            setLogs(txRes.data || []);
            setDbWorkers(userRes.data || []);
            chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
        } catch (e) { console.error("Error cargando datos", e); }
    }, [apiUrl, selectedDate]);

    useEffect(() => { fetchData(); }, [fetchData]);

    // --- PROCESAMIENTO DE ENTRADA ---
    const processInput = async () => {
        let text = input.trim().toLowerCase();
        if (!text) return;

        const words = text.split(/\s+/);
        const unitsDict = ['kg', 'par', 'pares', 'und', 'unidad', 'mt', 'mts', 'bolsa'];

        // 1. Cantidad
        let quantity = 1;
        let unit = 'UND';
        let wordsToSkip = 0;

        const firstWordAsNum = parseFloat(words[0]);
        const firstWordAsText = textToNumber(words[0]);

        if (!isNaN(firstWordAsNum)) { quantity = firstWordAsNum; wordsToSkip = 1; }
        else if (firstWordAsText) { quantity = firstWordAsText; wordsToSkip = 1; }

        if (words[wordsToSkip] && unitsDict.includes(words[wordsToSkip])) {
            unit = words[wordsToSkip].toUpperCase();
            wordsToSkip++;
        }

        // 2. Persona
        let personName = user?.lastName ? user.lastName.split(' ')[0].toUpperCase() : "SISTEMA";
        let detectedWorkerKey = "";

        dbWorkers.forEach(w => {
            const lastName = w.lastName.split(' ')[0].toLowerCase();
            if (text.includes(lastName)) {
                detectedWorkerKey = lastName;
                personName = lastName.toUpperCase();
            }
        });
        if (text.includes('sima')) personName = 'SIMA';

        // 3. Tipo (Prioridad Salida)
        let type = (text.includes('ingreso') || text.includes('entro') || personName === 'SIMA') ? 'IN' : 'OUT';

        // 4. Limpieza de Nombre de Producto
        const finalWords = words.slice(wordsToSkip).filter(w => {
            const isPerson = (detectedWorkerKey && w.includes(detectedWorkerKey)) || personName.toLowerCase().includes(w);
            const isAction = ['para', 'de', 'se', 'un', 'una', 'el', 'la', 'con', 'en', 'lleva', 'llevan'].includes(w);
            return !isPerson && !isAction && !unitsDict.includes(w);
        });

        const itemName = normalizeText(finalWords.join(' '));
        if (!itemName) return alert("Producto no identificado");

        const timestampLocal = `${selectedDate}T${format(new Date(), 'HH:mm:ss')}`;

        try {
            await axios.post(`${apiUrl}/api/transactions`, {
                quantity, unit, itemName, personName,
                category: classifyCategory(itemName),
                type, timestamp: timestampLocal
            });
            setInput('');
            fetchData();
            if (onRefreshInventory) onRefreshInventory();
            new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3').play().catch(()=>{});
        } catch (e) { alert("Error al registrar"); }
    };

    const handleVoice = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) return alert("No compatible");
        const rec = new SpeechRecognition();
        rec.lang = 'es-PE';
        rec.onstart = () => setIsListening(true);
        rec.onend = () => setIsListening(false);
        rec.onresult = (e) => setInput(e.results[0][0].transcript);
        rec.start();
    };

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
                    <input style={s.input} value={input} onChange={e=>setInput(e.target.value)} 
                           onKeyDown={e=>e.key==='Enter' && processInput()} placeholder="Ej: 2 winchas mendoza"/>
                    <button onClick={processInput} style={s.sendBtn}><Send size={18} color="white"/></button>
                </div>
            </div>
        </div>
    );
};

const s = {
    container: { display: 'flex', flexDirection: 'column', height: 'calc(100vh - 85px)', backgroundColor: '#0b141a' },
    dateHeader: { display: 'flex', justifyContent: 'center', padding: '10px', backgroundColor: '#111b21', gap: '10px' },
    dateNavBtn: { background: 'none', border: 'none', color: '#00ffa3', cursor: 'pointer' },
    dateInput: { background: '#202c33', border: 'none', color: 'white', padding: '5px 10px', borderRadius: '10px' },
    chatArea: { flex: 1, overflowY: 'auto', padding: '15px', display: 'flex', flexDirection: 'column', gap: '10px' },
    bubbleWrap: (type) => ({ alignSelf: type === 'IN' ? 'flex-start' : 'flex-end', maxWidth: '85%' }),
    bubble: (type) => ({ backgroundColor: type === 'IN' ? '#202c33' : '#005c4b', padding: '10px 15px', borderRadius: '12px' }),
    bubbleRow: { display: 'flex', alignItems: 'center', gap: '8px' },
    typeIcon: (type) => ({ color: type === 'IN' ? '#00ffa3' : '#34b7f1', fontWeight: 'bold' }),
    itemName: { color: '#e9edef', fontSize: '14px', textTransform: 'uppercase' },
    personTag: { color: '#00ffa3', fontSize: '10px', marginLeft: '10px', border: '1px solid #00ffa333', padding: '2px 4px' },
    controlPanel: { padding: '15px', backgroundColor: '#111b21' },
    inputRow: { display: 'flex', gap: '10px' },
    voiceBtn: (a) => ({ width: '45px', height: '45px', borderRadius: '50%', border: 'none', backgroundColor: a ? '#ea4335' : '#2a3942' }),
    input: { flex: 1, backgroundColor: '#2a3942', border: 'none', borderRadius: '25px', padding: '0 20px', color: 'white' },
    sendBtn: { width: '45px', height: '45px', borderRadius: '50%', border: 'none', backgroundColor: '#00a884' }
};

export default ChatPage;