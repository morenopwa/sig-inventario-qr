import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ReturnModal = ({ item, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    person: '',
    notes: ''
  });
  const [isListening, setIsListening] = useState(false);
  const [voiceFeedback, setVoiceFeedback] = useState('');
  const [lastBorrower, setLastBorrower] = useState('');

  // Obtener la última persona que lo prestó
  useEffect(() => {
    const fetchLastBorrower = async () => {
      try {
        const response = await axios.get(`/api/history/${item._id}`);
        const history = response.data;
        
        // Encontrar el último préstamo
        const lastBorrow = history.find(record => record.action === 'borrow');
        if (lastBorrow) {
          setLastBorrower(lastBorrow.person);
          setFormData(prev => ({ ...prev, person: lastBorrow.person }));
        }
      } catch (error) {
        console.error('Error obteniendo historial:', error);
      }
    };

    if (item && item._id) {
      fetchLastBorrower();
    }
  }, [item]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.person) {
      alert('⚠️ Por favor ingrese el nombre de la persona');
      return;
    }

    try {
      const response = await axios.post('/api/return', {
        qrCode: item.qrCode,
        ...formData
      });

      if (response.data.message) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error devolviendo item:', error);
      alert('❌ Error al devolver el item: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const startVoiceRecognition = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('❌ El reconocimiento de voz no es compatible con este navegador');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'es-ES';

    recognition.start();
    setIsListening(true);
    setVoiceFeedback('🎤 Escuchando...');

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setVoiceFeedback(`✅ Dijiste: "${transcript}"`);
      
      const words = transcript.toLowerCase().split(' ');
      
      // Buscar verbos comunes de devolución
      const verbos = ['devuelve', 'regresa', 'entrega', 'trae'];
      const verboIndex = words.findIndex(word => verbos.includes(word));
      
      if (verboIndex !== -1 && words[verboIndex + 1]) {
        const nombre = words.slice(verboIndex + 1).join(' ');
        setFormData(prev => ({ ...prev, person: nombre }));
      } else {
        setFormData(prev => ({ ...prev, person: transcript }));
      }

      setIsListening(false);
    };

    recognition.onerror = (event) => {
      console.error('Error en reconocimiento de voz:', event.error);
      setVoiceFeedback(`❌ Error: ${event.error}`);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>📥 Devolver Item</h2>
        
        <div style={{ 
          background: '#e8f4fc', 
          padding: '15px', 
          borderRadius: '8px', 
          marginBottom: '20px',
          textAlign: 'left'
        }}>
          <p><strong>Item:</strong> {item.name}</p>
          <p><strong>Categoría:</strong> {item.category}</p>
          <p><strong>Descripción:</strong> {item.description}</p>
          <p><strong>QR:</strong> {item.qrCode}</p>
          {lastBorrower && (
            <p style={{ color: '#e74c3c', fontWeight: 'bold' }}>
              <strong>Prestado a:</strong> {lastBorrower}
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Persona que devuelve: *</label>
            <input
              type="text"
              name="person"
              value={formData.person}
              onChange={handleChange}
              placeholder={lastBorrower || "Ej: María González"}
              required
            />
            {lastBorrower && (
              <small style={{ color: '#666', fontStyle: 'italic' }}>
                Se autocompletó con la persona que lo tenía prestado. Verifica si es correcto.
              </small>
            )}
          </div>

          <div className="form-group">
            <label>Notas (opcional):</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Observaciones o estado del item..."
              rows="3"
            />
          </div>

          <div className="voice-controls">
            <h4>🎤 Reconocimiento de Voz</h4>
            <button 
              type="button"
              className={`voice-btn ${isListening ? 'listening' : ''}`}
              onClick={startVoiceRecognition}
              disabled={isListening}
            >
              {isListening ? '🎤 Escuchando...' : '🎤 Decir Nombre'}
            </button>
            <p style={{ fontSize: '0.9rem', margin: '10px 0' }}>
              Ejemplo: "<em>Carlos devuelve el taladro</em>"
            </p>
            <div className="voice-feedback">
              {voiceFeedback}
            </div>
          </div>

          <div className="button-group">
            <button type="button" className="btn btn-danger" onClick={onClose}>
              ❌ Cancelar
            </button>
            <button type="submit" className="btn btn-success">
              ✅ Registrar Devolución
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReturnModal;