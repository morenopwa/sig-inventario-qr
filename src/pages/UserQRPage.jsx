import React, { useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import useAuth from '../hooks/useAuth';
import axios from 'axios';
import { Smartphone, Clock, CheckCircle, Key, Lock, Eye, EyeOff } from 'lucide-react';

const UserQRPage = () => {
    const { user } = useAuth();
    const [enviado, setEnviado] = useState(false);
    const [loading, setLoading] = useState(false);
    
    // Estados para cambio de contraseña
    const [showPassForm, setShowPassForm] = useState(false);
    const [newPassword, setNewPassword] = useState("");
    const [showPass, setShowPass] = useState(false);
    
    const apiUrl = import.meta.env.VITE_API_URL;

    if (!user) return <div style={{color: 'white', padding: '50px', textAlign: 'center'}}>Cargando perfil...</div>;

    const avisarRetiroTemprano = async () => {
        if (!window.confirm("¿Confirmas que hoy te retiras a las 12:00 PM?")) return;
        setLoading(true);
        try {
            const hoy = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Lima' });
            const fechaSalida = new Date(`${hoy}T12:00:00`);
            await axios.patch(`${apiUrl}/api/attendance/editar`, {
                workerId: user._id,
                date: hoy,
                field: 'checkOut',
                value: fechaSalida.toISOString()
            });
            setEnviado(true);
            alert("Aviso enviado. Se ha registrado tu salida a las 12:00 PM.");
        } catch (error) {
            alert("Error al enviar el aviso.");
        } finally { setLoading(false); }
    };

    const handleUpdatePassword = async () => {
        if (!newPassword || newPassword.length < 4) return alert("Mínimo 4 caracteres");
        setLoading(true);
        try {
            await axios.patch(`${apiUrl}/api/users/${user._id}/password`, { newPassword });
            alert("¡Contraseña cambiada con éxito!");
            setNewPassword("");
            setShowPassForm(false);
        } catch (error) {
            alert("Error al actualizar contraseña");
        } finally { setLoading(false); }
    };

    return (
        <div style={styles.container}>
            <header style={styles.header}>
                <h2 style={styles.title}>Mi Fotocheck Digital 🪪</h2>
            </header>

            <div style={styles.qrCard}>
                <div style={styles.userInfo}>
                    <h3 style={styles.userName}>{user.lastName}</h3>
                    <h3 style={styles.userName}>{user.name}</h3>
                    <span style={styles.userRole}>{user.role || 'TRABAJADOR'}</span>
                </div>

                <div style={styles.qrWrapper}>
                    <QRCodeCanvas 
                        value={user.dni || user._id} 
                        size={180}
                        level={"H"}
                        includeMargin={true}
                    />
                </div>

                <div style={styles.dniLabel}>DNI: {user.dni}</div>
                
                {/* --- SECCIÓN DE RETIRO --- */}
                <div style={styles.alertSection}>
                    {!enviado ? (
                        <button onClick={avisarRetiroTemprano} disabled={loading} style={styles.btnRetiro}>
                            <Clock size={18} />
                            {loading ? "..." : "HOY ME RETIRO A LAS 12:00"}
                        </button>
                    ) : (
                        <div style={styles.successMsg}>
                            <CheckCircle size={18} /> AVISO ENVIADO (12:00 PM)
                        </div>
                    )}
                </div>

                {/* --- SECCIÓN DE CONTRASEÑA --- */}
                <div style={{marginTop: '10px'}}>
                    {!showPassForm ? (
                        <button onClick={() => setShowPassForm(true)} style={styles.btnGhost}>
                            <Key size={14} /> CAMBIAR MI CONTRASEÑA
                        </button>
                    ) : (
                        <div style={styles.passContainer}>
                            <div style={styles.inputWrapper}>
                                <Lock size={16} color="#8696a0" />
                                <input 
                                    type={showPass ? "text" : "password"}
                                    placeholder="Nueva clave..."
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    style={styles.inputPass}
                                />
                                <div onClick={() => setShowPass(!showPass)} style={{cursor: 'pointer'}}>
                                    {showPass ? <EyeOff size={16} color="#8696a0"/> : <Eye size={16} color="#8696a0"/>}
                                </div>
                            </div>
                            <div style={{display: 'flex', gap: '8px', marginTop: '10px'}}>
                                <button onClick={handleUpdatePassword} disabled={loading} style={styles.btnSave}>GUARDAR</button>
                                <button onClick={() => setShowPassForm(false)} style={styles.btnCancel}>X</button>
                            </div>
                        </div>
                    )}
                </div>

                <div style={{...styles.instructions, marginTop: '20px'}}>
                    <Smartphone size={16} />
                    <span>Aumenta el brillo de tu pantalla</span>
                </div>
            </div>
        </div>
    );
};

const styles = {
    container: { padding: '20px', backgroundColor: '#0b141a', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center' },
    header: { textAlign: 'center', marginBottom: '20px' },
    title: { color: '#00ffa3', fontSize: '22px', fontWeight: 'bold' },
    qrCard: { backgroundColor: '#111b21', padding: '25px', borderRadius: '25px', border: '1px solid #2a3942', width: '100%', maxWidth: '340px', textAlign: 'center' },
    userInfo: { marginBottom: '15px' },
    userName: { margin: '2px 0', fontSize: '18px', color: '#e9edef', textTransform: 'uppercase' },
    userRole: { color: '#00ffa3', fontSize: '11px', fontWeight: 'bold', letterSpacing: '1px' },
    qrWrapper: { backgroundColor: 'white', padding: '12px', borderRadius: '15px', display: 'inline-block', marginBottom: '10px' },
    dniLabel: { color: '#8696a0', fontSize: '13px', marginBottom: '15px' },
    alertSection: { borderTop: '1px solid #2a3942', paddingTop: '15px', marginBottom: '10px' },
    btnRetiro: { width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', backgroundColor: 'transparent', color: '#ffbc2e', border: '1px solid #ffbc2e', padding: '10px', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' },
    successMsg: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#00ffa3', fontSize: '12px', fontWeight: 'bold', padding: '10px', backgroundColor: 'rgba(0,255,163,0.1)', borderRadius: '10px' },
    btnGhost: { background: 'none', border: 'none', color: '#8696a0', fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', margin: '0 auto', textDecoration: 'underline' },
    passContainer: { backgroundColor: '#1a2429', padding: '12px', borderRadius: '12px', marginTop: '5px' },
    inputWrapper: { display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#2a3942', padding: '8px 12px', borderRadius: '8px' },
    inputPass: { background: 'none', border: 'none', color: 'white', width: '100%', fontSize: '14px', outline: 'none' },
    btnSave: { flex: 1, backgroundColor: '#00a884', border: 'none', color: 'white', padding: '8px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' },
    btnCancel: { backgroundColor: '#3b4a54', border: 'none', color: 'white', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer' },
    instructions: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#34b7f1', fontSize: '11px' }
};

export default UserQRPage;