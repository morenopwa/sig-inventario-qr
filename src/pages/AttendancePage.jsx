// src/pages/AttendancePage.jsx

import React from 'react';
import useAuth from '../hooks/useAuth';

const AttendancePage = () => {
    const { user, isAlmacenero } = useAuth();
    
    // Simulación de los datos de asistencia para el trabajador logeado
    // En un sistema real, harías una llamada API aquí para obtener el historial.

    return (
        <div className="app-container">
            <header className="header">
                <h1>✅ Registro de Asistencia</h1>
            </header>

            <p>Bienvenido, <strong>{user?.name}</strong>. Aquí puedes ver tu historial de asistencia.</p>
            
            <div className="attendance-scanner-area" style={{padding: '20px', border: '1px solid #ccc', borderRadius: '8px', marginBottom: '20px'}}>
                <h3>Marcar Entrada/Salida</h3>
                <p>Muestre su código QR personal a la cámara para registrar su hora.</p>
                {/* Aquí iría el componente de cámara dedicado solo a asistencia */}
                <div id="attendance-qr-reader" style={{width: '300px', height: '200px', backgroundColor: '#e9ecef'}}>
                    {/* Placeholder para el lector de asistencia */}
                </div>
                <button className="btn btn-primary" style={{marginTop: '15px'}} onClick={() => alert('Lógica de registro de asistencia iniciada.')}>
                    Iniciar Escaneo de Asistencia
                </button>
            </div>
            
            {isAlmacenero && (
                <div style={{marginTop: '30px', padding: '15px', borderTop: '1px solid #e9ecef'}}>
                    <h3>Reporte de Asistencia (Acceso Almacenero)</h3>
                    <p>Tabla con el estado de asistencia de todos los trabajadores.</p>
                </div>
            )}

        </div>
    );
};

export default AttendancePage;