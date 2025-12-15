// src/hooks/useAuth.js

import { useState, useEffect, useCallback } from 'react';

const getInitialUser = () => {
  const storedUser = localStorage.getItem('currentUser');
  return storedUser ? JSON.parse(storedUser) : null;
};

const useAuth = () => {
  const [user, setUser] = useState(getInitialUser());
  const [isAuthenticated, setIsAuthenticated] = useState(!!getInitialUser());

  // Función de login: Guarda la sesión en localStorage y actualiza el estado
  const login = useCallback((userData) => {
      localStorage.setItem('currentUser', JSON.stringify(userData));
      setUser(userData);
      setIsAuthenticated(true);
  }, []);

  // Función de logout: Limpia la sesión
  const logout = useCallback(() => {
      localStorage.removeItem('currentUser');
      setUser(null);
      setIsAuthenticated(false);
  }, []);

  // Verificar la sesión al cargar (aunque ya lo hacemos con getInitialUser)
  useEffect(() => {
    if (getInitialUser()) {
        setIsAuthenticated(true);
    }
  }, []);

  return {
    user,
    isAuthenticated,
    isSuperAdmin: user?.role === 'SuperAdmin', // Nuevo Rol
    isAlmacenero: user?.role === 'Almacenero' || user?.role === 'SuperAdmin', // SuperAdmin tiene permisos de Almacenero
    isTrabajador: user?.role === 'Trabajador',
    login, 
    logout,
  };
};

export default useAuth;