import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import useAuth from '../hooks/useAuth'; 
import { Send, Plus, Minus, Box, User as UserIcon, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';

const ChatPage = ({ onRefreshInventory }) => {
    const { user } = useAuth(); 
    const [input, setInput] = useState('');
    const [logs, setLogs] = useState([]);
    const [inventoryItems, setInventoryItems] = useState([]); 
    const [dbWorkers, setDbWorkers] = useState([]); 
    const [isInputMode, setIsInputMode] = useState(false); 
    const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [isLoading, setIsLoading] = useState(false);
    const chatEndRef = useRef(null);
    const apiUrl = import.meta.env.VITE_API_URL;

    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [txRes, invRes, userRes] = await Promise.all([
                axios.get(`${apiUrl}/api/transactions?date=${selectedDate}`),
                axios.get(`${apiUrl}/api/inventory/items`),
                axios.get(`${apiUrl}/api/users`)
            ]);
            setLogs(txRes.data || []);
            setInventoryItems(invRes.data || []);
            setDbWorkers(userRes.data || []);
            setTimeout(scrollToBottom, 100);
        } catch (e) { console.error(e); }
        finally { setIsLoading(false); }
    }, [apiUrl, selectedDate]);

    useEffect(() => { fetchData(); }, [fetchData]);
    useEffect(() => { scrollToBottom(); }, [logs]);

    const changeDate = (days) => {
        const parts = selectedDate.split('-').map(Number);
        const date = new Date(parts[0], parts[1] - 1, parts[2]);
        date.setDate(date.getDate() + days);
        setSelectedDate(format(date, 'yyyy-MM-dd'));
    };

    const handleShortcut = (text) => {
        const words = input.trim().split(' ');
        words.pop();
        setInput([...words, text.toUpperCase()].join(' ').trim() + ' ');
    };

    const processInput = async () => {
        const rawText = input.trim();
        if (!rawText) return;

        const regex = /^([\d.]+)\s*([a-zA-Z]{1,3})?\s+(.+)$/i;
        const match = rawText.match(regex);
        let quantity = 1, manualUnit = null, remainder = rawText;
        
        if (match) {
            quantity = parseFloat(match[1]);
            manualUnit = match[2] ? match[2].toUpperCase() : null; 
            remainder = match[3];
        }

        const words = remainder.split(/\s+/);
        const currentUserLastName = user?.lastName ? user.lastName.split(' ')[0].toUpperCase() : "SISTEMA";
        let personName = currentUserLastName; 
        let itemName = remainder.toUpperCase();

        if (words.length > 1) {
            const lastWord = words[words.length - 1].toUpperCase();
            if (lastWord === 'SIMA') {
                personName = 'SIMA';
                itemName = words.slice(0, -1).join(' ').toUpperCase();
            } else {
                const workerFound = dbWorkers.find(w => w.lastName.toUpperCase().split(' ')[0] === lastWord);
                if (workerFound) {
                    personName = lastWord;
                    itemName = words.slice(0, -1).join(' ').toUpperCase();
                }
            }
        }

        const now = new Date();
        const [year, month, day] = selectedDate.split('-').map(Number);
        const finalTimestamp = new Date(year, month - 1, day, now.getHours(), now.getMinutes(), now.getSeconds());

        try {
            await axios.post(`${apiUrl}/api/transactions`, {
                quantity, 
                unit: manualUnit || 'UND', 
                itemName, 
                personName,
                type: personName === 'SIMA' ? 'IN' : (isInputMode ? 'IN' : 'OUT'),
                timestamp: finalTimestamp 
            });
            setInput('');
            fetchData();
            if (onRefreshInventory) onRefreshInventory(); 
        } catch (e) { alert("Error al registrar"); }
    };

    const lastWord = input.split(' ').pop().toLowerCase();
    const filteredItems = input.trim() && lastWord.length > 1 ? inventoryItems.filter(i => i.name.toLowerCase().includes(lastWord)).slice(0, 4) : [];
    const filteredWorkers = input.trim() && lastWord.length > 1 ? dbWorkers.filter(w => w.lastName.toLowerCase().includes(lastWord)).slice(0, 4) : [];

    return (
        <div style={s.container}>
            <div style={s.dateHeader}>
                <button onClick={() => changeDate(-1)} style={s.dateNavBtn}><ChevronLeft size={24}/></button>
                <div style={s.dateDisplay}>
                    <Calendar size={16} style={{marginRight: '8px', color: '#00ffa3'}} />
                    <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} style={s.dateInput} />
                </div>
                <button onClick={() => changeDate(1)} style={s.dateNavBtn}><ChevronRight size={24}/></button>
            </div>

            <div style={s.chatArea}>
                {logs.map((log, i) => (
                    <div key={i} style={s.bubbleWrap(log.type)}>
                        <div style={s.bubble(log.type)}>
                            <div style={s.bubbleRow}>
                                <div style={s.typeIcon(log.type)}>{log.type === 'IN' ? '+' : '-'}</div>
                                <span style={s.itemName}>{log.quantity} {log.unit !== 'UND' ? log.unit : ''} {log.itemName}</span>
                                <span style={s.personTag}>{log.personName}</span>
                            </div>
                            <small style={s.time}>{format(new Date(log.timestamp), "HH:mm")}</small>
                        </div>
                    </div>
                ))}
                <div ref={chatEndRef} />
            </div>

            <div style={s.controlPanel}>
                {(filteredItems.length > 0 || filteredWorkers.length > 0) && (
                    <div style={s.shortcutBar}>
                        {filteredItems.map(i => <button key={i._id} onClick={() => handleShortcut(i.name)} style={s.itemBtn}><Box size={12}/> {i.name}</button>)}
                        {filteredWorkers.map(w => <button key={w._id} onClick={() => handleShortcut(w.lastName.split(' ')[0])} style={s.workerBtn}><UserIcon size={12}/> {w.lastName.split(' ')[0]}</button>)}
                    </div>
                )}
                <div style={s.inputRow}>
                    <button onClick={() => setIsInputMode(!isInputMode)} style={s.modeBtn(isInputMode)}>{isInputMode ? <Plus/> : <Minus/>}</button>
                    <input style={s.input} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && processInput()} placeholder="Escribe..." />
                    <button onClick={processInput} style={s.sendBtn}><Send size={18}/></button>
                </div>
            </div>
        </div>
    );
};

