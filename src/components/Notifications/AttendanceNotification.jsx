// src/components/Notifications/AttendanceNotification.jsx
import React, { useEffect, useState } from 'react';
import { CheckCircle, Clock, AlertCircle, DollarSign, Send } from 'lucide-react';
import './AttendanceNotification.css';

const AttendanceNotification = ({ type, workerName, time, details, onClose }) => {
  const [visible, setVisible] = useState(true);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    // Animación de progreso (5 segundos)
    const interval = setInterval(() => {
      setProgress(prev => Math.max(0, prev - 0.5));
    }, 25);

    const timeout = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onClose?.(), 300);
    }, 5000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [onClose]);

  const getNotificationConfig = () => {
    const configs = {
      checkin_temprano: {
        icon: <CheckCircle size={24} />,
        title: '✅ Asistencia Temprana',
        color: '#10b981',
        bgColor: '#d1fae5'
      },
      checkin_tardanza: {
        icon: <Clock size={24} />,
        title: '⚠️ Tardanza Registrada',
        color: '#f59e0b',
        bgColor: '#fef3c7'
      },
      checkout: {
        icon: <CheckCircle size={24} />,
        title: '🚪 Salida Registrada',
        color: '#3b82f6',
        bgColor: '#dbeafe'
      },
      overtime: {
        icon: <DollarSign size={24} />,
        title: '💰 Horas Extras',
        color: '#8b5cf6',
        bgColor: '#ede9fe'
      },
      whatsapp: {
        icon: <Send size={24} />,
        title: '📱 WhatsApp Enviado',
        color: '#25d366',
        bgColor: '#d1f7e6'
      },
      error: {
        icon: <AlertCircle size={24} />,
        title: '❌ Error',
        color: '#ef4444',
        bgColor: '#fee2e2'
      }
    };

    return configs[type] || configs.checkin;
  };

  const config = getNotificationConfig();

  if (!visible) return null;

  return (
    <div 
      className="attendance-notification"
      style={{ backgroundColor: config.bgColor, borderLeftColor: config.color }}
    >
      <div className="notification-header">
        <div className="notification-icon" style={{ color: config.color }}>
          {config.icon}
        </div>
        <div className="notification-title">
          <h4 style={{ color: config.color }}>{config.title}</h4>
          <p className="worker-name">{workerName}</p>
        </div>
        <button className="close-btn" onClick={() => setVisible(false)}>
          ×
        </button>
      </div>

      <div className="notification-body">
        <div className="time-display">
          <Clock size={14} />
          <span>{time}</span>
        </div>
        
        {details && (
          <div className="notification-details">
            {details.overtimeHours && (
              <div className="detail-item">
                <span>Horas extras:</span>
                <strong>{details.overtimeHours.toFixed(2)} hrs</strong>
              </div>
            )}
            {details.overtimePay && (
              <div className="detail-item">
                <span>Pago extras:</span>
                <strong>${details.overtimePay.toFixed(2)}</strong>
              </div>
            )}
            {details.minutesLate && (
              <div className="detail-item">
                <span>Minutos tarde:</span>
                <strong>{details.minutesLate} min</strong>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Barra de progreso */}
      <div className="notification-progress">
        <div 
          className="progress-bar"
          style={{ 
            width: `${progress}%`,
            backgroundColor: config.color
          }}
        />
      </div>

      {/* Botón de acción rápida para WhatsApp */}
      {type === 'checkin_temprano' || type === 'checkin_tardanza' ? (
        <div className="notification-actions">
          <button className="whatsapp-action">
            <Send size={16} />
            Enviar por WhatsApp
          </button>
        </div>
      ) : null}
    </div>
  );
};

// Componente contenedor para múltiples notificaciones
export const NotificationContainer = ({ children }) => {
  return (
    <div className="notification-container">
      {children}
    </div>
  );
};

export default AttendanceNotification;