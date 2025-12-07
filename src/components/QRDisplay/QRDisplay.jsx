// src/components/QRDisplay/QRDisplay.jsx
import React, { useState } from 'react';
import QRCode from 'qrcode';
import './QRDisplay.css';

const QRDisplay = ({ worker }) => {
  const [qrUrl, setQrUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const generateQR = async () => {
    setLoading(true);
    try {
      const qrData = {
        id: worker.id,
        name: worker.name,
        type: 'worker',
        company: 'Empresa Industrial',
        timestamp: new Date().toISOString()
      };
      
      const url = await QRCode.toDataURL(JSON.stringify(qrData), {
        width: 400,
        margin: 2,
        color: { dark: '#1a237e', light: '#ffffff' }
      });
      
      setQrUrl(url);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadQR = () => {
    if (!qrUrl) return;
    
    const link = document.createElement('a');
    link.href = qrUrl;
    link.download = `QR_${worker.name.replace(/\s+/g, '_')}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const printQR = () => {
    if (!qrUrl) return;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>QR de ${worker.name}</title>
          <style>
            body { font-family: Arial; text-align: center; padding: 20px; }
            img { max-width: 300px; margin: 20px; border: 2px solid #333; }
            .info { margin: 20px 0; }
          </style>
        </head>
        <body>
          <h2>${worker.name}</h2>
          <div class="info">
            <p><strong>Código:</strong> ${worker.id}</p>
            <p><strong>Fecha:</strong> ${new Date().toLocaleDateString()}</p>
          </div>
          <img src="${qrUrl}" alt="QR Code" />
          <p>Escanea este código para registrar asistencia</p>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="qr-display">
      <div className="qr-header">
        <h4>QR para {worker.name}</h4>
        <p>ID: {worker.id}</p>
      </div>
      
      {!qrUrl ? (
        <button 
          onClick={generateQR}
          disabled={loading}
          className="btn-generate-qr"
        >
          {loading ? '⏳ Generando...' : '🎯 Generar QR'}
        </button>
      ) : (
        <div className="qr-content">
          <div className="qr-image-container">
            <img src={qrUrl} alt={`QR de ${worker.name}`} />
            <div className="qr-overlay">
              <div className="qr-corner tl"></div>
              <div className="qr-corner tr"></div>
              <div className="qr-corner bl"></div>
              <div className="qr-corner br"></div>
            </div>
          </div>
          
          <div className="qr-actions">
            <button onClick={downloadQR} className="btn-download">
              ⬇️ Descargar QR
            </button>
            <button onClick={printQR} className="btn-print">
              🖨️ Imprimir
            </button>
            <button onClick={() => setQrUrl('')} className="btn-regenerate">
            🔄 Regenerar
            </button>
          </div>
          
          <div className="qr-info">
            <p><strong>Contenido del QR:</strong></p>
            <code>{JSON.stringify({
              id: worker.id,
              name: worker.name,
              type: 'worker'
            }, null, 2)}</code>
          </div>
        </div>
      )}
    </div>
  );
};

export default QRDisplay;