import React, { useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import useAuth from '../hooks/useAuth';
import axios from 'axios'; // Importamos axios
import { Smartphone, User, Clock, CheckCircle } from 'lucide-react';

const UserQRPage = () => {
    const { user } = useAuth();
    const [enviado, setEnviado] = useState(false);
    const [loading, setLoading] = useState(false);
    const apiUrl = import.meta.env.VITE_API_URL;

    if (!user) return <div style={{color: 'white', padding: '50px', textAlign: 'center'}}>Cargando perfil...</div>;

    const avisarRetiroTemprano = async () => {
        if (!window.confirm("¿Confirmas que hoy te retiras a las 12:00 PM?")) return;
        
        setLoading(true);
        try {
            // Obtenemos la fecha actual en formato local (YYYY-MM-DD)
            const hoy = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Lima' });
            // Creamos el objeto fecha para las 12:00 PM de hoy
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
            console.error(error);
            alert("Error al enviar el aviso. Inténtalo más tarde.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.container}>
            <header style={styles.header}>
                <h2 style={styles.title}>Mi Fotocheck Digital 🪪</h2>
            </header>

            <div style={styles.qrCard} className="qr-card">
                <div style={styles.userInfo}>
                   
                    <h3 style={styles.userName}>{user.lastName}</h3>
                    <h3 style={styles.userName}>{user.name}</h3>
                    <span style={styles.userRole}>{user.role || 'TRABAJADOR'}</span>
                </div>

                <div style={styles.qrWrapper} className="qr-wrapper">
                    <QRCodeCanvas 
                        value={user.dni || user._id} 
                        size={200}
                        level={"H"}
                        includeMargin={true}
                    />
                </div>

                <div style={styles.dniLabel}>DNI: {user.dni}</div>
                
                {/* --- SECCIÓN DEL BOTÓN DE RETIRO --- */}
                <div style={styles.alertSection}>
                    {!enviado ? (
                        <button 
                            onClick={avisarRetiroTemprano} 
                            disabled={loading}
                            style={styles.btnRetiro}
                        >
                            <Clock size={18} />
                            {loading ? "PROCESANDO..." : "HOY ME RETIRO A LAS 12:00"}
                        </button>
                    ) : (
                        <div style={styles.successMsg}>
                            <CheckCircle size={18} />
                            AVISO ENVIADO (Salida: 12:00 PM)
                        </div>
                    )}
                </div>

                <div style={styles.instructions} className="instructions">
                    <Smartphone size={16} />
                    <span>Aumenta el brillo de tu pantalla</span>
                </div>
            </div>
        </div>
    );
};

// --- ESTILOS ACTUALIZADOS ---
const styles = {
    // ... tus estilos anteriores se mantienen igual ...
    container: { padding: '30px', backgroundColor: '#0b141a', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center' },
    header: { textAlign: 'center', marginBottom: '30px' },
    title: { color: '#00ffa3', fontSize: '24px', margin: 0 },
    subtitle: { color: '#8696a0', fontSize: '14px' },
    qrCard: { backgroundColor: '#111b21', padding: '30px', borderRadius: '20px', border: '1px solid #2a3942', width: '100%', maxWidth: '350px', textAlign: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' },
    userInfo: { marginBottom: '20px' },
    avatar: { backgroundColor: 'rgba(0,255,163,0.1)', width: '70px', height: '70px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' },
    userName: { margin: '5px 0', fontSize: '18px', color: '#e9edef' },
    userRole: { color: '#00ffa3', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase' },
    qrWrapper: { backgroundColor: 'white', padding: '15px', borderRadius: '15px', display: 'inline-block', marginBottom: '15px' },
    dniLabel: { color: '#8696a0', fontSize: '14px', marginBottom: '20px' },
    instructions: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#34b7f1', fontSize: '12px' },
    
    // ESTILOS NUEVOS PARA EL BOTÓN
    alertSection: {
        marginTop: '10px',
        marginBottom: '20px',
        borderTop: '1px solid #2a3942',
        paddingTop: '20px'
    },
    btnRetiro: {
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px',
        backgroundColor: 'transparent',
        color: '#ffbc2e',
        border: '1px solid #ffbc2e',
        padding: '12px',
        borderRadius: '12px',
        cursor: 'pointer',
        fontWeight: 'bold',
        fontSize: '13px',
        transition: '0.3s'
    },
    successMsg: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        color: '#00ffa3',
        fontSize: '14px',
        fontWeight: 'bold',
        padding: '12px',
        backgroundColor: 'rgba(0,255,163,0.1)',
        borderRadius: '12px'
    }
};

export default UserQRPage;