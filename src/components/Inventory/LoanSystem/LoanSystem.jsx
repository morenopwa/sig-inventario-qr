// src/components/Inventory/LoanSystem/LoanSystem.jsx
import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { 
  Search, User, Package, Calendar, Clock, 
  CheckCircle, XCircle, Filter, Download,
  UserCheck, UserX, AlertCircle
} from 'lucide-react';
import useInventory from '../../../hooks/useInventory';
import useAttendance from '../../../hooks/useAttendance';
import './LoanSystem.css';

const LoanSystem = () => {
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [expectedReturnDate, setExpectedReturnDate] = useState('');
  const [notes, setNotes] = useState('');
  const [activeTab, setActiveTab] = useState('new-loan'); // 'new-loan', 'active-loans', 'returns'
  const [filterStatus, setFilterStatus] = useState('all');
  
  const { 
    equipment, 
    loans, 
    registerLoan, 
    registerReturn,
    getActiveLoans,
    getEquipmentById,
    EQUIPMENT_STATUS
  } = useInventory();
  
  const { workers, getWorkersSortedByLastName } = useAttendance();

  // Filtrar equipos disponibles
  const availableEquipment = equipment.filter(e => 
    e.status === EQUIPMENT_STATUS.AVAILABLE
  );

  // Filtrar trabajadores
  const filteredWorkers = workers.filter(worker =>
    worker.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    worker.position?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Obtener préstamos activos
  const activeLoans = getActiveLoans();

  // Configurar fecha de retorno por defecto (7 días)
  useEffect(() => {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    setExpectedReturnDate(nextWeek.toISOString().split('T')[0]);
  }, []);

  // Manejar selección de equipo
  const handleSelectEquipment = (equipmentItem) => {
    setSelectedEquipment(equipmentItem);
    toast.success(`Equipo seleccionado: ${equipmentItem.name}`);
  };

  // Manejar selección de trabajador
  const handleSelectWorker = (worker) => {
    setSelectedWorker(worker);
    toast.success(`Trabajador seleccionado: ${worker.name}`);
  };

  // Registrar préstamo
  const handleRegisterLoan = () => {
    if (!selectedEquipment) {
      toast.error('Seleccione un equipo');
      return;
    }

    if (!selectedWorker) {
      toast.error('Seleccione un trabajador');
      return;
    }

    if (!expectedReturnDate) {
      toast.error('Ingrese fecha de retorno esperada');
      return;
    }

    const loanData = {
      equipmentId: selectedEquipment.id,
      equipmentName: selectedEquipment.name,
      equipmentCode: selectedEquipment.code,
      equipmentCategory: selectedEquipment.category,
      workerId: selectedWorker.id,
      workerName: selectedWorker.name,
      workerPosition: selectedWorker.position,
      expectedReturnDate: expectedReturnDate,
      notes: notes.trim()
    };

    const result = registerLoan(loanData);

    if (result.success) {
      toast.success(`✅ Préstamo registrado: ${selectedEquipment.name} para ${selectedWorker.name}`);
      
      // Resetear formulario
      setSelectedEquipment(null);
      setSelectedWorker(null);
      setNotes('');
      
      // Cambiar a pestaña de préstamos activos
      setActiveTab('active-loans');
    } else {
      toast.error(`❌ Error: ${result.error}`);
    }
  };

  // Registrar devolución
  const handleRegisterReturn = (loanId, equipmentId) => {
    const equipmentItem = getEquipmentById(equipmentId);
    
    toast((t) => (
      <div className="return-toast">
        <h4>🔧 Registrar Devolución</h4>
        <p>¿{equipmentItem?.name || 'Equipo'} ha sido devuelto?</p>
        <div className="condition-options">
          <label>
            <input type="radio" name="condition" value="good" defaultChecked />
            <span>✅ Buen estado</span>
          </label>
          <label>
            <input type="radio" name="condition" value="damaged" />
            <span>⚠️ Con daños</span>
          </label>
          <label>
            <input type="radio" name="condition" value="maintenance" />
            <span>🔧 Necesita mantenimiento</span>
          </label>
        </div>
        <textarea
          placeholder="Observaciones (opcional)"
          rows="2"
          className="return-notes"
        />
        <div className="toast-actions">
          <button
            onClick={() => {
              const condition = document.querySelector('input[name="condition"]:checked')?.value || 'good';
              const returnNotes = document.querySelector('.return-notes')?.value || '';
              
              const result = registerReturn(loanId, condition, returnNotes);
              if (result.success) {
                toast.success('✅ Devolución registrada exitosamente');
              } else {
                toast.error(`❌ Error: ${result.error}`);
              }
              toast.dismiss(t.id);
            }}
            className="toast-btn confirm"
          >
            Confirmar Devolución
          </button>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="toast-btn cancel"
          >
            Cancelar
          </button>
        </div>
      </div>
    ), {
      duration: 10000,
    });
  };

  // Exportar reporte de préstamos
  const exportLoansReport = () => {
    toast.success('📊 Generando reporte de préstamos...');
    // Aquí iría la lógica de exportación
  };

  // Obtener días restantes
  const getDaysRemaining = (expectedDate) => {
    const today = new Date();
    const expected = new Date(expectedDate);
    const diffTime = expected - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="loan-system-container">
      {/* Encabezado */}
      <div className="loan-header">
        <h2>🔄 Sistema de Préstamos</h2>
        <div className="header-stats">
          <div className="stat">
            <span className="stat-value">{availableEquipment.length}</span>
            <span className="stat-label">Equipos disponibles</span>
          </div>
          <div className="stat">
            <span className="stat-value">{activeLoans.length}</span>
            <span className="stat-label">Préstamos activos</span>
          </div>
          <div className="stat">
            <span className="stat-value">{workers.length}</span>
            <span className="stat-label">Trabajadores</span>
          </div>
        </div>
      </div>

      {/* Pestañas */}
      <div className="loan-tabs">
        <button
          className={`tab-btn ${activeTab === 'new-loan' ? 'active' : ''}`}
          onClick={() => setActiveTab('new-loan')}
        >
          <Package size={18} />
          Nuevo Préstamo
        </button>
        <button
          className={`tab-btn ${activeTab === 'active-loans' ? 'active' : ''}`}
          onClick={() => setActiveTab('active-loans')}
        >
          <Clock size={18} />
          Préstamos Activos ({activeLoans.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'returns' ? 'active' : ''}`}
          onClick={() => setActiveTab('returns')}
        >
          <CheckCircle size={18} />
          Devoluciones Recientes
        </button>
      </div>

      {/* Contenido según pestaña */}
      <div className="loan-content">
        {/* Pestaña 1: Nuevo Préstamo */}
        {activeTab === 'new-loan' && (
          <div className="new-loan-form">
            <div className="form-section">
              <h3><Package size={20} /> 1. Seleccionar Equipo</h3>
              <div className="equipment-grid">
                {availableEquipment.map(item => (
                  <div
                    key={item.id}
                    className={`equipment-card ${selectedEquipment?.id === item.id ? 'selected' : ''}`}
                    onClick={() => handleSelectEquipment(item)}
                  >
                    <div className="equipment-icon">
                      <Package size={24} />
                    </div>
                    <div className="equipment-info">
                      <strong>{item.name}</strong>
                      <span className="equipment-code">{item.code}</span>
                      <span className="equipment-category">{item.category}</span>
                    </div>
                    <div className="equipment-status available">
                      DISPONIBLE
                    </div>
                  </div>
                ))}
              </div>
              
              {availableEquipment.length === 0 && (
                <div className="empty-state">
                  <Package size={48} />
                  <p>No hay equipos disponibles para préstamo</p>
                </div>
              )}
            </div>

            <div className="form-section">
              <h3><User size={20} /> 2. Seleccionar Trabajador</h3>
              
              {/* Barra de búsqueda */}
              <div className="search-box">
                <Search size={18} />
                <input
                  type="text"
                  placeholder="Buscar trabajador por nombre o cargo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
              </div>

              {/* Lista de trabajadores */}
              <div className="workers-list">
                {filteredWorkers.map(worker => (
                  <div
                    key={worker.id}
                    className={`worker-card ${selectedWorker?.id === worker.id ? 'selected' : ''}`}
                    onClick={() => handleSelectWorker(worker)}
                  >
                    <div className="worker-avatar">
                      {worker.name.charAt(0)}
                    </div>
                    <div className="worker-info">
                      <strong>{worker.name}</strong>
                      <span>{worker.position || 'Sin cargo'}</span>
                      <small>ID: {worker.id}</small>
                    </div>
                    <div className="worker-status">
                      {worker.status === 'active' ? (
                        <span className="status-active">
                          <UserCheck size={14} /> Activo
                        </span>
                      ) : (
                        <span className="status-inactive">
                          <UserX size={14} /> Inactivo
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              {filteredWorkers.length === 0 && (
                <div className="empty-state">
                  <User size={48} />
                  <p>No se encontraron trabajadores</p>
                </div>
              )}
            </div>

            <div className="form-section">
              <h3><Calendar size={20} /> 3. Detalles del Préstamo</h3>
              
              <div className="loan-details">
                <div className="detail-row">
                  <label>Fecha de retorno esperada:</label>
                  <input
                    type="date"
                    value={expectedReturnDate}
                    onChange={(e) => setExpectedReturnDate(e.target.value)}
                    className="date-input"
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                
                <div className="detail-row">
                  <label>Observaciones:</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Ej: Para uso en obra de construcción, manejar con cuidado..."
                    rows="3"
                    className="notes-textarea"
                  />
                </div>
                
                {/* Resumen del préstamo */}
                {(selectedEquipment || selectedWorker) && (
                  <div className="loan-summary">
                    <h4>📋 Resumen del Préstamo</h4>
                    {selectedEquipment && (
                      <div className="summary-item">
                        <strong>Equipo:</strong>
                        <span>{selectedEquipment.name} ({selectedEquipment.code})</span>
                      </div>
                    )}
                    {selectedWorker && (
                      <div className="summary-item">
                        <strong>Trabajador:</strong>
                        <span>{selectedWorker.name} - {selectedWorker.position}</span>
                      </div>
                    )}
                    {expectedReturnDate && (
                      <div className="summary-item">
                        <strong>Retorno esperado:</strong>
                        <span>
                          {new Date(expectedReturnDate).toLocaleDateString('es-ES')}
                          ({getDaysRemaining(expectedReturnDate)} días)
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Botón de registro */}
            <div className="form-actions">
              <button
                className="btn-clear"
                onClick={() => {
                  setSelectedEquipment(null);
                  setSelectedWorker(null);
                  setNotes('');
                }}
                disabled={!selectedEquipment && !selectedWorker}
              >
                <XCircle size={18} />
                Limpiar Selección
              </button>
              
              <button
                className="btn-register"
                onClick={handleRegisterLoan}
                disabled={!selectedEquipment || !selectedWorker}
              >
                <CheckCircle size={18} />
                Registrar Préstamo
              </button>
            </div>
          </div>
        )}

        {/* Pestaña 2: Préstamos Activos */}
        {activeTab === 'active-loans' && (
          <div className="active-loans">
            <div className="table-header">
              <div className="table-actions">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="filter-select"
                >
                  <option value="all">Todos los préstamos</option>
                  <option value="due_soon">Por vencer (≤3 días)</option>
                  <option value="overdue">Vencidos</option>
                  <option value="normal">En tiempo</option>
                </select>
                <button
                  className="btn-export"
                  onClick={exportLoansReport}
                >
                  <Download size={16} />
                  Exportar
                </button>
              </div>
            </div>

            <div className="loans-table">
              {activeLoans.length > 0 ? (
                <table>
                  <thead>
                    <tr>
                      <th>Equipo</th>
                      <th>Trabajador</th>
                      <th>Fecha Préstamo</th>
                      <th>Retorno Esperado</th>
                      <th>Días Restantes</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeLoans.map(loan => {
                      const daysRemaining = getDaysRemaining(loan.expectedReturnDate);
                      const isOverdue = daysRemaining < 0;
                      const isDueSoon = daysRemaining <= 3 && daysRemaining >= 0;
                      
                      return (
                        <tr 
                          key={loan.id}
                          className={isOverdue ? 'overdue' : isDueSoon ? 'due-soon' : ''}
                        >
                          <td>
                            <div className="equipment-cell">
                              <Package size={16} />
                              <div>
                                <strong>{loan.equipmentName}</strong>
                                <small>{loan.equipmentCode}</small>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div className="worker-cell">
                              <User size={16} />
                              <div>
                                <strong>{loan.workerName}</strong>
                                <small>{loan.workerPosition}</small>
                              </div>
                            </div>
                          </td>
                          <td>
                            {new Date(loan.loanDate).toLocaleDateString('es-ES')}
                          </td>
                          <td>
                            {new Date(loan.expectedReturnDate).toLocaleDateString('es-ES')}
                          </td>
                          <td>
                            <span className={`days-badge ${isOverdue ? 'overdue' : isDueSoon ? 'warning' : 'normal'}`}>
                              {isOverdue ? `+${Math.abs(daysRemaining)} días` : `${daysRemaining} días`}
                            </span>
                          </td>
                          <td>
                            <div className="action-buttons">
                              <button
                                className="btn-action return"
                                onClick={() => handleRegisterReturn(loan.id, loan.equipmentId)}
                                title="Registrar devolución"
                              >
                                <CheckCircle size={14} />
                                Devolver
                              </button>
                              <button
                                className="btn-action extend"
                                title="Extender préstamo"
                              >
                                <Calendar size={14} />
                                Extender
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <div className="empty-state">
                  <CheckCircle size={48} />
                  <h4>No hay préstamos activos</h4>
                  <p>Todos los equipos están disponibles en inventario</p>
                </div>
              )}
            </div>

            {/* Estadísticas de préstamos */}
            <div className="loans-stats">
              <div className="stat-card">
                <div className="stat-icon overdue">
                  <AlertCircle size={20} />
                </div>
                <div>
                  <span className="stat-value">
                    {activeLoans.filter(l => getDaysRemaining(l.expectedReturnDate) < 0).length}
                  </span>
                  <span className="stat-label">Vencidos</span>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon warning">
                  <Clock size={20} />
                </div>
                <div>
                  <span className="stat-value">
                    {activeLoans.filter(l => {
                      const days = getDaysRemaining(l.expectedReturnDate);
                      return days <= 3 && days >= 0;
                    }).length}
                  </span>
                  <span className="stat-label">Por vencer</span>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon normal">
                  <CheckCircle size={20} />
                </div>
                <div>
                  <span className="stat-value">
                    {activeLoans.filter(l => getDaysRemaining(l.expectedReturnDate) > 3).length}
                  </span>
                  <span className="stat-label">En tiempo</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Pestaña 3: Devoluciones Recientes */}
        {activeTab === 'returns' && (
          <div className="recent-returns">
            <h3>📅 Devoluciones de los últimos 7 días</h3>
            {/* Aquí iría la lista de devoluciones recientes */}
            <div className="empty-state">
              <CheckCircle size={48} />
              <p>No hay devoluciones recientes para mostrar</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoanSystem;