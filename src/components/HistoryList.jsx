import React, { useState, useEffect } from 'react';
import axios from 'axios';

const HistoryList = ({ onClose }) => {
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [itemHistory, setItemHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get('/api/items');
      setItems(response.data);
    } catch (error) {
      console.error('Error fetching items:', error);
      setError('Error al cargar los items: ' + (error.response?.data?.error || error.message));
      setItems([]); // Array vacío en caso de error
    } finally {
      setLoading(false);
    }
  };

  const fetchItemHistory = async (itemId) => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/history/${itemId}`);
      setItemHistory(response.data);
      setSelectedItem(itemId);
    } catch (error) {
      console.error('Error fetching history:', error);
      alert('Error al cargar el historial: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  // ... resto del código igual pero agregar manejo de loading/error
  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: '800px' }}>
        <h2>📊 Historial del Sistema</h2>

        {loading && <p>⏳ Cargando...</p>}
        {error && (
          <div style={{ background: '#f8d7da', color: '#721c24', padding: '10px', borderRadius: '5px', margin: '10px 0' }}>
            ❌ {error}
          </div>
        )}

        {/* Resto del componente */}
      </div>
    </div>
  );
};

export default HistoryList;