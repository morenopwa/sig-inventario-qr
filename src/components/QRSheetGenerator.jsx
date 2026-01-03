import React from 'react';
import QRCode from 'react-qr-code'; // O la librería que estés usando

const QRSheetGenerator = ({ workers = [], singleWorker = null }) => {
  // Si pasamos un solo trabajador, lo convertimos en array para reusar el mapa
  const printData = singleWorker ? [singleWorker] : workers;

  const styles = {
    // Estilo para el contenedor que NO se imprime (vista previa en pantalla)
    previewContainer: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '20px',
      padding: '20px',
      backgroundColor: '#f0f2f5',
      justifyContent: 'center'
    },
    // EL CARNET: Medidas exactas 6cm x 9.2cm
    card: {
      width: '6cm',
      height: '9.2cm',
      backgroundColor: 'white',
      border: '1px solid #ddd',
      borderRadius: '8px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '10px',
      boxSizing: 'border-box',
      color: 'black',
      position: 'relative',
      pageBreakInside: 'avoid', // Evita que un carnet se corte entre dos páginas
      boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
    },
    header: {
      fontSize: '12px',
      fontWeight: 'bold',
      textAlign: 'center',
      textTransform: 'uppercase',
      borderBottom: '1px solid #00a884',
      width: '100%',
      paddingBottom: '5px',
      color: '#00a884'
    },
    qrContainer: {
      margin: 'auto 0'
    },
    footer: {
      textAlign: 'center',
      width: '100%'
    },
    workerName: {
      fontSize: '14px',
      fontWeight: 'bold',
      margin: '0'
    },
    workerRole: {
      fontSize: '10px',
      color: '#666',
      margin: '2px 0 0 0'
    }
  };

  return (
    <div>
      {/* Botón para disparar la impresión */}
      <div style={{ textAlign: 'center', padding: '10px', backgroundColor: '#202c33' }}>
        <button 
          onClick={() => window.print()}
          style={{
            backgroundColor: '#00a884',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '5px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          🖨️ IMPRIMIR CARNETS (6x9.2 cm)
        </button>
      </div>

      <div style={styles.previewContainer} className="print-area">
        {printData.map((worker) => (
          <div key={worker._id || worker.name} style={styles.card} className="id-card">
            <div style={styles.header}>
              Credencial de Acceso
            </div>
            
            <div style={styles.qrContainer}>
              <QRCode 
                value={worker.name} // El QR contiene el nombre para que el scanner lo lea
                size={150}
                level="H" 
              />
            </div>

            <div style={styles.footer}>
              <p style={styles.workerName}>{worker.name.toUpperCase()}</p>
              <p style={styles.workerRole}>PERSONAL AUTORIZADO</p>
            </div>
          </div>
        ))}
      </div>

      {/* ESTILOS CSS PARA IMPRESIÓN (CRUCIAL) */}
      <style>{`
        @media print {
          /* Ocultar todo lo que no sea el área de impresión (navbars, botones, etc) */
          body * { visibility: hidden; }
          .print-area, .print-area * { visibility: visible; }
          
          .print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            display: block !important;
            background-color: white !important;
          }

          /* Configuración de la hoja de papel */
          @page {
            size: A4;
            margin: 1cm;
          }

          .id-card {
            float: left;
            margin: 0.5cm; /* Espacio para el corte */
            box-shadow: none !important;
            border: 1px solid #000 !important; /* Borde negro fino para guía de corte */
          }
        }

        /* Estilo para que en pantalla se vea bien */
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
};

export default QRSheetGenerator;