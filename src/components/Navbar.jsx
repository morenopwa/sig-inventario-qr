import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';

// Componente Navbar recibe la información del usuario y la función de cierre de sesión
const Navbar = ({ user, onLogout }) => {
    const navigate = useNavigate();

    const handleLogout = () => {
        // Ejecuta la función de cierre de sesión pasada desde useAuth/App.jsx
        if (onLogout) {
            onLogout();
        }
        // Redirige al login después de cerrar sesión
        navigate('/login');
    };
    
    // Función para verificar si el usuario tiene rol de Almacenero o SuperAdmin
    const isAdmin = user && (user.role === 'Almacenero' || user.role === 'SuperAdmin');
    const isSuperAdmin = user && user.role === 'SuperAdmin';

    return (
        <header className="navbar-header">
            <nav className="navbar-container">
                <div className="navbar-logo">
                    {/* Puedes cambiar esto por un logo o el nombre de tu sistema */}
                    <NavLink to="/inventory">SIG-Inventario</NavLink>
                </div>

                <div className="navbar-links">
                    

                    {/* 2. Transacciones (Préstamo/Devolución) - Accesible para Admin/Almacenero */}
                    {isAdmin && (
                        <NavLink 
                        to="/transactions" 
                        className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
                        >
                            🔄 Transacciones
                        </NavLink>
                    )}
                    
                    {/* 1. Inventario (Vista de Stock) - Accesible para Admin/Almacenero */}
                    {isAdmin && (
                        <NavLink 
                            to="/inventory" 
                            className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
                        >
                            📦 Inventario (Stock)
                        </NavLink>
                    )}
                    
                    {/* 3. Asistencia (Accesible para todos) */}
                    <NavLink 
                        to="/attendance" 
                        className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
                    >
                        ⏱️ Asistencia
                    </NavLink>
                    
                    {/* 4. Generador QR (Solo Administradores) */}
                    {isAdmin && (
                        <NavLink 
                            to="/generate-qr" 
                            className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
                        >
                            🏷️ Generar QR
                        </NavLink>
                    )}

                    {/* 5. Gestión de Usuarios (Solo SuperAdmin) */}
                    {isSuperAdmin && (
                        <NavLink 
                            to="/users" 
                            className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
                        >
                            👥 Usuarios
                        </NavLink>
                    )}
                </div>

                <div className="navbar-user-info">
                    <span className="user-name">Hola, {user.name} ({user.role})</span>
                    <button onClick={handleLogout} className="btn-logout">
                        Salir
                    </button>
                </div>
            </nav>
        </header>
    );
};

export default Navbar;