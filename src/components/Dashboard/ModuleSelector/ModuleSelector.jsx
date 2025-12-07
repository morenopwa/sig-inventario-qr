// src/components/Dashboard/ModuleSelector/ModuleSelector.jsx
import React from 'react';
import { Users, Package, Bell, BarChart } from 'lucide-react';
import './ModuleSelector.css';

const ModuleSelector = ({ activeModule, onModuleChange }) => {
  const modules = [
    {
      id: 'attendance',
      label: 'Asistencia',
      icon: <Users size={20} />,
      color: '#48bb78',
      description: 'Registro de entradas/salidas'
    },
    {
      id: 'inventory',
      label: 'Inventario',
      icon: <Package size={20} />,
      color: '#4299e1',
      description: 'Préstamos y devoluciones'
    },
    {
      id: 'notifications',
      label: 'Notificaciones',
      icon: <Bell size={20} />,
      color: '#ed8936',
      description: 'Alertas y recordatorios'
    },
    {
      id: 'reports',
      label: 'Reportes',
      icon: <BarChart size={20} />,
      color: '#9f7aea',
      description: 'Estadísticas y análisis'
    }
  ];

  return (
    <div className="module-selector-container">
      <div className="modules-grid">
        {modules.map(module => (
          <button
            key={module.id}
            className={`module-card ${activeModule === module.id ? 'active' : ''}`}
            onClick={() => onModuleChange(module.id)}
            style={{
              '--module-color': module.color,
              '--module-bg': `${module.color}15`
            }}
          >
            <div className="module-icon" style={{ color: module.color }}>
              {module.icon}
            </div>
            <div className="module-info">
              <h4>{module.label}</h4>
              <p>{module.description}</p>
            </div>
            <div className="module-indicator">
              {activeModule === module.id && (
                <div className="indicator-dot" style={{ background: module.color }}></div>
              )}
            </div>
          </button>
        ))}
      </div>
      
      {/* Indicador de semana laboral */}
      <div className="week-indicator">
        <span className="week-label">Semana laboral:</span>
        <span className="week-dates">JUEVES 14 - MIÉRCOLES 20 NOV</span>
      </div>
    </div>
  );
};

export default ModuleSelector;