import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';
import useAuth from './hooks/useAuth';

import Navbar from './components/Navbar';
import LoginPage from './pages/LoginPage';
import RegistroChatPage from './views/TransactionView'; 
import UserManagementPage from './pages/UserManagementPage';
import QRGeneratorPage from './pages/QRGeneratorPage'; 
import AttendancePage from './pages/AttendancePage';
import InventoryPage from './pages/InventoryPage';
import SmartInventoryChat from './pages/SmartInventoryChat';
import PagosPage from './pages/PagosPage';

function App() {
  const { isAuthenticated, user } = useAuth();
  // Estado para controlar qué botón brilla en el Navbar
  const [activeTab, setActiveTab] = useState('registro');

  return (
    <Router>
      {/* ✅ AHORA SÍ PASAMOS LAS PROPS QUE EL NAVBAR PIDE */}
      {isAuthenticated && (
        <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
      )}
      
      <Routes>
        {/* Redirección inicial inteligente */}
        <Route 
          path="/" 
          element={<Navigate to={isAuthenticated ? "/registro" : "/login"} replace />} 
        />
        
        <Route 
          path="/login" 
          element={!isAuthenticated ? <LoginPage /> : <Navigate to="/registro" replace />} 
        />
        
        {/* Rutas de Almacén y Chat */}
        <Route path="/registro" element={<RegistroChatPage />} />
        <Route path="/scanner" element={<QRGeneratorPage />} />
        <Route path="/inventario" element={<InventoryPage />} />

        {/* Rutas de Gestión */}
        <Route path="/trabajadores" element={<UserManagementPage />} />
        <Route path="/qr-generator" element={<QRGeneratorPage />} />
        
        {/* ✅ OJO: Tu ruta se llama /asistencia en el Navbar, asegúrate que coincida aquí */}
        <Route path="/asistencia" element={<AttendancePage />} />

         <Route path="/pagos" element={<PagosPage />} />

        {/* Si la ruta no existe, vuelve al login */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}
export default App;