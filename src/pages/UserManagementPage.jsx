import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import useAuth from '../hooks/useAuth'; 
import qrcodeLib from 'qrcode'; 

const apiUrl = import.meta.env.VITE_API_URL;

const ALLOWED_ROLES = [
    'Maestro calderero', 'Soldador', 'Almacenero', 'Calderero', 
    'Maniobrista', 'Residente', 'Prevencionista', 'Gestion'
];
const ACCESO_NIVELES = ['Usuario', 'Admin', 'SuperAdmin'];
const TIPOS_USUARIO = ['Trabajador', 'Externo', 'Visita'];

// Estilos comunes para el diseño del Fotocheck (Reutilizado en individual y masivo)
const FOTOCHECK_STYLES = `
    @media print {
        @page { size: A4; margin: 1cm; }
        body { background: white; }
        .no-print { display: none; }
    }
    body { font-family: 'Segoe UI', sans-serif; }
    .card-container { 
        display: flex; 
        flex-wrap: wrap; 
        gap: 10px; 
        justify-content: flex-start; 
    }
    .card { 
        width: 5.5cm; 
        height: 8.5cm; 
        position: relative; 
        overflow: hidden; 
        border: 0.5px solid #ccc; 
        box-sizing: border-box; 
        page-break-inside: avoid; 
        margin: 5px; 
        background: white;
        display: inline-block;
        vertical-align: top;
    }
    .header { background: #00a884 !important; -webkit-print-color-adjust: exact; height: 1.5cm; display: flex; align-items: center; justify-content: center; color: white; flex-direction: column; }
    .logo-txt { font-weight: bold; font-size: 14px; letter-spacing: 1px; }
    .subheader { font-size: 8px; opacity: 0.9; }
    .content { padding: 8px; text-align: center; }
    .name { font-size: 13px; font-weight: 800; color: #111; margin-top: 5px; text-transform: uppercase; line-height: 1.1; height: 30px; display: flex; align-items: center; justify-content: center; }
    .dni-txt { font-size: 10px; color: #555; margin-bottom: 3px; }
    .qr-container { margin: 0 auto; width: 3.5cm; height: 3.5cm; }
    .qr-container svg { width: 100%; height: 100%; }
    .footer-role { 
        position: absolute; 
        bottom: 0; 
        width: 100%; 
        background: #f4f4f4 !important; 
        -webkit-print-color-adjust: exact;
        padding: 5px 0; 
        border-top: 2px solid #00a884; 
        font-size: 10px; 
        font-weight: bold; 
        color: #333; 
        text-transform: uppercase; 
        text-align: center; 
    }
`;

