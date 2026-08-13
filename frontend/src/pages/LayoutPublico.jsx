import { Outlet } from 'react-router-dom'
import Cabecalho from '../components/Cabecalho'

export default function LayoutPublico() {
  return (
    <div>
      <Cabecalho />
      <Outlet />
    </div>
  )
}
