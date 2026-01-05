import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';
import useAuth from './hooks/useAuth';

// Componentes
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

// Páginas (Asegúrate de que los nombres de archivo coincidan)
import LoginPage from './pages/LoginPage';
import ChatPage from './pages/ChatPage'; // Tu chat (antes TransactionView)
import InventoryPage from './pages/InventoryPage'; 
import UserManagementPage from './pages/UserManagementPage';
import QRGeneratorPage from './pages/QRGeneratorPage'; 
import AttendancePage from './pages/AttendancePage';
import PagosPage from './pages/PagosPage';

function App() {
  const { isAuthenticated } = useAuth();
  
  // Estado para refrescar el inventario cuando el chat registra algo
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const refreshInventory = () => setRefreshTrigger(prev => prev + 1);

  // Estado para el botón activo en el Navbar
  const [activeTab, setActiveTab] = useState('registro');

  return (
    <Router>
      {/* El Navbar solo aparece si el usuario está logueado */}
      {isAuthenticated && (
        <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
      )}
      
      <Routes>
        {/* Redirección inicial */}
        <Route 
          path="/" 
          element={<Navigate to={isAuthenticated ? "/registro" : "/login"} replace />} 
        />
        
        <Route 
          path="/login" 
          element={!isAuthenticated ? <LoginPage /> : <Navigate to="/registro" replace />} 
        />
        
        {/* RUTAS PROTEGIDAS */}
        <Route element={<ProtectedRoute isAllowed={isAuthenticated} />}>
          
          {/* Registro Rápido (CHAT) */}
          <Route 
            path="/registro" 
            element={<ChatPage onRefreshInventory={refreshInventory} />} 
          />
          
          {/* Gestión de Stock y Préstamos (INVENTARIO) */}
          <Route 
            path="/inventario" 
            element={<InventoryPage key={refreshTrigger} />} 
          />

          {/* Gestión de Personal */}
          <Route path="/trabajadores" element={<UserManagementPage />} />
          <Route path="/qr-generator" element={<QRGeneratorPage />} />
          
          {/* Asistencia y Pagos */}
          <Route path="/asistencia" element={<AttendancePage />} />
          <Route path="/pagos" element={<PagosPage />} />
          
        </Route>

        {/* Si escriben cualquier otra cosa, al login */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;