// ---------------------------------------------------
// 🪪 Componente Modal QR Individual
// ---------------------------------------------------
function QRPrintModal({ isOpen, user, onClose }) {
    const [qrSvg, setQrSvg] = useState('');

    useEffect(() => {
        if (!isOpen || !user) return;
        qrcodeLib.toString(user._id, { type: 'svg', level: 'H', margin: 1 })
            .then(setQrSvg)
            .catch(err => console.error('Error QR:', err));
    }, [isOpen, user]);

    if (!isOpen || !user) return null;

    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html><head><style>${FOTOCHECK_STYLES}</style></head>
            <body>
                <div class="card">
                    <div class="header">
                        <div class="logo-txt">S.I. GONZALES</div>
                        <div class="subheader">IDENTIFICACIÓN DE PERSONAL</div>
                    </div>
                    <div class="content">
                        <div class="name">${user.name}<br>${user.lastName}</div>
                        <div class="dni-txt">DNI: ${user.dni}</div>
                        <div class="qr-container">${qrSvg}</div>
                    </div>
                    <div class="footer-role">${user.rol || user.tipo}</div>
                </div>
            </body></html>
        `);
        printWindow.document.close();
        setTimeout(() => { printWindow.print(); printWindow.close(); }, 500);
    };

    return (
        <div style={st.backdrop} onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div style={st.qrPreviewCard}>
                <div style={{background: '#00a884', padding: '10px', color: 'white'}}>S.I. GONZALES</div>
                <div style={{padding: '20px'}}>
                    <div dangerouslySetInnerHTML={{ __html: qrSvg }} style={{width: '140px', margin: '0 auto'}} />
                    <p style={{color: '#000', fontWeight: 'bold', margin: '10px 0'}}>{user.name} {user.lastName}</p>
                    <span style={st.badge}>{user.rol || user.tipo}</span>
                    <div style={st.modalButtons}>
                        <button onClick={handlePrint} style={st.btnPrimary}>🖨️ Imprimir</button>
                        <button onClick={onClose} style={st.btnSecondary}>Cerrar</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ---------------------------------------------------
// 👥 Componente Principal
// ---------------------------------------------------
const UserManagementPage = () => {
    const { user: currentUser } = useAuth();
    const isSuperAdmin = currentUser?.nivelAcceso === 'SuperAdmin'; 
    
    const [users, setUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [selectedId, setSelectedId] = useState(null);
    const [isQRModalOpen, setIsQRModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [isWorker, setIsWorker] = useState(true);

    const [formData, setFormData] = useState({
        name: '', lastName: '', dni: '', phone: '', mail: '', rol: '', nivelAcceso: 'Usuario', tipo: 'Trabajador'
    });

    const fetchUsers = useCallback(async () => {
        try {
            const response = await axios.get(`${apiUrl}/api/users`);
            setUsers(response.data);
        } catch (error) { console.error('Error al cargar'); }
    }, []);

    useEffect(() => { fetchUsers(); }, [fetchUsers]);

    const filteredUsers = users.filter(u => 
        (u.name + " " + u.lastName).toLowerCase().includes(searchTerm.toLowerCase()) || 
        u.dni?.includes(searchTerm)
    );

    // 🖨️ FUNCIÓN DE IMPRESIÓN MASIVA CORREGIDA
    const handlePrintAllQR = async () => {
    const workers = users.filter(u => u.tipo === 'Trabajador');
    if (workers.length === 0) return alert("No hay trabajadores.");

    const printWindow = window.open('', '_blank');
    let html = `
        <html>
        <head>
            <style>${FOTOCHECK_STYLES}</style>
        </head>
        <body>
            <div class="card-container">`; // Contenedor flex para agrupar varios

    for (const u of workers) {
        const svg = await qrcodeLib.toString(u.dni, { type: 'svg', margin: 1 });
        html += `
            <div class="card">
                <div class="header">
                    <div class="logo-txt">S.I. GONZALES</div>
                    <div class="subheader">IDENTIFICACIÓN DE PERSONAL</div>
                </div>
                <div class="content">
                    <div class="name">${u.name}<br>${u.lastName}</div>
                    <div class="dni-txt">DNI: ${u.dni}</div>
                    <div class="qr-container">${svg}</div>
                </div>
                <div class="footer-role">${u.rol || 'TRABAJADOR'}</div>
            </div>`;
    }

    html += `
            </div>
        </body>
        </html>`;
        
    printWindow.document.write(html);
    printWindow.document.close();
    
    // Esperamos a que cargue todo antes de imprimir
    printWindow.onload = () => {
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 500);
    };
};

    const handleDelete = async (id, name) => {
        if(window.confirm(`¿Eliminar a ${name}?`)) {
            try {
                await axios.delete(`${apiUrl}/api/users/${id}`);
                fetchUsers();
            } catch (error) { alert("Error"); }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const data = {
                 ...formData, 
                 tipo: isWorker ? 'Trabajador' : formData.tipo, 
                 password: formData.dni.trim() };
            if (isEditMode) {
                await axios.put(`${apiUrl}/api/users/${selectedId}`, data);
                alert("Usuario actualizado con éxito");
            } else {
                await axios.post(`${apiUrl}/api/users`, data);
            }
            closeModal(); 
            fetchUsers();
        } catch (error) {
    console.error("Error completo:", error); // Esto te dirá si es 404, 500 o Network Error
    if (error.response) {
        // El servidor respondió con algo (400, 401, 500, etc.)
        console.log("Data del error:", error.response.data);
        alert(error.response.data.message || "Error del servidor");
    } else if (error.request) {
        // La petición se hizo pero no hubo respuesta (Error de red/Backend apagado)
        alert("No se pudo conectar con el servidor. Revisa tu conexión.");
    } else {
        alert("Error: " + error.message);
    }
}
    };

    const handleEdit = (u) => {
       setFormData({ 
        name: u.name, 
        lastName: u.lastName, 
        dni: u.dni, 
        phone: u.phone || '', 
        mail: u.mail || '', 
        rol: u.rol || '', 
        tipo: u.tipo || 'Trabajador' 
        });
        setSelectedId(u._id); 
        setIsWorker(u.tipo === 'Trabajador');
        setIsEditMode(true); 
        setIsRegisterModalOpen(true);
    };

    const closeModal = () => {
        setIsRegisterModalOpen(false); setIsEditMode(false);
        setFormData({ name: '', lastName: '', dni: '', phone: '', mail: '', rol: '', nivelAcceso: 'Usuario', tipo: 'Trabajador' });
    };

    if (!isSuperAdmin) return <div style={st.denied}>🚫 Acceso Denegado</div>;

    return (
        <main style={st.container}>
            <header  className="inventory-controls-bar" style={st.header}>
                <h1 style={st.title}>Gestión Personal 👥</h1>
                <div style={st.actions}>
                    <input placeholder="Buscar..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} style={st.searchInput}/>
                    <button onClick={() => setIsRegisterModalOpen(true)} style={st.btnPrimary}>➕</button>
                    <button onClick={handlePrintAllQR} style={st.btnSecondary} title="Imprimir todos los trabajadores">🖨️ Masivo</button>
                </div>
            </header>

            <div style={st.tableWrapper}>
                <table style={st.table}>
                    <thead>
                        <tr style={st.thr}>
                            <th style={st.th}>Apellidos y Nombres</th>
                            <th style={st.th}>DNI</th>
                            <th style={st.th}>Rol / Tipo</th>
                            <th style={st.th}>Fecha Inicio</th>
                            <th style={st.th}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUsers.map(u => (
                            <tr key={u._id} style={st.tr}>
                                <td style={st.td}>{u.lastName}, {u.name}</td>
                                <td style={st.td}>{u.dni}</td>
                                <td style={st.td}><span style={st.badge}>{u.rol || u.tipo}</span></td>
                                <td style={st.td}>{new Date(u.createdAt).toLocaleDateString()}</td>
                                <td style={st.tdActions}>
                                    <button onClick={() => handleEdit(u)} style={st.btnEdit}>✏️</button>
                                    <button onClick={() => { setSelectedUser(u); setIsQRModalOpen(true); }} style={st.btnIcon}>💳</button>
                                    <button onClick={() => handleDelete(u._id, u.name)} style={st.btnDelete}>🗑️</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {isRegisterModalOpen && (
                <div style={st.backdrop} onClick={(e) => e.target === e.currentTarget && closeModal()}>
                    <div style={st.modalForm}>
                        <h2 style={{color:'#00a884', marginTop: 0}}>{isEditMode ? 'Editar' : 'Nuevo'}</h2>
                        <form onSubmit={handleSubmit} style={st.formGrid}>
                            <input placeholder="Nombres" value={formData.name} required onChange={e=>setFormData({...formData, name: e.target.value})} style={st.input}/>
                            <input placeholder="Apellidos" value={formData.lastName} required onChange={e=>setFormData({...formData, lastName: e.target.value})} style={st.input}/>
                            <input placeholder="DNI" value={formData.dni} required onChange={e=>setFormData({...formData, dni: e.target.value})} style={st.input}/>
                            <label style={{color: '#8696a0', fontSize:'13px'}}><input type="checkbox" checked={isWorker} onChange={e=>setIsWorker(e.target.checked)}/> ¿Trabajador de Obra?</label>
                            {isWorker ? (
                                <select style={st.input} value={formData.rol} required onChange={e=>setFormData({...formData, rol: e.target.value})}>
                                    <option value="">Seleccionar Rol...</option>
                                    {ALLOWED_ROLES.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            ) : (
                                <select style={st.input} value={formData.tipo} onChange={e=>setFormData({...formData, tipo: e.target.value})}>
                                    <option value="Externo">Externo</option>
                                    <option value="Visita">Visita</option>
                                </select>
                            )}
                            <div style={st.modalButtons}>
                                <button type="submit" style={st.btnPrimary}>Guardar</button>
                                <button type="button" onClick={closeModal} style={st.btnSecondary}>Cerrar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            <QRPrintModal isOpen={isQRModalOpen} user={selectedUser} onClose={() => setIsQRModalOpen(false)} />
        </main>
    );
};

const st = {
    container: { padding: '20px', backgroundColor: '#0b141a', minHeight: '100vh', color: 'white' },
    header: { display: 1, justifyContent: 'space-between', marginBottom: '20px', gap: '10px', overflowY: 'auto'  },
    title: { color: '#00a884', fontSize: '1.5rem' },
    actions: { display: 'flex', gap: '10px' },
    searchInput: { backgroundColor: '#2a3942', border: 'none', padding: '10px', borderRadius: '8px', color: 'white',    flex: '1 1 0%' },
    tableWrapper: { backgroundColor: '#111b21', borderRadius: '12px', overflowX: 'auto' },
    table: { width: '100%', borderCollapse: 'collapse', minWidth: '800px' },
    th: { padding: '15px', color: '#8696a0', textAlign: 'left', borderBottom: '1px solid #2a3942' },
    td: { padding: '15px', color: '#e9edef' },
    tdActions: { display: 'flex', gap: '8px', padding: '15px' },
    badge: { backgroundColor: '#00a88422', color: '#00a884', padding: '4px 8px', borderRadius: '6px', fontSize: '11px' },
    btnPrimary: { backgroundColor: '#00a884', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer' },
    btnSecondary: { backgroundColor: '#3b4a54', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer' },
    btnEdit: { backgroundColor: '#2a3942', border: 'none', padding: '8px', borderRadius: '6px', cursor: 'pointer' },
    btnDelete: { backgroundColor: '#442222', border: 'none', padding: '8px', borderRadius: '6px', cursor: 'pointer', color: '#ff5555' },
    btnIcon: { backgroundColor: 'transparent', color: '#00a884', border: '1px solid #00a884', padding: '8px', borderRadius: '6px', cursor: 'pointer' },
    backdrop: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
    modalForm: { backgroundColor: '#202c33', padding: '25px', borderRadius: '15px', width: '350px' },
    qrPreviewCard: { backgroundColor: 'white', borderRadius: '15px', textAlign: 'center', overflow: 'hidden', width: '280px' },
    formGrid: { display: 'flex', flexDirection: 'column', gap: '12px' },
    input: { backgroundColor: '#2a3942', border: 'none', padding: '12px', borderRadius: '8px', color: 'white' },
    modalButtons: { display: 'flex', gap: '10px', marginTop: '10px', justifyContent: 'center' },
    denied: { color: 'white', textAlign: 'center', padding: '100px' }
};

export default UserManagementPage;