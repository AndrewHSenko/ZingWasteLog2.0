import { Route, Routes } from 'react-router'
import toast from 'react-hot-toast'

import LandingPage from './pages/LandingPage'
import EntriesPage from './pages/EntriesPage'
import ItemsPage from './pages/ItemsPage'

const App = () => {
  return (
    <div>
      <button onClick={() => toast.success("yippie!")} className="text-red-500 p-4 bg-amber-100"/>
      <button onClick={() => toast.error("Sugandese")} />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/entries" element={<EntriesPage />} />
        <Route path="/items" element={<ItemsPage />} />
      </Routes>
    </div>
  )
}

// 2:02:20 (still need to add a Bootstrap component for testing)

export default App