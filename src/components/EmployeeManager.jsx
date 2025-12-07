import { useState, useEffect } from 'react';

const EmployeeManager = () => {
  const [employees, setEmployees] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  
  // Formulario nuevo empleado
  const [newEmployee, setNewEmployee] = useState({
    name: '',
    email: '',
    position: '',
    department: '',
    role: 'employee',
    password: 'temporal123'
  });

  // Cargar empleados iniciales
  useEffect(() => {
    const initialEmployees = [
      { id: 1, name: 'Juan Pérez', email: 'juan@empresa.com', position: 'Desarrollador', department: 'TI', role: 'employee', status: 'active' },
      { id: 2, name: 'María García', email: 'maria@empresa.com', position: 'Diseñadora', department: 'UX', role: 'employee', status: 'active' },
      { id: 3, name: 'Carlos López', email: 'carlos@empresa.com', position: 'Líder de Proyecto', department: 'TI', role: 'manager', status: 'active' }
    ];
    setEmployees(initialEmployees);
  }, []);

  const handleAddEmployee = () => {
    if (!newEmployee.name || !newEmployee.email) {
      alert('Nombre y email son obligatorios');
      return;
    }

    const employee = {
      id: employees.length + 1,
      ...newEmployee,
      status: 'active',
      joinDate: new Date().toISOString().split('T')[0]
    };

    setEmployees([...employees, employee]);
    setNewEmployee({
      name: '',
      email: '',
      position: '',
      department: '',
      role: 'employee',
      password: 'temporal123'
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

  const handleResetPassword = (id) => {
    const newPassword = Math.random().toString(36).slice(-8);
    setEmployees(employees.map(emp => 
      emp.id === id ? { ...emp, password: newPassword } : emp
    ));
    alert(`Nueva contraseña: ${newPassword}`);
  };

  return (
    <div className="employee-manager">
      <div className="section-header">
        <h2>Gestión de Empleados</h2>
        <button 
          className="btn-primary"
          onClick={() => {
            setEditingEmployee(null);
            setShowForm(!showForm);
          }}
        >
          {showForm ? 'Cancelar' : '➕ Agregar Empleado'}
        </button>
      </div>

      {/* Formulario */}
      {showForm && (
        <div className="employee-form">
          <h3>{editingEmployee ? 'Editar Empleado' : 'Nuevo Empleado'}</h3>
          
          <div className="form-grid">
            <input
              type="text"
              placeholder="Nombre completo"
              value={newEmployee.name}
              onChange={(e) => setNewEmployee({...newEmployee, name: e.target.value})}
            />
            <input
              type="email"
              placeholder="Email corporativo"
              value={newEmployee.email}
              onChange={(e) => setNewEmployee({...newEmployee, email: e.target.value})}
            />
            <input
              type="text"
              placeholder="Puesto"
              value={newEmployee.position}
              onChange={(e) => setNewEmployee({...newEmployee, position: e.target.value})}
            />
            <input
              type="text"
              placeholder="Departamento"
              value={newEmployee.department}
              onChange={(e) => setNewEmployee({...newEmployee, department: e.target.value})}
            />
            <select
              value={newEmployee.role}
              onChange={(e) => setNewEmployee({...newEmployee, role: e.target.value})}
            >
              <option value="employee">Empleado</option>
              <option value="manager">Gerente</option>
              <option value="admin">Administrador</option>
            </select>
          </div>

          <div className="form-actions">
            <button 
              className="btn-primary"
              onClick={editingEmployee ? handleUpdateEmployee : handleAddEmployee}
            >
              {editingEmployee ? 'Actualizar' : 'Guardar'}
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

      {/* Lista de empleados */}
      <div className="employees-table">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Email</th>
              <th>Puesto</th>
              <th>Departamento</th>
              <th>Rol</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {employees.map(employee => (
              <tr key={employee.id}>
                <td>{employee.id}</td>
                <td>{employee.name}</td>
                <td>{employee.email}</td>
                <td>{employee.position}</td>
                <td>{employee.department}</td>
                <td>
                  <span className={`role-badge ${employee.role}`}>
                    {employee.role}
                  </span>
                </td>
                <td className="actions">
                  <button 
                    className="btn-icon"
                    onClick={() => handleEditEmployee(employee)}
                    title="Editar"
                  >
                    ✏️
                  </button>
                  <button 
                    className="btn-icon"
                    onClick={() => handleResetPassword(employee.id)}
                    title="Restablecer contraseña"
                  >
                    🔑
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
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};