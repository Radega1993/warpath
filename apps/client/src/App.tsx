import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import Home from './pages/Home';
import Login from './pages/Login';
import Admin from './pages/Admin';
import Lobby from './pages/Lobby';
import Room from './pages/Room';
import Game from './pages/Game';
import Results from './pages/Results';

function App() {
    return (
        <ErrorBoundary>
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/admin" element={<Admin />} />
                    <Route path="/lobby" element={<Lobby />} />
                    <Route path="/room/:roomId" element={<Room />} />
                    <Route path="/game/:roomId" element={<Game />} />
                    <Route path="/results" element={<Results />} />
                </Routes>
            </BrowserRouter>
        </ErrorBoundary>
    );
}

export default App;

