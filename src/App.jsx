import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Se asumen estos hooks y contextos para manejar la autenticación
import useAuth from './hooks/useAuth'; 
// import AuthProvider from './context/AuthContext'; // Si se usa en main.jsx, no es necesario aquí

// Páginas y Vistas
import InventoryPage from './pages/InventoryPage';         // ⬅️ Antes QRScanner.jsx
import TransactionView from './views/TransactionView';     // Vista de Préstamos/Devoluciones
import LoginPage from './pages/LoginPage';
import AttendancePage from './pages/AttendancePage';
import QRGeneratorPage from './pages/QRGeneratorPage';
import UserManagementPage from './pages/UserManagementPage';

// Componentes UI (Asumiendo que tienes un Navbar)
import Navbar from './components/Navbar'; 

// -------------------------------------------------------------------
// Componente que requiere autenticación (Private Router)
// -------------------------------------------------------------------
const PrivateRoute = ({ element: Element, allowedRoles }) => {
    const { user, loading, logout } = useAuth();
    
    if (loading) {
        return <p style={{ textAlign: 'center', marginTop: '50px' }}>Cargando sesión...</p>;
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }
    
    // Si se especifican roles y el usuario no está en ellos, denegar
    if (allowedRoles && !allowedRoles.includes(user.role)) {
         // Si está logueado pero sin permiso, lo enviamos a una ruta accesible
         return <Navigate to="/inventory" replace />; 
    }

    return <Element />;
};

// -------------------------------------------------------------------
// Componente Wrapper para usar useAuth dentro de Router
// -------------------------------------------------------------------
function AppContent() {
    const { user, logout } = useAuth(); 
    
    // Definición de roles para control de acceso
    const ADMIN_ROLES = ['SuperAdmin', 'Almacenero'];

    return (
        <>
            {user && <Navbar user={user} onLogout={logout} />} 
            
            <div className="main-content"> 
                <Routes>
                    {/* 1. Rutas Públicas */}
                    <Route path="/login" element={<LoginPage />} />

                    {/* Redirigir la ruta raíz */}
                    <Route path="/" element={user ? <Navigate to="/transactions" replace /> : <Navigate to="/login" replace />} />
                    
                    {/* 2. Rutas Privadas */}

                    {/* Vista de Inventario (Stock y Registro de Items) */}
                    <Route 
                        path="/inventory" 
                        element={<PrivateRoute element={InventoryPage} allowedRoles={ADMIN_ROLES} />} 
                    />

                    {/* Vista de Transacciones (Préstamos y Devoluciones) */}
                    <Route 
                        path="/transactions" 
                        element={<PrivateRoute element={TransactionView} allowedRoles={ADMIN_ROLES} />} 
                    />
                    
                    {/* Otras Rutas */}
                    <Route 
                        path="/attendance" 
                        element={<PrivateRoute element={AttendancePage} />} 
                    />
                    <Route 
                        path="/generate-qr" 
                        element={<PrivateRoute element={QRGeneratorPage} allowedRoles={ADMIN_ROLES} />} 
                    />
                    <Route 
                        path="/users" 
                        element={<PrivateRoute element={UserManagementPage} allowedRoles={['SuperAdmin']} />} 
                    />

                    {/* 3. Redirección de fallback */}
                    <Route path="*" element={<Navigate to={user ? "/inventory" : "/login"} replace />} />
                </Routes>
            </div>
        </>
    );
}

// -------------------------------------------------------------------
// App Componente Principal
// -------------------------------------------------------------------
function App() {
    return (
        // Se asume que el AuthProvider envuelve todo en main.jsx
        <Router>
            <AppContent />
        </Router>
    );
}

export default App;