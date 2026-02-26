import React, { useState, useEffect, useRef } from 'react';
import useAuth from '../hooks/useAuth';
import { useNavigate, useLocation } from 'react-router-dom';

const ShipLogo = () => (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
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
    const location = useLocation();
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const cambiarVista = (tab, ruta) => {
        setActiveTab(tab);
        navigate(ruta);
        setShowDropdown(false);
    };

    // --- CONFIGURACIÓN DE ÍTEMS DE NAVEGACIÓN ---
    
    // 1. Ítems que ven absolutamente TODOS
    const commonItems = [
        { 
            id: 'asistencia', 
            path: '/asistencia', 
            icon: '🕒', 
            label: (isAdmin || isSuperAdmin) ? 'Asistencia' : 'Mi Agenda' // Nombre amigable para el trabajador
        },
        { id: 'mis-pagos', path: '/mis-pagos', icon: '💰', label: 'Mis Pagos' },
        { id: 'mis-prestamos', path: '/mis-prestamos', icon: '💸', label: 'Mis Préstamos' },
    ];

    // 2. Ítems exclusivos para Administración
    const adminItems = [
        { id: 'registro', path: '/registro', icon: '💬', label: 'Chat' },
        { id: 'inventario', path: '/inventario', icon: '📦', label: 'Stock' },
        { id: 'trabajadores', path: '/trabajadores', icon: '👥', label: 'Trabajadores' }
    ];

    // 3. Combinar según rol: Los admins ven las herramientas de gestión al principio
    const navItems = (isAdmin || isSuperAdmin) 
        ? [...adminItems, ...commonItems] 
        : [...commonItems];

    return (
        <>
            <style>{`
                .nav-container {
                    background: rgba(8, 12, 14, 0.95);
                    backdrop-filter: blur(20px);
                    position: sticky; top: 0; z-index: 2000;
                    width: 100%; border-bottom: 1px solid rgba(0, 255, 163, 0.15);
                    display: flex; justify-content: space-between; align-items: center;
                    padding: 0 40px; height: 80px; box-sizing: border-box;
                }

                .nav-center { display: flex; gap: 5px; background: rgba(255, 255, 255, 0.03); padding: 5px; border-radius: 50px; overflow-x: auto; max-width: 70%; }
                .nav-center::-webkit-scrollbar { display: none; }

                .nav-link {
                    background: transparent; border: none; color: #8696a0;
                    padding: 10px 16px; border-radius: 40px; cursor: pointer;
                    display: flex; align-items: center; gap: 8px; font-weight: 600;
                    transition: 0.3s; font-size: 0.85rem; white-space: nowrap;
                }

                .nav-link.active { color: #00ffa3; background: rgba(0, 255, 163, 0.1); }

                .profile-box { 
                    display: flex; align-items: center; gap: 12px; cursor: pointer;
                    padding: 5px 15px; border-radius: 50px; border: 1px solid transparent; transition: 0.3s;
                }
                .profile-box:hover { background: rgba(0, 255, 163, 0.05); border-color: #00ffa3; }

                .dropdown-menu {
                    position: absolute; top: 85px; right: 40px; width: 220px;
                    background: #121a1e; border-radius: 15px; border: 1px solid #00ffa333;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.5); overflow: hidden;
                }

                .drop-item {
                    width: 100%; padding: 12px 20px; border: none; background: transparent;
                    color: #fff; text-align: left; cursor: pointer; transition: 0.2s; display: flex; align-items: center; gap: 10px;
                }
                .drop-item:hover { background: rgba(0, 255, 163, 0.1); color: #00ffa3; }

                @media (max-width: 1024px) {
                    .btn-text { display: none; }
                    .nav-link { padding: 10px; }
                }

                @media (max-width: 768px) {
                    .nav-container { padding: 0 15px; height: 70px; }
                    .brand-text, .user-info-text { display: none; }
                    
                    .nav-center {
                        position: fixed; bottom: 0; left: 0; transform: none;
                        width: 100%; justify-content: space-around; padding: 10px 5px;
                        background: #0b141a; border-top: 1px solid #00ffa333;
                        border-radius: 0; max-width: 100%; z-index: 2001;
                        padding-bottom: env(safe-area-inset-bottom);
                    }
                    .nav-link { flex-direction: column; gap: 2px; font-size: 0.7rem; }
                    .nav-link span { font-size: 1.2rem; }
                    .dropdown-menu { right: 15px; top: 65px; }
                }
            `}</style>

            <nav className="nav-container">
                {/* LADO IZQUIERDO: LOGO */}
                <div style={{display:'flex', alignItems:'center', gap:'10px', cursor:'pointer'}} onClick={() => navigate('/')}>
                    <ShipLogo />
                    <b className="brand-text" style={{letterSpacing:'2px', color:'#fff', fontSize: '1.2rem'}}>SIG</b>
                </div>

                {/* CENTRO: NAVEGACIÓN DINÁMICA */}
                <div className="nav-center">
                    {navItems.map(item => (
                        <button 
                            key={item.id} 
                            onClick={() => cambiarVista(item.id, item.path)} 
                            className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
                        >
                            <span>{item.icon}</span>
                            <span className="btn-text">{item.label}</span>
                        </button>
                    ))}
                </div>

                {/* LADO DERECHO: PERFIL Y DROPDOWN */}
                <div style={{position:'relative'}} ref={dropdownRef}>
                    <div className="profile-box" onClick={() => setShowDropdown(!showDropdown)}>
                        <div className="user-info-text" style={{textAlign:'right'}}>
                            <div style={{fontSize:'12px', fontWeight:'bold', color:'#fff'}}>{user?.name}</div>
                            <div style={{fontSize:'9px', color:'#00ffa3', fontWeight:'800'}}>{user?.role?.toUpperCase()}</div>
                        </div>
                        <div style={{width:'38px', height:'38px', borderRadius:'50%', background:'#1c282f', display:'flex', alignItems:'center', justifyContent:'center', border:'2px solid #00ffa355', fontSize: '1.2rem'}}>
                            👤
                        </div>
                    </div>

                    {showDropdown && (
                        <div className="dropdown-menu">
                            <div style={{padding: '12px 20px', borderBottom: '1px solid #ffffff10', fontSize: '11px', color: '#8696a0'}}>
                                OPCIONES
                            </div>
                            <button className="drop-item" onClick={() => cambiarVista('mi-qr', '/mi-qr')}>🆔 Mi Perfil QR</button>
                            
                            {(isAdmin || isSuperAdmin) && (
                                <>
                                    <div style={{padding: '12px 20px', borderBottom: '1px solid #ffffff10', borderTop: '1px solid #ffffff10', fontSize: '11px', color: '#8696a0', marginTop: '5px'}}>
                                        ADMINISTRACIÓN
                                    </div>
                                    <button className="drop-item" onClick={() => cambiarVista('qr-gen', '/qr-generator')}>🖨️ Generar QRs</button>
                                </>
                            )}
                            
                            <div style={{borderTop: '1px solid #ffffff10', marginTop: '5px'}}>
                                <button className="drop-item" style={{color:'#ff4d4d'}} onClick={() => { logout(); navigate('/login'); }}>🚪 Salir del Sistema</button>
                            </div>
                        </div>
                    )}
                </div>
            </nav>
        </>
    );
};

export default Navbar;