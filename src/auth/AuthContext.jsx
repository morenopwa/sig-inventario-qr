// src/auth/AuthContext.jsx - COPIA Y PEGA TODO ESTO
import React, { createContext, useState, useContext, useEffect } from 'react';

// 1. Crear el contexto
const AuthContext = createContext(null);

// 2. Crear el Provider (exportado)
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Cargar usuario al iniciar
  useEffect(() => {
    const loadUser = () => {
      try {
        const userData = localStorage.getItem('user');
        const token = localStorage.getItem('token');
        
        console.log('🔄 AuthContext: Cargando usuario...', { userData, token });
        
        if (userData && token) {
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);
          console.log('✅ Usuario cargado:', parsedUser);
        }
      } catch (error) {
        console.error('❌ Error cargando usuario:', error);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  // Login
  const login = async (email, password) => {
    setLoading(true);
    try {
      console.log('🔐 Intentando login:', email);
      
      // Buscar en usuarios guardados
      const storedUsers = JSON.parse(localStorage.getItem('app_users') || '[]');
      const foundUser = storedUsers.find(u => 
        u.email === email && u.password === password
      );
      
      if (foundUser) {
        // Remover password antes de guardar
        const { password: _, ...userWithoutPassword } = foundUser;
        
        localStorage.setItem('token', 'token-' + Date.now());
        localStorage.setItem('user', JSON.stringify(userWithoutPassword));
        setUser(userWithoutPassword);
        
        console.log('✅ Login exitoso:', userWithoutPassword);
        return { success: true };
      }
      
      // Si no hay usuarios, permitir login de prueba
      if (storedUsers.length === 0) {
        console.log('⚠️ No hay usuarios, usando credenciales de prueba');
        
        if (email === 'admin@test.com' && password === 'admin123') {
          const testAdmin = {
            id: 'test-admin-1',
            name: 'Administrador de Prueba',
            email: 'admin@test.com',
            role: 'admin',
            isTest: true
          };
          
          localStorage.setItem('token', 'test-token');
          localStorage.setItem('user', JSON.stringify(testAdmin));
          setUser(testAdmin);
          
          // Guardar también en app_users
          localStorage.setItem('app_users', JSON.stringify([{
            ...testAdmin,
            password: 'admin123'
          }]));
          
          return { success: true };
        }
      }
      
      return { 
        success: false, 
        message: 'Email o contraseña incorrectos' 
      };
      
    } catch (error) {
      console.error('❌ Error en login:', error);
      return { success: false, message: 'Error en el login' };
    } finally {
      setLoading(false);
    }
  };

  // Registro
  const register = async (userData) => {
    setLoading(true);
    try {
      console.log('📝 Registrando usuario:', userData.email);
      
      const storedUsers = JSON.parse(localStorage.getItem('app_users') || '[]');
      
      // Verificar si email ya existe
      if (storedUsers.some(u => u.email === userData.email)) {
        return { 
          success: false, 
          message: 'El email ya está registrado' 
        };
      }
      
      // Si es el primer usuario, forzar admin
      const isFirstUser = storedUsers.length === 0;
      const finalRole = isFirstUser ? 'admin' : (userData.role || 'worker');
      
      const newUser = {
        id: 'user-' + Date.now(),
        name: userData.name,
        email: userData.email,
        password: userData.password,
        role: finalRole,
        createdAt: new Date().toISOString()
      };
      
      // Guardar en localStorage
      storedUsers.push(newUser);
      localStorage.setItem('app_users', JSON.stringify(storedUsers));
      
      // Remover password para la respuesta
      const { password: _, ...userWithoutPassword } = newUser;
      
      console.log('✅ Usuario registrado:', userWithoutPassword);
      
      return {
        success: true,
        message: `Usuario registrado como ${finalRole}`,
        user: userWithoutPassword
      };
      
    } catch (error) {
      console.error('❌ Error en registro:', error);
      return { success: false, message: 'Error en el registro' };
    } finally {
      setLoading(false);
    }
  };

  // Logout
  const logout = () => {
    console.log('🚪 Cerrando sesión');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider value={{
      user,
      login,
      register,
      logout,
      isAdmin,
      loading
    }}>
      {children}
    </AuthContext.Provider>
  );
};

// 3. Crear el Hook personalizado (exportado)
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  
  return context;
};

// 4. Exportar el contexto también por si acaso
export default AuthContext;