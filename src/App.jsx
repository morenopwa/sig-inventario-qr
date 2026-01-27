import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';
import useAuth from './hooks/useAuth';

// Componentes
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

// Páginas
import LoginPage from './pages/LoginPage';
import ChatPage from './pages/ChatPage';
import InventoryPage from './pages/InventoryPage'; 
import UserManagementPage from './pages/UserManagementPage';
import QRGeneratorPage from './pages/QRGeneratorPage'; 
import AttendancePage from './pages/AttendancePage';
import PagosPage from './pages/PagosPage';
import AdminPayrollPage from './components/AdminPayrollPage'; 

function App() {
  // 1. Extraemos 'loading' del hook
  const { isAuthenticated, isSuperAdmin, isAdmin, loading } = useAuth();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [activeTab, setActiveTab] = useState('registro');

  // 2. Si el sistema está leyendo el localStorage, no renderizamos nada aún
  // Esto evita que el router te mande al login por error un milisegundo
  if (loading) {
    return (
      <div style={{ height: '100vh', backgroundColor: '#0b141a', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#00a884' }}>
        Cargando sistema...
      </div>
    );
  }

  const refreshInventory = () => setRefreshTrigger(prev => prev + 1);

  return (
    <Router>
      {isAuthenticated && (
        <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
      )}
      
      <Routes>
        <Route 
          path="/" 
          element={isAuthenticated ? <Navigate to="/registro" replace /> : <Navigate to="/login" replace />} 
        />
        
        <Route 
          path="/login" 
          element={!isAuthenticated ? <LoginPage /> : <Navigate to="/registro" replace />} 
        />
        
        <Route element={<ProtectedRoute isAllowed={isAuthenticated} redirectTo="/login" />}>
          <Route path="/registro" element={<ChatPage onRefreshInventory={refreshInventory} />} />
          <Route path="/inventario" element={<InventoryPage key={refreshTrigger} />} />
          <Route path="/asistencia" element={<AttendancePage />} />
          <Route path="/pagos" element={<PagosPage />} />
        </Route>

        <Route 
          element={
            <ProtectedRoute 
              isAllowed={isAuthenticated && (isAdmin || isSuperAdmin)} 
              redirectTo="/registro" 
            />
          }
        >
          <Route path="/trabajadores" element={<UserManagementPage />} />
          <Route path="/qr-generator" element={<QRGeneratorPage />} />
          <Route path="/planilla" element={<AdminPayrollPage />} />
        </Route>

        <Route path="*" element={<Navigate to={isAuthenticated ? "/registro" : "/login"} replace />} />
      </Routes>
    </Router>
  );
}

export default App;