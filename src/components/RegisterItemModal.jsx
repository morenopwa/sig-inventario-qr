import React, { useState } from 'react';
import axios from 'axios';

const RegisterItemModal = ({ qrCode, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: ''
  });
  const [isListening, setIsListening] = useState(false);
  const [voiceFeedback, setVoiceFeedback] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validación: nombre y categoría son obligatorios
    if (!formData.name || !formData.category) {
      alert('⚠️ Por favor complete los campos obligatorios: Nombre y Categoría');
      return;
    }

    try {
      const response = await axios.post('/api/register', {
        qrCode,
        ...formData,
        registeredBy: 'Sistema' // Ya no se pide al usuario
      });

      if (response.data.message) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error registrando item:', error);
      alert('❌ Error al registrar el item: ' + (error.response?.data?.error || error.message));
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
      
      // Buscar nombre
      const nameIndex = words.findIndex(word => 
        ['taladro', 'martillo', 'destornillador', 'llave', 'laptop', 'monitor', 'casco', 'guantes'].includes(word)
      );
      
      if (nameIndex !== -1) {
        const name = words.slice(nameIndex).join(' ');
        setFormData(prev => ({ ...prev, name }));
      }
      
      // Buscar categoría
      const categories = ['herramienta', 'equipo', 'consumible', 'epp'];
      const foundCategory = words.find(word => categories.includes(word));
      if (foundCategory) {
        setFormData(prev => ({ ...prev, category: foundCategory }));
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
        <h2>📝 Registrar Nuevo Item</h2>
        <p><strong>QR:</strong> {qrCode}</p>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nombre del Item: *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Ej: Taladro percutor 18V"
              required
            />
          </div>

          <div className="form-group">
            <label>Categoría: *</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
            >
              <option value="">Seleccionar categoría</option>
              <option value="herramienta">🛠️ Herramienta</option>
              <option value="equipo">💻 Equipo</option>
              <option value="consumible">📦 Consumible</option>
              <option value="epp">🛡️ EPP (Equipo de Protección Personal)</option>
            </select>
          </div>

          <div className="form-group">
            <label>Descripción (opcional):</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Descripción detallada del item (opcional)..."
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
              {isListening ? '🎤 Escuchando...' : '🎤 Usar Voz'}
            </button>
            <div className="voice-feedback">
              {voiceFeedback}
            </div>
          </div>

          <div className="button-group">
            <button type="button" className="btn btn-danger" onClick={onClose}>
              ❌ Cancelar
            </button>
            <button type="submit" className="btn btn-success">
              ✅ Registrar Item
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterItemModal;