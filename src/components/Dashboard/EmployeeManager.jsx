// src/components/Dashboard/EmployeeManager.jsx
import { useState, useEffect } from 'react';

const EmployeeManager = () => {
  const [employees, setEmployees] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Formulario nuevo empleado
  const [newEmployee, setNewEmployee] = useState({
    name: '',
    email: '',
    position: '',
    department: '',
    role: 'employee',
    status: 'active'
  });

  // Cargar empleados iniciales
  useEffect(() => {
    const initialEmployees = [
      { id: 1, name: 'Juan Pérez', email: 'juan@empresa.com', position: 'Desarrollador', department: 'TI', role: 'employee', status: 'active', joinDate: '2024-01-15' },
      { id: 2, name: 'María García', email: 'maria@empresa.com', position: 'Diseñadora', department: 'UX', role: 'employee', status: 'active', joinDate: '2024-02-20' },
      { id: 3, name: 'Carlos López', email: 'carlos@empresa.com', position: 'Líder de Proyecto', department: 'TI', role: 'manager', status: 'active', joinDate: '2023-11-10' },
      { id: 4, name: 'Ana Rodríguez', email: 'ana@empresa.com', position: 'Analista', department: 'Finanzas', role: 'employee', status: 'inactive', joinDate: '2024-03-05' }
    ];
    setEmployees(initialEmployees);
  }, []);

  // Filtrar empleados por búsqueda
  const filteredEmployees = employees.filter(employee =>
    employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.position.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddEmployee = () => {
    if (!newEmployee.name || !newEmployee.email) {
      alert('Nombre y email son obligatorios');
      return;
    }

    const employee = {
      id: employees.length + 1,
      ...newEmployee,
      joinDate: new Date().toISOString().split('T')[0]
    };

    setEmployees([...employees, employee]);
    setNewEmployee({
      name: '',
      email: '',
      position: '',
      department: '',
      role: 'employee',
      status: 'active'
    });
    setShowForm(false);
  };

  const handleEditEmployee = (employee) => {
    setEditingEmployee(employee);
    setNewEmployee(employee);
    setShowForm(true);
  };

  const handleUpdateEmployee = () => {
    setEmployees(employees.map(emp => 
      emp.id === editingEmployee.id ? { ...emp, ...newEmployee } : emp
    ));
    setEditingEmployee(null);
    setShowForm(false);
  };

  const handleDeleteEmployee = (id) => {
    if (window.confirm('¿Estás seguro de eliminar este empleado?')) {
      setEmployees(employees.filter(emp => emp.id !== id));
    }
  };

  const handleStatusToggle = (id) => {
    setEmployees(employees.map(emp => 
      emp.id === id ? { ...emp, status: emp.status === 'active' ? 'inactive' : 'active' } : emp
    ));
  };

  const departments = ['TI', 'UX', 'Finanzas', 'Ventas', 'Marketing', 'RH', 'Operaciones'];
  const positions = ['Desarrollador', 'Diseñador', 'Analista', 'Gerente', 'Líder de Proyecto', 'Coordinador', 'Asistente'];

  return (
    <div className="employee-manager">
      <div className="section-header">
        <h2>Gestión de Empleados</h2>
        <div className="header-actions">
          <div className="search-box">
            <input
              type="text"
              placeholder="Buscar empleados..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <span className="search-icon">🔍</span>
          </div>
          <button 
            className="btn-primary"
            onClick={() => {
              setEditingEmployee(null);
              setNewEmployee({
                name: '',
                email: '',
                position: '',
                department: '',
                role: 'employee',
                status: 'active'
              });
              setShowForm(!showForm);
            }}
          >
            {showForm ? 'Cancelar' : '➕ Agregar Empleado'}
          </button>
        </div>
      </div>

      {/* Formulario */}
      {showForm && (
        <div className="employee-form">
          <h3>{editingEmployee ? 'Editar Empleado' : 'Nuevo Empleado'}</h3>
          
          <div className="form-grid">
            <div className="form-group">
              <label>Nombre completo *</label>
              <input
                type="text"
                placeholder="Ej: Juan Pérez"
                value={newEmployee.name}
                onChange={(e) => setNewEmployee({...newEmployee, name: e.target.value})}
                required
              />
            </div>
            
            <div className="form-group">
              <label>Email corporativo *</label>
              <input
                type="email"
                placeholder="ejemplo@empresa.com"
                value={newEmployee.email}
                onChange={(e) => setNewEmployee({...newEmployee, email: e.target.value})}
                required
              />
            </div>
            
            <div className="form-group">
              <label>Puesto</label>
              <select
                value={newEmployee.position}
                onChange={(e) => setNewEmployee({...newEmployee, position: e.target.value})}
              >
                <option value="">Seleccionar puesto</option>
                {positions.map(pos => (
                  <option key={pos} value={pos}>{pos}</option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label>Departamento</label>
              <select
                value={newEmployee.department}
                onChange={(e) => setNewEmployee({...newEmployee, department: e.target.value})}
              >
                <option value="">Seleccionar departamento</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label>Rol</label>
              <select
                value={newEmployee.role}
                onChange={(e) => setNewEmployee({...newEmployee, role: e.target.value})}
              >
                <option value="employee">Empleado</option>
                <option value="manager">Gerente</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
            
            <div className="form-group">
              <label>Estado</label>
              <select
                value={newEmployee.status}
                onChange={(e) => setNewEmployee({...newEmployee, status: e.target.value})}
              >
                <option value="active">Activo</option>
                <option value="inactive">Inactivo</option>
              </select>
            </div>
          </div>

          <div className="form-actions">
            <button 
              className="btn-primary"
              onClick={editingEmployee ? handleUpdateEmployee : handleAddEmployee}
            >
              {editingEmployee ? 'Actualizar' : 'Guardar Empleado'}
            </button>
            <button 
              className="btn-secondary"
              onClick={() => setShowForm(false)}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Estadísticas */}
      <div className="employee-stats">
        <div className="stat-card">
          <span className="stat-number">{employees.length}</span>
          <span className="stat-label">Total Empleados</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">{employees.filter(e => e.status === 'active').length}</span>
          <span className="stat-label">Activos</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">{employees.filter(e => e.role === 'admin').length}</span>
          <span className="stat-label">Administradores</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">{departments.length}</span>
          <span className="stat-label">Departamentos</span>
        </div>
      </div>

      {/* Lista de empleados */}
      <div className="employees-table-container">
        <table className="employees-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Email</th>
              <th>Puesto</th>
              <th>Departamento</th>
              <th>Rol</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredEmployees.length > 0 ? (
              filteredEmployees.map(employee => (
                <tr key={employee.id}>
                  <td>#{employee.id}</td>
                  <td>
                    <div className="employee-info">
                      <div className="avatar">{employee.name.charAt(0)}</div>
                      <div>
                        <div className="employee-name">{employee.name}</div>
                        <div className="employee-date">Ingreso: {employee.joinDate}</div>
                      </div>
                    </div>
                  </td>
                  <td>{employee.email}</td>
                  <td>{employee.position}</td>
                  <td>
                    <span className="department-badge">{employee.department}</span>
                  </td>
                  <td>
                    <span className={`role-badge ${employee.role}`}>
                      {employee.role}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge ${employee.status}`}>
                      {employee.status === 'active' ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="actions">
                    <button 
                      className="btn-icon edit"
                      onClick={() => handleEditEmployee(employee)}
                      title="Editar"
                    >
                      ✏️
                    </button>
                    <button 
                      className={`btn-icon ${employee.status === 'active' ? 'deactivate' : 'activate'}`}
                      onClick={() => handleStatusToggle(employee.id)}
                      title={employee.status === 'active' ? 'Desactivar' : 'Activar'}
                    >
                      {employee.status === 'active' ? '⏸️' : '▶️'}
                    </button>
                    <button 
                      className="btn-icon delete"
                      onClick={() => handleDeleteEmployee(employee.id)}
                      title="Eliminar"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" className="no-results">
                  🔍 No se encontraron empleados
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EmployeeManager;