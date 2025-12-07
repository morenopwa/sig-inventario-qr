// src/components/Search/SearchDashboard.jsx
import React, { useState } from 'react';
import { Search, Filter, User, Package, Calendar } from 'lucide-react';
import useSearch from '../../hooks/useSearch';
import './SearchDashboard.css';

const SearchDashboard = () => {
  const {
    searchTerm,
    setSearchTerm,
    searchType,
    setSearchType,
    searchResults,
    getWorkerCurrentItems,
    getEquipmentRatios,
    stats
  } = useSearch();

  const [selectedWorker, setSelectedWorker] = useState(null);
  const [showRatios, setShowRatios] = useState(false);

  // Obtener items de trabajador seleccionado
  const workerItems = selectedWorker ? getWorkerCurrentItems(selectedWorker.id) : [];
  
  // Obtener ratios de consumo
  const equipmentRatios = getEquipmentRatios();

  return (
    <div className="search-dashboard">
      {/* Encabezado con estadísticas */}
      <div className="stats-header">
        <div className="stat-item">
          <User size={20} />
          <span className="stat-value">{stats.totalWorkers}</span>
          <span className="stat-label">Trabajadores</span>
        </div>
        <div className="stat-item">
          <Package size={20} />
          <span className="stat-value">{stats.totalEquipment}</span>
          <span className="stat-label">Equipos</span>
        </div>
        <div className="stat-item">
          <Calendar size={20} />
          <span className="stat-value">{stats.activeLoans}</span>
          <span className="stat-label">Préstamos Activos</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">{stats.availableEquipment}</span>
          <span className="stat-label">Disponibles</span>
        </div>
      </div>

      {/* Barra de búsqueda principal */}
      <div className="search-container">
        <div className="search-box">
          <Search className="search-icon" />
          <input
            type="text"
            placeholder="Buscar trabajadores, equipos, préstamos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <select
            value={searchType}
            onChange={(e) => setSearchType(e.target.value)}
            className="search-filter"
          >
            <option value="all">Todo</option>
            <option value="workers">Trabajadores</option>
            <option value="equipment">Equipos</option>
            <option value="loans">Préstamos Activos</option>
          </select>
        </div>

        <button 
          className="btn-ratios"
          onClick={() => setShowRatios(!showRatios)}
        >
          <Filter size={16} />
          {showRatios ? 'Ocultar Ratios' : 'Ver Ratios de Uso'}
        </button>
      </div>

      {/* Resultados de búsqueda */}
      {searchTerm && (
        <div className="search-results">
          <h3>Resultados: {searchResults.totalResults} encontrados</h3>
          
          {/* Trabajadores */}
          {searchResults.workers.length > 0 && (
            <div className="results-section">
              <h4><User size={18} /> Trabajadores ({searchResults.workers.length})</h4>
              <div className="workers-grid">
                {searchResults.workers.map(worker => (
                  <div 
                    key={worker.id} 
                    className="worker-card"
                    onClick={() => setSelectedWorker(worker)}
                  >
                    <div className="worker-avatar">
                      {worker.name.charAt(0)}
                    </div>
                    <div className="worker-info">
                      <strong>{worker.name}</strong>
                      <span>{worker.position || 'Sin cargo'}</span>
                      <small>{worker.id}</small>
                    </div>
                    {selectedWorker?.id === worker.id && (
                      <div className="worker-selected">✓</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Equipos */}
          {searchResults.equipment.length > 0 && (
            <div className="results-section">
              <h4><Package size={18} /> Equipos ({searchResults.equipment.length})</h4>
              <div className="equipment-grid">
                {searchResults.equipment.map(item => (
                  <div key={item.id} className="equipment-card">
                    <div className={`equipment-status ${item.status}`}>
                      {item.status === 'available' ? '✓' : '🔄'}
                    </div>
                    <div className="equipment-info">
                      <strong>{item.name}</strong>
                      <span>{item.code || 'Sin código'}</span>
                      <small>{item.category || 'Sin categoría'}</small>
                    </div>
                    <div className="equipment-actions">
                      <button className="btn-small">Ver Detalles</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Préstamos activos */}
          {searchResults.loans.length > 0 && (
            <div className="results-section">
              <h4>📋 Préstamos Activos ({searchResults.loans.length})</h4>
              <div className="loans-table">
                <table>
                  <thead>
                    <tr>
                      <th>Equipo</th>
                      <th>Trabajador</th>
                      <th>Fecha Préstamo</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {searchResults.loans.map(loan => (
                      <tr key={loan.id}>
                        <td>{loan.equipmentName}</td>
                        <td>{loan.workerName}</td>
                        <td>{new Date(loan.loanDate).toLocaleDateString()}</td>
                        <td>
                          <span className={`loan-status ${loan.status}`}>
                            {loan.status === 'active' ? 'Activo' : 'Devuelto'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Panel de trabajador seleccionado */}
      {selectedWorker && (
        <div className="worker-details-panel">
          <h3>📦 Equipos en posesión de {selectedWorker.name}</h3>
          {workerItems.length > 0 ? (
            <div className="worker-items">
              {workerItems.map(item => (
                <div key={item.id} className="item-card">
                  <div className="item-header">
                    <strong>{item.equipment.name}</strong>
                    <span className="item-code">{item.equipment.code}</span>
                  </div>
                  <div className="item-details">
                    <div>Prestado: {new Date(item.loanDate).toLocaleDateString()}</div>
                    <div>Vence: {item.expectedReturnDate 
                      ? new Date(item.expectedReturnDate).toLocaleDateString()
                      : 'Sin fecha límite'}
                    </div>
                  </div>
                  <button className="btn-return">Marcar Devolución</button>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-items">No tiene equipos asignados actualmente</p>
          )}
        </div>
      )}

      {/* Ratios de consumo */}
      {showRatios && (
        <div className="ratios-panel">
          <h3>📊 Ratios de Consumo de Equipos</h3>
          <div className="ratios-table">
            <table>
              <thead>
                <tr>
                  <th>Equipo</th>
                  <th>Uso (último mes)</th>
                  <th>Préstamos Totales</th>
                  <th>Último Uso</th>
                  <th>Disponibilidad</th>
                </tr>
              </thead>
              <tbody>
                {equipmentRatios.map(item => (
                  <tr key={item.id}>
                    <td>
                      <strong>{item.name}</strong>
                      <br/>
                      <small>{item.category}</small>
                    </td>
                    <td>
                      <div className="usage-bar">
                        <div 
                          className="usage-fill"
                          style={{width: `${Math.min(item.usageFrequency * 20, 100)}%`}}
                        />
                        <span>{item.usageFrequency} veces</span>
                      </div>
                    </td>
                    <td>{item.totalLoans}</td>
                    <td>
                      {item.lastUsed 
                        ? new Date(item.lastUsed).toLocaleDateString()
                        : 'Nunca'}
                    </td>
                    <td>
                      <span className={`availability ${item.availability.toLowerCase()}`}>
                        {item.availability}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchDashboard;