import React, { useState, useEffect } from 'react';
import QRScanner from './components/QRScanner';
import RegisterItemModal from './components/RegisterItemModal';
import BorrowModal from './components/BorrowModal';
import ReturnModal from './components/ReturnModal';
import QRSheetGenerator from './components/QRSheetGenerator';
import './App.css';
import { api } from './utils/api';

function App() {
  const [showScanner, setShowScanner] = useState(false);
  const [showQRGenerator, setShowQRGenerator] = useState(false);
  const [currentQR, setCurrentQR] = useState('');
  const [scanResult, setScanResult] = useState(null);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showBorrowModal, setShowBorrowModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [items, setItems] = useState([]);

  // Cargar items al iniciar
  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
  try {
    const response = await api.items();
    const data = await response.json();
    setItems(data);
  } catch (error) {
    console.error('Error cargando items:', error);
  }
};

  const handleScanResult = (result) => {
    setScanResult(result);
    setCurrentQR(result.qrCode);
    
    // Cerrar escáner primero
    setShowScanner(false);
    
    // Luego abrir el modal correspondiente después de un pequeño delay
    setTimeout(() => {
      if (result.status === 'new') {
        setShowRegisterModal(true);
      } else if (result.status === 'available') {
        setShowBorrowModal(true);
      } else if (result.status === 'borrowed') {
        setShowReturnModal(true);
      }
    }, 100);
  };

  const handleCloseModals = () => {
    setShowRegisterModal(false);
    setShowBorrowModal(false);
    setShowReturnModal(false);
    setShowQRGenerator(false);
    setScanResult(null);
    setCurrentQR('');
  };

  const handleActionComplete = () => {
    // Recargar datos después de cualquier acción
    fetchItems();
    handleCloseModals();
  };

  // Obtener la última persona que lo prestó
  const getLastBorrower = async (itemId) => {
    try {
      const response = await fetch(`/api/history/${itemId}`);
      const history = await response.json();
      const lastBorrow = history.find(record => record.action === 'borrow');
      return lastBorrow ? lastBorrow.person : '';
    } catch (error) {
      console.error('Error obteniendo historial:', error);
      return '';
    }
  };

  return (
    <div className="app">
      <div className="container">
        <div className="header">
          <h1>🔍 SIG INVENTARIO QR</h1>
          <p>Sistema Inteligente de Gestión de Inventario</p>
          <div style={{ marginTop: '10px', fontSize: '0.9rem', opacity: 0.8 }}>
            <strong>Items registrados:</strong> {items.length} | 
            <strong> Disponibles:</strong> {items.filter(i => i.status === 'available').length} |
            <strong> Prestados:</strong> {items.filter(i => i.status === 'borrowed').length}
          </div>
        </div>

        <div className="main-content">
          {!showScanner && !showQRGenerator && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
              {/* Botones principales */}
              <div style={{ textAlign: 'center' }}>
                <button 
                  className="scan-button"
                  onClick={() => setShowScanner(true)}
                >
                  📱 Escanear QR
                </button>
                
                <div style={{ marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button 
                    className="btn btn-success"
                    onClick={() => setShowQRGenerator(true)}
                  >
                    🖨️ Generar QR Sheet
                  </button>
                </div>
              </div>

              {/* Tabla de Inventario */}
              <div style={{ 
                background: '#f8f9fa', 
                padding: '20px', 
                borderRadius: '10px',
                margin: '20px 0',
                overflowX: 'auto'
              }}>
                <h3 style={{ marginBottom: '15px', color: '#2c3e50' }}>
                  📋 Inventario del Sistema
                  <button 
                    onClick={fetchItems}
                    style={{
                      background: '#3498db',
                      color: 'white',
                      border: 'none',
                      borderRadius: '5px',
                      padding: '5px 10px',
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                      marginLeft: '10px'
                    }}
                  >
                    🔄 Actualizar
                  </button>
                </h3>
                
                {items.length === 0 ? (
                  <p style={{ textAlign: 'center', color: '#666', fontStyle: 'italic', padding: '20px' }}>
                    No hay items registrados. Escanea un QR para comenzar.
                  </p>
                ) : (
                  <table style={{ 
                    width: '100%', 
                    borderCollapse: 'collapse',
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    fontSize: '0.9rem'
                  }}>
                    <thead>
                      <tr style={{ backgroundColor: '#34495e', color: 'white' }}>
                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #2c3e50' }}>Item</th>
                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #2c3e50' }}>Categoría</th>
                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #2c3e50' }}>QR</th>
                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #2c3e50' }}>Estado</th>
                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #2c3e50' }}>Persona</th>
                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #2c3e50' }}>Última Actualización</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item, index) => (
                        <InventoryTableRow 
                          key={item._id} 
                          item={item} 
                          index={index}
                          onUpdate={fetchItems}
                        />
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* Componentes de escáner y generador */}
          {showScanner && (
            <QRScanner 
              onResult={handleScanResult}
              onClose={() => setShowScanner(false)}
            />
          )}

          {showQRGenerator && (
            <div style={{ textAlign: 'center' }}>
              <button 
                className="btn btn-danger"
                onClick={() => setShowQRGenerator(false)}
                style={{ marginBottom: '20px' }}
              >
                ❌ Cerrar Generador
              </button>
              <QRSheetGenerator />
            </div>
          )}
        </div>
      </div>

      {/* Modales del escáner */}
      {showRegisterModal && (
        <RegisterItemModal
          qrCode={currentQR}
          onClose={handleCloseModals}
          onSuccess={handleActionComplete}
        />
      )}

      {showBorrowModal && scanResult && (
        <BorrowModal
          item={scanResult.item}
          onClose={handleCloseModals}
          onSuccess={handleActionComplete}
        />
      )}

      {showReturnModal && scanResult && (
        <ReturnModal
          item={scanResult.item}
          onClose={handleCloseModals}
          onSuccess={handleActionComplete}
        />
      )}
    </div>
  );
}

// Componente para cada fila de la tabla
const InventoryTableRow = ({ item, index, onUpdate }) => {
  const [currentBorrower, setCurrentBorrower] = useState('');

  // Cargar la persona que lo tiene prestado
  useEffect(() => {
    const loadBorrower = async () => {
      if (item.status === 'borrowed') {
        try {
          const response = await fetch(`/api/history/${item._id}`);
          const history = await response.json();
          const lastBorrow = history.find(record => record.action === 'borrow');
          if (lastBorrow) {
            setCurrentBorrower(lastBorrow.person);
          }
        } catch (error) {
          console.error('Error cargando prestador:', error);
        }
      }
    };

    loadBorrower();
  }, [item]);

  return (
    <tr style={{ 
      backgroundColor: index % 2 === 0 ? '#f8f9fa' : 'white',
      borderBottom: '1px solid #dee2e6'
    }}>
      <td style={{ padding: '12px', fontWeight: 'bold' }}>{item.name}</td>
      <td style={{ padding: '12px', color: '#666' }}>
        {item.category === 'herramienta' ? '🛠️ Herramienta' :
         item.category === 'equipo' ? '💻 Equipo' :
         item.category === 'consumible' ? '📦 Consumible' : '🛡️ EPP'}
      </td>
      <td style={{ padding: '12px', fontFamily: 'monospace', fontSize: '0.8rem' }}>
        {item.qrCode}
      </td>
      <td style={{ padding: '12px' }}>
        <span style={{
          padding: '6px 12px',
          borderRadius: '15px',
          fontSize: '0.8rem',
          fontWeight: 'bold',
          backgroundColor: 
            item.status === 'available' ? '#d4edda' : 
            item.status === 'borrowed' ? '#f8d7da' : '#fff3cd',
          color: 
            item.status === 'available' ? '#155724' : 
            item.status === 'borrowed' ? '#721c24' : '#856404',
          border: 
            item.status === 'available' ? '1px solid #c3e6cb' : 
            item.status === 'borrowed' ? '1px solid #f5c6cb' : '1px solid #ffeaa7'
        }}>
          {item.status === 'available' ? 'Disponible' : 
           item.status === 'borrowed' ? 'Prestado' : 'Nuevo'}
        </span>
      </td>
      <td style={{ padding: '12px' }}>
        {item.status === 'borrowed' ? (
          <span style={{ fontWeight: 'bold', color: '#e74c3c' }}>
            {currentBorrower}
          </span>
        ) : (
          <span style={{ color: '#666', fontStyle: 'italic' }}>
            -
          </span>
        )}
      </td>
      <td style={{ padding: '12px', color: '#666', fontSize: '0.85rem' }}>
        {new Date(item.createdAt).toLocaleString('es-ES')}
      </td>
    </tr>
  );
};

export default App;