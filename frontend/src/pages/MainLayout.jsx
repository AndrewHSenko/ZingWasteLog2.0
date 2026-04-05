import { Outlet } from 'react-router'
import Header from '../components/Header.jsx'
import Footer from '../components/Footer.jsx'

const MainLayout = ({ children }) => {
  return (
        <div>
            <Header />
            <main className="flex-grow-1">
                <Outlet />
            </main>
            <Footer />
        </div>
  )
}

export default MainLayout