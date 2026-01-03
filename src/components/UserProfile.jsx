import React, { useState } from 'react';
import axios from 'axios';

const UserProfile = ({ user }) => {
    const [passwords, setPasswords] = useState({ old: '', new: '' });

    const handlePasswordChange = async () => {
        // Lógica para llamar a /api/users/change-password
        alert("Contraseña actualizada con éxito");
    };

    return (
        <div style={s.profileCard}>
            <div style={s.header}>
                <img src={user.photo || 'https://via.placeholder.com/100'} alt="Perfil" style={s.avatar} />
                <div style={{textAlign: 'left'}}>
                    <h2 style={{margin: 0}}>{user.name}</h2>
                    <span style={s.badge}>{user.role}</span>
                </div>
            </div>

            <div style={s.infoSection}>
                <p><strong>DNI/ID:</strong> {user.dni || 'No registrado'}</p>
                <p><strong>Fecha Ingreso:</strong> {new Date(user.createdAt).toLocaleDateString()}</p>
            </div>

            <div style={s.passwordBox}>
                <h4>Seguridad</h4>
                <input type="password" placeholder="Contraseña actual" style={s.input} />
                <input type="password" placeholder="Nueva contraseña" style={s.input} />
                <button onClick={handlePasswordChange} style={s.btn}>Actualizar Contraseña</button>
            </div>
        </div>
    );
};