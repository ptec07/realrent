import HomePage from './routes/HomePage'
import ComparePage from './routes/ComparePage'
import SearchResultsPage from './routes/SearchResultsPage'

export default function App() {
  if (window.location.pathname === '/compare') {
    return <ComparePage />
  }

  if (window.location.pathname === '/results') {
    return <SearchResultsPage />
  }

  return <HomePage />
}
