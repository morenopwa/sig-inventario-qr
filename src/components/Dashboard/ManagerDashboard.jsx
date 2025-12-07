// src/components/Dashboard/ManagerDashboard.jsx
import { useState, useEffect } from 'react';

const ManagerDashboard = () => {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('team');

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user'));
    if (!userData || userData.role !== 'manager') {
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
    <div className="manager-dashboard">
      <header className="dashboard-header">
        <div className="header-left">
          <h1>Panel de Gerente</h1>
          <span className="user-info">Gerente: {user.email}</span>
        </div>
        <button onClick={handleLogout} className="logout-button">
          Cerrar Sesión
        </button>
      </header>

      <nav className="dashboard-nav">
        <button 
          className={activeTab === 'team' ? 'active' : ''}
          onClick={() => setActiveTab('team')}
        >
          👥 Mi Equipo
        </button>
        <button 
          className={activeTab === 'projects' ? 'active' : ''}
          onClick={() => setActiveTab('projects')}
        >
          📋 Proyectos
        </button>
        <button 
          className={activeTab === 'reports' ? 'active' : ''}
          onClick={() => setActiveTab('reports')}
        >
          📊 Reportes
        </button>
      </nav>

      <main className="dashboard-content">
        {activeTab === 'team' && (
          <div className="team-section">
            <h2>Mi Equipo</h2>
            <p>Gestiona los miembros de tu equipo aquí.</p>
            {/* Agregar lista de empleados del equipo */}
          </div>
        )}
        
        {activeTab === 'projects' && (
          <div className="projects-section">
            <h2>Proyectos Asignados</h2>
            <p>Gestiona los proyectos de tu equipo.</p>
          </div>
        )}
        
        {activeTab === 'reports' && (
          <div className="reports-section">
            <h2>Reportes</h2>
            <p>Visualiza reportes de productividad.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default ManagerDashboard;