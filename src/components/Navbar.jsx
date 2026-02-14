import React, { useState, useEffect, useRef } from 'react';
import useAuth from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

// 1. DEFINIMOS EL LOGO FUERA PARA EVITAR ERRORES DE REFERENCIA
const ShipLogo = () => (
    <svg width="45" height="45" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="shipGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00ffa3" />
                <stop offset="100%" stopColor="#00a884" />
            </linearGradient>
        </defs>
        <path d="M2 17L3 19H21L22 17V15H2V17Z" fill="url(#shipGrad)"/>
        <path d="M5 15L6 9H11V15H5Z" fill="white" fillOpacity="0.7"/>
        <path d="M12 15V11H15V15H12Z" fill="white" fillOpacity="0.9"/>
        <path d="M1 21C5 22.5 8 20.5 12 21C16 21.5 19 22.5 23 21" stroke="#00ffa3" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
);

const Navbar = ({ activeTab, setActiveTab }) => {
    const { user, isAdmin, isSuperAdmin, logout } = useAuth();
    const navigate = useNavigate();
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef(null);

    // ... (useEffect del click outside se mantiene igual)

    const cambiarVista = (tab, ruta) => {
        setActiveTab(tab);
        navigate(ruta);
        setShowDropdown(false);
    };

    // Ítems base para administradores
    const adminItems = [
        { id: 'registro', path: '/registro', icon: '💬', label: 'Registro' },
        { id: 'inventario', path: '/inventario', icon: '📦', label: 'Inventario' },
        { id: 'asistencia', path: '/asistencia', icon: '🕒', label: 'Asistencia' },
        { id: 'usuarios', path: '/trabajadores', icon: '👥', label: 'Trabajadores' }
    ];

    // Ítems para trabajadores
    const workerItems = [
        { id: 'mis-pagos', path: '/mis-pagos', icon: '💰', label: 'Mis Pagos' },
        { id: 'mis-prestamos', path: '/mis-prestamos', icon: '🛠️', label: 'Préstamos' },
        { id: 'mi-qr', path: '/mi-qr', icon: '📱', label: 'Mi QR' }
    ];

    // LÓGICA DE NAVEGACIÓN ACTUALIZADA:
    // Si es Admin, le mostramos sus herramientas de gestión + sus pagos personales
    const navItems = (isAdmin || isSuperAdmin) 
        ? [{ id: 'mis-pagos', path: '/mis-pagos', icon: '💰', label: 'Mis Pagos' }, ...adminItems] 
        : workerItems;

    return (
        <>
            <style>{`
                .nav-futuristic {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    background: rgba(8, 12, 14, 0.95);
                    backdrop-filter: blur(20px);
                    -webkit-backdrop-filter: blur(20px);
                    padding: 0 40px;
                    height: 85px;
                    position: sticky; 
                    top: 0; 
                    z-index: 2000;
                    width: 100%;
                    border-bottom: 1px solid rgba(0, 255, 163, 0.15);
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
                    box-sizing: border-box;
                }

                .brand-container {
                    display: flex;
                    align-items: center;
                    gap: 15px;
                    cursor: pointer;
                }

                .brand-text {
                    font-size: 1rem;
                    font-weight: 700;
                    background: linear-gradient(90deg, #fff, #8696a0);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    letter-spacing: 2px;
                    text-transform: uppercase;
                }

                .nav-center {
                    display: flex;
                    background: rgba(255, 255, 255, 0.03);
                    padding: 6px;
                    border-radius: 50px;
                    border: 1px solid rgba(255, 255, 255, 0.05);
                }

                .nav-link {
                    background: transparent;
                    border: none;
                    color: #8696a0;
                    padding: 10px 22px;
                    border-radius: 40px;
                    cursor: pointer;
                    font-size: 0.9rem;
                    font-weight: 600;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .nav-link:hover { color: #00ffa3; }
                .nav-link.active {
                    color: #00ffa3;
                    background: rgba(0, 255, 163, 0.1);
                    box-shadow: 0 0 15px rgba(0, 255, 163, 0.2);
                }

                .profile-container {
                    display: flex;
                    align-items: center;
                    gap: 15px;
                    padding: 5px 5px 5px 20px;
                    background: rgba(255, 255, 255, 0.03);
                    border-radius: 50px;
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    cursor: pointer;
                    transition: 0.3s;
                }

                .profile-container:hover { border-color: #00ffa3; background: rgba(0, 255, 163, 0.05); }

                .avatar-placeholder {
                    width: 45px;
                    height: 45px;
                    border-radius: 50%;
                    background: linear-gradient(45deg, #1c282f, #2a3942);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border: 2px solid rgba(0, 255, 163, 0.3);
                    font-size: 1.2rem;
                }

                .dropdown-menu {
                    position: absolute;
                    top: 95px;
                    right: 40px;
                    background: rgba(18, 26, 30, 0.98);
                    backdrop-filter: blur(15px);
                    border-radius: 20px;
                    width: 250px;
                    border: 1px solid rgba(0, 255, 163, 0.2);
                    box-shadow: 0 10px 40px rgba(0,0,0,0.8);
                    overflow: hidden;
                    animation: openDown 0.3s ease-out;
                }

                @keyframes openDown {
                    from { opacity: 0; transform: translateY(-10px) scale(0.95); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }

                .drop-item {
                    width: 100%; padding: 15px 20px; border: none; background: transparent;
                    color: #e9edef; text-align: left; cursor: pointer; display: flex;
                    align-items: center; gap: 12px; font-size: 0.9rem; transition: 0.2s;
                }
                .drop-item:hover { background: rgba(0, 255, 163, 0.1); color: #00ffa3; }

                @media (max-width: 1024px) {
                    .nav-futuristic { padding: 0 20px; }
                    .btn-text, .brand-text { display: none; }
                }
            `}</style>
            
            <nav className="nav-futuristic">
                {/* IZQUIERDA: LOGO */}
                <div className="brand-container" onClick={() => navigate('/')}>
                    <ShipLogo />
                    <span className="brand-text">SIG</span>
                </div>
                
                {/* CENTRO: NAVEGACIÓN DINÁMICA */}
                <div className="nav-center">
                    {navItems.map(item => (
                        <button 
                            key={item.id}
                            onClick={() => cambiarVista(item.id, item.path)}
                            className={`nav-link ${activeTab === item.id ? 'active' : ''}`}
                        >
                            <span>{item.icon}</span>
                            <span className="btn-text">{item.label}</span>
                        </button>
                    ))}
                </div>

                {/* DERECHA: PERFIL */}
                <div style={{ position: 'relative' }} ref={dropdownRef}>
                    <div className="profile-container" onClick={() => setShowDropdown(!showDropdown)}>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ color: '#fff', fontSize: '13px', fontWeight: 'bold' }}>
                                {user?.lastName?.split(' ')[0] || 'Usuario'}
                            </div>
                            <div style={{ color: '#00ffa3', fontSize: '9px', fontWeight: '800', letterSpacing: '1px' }}>
                                {user?.role?.toUpperCase()}
                            </div>
                        </div>
                        <div className="avatar-placeholder">
                            <span style={{ filter: 'grayscale(1)' }}>👤</span>
                        </div>
                    </div>

                    {showDropdown && (
                        <div className="dropdown-menu">
                            <div style={{ padding: '20px', background: 'rgba(0, 255, 163, 0.03)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <div style={{ fontSize: '10px', color: '#8696a0', marginBottom: '4px' }}>CUENTA ACTIVA</div>
                                <div style={{ fontSize: '12px', color: '#fff', fontWeight: '500', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {user?.email}
                                </div>
                            </div>
                            
                            <div style={{ padding: '10px' }}>
                                {(isAdmin || isSuperAdmin) ? (
                                    <>
                                        <button className="drop-item" onClick={() => cambiarVista('pagos', '/pagos')}>
                                            💰 Gestión de Pagos
                                        </button>
                                        <button className="drop-item" onClick={() => cambiarVista('qr-gen', '/qr-generator')}>
                                            📄 Generador QR
                                        </button>
                                        <button className="drop-item" onClick={() => cambiarVista('planilla', '/planilla')}>
                                            📋 Planilla General
                                        </button>
                                    </>
                                ) : (
                                    <button className="drop-item" onClick={() => cambiarVista('perfil', '/mi-qr')}>
                                        👤 Mi Perfil Digital
                                    </button>
                                )}
                            </div>
                            
                            <button 
                                className="drop-item" 
                                style={{ color: '#ff5555', borderTop: '1px solid rgba(255,255,255,0.05)' }} 
                                onClick={() => { logout(); window.location.replace('/login'); }}
                            >
                                🚪 Cerrar Sesión
                            </button>
                        </div>
                    )}
                </div>
            </nav>
        </>
    );
};

export default Navbar;