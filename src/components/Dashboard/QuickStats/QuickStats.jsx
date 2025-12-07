// src/components/Dashboard/QuickStats/QuickStats.jsx
import React from 'react';
import './QuickStats.css';

const QuickStats = ({ module = 'attendance' }) => {
  // Datos de ejemplo
  const stats = module === 'attendance' ? {
    present: 24,
    late: 3,
    absent: 2,
    overtime: 8
  } : {
    available: 15,
    loaned: 8,
    maintenance: 3,
    total: 26
  };

  return (
    <div className="quick-stats">
      {module === 'attendance' ? (
        <>
          <div className="stat-card">
            <div className="stat-icon present">👥</div>
            <div className="stat-info">
              <span className="stat-value">{stats.present}</span>
              <span className="stat-label">Presentes</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon late">⏰</div>
            <div className="stat-info">
              <span className="stat-value">{stats.late}</span>
              <span className="stat-label">Tardanzas</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon absent">❌</div>
            <div className="stat-info">
              <span className="stat-value">{stats.absent}</span>
              <span className="stat-label">Ausentes</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon overtime">💰</div>
            <div className="stat-info">
              <span className="stat-value">{stats.overtime}</span>
              <span className="stat-label">Horas extras</span>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="stat-card">
            <div className="stat-icon available">✅</div>
            <div className="stat-info">
              <span className="stat-value">{stats.available}</span>
              <span className="stat-label">Disponibles</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon loaned">🔄</div>
            <div className="stat-info">
              <span className="stat-value">{stats.loaned}</span>
              <span className="stat-label">Prestados</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon maintenance">🔧</div>
            <div className="stat-info">
              <span className="stat-value">{stats.maintenance}</span>
              <span className="stat-label">Mantenimiento</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon total">📦</div>
            <div className="stat-info">
              <span className="stat-value">{stats.total}</span>
              <span className="stat-label">Total equipos</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default QuickStats;