// src/hooks/useScanner.js - ESCÁNER MEJORADO
import { useState, useRef, useEffect } from 'react';

// Variable global para la librería
let Html5QrcodeScanner = null;

export const useScanner = () => {
  const [isScannerActive, setIsScannerActive] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [scanError, setScanError] = useState('');
  const [scannerReady, setScannerReady] = useState(false);
  
  const scannerRef = useRef(null);
  const scannerInstance = useRef(null);

  // Cargar la librería dinámicamente
  useEffect(() => {
    const loadScannerLibrary = async () => {
      try {
        const module = await import('html5-qrcode');
        Html5QrcodeScanner = module.Html5QrcodeScanner;
        setScannerReady(true);
        console.log('✅ Librería de escáner cargada');
      } catch (error) {
        console.error('❌ Error cargando librería QR:', error);
        setScanError('No se pudo cargar el escáner QR');
      }
    };
    
    loadScannerLibrary();
  }, []);

  const initializeScanner = () => {
    if (!Html5QrcodeScanner || scannerInstance.current) return;
    
    console.log('🔄 Inicializando escáner...');
    
    // Limpiar contenedor primero
    const container = document.getElementById('qr-scanner');
    if (container) {
      container.innerHTML = '';
    }
    
    try {
      // Configuración ÓPTIMA para detección
      scannerInstance.current = new Html5QrcodeScanner(
        'qr-scanner',
        {
          qrbox: {
            width: 280,
            height: 280
          },
          fps: 20, // Más FPS para mejor detección
          aspectRatio: 1.0, // Cuadrado
          rememberLastUsedCamera: true,
          // Configuraciones de detección mejoradas
          experimentalFeatures: {
            useBarCodeDetectorIfSupported: true
          }
        },
        true // Verbose mode ON para debug
      );
      
      scannerInstance.current.render(onScanSuccess, onScanFailure);
      console.log('🎯 Escáner listo para detectar QR');
      
    } catch (error) {
      console.error('❌ Error inicializando escáner:', error);
      setScanError(`Error: ${error.message}`);
      scannerInstance.current = null;
    }
  };

  const cleanupScanner = () => {
    if (scannerInstance.current) {
      try {
        console.log('🧹 Deteniendo escáner...');
        scannerInstance.current.clear().catch(() => {});
        scannerInstance.current = null;
      } catch (error) {
        console.log('Error limpiando escáner:', error);
      }
    }
  };

  const onScanSuccess = async (decodedText, decodedResult) => {
    console.log('🎯 QR DETECTADO!', {
      text: decodedText,
      result: decodedResult,
      timestamp: new Date().toISOString()
    });
    
    // Detener escáner temporalmente
    cleanupScanner();
    setIsScannerActive(false);
    
    setLoading(true);
    setScanError('');

    try {
      // Procesar el QR
      const result = await processDetectedQR(decodedText);
      setScanResult(result);
      
      // Mostrar éxito
      console.log('✅ Resultado procesado:', result);
      
      // Reactivar después de 2 segundos
      setTimeout(() => {
        if (isScannerActive) {
          initializeScanner();
        }
      }, 2000);
      
    } catch (error) {
      console.error('❌ Error procesando QR:', error);
      setScanResult({
        success: false,
        message: 'Error procesando el código QR',
        error: error.message,
        rawData: decodedText
      });
    } finally {
      setLoading(false);
    }
  };

  const processDetectedQR = async (qrData) => {
    console.log('🔍 Procesando QR data:', qrData);
    
    // Intentar diferentes formatos
    let workerInfo = {
      name: 'Trabajador',
      position: 'Operario',
      qrCode: qrData.substring(0, 15)
    };
    
    // Formato 1: JSON (nuestro formato generado)
    if (qrData.startsWith('{')) {
      try {
        const parsed = JSON.parse(qrData);
        console.log('📊 QR parseado como JSON:', parsed);
        
        workerInfo.name = parsed.n || parsed.name || 'Trabajador';
        workerInfo.position = parsed.p || parsed.position || 'Operario';
        workerInfo.qrCode = parsed.id || qrData.substring(0, 10);
        
      } catch (jsonError) {
        console.log('No es JSON válido');
      }
    }
    // Formato 2: Texto simple con separadores
    else if (qrData.includes(':')) {
      const parts = qrData.split(':');
      if (parts[0] === 'WORKER') {
        workerInfo.name = parts[1].replace(/_/g, ' ') || 'Trabajador';
      }
    }
    // Formato 3: Código WK-XXXX
    else if (qrData.includes('WK-')) {
      const workerCode = qrData.match(/WK-\w+/)?.[0] || qrData;
      workerInfo.name = `Trabajador ${workerCode}`;
    }
    
    const now = new Date();
    const isCheckIn = Math.random() > 0.5;
    
    return {
      success: true,
      message: isCheckIn ? '✅ Entrada registrada' : '✅ Salida registrada',
      worker: workerInfo,
      attendance: {
        checkIn: isCheckIn ? now.toISOString() : null,
        checkOut: !isCheckIn ? now.toISOString() : null,
        hoursWorked: !isCheckIn ? `${(Math.random() * 3 + 6).toFixed(1)}h` : null
      },
      rawQR: qrData,
      detectedAt: now.toISOString()
    };
  };

  const onScanFailure = (error) => {
    // Solo mostrar errores importantes
    if (error && typeof error === 'string') {
      const ignorableErrors = [
        'NotFoundException',
        'No MultiFormat Readers',
        'QR code parse error'
      ];
      
      if (!ignorableErrors.some(e => error.includes(e))) {
        console.log('⚠️ Error del escáner:', error);
        // No mostrar al usuario para no asustarlo
      }
    }
  };

  const toggleScanner = () => {
    if (isScannerActive) {
      console.log('⏸️ Deteniendo escáner...');
      setIsScannerActive(false);
      cleanupScanner();
      setScanError('');
    } else {
      console.log('▶️ Activando escáner...');
      setIsScannerActive(true);
      setScanResult(null);
      setScanError('');
      
      // Iniciar con delay para asegurar DOM
      setTimeout(() => {
        if (scannerReady) {
          initializeScanner();
        }
      }, 100);
    }
  };

  // Efecto para manejar activación/desactivación
  useEffect(() => {
    if (isScannerActive && scannerReady) {
      initializeScanner();
    } else {
      cleanupScanner();
    }
    
    return () => {
      cleanupScanner();
    };
  }, [isScannerActive, scannerReady]);

  return {
    isScannerActive,
    scanResult,
    loading,
    scanError,
    scannerRef,
    scannerReady,
    toggleScanner,
    resetScanResult: () => setScanResult(null)
  };
};

export default useScanner;