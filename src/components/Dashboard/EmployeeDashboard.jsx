// src/components/Dashboard/EmployeeDashboard.jsx
import { useState, useEffect } from 'react';

const EmployeeDashboard = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user'));
    if (!userData) {
      window.location.href = '/login';
    } else {
      setUser(userData);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  if (!user) return <div>Cargando...</div>;

  return (
    <div className="employee-dashboard">
      <header className="dashboard-header">
        <div className="header-left">
          <h1>Panel de Empleado</h1>
          <span className="user-info">Bienvenido: {user.email}</span>
        </div>
        <button onClick={handleLogout} className="logout-button">
          Cerrar Sesión
        </button>
      </header>
      
      <div className="dashboard-content">
        <div className="welcome-section">
          <h2>Mis Módulos de Capacitación</h2>
          <p>Completa los módulos asignados para mejorar tus habilidades.</p>
        </div>
        
        <div className="modules-section">
          <h3>Módulos Disponibles</h3>
          <div className="modules-grid">
            <div className="module-card completed">
              <div className="module-icon">✅</div>
              <h4>Introducción al Sistema</h4>
              <p>Estado: <span className="status-completed">Completado</span></p>
              <button className="module-button">Ver Certificado</button>
            </div>
            
            <div className="module-card in-progress">
              <div className="module-icon">📚</div>
              <h4>Protocolos de Seguridad</h4>
              <p>Estado: <span className="status-in-progress">En progreso (75%)</span></p>
              <button className="module-button">Continuar</button>
            </div>
            
            <div className="module-card pending">
              <div className="module-icon">⏳</div>
              <h4>Procedimientos Operativos</h4>
              <p>Estado: <span className="status-pending">Pendiente</span></p>
              <button className="module-button">Comenzar</button>
            </div>
            
            <div className="module-card locked">
              <div className="module-icon">🔒</div>
              <h4>Avanzado: Gestión de Proyectos</h4>
              <p>Estado: <span className="status-locked">Disponible pronto</span></p>
              <button className="module-button" disabled>Bloqueado</button>
            </div>
          </div>
        </div>
        
        <div className="progress-section">
          <h3>Mi Progreso General</h3>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: '45%' }}></div>
          </div>
          <p className="progress-text">45% completado (3 de 7 módulos)</p>
        </div>
        
        <div className="quick-actions">
          <h3>Acciones Rápidas</h3>
          <div className="actions-grid">
            <button className="action-button">
              <span className="action-icon">📋</span>
              <span>Ver Mis Tareas</span>
            </button>
            <button className="action-button">
              <span className="action-icon">📊</span>
              <span>Ver Reportes</span>
            </button>
            <button className="action-button">
              <span className="action-icon">📅</span>
              <span>Calendario</span>
            </button>
            <button className="action-button">
              <span className="action-icon">❓</span>
              <span>Soporte</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;