// src/hooks/useInventoryApi.js

import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

// Utiliza la URL base definida en tu archivo de configuración o .env
const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const useInventoryApi = () => {
  const [items, setItems] = useState([]); // Usamos 'items' para reflejar el modelo Item.js
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [workers, setWorkers] = useState([]); // Para la lista de trabajadores (doble escaneo)

  // Función para cargar items (equipos)
  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Usando la ruta GET /api/items que ya tienes
      const response = await axios.get(`${apiUrl}/api/items`); 
      setItems(response.data);
    } catch (err) {
      setError('Error al cargar la lista de equipos.');
    } finally {
      setLoading(false);
    }
  }, [apiUrl]);

  // Función para cargar trabajadores (usado para doble escaneo/rellenado de nombre)
  const fetchWorkers = useCallback(async () => {
    try {
      // Suponiendo que tienes una ruta GET /api/workers para la lista
      const response = await axios.get(`${apiUrl}/api/workers`); 
      setWorkers(response.data);
    } catch (err) {
      console.error('Error al cargar trabajadores:', err);
    }
  }, [apiUrl]);

  useEffect(() => {
    fetchItems();
    fetchWorkers();
  }, [fetchItems, fetchWorkers]);

  return {
    items,
    workers,
    loading,
    error,
    fetchItems,
    fetchWorkers,
    // Aquí puedes añadir más funciones de API (loanItem, returnItem, etc.)
  };
};

export default useInventoryApi;