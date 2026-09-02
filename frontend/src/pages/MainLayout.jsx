import { Outlet } from 'react-router'
import Header from '../components/Header.jsx'

const MainLayout = () => {
  return (
        <div className="container-fluid d-flex flex-column p-0 min-h-dvh">
            <Header />
            <main className="flex-grow-1">
                <Outlet />
            </main>
        </div>
  )
}

export default MainLayout