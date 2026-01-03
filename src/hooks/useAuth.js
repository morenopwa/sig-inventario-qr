// src/hooks/useAuth.js

import { useState, useEffect, useCallback } from 'react';

const useAuth = () => {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('currentUser');
    return stored ? JSON.parse(stored) : null;
  });

  const login = useCallback((userData) => {
    localStorage.setItem('currentUser', JSON.stringify(userData));
    setUser(userData);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('currentUser');
    setUser(null);
  }, []);

  return {
    user,
    isAuthenticated:!!user,
   
    // 1. SEGURIDAD: ¿Qué puede hacer en la APP?
    isSuperAdmin: user?.nivelAcceso === 'SuperAdmin', 
    isAdmin: user?.nivelAcceso === 'Admin', 
    isUsuario: user?.nivelAcceso === 'Usuario',

    // 2. LABORAL: ¿Qué puesto ocupa?
    isAlmacenero: user?.rol === 'Almacenero',
    isCalderero: user?.rol === 'Calderero',

    // 3. CATEGORÍA: ¿Es de la empresa o externo?
    isTrabajador: user?.tipo === 'Trabajador',
    isExterno: user?.tipo === 'Externo',

    login, 
    logout,
  };
};

export default useAuth;