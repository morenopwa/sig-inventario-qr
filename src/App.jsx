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

// ... tus otros imports
import UserPaymentsPage from './pages/UserPaymentsPage';
import UserLoansPage from './pages/UserLoansPage';
import UserQRPage from './pages/UserQRPage';

function App() {
  const { isAuthenticated, isSuperAdmin, isAdmin, loading } = useAuth();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [activeTab, setActiveTab] = useState('mis-pagos');

  if (loading) return <div className="loading-screen">Cargando sistema...</div>;

  return (
    <Router>
      {isAuthenticated && <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />}
      
      <Routes>
        {/* Lógica de Redirección Inicial */}
        <Route path="/" element={
          isAuthenticated 
            ? (isAdmin ? <Navigate to="/registro" /> : <Navigate to="/mis-pagos" />) 
            : <Navigate to="/login" />
        } />

        <Route path="/login" element={!isAuthenticated ? <LoginPage /> : <Navigate to="/" />} />

        {/* RUTAS PARA TODOS LOS LOGUEADOS */}
        <Route element={<ProtectedRoute isAllowed={isAuthenticated} redirectTo="/login" />}>
          <Route path="/mis-pagos" element={<UserPaymentsPage />} />
          <Route path="/mis-prestamos" element={<UserLoansPage />} />
          <Route path="/mi-qr" element={<UserQRPage />} />
          <Route path="/asistencia" element={<AttendancePage />} />

        </Route>

        {/* RUTAS SOLO PARA ADMINS */}
        <Route element={<ProtectedRoute isAllowed={isAuthenticated && (isAdmin || isSuperAdmin)} redirectTo="/mis-pagos" />}>
          <Route path="/registro" element={<ChatPage onRefreshInventory={() => setRefreshTrigger(t => t+1)} />} />
          <Route path="/inventario" element={<InventoryPage key={refreshTrigger} />} />
          <Route path="/pagos" element={<PagosPage />} />
          <Route path="/trabajadores" element={<UserManagementPage />} />
          <Route path="/qr-generator" element={<QRGeneratorPage />} />
          <Route path="/planilla" element={<AdminPayrollPage />} />
          
          {/* NUEVA RUTA: Permite al admin ver la planilla detallada de un trabajador por ID */}
          <Route path="/planilla/:id" element={<UserPaymentsPage />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;