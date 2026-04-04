import React, { useState, useEffect } from 'react';
import { Plus, FileText, CheckCircle, Clock, Users } from 'lucide-react';
import ProposalForm from '../components/ciudadanas/ProposalForm';
import ProposalList from '../components/ciudadanas/ProposalList';
import { apiService } from '../services/apiService';

interface ProposalStats {
  total: number;
  pending: number;
  validated: number;
  rejected: number;
}

const ProposalsPage: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  const [stats, setStats] = useState<ProposalStats>({
    total: 0,
    pending: 0,
    validated: 0,
    rejected: 0
  });
  const [statsLoading, setStatsLoading] = useState(true);

  const fetchStats = async () => {
    try {
      setStatsLoading(true);
      const response = await apiService.get<ProposalStats>('/api/proposals/stats');
      setStats(response);
    } catch (error) {
      console.error('Error fetching proposal stats:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleProposalSubmitted = () => {
    setShowForm(false);
    fetchStats(); // Refresh stats after new proposal
    // The ProposalList will refresh automatically via its useEffect
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Propuestas Ciudadanas
                </h1>
                <p className="mt-2 text-gray-600">
                  Participa en la construcción colectiva de soluciones para tu comunidad
                </p>
              </div>
              <button
                onClick={() => setShowForm(!showForm)}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
                {showForm ? 'Cancelar' : 'Nueva Propuesta'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FileText className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">Total Propuestas</h3>
                <p className="text-2xl font-bold text-gray-900">
                  {statsLoading ? (
                    <span className="animate-pulse bg-gray-200 rounded w-8 h-8 block"></span>
                  ) : (
                    stats.total
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">Pendientes</h3>
                <p className="text-2xl font-bold text-gray-900">
                  {statsLoading ? (
                    <span className="animate-pulse bg-gray-200 rounded w-8 h-8 block"></span>
                  ) : (
                    stats.pending
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">Validadas</h3>
                <p className="text-2xl font-bold text-gray-900">
                  {statsLoading ? (
                    <span className="animate-pulse bg-gray-200 rounded w-8 h-8 block"></span>
                  ) : (
                    stats.validated
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">Participación</h3>
                <p className="text-2xl font-bold text-gray-900">
                  {statsLoading ? (
                    <span className="animate-pulse bg-gray-200 rounded w-8 h-8 block"></span>
                  ) : (
                    `${stats.validated > 0 ? Math.round((stats.validated / stats.total) * 100) : 0}%`
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Proposal Form */}
          <div className={`lg:col-span-1 ${!showForm ? 'hidden lg:block' : ''}`}>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                {showForm ? 'Nueva Propuesta' : 'Crear Propuesta'}
              </h2>
              
              {showForm ? (
                <ProposalForm 
                  onSuccess={handleProposalSubmitted}
                  onCancel={() => setShowForm(false)}
                />
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    ¿Tienes una idea?
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Comparte tu propuesta para mejorar tu comunidad y obtén el apoyo de otros ciudadanos.
                  </p>
                  <button
                    onClick={() => setShowForm(true)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                    Crear Propuesta
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Proposals List */}
          <div className={`${showForm ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Todas las Propuestas
                </h2>
                {showForm && (
                  <button
                    onClick={() => setShowForm(false)}
                    className="lg:hidden px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    Ver lista completa
                  </button>
                )}
              </div>
              
              <ProposalList />
            </div>
          </div>
        </div>

        {/* Info Section */}
        <div className="mt-12 bg-blue-50 rounded-lg p-8">
          <div className="max-w-3xl">
            <h3 className="text-xl font-semibold text-blue-900 mb-4">
              ¿Cómo funciona el proceso?
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-blue-600 font-bold">1</span>
                </div>
                <h4 className="font-medium text-blue-900 mb-2">Crea tu propuesta</h4>
                <p className="text-blue-700 text-sm">
                  Describe tu idea y cómo beneficiaría a la comunidad
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-blue-600 font-bold">2</span>
                </div>
                <h4 className="font-medium text-blue-900 mb-2">Obtén apoyo</h4>
                <p className="text-blue-700 text-sm">
                  Otros ciudadanos pueden apoyar o comentar tu propuesta
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-blue-600 font-bold">3</span>
                </div>
                <h4 className="font-medium text-blue-900 mb-2">Validación</h4>
                <p className="text-blue-700 text-sm">
                  Las propuestas con suficiente apoyo pasan a revisión oficial
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProposalsPage;