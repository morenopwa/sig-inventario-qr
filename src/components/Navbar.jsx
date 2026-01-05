import React from 'react';
import useAuth from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

const Navbar = ({ activeTab, setActiveTab }) => {
    const { user, isAdmin, isSuperAdmin, logout } = useAuth();
    const navigate = useNavigate();
    const tienePermisosAdmin = isAdmin || isSuperAdmin;

    const cambiarVista = (tab, ruta) => {
        setActiveTab(tab);
        navigate(ruta);
    };

    const handleAuthAction = () => {
        if (user) { 
            logout(); 
            navigate('/login'); 
        } else { 
            navigate('/login'); 
        }
    };

    return (
        <nav style={n.nav}>
            <div style={n.scrollContainer} className="no-scrollbar">
                {user && (
                    <>
                        {/* 1. Chat Registro (TransactionView / ChatPage) */}
                        <button 
                            onClick={() => cambiarVista('registro', '/registro')} 
                            style={activeTab === 'registro' ? n.activeBtn : n.btn}
                        >💬 Chat Registro</button>

                        {/* 2. Stock Actual (InventoryPage) */}
                        <button 
                            onClick={() => cambiarVista('inventario', '/inventario')} 
                            style={activeTab === 'inventario' ? n.activeBtn : n.btn}
                        >📦 Stock Actual</button>

                        {/* 3. Pagos */}
                        <button 
                            onClick={() => cambiarVista('pagos', '/pagos')} 
                            style={activeTab === 'pagos' ? n.activeBtn : n.btn}
                        >💰 Pagos</button>

                        {/* 4. Asistencia */}
                        <button 
                            onClick={() => cambiarVista('asistencia', '/asistencia')} 
                            style={activeTab === 'asistencia' ? n.activeBtn : n.btn}
                        >🕒 Asistencia</button>
                    </>
                )}

                {tienePermisosAdmin && (
                    <>
                        <button 
                            onClick={() => cambiarVista('usuarios', '/trabajadores')} 
                            style={activeTab === 'usuarios' ? n.activeBtn : n.btn}
                        >👥 Personal</button>
                        <button 
                            onClick={() => cambiarVista('qr-gen', '/qr-generator')} 
                            style={activeTab === 'qr-gen' ? n.activeBtn : n.btn}
                        >📄 Generar QRs</button>
                    </>
                )}
            </div>

            <div style={n.userInfo}>
                <span style={n.userName}>
                    <strong>{user?.name}</strong> 
                </span>
                <div style={n.onlineDot}></div>
                <button onClick={handleAuthAction} style={user ? n.logoutBtn : n.loginBtn}>
                    {user ? `Salir 🚪` : 'Login 🔑'}
                </button>
            </div>
        </nav>
    );
};

const n = {
    nav: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#202c33', padding: '5px 15px', borderBottom: '1px solid #2a3942', position: 'sticky', top: 0, zIndex: 1000 },
    scrollContainer: { display: 'flex', gap: '5px', overflowX: 'auto', flex: 1 },
    userInfo: { display: 'flex', alignItems: 'center', gap: '8px', paddingLeft:'8px' },
    onlineDot: { width: '8px', height: '8px', backgroundColor: '#00a884', borderRadius: '50%' },
    userName: { color: '#e9edef', fontSize: '13px', whiteSpace: 'nowrap' },
    btn: { 
        backgroundColor: 'transparent', 
        border: 'none', 
        color: '#8696a0', 
        padding: '12px 12px', 
        cursor: 'pointer', 
        whiteSpace: 'nowrap', 
        fontSize: '13px' 
    },
    activeBtn: { 
        backgroundColor: 'transparent', 
        borderTop: 'none',
        borderLeft: 'none',
        borderRight: 'none',
        borderBottom: '3px solid #00a884', 
        color: '#00a884', 
        padding: '12px 12px', 
        cursor: 'pointer', 
        whiteSpace: 'nowrap', 
        fontSize: '13px', 
        fontWeight: 'bold' 
    },
    logoutBtn: { backgroundColor: 'transparent', border: '1px solid #ff4d4d', color: '#ff4d4d', padding: '5px 12px', borderRadius: '15px', cursor: 'pointer', fontSize: '11px', whiteSpace: 'nowrap' },
    loginBtn: { backgroundColor: '#00a884', border: 'none', color: 'white', padding: '5px 15px', borderRadius: '15px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }
};

export default Navbar;