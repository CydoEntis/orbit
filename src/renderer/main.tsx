import ReactDOM from 'react-dom/client'
import { App } from './App'
import { SettingsPage } from './pages/SettingsPage'
import './assets/globals.css'
import '@xterm/xterm/css/xterm.css'

document.documentElement.classList.add('dark')

const root = ReactDOM.createRoot(document.getElementById('root')!)

if (window.location.hash === '#settings') {
  root.render(<SettingsPage />)
} else {
  root.render(<App />)
}
