// src/components/Attendance/WorkerQRModal/WorkerQRModal.jsx
import React, { useState } from 'react';
import './WorkerQRModal.css';

const WorkerQRModal = ({ worker, onClose }) => {
  const [copied, setCopied] = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(worker.qrCode)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(err => {
        console.error('Error al copiar:', err);
      });
  };

  const handleDownloadQR = () => {
    if (!worker.qrImage) return;
    
    // Crear enlace para descargar
    const link = document.createElement('a');
    link.href = worker.qrImage;
    link.download = `QR_${worker.name.replace(/\s+/g, '_')}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintQR = () => {
    if (!worker.qrImage) return;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR de ${worker.name}</title>
          <style>
            @media print {
              body { 
                font-family: Arial, sans-serif; 
                text-align: center; 
                padding: 20px;
                margin: 0;
              }
              .qr-container {
                margin: 50px auto;
                max-width: 300px;
              }
              .qr-image {
                width: 300px;
                height: 300px;
                border: 1px solid #ccc;
                padding: 10px;
                background: white;
              }
              .worker-info {
                margin: 20px 0;
                text-align: left;
                padding: 10px;
                border: 1px solid #eee;
              }
              h2 { color: #333; margin-bottom: 10px; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="qr-container">
            <h2>${worker.name}</h2>
            <div class="worker-info">
              <p><strong>Código:</strong> ${worker.qrCode}</p>
              ${worker.position ? `<p><strong>Puesto:</strong> ${worker.position}</p>` : ''}
              ${worker.department ? `<p><strong>Departamento:</strong> ${worker.department}</p>` : ''}
              <p><strong>Fecha:</strong> ${new Date().toLocaleDateString()}</p>
            </div>
            <img src="${worker.qrImage}" class="qr-image" alt="QR Code" />
            <p>Escanea este código para registrar asistencia</p>
          </div>
          <div class="no-print">
            <button onclick="window.close()">Cerrar</button>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  return (
    <div className="qr-modal-overlay">
      <div className="qr-modal">
        <div className="qr-modal-header">
          <h3>🎉 ¡Trabajador Agregado Exitosamente!</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="qr-modal-body">
          <div className="qr-preview">
            {worker.qrImage ? (
              <div className="qr-image-container">
                <img src={worker.qrImage} alt={`QR de ${worker.name}`} />
                <div className="qr-frame">
                  <div className="corner tl"></div>
                  <div className="corner tr"></div>
                  <div className="corner bl"></div>
                  <div className="corner br"></div>
                </div>
              </div>
            ) : (
              <div className="qr-placeholder">
                <div className="qr-skeleton"></div>
                <p>QR no disponible</p>
              </div>
            )}
          </div>
          
          <div className="qr-info">
            <div className="info-row">
              <span className="info-label">Nombre:</span>
              <span className="info-value">{worker.name}</span>
            </div>
            {worker.position && (
              <div className="info-row">
                <span className="info-label">Puesto:</span>
                <span className="info-value">{worker.position}</span>
              </div>
            )}
            {worker.department && (
              <div className="info-row">
                <span className="info-label">Departamento:</span>
                <span className="info-value">{worker.department}</span>
              </div>
            )}
            <div className="info-row">
              <span className="info-label">Código QR:</span>
              <div className="code-container">
                <code className="qr-code">{worker.qrCode}</code>
                <button 
                  onClick={handleCopyCode}
                  className={`copy-btn ${copied ? 'copied' : ''}`}
                >
                  {copied ? '✅ Copiado' : '📋 Copiar'}
                </button>
              </div>
            </div>
          </div>
          
          <div className="qr-instructions">
            <h4>📋 Instrucciones:</h4>
            <ol>
              <li>Descarga o imprime este código QR</li>
              <li>Pégalo en el carnet del trabajador</li>
              <li>El trabajador debe escanearlo al entrar y salir</li>
              <li>El sistema registrará automáticamente su asistencia</li>
            </ol>
          </div>
        </div>
        
        <div className="qr-modal-footer">
          <button onClick={handleDownloadQR} className="btn-download">
            ⬇️ Descargar QR
          </button>
          <button onClick={handlePrintQR} className="btn-print">
            🖨️ Imprimir
          </button>
          <button onClick={onClose} className="btn-close">
            ✅ Continuar
          </button>
        </div>
      </div>
    </div>
  );
};

export default WorkerQRModal;