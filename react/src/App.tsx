import { ToastProvider } from './components/ui/ToastProvider'
import { AppRouter } from './routes/AppRouter'

function App() {
  return (
    <ToastProvider>
      <AppRouter />
    </ToastProvider>
  )
}

export default App
