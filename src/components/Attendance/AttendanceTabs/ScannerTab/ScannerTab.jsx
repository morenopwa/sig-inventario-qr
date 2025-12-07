// src/components/Attendance/AttendanceTabs/ScannerTab/ScannerTab.jsx
import React, { useState } from 'react';
import Scanner from '../../../Scanner/Scanner'; // ← RUTA CORRECTA
import AttendanceTable from '../../AttendanceTable/AttendanceTable';
import './ScannerTab.css';

const ScannerTab = ({ workers = [] }) => {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleScanComplete = () => {
    // Incrementar key para forzar re-render de AttendanceTable
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="scanner-tab">
      <div className="scanner-section">
        <Scanner onScanComplete={handleScanComplete} />
      </div>
      
      <div className="attendance-section">
        <div className="section-header">
          <h3>📋 Registro de Asistencias del Día</h3>
          <button 
            onClick={() => setRefreshKey(prev => prev + 1)}
            className="btn-refresh"
          >
            🔄 Actualizar
          </button>
        </div>
        <AttendanceTable 
          key={refreshKey}
          workers={workers} 
          date={new Date()}
        />
      </div>
    </div>
  );
};

export default ScannerTab;