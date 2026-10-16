import { Route, Routes } from 'react-router-dom';
import { ChatSoporte } from './components/ChatSoporte';
import { Navbar } from './components/Navbar';
import { RutaProtegida } from './components/RutaProtegida';
import { Catalogo } from './pages/Catalogo';
import { Login } from './pages/Login';
import { Registro } from './pages/Registro';
import { Carrito } from './pages/Carrito';
import { MisPedidos } from './pages/MisPedidos';
import { ListaDeseos } from './pages/ListaDeseos';
import { Novedades } from './pages/Novedades';
import { Perfil } from './pages/Perfil';

export function App() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <Routes>
        <Route path="/" element={<Catalogo />} />
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Registro />} />
        <Route path="/carrito" element={<Carrito />} />
        <Route path="/lista-deseos" element={<ListaDeseos />} />
        <Route path="/novedades" element={<Novedades />} />
        <Route
          path="/perfil"
          element={
            <RutaProtegida>
              <Perfil />
            </RutaProtegida>
          }
        />
        <Route
          path="/mis-pedidos"
          element={
            <RutaProtegida>
              <MisPedidos />
            </RutaProtegida>
          }
        />
      </Routes>
      <footer className="p-6 text-center text-sm text-gray-500">
        <a href="/terminos.html" target="_blank" rel="noopener" className="underline">
          Términos y condiciones
        </a>
      </footer>
      <ChatSoporte />
    </div>
  );
}
