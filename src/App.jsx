import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from '../components/Layout'
import Home from './pages/Home'
import Inventario from './pages/Inventario'
import EscanerQR from './pages/EscanerQR'
import Login from './pages/Login'
import NotFound from './pages/NotFound'

function App() {
  // Simula autenticación (ajusta según tu lógica real)
  const isAuthenticated = localStorage.getItem('token') !== null

  return (
    <BrowserRouter>
      <Routes>
        {/* Ruta pública de login */}
        <Route path="/login" element={<Login />} />
        
        {/* Rutas protegidas */}
        <Route path="/" element={isAuthenticated ? <Layout /> : <Navigate to="/login" />}>
          <Route index element={<Home />} />
          <Route path="inventario" element={<Inventario />} />
          <Route path="escaner" element={<EscanerQR />} />
          
          {/* Rutas dinámicas (ejemplo) */}
          <Route path="item/:id" element={<Inventario />} />
        </Route>
        
        {/* Ruta 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App