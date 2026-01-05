import React, { useEffect, useRef,useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

const SmartScanner = ({ onScanSuccess }) => {
    const scannerRef = useRef(null);
    const scannerId = "qr-reader-container";
    const [isScannerActive, setIsScannerActive] = useState(false);

    useEffect(() => {
        let isMounted = true;

        const startScanner = async () => {
            try {
                // 1. Esperar a que el DOM esté listo
                await new Promise(r => setTimeout(r, 300));
                if (!isMounted) return;

                // 2. Instanciar la versión pura (más estable)
                const html5QrCode = new Html5Qrcode(scannerId);
                scannerRef.current = html5QrCode;

                const config = { 
                    fps: 10, 
                    qrbox: { width: 250, height: 250 } 
                };

                // 3. Iniciar con la cámara trasera por defecto
                await html5QrCode.start(
                    { facingMode: "environment" }, 
                    config,
                    (decodedText) => {
                        // Al detectar, detenemos y enviamos datos
                        html5QrCode.stop().then(() => {
                            if (isMounted) onScanSuccess(decodedText);
                        }).catch(err => console.warn("Error al detener:", err));
                    }
                );
            } catch (err) {
                // Si el error es porque el elemento desapareció, lo ignoramos
                if (isMounted) {
                    console.error("Error al iniciar el scanner:", err);
                }
            }
        };

        startScanner();

        return () => {
            isMounted = false;
            if (scannerRef.current && scannerRef.current.isScanning) {
                scannerRef.current.stop()
                    .catch(err => console.warn("Error al apagar cámara:", err))
                    .finally(() => {
                        const node = document.getElementById(scannerId);
                        if (node) node.innerHTML = "";
                    });
            }
        };
    }, [onScanSuccess]);

    return (
        <div style={styles.wrapper}>
            <div id={scannerId} style={styles.container}></div>
            <p style={styles.hint}>Coloque el código QR frente a la cámara</p>
        </div>
    );
};

const styles = {
    wrapper: {
        padding: '15px',
        backgroundColor: '#111b21',
        borderRadius: '20px',
        textAlign: 'center',
        border: '1px solid #2a3942'
    },
    container: {
        width: '100%',
        borderRadius: '12px',
        overflow: 'hidden',
        backgroundColor: '#000'
    },
    hint: {
        color: '#8696a0',
        fontSize: '12px',
        marginTop: '10px'
    },
    btnStart: {
        padding: '12px 24px',
        backgroundColor: '#00a884',
        color: 'white',
        border: 'none',
        borderRadius: '25px',
        cursor: 'pointer',
        fontWeight: 'bold',
        marginBottom: '20px',
        display: 'block',
        margin: '10px auto'
    },
    btnStop: {
        padding: '12px 24px',
        backgroundColor: '#ea0038',
        color: 'white',
        border: 'none',
        borderRadius: '25px',
        cursor: 'pointer',
        fontWeight: 'bold',
        marginBottom: '20px',
        display: 'block',
        margin: '10px auto'
    },
    // Estilo para stock bajo
    rowAlert: { backgroundColor: 'rgba(234, 0, 56, 0.15)' },
    
};



export default SmartScanner;