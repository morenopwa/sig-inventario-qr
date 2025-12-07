// src/components/Attendance/QRModal/QRModal.jsx
import React from 'react';
import './QRModal.css';

const QRModal = ({ worker, onClose }) => {
  const downloadQR = () => {
    if (!worker.qrImage) return;
    
    const link = document.createElement('a');
    link.href = worker.qrImage;
    link.download = `QR-${worker.name.replace(/\s+/g, '_')}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const printQR = () => {
    const printWindow = window.open('', '_blank');
    
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR de ${worker.name}</title>
          <style>
            @page { margin: 15mm; }
            body { 
              font-family: Arial, sans-serif; 
              text-align: center; 
              padding: 20px;
              margin: 0;
            }
            .print-container {
              max-width: 300px;
              margin: 0 auto;
            }
            .print-header {
              margin-bottom: 20px;
              border-bottom: 2px solid #333;
              padding-bottom: 10px;
            }
            .print-title {
              font-size: 20px;
              font-weight: bold;
              margin: 0 0 5px 0;
              color: #333;
            }
            .print-subtitle {
              font-size: 14px;
              color: #666;
              margin: 0;
            }
            .qr-image-container {
              margin: 20px 0;
              padding: 10px;
              border: 1px solid #ddd;
              border-radius: 8px;
              background: white;
            }
            .qr-image-container img {
              width: 250px;
              height: 250px;
            }
            .worker-info {
              margin: 15px 0;
              text-align: left;
              background: #f8f9fa;
              padding: 15px;
              border-radius: 8px;
            }
            .info-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 8px;
              padding-bottom: 8px;
              border-bottom: 1px dashed #dee2e6;
            }
            .info-row:last-child {
              border-bottom: none;
              margin-bottom: 0;
              padding-bottom: 0;
            }
            .info-label {
              font-weight: bold;
              color: #333;
            }
            .info-value {
              color: #666;
            }
            .qr-code-display {
              font-family: 'Courier New', monospace;
              font-size: 12px;
              background: #e9ecef;
              padding: 8px;
              border-radius: 4px;
              margin: 10px 0;
              word-break: break-all;
            }
            .print-footer {
              margin-top: 20px;
              font-size: 10px;
              color: #999;
              border-top: 1px solid #eee;
              padding-top: 10px;
            }
            @media print {
              body { padding: 0; }
              .print-container { break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          <div class="print-container">
            <div class="print-header">
              <h1 class="print-title">🏭 Sistema de Control QR</h1>
              <p class="print-subtitle">Código QR de Trabajador</p>
            </div>
            
            <div class="qr-image-container">
              <img src="${worker.qrImage}" alt="Código QR de ${worker.name}">
            </div>
            
            <div class="worker-info">
              <div class="info-row">
                <span class="info-label">Nombre:</span>
                <span class="info-value">${worker.name}</span>
              </div>
              ${worker.position ? `
              <div class="info-row">
                <span class="info-label">Cargo:</span>
                <span class="info-value">${worker.position}</span>
              </div>
              ` : ''}
              ${worker.department ? `
              <div class="info-row">
                <span class="info-label">Departamento:</span>
                <span class="info-value">${worker.department}</span>
              </div>
              ` : ''}
              <div class="info-row">
                <span class="info-label">Código QR:</span>
                <span class="info-value">${worker.qrCode}</span>
              </div>
            </div>
            
            <div class="qr-code-display">
              ${worker.qrCode}
            </div>
            
            <div class="print-instructions">
              <p><strong>📋 Instrucciones:</strong></p>
              <ol style="text-align: left; font-size: 11px; margin: 10px 0; padding-left: 15px;">
                <li>Imprime esta hoja</li>
                <li>Recorta el código QR</li>
                <li>Pégalo en el carnet del trabajador</li>
                <li>Escánealo para registrar entrada/salida</li>
              </ol>
            </div>
            
            <div class="print-footer">
              <p>Generado el ${new Date().toLocaleDateString('es-ES')} - Sistema QR</p>
            </div>
          </div>
        </body>
      </html>
    `;
    
    printWindow.document.write(printContent);
    printWindow.document.close();
    
    // Esperar a que cargue la imagen antes de imprimir
    printWindow.onload = () => {
      printWindow.print();
    };
  };

  return (
    <div className="qr-modal-overlay" onClick={onClose}>
      <div className="qr-modal" onClick={(e) => e.stopPropagation()}>
        <div className="qr-modal-header">
          <div className="header-content">
            <h3>📱 Código QR del Trabajador</h3>
            <p>Escanea este código para registrar asistencias</p>
          </div>
          <button onClick={onClose} className="btn-close-modal">
            ×
          </button>
        </div>
        
        <div className="qr-modal-body">
          {/* Imagen del QR */}
          <div className="qr-display-section">
            {worker.qrImage ? (
              <div className="qr-image-container">
                <img src={worker.qrImage} alt={`QR de ${worker.name}`} className="qr-large-image" />
                <div className="qr-scanner-guide">
                  <div className="scanner-frame"></div>
                  <p>🔍 Enfoca aquí para escanear</p>
                </div>
              </div>
            ) : (
              <div className="no-qr-message">
                <div className="no-qr-icon">❌</div>
                <p>No hay código QR disponible</p>
              </div>
            )}
          </div>
          
          {/* Información del trabajador */}
          <div className="worker-info-section">
            <div className="worker-header">
              <div className="worker-avatar-large">
                {worker.name.charAt(0).toUpperCase()}
              </div>
              <div className="worker-details">
                <h4>{worker.name}</h4>
                {worker.position && <p className="worker-position">{worker.position}</p>}
                {worker.department && <p className="worker-department">{worker.department}</p>}
              </div>
            </div>
            
            <div className="qr-info">
              <div className="info-card">
                <div className="info-label">Código QR:</div>
                <div className="info-value qr-code-value">{worker.qrCode}</div>
              </div>
              
              <div className="info-card">
                <div className="info-label">Fecha de generación:</div>
                <div className="info-value">{new Date().toLocaleDateString('es-ES')}</div>
              </div>
              
              <div className="usage-instructions">
                <h5>📋 Cómo usar:</h5>
                <ol>
                  <li>Descarga o imprime este código QR</li>
                  <li>Pégalo en el carnet de identificación</li>
                  <li>Escánealo con la cámara para registrar entrada/salida</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
        
        <div className="qr-modal-footer">
          <div className="action-buttons">
            <button onClick={downloadQR} className="btn-action btn-download">
              <span className="btn-icon">⬇️</span>
              <span className="btn-text">Descargar QR</span>
            </button>
            
            <button onClick={printQR} className="btn-action btn-print">
              <span className="btn-icon">🖨️</span>
              <span className="btn-text">Imprimir</span>
            </button>
            
            <button onClick={onClose} className="btn-action btn-close">
              <span className="btn-icon">✕</span>
              <span className="btn-text">Cerrar</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRModal;