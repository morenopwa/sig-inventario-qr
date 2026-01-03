import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth'; 
import axios from 'axios';

const apiUrl = import.meta.env.VITE_API_URL;

const LoginPage = () => {
    const [lastName, setLastName] = useState(''); 
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    
    // Extraemos login y el objeto user de nuestro hook de auth
    const { login, user } = useAuth(); 
    const navigate = useNavigate();

    // EFECTO CORREGIDO: Solo redirige si hay un usuario logueado
    useEffect(() => {
        if (user) {
            
            navigate('/', { replace: true });
        }
    }, [user, navigate]);

    const handleLogin = async (e) => {
        e.preventDefault();
        if (loading) return;

        setLoading(true);
        try {
            // IMPORTANTE: Verifica que el backend espere "name" y "password"
            const response = await axios.post(`${apiUrl}/api/users/login`, {
                lastName: lastName.trim(),
                password: password.trim()
            });

            if (response.data.success) {
                // Al llamar a login(user), el useEffect de arriba detectará el cambio y redirigirá
                login(response.data.user); 
            } else {
                alert(`❌ ${response.data.message || 'Credenciales inválidas'}`);
            }
        } catch (error) {
            console.error("Login Error:", error);
            const msg = error.response?.status === 401 
                ? "Nombre o password incorrectos" 
                : "Error de conexión con el servidor";
            alert(`❌ ${msg}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={l.container}>
            <div style={l.card}>
                <h2 style={{color: '#00a884', marginBottom: '5px'}}>Bienvenido</h2>
                <p style={{color: '#8696a0', fontSize: '14px', marginBottom: '25px'}}>Identifícate para continuar</p>
                
                <form onSubmit={handleLogin}>
                    <div style={l.inputGroup}>
                        <label style={l.label}>Usuario</label>
                        <input
                            style={l.input}
                            type="text"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            placeholder="Tu Apellido"
                            required
                        />
                    </div>
                    <div style={l.inputGroup}>
                        <label style={l.label}>Contraseña de Acceso</label>
                        <input
                            style={l.input}
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="****"
                            required
                        />
                    </div>
                    <button type="submit" style={l.btn} disabled={loading}>
                        {loading ? 'Verificando...' : 'Entrar al Sistema'}
                    </button>
                </form>
            </div>
        </div>
    );
};

const l = {
    container: { height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#0b141a', padding: '20px' },
    card: { backgroundColor: '#202c33', padding: '40px', borderRadius: '15px', width: '100%', maxWidth: '350px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' },
    inputGroup: { textAlign: 'left', marginBottom: '15px' },
    label: { color: '#00a884', fontSize: '12px', fontWeight: 'bold', marginLeft: '5px' },
    input: { width: '100%', padding: '12px', marginTop: '5px', borderRadius: '8px', border: 'none', backgroundColor: '#2a3942', color: 'white', boxSizing: 'border-box', outline: 'none' },
    btn: { width: '100%', padding: '15px', backgroundColor: '#00a884', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px', marginTop: '10px', transition: '0.3s' }
};

export default LoginPage;