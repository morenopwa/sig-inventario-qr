import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import useAuth from '../hooks/useAuth'; 
import * as QRCodeComponent from 'qrcode.react';

const apiUrl = import.meta.env.VITE_API_URL;

// Lista de roles permitidos
const ALLOWED_ROLES = [
    'Operario', 
    'Maestro', 
    'Almacenero', 
    'Maniobrista', 
    'Residente', 
    'Administrador',
    'Prevencionista',
    'SuperAdmin'
];

// ---------------------------------------------------
// 🔑 Componente Modal QR (para impresión individual)
// ---------------------------------------------------
const QRPrintModal = ({ isOpen, user, onClose }) => {
    if (!isOpen || !user) return null;

    const qrData = user.qrCode || `USER-${user._id}`; // Usamos qrCode si existe, si no, el ID

    const handlePrint = () => {
        const printContent = document.getElementById('qr-print-area');
        const originalContents = document.body.innerHTML;
        document.body.innerHTML = printContent.innerHTML;
        window.print();
        document.body.innerHTML = originalContents;
        window.location.reload(); // Recargar para restaurar la vista
    };

    return (
        <div className="modal-backdrop" onClick={(e) => e.target.className === 'modal-backdrop' && onClose()}>
            <div className="modal-content-centered print-modal">
                <div id="qr-print-area" className="print-area">
                    <div className="qr-card">
                        <h2>{user.name}</h2>
                        <p>Rol: {user.role}</p>
                        <QRCode value={qrData} size={256} level="H" />
                        <p className="qr-code-text">{qrData}</p>
                    </div>
                </div>
                
                <div className="modal-actions">
                    <button onClick={handlePrint} className="btn btn-print-qr">🖨️ Imprimir</button>
                    <button onClick={onClose} className="btn btn-secondary-modal">Cerrar</button>
                </div>
            </div>
        </div>
    );
};


