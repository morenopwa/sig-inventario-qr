// src/components/Attendance/AttendanceTable/AttendanceTable.jsx
import React, { useState, useEffect } from 'react';
import './AttendanceTable.css';

const AttendanceTable = ({ workers = [], date = new Date() }) => { // ✅ Default array vacío
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Función para actualizar datos de asistencia
  const updateAttendanceData = () => {
    if (!workers || !Array.isArray(workers)) { // ✅ Validación
      console.warn('Workers no es un array válido:', workers);
      setAttendanceData([]);
      return;
    }

    console.log('🔄 Actualizando tabla con:', workers.length, 'trabajadores');
    
    // Usar los trabajadores existentes o crear datos simulados
    const formattedData = workers.map((worker, index) => {
      const isPresent = Math.random() > 0.3; // 70% probabilidad de presente
      const checkInTime = isPresent 
        ? `08:${Math.floor(Math.random() * 30).toString().padStart(2, '0')}` 
        : null;
      
      const checkOutTime = isPresent && Math.random() > 0.5
        ? `17:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`
        : null;

      return {
        id: worker.id || `temp_${index}`,
        name: worker.name || `Trabajador ${index + 1}`,
        position: worker.position || 'Operario',
        department: worker.department || 'Producción',
        checkIn: checkInTime,
        checkOut: checkOutTime,
        status: isPresent ? 'presente' : 'ausente',
        hoursWorked: checkOutTime && checkInTime 
          ? `${Math.floor(Math.random() * 4 + 7)}h ${Math.floor(Math.random() * 60)}m`
          : null
      };
    });

    setAttendanceData(formattedData);
    setLoading(false);
  };

  useEffect(() => {
    updateAttendanceData();
  }, [workers, date]); // ✅ Solo se ejecuta cuando cambian workers o date

  // Estadísticas
  const presentCount = attendanceData.filter(item => item.status === 'presente').length;
  const absentCount = attendanceData.filter(item => item.status === 'ausente').length;
  const attendanceRate = attendanceData.length > 0 
    ? Math.round((presentCount / attendanceData.length) * 100) 
    : 0;

  if (loading) {
    return (
      <div className="attendance-table loading">
        <div className="loading-spinner"></div>
        <p>Cargando datos de asistencia...</p>
      </div>
    );
  }

  return (
    <div className="attendance-table">
      <div className="table-header">
        <h3>📊 Asistencias - {date.toLocaleDateString('es-ES', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })}</h3>
        
        <div className="attendance-stats">
          <div className="stat-card present">
            <span className="stat-icon">✅</span>
            <div className="stat-content">
              <span className="stat-value">{presentCount}</span>
              <span className="stat-label">Presentes</span>
            </div>
          </div>
          
          <div className="stat-card absent">
            <span className="stat-icon">❌</span>
            <div className="stat-content">
              <span className="stat-value">{absentCount}</span>
              <span className="stat-label">Ausentes</span>
            </div>
          </div>
          
          <div className="stat-card rate">
            <span className="stat-icon">📈</span>
            <div className="stat-content">
              <span className="stat-value">{attendanceRate}%</span>
              <span className="stat-label">Asistencia</span>
            </div>
          </div>
        </div>
      </div>

      {attendanceData.length === 0 ? (
        <div className="no-data">
          <div className="no-data-icon">📭</div>
          <h4>No hay datos de asistencia</h4>
          <p>Agrega trabajadores o escanea códigos QR para registrar asistencias</p>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Puesto</th>
                <th>Departamento</th>
                <th>Entrada</th>
                <th>Salida</th>
                <th>Horas</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {attendanceData.map((record) => (
                <tr key={record.id} className={record.status}>
                  <td className="worker-id">{record.id}</td>
                  <td className="worker-name">{record.name}</td>
                  <td className="worker-position">{record.position}</td>
                  <td className="worker-department">{record.department}</td>
                  <td className={`check-in ${record.checkIn ? 'recorded' : 'missing'}`}>
                    {record.checkIn || '--:--'}
                  </td>
                  <td className={`check-out ${record.checkOut ? 'recorded' : 'missing'}`}>
                    {record.checkOut || '--:--'}
                  </td>
                  <td className="hours-worked">{record.hoursWorked || '--'}</td>
                  <td className="status-cell">
                    <span className={`status-badge ${record.status}`}>
                      {record.status === 'presente' ? '✅ Presente' : '❌ Ausente'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="table-footer">
        <div className="footer-info">
          <span className="total-records">Total: {attendanceData.length} registros</span>
          <span className="last-update">
            Actualizado: {new Date().toLocaleTimeString('es-ES', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </span>
        </div>
        <button className="btn-export" onClick={() => alert('Exportar a Excel')}>
          📥 Exportar a Excel
        </button>
      </div>
    </div>
  );
};

export default AttendanceTable;