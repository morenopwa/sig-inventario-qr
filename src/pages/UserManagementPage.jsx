import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import useAuth from '../hooks/useAuth'; 
import qrcodeLib from 'qrcode'; 

const apiUrl = import.meta.env.VITE_API_URL;

const ALLOWED_ROLES = [
    'Maestro calderero', 'Soldador', 'Almacenero', 'Calderero', 
    'Maniobrista', 'Residente', 'Prevencionista', 'Gestion'
];

// Estilos del Fotocheck para impresión
const FOTOCHECK_STYLES = `
    @media print {
        @page { size: A4; margin: 1cm; }
        .no-print { display: none; }
    }
    body { font-family: 'Segoe UI', sans-serif; margin: 0; }
    .card-container { display: flex; flex-wrap: wrap; gap: 15px; }
    .card { 
        width: 5.5cm; height: 8.5cm; 
        border: 0.5px solid #ccc; 
        position: relative; 
        background: white; 
        page-break-inside: avoid;
        display: inline-block;
        vertical-align: top;
        margin-bottom: 10px;
    }
    .header { background: #00a884 !important; color: white; height: 1.5cm; text-align: center; padding-top: 5px; -webkit-print-color-adjust: exact; }
    .logo-txt { font-weight: bold; font-size: 14px; }
    .subheader { font-size: 8px; }
    .content { padding: 10px; text-align: center; }
    .name { font-size: 12px; font-weight: bold; height: 35px; margin-bottom: 5px; text-transform: uppercase; display: flex; align-items: center; justify-content: center; color: #000; }
    .qr-container { width: 3.5cm; height: 3.5cm; margin: 0 auto; }
    .qr-container svg { width: 100% !important; height: 100% !important; }
    .footer-role { 
        position: absolute; bottom: 0; width: 100%; 
        background: #f4f4f4 !important; border-top: 2px solid #00a884;
        padding: 5px 0; font-weight: bold; text-align: center; font-size: 12px; color: #333;
        -webkit-print-color-adjust: exact;
    }
`;

