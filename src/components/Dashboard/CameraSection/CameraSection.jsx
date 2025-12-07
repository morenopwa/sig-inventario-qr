// src/components/Dashboard/CameraSection/CameraSection.jsx
import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { Camera, Scan, Zap, X, QrCode, User, Package } from 'lucide-react';
import useScanner from '../../../hooks/useScanner';
import './CameraSection.css';

const CameraSection = ({ onScan, activeModule }) => {
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [selectedCamera, setSelectedCamera] = useState(null);
  const [availableCameras, setAvailableCameras] = useState([]);
  const [scanMode, setScanMode] = useState('auto'); // 'auto', 'manual', 'simulator'
  const [manualQR, setManualQR] = useState('');
  const scannerRef = useRef(null);
  
  const { processQRCode, resetScan, scanResult, error, setIsScanning } = useScanner();

  // Detectar cámaras disponibles
  useEffect(() => {
    if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
      navigator.mediaDevices.enumerateDevices()
        .then(devices => {
          const videoDevices = devices.filter(device => 
            device.kind === 'videoinput'
          );
          setAvailableCameras(videoDevices);
          if (videoDevices.length > 0 && !selectedCamera) {
            setSelectedCamera(videoDevices[0].deviceId);
          }
        })
        .catch(err => {
          console.error('Error al listar cámaras:', err);
          toast.error('No se pudieron detectar las cámaras');
        });
    }
  }, []);

  // Inicializar escáner de cámara
  const initCameraScanner = () => {
    if (!selectedCamera) {
      toast.error('No hay cámara seleccionada');
      return;
    }

    if (scannerRef.current) {
      scannerRef.current.clear();
    }

    // Usar html5-qrcode
    import('html5-qrcode').then(({ Html5Qrcode }) => {
      const scanner = new Html5Qrcode('camera-container');
      scannerRef.current = scanner;

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.7777778,
        facingMode: selectedCamera === 'environment' ? 'environment' : 'user'
      };

      scanner.start(
        { deviceId: { exact: selectedCamera } },
        config,
        onQrCodeSuccess,
        onQrCodeError
      ).then(() => {
        setIsCameraOn(true);
        setIsScanning(true);
        toast.success('Cámara activada');
      }).catch(err => {
        console.error('Error al iniciar cámara:', err);
        toast.error('No se pudo acceder a la cámara');
      });
    }).catch(err => {
      console.error('Error cargando html5-qrcode:', err);
      toast.error('Error al cargar el escáner');
    });
  };

  // Detener cámara
  const stopCamera = () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      scannerRef.current.stop().then(() => {
        setIsCameraOn(false);
        setIsScanning(false);
        toast('Cámara detenida');
      }).catch(err => {
        console.error('Error deteniendo cámara:', err);
      });
    }
  };

  // Manejar éxito del escaneo
  const onQrCodeSuccess = (decodedText) => {
    if (scanMode === 'simulator') return;
    
    // Procesar el QR
    const result = processQRCode(decodedText);
    
    if (result) {
      // Notificación visual de éxito
      toast.success('QR detectado ✓', {
        icon: '🔍',
        duration: 1500
      });
      
      // Sonido de éxito (opcional)
      playScanSound('success');
      
      // Pasar resultado al padre
      onScan(decodedText);
      
      // Pausar brevemente para evitar múltiples escaneos
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.pause();
        setTimeout(() => {
          if (scannerRef.current && scannerRef.current.isScanning) {
            scannerRef.current.resume();
          }
        }, 1000);
      }
    }
  };

  // Manejar error del escáner
  const onQrCodeError = (error) => {
    if (error.includes('NotFoundException')) {
      console.log('Esperando QR...');
    } else {
      console.error('Error del escáner:', error);
    }
  };

  // Simulador de QR para desarrollo
  const handleSimulatorScan = () => {
    const qrTypes = {
      attendance: JSON.stringify({
        type: 'attendance_daily',
        workerId: `WK-${Date.now()}`,
        name: 'JUAN PÉREZ GARCÍA',
        date: new Date().toISOString().split('T')[0],
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        hash: 'abc123',
        action: 'checkin'
      }),
      equipment: JSON.stringify({
        type: 'equipment',
        equipmentId: `EQ-${Date.now()}`,
        name: 'TALADRO INALÁMBRICO',
        code: 'TLD-2024-001',
        category: 'Herramientas eléctricas',
        status: 'available'
      }),
      loan: JSON.stringify({
        type: 'loan',
        loanId: `LOAN-${Date.now()}`,
        equipmentId: 'EQ-001',
        workerId: 'WK-001'
      })
    };

    const qrData = activeModule === 'attendance' 
      ? qrTypes.attendance 
      : qrTypes.equipment;
    
    onScan(qrData);
    toast('Simulación de QR escaneado', {
      icon: '🎮'
    });
  };

  // Procesar entrada manual de QR
  const handleManualQRSubmit = () => {
    if (!manualQR.trim()) {
      toast.error('Ingrese un código QR');
      return;
    }
    
    onScan(manualQR);
    setManualQR('');
    toast.success('QR manual procesado');
  };

  // Sonido de escaneo
  const playScanSound = (type) => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    if (type === 'success') {
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(1200, audioContext.currentTime + 0.1);
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
    } else {
      oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
    }
    
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.3);
  };

  // Limpiar
  useEffect(() => {
    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, []);

  return (
    <div className="camera-section-container">
      {/* Indicador de modo activo */}
      <div className="mode-indicator">
        <div className="mode-badge">
          {activeModule === 'attendance' ? (
            <>
              <User size={16} />
              <span>MODO ASISTENCIA</span>
            </>
          ) : (
            <>
              <Package size={16} />
              <span>MODO INVENTARIO</span>
            </>
          )}
        </div>
        <div className="scan-count">
          <Zap size={14} />
          <span>Escaneos hoy: 0</span>
        </div>
      </div>

      {/* Contenedor principal de cámara */}
      <div className="camera-main">
        {/* Vista de cámara */}
        <div className="camera-view">
          {isCameraOn ? (
            <div id="camera-container" className="camera-container">
              {/* El escáner se renderiza aquí */}
              <div className="scan-overlay">
                <div className="scan-frame">
                  <div className="scan-corner top-left"></div>
                  <div className="scan-corner top-right"></div>
                  <div className="scan-corner bottom-left"></div>
                  <div className="scan-corner bottom-right"></div>
                  <div className="scan-line"></div>
                </div>
              </div>
            </div>
          ) : (
            <div className="camera-placeholder">
              <Camera size={64} />
              <p>Cámara desactivada</p>
              <small>Activa la cámara para comenzar a escanear</small>
            </div>
          )}
        </div>

        {/* Panel de controles */}
        <div className="camera-controls">
          {/* Selector de modo */}
          <div className="control-group">
            <label>Modo de Escaneo:</label>
            <div className="mode-selector">
              <button
                className={`mode-btn ${scanMode === 'auto' ? 'active' : ''}`}
                onClick={() => setScanMode('auto')}
              >
                <Scan size={18} />
                Auto
              </button>
              <button
                className={`mode-btn ${scanMode === 'manual' ? 'active' : ''}`}
                onClick={() => setScanMode('manual')}
              >
                <QrCode size={18} />
                Manual
              </button>
              <button
                className={`mode-btn ${scanMode === 'simulator' ? 'active' : ''}`}
                onClick={() => setScanMode('simulator')}
              >
                🎮 Simulador
              </button>
            </div>
          </div>

          {/* Selector de cámara */}
          {availableCameras.length > 0 && (
            <div className="control-group">
              <label>Seleccionar Cámara:</label>
              <select
                value={selectedCamera || ''}
                onChange={(e) => setSelectedCamera(e.target.value)}
                className="camera-select"
                disabled={isCameraOn}
              >
                {availableCameras.map((camera, index) => (
                  <option key={camera.deviceId} value={camera.deviceId}>
                    {camera.label || `Cámara ${index + 1}`}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Botones de control */}
          <div className="control-buttons">
            {!isCameraOn ? (
              <button
                className="btn-control start"
                onClick={initCameraScanner}
                disabled={!selectedCamera}
              >
                <Camera size={18} />
                Activar Cámara
              </button>
            ) : (
              <button
                className="btn-control stop"
                onClick={stopCamera}
              >
                <X size={18} />
                Detener Cámara
              </button>
            )}

            <button
              className="btn-control simulator"
              onClick={handleSimulatorScan}
            >
              🎮 Simular Escaneo
            </button>
          </div>

          {/* Entrada manual de QR */}
          {scanMode === 'manual' && (
            <div className="manual-input">
              <label>Ingresar QR manualmente:</label>
              <div className="input-group">
                <textarea
                  value={manualQR}
                  onChange={(e) => setManualQR(e.target.value)}
                  placeholder='Pega aquí el código QR en formato JSON o texto...'
                  rows="3"
                  className="qr-textarea"
                />
                <button
                  onClick={handleManualQRSubmit}
                  className="btn-submit"
                  disabled={!manualQR.trim()}
                >
                  Procesar
                </button>
              </div>
            </div>
          )}

          {/* Instrucciones */}
          <div className="instructions">
            <h4>📋 Instrucciones:</h4>
            <ul>
              <li>
                <strong>Asistencia:</strong> Escanee el QR diario del trabajador
              </li>
              <li>
                <strong>Inventario:</strong> Escanee el QR del equipo para préstamo/devolución
              </li>
              <li>
                <strong>Posicione</strong> el QR dentro del marco para mejor lectura
              </li>
              <li>
                <strong>Asegure</strong> buena iluminación
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Resultado del último escaneo */}
      {scanResult && (
        <div className="scan-result">
          <div className="result-header">
            <h4>Último Escaneo:</h4>
            <button onClick={resetScan} className="btn-clear">
              <X size={16} />
            </button>
          </div>
          <div className="result-content">
            <pre>{JSON.stringify(scanResult, null, 2)}</pre>
          </div>
        </div>
      )}

      {/* Estado del sistema */}
      <div className="system-status">
        <div className={`status-item ${isCameraOn ? 'online' : 'offline'}`}>
          <div className="status-dot"></div>
          <span>Cámara: {isCameraOn ? 'ACTIVA' : 'INACTIVA'}</span>
        </div>
        <div className="status-item online">
          <div className="status-dot"></div>
          <span>Sistema: OPERATIVO</span>
        </div>
        <div className="status-item online">
          <div className="status-dot"></div>
          <span>Almacenamiento: LOCAL</span>
        </div>
      </div>
    </div>
  );
};

export default CameraSection;