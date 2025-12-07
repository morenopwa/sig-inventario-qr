// src/components/Dashboard/ActivityFeed/ActivityFeed.jsx
import React, { useState, useEffect } from 'react';
import { 
  Clock, User, Package, CheckCircle, XCircle, 
  AlertCircle, Download, Filter, RefreshCw,
  TrendingUp, Calendar, Clock as ClockIcon
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import './ActivityFeed.css';

const ActivityFeed = ({ data, title, emptyMessage, filterBy }) => {
  const [activities, setActivities] = useState(data || []);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [stats, setStats] = useState({
    total: 0,
    attendance: 0,
    inventory: 0,
    tardiness: 0
  });

  // Cargar actividades del localStorage si no hay datos
  useEffect(() => {
    if (!data || data.length === 0) {
      loadActivities();
    } else {
      setActivities(data);
    }
  }, [data]);

  useEffect(() => {
    calculateStats();
  }, [activities]);

  const loadActivities = () => {
    const savedActivities = JSON.parse(localStorage.getItem('app_activities') || '[]');
    
    // Filtrar por fecha seleccionada
    const filteredByDate = savedActivities.filter(activity => 
      activity.timestamp.includes(selectedDate)
    );
    
    setActivities(filteredByDate.slice(0, 50));
  };

  const calculateStats = () => {
    const todayActivities = activities.filter(a => 
      a.timestamp.includes(new Date().toISOString().split('T')[0])
    );
    
    const stats = {
      total: activities.length,
      attendance: activities.filter(a => a.type === 'attendance').length,
      inventory: activities.filter(a => 
        a.type === 'loan_registered' || 
        a.type === 'loan_returned' || 
        a.type === 'equipment_scanned'
      ).length,
      tardiness: activities.filter(a => 
        a.details?.status === 'tardanza'
      ).length
    };
    
    setStats(stats);
  };

  const getFilteredActivities = () => {
    let filtered = [...activities];
    
    // Aplicar filtro por tipo
    if (filter !== 'all') {
      filtered = filtered.filter(activity => {
        if (filter === 'attendance') {
          return activity.type === 'attendance';
        } else if (filter === 'inventory') {
          return activity.type.includes('loan') || activity.type.includes('equipment');
        } else if (filter === 'tardiness') {
          return activity.details?.status === 'tardanza';
        }
        return true;
      });
    }
    
    // Aplicar ordenamiento
    filtered.sort((a, b) => {
      const timeA = new Date(a.timestamp);
      const timeB = new Date(b.timestamp);
      
      if (sortBy === 'newest') {
        return timeB - timeA;
      } else {
        return timeA - timeB;
      }
    });
    
    return filtered;
  };

  const getActivityIcon = (type, subtype) => {
    const icons = {
      attendance: {
        in: <CheckCircle size={16} className="icon-success" />,
        out: <ClockIcon size={16} className="icon-info" />,
        default: <User size={16} className="icon-primary" />
      },
      loan_registered: <Package size={16} className="icon-warning" />,
      loan_returned: <CheckCircle size={16} className="icon-success" />,
      equipment_scanned: <Package size={16} className="icon-info" />,
      equipment_added: <Package size={16} className="icon-success" />,
      equipment_deleted: <XCircle size={16} className="icon-danger" />,
      whatsapp_sent: <CheckCircle size={16} className="icon-success" />,
      default: <AlertCircle size={16} className="icon-secondary" />
    };
    
    if (type === 'attendance') {
      return icons.attendance[subtype] || icons.attendance.default;
    }
    
    return icons[type] || icons.default;
  };

  const getActivityColor = (type, details) => {
    if (type === 'attendance') {
      if (details?.status === 'tardanza') return 'status-tardiness';
      if (details?.status === 'temprano') return 'status-early';
      return 'status-normal';
    }
    
    if (type === 'loan_registered') return 'status-loan';
    if (type === 'loan_returned') return 'status-return';
    
    return '';
  };

  const exportToExcel = () => {
    toast.success('Exportando a Excel...');
    // Aquí iría la lógica de exportación
  };

  const refreshData = () => {
    loadActivities();
    toast.success('Datos actualizados');
  };

  const filteredActivities = getFilteredActivities();

  return (
    <div className="activity-feed-container">
      {/* Encabezado con estadísticas */}
      <div className="feed-header">
        <div className="header-left">
          <h3>{title || 'Actividad en Tiempo Real'}</h3>
          <div className="date-selector">
            <Calendar size={16} />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                loadActivities();
              }}
              className="date-input"
            />
          </div>
        </div>
        
        <div className="header-right">
          <button 
            className="header-action"
            onClick={refreshData}
            title="Actualizar datos"
          >
            <RefreshCw size={18} />
          </button>
          <button 
            className="header-action"
            onClick={exportToExcel}
            title="Exportar a Excel"
          >
            <Download size={18} />
          </button>
        </div>
      </div>

      {/* Estadísticas rápidas */}
      <div className="quick-stats-row">
        <div className="stat-item">
          <div className="stat-icon total">
            <TrendingUp size={20} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats.total}</span>
            <span className="stat-label">Total Actividades</span>
          </div>
        </div>
        
        <div className="stat-item">
          <div className="stat-icon attendance">
            <User size={20} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats.attendance}</span>
            <span className="stat-label">Asistencias</span>
          </div>
        </div>
        
        <div className="stat-item">
          <div className="stat-icon inventory">
            <Package size={20} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats.inventory}</span>
            <span className="stat-label">Mov. Inventario</span>
          </div>
        </div>
        
        <div className="stat-item">
          <div className="stat-icon tardiness">
            <AlertCircle size={20} />
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats.tardiness}</span>
            <span className="stat-label">Tardanzas</span>
          </div>
        </div>
      </div>

      {/* Filtros y controles */}
      <div className="feed-controls">
        <div className="filter-group">
          <Filter size={16} />
          <select 
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">Todas las actividades</option>
            <option value="attendance">Solo asistencias</option>
            <option value="inventory">Solo inventario</option>
            <option value="tardiness">Solo tardanzas</option>
          </select>
        </div>
        
        <div className="sort-group">
          <label>Ordenar por:</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="sort-select"
          >
            <option value="newest">Más recientes primero</option>
            <option value="oldest">Más antiguos primero</option>
          </select>
        </div>
      </div>

      {/* Lista de actividades */}
      <div className="activities-list">
        {filteredActivities.length > 0 ? (
          <div className="activities-table">
            <div className="table-header">
              <div className="table-cell time">Hora</div>
              <div className="table-cell type">Tipo</div>
              <div className="table-cell description">Descripción</div>
              <div className="table-cell details">Detalles</div>
              <div className="table-cell status">Estado</div>
            </div>
            
            <div className="table-body">
              {filteredActivities.map((activity, index) => (
                <div 
                  key={`${activity.id}-${index}`}
                  className={`table-row ${getActivityColor(activity.type, activity.details)}`}
                >
                  <div className="table-cell time">
                    <div className="time-display">
                      <Clock size={14} />
                      {new Date(activity.timestamp).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </div>
                  </div>
                  
                  <div className="table-cell type">
                    <div className="type-icon">
                      {getActivityIcon(activity.type, activity.subtype)}
                    </div>
                    <span className="type-label">
                      {activity.type === 'attendance' 
                        ? (activity.subtype === 'in' ? 'ENTRADA' : 'SALIDA')
                        : activity.type.replace('_', ' ').toUpperCase()
                      }
                    </span>
                  </div>
                  
                  <div className="table-cell description">
                    <div className="description-text">
                      {activity.description}
                    </div>
                    {activity.details?.workerName && (
                      <div className="description-sub">
                        👤 {activity.details.workerName}
                      </div>
                    )}
                  </div>
                  
                  <div className="table-cell details">
                    {activity.details && (
                      <div className="details-content">
                        {activity.details.status && (
                          <span className={`detail-tag ${activity.details.status}`}>
                            {activity.details.status.toUpperCase()}
                          </span>
                        )}
                        {activity.details.time && (
                          <span className="detail-tag time">
                            {activity.details.time}
                          </span>
                        )}
                        {activity.details.overtimeHours && (
                          <span className="detail-tag overtime">
                            +{activity.details.overtimeHours}h extras
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="table-cell status">
                    <div className={`status-indicator ${getActivityColor(activity.type, activity.details)}`}>
                      {activity.type === 'attendance' && activity.details?.status === 'tardanza' 
                        ? 'TARDANZA'
                        : activity.type === 'attendance' && activity.details?.status === 'temprano'
                        ? 'TEMPRANO'
                        : 'COMPLETADO'
                      }
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="empty-state">
            <Package size={48} className="empty-icon" />
            <h4>No hay actividades registradas</h4>
            <p>{emptyMessage || 'Las actividades aparecerán aquí en tiempo real'}</p>
            <button 
              className="btn-refresh"
              onClick={refreshData}
            >
              <RefreshCw size={16} />
              Recargar actividades
            </button>
          </div>
        )}
      </div>

      {/* Pie con resumen */}
      <div className="feed-footer">
        <div className="footer-info">
          <span className="count-display">
            Mostrando {filteredActivities.length} de {activities.length} actividades
          </span>
          <span className="last-update">
            Última actualización: {new Date().toLocaleTimeString()}
          </span>
        </div>
        
        <div className="footer-actions">
          <button className="btn-secondary">
            Ver Reporte Completo
          </button>
          <button className="btn-primary">
            Generar Resumen Diario
          </button>
        </div>
      </div>
    </div>
  );
};

export default ActivityFeed;