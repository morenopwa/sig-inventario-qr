import React, { useState, useRef, useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import './QRScanner.css';

const QRScanner = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState(''); // 'loan', 'return', 'new'
  const [qrData, setQrData] = useState(null);
  const [equipment, setEquipment] = useState(null);
  const [equipments, setEquipments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    personName: '',
    notes: '',
    equipmentName: '',
    category: ''
  });

  const scannerRef = useRef(null);
  const html5QrcodeScannerRef = useRef(null);
  const apiUrl = import.meta.env.VITE_API_URL || 'https://sig-inventario-qr-backend.onrender.com';

  // Cargar equipos al iniciar
  useEffect(() => {
    fetchEquipments();
  }, []);

  // Configurar scanner
  useEffect(() => {
    if (scannerRef.current && !html5QrcodeScannerRef.current) {
      initializeScanner();
    }

    return () => {
      cleanupScanner();
    };
  }, []);

  const initializeScanner = () => {
    html5QrcodeScannerRef.current = new Html5QrcodeScanner(
      scannerRef.current.id,
      {
        qrbox: { width: 250, height: 250 },
        fps: 5,
        supportedScanTypes: [],
      },
      false
    );

    html5QrcodeScannerRef.current.render(onScanSuccess, onScanFailure);
  };

  const cleanupScanner = () => {
    if (html5QrcodeScannerRef.current) {
      html5QrcodeScannerRef.current.clear().catch(error => {
        console.error('Error limpiando scanner:', error);
      });
    }
  };

  const fetchEquipments = async () => {
    try {
      const response = await fetch(`${apiUrl}/api/equipments`);
      const data = await response.json();
      setEquipments(data);
    } catch (error) {
      console.error('Error cargando equipos:', error);
    }
  };

  const onScanSuccess = async (decodedText) => {
    console.log('🔍 QR detectado:', decodedText);
    
    await cleanupScanner();
    setLoading(true);
    setQrData(decodedText);

    try {
      const response = await fetch(`${apiUrl}/api/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qrData: decodedText })
      });

      const result = await response.json();
      
      if (result.success && result.equipmentFound) {
        setEquipment(result.equipment);
        // Si el equipo está prestado, mostrar modal de devolución
        // Si está disponible, mostrar modal de préstamo
        setModalType(result.equipment.status === 'prestado' ? 'return' : 'loan');
      } else {
        // Equipo no encontrado, mostrar modal para agregar nuevo
        setEquipment(null);
        setModalType('new');
      }
      
      setIsModalOpen(true);

    } catch (error) {
      console.error('❌ Error procesando QR:', error);
    } finally {
      setLoading(false);
    }
  };

  const onScanFailure = (error) => {
    if (!error.includes('No MultiFormat Readers')) {
      console.log('❌ Error escaneando QR:', error);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let endpoint = '';
      let payload = {};

      if (modalType === 'loan') {
        endpoint = '/api/loan';
        payload = {
          qrCode: qrData,
          personName: formData.personName,
          notes: formData.notes
        };
      } else if (modalType === 'return') {
        endpoint = '/api/return';
        payload = {
          qrCode: qrData,
          notes: formData.notes
        };
      } else if (modalType === 'new') {
        endpoint = '/api/equipments';
        payload = {
          qrCode: qrData,
          name: formData.equipmentName,
          category: formData.category
        };
      }

      const response = await fetch(`${apiUrl}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      
      if (result.success) {
        alert('✅ Operación completada correctamente');
        closeModal();
        fetchEquipments(); // Actualizar tabla
      } else {
        alert('❌ Error: ' + result.message);
      }

    } catch (error) {
      console.error('❌ Error en la operación:', error);
      alert('❌ Error en la operación');
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setModalType('');
    setQrData(null);
    setEquipment(null);
    setFormData({ personName: '', notes: '', equipmentName: '', category: '' });
    
    // Reiniciar scanner
    setTimeout(() => {
      initializeScanner();
    }, 500);
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const getModalTitle = () => {
    switch (modalType) {
      case 'loan': return '📥 Registrar Préstamo';
      case 'return': return '📤 Registrar Devolución';
      case 'new': return '➕ Agregar Nuevo Equipo';
      default: return 'Modal';
    }
  };

  return (
    <div className="qr-scanner-container">
      <h1>🏷️ Sistema de Inventario QR</h1>
      
      <div className="scanner-section">
        <div id="qr-scanner" ref={scannerRef} className="scanner-wrapper" />
        
        {loading && (
          <div className="loading-overlay">
            <div className="loading-spinner"></div>
            <p>Procesando QR...</p>
          </div>
        )}
      </div>

      {/* Tabla de equipos */}
      <div className="equipments-table">
        <h2>📊 Inventario de Equipos</h2>
        <table>
          <thead>
            <tr>
              <th>QR Code</th>
              <th>Nombre</th>
              <th>Categoría</th>
              <th>Estado</th>
              <th>Persona Actual</th>
              <th>Última Actualización</th>
            </tr>
          </thead>
          <tbody>
            {equipments.map(equip => (
              <tr key={equip._id} className={equip.status}>
                <td>{equip.qrCode}</td>
                <td>{equip.name}</td>
                <td>{equip.category}</td>
                <td>
                  <span className={`status-badge ${equip.status}`}>
                    {equip.status === 'prestado' ? '📥 Prestado' : '✅ Disponible'}
                  </span>
                </td>
                <td>{equip.currentHolder || '-'}</td>
                <td>{new Date(equip.updatedAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{getModalTitle()}</h2>
              <button className="close-button" onClick={closeModal}>×</button>
            </div>
            
            <div className="modal-body">
              <div className="qr-info">
                <p><strong>QR Escaneado:</strong> {qrData}</p>
                {equipment && (
                  <p><strong>Equipo:</strong> {equipment.name}</p>
                )}
              </div>

              <form onSubmit={handleFormSubmit}>
                {modalType === 'loan' && (
                  <>
                    <div className="form-group">
                      <label>Nombre de la Persona *</label>
                      <input
                        type="text"
                        name="personName"
                        value={formData.personName}
                        onChange={handleInputChange}
                        required
                        placeholder="Ej: Juan Pérez"
                      />
                    </div>
                    <div className="form-group">
                      <label>Notas (opcional)</label>
                      <textarea
                        name="notes"
                        value={formData.notes}
                        onChange={handleInputChange}
                        placeholder="Observaciones del préstamo..."
                        rows="3"
                      />
                    </div>
                  </>
                )}

                {modalType === 'return' && (
                  <div className="form-group">
                    <label>Notas de la Devolución (opcional)</label>
                    <textarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                      placeholder="Observaciones de la devolución..."
                      rows="3"
                    />
                  </div>
                )}

                {modalType === 'new' && (
                  <>
                    <div className="form-group">
                      <label>Nombre del Equipo *</label>
                      <input
                        type="text"
                        name="equipmentName"
                        value={formData.equipmentName}
                        onChange={handleInputChange}
                        required
                        placeholder="Ej: Laptop Dell, Soldadora, etc."
                      />
                    </div>
                    <div className="form-group">
                      <label>Categoría *</label>
                      <input
                        type="text"
                        name="category"
                        value={formData.category}
                        onChange={handleInputChange}
                        required
                        placeholder="Ej: Electrónica, Herramientas, etc."
                      />
                    </div>
                  </>
                )}

                <div className="modal-footer">
                  <button type="button" onClick={closeModal} className="btn-secondary">
                    Cancelar
                  </button>
                  <button type="submit" className="btn-primary" disabled={loading}>
                    {loading ? 'Procesando...' : 'Confirmar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QRScanner;