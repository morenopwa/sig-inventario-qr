import React from 'react';

const Header = ({ user, onLogout }) => (
  <div style={s.header}>
    <div style={s.brand}>
      <div style={s.onlineDot}></div>
      <span style={s.userName}>{user?.name || 'Operador'}</span>
    </div>
    <button onClick={onLogout} style={s.logoutBtn}>
      Cerrar Sesión 🚪
    </button>
  </div>
);

const s = {
  header: { 
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
    padding: '10px 20px', backgroundColor: '#202c33', borderBottom: '1px solid #2a3942' 
  },
  brand: { display: 'flex', alignItems: 'center', gap: '10px' },
  onlineDot: { width: '10px', height: '10px', backgroundColor: '#00a884', borderRadius: '50%', boxShadow: '0 0 5px #00a884' },
  userName: { color: '#e9edef', fontSize: '14px', fontWeight: '500' },
  logoutBtn: { background: 'none', border: '1px solid #ff4d4d', color: '#ff4d4d', padding: '4px 10px', borderRadius: '15px', cursor: 'pointer', fontSize: '12px' }
};

export default Header;