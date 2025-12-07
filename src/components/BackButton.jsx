// src/components/BackButton.jsx
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react'; // Si usas lucide-react

function BackButton({ to = -1, label = "Volver", className = "" }) {
  const navigate = useNavigate();
  
  return (
    <button
      onClick={() => navigate(to)}
      className={`flex items-center gap-2 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors ${className}`}
    >
      <ArrowLeft size={20} />
      {label}
    </button>
  );
}

export default BackButton;

// Uso en cualquier componente
import BackButton from './components/BackButton';

function MiPagina() {
  return (
    <div>
      <BackButton />
      <BackButton to="/" label="Volver al inicio" className="mb-4" />
      {/* Tu contenido */}
    </div>
  );
}