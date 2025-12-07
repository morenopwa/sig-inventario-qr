// src/auth/Login.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [credentials, setCredentials] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Base de datos de usuarios (en producción sería una API)
  const usersDatabase = [
    {
      id: 1,
      email: 'admin@empresa.com',
      password: 'admin123',
      nombre: 'Administrador Principal',
      rol: 'admin',
      departamento: 'Administración'
    },
    {
      id: 2,
      email: 'empleado@empresa.com',
      password: 'empleado123',
      nombre: 'Juan Pérez',
      rol: 'empleado',
      departamento: 'Almacén'
    },
    {
      id: 3,
      email: 'supervisor@empresa.com',
      password: 'super123',
      nombre: 'María García',
      rol: 'supervisor',
      departamento: 'Logística'
    }
  ];

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Simular validación
    setTimeout(() => {
      const user = usersDatabase.find(
        u => u.email === credentials.email && u.password === credentials.password
      );

      if (user) {
        // Guardar sesión
        localStorage.setItem('user', JSON.stringify({
          ...user,
          token: 'fake-jwt-token',
          loggedIn: true,
          lastLogin: new Date().toISOString()
        }));

        // Redirigir según rol (TU ESCANER QR SERÁ LA VISTA PRINCIPAL)
        if (user.rol === 'admin') {
          navigate('/admin/dashboard'); // Vista de admin con estadísticas
        } else {
          navigate('/escanner'); // VISTA PRINCIPAL: ESCÁNER QR
        }
      } else {
        setError('Credenciales incorrectas. Usa: admin@empresa.com / admin123');
      }
      setLoading(false);
    }, 500);
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <h1>Sistema de Inventario QR</h1>
          <p>Escaneo y gestión de activos</p>
        </div>
        
        <div className="login-card">
          <h2>Iniciar Sesión</h2>
          
          <form onSubmit={handleLogin}>
            <div className="input-group">
              <label>Email</label>
              <input
                type="email"
                value={credentials.email}
                onChange={(e) => setCredentials({...credentials, email: e.target.value})}
                placeholder="usuario@empresa.com"
                required
              />
            </div>
            
            <div className="input-group">
              <label>Contraseña</label>
              <input
                type="password"
                value={credentials.password}
                onChange={(e) => setCredentials({...credentials, password: e.target.value})}
                placeholder="••••••••"
                required
              />
            </div>

            {error && <div className="error-message">{error}</div>}

            <button 
              type="submit" 
              className="login-btn"
              disabled={loading}
            >
              {loading ? 'Verificando...' : 'Acceder al Sistema'}
            </button>
          </form>

          <div className="demo-accounts">
            <p><strong>Cuentas de prueba:</strong></p>
            <div className="account-list">
              <div className="account">
                <span className="role-badge admin">Admin</span>
                <span>admin@empresa.com</span>
                <span>admin123</span>
              </div>
              <div className="account">
                <span className="role-badge employee">Empleado</span>
                <span>empleado@empresa.com</span>
                <span>empleado123</span>
              </div>
            </div>
          </div>
        </div>

        <div className="login-footer">
          <p>Sistema de Gestión de Inventario v1.0</p>
        </div>
      </div>
    </div>
  );
};

export default Login;