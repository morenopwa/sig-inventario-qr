// src/auth/InitialSetup.jsx - CORREGIDO
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css'; // Usar el mismo CSS de Login

const InitialSetup = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validaciones
    if (formData.password !== formData.confirmPassword) {
      setMessage('❌ Las contraseñas no coinciden');
      return;
    }
    
    if (formData.password.length < 6) {
      setMessage('❌ La contraseña debe tener al menos 6 caracteres');
      return;
    }
    
    setLoading(true);
    setMessage('');
    
    try {
      console.log('🔄 Creando primer administrador...');
      
      // 1. Crear objeto de administrador
      const firstAdmin = {
        id: 'admin-' + Date.now(),
        name: formData.name,
        email: formData.email,
        password: formData.password, // ⚠️ Solo para desarrollo
        role: 'admin',
        isFirstAdmin: true,
        createdAt: new Date().toISOString()
      };
      
      // 2. Guardar en localStorage
      localStorage.setItem('app_users', JSON.stringify([firstAdmin]));
      localStorage.setItem('first_admin_setup', 'completed');
      
      // 3. Hacer login automático
      const { password: _, ...userWithoutPassword } = firstAdmin;
      localStorage.setItem('token', 'admin-token-' + Date.now());
      localStorage.setItem('user', JSON.stringify(userWithoutPassword));
      
      console.log('✅ Admin creado:', userWithoutPassword);
      
      setMessage('✅ Administrador creado exitosamente. Redirigiendo...');
      
      // 4. Redirigir después de 1.5 segundos
      setTimeout(() => {
        console.log('🔀 Redirigiendo a /...');
        navigate('/', { replace: true });
        window.location.reload(); // Forzar recarga para actualizar contexto
      }, 1500);
      
    } catch (error) {
      console.error('❌ Error creando admin:', error);
      setMessage('❌ Error: ' + error.message);
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>👑 Crear Administrador Principal</h1>
          <p>Primer uso del sistema - Configura el usuario administrador</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Nombre completo *"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="Correo electrónico *"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="Contraseña * (mínimo 6 caracteres)"
              required
              minLength="6"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              placeholder="Confirmar contraseña *"
              required
              minLength="6"
              disabled={loading}
            />
          </div>

          <div className="form-note">
            <p>⚠️ Esta será la cuenta de administrador principal.</p>
            <p>Podrás crear más usuarios desde el panel de administración.</p>
          </div>

          {message && (
            <div className={`auth-message ${message.includes('✅') ? 'success' : 'error'}`}>
              {message}
            </div>
          )}

          <button type="submit" disabled={loading} className="btn-auth">
            {loading ? '⏳ Creando administrador...' : '👑 Crear Administrador'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default InitialSetup;