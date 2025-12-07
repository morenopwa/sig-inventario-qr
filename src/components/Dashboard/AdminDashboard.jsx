import { useState, useEffect } from 'react';
import EmployeeManager from './EmployeeManager';

const AdminDashboard = () => {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('employees');

  useEffect(() => {
    // Verificar autenticación
    const userData = JSON.parse(localStorage.getItem('user'));
    if (!userData || userData.role !== 'admin') {
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
    <div className="admin-dashboard">
      {/* Header */}
      <header className="admin-header">
        <div className="header-left">
          <h1>Panel de Administración</h1>
          <span className="user-role">Admin: {user.email}</span>
        </div>
        <button onClick={handleLogout} className="logout-button">
          Cerrar Sesión
        </button>
      </header>

      {/* Menú de navegación */}
      <nav className="admin-nav">
        <button 
          className={activeTab === 'employees' ? 'active' : ''}
          onClick={() => setActiveTab('employees')}
        >
          👥 Gestión de Empleados
        </button>
        <button 
          className={activeTab === 'modules' ? 'active' : ''}
          onClick={() => setActiveTab('modules')}
        >
          📚 Gestión de Módulos
        </button>
        <button 
          className={activeTab === 'stats' ? 'active' : ''}
          onClick={() => setActiveTab('stats')}
        >
          📊 Estadísticas
        </button>
        <button 
          className={activeTab === 'settings' ? 'active' : ''}
          onClick={() => setActiveTab('settings')}
        >
          ⚙️ Configuración
        </button>
      </nav>

      {/* Contenido principal */}
      <main className="admin-content">
        {activeTab === 'employees' && <EmployeeManager />}
        {activeTab === 'modules' && <div>Gestión de Módulos</div>}
        {activeTab === 'stats' && <div>Estadísticas</div>}
        {activeTab === 'settings' && <div>Configuración</div>}
      </main>
    </div>
  );
};

export default AdminDashboard;