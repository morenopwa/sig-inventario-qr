// src/components/Attendance/WorkersList/WorkersList.jsx
import React from 'react';
import './WorkersList.css';

const WorkersList = ({ 
  workers, 
  showStatus = false,
  onEditWorker,
  onDeleteWorker,
  isAdmin = false 
}) => {
  return (
    <div className="workers-list">
      <div className="workers-grid">
        {workers.map(worker => (
          <WorkerCard 
            key={worker._id}
            worker={worker}
            showStatus={showStatus}
            onEdit={onEditWorker}
            onDelete={onDeleteWorker}
            isAdmin={isAdmin}
          />
        ))}
      </div>
      
      {workers.length === 0 && (
        <div className="empty-workers">
          <p>No hay trabajadores registrados</p>
        </div>
      )}
    </div>
  );
};

const WorkerCard = ({ worker, showStatus, onEdit, onDelete, isAdmin }) => {
  const getStatusInfo = () => {
    if (!showStatus) return null;
    
    const today = new Date().toDateString();
    const todayAttendance = worker.attendance?.find(record => 
      new Date(record.date).toDateString() === today
    );

    if (todayAttendance) {
      const hasCheckedOut = !!todayAttendance.checkOut;
      return {
        status: hasCheckedOut ? 'completed' : 'working',
        label: hasCheckedOut ? '✅ Jornada completa' : '🟢 Trabajando',
        checkIn: todayAttendance.checkIn,
        checkOut: todayAttendance.checkOut
      };
    }
    
    return {
      status: 'absent',
      label: '🔴 Ausente',
      checkIn: null,
      checkOut: null
    };
  };

  const statusInfo = getStatusInfo();

  return (
    <div className={`worker-card ${statusInfo?.status || ''}`}>
      <div className="worker-info">
        <h4>{worker.name}</h4>
        <p>{worker.position}</p>
        <p className="department">{worker.department}</p>
        <p className="qr-code">QR: {worker.qrCode}</p>
        
        {showStatus && statusInfo && (
          <div className="attendance-status">
            <span className={`status-badge ${statusInfo.status}`}>
              {statusInfo.label}
            </span>
            {statusInfo.checkIn && (
              <div className="time-info">
                <small>Entrada: {formatTime(statusInfo.checkIn)}</small>
              </div>
            )}
            {statusInfo.checkOut && (
              <div className="time-info">
                <small>Salida: {formatTime(statusInfo.checkOut)}</small>
              </div>
            )}
          </div>
        )}
      </div>
      
      {isAdmin && (onEdit || onDelete) && (
        <div className="worker-actions">
          {onEdit && (
            <button onClick={() => onEdit(worker)} className="btn-edit">
              ✏️
            </button>
          )}
          {onDelete && (
            <button onClick={() => onDelete(worker)} className="btn-delete">
              🗑️
            </button>
          )}
        </div>
      )}
    </div>
  );
};

const formatTime = (dateString) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleTimeString('es-ES', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
};

export default WorkersList;