import React from 'react';  // ← Importar React
import './SearchBar.css';

const SearchBar = ({ searchTerm, onSearchChange }) => {
  return (
    <div className="search-section">
      <input
        type="text"
        placeholder="Buscar por persona, equipo, categoría..."
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        className="search-input"
      />
    </div>
  );
};

export default SearchBar;