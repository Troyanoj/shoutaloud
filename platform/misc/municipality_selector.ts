import React from 'react';
import { MapPin, Users, TrendingUp } from 'lucide-react';
import { Municipality } from '../services/api';

interface MunicipalitySelectorProps {
  municipalities: Municipality[];
  selectedMunicipality: string;
  onMunicipalityChange: (municipalityId: string) => void;
}

const MunicipalitySelector: React.FC<MunicipalitySelectorProps> = ({
  municipalities,
  selectedMunicipality,
  onMunicipalityChange,
}) => {
  const selectedMunicipalityData = municipalities.find(m => m.id === selectedMunicipality);

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div className="flex-1">
          <label htmlFor="municipality-select" className="block text-sm font-medium text-gray-700 mb-2">
            Selecciona tu municipio
          </label>
          <select
            id="municipality-select"
            value={selectedMunicipality}
            onChange={(e) => onMunicipalityChange(e.target.value)}
            className="w-full md:w-auto px-4 py-2 border border-gray-300 rounded-md focus:ring-democracy-blue focus:border-democracy-blue bg-white"
          >
            <option value="">Todos los municipios</option>
            {municipalities.map((municipality) => (
              <option key={municipality.id} value={municipality.id}>
                {municipality.name}, {municipality.state}
              </option>
            ))}
          </select>
        </div>

        {selectedMunicipalityData && (
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center space-x-2 text-gray-600">
              <MapPin className="h-4 w-4" />
              <span>{selectedMunicipalityData.name}</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-600">
              <Users className="h-4 w-4" />
              <span>{selectedMunicipalityData.population.toLocaleString()} hab.</span>
            </div>
            <div className="flex items-center space-x-2 text-democracy-green">
              <TrendingUp className="h-4 w-4" />
              <span>{selectedMunicipalityData.participation_rate.toFixed(1)}% participación</span>
            </div>
          </div>
        )}
      </div>

      {selectedMunicipalityData && (
        <div className="mt-4 pt-4 border-t">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="bg-democracy-blue/10 rounded-lg p-3">
              <div className="text-2xl font-bold text-democracy-blue">
                {selectedMunicipalityData.active_proposals}
              </div>
              <div className="text-sm text-gray-600">Propuestas Activas</div>
            </div>
            <div className="bg-democracy-green/10 rounded-lg p-3">
              <div className="text-2xl font-bold text-democracy-green">
                {selectedMunicipalityData.participation_rate.toFixed(0)}%
              </div>
              <div className="text-sm text-gray-600">Participación</div>
            </div>
            <div className="bg-democracy-purple/10 rounded-lg p-3">
              <div className="text-2xl font-bold text-democracy-purple">
                {Math.floor(selectedMunicipalityData.population / 1000)}K
              </div>
              <div className="text-sm text-gray-600">Población</div>
            </div>
            <div className="bg-orange-100 rounded-lg p-3">
              <div className="text-2xl font-bold text-orange-600">
                {Math.floor(selectedMunicipalityData.population * selectedMunicipalityData.participation_rate / 100)}
              </div>
              <div className="text-sm text-gray-600">Ciudadanos Activos</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MunicipalitySelector;