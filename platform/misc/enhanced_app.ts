// src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { ProposalsList } from './components/ProposalsList';
import { ProposalDetail } from './components/ProposalDetail';
import { VotingPage } from './components/VotingPage';
import { ResultsPage } from './components/ResultsPage';
import { OfficialRatings } from './components/OfficialRatings';
import './App.css';

const Navigation: React.FC = () => {
  const location = useLocation();
  
  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path);
  };

  return (
    <nav className="bg-white shadow-lg border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">SA</span>
            </div>
            <span className="text-xl font-bold text-gray-900">Shout Aloud</span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex space-x-8">
            <Link
              to="/proposals"
              className={`
                px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200
                ${isActive('/proposals') 
                  ? 'text-blue-600 bg-blue-50' 
                  : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                }
              `}
            >
              📋 Propuestas
            </Link>
            
            <Link
              to="/officials"
              className={`
                px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200
                ${isActive('/officials') 
                  ? 'text-blue-600 bg-blue-50' 
                  : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                }
              `}
            >
              👥 Funcionarios
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button className="text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

const HomePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
              Shout Aloud
            </span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            La plataforma de democracia descentralizada que empodera a los ciudadanos 
            para participar directamente en las decisiones que afectan sus comunidades.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link
              to="/proposals"
              className="bg-blue-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              🗳️ Ver Propuestas
            </Link>
            
            <Link
              to="/officials"
              className="bg-white text-gray-700 px-8 py-4 rounded-lg font-semibold border-2 border-gray-300 hover:border-blue-500 hover:text-blue-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              ⭐ Calificar Funcionarios
            </Link>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-200">
              <div className="text-4xl mb-4">🔒</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Seguro y Transparente</h3>
              <p className="text-gray-600">
                Identidad descentralizada (DID) y firmas criptográficas garantizan 
                la integridad y anonimato de cada voto.
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-200">
              <div className="text-4xl mb-4">🏛️</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Democracia Directa</h3>
              <p className="text-gray-600">
                Vota directamente en propuestas gubernamentales reales y 
                participa en la toma de decisiones de tu municipio.
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-200">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Resultados en Tiempo Real</h3>
              <p className="text-gray-600">
                Observa los resultados conforme se contabilizan los votos, 
                con desglose detallado por municipio y demografía.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-white py-16 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Participación Ciudadana Real
            </h2>
            <p className="text-lg text-gray-600">
              Únete a miles de ciudadanos que ya están cambiando su comunidad
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">1,247</div>
              <div className="text-sm text-gray-600">Votos Emitidos</div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">23</div>
              <div className="text-sm text-gray-600">Propuestas Activas</div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">156</div>
              <div className="text-sm text-gray-600">Funcionarios Calificados</div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600 mb-2">8</div>
              <div className="text-sm text-gray-600">Municipios Activos</div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 py-16">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white mb-4">
            El futuro de la democracia está en tus manos
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Cada voto cuenta. Cada opinión importa. Cada ciudadano puede hacer la diferencia.
          </p>
          
          <Link
            to="/proposals"
            className="inline-flex items-center bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            Comenzar a Participar
            <svg className="ml-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/proposals" element={<ProposalsList />} />
          <Route path="/proposals/:id" element={<ProposalDetail />} />
          <Route path="/vote/:proposalId" element={<VotingPage />} />
          <Route path="/results/:proposalId" element={<ResultsPage />} />
          <Route path="/officials" element={<OfficialRatings />} />
          
          {/* Catch all route */}
          <Route path="*" element={
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
              <div className="text-center">
                <h1 className="text-6xl font-bold text-gray-400 mb-4">404</h1>
                <h2 className="text-2xl font-semibold text-gray-600 mb-4">Página no encontrada</h2>
                <p className="text-gray-500 mb-8">La página que buscas no existe.</p>
                <Link
                  to="/"
                  className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Volver al inicio
                </Link>
              </div>
            </div>
          } />
        </Routes>

        {/* Footer */}
        <footer className="bg-gray-900 text-white py-12 mt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="col-span-1 md:col-span-2">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">SA</span>
                  </div>
                  <span className="text-xl font-bold">Shout Aloud</span>
                </div>
                <p className="text-gray-400 max-w-md">
                  Construyendo el futuro de la democracia directa con tecnología descentralizada, 
                  transparencia total y participación ciudadana real.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-4">Plataforma</h3>
                <ul className="space-y-2 text-gray-400">
                  <li><Link to="/proposals" className="hover:text-white transition-colors">Propuestas</Link></li>
                  <li><Link to="/officials" className="hover:text-white transition-colors">Funcionarios</Link></li>
                  <li><a href="#" className="hover:text-white transition-colors">Estadísticas</a></li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-4">Tecnología</h3>
                <ul className="space-y-2 text-gray-400">
                  <li>🔗 Blockchain</li>
                  <li>🆔 DID (Identidad Descentralizada)</li>
                  <li>🔐 Pruebas ZK</li>
                  <li>📱 Progressive Web App</li>
                </ul>
              </div>
            </div>
            
            <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
              <p>&copy; 2025 Shout Aloud. Plataforma open-source para la democracia del futuro.</p>
            </div>
          </div>
        </footer>
      </div>
    </Router>
  );
};

export default App;