import React from 'react';
import useAuth from '../hooks/useAuth';
import MyPayments from '../components/MyPayments';

const PagosPage = () => {
    const { user } = useAuth(); // Obtenemos el usuario logueado

    return (
        <div style={{ backgroundColor: '#111b21', minHeight: '100vh', paddingTop: '20px' }}>
            <h2 style={{ textAlign: 'center', color: '#e9edef', marginBottom: '10px' }}>Mi Resumen de Pagos</h2>
            {/* Le pasamos el objeto 'user' que MyPayments necesita para el ID */}
            {user ? <MyPayments user={user} /> : <p style={{color: 'white', textAlign: 'center'}}>Cargando usuario...</p>}
        </div>
    );
};

export default PagosPage;