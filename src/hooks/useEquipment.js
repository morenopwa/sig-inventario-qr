import { useState, useEffect } from 'react';
import { equipmentAPI } from '../services/api'; // ✅ Ya está correcto

export const useEquipment = () => {
  const [equipments, setEquipments] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchEquipments = async () => {
    try {
      const data = await equipmentAPI.getAll();
      setEquipments(data);
    } catch (error) {
      console.error('Error cargando equipos:', error);
    }
  };

  const addEquipment = async (equipmentData) => {
    setLoading(true);
    try {
      const result = await equipmentAPI.create(equipmentData);
      if (result.success) {
        await fetchEquipments();
        return { success: true, message: 'Equipo agregado correctamente' };
      }
      return { success: false, message: result.message };
    } catch (error) {
      return { success: false, message: 'Error agregando equipo' };
    } finally {
      setLoading(false);
    }
  };

  const assignUser = async (qrCode, personName) => {
    setLoading(true);
    try {
      const result = await equipmentAPI.loan(qrCode, personName);
      if (result.success) {
        await fetchEquipments();
        return { success: true, message: 'Persona asignada correctamente' };
      }
      return { success: false, message: result.message };
    } catch (error) {
      return { success: false, message: 'Error asignando persona' };
    } finally {
      setLoading(false);
    }
  };

  const removeAssignment = async (qrCode) => {
    setLoading(true);
    try {
      const result = await equipmentAPI.return(qrCode);
      if (result.success) {
        await fetchEquipments();
        return { success: true, message: 'Asignación removida correctamente' };
      }
      return { success: false, message: result.message };
    } catch (error) {
      return { success: false, message: 'Error removiendo asignación' };
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEquipments();
  }, []);

  return {
    equipments,
    loading,
    fetchEquipments,
    addEquipment,
    assignUser,
    removeAssignment
  };
};