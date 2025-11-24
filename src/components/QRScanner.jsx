import React, { useState, useRef, useEffect } from 'react';

const QRScanner = ({ onResult, onClose }) => {
  const [manualQR, setManualQR] = useState('');
  const [showManual, setShowManual] = useState(false);
  const scannerRef = useRef(null);

  useEffect(() => {
    // Cargar la librería dinámicamente para evitar conflictos
    const loadScanner = async () => {
      try {
        const { Html5QrcodeScanner } = await import('html5-qrcode');
        initializeScanner(Html5QrcodeScanner);
      } catch (error) {
        console.error('Error cargando escáner:', error);
        setShowManual(true);
      }
    };

    loadScanner();

    return () => {
      stopScanner();
    };
  }, []);

  const initializeScanner = (Html5QrcodeScanner) => {
    try {
      // Limpiar cualquier escáner existente
      stopScanner();

      const qrReaderElement = document.getElementById('qr-reader');
      if (!qrReaderElement) {
        console.error('Elemento qr-reader no encontrado');
        setShowManual(true);
        return;
      }

      // Limpiar el contenedor
      qrReaderElement.innerHTML = '';

      const html5QrcodeScanner = new Html5QrcodeScanner(
        "qr-reader", 
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          rememberLastUsedCamera: false, // Importante: evitar duplicación
        },
        false
      );

      scannerRef.current = html5QrcodeScanner;

      const onScanSuccess = (decodedText, decodedResult) => {
        console.log('✅ QR detectado automáticamente:', decodedText);
        stopScanner();
        processQRCode(decodedText);
      };

      const onScanFailure = (error) => {
        // Ignorar errores normales
        if (!error?.includes('No QR code found')) {
          console.warn('Error de escaneo:', error);
        }
      };

      html5QrcodeScanner.render(onScanSuccess, onScanFailure);
      
    } catch (error) {
      console.error('Error iniciando escáner:', error);
      setShowManual(true);
    }
  };

  const stopScanner = () => {
    if (scannerRef.current) {
      try {
        scannerRef.current.clear().catch(() => {});
      } catch (error) {
        console.log('Error limpiando escáner:', error);
      }
      scannerRef.current = null;
    }
    
    // Limpiar manualmente el contenedor
    const qrReaderElement = document.getElementById('qr-reader');
    if (qrReaderElement) {
      qrReaderElement.innerHTML = '';
    }
  };

  const processQRCode = (qrCode) => {
    console.log('📤 Procesando QR:', qrCode);
    
    // Usar la URL base del entorno o localhost para desarrollo
    const apiUrl = import.meta.env.VITE_API_URL || '';
    
    fetch(`${apiUrl}/api/scan`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ qrCode }),
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Error HTTP: ' + response.status);
      }
      return response.json();
    })
    .then(data => {
      console.log('✅ Respuesta:', data);
      onResult({
        qrCode: qrCode,
        ...data
      });
    })
    .catch(err => {
      console.error('❌ Error:', err);
      alert('❌ Error: ' + err.message);
    });
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualQR.trim()) {
      processQRCode(manualQR.trim());
    }
  };

  const handleClose = () => {
    stopScanner();
    onClose();
  };

  return (
    <div className="qr-scanner">
      <h2>📷 Escáner QR Automático</h2>
      
      {/* Escáner Automático */}
      <div style={{ 
        background: '#f8f9fa', 
        padding: '20px', 
        borderRadius: '10px',
        margin: '20px 0',
        textAlign: 'center'
      }}>
        <h4>🔍 Escaneo Automático Activado</h4>
        <p>Enfoca el código QR dentro del área del escáner</p>

        <div 
          id="qr-reader"
          style={{
            width: '100%',
            maxWidth: '500px',
            margin: '0 auto',
            borderRadius: '10px',
            overflow: 'hidden',
            minHeight: '300px'
          }}
        ></div>

        <div style={{ margin: '15px 0' }}>
          <button 
            className="btn btn-secondary"
            onClick={() => setShowManual(!showManual)}
            style={{ margin: '5px' }}
          >
            {showManual ? '📷 Ocultar Manual' : '⌨️ Mostrar Manual'}
          </button>
        </div>
      </div>

      {/* Opción Manual */}
      {showManual && (
        <div style={{ 
          background: '#e8f4fc', 
          padding: '20px', 
          borderRadius: '10px',
          margin: '20px 0',
          border: '2px solid #3498db'
        }}>
          <h4>⌨️ Ingreso Manual (Respaldo)</h4>
          <form onSubmit={handleManualSubmit} style={{ 
            display: 'flex', 
            gap: '10px', 
            alignItems: 'center',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            <input
              type="text"
              value={manualQR}
              onChange={(e) => setManualQR(e.target.value)}
              placeholder="Ingresa el código QR manualmente"
              style={{ 
                flex: 1, 
                minWidth: '250px',
                padding: '12px', 
                border: '2px solid #3498db', 
                borderRadius: '8px',
                fontSize: '16px'
              }}
            />
            <button 
              type="submit" 
              className="btn btn-primary"
              style={{ whiteSpace: 'nowrap' }}
            >
              ✅ Procesar
            </button>
          </form>
        </div>
      )}

      {/* Botón Cerrar */}
      <div style={{ textAlign: 'center', marginTop: '20px' }}>
        <button 
          className="btn btn-danger"
          onClick={handleClose}
          style={{ 
            padding: '12px 30px',
            fontSize: '16px'
          }}
        >
          ❌ Cerrar Escáner
        </button>
      </div>
    </div>
  );
};

export default QRScanner;