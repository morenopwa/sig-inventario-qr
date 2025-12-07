import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import './QRGenerator.css';

const QRGenerator = () => {
  const [qrConfig, setQrConfig] = useState({
    type: 'equipment',
    baseName: '',
    startNumber: 1,
    quantity: 1
  });
  const [generatedQRs, setGeneratedQRs] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const QR_PER_PAGE = 24;
  const QR_SIZE = 80;

  const generateSimpleCode = (baseName, number, type) => {
    const prefix = type === 'equipment' ? 'EQ' : 'WK';
    const baseCode = baseName.slice(0, 3).toUpperCase();
    return `${prefix}${baseCode}${number}`;
  };

  const generateMultipleQRs = () => {
    if (!qrConfig.baseName.trim()) {
      alert('Por favor ingresa un nombre base');
      return;
    }

    if (qrConfig.quantity < 1 || qrConfig.quantity > 200) {
      alert('La cantidad debe estar entre 1 y 200');
      return;
    }

    setIsGenerating(true);
    
    // Pequeño delay para que se vea el loading
    setTimeout(() => {
      const newQRs = [];

      for (let i = 0; i < qrConfig.quantity; i++) {
        const currentNumber = qrConfig.startNumber + i;
        const qrData = generateSimpleCode(qrConfig.baseName, currentNumber, qrConfig.type);

        newQRs.push({
          id: `${Date.now()}_${i}`,
          data: qrData,
          name: `${qrConfig.baseName} ${currentNumber}`,
          displayName: `${qrConfig.baseName} ${currentNumber}`,
          type: qrConfig.type,
          number: currentNumber
        });
      }

      setGeneratedQRs(newQRs);
      setIsGenerating(false);
    }, 500);
  };

  const downloadPage = (pageNumber) => {
    const startIndex = (pageNumber - 1) * QR_PER_PAGE;
    const endIndex = startIndex + QR_PER_PAGE;
    const pageQRs = generatedQRs.slice(startIndex, endIndex);

    const printWindow = window.open('', '_blank');
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR Codes - Página ${pageNumber}</title>
          <style>
            @page { margin: 10mm; }
            body { 
              margin: 0; 
              padding: 5mm; 
              font-family: Arial, sans-serif;
              background: white;
              font-size: 10px;
            }
            .a4-page {
              width: 210mm;
              min-height: 297mm;
              margin: 0 auto;
            }
            .qr-grid {
              display: grid;
              grid-template-columns: repeat(6, 1fr);
              grid-template-rows: repeat(4, 1fr);
              gap: 5mm;
              width: 100%;
              height: 287mm;
            }
            .qr-item {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              border: 0.5px dashed #999;
              padding: 2mm;
              page-break-inside: avoid;
              background: white;
              text-align: center;
            }
            .qr-name {
              font-size: 9px;
              font-weight: bold;
              margin: 1mm 0;
              color: #000;
            }
            .qr-data {
              font-size: 8px;
              color: #333;
              font-family: 'Courier New', monospace;
              font-weight: bold;
              margin: 1mm 0;
            }
            .instruction {
              font-size: 6px;
              color: #666;
              margin-top: 1mm;
            }
            .cut-line {
              border-top: 0.5px dashed #666;
              width: 90%;
              margin: 1mm auto;
            }
            @media print {
              body { margin: 0; padding: 5mm; }
            }
          </style>
        </head>
        <body>
          <div class="a4-page">
            <div style="text-align: center; margin-bottom: 10mm;">
              <h2 style="margin: 0; font-size: 14px;">CÓDIGOS QR - PÁGINA ${pageNumber}</h2>
              <p style="margin: 2mm 0; font-size: 8px;">Use estos códigos para generar QR con cualquier aplicación</p>
            </div>
            <div class="qr-grid">
              ${pageQRs.map(qr => `
                <div class="qr-item">
                  <div class="qr-name">${qr.displayName}</div>
                  <div class="cut-line"></div>
                  <div class="qr-data">${qr.data}</div>
                  <div class="cut-line"></div>
                  <div class="instruction">Código para generar QR</div>
                </div>
              `).join('')}
            </div>
          </div>
        </body>
      </html>
    `);
    
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  const downloadAllPages = () => {
    const totalPages = Math.ceil(generatedQRs.length / QR_PER_PAGE);
    for (let i = 1; i <= totalPages; i++) {
      setTimeout(() => {
        downloadPage(i);
      }, i * 1000);
    }
  };

  const handleInputChange = (field, value) => {
    setQrConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const resetGenerator = () => {
    setGeneratedQRs([]);
    setQrConfig({
      type: 'equipment',
      baseName: '',
      startNumber: 1,
      quantity: 1
    });
  };

  const totalPages = Math.ceil(generatedQRs.length / QR_PER_PAGE);

  return (
    <div className="qr-generator-container">
      <h2>🔄 Generador Masivo de Códigos QR</h2>
      
      <div className="generator-form">
        <div className="form-row">
          <div className="form-group">
            <label>Tipo de QR:</label>
            <select 
              value={qrConfig.type} 
              onChange={(e) => handleInputChange('type', e.target.value)}
              className="qr-type-select"
            >
              <option value="equipment">🏷️ Para Equipos</option>
              <option value="worker">👤 Para Trabajadores</option>
            </select>
          </div>

          <div className="form-group">
            <label>Nombre Base:</label>
            <input
              type="text"
              value={qrConfig.baseName}
              onChange={(e) => handleInputChange('baseName', e.target.value)}
              placeholder={
                qrConfig.type === 'equipment' 
                  ? 'Ej: Laptop, Soldadora...' 
                  : 'Ej: Operario, Técnico...'
              }
              className="qr-input"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Número Inicial:</label>
            <input
              type="number"
              min="1"
              max="1000"
              value={qrConfig.startNumber}
              onChange={(e) => handleInputChange('startNumber', parseInt(e.target.value) || 1)}
              className="number-input"
            />
          </div>

          <div className="form-group">
            <label>Cantidad a Generar:</label>
            <div className="quantity-info">
              <input
                type="number"
                min="1"
                max="200"
                value={qrConfig.quantity}
                onChange={(e) => handleInputChange('quantity', parseInt(e.target.value) || 1)}
                className="number-input"
              />
              <span className="pages-info">
                {Math.ceil(qrConfig.quantity / QR_PER_PAGE)} página(s) A4
              </span>
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button 
            onClick={generateMultipleQRs} 
            disabled={isGenerating}
            className="btn-generate"
          >
            {isGenerating ? '⏳ Generando...' : '🎨 Generar Códigos'}
          </button>
        </div>
      </div>

      {generatedQRs.length > 0 && (
        <div className="qr-results-section">
          <div className="results-header">
            <div>
              <h3>✅ {generatedQRs.length} Códigos Generados</h3>
              <p className="pages-summary">
                {totalPages} página(s) A4 listas para imprimir
              </p>
            </div>
            <div className="print-actions">
              <button onClick={downloadAllPages} className="btn-download-all">
                🖨️ Imprimir Todas las Páginas
              </button>
              <button onClick={resetGenerator} className="btn-clear">
                🗑️ Generar Nuevos
              </button>
            </div>
          </div>

          {/* Vista previa */}
          {Array.from({ length: totalPages }, (_, pageIndex) => {
            const pageNumber = pageIndex + 1;
            const startIndex = pageIndex * QR_PER_PAGE;
            const endIndex = startIndex + QR_PER_PAGE;
            const pageQRs = generatedQRs.slice(startIndex, endIndex);

            return (
              <div key={pageNumber} className="page-preview">
                <div className="page-header">
                  <h4>📄 Página A4 #{pageNumber} ({pageQRs.length} códigos)</h4>
                  <button onClick={() => downloadPage(pageNumber)} className="btn-print-page">
                    🖨️ Imprimir Esta Página
                  </button>
                </div>
                
                <div className="a4-preview">
                  <div className="qr-grid-preview">
                    {pageQRs.map((qr) => (
                      <div key={qr.id} className="qr-preview-item">
                        <div className="preview-info">
                          <div className="preview-name">{qr.displayName}</div>
                          <div className="preview-data">{qr.data}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}

          <div className="usage-instructions">
            <h4>📝 ¿Cómo usar?</h4>
            <ol>
              <li><strong>Imprime las páginas</strong> con los códigos</li>
              <li><strong>Usa cualquier app de QR</strong> (QR Code Generator, etc.) para generar los QR físicos</li>
              <li><strong>Pega los QR</strong> en equipos o carnets</li>
              <li><strong>Escanea normalmente</strong> con esta aplicación</li>
            </ol>
          </div>
        </div>
      )}
    </div>
  );
};

export default QRGenerator;