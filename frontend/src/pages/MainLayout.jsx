import { Outlet } from 'react-router'
import { HeaderHeightProvider } from '../HeaderHeightContext.jsx'
import Header from '../components/Header.jsx'

const MainLayout = ({ children }) => {
  return (
    <HeaderHeightProvider>
        <div className="container-fluid d-flex flex-column p-0 min-vh-100">
            <Header />
            <main className="flex-grow-1">
                <Outlet />
            </main>
        </div>
    </HeaderHeightProvider>
  )
}

export default MainLayout