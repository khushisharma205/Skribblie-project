import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home.jsx'
import Lobby from './pages/Lobby.jsx'
import GameRoom from './pages/GameRoom.jsx'
import './App.css'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/lobby/:code" element={<Lobby />} />
      <Route path="/game/:code" element={<GameRoom />} />
    </Routes>
  )
}

export default App
