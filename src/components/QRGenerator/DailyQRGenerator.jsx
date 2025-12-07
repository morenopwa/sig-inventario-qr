// src/components/QRGenerator/DailyQRGenerator.jsx
import React, { useState } from 'react';
import QRCode from 'qrcode';
import { Download, Printer, Users, Clock, Calendar } from 'lucide-react';
import { toast } from 'react-hot-toast';
import useAttendance from '../../hooks/useAttendance';
import './DailyQRGenerator.css';

const DailyQRGenerator = () => {
  const { workers, getWorkersSortedByLastName, generateDailyQR } = useAttendance();
  const [selectedWorkers, setSelectedWorkers] = useState([]);
  const [generatedQRs, setGeneratedQRs] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);

  // Generar QR para trabajador seleccionado
  const generateQRForWorker = async (worker) => {
    const qrData = generateDailyQR(worker.id);
    if (!qrData) {
      toast.error(`No se pudo generar QR para ${worker.name}`);
      return null;
    }

    try {
      const qrCode = await QRCode.toDataURL(qrData, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      return {
        worker,
        qrData,
        qrCode,
        timestamp: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 horas
      };
    } catch (error) {
      console.error('Error generando QR:', error);
      toast.error('Error al generar código QR');
      return null;
    }
  };

  // Generar QR para múltiples trabajadores
  const generateMultipleQRs = async () => {
    if (selectedWorkers.length === 0) {
      toast.error('Selecciona al menos un trabajador');
      return;
    }

    setIsGenerating(true);
    toast.loading('Generando QR diarios...');

    const qrPromises = selectedWorkers.map(worker => generateQRForWorker(worker));
    const results = await Promise.all(qrPromises);
    const validResults = results.filter(Boolean);

    setGeneratedQRs(validResults);
    setIsGenerating(false);
    toast.dismiss();
    toast.success(`✅ ${validResults.length} QR generados exitosamente`);
  };

  // Descargar todos los QR
  const downloadAllQRs = () => {
    generatedQRs.forEach((qr, index) => {
      const link = document.createElement('a');
      link.href = qr.qrCode;
      link.download = `QR_${qr.worker.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.png`;
      link.click();
    });
    toast.success('QR descargados');
  };

  // Imprimir página
  const printQRs = () => {
    window.print();
  };

  // Seleccionar/deseleccionar todos
  const toggleSelectAll = () => {
    if (selectedWorkers.length === workers.length) {
      setSelectedWorkers([]);
    } else {
      setSelectedWorkers([...workers]);
    }
  };

  const sortedWorkers = getWorkersSortedByLastName();

  return (
    <div className="daily-qr-generator">
      {/* Encabezado */}
      <div className="qr-header">
        <h2><Calendar /> Generador de QR Diarios</h2>
        <p>Genera códigos QR válidos por 24 horas para registro de asistencia</p>
      </div>

      {/* Panel de selección */}
      <div className="selection-panel">
        <div className="panel-header">
          <h3><Users /> Seleccionar Trabajadores</h3>
          <div className="header-actions">
            <button onClick={toggleSelectAll} className="btn-select-all">
              {selectedWorkers.length === workers.length ? 'Deseleccionar Todos' : 'Seleccionar Todos'}
            </button>
            <span className="selection-count">
              {selectedWorkers.length} de {workers.length} seleccionados
            </span>
          </div>
        </div>

        <div className="workers-grid">
          {sortedWorkers.map(worker => (
            <div
              key={worker.id}
              className={`worker-select-card ${selectedWorkers.includes(worker) ? 'selected' : ''}`}
              onClick={() => {
                if (selectedWorkers.includes(worker)) {
                  setSelectedWorkers(selectedWorkers.filter(w => w !== worker));
                } else {
                  setSelectedWorkers([...selectedWorkers, worker]);
                }
              }}
            >
              <div className="worker-avatar">{worker.name.charAt(0)}</div>
              <div className="worker-info">
                <strong>{worker.name}</strong>
                <span>{worker.position || 'Sin cargo'}</span>
                <small>ID: {worker.id}</small>
              </div>
              <div className="selection-checkbox">
                {selectedWorkers.includes(worker) ? '✓' : ''}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Acciones */}
      <div className="action-buttons">
        <button
          onClick={generateMultipleQRs}
          disabled={isGenerating || selectedWorkers.length === 0}
          className="btn-generate"
        >
          {isGenerating ? 'Generando...' : '🖨️ Generar QR Diarios'}
        </button>
        
        {generatedQRs.length > 0 && (
          <>
            <button onClick={downloadAllQRs} className="btn-download">
              <Download /> Descargar Todos
            </button>
            <button onClick={printQRs} className="btn-print">
              <Printer /> Imprimir
            </button>
          </>
        )}
      </div>

      {/* Vista previa de QR generados */}
      {generatedQRs.length > 0 && (
        <div className="qr-preview">
          <h3><Clock /> QR Generados ({generatedQRs.length})</h3>
          <div className="qr-grid">
            {generatedQRs.map((qr, index) => (
              <div key={index} className="qr-card">
                <div className="qr-code">
                  <img src={qr.qrCode} alt={`QR de ${qr.worker.name}`} />
                  <div className="qr-expiry">
                    Válido hasta: {qr.expiresAt.toLocaleDateString()} {qr.expiresAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                <div className="qr-info">
                  <h4>{qr.worker.name}</h4>
                  <p>{qr.worker.position || 'Sin cargo'}</p>
                  <small>ID: {qr.worker.id}</small>
                  <div className="qr-actions">
                    <button
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = qr.qrCode;
                        link.download = `QR_${qr.worker.name.replace(/\s+/g, '_')}.png`;
                        link.click();
                      }}
                      className="btn-small"
                    >
                      <Download size={14} /> Descargar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Información */}
      <div className="info-panel">
        <h4>📋 Información Importante</h4>
        <ul>
          <li>✅ Cada QR es válido por <strong>24 horas</strong> desde su generación</li>
          <li>✅ Se genera un <strong>hash único</strong> para prevenir reutilización</li>
          <li>✅ Los trabajadores deben presentar el QR a un admin para escanear</li>
          <li>✅ El admin escanea el QR para registrar entrada/salida</li>
          <li>✅ Sistema detecta automáticamente tardanzas después de las 8 AM</li>
          <li>✅ Registra horas extras con +25% automático</li>
        </ul>
      </div>
    </div>
  );
};

export default DailyQRGenerator;