// ---------------------------------------------------
// Componente principal de la página
// ---------------------------------------------------
const UserManagementPage = () => {
    const { user } = useAuth();
    const isSuperAdmin = user?.role === 'SuperAdmin'; 

    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
    const [isQRModalOpen, setIsQRModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    // Estados para el formulario
    const [newUserName, setNewUserName] = useState('');
    const [newPhone, setnewPhone] = useState('');
    const [newUserRole, setNewUserRole] = useState(ALLOWED_ROLES[0]);
    const [newUserEmail, setNewUserEmail] = useState('');
    const [newUserPassword, setNewUserPassword] = useState('');
    const [statusMessage, setStatusMessage] = useState('');


    const fetchUsers = useCallback(async () => {
        if (!isSuperAdmin) return;
        setLoading(true);
        try {
            const response = await axios.get(`${apiUrl}/api/workers`, {
                // Aquí deberías enviar el token de autorización
            });
            setUsers(response.data);
        } catch (error) {
            console.error('Error al obtener usuarios:', error);
        } finally {
            setLoading(false);
        }
    }, [isSuperAdmin]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers, refreshTrigger]);

    // --- Handlers ---

    const handleRegisterUser = async (e) => {
        e.preventDefault();
        setStatusMessage('Registrando usuario...');
        
        try {
            await axios.post(`${apiUrl}/api/workers/register`, {
                name: newUserName,
                phone: newPhone,
                email: newUserEmail,
                password: newUserPassword,
                role: newUserRole,
            });
            
            setStatusMessage(`✅ Usuario ${newUserName} registrado exitosamente.`);
            
            // Limpiar y cerrar
            setNewUserName('');
            setnewPhone('');
            setNewUserEmail('');
            setNewUserPassword('');
            setNewUserRole(ALLOWED_ROLES[0]);
            setIsRegisterModalOpen(false);
            setRefreshTrigger(prev => prev + 1);

        } catch (error) {
            const msg = error.response?.data?.message || error.message;
            setStatusMessage(`❌ Error: ${msg}`);
        }
    };
    
    // 🔑 Handler de Eliminación
    const handleDeleteUser = async (userToDelete) => {
        if (!window.confirm(`¿Seguro que quieres eliminar al usuario ${userToDelete.name}?`)) {
            return;
        }
        
        try {
            await axios.delete(`${apiUrl}/api/users/${userToDelete._id}`);
            setStatusMessage(`✅ Usuario ${userToDelete.name} eliminado.`);
            setRefreshTrigger(prev => prev + 1);
        } catch (error) {
            const msg = error.response?.data?.message || error.message;
            setStatusMessage(`❌ Error al eliminar: ${msg}`);
        }
    };
    
    // 🔑 Handler de Impresión Masiva
    const handlePrintAllQR = () => {
        if (users.length === 0) {
            alert("No hay usuarios registrados para imprimir.");
            return;
        }
        
        const printWindow = window.open('', '', 'height=600,width=800');
        printWindow.document.write('<html><head><title>Impresión de QR Masiva</title>');
        // Estilos básicos para la impresión
        printWindow.document.write(`
            <style>
                body { font-family: sans-serif; display: flex; flex-wrap: wrap; gap: 20px; padding: 20px; }
                .qr-card { border: 1px solid #ccc; padding: 15px; text-align: center; width: 150px; page-break-inside: avoid; }
                .qr-code-text { font-size: 0.7em; margin-top: 5px; word-break: break-all; }
                h2 { font-size: 1em; margin-bottom: 5px; }
                p { font-size: 0.8em; margin: 0; }
            </style>`);
        printWindow.document.write('</head><body>');
        
        users.forEach(user => {
            const qrData = user.qrCode || `USER-${user._id}`;
            const qrSVG = new QRCode.toString(qrData, { type: 'svg', level: 'H' }); // Generar SVG
            
            printWindow.document.write(`
                <div class="qr-card">
                    <h2>${user.name}</h2>
                    <p>Rol: ${user.role}</p>
                    ${qrSVG}
                    <p class="qr-code-text">${qrData}</p>
                </div>
            `);
        });
        
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        printWindow.print();
    };

    if (!isSuperAdmin) {
        return (
            <div className="user-management-container">
                <h1>Gestión de Usuarios</h1>
                <p className="warning-text">🚫 Acceso Denegado. Esta página es solo para Super Administradores.</p>
            </div>
        );
    }
    
    return (
        <main className="user-management-container">
            <h1>Gestión de Usuarios 👥</h1>
            
            <div className="user-controls">
                <button 
                    onClick={() => setIsRegisterModalOpen(true)} 
                    className="btn btn-primary-user"
                >
                    ➕ Registrar Nuevo Usuario
                </button>
                {/* 🔑 Botón de Impresión Masiva */}
                <button 
                    onClick={handlePrintAllQR} 
                    className="btn btn-print-mass"
                    disabled={loading || users.length === 0}
                >
                    🖨️ Imprimir Todos los QRs (A4)
                </button>
            </div>
            
            {statusMessage && <div className="status-box status-info">{statusMessage}</div>}

            {loading ? (
                <p>Cargando lista de usuarios...</p>
            ) : (
                <div className="table-responsive-scroll">
                    <table className="user-table">
                        <thead>
                            <tr>
                                <th>Nombre</th>
                                <th>Email</th>
                                <th>Rol</th>
                                {/* 🔑 Nueva Columna QR */}
                                <th>QR Tarjeta</th> 
                                <th className="action-col">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(u => (
                                <tr key={u._id}>
                                    <td>{u.name}</td>
                                    <td>{u.email}</td>
                                    <td>{u.role}</td>
                                    
                                    {/* 🔑 Celda con QR Clickable */}
                                    <td>
                                        <button 
                                            onClick={() => {
                                                setSelectedUser(u);
                                                setIsQRModalOpen(true);
                                            }}
                                            className="btn btn-qr-preview"
                                        >
                                            [ Ver QR ]
                                        </button>
                                    </td>
                                    
                                    <td className="action-cell">
                                        {/* 🔑 Botón de Eliminación */}
                                        <button 
                                            onClick={() => handleDeleteUser(u)} 
                                            className="btn btn-delete-item"
                                            disabled={u._id === user._id} // Evitar auto-eliminación
                                        >
                                            ❌ Eliminar
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modal de Registro de Usuario */}
            {isRegisterModalOpen && (
                <div className="modal-backdrop" onClick={(e) => e.target.className === 'modal-backdrop' && setIsRegisterModalOpen(false)}>
                    <div className="modal-content-centered">
                        <h2 className="modal-title">Registrar Nuevo Usuario</h2>
                        <form onSubmit={handleRegisterUser} className="minimal-form">
                            <label>Nombre Completo:</label>
                            <input type="text" value={newUserName} onChange={(e) => setNewUserName(e.target.value)} required />
                            
                            <label>Telefono:</label>
                            <input type="telefono" value={newUserEmail} onChange={(e) => setNewUserEmail(e.target.value)} required />
                            
                            <label>Email (será el usuario de login):</label>
                            <input type="email" value={newUserEmail} onChange={(e) => setNewUserEmail(e.target.value)} required />
                            
                            <label>Contraseña Temporal:</label>
                            <input type="password" value={newUserPassword} onChange={(e) => setNewUserPassword(e.target.value)} required />
                            
                            {/* 🔑 Campo Rol con las opciones especificadas */}
                            <label>Rol:</label>
                            <select value={newUserRole} onChange={(e) => setNewUserRole(e.target.value)}>
                                {ALLOWED_ROLES.map(role => (
                                    <option key={role} value={role}>{role}</option>
                                ))}
                            </select>
                            
                            <button type="submit" className="btn btn-primary-modal">Registrar</button>
                            {statusMessage.includes('Error') && <p className="error-text">{statusMessage}</p>}
                        </form>
                    </div>
                </div>
            )}
            
            {/* Modal de Impresión Individual de QR */}
            <QRPrintModal 
                isOpen={isQRModalOpen}
                user={selectedUser}
                onClose={() => setIsQRModalOpen(false)}
            />
        </main>
    );
};

export default UserManagementPage;