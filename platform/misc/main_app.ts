import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Vote, Users, FileText, BarChart3, Settings, Megaphone } from 'lucide-react';
import './App.css';

// Componentes
import ProposalsList from './components/ProposalsList';
import ProposalDetail from './components/ProposalDetail';
import VotingPage from './components/VotingPage';
import ResultsPage from './components/ResultsPage';
import OfficialRatings from './components/OfficialRatings';
import MunicipalitySelector from './components/MunicipalitySelector';
import { ApiService, Municipality } from './services/api';

function App() {
  const [selectedMunicipality, setSelectedMunicipality] = useState<string>('');
  const [municipalities, setMunicipalities] = useState<Municipality[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMunicipalities();
  }, []);

  const loadMunicipalities = async () => {
    try {
      const data = await ApiService.getMunicipalities();
      setMunicipalities(data);
      if (data.length > 0) {
        setSelectedMunicipality(data[0].id);
      }
    } catch (error) {
      console.error('Error loading municipalities:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-democracy-blue mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando Shout Aloud...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50 font-democracy">
        <Header />
        
        <div className="container mx-auto px-4 py-6">
          <div className="mb-6">
            <MunicipalitySelector
              municipalities={municipalities}
              selectedMunicipality={selectedMunicipality}
              onMunicipalityChange={setSelectedMunicipality}
            />
          </div>

          <Routes>
            <Route 
              path="/" 
              element={<ProposalsList municipalityId={selectedMunicipality} />} 
            />
            <Route 
              path="/proposal/:id" 
              element={<ProposalDetail />} 
            />
            <Route 
              path="/vote/:id" 
              element={<VotingPage municipalityId={selectedMunicipality} />} 
            />
            <Route 
              path="/results" 
              element={<ResultsPage municipalityId={selectedMunicipality} />} 
            />
            <Route 
              path="/officials" 
              element={<OfficialRatings municipalityId={selectedMunicipality} />} 
            />
          </Routes>
        </div>

        <Navigation />
      </div>
    </Router>
  );
}

function Header() {
  return (
    <header className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Megaphone className="h-8 w-8 text-democracy-blue" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Shout Aloud</h1>
              <p className="text-sm text-gray-600">Democracia Descentralizada</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center space-x-2 text-sm text-gray-600">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Sistema Activo</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

function Navigation() {
  const location = useLocation();
  
  const navItems = [
    { path: '/', icon: FileText, label: 'Propuestas', color: 'text-democracy-blue' },
    { path: '/results', icon: BarChart3, label: 'Resultados', color: 'text-democracy-green' },
    { path: '/officials', icon: Users, label: 'Funcionarios', color: 'text-democracy-purple' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg md:hidden">
      <div className="flex">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex-1 flex flex-col items-center py-3 px-2 ${
                isActive 
                  ? `${item.color} bg-gray-50` 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className="h-6 w-6" />
              <span className="text-xs mt-1">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export default App;