// ---------------------------------------------------
// 🪪 Componente Modal QR Individual
// ---------------------------------------------------
function QRPrintModal({ isOpen, user, onClose }) {
    const [qrSvg, setQrSvg] = useState('');

    useEffect(() => {
        if (isOpen && user) {
            qrcodeLib.toString(user.customId || user.dni, { 
                type: 'svg', 
                level: 'H', 
                margin: 1 
            })
            .then(setQrSvg)
            .catch(err => console.error('Error generando QR:', err));
        }
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
                        <div class="qr-container">${qrSvg}</div>
                        <div style="font-size: 10px; color: #666; margin-top: 5px;">DNI: ${user.dni}</div>
                    </div>
                    <div class="footer-role">${user.role || user.type}</div>
                </div>
            </body></html>
        `);
        printWindow.document.close();
        setTimeout(() => { printWindow.print(); printWindow.close(); }, 500);
    };

    return (
        <div style={st.backdrop} onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div style={st.qrPreviewCard}>
                <div style={{background: '#00a884', padding: '10px', color: 'white', fontWeight: 'bold'}}>VISTA PREVIA</div>
                <div style={{padding: '20px', backgroundColor: 'white'}}>
                    <div 
                        dangerouslySetInnerHTML={{ __html: qrSvg }} 
                        style={{width: '180px', height: '180px', margin: '0 auto'}} 
                    />
                    <p style={{color: '#333', fontWeight: 'bold', margin: '15px 0 5px 0'}}>{user.name} {user.lastName}</p>
                    <div style={st.badge}>{user.role || user.type}</div>
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
    const { isAdmin, isSuperAdmin } = useAuth();
    const tienePermisoEscritura = isAdmin || isSuperAdmin; 
    
    const [users, setUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [selectedId, setSelectedId] = useState(null);
    const [isQRModalOpen, setIsQRModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [isWorker, setIsWorker] = useState(true);
    const [selectedUserIds, setSelectedUserIds] = useState([]);

    // Formulario con el campo 'additionalDaily' (Cena/Almuerzo/Pasaje)
    const [formData, setFormData] = useState({
        name: '', lastName: '', dni: '', phone: '', mail: '', role: '', 
        accessLevel: 'Usuario', type: 'Trabajador', additionalDaily: 0
    });

    const fetchUsers = useCallback(async () => {
        try {
            const response = await axios.get(`${apiUrl}/api/users`);
            setUsers(response.data);
        } catch (error) { console.error('Error al cargar usuarios'); }
    }, []);

    useEffect(() => { 
        if (tienePermisoEscritura) fetchUsers(); 
    }, [fetchUsers, tienePermisoEscritura]);

    const filteredUsers = users.filter(u => 
        (u.name + " " + u.lastName).toLowerCase().includes(searchTerm.toLowerCase()) || 
        u.dni?.includes(searchTerm)
    );

    const toggleSelectUser = (id) => {
        setSelectedUserIds(prev => 
            prev.includes(id) ? prev.filter(uid => uid !== id) : [...prev, id]
        );
    };

    const toggleSelectAll = () => {
        if (selectedUserIds.length === filteredUsers.length && filteredUsers.length > 0) {
            setSelectedUserIds([]);
        } else {
            setSelectedUserIds(filteredUsers.map(u => u._id));
        }
    };

    const handlePrintSelectedQR = async () => {
        const usersToPrint = users.filter(u => selectedUserIds.includes(u._id));
        if (usersToPrint.length === 0) return alert("Por favor, selecciona al menos un usuario de la lista.");

        const printWindow = window.open('', '_blank');
        let html = `<html><head><style>${FOTOCHECK_STYLES}</style></head><body><div class="card-container">`;

        for (const u of usersToPrint) {
            const svg = await qrcodeLib.toString(u.customId || u.dni, { type: 'svg', margin: 1 });
            html += `
                <div class="card">
                    <div class="header">
                        <div class="logo-txt">S.I. GONZALES</div>
                        <div class="subheader">IDENTIFICACIÓN DE PERSONAL</div>
                    </div>
                    <div class="content">
                        <div class="name">${u.name}<br>${u.lastName}</div>
                        <div class="qr-container">${svg}</div>
                        <div style="font-size: 9px; color: #666;">DNI: ${u.dni}</div>
                    </div>
                    <div class="footer-role">${u.role || u.type || 'TRABAJADOR'}</div>
                </div>`;
        }

        html += `</div></body></html>`;
        printWindow.document.write(html);
        printWindow.document.close();
        
        printWindow.onload = () => {
            setTimeout(() => {
                printWindow.print();
                printWindow.close();
            }, 600);
        };
    };

    const handleDelete = async (id, name) => {
        if(window.confirm(`¿Eliminar a ${name}?`)) {
            try {
                await axios.delete(`${apiUrl}/api/users/${id}`);
                fetchUsers();
            } catch (error) { alert("Error al eliminar"); }
        }
    };

    const updateRate = async (userId, currentName) => {
        const newRate = window.prompt(`Nueva tarifa por hora para ${currentName}:`);
        if (newRate !== null && newRate.trim() !== "" && !isNaN(newRate)) {
            try {
                await axios.patch(`${apiUrl}/api/users/${userId}/rate`, { 
                    hourlyRate: parseFloat(newRate) 
                });
                alert("✅ Tarifa actualizada");
                fetchUsers();
            } catch (error) { alert("❌ Error al actualizar tarifa"); }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const primerApellido = formData.lastName.trim().split(' ')[0].toLowerCase();
            const data = {
                ...formData, 
                username: primerApellido, 
                type: isWorker ? 'Trabajador' : formData.type, 
                password: isEditMode ? undefined : formData.dni.trim(),
                additionalDaily: parseFloat(formData.additionalDaily) || 0
            };

            if (isEditMode) {
                await axios.put(`${apiUrl}/api/users/${selectedId}`, data);
                alert(`✅ Actualizado. Usuario login: ${primerApellido}`);
            } else {
                await axios.post(`${apiUrl}/api/users`, data);
                alert(`✅ Creado. Usuario para entrar: ${primerApellido}`);
            }
            closeModal(); 
            fetchUsers();
        } catch (error) {
            alert("Error: " + (error.response?.data?.message || "Ocurrió un error"));
        }
    };

    const handleEdit = (u) => {
        setFormData({ 
            name: u.name, lastName: u.lastName, dni: u.dni, 
            phone: u.phone || '', mail: u.mail || '', role: u.role || '', 
            accessLevel: u.accessLevel || 'Usuario', 
            type: u.type || 'Trabajador',
            additionalDaily: u.additionalDaily || 0
        });
        setSelectedId(u._id); 
        setIsWorker(u.type === 'Trabajador');
        setIsEditMode(true); 
        setIsRegisterModalOpen(true);
    };

    const closeModal = () => {
        setIsRegisterModalOpen(false); 
        setIsEditMode(false);
        setFormData({ name: '', lastName: '', dni: '', phone: '', mail: '', role: '', accessLevel: 'Usuario', type: 'Trabajador', additionalDaily: 0 });
    };

    if (!tienePermisoEscritura) return <div style={st.denied}>🚫 Acceso Denegado</div>;

    return (
        <main style={st.container}>
            <header className="inventory-controls-bar" style={st.header}>
                <h1 style={st.title}>Gestión Personal 👥</h1>
                <div style={st.actions}>
                    <input placeholder="Buscar por nombre o DNI..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} style={st.searchInput}/>
                    <button onClick={() => setIsRegisterModalOpen(true)} style={st.btnPrimary} title="Nuevo Usuario">➕</button>
                    <button 
                        onClick={handlePrintSelectedQR} 
                        style={{
                            ...st.btnSecondary,
                            backgroundColor: selectedUserIds.length > 0 ? '#00ffa3' : '#3b4a54',
                            color: selectedUserIds.length > 0 ? '#0b141a' : 'white',
                            fontWeight: 'bold'
                        }}
                    >
                        🖨️ Imprimir Seleccionados ({selectedUserIds.length})
                    </button>
                </div>
            </header>

            <div style={st.tableWrapper}>
                <table style={st.table}>
                    <thead>
                        <tr>
                            <th style={{...st.th, width: '40px'}}>
                                <input 
                                    type="checkbox" 
                                    onChange={toggleSelectAll}
                                    checked={filteredUsers.length > 0 && selectedUserIds.length === filteredUsers.length}
                                />
                            </th>
                            <th style={st.th}>Apellidos y Nombres</th>
                            <th style={st.th}>DNI</th>
                            <th style={st.th}>Sueldo/Hr</th> 
                            <th style={st.th}>Adic. Diario</th> 
                            <th style={st.th}>Rol / Tipo</th>
                            <th style={st.th}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUsers.map(u => (
                            <tr key={u._id} style={{
                                ...st.tr,
                                backgroundColor: selectedUserIds.includes(u._id) ? 'rgba(0, 255, 163, 0.05)' : 'transparent'
                            }}>
                                <td style={st.td}>
                                    <input 
                                        type="checkbox" 
                                        checked={selectedUserIds.includes(u._id)}
                                        onChange={() => toggleSelectUser(u._id)}
                                    />
                                </td>
                                <td style={st.td}>{u.lastName}, {u.name}</td>
                                <td style={st.td}>{u.dni}</td>
                                <td style={{...st.td, color: '#00ffa3', fontWeight: 'bold'}}>S/ {u.hourlyRate || 0}</td>
                                <td style={{...st.td, color: '#4fc3f7'}}>S/ {u.additionalDaily || 0}</td>
                                <td style={st.td}><span style={st.badge}>{u.role || u.type}</span></td>
                                <td style={st.tdActions}>
                                    <button onClick={() => handleEdit(u)} style={st.btnEdit}>✏️</button>
                                    <button onClick={() => updateRate(u._id, u.name)} style={st.btnMoney} title="Ajustar Pago">💰</button>
                                    <button onClick={() => { setSelectedUser(u); setIsQRModalOpen(true); }} style={st.btnIcon} title="Ver QR">🪪</button>
                                    <button onClick={() => handleDelete(u._id, u.name)} style={st.btnDelete} title="Eliminar">🗑️</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {isRegisterModalOpen && (
                <div style={st.backdrop} onClick={(e) => e.target === e.currentTarget && closeModal()}>
                    <div style={st.modalForm}>
                        <h2 style={{color:'#00a884', marginTop: 0}}>{isEditMode ? 'Editar Usuario' : 'Nuevo Usuario'}</h2>
                        <form onSubmit={handleSubmit} style={st.formGrid}>
                            <input placeholder="Nombres" value={formData.name} required onChange={e=>setFormData({...formData, name: e.target.value})} style={st.input}/>
                            <input placeholder="Apellidos" value={formData.lastName} required onChange={e=>setFormData({...formData, lastName: e.target.value})} style={st.input}/>
                            <input placeholder="DNI" value={formData.dni} required onChange={e=>setFormData({...formData, dni: e.target.value})} style={st.input}/>
                            
                            <div style={{padding: '10px', background: '#2a3942', borderRadius: '8px', border: '1px solid #00ffa344'}}>
                                <label style={{fontSize: '11px', color: '#00ffa3', display: 'block', marginBottom: '5px'}}>Monto Adicional Diario (Almuerzo/Pasajes)</label>
                                <input 
                                    type="number" 
                                    step="0.01"
                                    placeholder="Ej: 15.00" 
                                    value={formData.additionalDaily} 
                                    onChange={e=>setFormData({...formData, additionalDaily: e.target.value})} 
                                    style={{...st.input, width: '100%', boxSizing: 'border-box'}}
                                />
                            </div>

                            <label style={{color: '#8696a0', fontSize:'13px', display: 'flex', alignItems: 'center', gap: '8px'}}>
                                <input type="checkbox" checked={isWorker} onChange={e=>setIsWorker(e.target.checked)}/> 
                                ¿Es trabajador de obra?
                            </label>

                            {isWorker ? (
                                <select style={st.input} value={formData.role} required onChange={e=>setFormData({...formData, role: e.target.value})}>
                                    <option value="">Seleccionar Rol...</option>
                                    {ALLOWED_ROLES.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            ) : (
                                <select style={st.input} value={formData.type} onChange={e=>setFormData({...formData, type: e.target.value})}>
                                    <option value="Externo">Externo</option>
                                    <option value="Visita">Visita</option>
                                </select>
                            )}

                            <select style={st.input} value={formData.accessLevel} onChange={e=>setFormData({...formData, accessLevel: e.target.value})}>
                                <option value="Usuario">Usuario (Solo consulta)</option>
                                <option value="Admin">Admin (Gestión completa)</option>
                                {isSuperAdmin && <option value="SuperAdmin">SuperAdmin</option>}
                            </select>

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
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' },
    title: { color: '#00a884', fontSize: '1.5rem', margin: 0 },
    actions: { display: 'flex', gap: '10px', flex: '1', justifyContent: 'flex-end' },
    searchInput: { backgroundColor: '#2a3942', border: 'none', padding: '10px 15px', borderRadius: '8px', color: 'white', width: '250px' },
    tableWrapper: { backgroundColor: '#111b21', borderRadius: '12px', overflowX: 'auto', border: '1px solid #2a3942' },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: { padding: '15px', color: '#8696a0', textAlign: 'left', borderBottom: '1px solid #2a3942', fontSize: '13px' },
    td: { padding: '15px', borderBottom: '1px solid #2a3942', fontSize: '14px' },
    tr: { transition: 'background 0.2s' },
    tdActions: { display: 'flex', gap: '8px', padding: '15px', borderBottom: '1px solid #2a3942' },
    badge: { backgroundColor: 'rgba(0,168,132,0.1)', color: '#00a884', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold' },
    btnPrimary: { backgroundColor: '#00a884', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' },
    btnSecondary: { backgroundColor: '#3b4a54', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer' },
    btnEdit: { backgroundColor: '#2a3942', border: 'none', padding: '8px', borderRadius: '6px', cursor: 'pointer', fontSize: '16px' },
    btnMoney: { backgroundColor: 'transparent', border: '1px solid #ffca28', color: '#ffca28', padding: '8px', borderRadius: '6px', cursor: 'pointer' },
    btnDelete: { backgroundColor: 'rgba(255,85,85,0.1)', border: '1px solid #ff5555', padding: '8px', borderRadius: '6px', cursor: 'pointer', color: '#ff5555' },
    btnIcon: { backgroundColor: 'transparent', color: '#00a884', border: '1px solid #00a884', padding: '8px', borderRadius: '6px', cursor: 'pointer' },
    backdrop: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
    modalForm: { backgroundColor: '#202c33', padding: '25px', borderRadius: '15px', width: '350px', border: '1px solid #3b4a54' },
    qrPreviewCard: { backgroundColor: 'white', borderRadius: '15px', textAlign: 'center', overflow: 'hidden', width: '300px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' },
    formGrid: { display: 'flex', flexDirection: 'column', gap: '15px' },
    input: { backgroundColor: '#2a3942', border: '1px solid #3b4a54', padding: '12px', borderRadius: '8px', color: 'white' },
    modalButtons: { display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'center' },
    denied: { color: 'white', textAlign: 'center', padding: '100px', fontSize: '20px' }
};

export default UserManagementPage;