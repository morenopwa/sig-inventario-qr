// src/components/Attendance/AttendanceTabs/AttendanceTabs.jsx - VERSIÓN BÁSICA
import React, { useState } from 'react';
import ScannerTab from './ScannerTab/ScannerTab';
import WorkersTab from './WorkersTab/WorkersTab';
import ReportTab from './ReportTab/ReportTab';
import './AttendanceTabs.css';

const AttendanceTabs = ({ workers, addWorker, loading }) => {
  const [activeTab, setActiveTab] = useState('scanner');

  const tabs = [
    { id: 'scanner', label: '📷 Escáner', icon: '📷' },
    { id: 'workers', label: '👥 Trabajadores', icon: '👥' },
    { id: 'reports', label: '📊 Reportes', icon: '📊' }
  ];

  return (
    <div className="attendance-tabs">
      <div className="tabs-header">
        <div className="tabs-nav">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-label">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="tab-content">
        {activeTab === 'scanner' && (
          <ScannerTab workers={workers} /> 
        )}
        {activeTab === 'workers' && (
          <WorkersTab
            workers={workers}
            addWorker={addWorker}
            loading={loading}
          />
        )}
        {activeTab === 'reports' && <ReportTab workers={workers} />}
      </div>
    </div>
  );
};

export default AttendanceTabs;