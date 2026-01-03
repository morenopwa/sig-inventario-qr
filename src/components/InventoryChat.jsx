import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
  Disc, Glove, Zap, Trash2, Edit2, Plus, Minus, 
  Mic, Send, HardHat, Wrench, Box, User, X, CheckCheck
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const InventoryChat = () => {
  const [input, setInput] = useState('');
  const [isInputMode, setIsInputMode] = useState(false); 
  const [logs, setLogs] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [frequent, setFrequent] = useState({ items: [], people: [] });
  const chatEndRef = useRef(null);

  useEffect(() => {
    fetchFrequent();
    // Cargar logs locales del día si existen
    const savedLogs = localStorage.getItem('daily_logs');
    if (savedLogs) setLogs(JSON.parse(savedLogs));
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    localStorage.setItem('daily_logs', JSON.stringify(logs));
  }, [logs]);

  const fetchFrequent = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/frequent-data`);
      setFrequent(res.data);
    } catch (e) { console.error("Error cargando frecuencias", e); }
  };

  const getIcon = (name = "") => {
    const t = name.toLowerCase();
    if (t.includes('disco')) return <Disc size={20} className="text-blue-400" />;
    if (t.includes('guante')) return <Glove size={20} className="text-yellow-400" />;
    if (t.includes('electro')) return <Zap size={20} className="text-purple-400" />;
    if (t.includes('casco')) return <HardHat size={20} className="text-orange-400" />;
    return <Box size={20} className="text-emerald-400" />;
  };

  const handleItemClick = (name) => {
    const match = input.match(/^(\d+)\s+/);
    if (match) {
      setInput(`${parseInt(match[1]) + 1} ${name} `);
    } else {
      setInput(`1 ${name} `);
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    const regex = /^(\d+)\s+(.+?)\s+([A-Z][a-z]+.*)$/;
    const match = input.match(regex);

    if (!match) return alert("Formato: [Cantidad] [Item] [Persona con Mayúscula]");

    const newItem = {
      id: editingId || Date.now(),
      cantidad: parseInt(match[1]),
      itemName: match[2].trim(),
      persona: match[3].trim(),
      tipo: isInputMode ? 'ingreso' : 'salida',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    if (editingId) {
      setLogs(logs.map(l => l.id === editingId ? newItem : l));
      setEditingId(null);
    } else {
      setLogs([...logs, newItem]);
    }
    
    setInput('');
    setIsInputMode(false);
  };

  return (
    <div className="flex flex-col h-screen bg-[#0b141a] text-[#e9edef] font-sans overflow-hidden">
      {/* ATAJOS ITEMS */}
      <div className="p-2 flex gap-2 overflow-x-auto bg-[#202c33] border-b border-white/5 shadow-lg">
        {frequent.items.map(item => (
          <button key={item._id} onClick={() => handleItemClick(item.name)}
            className="flex items-center gap-2 bg-[#2a3942] px-4 py-2 rounded-xl text-xs whitespace-nowrap active:scale-90 transition-all">
            {getIcon(item.name)} {item.name}
          </button>
        ))}
      </div>

      {/* CHAT AREA */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded51.png')] bg-fixed">
        {logs.map((log) => (
          <div key={log.id} className={`flex ${log.tipo === 'salida' ? 'justify-end' : 'justify-start'} group`}>
            <div className={`relative max-w-[85%] p-3 rounded-xl shadow-md ${log.tipo === 'salida' ? 'bg-[#005c4b] rounded-tr-none' : 'bg-[#202c33] rounded-tl-none'}`}>
              <div className="absolute -top-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => {setEditingId(log.id); setInput(`${log.cantidad} ${log.itemName} ${log.persona}`)}} className="bg-blue-600 p-1.5 rounded-full"><Edit2 size={12}/></button>
                <button onClick={() => setLogs(logs.filter(l => l.id !== log.id))} className="bg-red-600 p-1.5 rounded-full"><Trash2 size={12}/></button>
              </div>
              <p className="font-bold text-lg">{log.tipo === 'salida' ? '-' : '+'}{log.cantidad} <span className="text-sm font-normal uppercase">{log.itemName}</span></p>
              <p className="text-xs opacity-70 flex items-center gap-1"><User size={10}/> {log.persona}</p>
              <span className="text-[10px] text-right block mt-1 opacity-40">{log.timestamp} <CheckCheck size={12} className="inline ml-1 text-blue-400"/></span>
            </div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      {/* ATAJOS PERSONAS */}
      <div className="px-4 py-2 bg-[#202c33]/90 flex gap-2 overflow-x-auto border-t border-white/5">
        {frequent.people.map(p => (
          <button key={p} onClick={() => setInput(prev => `${prev.trim()} ${p}`)}
            className="text-[11px] bg-[#2a3942] border border-white/10 px-3 py-1 rounded-full whitespace-nowrap">
            {p}
          </button>
        ))}
      </div>

      {/* INPUT WHATSAPP */}
      <div className="p-3 bg-[#202c33] flex items-center gap-2">
        <button onClick={() => setIsInputMode(!isInputMode)}
          className={`p-3 rounded-full ${isInputMode ? 'bg-emerald-500' : 'bg-[#2a3942] text-orange-400'}`}>
          {isInputMode ? <Plus /> : <Minus />}
        </button>
        <input className="flex-1 bg-[#2a3942] rounded-full px-5 py-3 outline-none text-sm"
          value={input} onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder={isInputMode ? "Ingreso de stock..." : "2 disco Juan..."}
        />
        <button onClick={handleSend} className="bg-[#00a884] p-3 rounded-full">
          {input.trim() ? <Send size={24}/> : <Mic size={24}/>}
        </button>
      </div>
    </div>
  );
};

export default InventoryChat;