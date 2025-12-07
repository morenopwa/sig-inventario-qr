// src/hooks/useInventory.js
import { useState, useEffect } from 'react';

// Categorías predefinidas
const DEFAULT_CATEGORIES = [
  { id: 1, name: 'EPP', description: 'Equipo de Protección Personal' },
  { id: 2, name: 'Herramientas', description: 'Herramientas manuales y eléctricas' },
  { id: 3, name: 'Oxicorte', description: 'Equipos de oxicorte y soldadura' },
  { id: 4, name: 'Medición', description: 'Instrumentos de medición' },
  { id: 5, name: 'Seguridad', description: 'Equipos de seguridad' }
];

// Estados posibles de equipo
const EQUIPMENT_STATUS = {
  AVAILABLE: 'disponible',
  LOANED: 'prestado',
  MAINTENANCE: 'mantenimiento',
  LOST: 'perdido',
  DAMAGED: 'dañado'
};

const useInventory = () => {
  // Cargar datos iniciales desde localStorage
  const loadInitialData = () => {
    const savedEquipment = localStorage.getItem('app_equipment');
    const savedCategories = localStorage.getItem('app_categories');
    const savedLoans = localStorage.getItem('app_loans');
    
    return {
      equipment: savedEquipment ? JSON.parse(savedEquipment) : [],
      categories: savedCategories ? JSON.parse(savedCategories) : DEFAULT_CATEGORIES,
      loans: savedLoans ? JSON.parse(savedLoans) : []
    };
  };

  const [equipment, setEquipment] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Inicializar datos
  useEffect(() => {
    try {
      const { equipment: savedEquipment, categories: savedCategories, loans: savedLoans } = loadInitialData();
      setEquipment(savedEquipment);
      setCategories(savedCategories);
      setLoans(savedLoans);
    } catch (err) {
      setError('Error al cargar el inventario');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Guardar en localStorage cuando cambian los datos
  useEffect(() => {
    localStorage.setItem('app_equipment', JSON.stringify(equipment));
  }, [equipment]);

  useEffect(() => {
    localStorage.setItem('app_categories', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem('app_loans', JSON.stringify(loans));
  }, [loans]);

  // Generar ID único para equipo
  const generateEquipmentId = () => {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return `EQ-${timestamp}-${random}`.toUpperCase();
  };

  // Agregar nuevo equipo
  const addEquipment = (equipmentData) => {
    try {
      const newEquipment = {
        id: generateEquipmentId(),
        ...equipmentData,
        status: EQUIPMENT_STATUS.AVAILABLE,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        loanHistory: []
      };

      setEquipment(prev => [...prev, newEquipment]);
      
      // Crear actividad
      const activities = JSON.parse(localStorage.getItem('app_activities') || '[]');
      activities.unshift({
        id: Date.now(),
        type: 'equipment_added',
        description: `Equipo agregado: ${equipmentData.name}`,
        details: equipmentData,
        timestamp: new Date().toISOString()
      });
      localStorage.setItem('app_activities', JSON.stringify(activities));

      return { success: true, equipment: newEquipment };
    } catch (err) {
      console.error('Error agregando equipo:', err);
      return { success: false, error: err.message };
    }
  };

  // Actualizar equipo
  const updateEquipment = (id, updates) => {
    try {
      setEquipment(prev => prev.map(item => 
        item.id === id 
          ? { ...item, ...updates, updatedAt: new Date().toISOString() }
          : item
      ));

      return { success: true };
    } catch (err) {
      console.error('Error actualizando equipo:', err);
      return { success: false, error: err.message };
    }
  };

  // Eliminar equipo
  const deleteEquipment = (id) => {
    try {
      const equipmentToDelete = equipment.find(e => e.id === id);
      setEquipment(prev => prev.filter(item => item.id !== id));

      // Crear actividad
      const activities = JSON.parse(localStorage.getItem('app_activities') || '[]');
      activities.unshift({
        id: Date.now(),
        type: 'equipment_deleted',
        description: `Equipo eliminado: ${equipmentToDelete?.name || id}`,
        details: equipmentToDelete,
        timestamp: new Date().toISOString()
      });
      localStorage.setItem('app_activities', JSON.stringify(activities));

      return { success: true };
    } catch (err) {
      console.error('Error eliminando equipo:', err);
      return { success: false, error: err.message };
    }
  };

  // Registrar préstamo
  const registerLoan = (loanData) => {
    try {
      const newLoan = {
        id: `LOAN-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        ...loanData,
        loanDate: new Date().toISOString(),
        expectedReturnDate: loanData.expectedReturnDate || null,
        actualReturnDate: null,
        status: 'active'
      };

      setLoans(prev => [...prev, newLoan]);

      // Actualizar estado del equipo
      setEquipment(prev => prev.map(item => 
        item.id === loanData.equipmentId 
          ? { 
              ...item, 
              status: EQUIPMENT_STATUS.LOANED,
              currentLoanId: newLoan.id,
              loanHistory: [...(item.loanHistory || []), {
                loanId: newLoan.id,
                workerId: loanData.workerId,
                loanDate: newLoan.loanDate,
                expectedReturnDate: newLoan.expectedReturnDate
              }]
            }
          : item
      ));

      // Crear actividad
      const activities = JSON.parse(localStorage.getItem('app_activities') || '[]');
      activities.unshift({
        id: Date.now(),
        type: 'loan_registered',
        description: `Préstamo registrado: ${loanData.equipmentName} a ${loanData.workerName}`,
        details: newLoan,
        timestamp: new Date().toISOString()
      });
      localStorage.setItem('app_activities', JSON.stringify(activities));

      return { success: true, loan: newLoan };
    } catch (err) {
      console.error('Error registrando préstamo:', err);
      return { success: false, error: err.message };
    }
  };

  // Registrar devolución
  const registerReturn = (loanId, condition = 'good', notes = '') => {
    try {
      const loan = loans.find(l => l.id === loanId);
      if (!loan) {
        return { success: false, error: 'Préstamo no encontrado' };
      }

      const returnDate = new Date().toISOString();
      
      // Actualizar préstamo
      setLoans(prev => prev.map(item => 
        item.id === loanId 
          ? { 
              ...item, 
              actualReturnDate: returnDate,
              status: 'returned',
              returnCondition: condition,
              returnNotes: notes
            }
          : item
      ));

      // Actualizar estado del equipo
      setEquipment(prev => prev.map(item => 
        item.id === loan.equipmentId 
          ? { 
              ...item, 
              status: EQUIPMENT_STATUS.AVAILABLE,
              currentLoanId: null,
              condition: condition,
              lastMaintenance: condition === 'good' ? null : returnDate
            }
          : item
      ));

      // Crear actividad
      const activities = JSON.parse(localStorage.getItem('app_activities') || '[]');
      activities.unshift({
        id: Date.now(),
        type: 'loan_returned',
        description: `Devolución registrada: ${loan.equipmentName}`,
        details: { loanId, condition, notes },
        timestamp: returnDate
      });
      localStorage.setItem('app_activities', JSON.stringify(activities));

      return { success: true };
    } catch (err) {
      console.error('Error registrando devolución:', err);
      return { success: false, error: err.message };
    }
  };

  // Obtener equipo por ID
  const getEquipmentById = (id) => {
    return equipment.find(item => item.id === id);
  };

  // Obtener préstamos activos
  const getActiveLoans = () => {
    return loans.filter(loan => loan.status === 'active');
  };

  // Obtener préstamos por trabajador
  const getLoansByWorker = (workerId) => {
    return loans.filter(loan => loan.workerId === workerId);
  };

  // Obtener historial de préstamos por equipo
  const getLoanHistoryByEquipment = (equipmentId) => {
    return loans.filter(loan => loan.equipmentId === equipmentId)
               .sort((a, b) => new Date(b.loanDate) - new Date(a.loanDate));
  };

  // Agregar categoría
  const addCategory = (categoryData) => {
    try {
      const newCategory = {
        id: Date.now(),
        ...categoryData
      };
      
      setCategories(prev => [...prev, newCategory]);
      return { success: true, category: newCategory };
    } catch (err) {
      console.error('Error agregando categoría:', err);
      return { success: false, error: err.message };
    }
  };

  // En src/hooks/useInventory.js - AÑADIR estas funciones:

// QR Maestro para elementos sin QR físico
const generateMasterQR = (equipmentIds = []) => {
  const masterData = {
    type: 'master_equipment',
    date: new Date().toISOString(),
    equipment: equipmentIds.map(id => {
      const item = equipment.find(e => e.id === id);
      return item ? { id: item.id, name: item.name, code: item.code } : null;
    }).filter(Boolean),
    action: 'manual_checkout', // O 'manual_checkin'
    requiresConfirmation: true
  };
  
  return JSON.stringify(masterData);
};

// Sistema de identificación alternativa para elementos sin QR
const addEquipmentWithoutQR = (equipmentData) => {
  const newEquipment = {
    id: generateEquipmentId(),
    ...equipmentData,
    qrEnabled: false, // Marcar que no tiene QR físico
    manualCode: `MAN-${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
    status: EQUIPMENT_STATUS.AVAILABLE,
    createdAt: new Date().toISOString(),
    requiresManualEntry: true
  };

  setEquipment(prev => [...prev, newEquipment]);
  
  // También generar un QR digital para registro interno
  const digitalQRData = {
    type: 'digital_equipment',
    id: newEquipment.id,
    name: newEquipment.name,
    manualCode: newEquipment.manualCode,
    note: 'Solo para registro interno - No tiene QR físico'
  };
  
  return { 
    success: true, 
    equipment: newEquipment,
    digitalQRData: JSON.stringify(digitalQRData)
  };
};

// Búsqueda manual por código
const findEquipmentByManualCode = (manualCode) => {
  return equipment.find(item => 
    item.manualCode === manualCode || 
    item.code === manualCode ||
    item.id === manualCode
  );
};

// Checkout manual (para elementos sin QR)
const manualCheckout = (manualCode, workerId) => {
  const item = findEquipmentByManualCode(manualCode);
  if (!item) {
    return { success: false, error: 'Equipo no encontrado' };
  }
  
  if (item.status !== 'available') {
    return { success: false, error: 'Equipo no disponible' };
  }
  
  // Proceder con préstamo normal
  return registerLoan({
    equipmentId: item.id,
    equipmentName: item.name,
    workerId,
    isManual: true
  });
};

  return {
    // Estados
    equipment,
    categories,
    loans,
    loading,
    error,
    EQUIPMENT_STATUS,
    
    // Métodos de equipo
    addEquipment,
    updateEquipment,
    deleteEquipment,
    getEquipmentById,
    
    // Métodos de préstamos
    registerLoan,
    registerReturn,
    getActiveLoans,
    getLoansByWorker,
    getLoanHistoryByEquipment,
    
    // Métodos de categorías
    addCategory,
    
    // Helper functions
    generateEquipmentId
  };
};

export default useInventory;