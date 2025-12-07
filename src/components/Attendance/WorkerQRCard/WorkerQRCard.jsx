import React from 'react';
import './WorkerQRCard.css';

const WorkerQRCard = ({ worker, onPrint, onDownload }) => {
  if (!worker.qrImage) return null;

  const downloadQR = () => {
    const link = document.createElement('a');
    link.href = worker.qrImage;
    link.download = `QR-${worker.name.replace(/\s+/g, '_')}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const printQR = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR de ${worker.name}</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              text-align: center; 
              padding: 20px;
            }
            .qr-card { 
              margin: 20px auto; 
              max-width: 300px;
              border: 1px solid #ccc;
              padding: 20px;
              border-radius: 10px;
            }
            .qr-title { 
              font-weight: bold; 
              margin-bottom: 10px;
              font-size: 18px;
            }
            .qr-info { 
              margin-top: 10px; 
              font-size: 14px;
            }
            @media print {
              body { padding: 0; }
              .qr-card { break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          <div class="qr-card">
            <div class="qr-title">${worker.name}</div>
            <img src="${worker.qrImage}" alt="QR Code" style="width: 200px; height: 200px;">
            <div class="qr-info">
              <p><strong>Cargo:</strong> ${worker.position}</p>
              <p><strong>Departamento:</strong> ${worker.department}</p>
              <p><strong>Código:</strong> ${worker.qrCode}</p>
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="worker-qr-card">
      <div className="qr-header">
        <h4>QR de {worker.name}</h4>
      </div>
      <div className="qr-image-container">
        <img src={worker.qrImage} alt={`QR de ${worker.name}`} className="qr-image" />
      </div>
      <div className="qr-info">
        <p><strong>Código:</strong> {worker.qrCode}</p>
        <p><strong>Cargo:</strong> {worker.position}</p>
      </div>
      <div className="qr-actions">
        <button onClick={downloadQR} className="btn-download">
          ⬇️ Descargar QR
        </button>
        <button onClick={printQR} className="btn-print">
          🖨️ Imprimir
        </button>
      </div>
    </div>
  );
};

export default WorkerQRCard;