const s = {
    container: { display: 'flex', flexDirection: 'column', height: 'calc(100vh - 85px)', backgroundColor: '#0b141a' },
    dateHeader: { display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '10px', backgroundColor: '#111b21', gap: '20px' },
    dateNavBtn: { background: 'none', border: 'none', color: '#00ffa3', cursor: 'pointer' },
    dateDisplay: { display: 'flex', alignItems: 'center', background: '#202c33', padding: '5px 15px', borderRadius: '20px' },
    dateInput: { background: 'none', border: 'none', color: 'white', fontSize: '13px', outline: 'none' },
    chatArea: { flex: 1, overflowY: 'auto', padding: '15px', display: 'flex', flexDirection: 'column', gap: '8px' },
    bubbleWrap: (type) => ({ alignSelf: type === 'IN' ? 'flex-start' : 'flex-end', maxWidth: '90%' }),
    bubble: (type) => ({ backgroundColor: type === 'IN' ? '#202c33' : '#005c4b', padding: '10px', borderRadius: '12px' }),
    bubbleRow: { display: 'flex', alignItems: 'center', gap: '10px' },
    typeIcon: (type) => ({ color: type === 'IN' ? '#00ffa3' : '#ff5555', fontWeight: 'bold', fontSize: '18px' }),
    itemName: { fontSize: '14px', color: 'white' },
    personTag: { color: '#34b7f1', fontSize: '11px', fontWeight: 'bold', marginLeft: 'auto', backgroundColor: 'rgba(52, 183, 241, 0.1)', padding: '2px 6px', borderRadius: '5px' },
    time: { fontSize: '9px', color: '#8696a0', textAlign: 'right', display: 'block', marginTop: '4px' },
    controlPanel: { padding: '10px', backgroundColor: '#202c33' },
    shortcutBar: { display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px' },
    itemBtn: { backgroundColor: '#3b4a54', color: 'white', border: 'none', borderRadius: '15px', padding: '6px 12px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '12px' },
    workerBtn: { border: '1px solid #34b7f1', color: '#34b7f1', background: 'none', borderRadius: '15px', padding: '6px 12px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '5px' },
    inputRow: { display: 'flex', gap: '8px' },
    input: { flex: 1, backgroundColor: '#2a3942', border: 'none', borderRadius: '20px', padding: '10px 15px', color: 'white', outline: 'none' },
    modeBtn: (isIN) => ({ width: '45px', height: '45px', borderRadius: '50%', border: 'none', backgroundColor: isIN ? '#00ffa3' : '#ff5555' }),
    sendBtn: { width: '45px', height: '45px', borderRadius: '50%', border: 'none', backgroundColor: '#00a884', color: 'white' }
};

export default ChatPage;