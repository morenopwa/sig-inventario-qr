// src/components/Scanner/QRScanner.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ScannerHistory from './ScannerHistory';

const QRScanner = () => {
  const [user, setUser] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [scannedData, setScannedData] = useState('');
  const [scanHistory, setScanHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Verificar autenticación
    const userData = JSON.parse(localStorage.getItem('user'));
    if (!userData) {
      navigate('/login');
    } else {
      setUser(userData);
      
      // Cargar historial previo
      const savedHistory = JSON.parse(localStorage.getItem('scanHistory')) || [];
      setScanHistory(savedHistory);
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  const simulateQRScan = () => {
    setScanning(true);
    
    // Simular escaneo
    setTimeout(() => {
      const newScan = {
        id: Date.now(),
        qrCode: `ITEM-${Math.floor(Math.random() * 1000)}`,
        productName: `Producto ${Math.floor(Math.random() * 100)}`,
        location: 'Almacén A',
        timestamp: new Date().toLocaleString(),
        user: user.nombre,
        action: 'Escaneo'
      };
      
      setScannedData(newScan.qrCode);
      
      // Agregar al historial
      const updatedHistory = [newScan, ...scanHistory.slice(0, 9)];
      setScanHistory(updatedHistory);
      localStorage.setItem('scanHistory', JSON.stringify(updatedHistory));
      
      setScanning(false);
    }, 1500);
  };

  const handleManualEntry = () => {
    const code = prompt('Ingresa el código QR manualmente:');
    if (code) {
      const newScan = {
        id: Date.now(),
        qrCode: code,
        productName: 'Ingreso manual',
        location: 'Manual',
        timestamp: new Date().toLocaleString(),
        user: user.nombre,
        action: 'Manual'
      };
      
      setScannedData(code);
      const updatedHistory = [newScan, ...scanHistory.slice(0, 9)];
      setScanHistory(updatedHistory);
      localStorage.setItem('scanHistory', JSON.stringify(updatedHistory));
    }
  };

  const clearHistory = () => {
    if (window.confirm('¿Eliminar todo el historial?')) {
      setScanHistory([]);
      localStorage.removeItem('scanHistory');
    }
  };

  if (!user) return <div>Cargando...</div>;

  return (
    <div className="qr-scanner-page">
      {/* Header */}
      <header className="scanner-header">
        <div className="user-info">
          <div className="avatar">{user.nombre.charAt(0)}</div>
          <div>
            <h3>{user.nombre}</h3>
            <div className="user-details">
              <span className={`role-badge ${user.rol}`}>{user.rol}</span>
              <span className="department">{user.departamento}</span>
            </div>
          </div>
        </div>
        
        <div className="header-actions">
          <button 
            className="btn-secondary"
            onClick={() => navigate('/inventario')}
          >
            📦 Ver Inventario
          </button>
          {user.rol === 'admin' && (
            <button 
              className="btn-secondary"
              onClick={() => navigate('/admin')}
            >
              ⚙️ Admin
            </button>
          )}
          <button 
            className="logout-btn"
            onClick={handleLogout}
          >
            Cerrar Sesión
          </button>
        </div>
      </header>

      {/* Contenido principal */}
      <main className="scanner-main">
        <div className="scanner-section">
          <div className="scanner-container">
            <h1>Escaner de Códigos QR</h1>
            <p>Escanea códigos QR de productos para registrar movimientos</p>
            
            {/* Área de escaneo simulada */}
            <div className={`scanner-area ${scanning ? 'scanning' : ''}`}>
              <div className="scanner-overlay">
                {scanning ? (
                  <div className="scanning-animation">
                    <div className="laser"></div>
                    <p>Escaneando...</p>
                  </div>
                ) : (
                  <>
                    <div className="qr-placeholder">
                      <div className="qr-icon">📷</div>
                      <p>Coloca el código QR aquí</p>
                    </div>
                    <div className="scanned-result">
                      {scannedData && (
                        <div className="result-card">
                          <h4>Último escaneo:</h4>
                          <p><strong>Código:</strong> {scannedData}</p>
                          <button 
                            className="btn-small"
                            onClick={() => setScannedData('')}
                          >
                            Limpiar
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Controles del escáner */}
            <div className="scanner-controls">
              <button 
                className={`scan-btn ${scanning ? 'scanning' : ''}`}
                onClick={simulateQRScan}
                disabled={scanning}
              >
                {scanning ? 'Escaneando...' : '🔍 Escanear QR'}
              </button>
              
              <button 
                className="btn-secondary"
                onClick={handleManualEntry}
              >
                ✍️ Ingreso Manual
              </button>
              
              <button 
                className="btn-secondary"
                onClick={() => setShowHistory(!showHistory)}
              >
                {showHistory ? '📋 Ocultar Historial' : '📋 Mostrar Historial'}
              </button>
            </div>
          </div>
        </div>

        {/* Historial de escaneos */}
        {showHistory && (
          <ScannerHistory 
            history={scanHistory}
            clearHistory={clearHistory}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="scanner-footer">
        <div className="stats">
          <span>Total escaneos hoy: {scanHistory.length}</span>
          <span>Usuario: {user.nombre}</span>
          <span>Último login: {new Date().toLocaleTimeString()}</span>
        </div>
      </footer>
    </div>
  );
};

export default QRScanner;