// src/components/Attendance/AttendanceTabs/WorkersTab/WorkersTab.jsx
import React, { useState } from 'react';
import { useAuth } from '../../../../auth/AuthContext';
import AddWorkerForm from '../../AddWorkerForm/AddWorkerForm';
import WorkersList from '../../WorkersList/WorkersList';
import WorkerQRModal from '../../WorkerQRModal/WorkerQRModal'; // Nuevo componente
import './WorkersTab.css';
import QRCode from 'qrcode';
import { saveAs } from 'file-saver';

const WorkersTab = ({ 
  workers, 
  addWorker, 
  loading 
}) => {
  const { user, isAdmin } = useAuth();
  const [showQRModal, setShowQRModal] = useState(false);
  const [newWorkerQR, setNewWorkerQR] = useState(null);

  const handleAddWorker = async (workerData) => {
    // Verificar autenticación
    if (!user) {
      alert('❌ Debes iniciar sesión para agregar trabajadores');
      return { success: false, message: 'No autenticado' };
    }

    // Verificar permisos de admin
    if (!isAdmin) {
      alert('❌ Solo los administradores pueden agregar trabajadores');
      return { success: false, message: 'Permisos insuficientes' };
    }

    const result = await addWorker(workerData);
    
    if (result.success) {
      // Mostrar modal con QR generado
      setNewWorkerQR({
        name: workerData.name,
        position: workerData.position,
        department: workerData.department,
        qrImage: result.qrImage,
        qrCode: result.qrCode
      });
      setShowQRModal(true);
      
      alert(`✅ ${result.message}\n📋 Código QR: ${result.qrCode}`);
    } else {
      alert(`❌ ${result.message}`);
    }
    
    return result;
  };

  // Si no está autenticado
  if (!user) {
    return (
      <div className="auth-required">
        <div className="auth-message">
          <h3>🔐 Autenticación Requerida</h3>
          <p>Debes iniciar sesión para acceder a esta sección.</p>
          <button 
            onClick={() => window.location.href = '/login'}
            className="btn-login-redirect"
          >
            Ir a Iniciar Sesión
          </button>
        </div>
      </div>
    );
  }

  // Si no es admin
  if (!isAdmin) {
    return (
      <div className="workers-readonly">
        <h3>👥 Lista de Trabajadores ({workers.length})</h3>
        <div className="admin-restricted-message">
          <div className="restricted-icon">🔒</div>
          <div>
            <p><strong>Acceso Restringido</strong></p>
            <p>Solo los administradores pueden gestionar trabajadores.</p>
            <p className="user-info">
              Tu rol: <span className="user-role">👷 Trabajador</span>
            </p>
          </div>
        </div>
        <WorkersList 
          workers={workers}
          showStatus={false}
          isAdmin={false}
        />
      </div>
    );
  }

  return (
    <div className="workers-tab">
      <div className="admin-header">
        <div className="admin-info">
          <span className="admin-badge">👑 Administrador</span>
          <span className="user-name">{user.name}</span>
        </div>
      </div>

      <AddWorkerForm 
        onAdd={handleAddWorker}
        loading={loading}
      />
      
      <div className="workers-section">
        <h3>Lista de Trabajadores ({workers.length})</h3>
        <WorkersList 
          workers={workers}
          showStatus={false}
          isAdmin={true}
        />
      </div>

      {/* Modal para mostrar QR generado */}
      {showQRModal && newWorkerQR && (
        <WorkerQRModal
          worker={newWorkerQR}
          onClose={() => {
            setShowQRModal(false);
            setNewWorkerQR(null);
          }}
        />
      )}
    </div>
  );
};

export default WorkersTab;