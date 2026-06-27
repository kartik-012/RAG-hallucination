import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Navbar } from './components/layout/Navbar'
import { HomePage } from './pages/HomePage'
import { ResultPage } from './pages/ResultPage'
import { BenchmarkPage } from './pages/BenchmarkPage'
import { HistoryPage } from './pages/HistoryPage'
import { DocumentsPage } from './pages/DocumentsPage'
import { SettingsPage } from './pages/SettingsPage'
import { NotFoundPage } from './pages/NotFoundPage'
import './styles/globals.css'

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-base">
        <Navbar />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/result/:queryId" element={<ResultPage />} />
          <Route path="/benchmark" element={<BenchmarkPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/documents" element={<DocumentsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}
