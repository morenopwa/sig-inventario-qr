import React, { useState } from 'react';
import axios from 'axios';

const BorrowModal = ({ item, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    person: '',
    notes: ''
  });
  const [isListening, setIsListening] = useState(false);
  const [voiceFeedback, setVoiceFeedback] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.person) {
      alert('⚠️ Por favor ingrese el nombre de la persona');
      return;
    }

    try {
      const response = await axios.post('/api/borrow', {
        qrCode: item.qrCode,
        ...formData
      });

      if (response.data.message) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error prestando item:', error);
      alert('❌ Error al prestar el item: ' + (error.response?.data?.error || error.message));
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
      
      const verbos = ['lleva', 'toma', 'saca', 'usa', 'presta', 'necesita'];
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
        <h2>📤 Prestar Item</h2>
        
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
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Persona que lo lleva:</label>
            <input
              type="text"
              name="person"
              value={formData.person}
              onChange={handleChange}
              placeholder="Ej: Juan Pérez"
              required
            />
          </div>

          <div className="form-group">
            <label>Notas (opcional):</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Observaciones o detalles del préstamo..."
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
              Ejemplo: "<em>Alex lleva una llave francesa</em>"
            </p>
            <div className="voice-feedback">
              {voiceFeedback}
            </div>
          </div>

          <div className="button-group">
            <button type="button" className="btn btn-danger" onClick={onClose}>
              ❌ Cancelar
            </button>
            <button type="submit" className="btn btn-warning">
              📤 Registrar Préstamo
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BorrowModal;