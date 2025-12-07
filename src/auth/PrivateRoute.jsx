// src/auth/PrivateRoute.jsx - VERSIÓN SIMPLE
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext'; // ✅ Este import ahora funciona

const PrivateRoute = ({ children, requireAdmin = false }) => {
  const { user, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: '#f8f9fa'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #e9ecef',
            borderTopColor: '#007bff',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 15px'
          }}></div>
          <p>Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    console.log('🔒 No hay usuario, redirigiendo a /login');
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && !isAdmin) {
    console.log('⛔ Usuario no es admin, acceso denegado');
    return (
      <div style={{ padding: '50px 20px', textAlign: 'center' }}>
        <h1 style={{ color: '#dc3545' }}>⛔ Acceso Restringido</h1>
        <p>Solo los administradores pueden acceder a esta página.</p>
        <button 
          onClick={() => window.history.back()}
          style={{
            padding: '10px 20px',
            background: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            marginTop: '20px'
          }}
        >
          Volver
        </button>
      </div>
    );
  }

  console.log('✅ Acceso permitido para:', user.name);
  return children;
};

// Añadir estilos para el spinner
const style = document.createElement('style');
style.textContent = `
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;
document.head.appendChild(style);

export default PrivateRoute;