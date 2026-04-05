import { Route, Routes } from 'react-router'

import MainLayout from './pages/MainLayout'
import LandingPage from './pages/LandingPage'
import EntriesPage from './pages/EntriesPage'
import ItemsPage from './pages/ItemsPage'

const App = () => {
  return (
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<LandingPage />}/>
          <Route path="entries" element={<EntriesPage />} />
          <Route path="items" element={<ItemsPage />} />
        </Route>
      </Routes>
  )
}

export default App 