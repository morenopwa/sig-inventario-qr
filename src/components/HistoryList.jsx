import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

const HistoryList = ({ onClose }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'chat', 'qr'

  useEffect(() => {
    fetchGlobalHistory();
  }, []);

  const fetchGlobalHistory = async () => {
    try {
      setLoading(true);
      // Traemos la ruta unificada que creamos en el backend
      const response = await axios.get(`${API_URL}/api/transactions`);
      setLogs(response.data);
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => {
    if (filter === 'all') return true;
    if (filter === 'chat') return !!log.itemName; // Los del chat tienen itemName
    if (filter === 'qr') return !!log.itemId;     // Los de QR tienen itemId
    return true;
  });

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: '900px', width: '95%', maxHeight: '85vh' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2>📊 Historial Unificado</h2>
          <button onClick={onClose} style={s.closeBtn}>✕</button>
        </div>

        {/* Filtros rápidos */}
        <div style={{ marginBottom: '15px', display: 'flex', gap: '10px' }}>
          <button onClick={() => setFilter('all')} style={s.filterBtn(filter === 'all')}>Todos</button>
          <button onClick={() => setFilter('chat')} style={s.filterBtn(filter === 'chat')}>💬 Chat</button>
          <button onClick={() => setFilter('qr')} style={s.filterBtn(filter === 'qr')}>📷 QR/Inventario</button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>⏳ Cargando movimientos...</div>
        ) : (
          <div style={{ overflowY: 'auto', maxHeight: '60vh' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ position: 'sticky', top: 0, background: '#f8f9fa' }}>
                <tr style={{ textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>
                  <th style={s.th}>Fecha</th>
                  <th style={s.th}>Origen</th>
                  <th style={s.th}>Responsable</th>
                  <th style={s.th}>Movimiento</th>
                  <th style={s.th}>Cant.</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => {
                  const isChat = !!log.itemName;
                  const isPositive = log.tipo === 'ingreso' || log.action === 'register';
                  
                  return (
                    <tr key={log._id} style={s.tr}>
                      <td style={s.td}>{new Date(log.createdAt || log.timestamp).toLocaleString()}</td>
                      <td style={s.td}>
                        <span style={s.originBadge(isChat)}>{isChat ? '💬 Chat' : '📷 QR'}</span>
                      </td>
                      <td style={s.td}><strong>{log.persona || log.person || 'Sistema'}</strong></td>
                      <td style={s.td}>{log.itemName || log.itemId?.name || 'Item Desconocido'}</td>
                      <td style={{ ...s.td, color: isPositive ? '#28a745' : '#dc3545', fontWeight: 'bold' }}>
                        {isPositive ? `+${log.cantidad || log.quantity}` : `-${log.cantidad || log.quantity}`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

// Estilos rápidos en objeto para no depender de CSS externo por ahora
const s = {
  closeBtn: { background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' },
  filterBtn: (active) => ({
    padding: '6px 12px',
    borderRadius: '15px',
    border: '1px solid #007bff',
    background: active ? '#007bff' : 'white',
    color: active ? 'white' : '#007bff',
    cursor: 'pointer',
    fontSize: '0.85rem'
  }),
  th: { padding: '12px', fontSize: '0.9rem', color: '#495057' },
  td: { padding: '12px', fontSize: '0.85rem', borderBottom: '1px solid #eee' },
  tr: { transition: 'background 0.2s', ':hover': { background: '#f8f9fa' } },
  originBadge: (isChat) => ({
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '0.7rem',
    background: isChat ? '#e3f2fd' : '#f3e5f5',
    color: isChat ? '#0d47a1' : '#4a148c',
    fontWeight: 'bold'
  })
};

export default HistoryList;