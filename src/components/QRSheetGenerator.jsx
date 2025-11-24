import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react'; // ← Cambiado a importación nombrada

const QRSheetGenerator = () => {
  const [baseCode, setBaseCode] = useState('HERRAMIENTA');
  const [startNumber, setStartNumber] = useState(1);
  const [quantity, setQuantity] = useState(20);
  const [generatedCodes, setGeneratedCodes] = useState([]);

  const generateSheet = () => {
    const codes = [];
    for (let i = startNumber; i < startNumber + quantity; i++) {
      codes.push(`${baseCode}_${i.toString().padStart(3, '0')}`);
    }
    setGeneratedCodes(codes);
  };

  const downloadSheet = () => {
    window.print();
  };

  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h2>📄 Generador de Hoja A4 con Múltiples QR</h2>
      
      {/* Controles */}
      <div style={{ 
        background: '#f8f9fa', 
        padding: '20px', 
        borderRadius: '10px',
        margin: '20px 0',
        display: 'inline-block'
      }}>
        <div style={{ margin: '10px 0' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Prefijo del código:
          </label>
          <input
            type="text"
            value={baseCode}
            onChange={(e) => setBaseCode(e.target.value.toUpperCase())}
            style={{
              padding: '8px',
              fontSize: '16px',
              border: '2px solid #3498db',
              borderRadius: '5px',
              textAlign: 'center'
            }}
          />
        </div>

        <div style={{ margin: '10px 0' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Número inicial:
          </label>
          <input
            type="number"
            value={startNumber}
            onChange={(e) => setStartNumber(parseInt(e.target.value))}
            style={{
              padding: '8px',
              fontSize: '16px',
              border: '2px solid #3498db',
              borderRadius: '5px',
              textAlign: 'center',
              width: '100px'
            }}
          />
        </div>

        <div style={{ margin: '10px 0' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Cantidad de QR (máx 24 por hoja):
          </label>
          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(Math.min(24, parseInt(e.target.value)))}
            min="1"
            max="24"
            style={{
              padding: '8px',
              fontSize: '16px',
              border: '2px solid #3498db',
              borderRadius: '5px',
              textAlign: 'center',
              width: '100px'
            }}
          />
        </div>

        <button 
          onClick={generateSheet}
          style={{
            padding: '12px 24px',
            backgroundColor: '#3498db',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '16px',
            margin: '10px'
          }}
        >
          🖨️ Generar Hoja A4
        </button>
      </div>

      {/* Hoja A4 para imprimir */}
      {generatedCodes.length > 0 && (
        <div>
          <button 
            onClick={downloadSheet}
            style={{
              padding: '12px 24px',
              backgroundColor: '#27ae60',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '16px',
              margin: '20px'
            }}
          >
            🖨️ Imprimir Hoja A4
          </button>

          {/* Esta parte se ve solo al imprimir */}
          <div className="a4-sheet" style={{
            width: '210mm',
            minHeight: '297mm',
            margin: '0 auto',
            padding: '10mm',
            backgroundColor: 'white',
            boxShadow: '0 0 10px rgba(0,0,0,0.1)',
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gridTemplateRows: 'repeat(5, 1fr)',
            pageBreakAfter: 'always'
          }}>
            {generatedCodes.map((code, index) => (
              <div key={index} style={{
                textAlign: 'center',
                width: '120px',
                padding: '5mm',
                border: '1px dashed #ccc',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <QRCodeSVG 
                  value={code}
                  size={80}
                  level="H"
                  includeMargin={false}
                />
                <div style={{
                  marginTop: '2mm',
                  fontSize: '10px',
                  fontWeight: 'bold',
                  wordBreak: 'break-all'
                }}>
                  {code}
                </div>
              </div>
            ))}
          </div>

          {/* Vista previa en pantalla */}
          <div style={{ 
            background: '#e8f4fc', 
            padding: '15px', 
            borderRadius: '8px',
            margin: '20px 0',
            textAlign: 'left'
          }}>
            <h4>📋 Códigos generados ({generatedCodes.length}):</h4>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
              gap: '10px',
              marginTop: '10px'
            }}>
              {generatedCodes.map((code, index) => (
                <div key={index} style={{
                  padding: '8px',
                  background: 'white',
                  border: '1px solid #ddd',
                  borderRadius: '5px',
                  fontSize: '12px',
                  textAlign: 'center'
                }}>
                  {code}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Estilos para impresión */}
      <style>
        {`
          @media print {
            body * {
              visibility: hidden;
            }
            .a4-sheet, .a4-sheet * {
              visibility: visible;
            }
            .a4-sheet {
              position: absolute;
              left: 0;
              top: 0;
              width: 210mm;
              min-height: 297mm;
              box-shadow: none;
            }
            button {
              display: none !important;
            }
          }

          @page {
            size: A4;
            margin: 0;
          }
        `}
      </style>
    </div>
  );
};

export default QRSheetGenerator;