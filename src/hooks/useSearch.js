// src/hooks/useSearch.js
import { useState, useMemo } from 'react';
import useInventory from './useInventory';
import useAttendance from './useAttendance';

const useSearch = () => {
  const { equipment, loans } = useInventory();
  const { workers } = useAttendance();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState('all'); // 'workers', 'equipment', 'loans', 'all'

  // Búsqueda integrada
  const searchResults = useMemo(() => {
    if (!searchTerm.trim()) return { workers: [], equipment: [], loans: [] };

    const term = searchTerm.toLowerCase();
    
    // Buscar trabajadores
    const filteredWorkers = searchType === 'all' || searchType === 'workers' 
      ? workers.filter(worker => 
          worker.name.toLowerCase().includes(term) ||
          worker.position?.toLowerCase().includes(term) ||
          worker.id.toLowerCase().includes(term)
        )
      : [];

    // Buscar equipos
    const filteredEquipment = searchType === 'all' || searchType === 'equipment'
      ? equipment.filter(item =>
          item.name.toLowerCase().includes(term) ||
          item.code?.toLowerCase().includes(term) ||
          item.category?.toLowerCase().includes(term) ||
          item.description?.toLowerCase().includes(term)
        )
      : [];

    // Buscar préstamos activos
    const activeLoans = loans.filter(loan => loan.status === 'active');
    const filteredLoans = searchType === 'all' || searchType === 'loans'
      ? activeLoans.filter(loan => {
          const worker = workers.find(w => w.id === loan.workerId);
          const equip = equipment.find(e => e.id === loan.equipmentId);
          
          return (
            (worker && worker.name.toLowerCase().includes(term)) ||
            (equip && equip.name.toLowerCase().includes(term)) ||
            loan.id.toLowerCase().includes(term)
          );
        })
      : [];

    return {
      workers: filteredWorkers,
      equipment: filteredEquipment,
      loans: filteredLoans,
      totalResults: filteredWorkers.length + filteredEquipment.length + filteredLoans.length
    };
  }, [searchTerm, searchType, workers, equipment, loans]);

  // Buscar qué tiene un trabajador actualmente
  const getWorkerCurrentItems = (workerId) => {
    const workerLoans = loans.filter(loan => 
      loan.workerId === workerId && loan.status === 'active'
    );
    
    return workerLoans.map(loan => {
      const equip = equipment.find(e => e.id === loan.equipmentId);
      return {
        ...loan,
        equipment: equip || { name: 'Equipo no encontrado' }
      };
    });
  };

  // Buscar quién tiene un equipo actualmente
  const getEquipmentCurrentHolder = (equipmentId) => {
    const activeLoan = loans.find(loan => 
      loan.equipmentId === equipmentId && loan.status === 'active'
    );
    
    if (!activeLoan) return null;
    
    const worker = workers.find(w => w.id === activeLoan.workerId);
    return {
      worker,
      loan: activeLoan
    };
  };

  // Generar ratios de consumo/prestamos
  const getEquipmentRatios = () => {
    const ratios = equipment.map(item => {
      const itemLoans = loans.filter(loan => loan.equipmentId === item.id);
      const activeLoansCount = itemLoans.filter(l => l.status === 'active').length;
      const totalLoansCount = itemLoans.length;
      const lastLoan = itemLoans.length > 0 
        ? new Date(Math.max(...itemLoans.map(l => new Date(l.loanDate)))) 
        : null;
      
      // Calcular frecuencia de uso (préstamos por mes)
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      const recentLoans = itemLoans.filter(l => new Date(l.loanDate) > oneMonthAgo).length;
      
      return {
        ...item,
        activeLoans: activeLoansCount,
        totalLoans: totalLoansCount,
        lastUsed: lastLoan,
        usageFrequency: recentLoans,
        availability: item.status === 'available' ? 'Disponible' : 'En uso'
      };
    });
    
    return ratios.sort((a, b) => b.usageFrequency - a.usageFrequency);
  };

  return {
    // Estados
    searchTerm,
    setSearchTerm,
    searchType,
    setSearchType,
    
    // Resultados
    searchResults,
    
    // Métodos de búsqueda específicos
    getWorkerCurrentItems,
    getEquipmentCurrentHolder,
    getEquipmentRatios,
    
    // Estadísticas
    stats: {
      totalWorkers: workers.length,
      totalEquipment: equipment.length,
      activeLoans: loans.filter(l => l.status === 'active').length,
      availableEquipment: equipment.filter(e => e.status === 'available').length
    }
  };
};

export default useSearch;