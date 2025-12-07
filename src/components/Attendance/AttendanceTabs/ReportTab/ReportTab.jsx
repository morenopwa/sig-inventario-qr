// src/components/Attendance/AttendanceTabs/ReportTab/ReportTab.jsx
import React, { useState } from 'react';
import './ReportTab.css';

const ReportTab = ({ workers = [] }) => {
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportData, setReportData] = useState([]);

  const generateReport = () => {
    if (!workers || workers.length === 0) {
      alert('No hay trabajadores para generar reporte');
      return;
    }

    // Simular datos de reporte
    const simulatedData = workers.map(worker => {
      const attendanceDays = Math.floor(Math.random() * 20) + 10;
      const absentDays = Math.floor(Math.random() * 5);
      const lateArrivals = Math.floor(Math.random() * 3);
      const totalHours = attendanceDays * 8;
      
      return {
        id: worker.id,
        name: worker.name,
        position: worker.position || 'Operario',
        attendanceDays,
        absentDays,
        lateArrivals,
        totalHours,
        attendanceRate: Math.round((attendanceDays / (attendanceDays + absentDays)) * 100)
      };
    });

    setReportData(simulatedData);
  };

  const totalAttendance = reportData.reduce((sum, item) => sum + item.attendanceDays, 0);
  const totalAbsent = reportData.reduce((sum, item) => sum + item.absentDays, 0);
  const averageRate = reportData.length > 0 
    ? Math.round(reportData.reduce((sum, item) => sum + item.attendanceRate, 0) / reportData.length)
    : 0;

  return (
    <div className="report-tab">
      <div className="report-header">
        <h3>📊 Reportes de Asistencia</h3>
        <p>Genera reportes personalizados de asistencia por período</p>
      </div>

      <div className="report-controls">
        <div className="date-range">
          <div className="date-input">
            <label>Fecha inicio:</label>
            <input 
              type="date" 
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="date-input">
            <label>Fecha fin:</label>
            <input 
              type="date" 
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>
        
        <button onClick={generateReport} className="btn-generate">
          📈 Generar Reporte
        </button>
      </div>

      {reportData.length > 0 ? (
        <>
          <div className="report-summary">
            <div className="summary-card">
              <div className="summary-icon">👥</div>
              <div className="summary-content">
                <span className="summary-value">{workers.length}</span>
                <span className="summary-label">Trabajadores</span>
              </div>
            </div>
            <div className="summary-card">
              <div className="summary-icon">✅</div>
              <div className="summary-content">
                <span className="summary-value">{totalAttendance}</span>
                <span className="summary-label">Días presentes</span>
              </div>
            </div>
            <div className="summary-card">
              <div className="summary-icon">❌</div>
              <div className="summary-content">
                <span className="summary-value">{totalAbsent}</span>
                <span className="summary-label">Días ausentes</span>
              </div>
            </div>
            <div className="summary-card">
              <div className="summary-icon">📈</div>
              <div className="summary-content">
                <span className="summary-value">{averageRate}%</span>
                <span className="summary-label">Tasa promedio</span>
              </div>
            </div>
          </div>

          <div className="report-table">
            <table>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Puesto</th>
                  <th>Días Presente</th>
                  <th>Días Ausente</th>
                  <th>Retardos</th>
                  <th>Horas Totales</th>
                  <th>Tasa %</th>
                </tr>
              </thead>
              <tbody>
                {reportData.map(item => (
                  <tr key={item.id}>
                    <td>{item.name}</td>
                    <td>{item.position}</td>
                    <td className="present">{item.attendanceDays}</td>
                    <td className="absent">{item.absentDays}</td>
                    <td className="late">{item.lateArrivals}</td>
                    <td className="hours">{item.totalHours}h</td>
                    <td>
                      <div className="rate-bar">
                        <div 
                          className="rate-fill" 
                          style={{ width: `${item.attendanceRate}%` }}
                        ></div>
                        <span className="rate-value">{item.attendanceRate}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="report-actions">
            <button className="btn-export">
              📥 Exportar a Excel
            </button>
            <button className="btn-print" onClick={() => window.print()}>
              🖨️ Imprimir Reporte
            </button>
          </div>
        </>
      ) : (
        <div className="no-report">
          <div className="no-report-icon">📊</div>
          <h4>No hay reporte generado</h4>
          <p>Selecciona un rango de fechas y genera un reporte para ver las estadísticas</p>
          <p className="workers-count">
            Trabajadores disponibles: <strong>{workers.length}</strong>
          </p>
        </div>
      )}
    </div>
  );
};

export default ReportTab;