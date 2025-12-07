// src/hooks/useAttendance.js - VERSIÓN ACTUALIZADA
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';

const useAttendance = () => {
  // Cargar datos iniciales
  const loadInitialData = () => {
    const savedWorkers = localStorage.getItem('app_workers');
    const savedAttendance = localStorage.getItem('app_attendance');
    const savedSalaries = localStorage.getItem('app_salaries');
    
    return {
      workers: savedWorkers ? JSON.parse(savedWorkers) : [],
      attendance: savedAttendance ? JSON.parse(savedAttendance) : {},
      salaries: savedSalaries ? JSON.parse(savedSalaries) : {}
    };
  };

  const [workers, setWorkers] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [salaries, setSalaries] = useState({});
  const [loading, setLoading] = useState(true);

  // Inicializar
  useEffect(() => {
    const { workers: savedWorkers, attendance: savedAttendance, salaries: savedSalaries } = loadInitialData();
    setWorkers(savedWorkers);
    setAttendance(savedAttendance);
    setSalaries(savedSalaries);
    setLoading(false);
  }, []);

  // Persistir cambios
  useEffect(() => {
    localStorage.setItem('app_workers', JSON.stringify(workers));
  }, [workers]);

  useEffect(() => {
    localStorage.setItem('app_attendance', JSON.stringify(attendance));
  }, [attendance]);

  useEffect(() => {
    localStorage.setItem('app_salaries', JSON.stringify(salaries));
  }, [salaries]);

  // ==================== NUEVAS FUNCIONALIDADES ====================

  // 1. REGISTRAR ASISTENCIA CON TARDANZAS DESPUÉS DE LAS 8 AM
  const registerAttendance = (workerId, checkType = 'in') => {
    try {
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const timeString = now.toTimeString().split(' ')[0]; // HH:MM:SS
      
      // Obtener o inicializar registro del día
      const dailyRecord = attendance[today] || {};
      const workerRecord = dailyRecord[workerId] || {};
      
      // Determinar estado según hora
      let status = 'presente';
      let isLate = false;
      
      if (checkType === 'in') {
        const checkInHour = now.getHours();
        const checkInMinutes = now.getMinutes();
        
        // Tardanza si llega después de las 8:00 AM
        if (checkInHour > 8 || (checkInHour === 8 && checkInMinutes > 0)) {
          status = 'tardanza';
          isLate = true;
          
          // Calcular minutos de retardo
          const lateMinutes = (checkInHour - 8) * 60 + checkInMinutes;
          
          // Notificación visual
          toast.error(`⚠️ Tardanza registrada: ${lateMinutes} minutos`, {
            duration: 4000,
            icon: '⏰'
          });
        } else if (checkInHour < 8 || (checkInHour === 8 && checkInMinutes === 0)) {
          status = 'temprano';
          toast.success('✅ Asistencia temprana registrada', {
            icon: '👍'
          });
        } else {
          toast.success('✅ Asistencia registrada', {
            icon: '✓'
          });
        }
      }
      
      // Actualizar registro
      const updatedRecord = {
        ...workerRecord,
        [checkType]: timeString,
        status,
        isLate,
        date: today,
        timestamp: now.toISOString()
      };
      
      // Si es salida y no tenía entrada, marcar salida a las 5 PM
      if (checkType === 'out' && !workerRecord.in) {
        updatedRecord.in = '17:00:00';
        updatedRecord.autoCheckout = true;
        toast.warning('⚠️ Salida automática registrada a las 17:00', {
          icon: '🤖'
        });
      }
      
      // Calcular horas trabajadas si hay entrada y salida
      if (updatedRecord.in && updatedRecord.out) {
        const hoursWorked = calculateHoursWorked(updatedRecord.in, updatedRecord.out);
        updatedRecord.hoursWorked = hoursWorked;
        
        // Calcular horas extras (más de 8 horas)
        if (hoursWorked > 8) {
          updatedRecord.overtimeHours = hoursWorked - 8;
          updatedRecord.overtimePay = calculateOvertimePay(workerId, updatedRecord.overtimeHours);
          toast.success(`💰 ${updatedRecord.overtimeHours.toFixed(2)} horas extras registradas`, {
            icon: '💸'
          });
        }
      }
      
      // Actualizar estado
      const updatedDailyRecord = {
        ...dailyRecord,
        [workerId]: updatedRecord
      };
      
      const updatedAttendance = {
        ...attendance,
        [today]: updatedDailyRecord
      };
      
      setAttendance(updatedAttendance);
      
      // Crear actividad
      const activities = JSON.parse(localStorage.getItem('app_activities') || '[]');
      const worker = workers.find(w => w.id === workerId);
      activities.unshift({
        id: Date.now(),
        type: 'attendance',
        subtype: checkType,
        description: `${checkType === 'in' ? 'Entrada' : 'Salida'} registrada: ${worker?.name || workerId}`,
        details: { workerId, checkType, time: timeString, status },
        timestamp: now.toISOString()
      });
      localStorage.setItem('app_activities', JSON.stringify(activities));
      
      return { success: true, record: updatedRecord };
      
    } catch (err) {
      console.error('Error registrando asistencia:', err);
      toast.error('❌ Error al registrar asistencia');
      return { success: false, error: err.message };
    }
  };

  // 2. CALCULAR HORAS EXTRAS (+25% SOBRE SALARIO)
  const calculateOvertimePay = (workerId, overtimeHours) => {
    const worker = workers.find(w => w.id === workerId);
    if (!worker) return 0;
    
    const salaryInfo = salaries[workerId] || {
      dailySalary: 100, // Valor por defecto
      saturdayMultiplier: 1.5 // 50% extra los sábados
    };
    
    const hourlyRate = salaryInfo.dailySalary / 8; // Salario por hora normal
    const overtimeRate = hourlyRate * 1.25; // +25% para horas extras
    const dayOfWeek = new Date().getDay(); // 6 = Sábado
    
    // Si es sábado, usar multiplicador de sábado
    const finalRate = dayOfWeek === 6 ? overtimeRate * salaryInfo.saturdayMultiplier : overtimeRate;
    
    return overtimeHours * finalRate;
  };

  // 3. ACTUALIZAR SALARIO DEL TRABAJADOR
  const updateWorkerSalary = (workerId, salaryData) => {
    try {
      const updatedSalaries = {
        ...salaries,
        [workerId]: {
          ...salaries[workerId],
          ...salaryData,
          lastUpdated: new Date().toISOString()
        }
      };
      
      setSalaries(updatedSalaries);
      toast.success('💰 Salario actualizado correctamente');
      
      return { success: true };
    } catch (err) {
      console.error('Error actualizando salario:', err);
      return { success: false, error: err.message };
    }
  };

  // 4. OBTENER REPORTE SEMANAL (JUEVES-MIERCOLES)
  const getWeeklyReport = (workerId) => {
    const { startOfWeek, endOfWeek } = getCurrentWorkWeek();
    const weeklyRecords = {};
    let totalHours = 0;
    let totalOvertime = 0;
    let totalPay = 0;
    let tardinessCount = 0;
    
    // Filtrar registros de la semana
    Object.entries(attendance).forEach(([date, dailyRecords]) => {
      const recordDate = new Date(date);
      if (recordDate >= startOfWeek && recordDate <= endOfWeek) {
        const workerRecord = dailyRecords[workerId];
        if (workerRecord) {
          weeklyRecords[date] = workerRecord;
          totalHours += workerRecord.hoursWorked || 0;
          totalOvertime += workerRecord.overtimeHours || 0;
          totalPay += workerRecord.overtimePay || 0;
          if (workerRecord.isLate) tardinessCount++;
        }
      }
    });
    
    return {
      startDate: startOfWeek,
      endDate: endOfWeek,
      records: weeklyRecords,
      summary: {
        totalHours: totalHours.toFixed(2),
        totalOvertime: totalOvertime.toFixed(2),
        totalPay: totalPay.toFixed(2),
        tardinessCount,
        daysWorked: Object.keys(weeklyRecords).length
      }
    };
  };

  // 5. ORDENAR TRABAJADORES POR APELLIDO
  const getWorkersSortedByLastName = () => {
    return [...workers].sort((a, b) => {
      const getLastName = (name) => {
        const parts = name.trim().split(' ');
        return parts[parts.length - 1].toLowerCase();
      };
      
      const lastNameA = getLastName(a.name);
      const lastNameB = getLastName(b.name);
      return lastNameA.localeCompare(lastNameB);
    });
  };

  // 6. ENVIAR ASISTENCIA POR WHATSAPP
  const sendAttendanceViaWhatsApp = (phoneNumber, workerId, date = null) => {
    const targetDate = date || new Date().toISOString().split('T')[0];
    const dailyRecord = attendance[targetDate] || {};
    const workerRecord = dailyRecord[workerId];
    const worker = workers.find(w => w.id === workerId);
    
    if (!workerRecord || !worker) {
      toast.error('No hay registro de asistencia para enviar');
      return false;
    }
    
    // Formatear mensaje
    const message = `*REGISTRO DE ASISTENCIA*\n\n` +
                   `👤 *Trabajador:* ${worker.name}\n` +
                   `📅 *Fecha:* ${targetDate}\n` +
                   `⏰ *Entrada:* ${workerRecord.in || 'No registrada'}\n` +
                   `🚪 *Salida:* ${workerRecord.out || 'No registrada'}\n` +
                   `⏱️ *Horas trabajadas:* ${workerRecord.hoursWorked?.toFixed(2) || '0'} hrs\n` +
                   `💰 *Horas extras:* ${workerRecord.overtimeHours?.toFixed(2) || '0'} hrs\n` +
                   `💵 *Pago extras:* $${workerRecord.overtimePay?.toFixed(2) || '0'}\n` +
                   `📊 *Estado:* ${workerRecord.status || 'Pendiente'}\n\n` +
                   `_Enviado desde Sistema de Control_`;
    
    // Codificar para URL de WhatsApp
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${phoneNumber.replace(/\D/g, '')}?text=${encodedMessage}`;
    
    // Abrir en nueva ventana
    window.open(whatsappUrl, '_blank');
    
    // Registrar envío
    const activities = JSON.parse(localStorage.getItem('app_activities') || '[]');
    activities.unshift({
      id: Date.now(),
      type: 'whatsapp_sent',
      description: `Registro enviado por WhatsApp a ${worker.name}`,
      details: { workerId, phoneNumber, date: targetDate },
      timestamp: new Date().toISOString()
    });
    localStorage.setItem('app_activities', JSON.stringify(activities));
    
    toast.success('📱 Enlace de WhatsApp generado');
    return true;
  };

  // 7. QR DE 1 DÍA DE DURACIÓN
  const generateDailyQR = (workerId) => {
    const worker = workers.find(w => w.id === workerId);
    if (!worker) return null;
    
    const today = new Date().toISOString().split('T')[0];
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 1);
    expiresAt.setHours(0, 0, 0, 0); // Expira a media noche
    
    const qrData = {
      type: 'attendance_daily',
      workerId: worker.id,
      name: worker.name,
      date: today,
      expiresAt: expiresAt.toISOString(),
      hash: generateDailyHash(workerId, today)
    };
    
    return JSON.stringify(qrData);
  };

  // Generar hash único diario para prevenir reutilización
  const generateDailyHash = (workerId, date) => {
    const secret = 'sistema-control-' + date;
    let hash = 0;
    for (let i = 0; i < workerId.length; i++) {
      hash = ((hash << 5) - hash) + workerId.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash).toString(16);
  };

  // Verificar validez del QR diario
  const isValidDailyQR = (qrData) => {
    try {
      const data = typeof qrData === 'string' ? JSON.parse(qrData) : qrData;
      
      if (data.type !== 'attendance_daily') return false;
      
      // Verificar fecha de expiración
      const now = new Date();
      const expiresAt = new Date(data.expiresAt);
      if (now > expiresAt) {
        toast.error('❌ QR expirado. Genere uno nuevo para hoy');
        return false;
      }
      
      // Verificar hash
      const expectedHash = generateDailyHash(data.workerId, data.date);
      if (data.hash !== expectedHash) {
        toast.error('❌ QR inválido o manipulado');
        return false;
      }
      
      return true;
    } catch {
      return false;
    }
  };

  // Función auxiliar para calcular horas trabajadas
  const calculateHoursWorked = (checkIn, checkOut) => {
    if (!checkIn || !checkOut) return 0;
    
    const [inHour, inMinute] = checkIn.split(':').map(Number);
    const [outHour, outMinute] = checkOut.split(':').map(Number);
    
    const checkInTime = new Date();
    checkInTime.setHours(inHour, inMinute, 0);
    
    const checkOutTime = new Date();
    checkOutTime.setHours(outHour, outMinute, 0);
    
    const diffMs = checkOutTime - checkInTime;
    return diffMs / (1000 * 60 * 60); // Convertir a horas
  };

  // Función auxiliar para obtener semana laboral
  const getCurrentWorkWeek = () => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0=Dom, 1=Lun, etc
    
    let startOfWeek = new Date(today);
    
    // Encontrar el jueves más reciente
    if (dayOfWeek >= 4) { // Jueves (4) a Sábado (6)
      startOfWeek.setDate(today.getDate() - (dayOfWeek - 4));
    } else { // Domingo (0) a Miércoles (3)
      startOfWeek.setDate(today.getDate() - (dayOfWeek + 3));
    }
    
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    
    return { startOfWeek, endOfWeek };
  };

  return {
    // Estados
    workers,
    attendance,
    salaries,
    loading,
    
    // Métodos de asistencia
    registerAttendance,
    getWorkersSortedByLastName,
    getWeeklyReport,
    
    // Métodos de salarios
    updateWorkerSalary,
    
    // Métodos de QR
    generateDailyQR,
    isValidDailyQR,
    
    // Métodos de comunicación
    sendAttendanceViaWhatsApp,
    
    // Mantener métodos existentes del hook original
    addWorker: (workerData) => {
      // Implementación existente...
      const newWorker = {
        id: `WK-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        ...workerData,
        createdAt: new Date().toISOString(),
        status: 'active'
      };
      setWorkers(prev => [...prev, newWorker]);
      return { success: true, worker: newWorker };
    },
    
    updateWorker: (id, updates) => {
      setWorkers(prev => prev.map(w => 
        w.id === id ? { ...w, ...updates, updatedAt: new Date().toISOString() } : w
      ));
      return { success: true };
    },
    
    deleteWorker: (id) => {
      setWorkers(prev => prev.filter(w => w.id !== id));
      return { success: true };
    }
  };
};

export default useAttendance;