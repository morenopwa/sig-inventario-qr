// src/pages/LoginPage.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth'; 
import axios from 'axios';

const apiUrl = import.meta.env.VITE_API_URL;

const LoginPage = () => {
    // Usamos 'name' y 'pin' según el backend
    const [name, setName] = useState(''); 
    const [pin, setPin] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { login, isAuthenticated } = useAuth(); 

    // Si ya está autenticado, redirigir inmediatamente.
    useEffect(() => {
        if (isAuthenticated) {
            navigate('/', { replace: true });
        }
    }, [isAuthenticated, navigate]);


    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await axios.post(`${apiUrl}/api/login`, {
                name: name,
                pin: pin
            });

            if (response.data.success) {
                // 1. Guardar la sesión y estado en useAuth
                login(response.data.user); 
                
                // 2. Redirección automática gracias al useEffect
                alert(`¡Bienvenido, ${response.data.user.name}! Rol: ${response.data.user.role}`);
                // No necesitamos llamar navigate aquí, el useEffect lo hará al cambiar 'isAuthenticated'
            } else {
                alert(`❌ Error al iniciar sesión: ${response.data.message}`);
            }
        } catch (error) {
            const message = error.response?.data?.message || 'Error de conexión con el servidor.';
            alert(`❌ Fallo en la autenticación: ${message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-box">
                <h2>📦 Iniciar Sesión</h2>
                <p>Sistema de Gestión de Inventario QR</p>
                <form onSubmit={handleLogin}>
                    <div className="form-group">
                        <label>Nombre de Usuario</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>PIN/Contraseña</label>
                        <input
                            type="password"
                            value={pin}
                            onChange={(e) => setPin(e.target.value)}
                            required
                        />
                    </div>
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? 'Cargando...' : 'Entrar'}
                    </button>
                </form>
                <small style={{marginTop: '10px', display: 'block'}}>Use su nombre y PIN.</small>
            </div>
        </div>
    );
};

export default LoginPage;