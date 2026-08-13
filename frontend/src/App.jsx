import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AdminProvider } from './context/AdminContext'

import LayoutPublico from './pages/LayoutPublico'
import Home from './pages/Home'
import Estoque from './pages/Estoque'
import CadastrarPeca from './pages/CadastrarPeca'
import RegistrarCompra from './pages/RegistrarCompra'
import Ferramentas from './pages/Ferramentas'

import AdminLogin from './pages/AdminLogin'
import AdminLayout from './pages/AdminLayout'
import AdminDashboard from './pages/AdminDashboard'
import AdminPendentes from './pages/AdminPendentes'
import AdminCompraDetalhe from './pages/AdminCompraDetalhe'
import AdminHistorico from './pages/AdminHistorico'
import AdminComprasMes from './pages/AdminComprasMes'

export default function App() {
  return (
    <AdminProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<LayoutPublico />}>
            <Route path="/" element={<Home />} />
            <Route path="/estoque" element={<Estoque />} />
            <Route path="/cadastrar-peca" element={<CadastrarPeca />} />
            <Route path="/registrar-compra" element={<RegistrarCompra />} />
            <Route path="/ferramentas" element={<Ferramentas />} />
          </Route>

          <Route path="/admin/login" element={<AdminLogin />} />

          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="pendentes" element={<AdminPendentes />} />
            <Route path="compras/:id" element={<AdminCompraDetalhe />} />
            <Route path="historico" element={<AdminHistorico />} />
            <Route path="compras-mes" element={<AdminComprasMes />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AdminProvider>
  )
}
