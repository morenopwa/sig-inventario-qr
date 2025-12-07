// src/components/Inventory/Inventory.jsx
const Inventory = () => {
  return (
    <div className="inventory-page">
      <h1>📦 Inventario</h1>
      <p>Página de inventario en construcción...</p>
      <div style={{marginTop: '20px', padding: '20px', background: '#f5f5f5', borderRadius: '10px'}}>
        <h3>Funcionalidades próximas:</h3>
        <ul>
          <li>Listado de todos los activos con QR</li>
          <li>Búsqueda y filtrado por categorías</li>
          <li>Reportes de inventario</li>
          <li>Gestión de bajas y altas</li>
        </ul>
      </div>
    </div>
  );
};

export default Inventory;