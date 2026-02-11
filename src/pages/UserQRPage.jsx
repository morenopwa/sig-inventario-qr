import React from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import useAuth from '../hooks/useAuth';
import { Smartphone, Download, User } from 'lucide-react';

const UserQRPage = () => {
    const { user } = useAuth();

    if (!user) return <div style={{color: 'white', padding: '50px', textAlign: 'center'}}>Cargando perfil...</div>;

    const handlePrint = () => {
        window.print();
    };

    return (
        <div style={styles.container}>
            {/* Estilo para impresión limpia */}
            <style>{`
                @media print {
                    body { background: white !important; }
                    header, button, .instructions { display: none !important; }
                    .qr-card { border: none !important; box-shadow: none !important; margin: 0 auto !important; }
                    .qr-wrapper { border: 1px solid #eee !important; }
                }
            `}</style>

            <header style={styles.header}>
                <h2 style={styles.title}>Mi Fotocheck Digital 🪪</h2>
                <p style={styles.subtitle}>Presenta este código en Almacén o Asistencia</p>
            </header>

            <div style={styles.qrCard} className="qr-card">
                <div style={styles.userInfo}>
                    <div style={styles.avatar}><User size={40} color="#00ffa3"/></div>
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
                
                <div style={styles.instructions} className="instructions">
                    <Smartphone size={16} />
                    <span>Aumenta el brillo de tu pantalla</span>
                </div>
            </div>

            <button style={styles.btnDownload} onClick={handlePrint}>
                <Download size={18} /> Imprimir / Guardar Fotocheck
            </button>
        </div>
    );
};


const styles = {
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
    btnDownload: { marginTop: '25px', display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#2a3942', color: 'white', border: 'none', padding: '12px 25px', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold' }
};

export default UserQRPage;