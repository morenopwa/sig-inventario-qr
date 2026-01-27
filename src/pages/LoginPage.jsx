import React, { useState } from 'react';
import axios from 'axios';
import useAuth from '../hooks/useAuth';

const apiUrl = import.meta.env.VITE_API_URL;

const LoginPage = () => {
    const [identifier, setIdentifier] = useState(''); 
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // URL corregida para evitar el 404
            const response = await axios.post(`${apiUrl}/api/users/login`, {
                username: identifier.trim(), 
                password: password.trim(),
            });

            if (response.data.success) {
                login(response.data.user);
                // No hace falta navigate(), App.jsx lo detectará por el cambio de estado
            }
        } catch (err) {
            setError(err.response?.data?.message || "Error: No se pudo conectar con el servidor");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={l.container}>
            <form onSubmit={handleSubmit} style={l.card}>
                <h2 style={l.title}>S.I. GONZALES</h2>
                <p style={l.subtitle}>Acceso al Sistema</p>
                {error && <div style={l.error}>{error}</div>}
                <div style={l.inputGroup}>
                    <label style={l.label}>Nombre o Apellido:</label>
                    <input type="text" value={identifier} onChange={(e) => setIdentifier(e.target.value)} placeholder="Ej: MORENO" required style={l.input} />
                </div>
                <div style={l.inputGroup}>
                    <label style={l.label}>Contraseña (DNI):</label>
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="DNI" required style={l.input} />
                </div>
                <button type="submit" disabled={loading} style={loading ? l.btnDisabled : l.btn}>
                    {loading ? 'Verificando...' : 'Ingresar'}
                </button>
            </form>
        </div>
    );
};

const l = {
    container: { height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#0b141a' },
    card: { backgroundColor: '#111b21', padding: '40px', borderRadius: '15px', width: '320px', textAlign: 'center', border: '1px solid #2a3942' },
    title: { color: '#00a884', margin: '0 0 5px 0', fontSize: '24px' },
    subtitle: { color: '#8696a0', marginBottom: '25px', fontSize: '14px' },
    inputGroup: { textAlign: 'left', marginBottom: '20px' },
    label: { color: '#00a884', fontSize: '12px', display: 'block', marginBottom: '5px' },
    input: { width: '100%', padding: '12px', boxSizing: 'border-box', backgroundColor: '#2a3942', border: 'none', borderRadius: '8px', color: 'white', outline: 'none' },
    btn: { width: '100%', padding: '12px', backgroundColor: '#00a884', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' },
    btnDisabled: { width: '100%', padding: '12px', backgroundColor: '#2a3942', color: '#8696a0', border: 'none', borderRadius: '8px', cursor: 'not-allowed' },
    error: { backgroundColor: 'rgba(255,85,85,0.1)', color: '#ff5555', padding: '10px', borderRadius: '8px', marginBottom: '15px', fontSize: '13px', border: '1px solid #ff5555' }
};

export default LoginPage;