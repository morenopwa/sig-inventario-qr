import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

const SuperAdminPanel = () => {
    const [workers, setWorkers] = useState([]);

    const fetchWorkers = async () => {
        const res = await axios.get(`${API_URL}/api/workers`);
        setWorkers(res.data);
    };

    useEffect(() => { fetchWorkers(); }, []);

    const togglePermission = async (userId, key, current) => {
        await axios.put(`${API_URL}/api/superadmin/toggle-permission`, {
            userId, permissionKey: key, newValue: !current
        });
        fetchWorkers();
    };

    const changeRole = async (userId, currentRole) => {
        const newRole = currentRole === 'Admin' ? 'Operario' : 'Admin';
        await axios.put(`${API_URL}/api/superadmin/change-role`, { userId, newRole });
        fetchWorkers();
    };

    return (
        <div style={{ padding: '20px', backgroundColor: '#0b141a', minHeight: '100vh', color: 'white' }}>
            <h2>Panel Maestro: Permisos y Roles 🛡️</h2>
            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px', backgroundColor: '#111b21' }}>
                    <thead>
                        <tr style={{ borderBottom: '2px solid #2a3942', textAlign: 'left' }}>
                            <th style={p.th}>Nombre</th>
                            <th style={p.th}>Rol Actual</th>
                            <th style={p.th}>Admin</th>
                            <th style={p.th}>Editar Tarifas</th>
                            <th style={p.th}>Gestionar Roles</th>
                            <th style={p.th}>Borrar Items</th>
                        </tr>
                    </thead>
                    <tbody>
                        {workers.map(w => (
                            <tr key={w._id} style={{ borderBottom: '1px solid #222' }}>
                                <td style={p.td}>{w.name} {w.lastName}</td>
                                <td style={p.td}><span style={p.badge}>{w.role}</span></td>
                                <td style={p.td}>
                                    <button 
                                        onClick={() => changeRole(w._id, w.role)}
                                        style={w.role === 'Admin' ? p.btnOff : p.btnOn}
                                    >
                                        {w.role === 'Admin' ? 'Quitar' : 'Hacer Admin'}
                                    </button>
                                </td>
                                <td style={p.td}><input type="checkbox" checked={w.permissions?.canEditTarifa} onChange={() => togglePermission(w._id, 'canEditTarifa', w.permissions?.canEditTarifa)} /></td>
                                <td style={p.td}><input type="checkbox" checked={w.permissions?.canEditRoles} onChange={() => togglePermission(w._id, 'canEditRoles', w.permissions?.canEditRoles)} /></td>
                                <td style={p.td}><input type="checkbox" checked={w.permissions?.canDeleteItems} onChange={() => togglePermission(w._id, 'canDeleteItems', w.permissions?.canDeleteItems)} /></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const p = {
    th: { padding: '15px', color: '#8696a0', fontSize: '13px' },
    td: { padding: '15px', fontSize: '14px' },
    badge: { backgroundColor: '#2a3942', padding: '4px 8px', borderRadius: '5px', fontSize: '11px' },
    btnOn: { backgroundColor: '#00a884', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' },
    btnOff: { backgroundColor: '#ea0038', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }
};

export default SuperAdminPanel;