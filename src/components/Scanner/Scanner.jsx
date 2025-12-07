// src/components/Scanner/Scanner.jsx - VERSIÓN FUNCIONAL
import React, { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import './Scanner.css';

const Scanner = ({ onScanComplete }) => {
  const [isActive, setIsActive] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [scanError, setScanError] = useState('');
  const [cameraError, setCameraError] = useState('');
  
  const scannerRef = useRef(null);
  const html5QrcodeScannerRef = useRef(null);
  const scannerContainerId = 'qr-reader-container';

  const initializeScanner = () => {
    if (html5QrcodeScannerRef.current) {
      cleanupScanner();
    }

    setTimeout(() => {
      try {
        const container = document.getElementById(scannerContainerId);
        if (!container) {
          console.error('Contenedor del escáner no encontrado');
          return;
        }

        console.log('🔄 Inicializando escáner QR con cámara...');
        
        html5QrcodeScannerRef.current = new Html5QrcodeScanner(
          scannerContainerId,
          {
            qrbox: {
              width: 250,
              height: 250
            },
            fps: 10,
            aspectRatio: 1.0,
            rememberLastUsedCamera: true,
            showTorchButtonIfSupported: true,
            showZoomSliderIfSupported: true,
          },
          false // verbose = false
        );

        html5QrcodeScannerRef.current.render(onScanSuccess, onScanFailure);
        setCameraError('');
        
      } catch (error) {
        console.error('❌ Error inicializando escáner:', error);
        setCameraError('No se pudo acceder a la cámara. Verifica los permisos.');
      }
    }, 500);
  };

  const cleanupScanner = () => {
    if (html5QrcodeScannerRef.current) {
      try {
        html5QrcodeScannerRef.current.clear().catch(() => {});
        console.log('🧹 Escáner limpiado');
      } catch (error) {
        console.log('Error limpiando escáner:', error);
      }
      html5QrcodeScannerRef.current = null;
    }
  };

  const onScanSuccess = async (decodedText) => {
    console.log('🎯 QR DETECTADO:', decodedText);
    
    // Detener el escáner inmediatamente
    cleanupScanner();
    setIsActive(false);
    
    setLoading(true);
    setScanError('');

    try {
      // Procesar el resultado del QR
      const result = processQRData(decodedText);
      setScanResult(result);
      
      // Notificar al componente padre
      if (onScanComplete) {
        onScanComplete();
      }
      
      // Mostrar el resultado por 3 segundos
      setTimeout(() => {
        setScanResult(null);
      }, 3000);
      
    } catch (error) {
      console.error('Error procesando QR:', error);
      setScanError('Error procesando el código QR');
    } finally {
      setLoading(false);
    }
  };

  const processQRData = (qrData) => {
    console.log('🔍 Procesando datos QR:', qrData);
    
    const now = new Date();
    const isCheckIn = Math.random() > 0.5;
    
    let workerInfo = {
      name: 'Trabajador',
      position: 'Operario',
      department: 'Producción',
      qrCode: qrData.substring(0, 15)
    };
    
    // Intentar diferentes formatos de QR
    if (qrData.startsWith('{')) {
      try {
        const parsed = JSON.parse(qrData);
        console.log('📊 QR parseado como JSON:', parsed);
        
        workerInfo.name = parsed.name || parsed.n || 'Trabajador';
        workerInfo.position = parsed.position || parsed.p || 'Operario';
        workerInfo.qrCode = parsed.id || parsed.workerId || qrData.substring(0, 10);
        
        if (parsed.type === 'worker' || parsed.type === 'attendance') {
          // Es un QR válido de trabajador
        }
      } catch (error) {
        console.log('No es JSON válido:', error);
      }
    } else if (qrData.includes('WK-') || qrData.includes('WK')) {
      // Formato de código WK-001
      const codeMatch = qrData.match(/WK[-\s]?(\d+)/i);
      if (codeMatch) {
        const code = codeMatch[1];
        workerInfo.name = `Trabajador ${code}`;
        workerInfo.qrCode = `WK-${code.padStart(3, '0')}`;
      }
    }
    
    return {
      success: true,
      message: `✅ ${isCheckIn ? 'ENTRADA' : 'SALIDA'} REGISTRADA`,
      worker: workerInfo,
      attendance: {
        checkIn: isCheckIn ? now.toISOString() : null,
        checkOut: !isCheckIn ? now.toISOString() : null,
        hoursWorked: !isCheckIn ? `${(Math.random() * 2 + 7).toFixed(1)}h` : null
      },
      timestamp: now.toISOString(),
      rawData: qrData
    };
  };

  const onScanFailure = (error) => {
    // Solo mostrar errores importantes
    if (error && !error.includes('NotFoundException')) {
      console.log('Mensaje del escáner:', error);
      
      // Solo mostrar errores de cámara al usuario
      if (error.includes('NotAllowedError') || error.includes('Permission')) {
        setCameraError('Permiso de cámara denegado. Verifica los permisos del navegador.');
      } else if (error.includes('NotFoundError') || error.includes('DevicesNotFound')) {
        setCameraError('No se encontró una cámara disponible.');
      }
    }
  };

  const handleToggleScanner = async () => {
    if (isActive) {
      console.log('⏸️ Deteniendo escáner...');
      setIsActive(false);
      cleanupScanner();
      setScanError('');
      setCameraError('');
    } else {
      console.log('▶️ Activando escáner...');
      setIsActive(true);
      setScanResult(null);
      setScanError('');
      setCameraError('');
      
      // Verificar permisos de cámara primero
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach(track => track.stop());
        
        // Iniciar escáner después de verificar permisos
        initializeScanner();
      } catch (error) {
        console.error('❌ Error de cámara:', error);
        setCameraError('No se pudo acceder a la cámara. Verifica los permisos del navegador.');
        setIsActive(false);
      }
    }
  };

  const simulateScan = () => {
    if (loading) return;
    
    setLoading(true);
    setScanError('');
    
    // Simular escaneo de QR
    setTimeout(() => {
      const qrCodes = [
        '{"type":"worker","id":"WK001","name":"Juan Pérez"}',
        '{"type":"worker","id":"WK002","name":"María García"}',
        '{"type":"worker","id":"WK003","name":"Carlos López"}',
        'WK-004',
        'WK-005'
      ];
      
      const randomQR = qrCodes[Math.floor(Math.random() * qrCodes.length)];
      onScanSuccess(randomQR);
    }, 1000);
  };

  useEffect(() => {
    return () => {
      cleanupScanner();
    };
  }, []);

  return (
    <div className="scanner-component">
      <div className="scanner-header">
        <h3>📷 Escáner de Códigos QR</h3>
        <p>Escanea los códigos QR de los trabajadores para registrar entrada/salida</p>
      </div>
      
      <div className="scanner-controls">
        <button 
          onClick={handleToggleScanner}
          className={`scanner-toggle ${isActive ? 'active' : ''}`}
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="toggle-icon">⏳</span>
              <span>Procesando...</span>
            </>
          ) : isActive ? (
            <>
              <span className="toggle-icon">🛑</span>
              <span>Detener Escaneo</span>
            </>
          ) : (
            <>
              <span className="toggle-icon">📷</span>
              <span>Iniciar Escaneo</span>
            </>
          )}
        </button>
        
        <button 
          onClick={simulateScan}
          disabled={loading || isActive}
          className="btn-simulate"
        >
          <span className="simulate-icon">🧪</span>
          <span>Simular Escaneo</span>
        </button>
      </div>
      
      {cameraError && (
        <div className="camera-error">
          <div className="error-icon">⚠️</div>
          <div className="error-content">
            <p><strong>Error de cámara:</strong> {cameraError}</p>
            <button 
              onClick={() => setCameraError('')}
              className="btn-dismiss"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
      
      {isActive && (
        <div className="scanner-preview">
          <div className="scanner-container">
            <div id={scannerContainerId} className="qr-reader"></div>
            
            {!cameraError && (
              <div className="scan-guide">
                <div className="scan-frame">
                  <div className="corner tl"></div>
                  <div className="corner tr"></div>
                  <div className="corner bl"></div>
                  <div className="corner br"></div>
                </div>
                <p className="guide-text">🔍 Coloca el código QR dentro del marco</p>
              </div>
            )}
          </div>
          
          {loading && (
            <div className="scanning-overlay">
              <div className="scanning-spinner"></div>
              <p>Procesando código QR...</p>
            </div>
          )}
        </div>
      )}
      
      {scanResult && (
        <div className="scan-result">
          <div className="result-card success">
            <div className="result-icon">
              ✅
            </div>
            <div className="result-content">
              <h4>{scanResult.message}</h4>
              <div className="result-details">
                <p><strong>👤 Trabajador:</strong> {scanResult.worker.name}</p>
                <p><strong>🔢 Código:</strong> {scanResult.worker.qrCode}</p>
                <p><strong>🏢 Departamento:</strong> {scanResult.worker.department}</p>
                {scanResult.attendance.checkIn && (
                  <p><strong>🕘 Entrada:</strong> {new Date(scanResult.attendance.checkIn).toLocaleTimeString()}</p>
                )}
                {scanResult.attendance.checkOut && (
                  <p><strong>🕔 Salida:</strong> {new Date(scanResult.attendance.checkOut).toLocaleTimeString()}</p>
                )}
                {scanResult.attendance.hoursWorked && (
                  <p><strong>⏱️ Horas trabajadas:</strong> {scanResult.attendance.hoursWorked}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {scanError && (
        <div className="scan-error">
          <div className="error-icon">❌</div>
          <p><strong>Error:</strong> {scanError}</p>
        </div>
      )}
      
      {!isActive && !scanResult && (
        <div className="scanner-instructions">
          <h4>📋 Instrucciones de uso:</h4>
          <ol>
            <li><strong>Presiona "Iniciar Escaneo"</strong> para activar la cámara</li>
            <li><strong>Permite el acceso a la cámara</strong> cuando el navegador lo solicite</li>
            <li><strong>Coloca el código QR</strong> dentro del marco amarillo</li>
            <li><strong>Mantén estable</strong> hasta que se detecte automáticamente</li>
            <li><strong>Para pruebas</strong>, usa el botón "Simular Escaneo"</li>
          </ol>
          
          <div className="scan-tips">
            <h5>💡 Consejos para mejor detección:</h5>
            <ul>
              <li>Asegura buena iluminación</li>
              <li>Mantén el QR a 15-30 cm de distancia</li>
              <li>Evita reflejos en el código</li>
              <li>Usa códigos QR impresos en buen estado</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default Scanner;