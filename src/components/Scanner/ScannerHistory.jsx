// src/components/Scanner/ScannerHistory.jsx
const ScannerHistory = ({ history, clearHistory }) => {
  if (history.length === 0) {
    return (
      <div className="scanner-history">
        <div className="history-header">
          <h3>Historial de Escaneos</h3>
          <p>No hay escaneos registrados</p>
        </div>
      </div>
    );
  }

  return (
    <div className="scanner-history">
      <div className="history-header">
        <h3>📋 Historial de Escaneos</h3>
        <div className="history-actions">
          <span className="history-count">{history.length} registros</span>
          <button 
            className="btn-small btn-danger"
            onClick={clearHistory}
          >
            🗑️ Limpiar Historial
          </button>
        </div>
      </div>

      <div className="history-table">
        <table>
          <thead>
            <tr>
              <th>Hora</th>
              <th>Código QR</th>
              <th>Producto</th>
              <th>Ubicación</th>
              <th>Usuario</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            {history.map((scan) => (
              <tr key={scan.id}>
                <td className="timestamp">{scan.timestamp}</td>
                <td className="qr-code">
                  <span className="code-badge">{scan.qrCode}</span>
                </td>
                <td>{scan.productName}</td>
                <td>
                  <span className="location-badge">{scan.location}</span>
                </td>
                <td>{scan.user}</td>
                <td>
                  <span className={`action-badge ${scan.action.toLowerCase()}`}>
                    {scan.action}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ScannerHistory;