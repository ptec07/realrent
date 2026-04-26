import { useEffect, useState } from 'react'

import HomePage from './routes/HomePage'
import ComparePage from './routes/ComparePage'
import SearchResultsPage from './routes/SearchResultsPage'
import { REALRENT_NAVIGATION_EVENT } from './utils/navigation'

export default function App() {
  const [pathname, setPathname] = useState(window.location.pathname)

  useEffect(() => {
    function syncPathname() {
      setPathname(window.location.pathname)
    }

    window.addEventListener(REALRENT_NAVIGATION_EVENT, syncPathname)
    window.addEventListener('popstate', syncPathname)
    return () => {
      window.removeEventListener(REALRENT_NAVIGATION_EVENT, syncPathname)
      window.removeEventListener('popstate', syncPathname)
    }
  }, [])

  if (pathname === '/compare') {
    return <ComparePage />
  }

  if (pathname === '/results') {
    return <SearchResultsPage />
  }

  return <HomePage />
}
