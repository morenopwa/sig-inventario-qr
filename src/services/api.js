// src/services/api.js
const API_URL = import.meta.env.VITE_API_URL || 'https://sig-inventario-qr-backend.onrender.com';

const handleResponse = async (response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Error desconocido' }));
    throw new Error(error.message || `HTTP error! status: ${response.status}`);
  }
  return response.json();
};

// API para equipos
export const equipmentAPI = {
  getAll: async () => {
    const response = await fetch(`${API_URL}/api/items`);
    return handleResponse(response);
  },

  scan: async (qrData) => {
    const response = await fetch(`${API_URL}/api/scan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ qrData })
    });
    return handleResponse(response);
  },

  loan: async (qrCode, personName, notes = '') => {
    const response = await fetch(`${API_URL}/api/loan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ qrCode, personName, notes })
    });
    return handleResponse(response);
  },

  return: async (qrCode, notes = '') => {
    const response = await fetch(`${API_URL}/api/return`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ qrCode, notes })
    });
    return handleResponse(response);
  },

  create: async (equipmentData) => {
    const response = await fetch(`${API_URL}/api/equipments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(equipmentData)
    });
    return handleResponse(response);
  },

  update: async (id, equipmentData) => {
    const response = await fetch(`${API_URL}/api/equipments/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(equipmentData)
    });
    return handleResponse(response);
  },

  delete: async (id) => {
    const response = await fetch(`${API_URL}/api/equipments/${id}`, {
      method: 'DELETE'
    });
    return handleResponse(response);
  }
};

// API para asistencias
export const attendanceAPI = {
  getWorkers: async () => {
    const response = await fetch(`${API_URL}/api/workers`);
    return handleResponse(response);
  },

  createWorker: async (workerData) => {
    const response = await fetch(`${API_URL}/api/workers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(workerData)
    });
    return handleResponse(response);
  },

  updateWorkerQR: async (workerId, qrData) => {
    const response = await fetch(`${API_URL}/api/workers/${workerId}/qr`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(qrData)
    });
    return handleResponse(response);
  },

  scanWorker: async (qrData) => {
    const response = await fetch(`${API_URL}/api/attendance/scan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ qrData })
    });
    return handleResponse(response);
  },

  getAttendanceReport: async (date = null) => {
    const url = date ? `${API_URL}/api/attendance/report?date=${date}` : `${API_URL}/api/attendance/report`;
    const response = await fetch(url);
    return handleResponse(response);
  },

  updateWorker: async (workerId, workerData) => {
    const response = await fetch(`${API_URL}/api/workers/${workerId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(workerData)
    });
    return handleResponse(response);
  },

  deleteWorker: async (workerId) => {
    const response = await fetch(`${API_URL}/api/workers/${workerId}`, {
      method: 'DELETE'
    });
    return handleResponse(response);
  }
};

// API para autenticación
export const authAPI = {
  login: async (email, password) => {
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    return handleResponse(response);
  },

  register: async (userData) => {
    const response = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    return handleResponse(response);
  },

  getProfile: async () => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/api/auth/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return handleResponse(response);
  }
};

// Exportar todas las APIs juntas
export default {
  equipment: equipmentAPI,
  attendance: attendanceAPI,
  auth: authAPI
};