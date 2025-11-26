import React, { useState, useRef, useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import './QRScanner.css';

const QRScanner = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isScannerActive, setIsScannerActive] = useState(false);
  const [modalType, setModalType] = useState('');
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
  const [manualItem, setManualItem] = useState({
    name: '',
    category: '',
    qrCode: ''
  });
  const [searchTerm, setSearchTerm] = useState('');

  const scannerRef = useRef(null);
  const html5QrcodeScannerRef = useRef(null);
  const apiUrl = import.meta.env.VITE_API_URL || 'https://sig-inventario-qr-backend.onrender.com';

  // Cargar equipos al iniciar
  useEffect(() => {
    fetchEquipments();
  }, []);

  // Configurar scanner solo cuando esté activo
  useEffect(() => {
    if (isScannerActive && !html5QrcodeScannerRef.current) {
      initializeScanner();
    } else if (!isScannerActive && html5QrcodeScannerRef.current) {
      cleanupScanner();
    }

    return () => {
      cleanupScanner();
    };
  }, [isScannerActive]);

  const initializeScanner = () => {
    if (html5QrcodeScannerRef.current) {
      cleanupScanner();
    }

    setTimeout(() => {
      if (!scannerRef.current) return;

      html5QrcodeScannerRef.current = new Html5QrcodeScanner(
        'qr-scanner',
        {
          qrbox: { width: 250, height: 250 },
          fps: 2,
          rememberLastUsedCamera: true,
          supportedScanTypes: [], 
          showTorchButtonIfSupported: true,
          showZoomSliderIfSupported: true,
        },
        false
      );

      html5QrcodeScannerRef.current.render(
        onScanSuccess,
        onScanFailure,
        {
          highlightCodeOutline: true,
          highlightScanRegion: true
        }
      );
    }, 100);
  };

  const cleanupScanner = () => {
    if (html5QrcodeScannerRef.current) {
      try {
        html5QrcodeScannerRef.current.clear().catch(error => {
          console.log('Scanner cleanup:', error);
        });
      } catch (error) {
        console.log('Error during cleanup:', error);
      }
      html5QrcodeScannerRef.current = null;
    }
  };

  const fetchEquipments = async () => {
    try {
      const response = await fetch(`${apiUrl}/api/items`);
      const data = await response.json();
      setEquipments(data);
    } catch (error) {
      console.error('Error cargando items:', error);
    }
  };

  const onScanSuccess = async (decodedText, decodedResult) => {
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
        setModalType(result.equipment.status === 'prestado' ? 'return' : 'loan');
      } else {
        setEquipment(null);
        setModalType('new');
      }
      
      setIsModalOpen(true);
      setIsScannerActive(false);

    } catch (error) {
      console.error('❌ Error procesando QR:', error);
    } finally {
      setLoading(false);
    }
  };

  const onScanFailure = (error) => {
    if (error && !error.includes('No QR code found')) {
      console.log('Scanner status:', error);
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
        closeModal();
        fetchEquipments();
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

  const handleManualAdd = async (e) => {
    e.preventDefault();
    if (!manualItem.name.trim()) return;

    setLoading(true);
    try {
      const response = await fetch(`${apiUrl}/api/equipments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          qrCode: manualItem.qrCode || `MANUAL_${Date.now()}`,
          name: manualItem.name,
          category: manualItem.category || 'General'
        })
      });

      const result = await response.json();
      
      if (result.success) {
        setManualItem({ name: '', category: '', qrCode: '' });
        fetchEquipments();
        alert('✅ Equipo agregado correctamente');
      } else {
        alert('❌ Error: ' + result.message);
      }
    } catch (error) {
      console.error('❌ Error agregando equipo:', error);
      alert('❌ Error agregando equipo');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignUser = async (equipment) => {
    const personName = prompt('Ingresa el nombre de la persona:');
    if (!personName) return;

    setLoading(true);
    try {
      const response = await fetch(`${apiUrl}/api/loan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          qrCode: equipment.qrCode,
          personName: personName,
          notes: 'Asignado manualmente'
        })
      });

      const result = await response.json();
      
      if (result.success) {
        fetchEquipments();
        alert('✅ Persona asignada correctamente');
      } else {
        alert('❌ Error: ' + result.message);
      }
    } catch (error) {
      console.error('❌ Error asignando persona:', error);
      alert('❌ Error asignando persona');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveAssignment = async (equipment) => {
    if (!confirm(`¿Estás seguro de quitar la asignación a ${equipment.currentHolder}?`)) return;

    setLoading(true);
    try {
      const response = await fetch(`${apiUrl}/api/return`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          qrCode: equipment.qrCode,
          notes: 'Asignación removida manualmente'
        })
      });

      const result = await response.json();
      
      if (result.success) {
        fetchEquipments();
        alert('✅ Asignación removida correctamente');
      } else {
        alert('❌ Error: ' + result.message);
      }
    } catch (error) {
      console.error('❌ Error removiendo asignación:', error);
      alert('❌ Error removiendo asignación');
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
  };

  const toggleScanner = () => {
    if (isScannerActive) {
      setIsScannerActive(false);
      cleanupScanner();
    } else {
      setIsScannerActive(true);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleManualInputChange = (e) => {
    setManualItem({
      ...manualItem,
      [e.target.name]: e.target.value
    });
  };

  const getModalTitle = () => {
    switch (modalType) {
      case 'loan': return 'Registrar Préstamo';
      case 'return': return 'Registrar Devolución';
      case 'new': return 'Agregar Equipo';
      default: return '';
    }
  };

  // Filtrar equipos basado en búsqueda
  const filteredEquipments = equipments.filter(equip => 
    equip.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    equip.currentHolder?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    equip.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    equip.qrCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Obtener fecha de última actualización
  const getLastUpdateDate = (equipment) => {
    if (!equipment.history || equipment.history.length === 0) {
      return new Date(equipment.updatedAt).toLocaleDateString();
    }
    const lastAction = equipment.history[equipment.history.length - 1];
    return new Date(lastAction.timestamp).toLocaleDateString();
  };

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        {/* Scanner Section */}
        <div className="scanner-section">
          <div className="scanner-header">
            <h3>Escaner QR</h3>
            <button 
              className={`scanner-toggle ${isScannerActive ? 'active' : ''}`}
              onClick={toggleScanner}
            >
              {isScannerActive ? '🛑 Detener' : '📷 Escanear QR'}
            </button>
          </div>
          
          {isScannerActive && (
            <div className="scanner-container">
              <div id="qr-scanner" ref={scannerRef} />
              {loading && (
                <div className="scanner-loading">
                  <div className="spinner"></div>
                  <p>Procesando QR...</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Agregar manualmente */}
        <div className="manual-add-section">
          <h3>Agregar Equipo Manualmente</h3>
          <form onSubmit={handleManualAdd} className="manual-form">
            <div className="form-row">
              <input
                type="text"
                name="name"
                value={manualItem.name}
                onChange={handleManualInputChange}
                placeholder="Nombre del equipo *"
                required
              />
              <input
                type="text"
                name="category"
                value={manualItem.category}
                onChange={handleManualInputChange}
                placeholder="Categoría"
              />
              <input
                type="text"
                name="qrCode"
                value={manualItem.qrCode}
                onChange={handleManualInputChange}
                placeholder="Código QR"
              />
              <button type="submit" disabled={loading} className="btn-add">
                {loading ? '...' : '➕ Agregar'}
              </button>
            </div>
          </form>
        </div>
      </header>

      {/* Buscador */}
      <div className="search-section">
        <input
          type="text"
          placeholder="Buscar por persona, equipo, categoría..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      {/* Tabla para Vista de Escanear QR */}
      {isScannerActive && (
        <div className="table-container">
          <div className="table-header">
            <h3>Equipos Disponibles</h3>
            <span className="table-count">{filteredEquipments.length} equipos</span>
          </div>
          <table className="equipment-table scanner-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Persona</th>
                <th>Estado</th>
                <th>Categoría</th>
                <th>Fecha</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {filteredEquipments.map(equip => (
                <tr key={equip._id} className={equip.status}>
                  <td className="equipment-name">
                    <div>
                      <strong>{equip.name}</strong>
                      <small>{equip.qrCode}</small>
                    </div>
                  </td>
                  <td className="person">
                    {equip.currentHolder || 'Sin asignar'}
                  </td>
                  <td>
                    <span className={`status ${equip.status}`}>
                      {equip.status === 'prestado' ? 'Prestado' : 'Disponible'}
                    </span>
                  </td>
                  <td className="category">{equip.category || '-'}</td>
                  <td className="date">
                    {getLastUpdateDate(equip)}
                  </td>
                  <td className="actions">
                    {equip.status === 'disponible' ? (
                      <button 
                        className="btn-action btn-assign"
                        onClick={() => handleAssignUser(equip)}
                        title="Asignar persona"
                      >
                        +
                      </button>
                    ) : (
                      <button 
                        className="btn-action btn-remove"
                        onClick={() => handleRemoveAssignment(equip)}
                        title="Quitar asignación"
                      >
                        -
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredEquipments.length === 0 && (
            <div className="empty-state">
              {searchTerm ? 'No se encontraron resultados' : 'No hay equipos registrados'}
            </div>
          )}
        </div>
      )}

      {/* Tabla para Vista Principal */}
      {!isScannerActive && (
        <div className="table-container">
          <div className="table-header">
            <span className="table-count">{filteredEquipments.length} equipos</span>
          </div>
          <table className="equipment-table main-table">
            <thead>
              <tr>
                <th>Equipo</th>
                <th>Persona Actual</th>
                <th>Categoría</th>
                <th>Estado</th>
                <th>Código QR</th>
                <th>Última Actualización</th>
              </tr>
            </thead>
            <tbody>
              {filteredEquipments.map(equip => (
                <tr key={equip._id} className={equip.status}>
                  <td className="equipment-name">
                    <div>
                      <strong>{equip.name}</strong>
                    </div>
                  </td>
                  <td className="person">
                    {equip.currentHolder ? (
                      <div>
                        <strong>{equip.currentHolder}</strong>
                        {equip.history?.[0]?.timestamp && (
                          <small>Desde {new Date(equip.history[0].timestamp).toLocaleDateString()}</small>
                        )}
                      </div>
                    ) : (
                      'Sin asignar'
                    )}
                  </td>
                  <td className="category">{equip.category || '-'}</td>
                  <td>
                    <span className={`status ${equip.status}`}>
                      {equip.status === 'prestado' ? 'Prestado' : 'Disponible'}
                    </span>
                  </td>
                  <td className="qr-code">{equip.qrCode}</td>
                  <td className="date">
                    {getLastUpdateDate(equip)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredEquipments.length === 0 && (
            <div className="empty-state">
              {searchTerm ? 'No se encontraron resultados' : 'No hay equipos registrados'}
            </div>
          )}
        </div>
      )}

      {/* Modal de QR */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{getModalTitle()}</h2>
              <button className="modal-close" onClick={closeModal}>×</button>
            </div>
            
            <div className="modal-body">
              <div className="qr-preview">
                <span>QR escaneado: <strong>{qrData}</strong></span>
              </div>

              <form onSubmit={handleFormSubmit} className="modal-form">
                {modalType === 'loan' && (
                  <>
                    <div className="input-group">
                      <label>Persona que recibe *</label>
                      <input
                        type="text"
                        name="personName"
                        value={formData.personName}
                        onChange={handleInputChange}
                        required
                        placeholder="Nombre completo"
                        autoFocus
                      />
                    </div>
                    <div className="input-group">
                      <label>Notas (opcional)</label>
                      <textarea
                        name="notes"
                        value={formData.notes}
                        onChange={handleInputChange}
                        placeholder="Observaciones del préstamo..."
                        rows="2"
                      />
                    </div>
                  </>
                )}

                {modalType === 'return' && (
                  <div className="input-group">
                    <label>Notas de devolución (opcional)</label>
                    <textarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                      placeholder="Observaciones de la devolución..."
                      rows="2"
                    />
                  </div>
                )}

                {modalType === 'new' && (
                  <>
                    <div className="input-group">
                      <label>Nombre del equipo *</label>
                      <input
                        type="text"
                        name="equipmentName"
                        value={formData.equipmentName}
                        onChange={handleInputChange}
                        required
                        placeholder="Ej: Laptop Dell, Soldadora..."
                        autoFocus
                      />
                    </div>
                    <div className="input-group">
                      <label>Categoría *</label>
                      <input
                        type="text"
                        name="category"
                        value={formData.category}
                        onChange={handleInputChange}
                        required
                        placeholder="Ej: Electrónica, Herramientas..."
                      />
                    </div>
                  </>
                )}

                <div className="modal-actions">
                  <button type="button" onClick={closeModal} className="btn btn-cancel">
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-confirm" disabled={loading}>
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