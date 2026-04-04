// src/components/ResultsScreen.js
import React, { useState, useEffect } from 'react';
import { useQuery } from 'react-query';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  CircularProgress,
  Alert,
  Stack,
  Button,
  Paper,
  Divider,
  Switch,
  FormControlLabel,
  Tooltip,
  IconButton
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart,
  Legend
} from 'recharts';
import {
  HowToVote,
  TrendingUp,
  People,
  LocationOn,
  FilterList,
  Download,
  Share,
  Refresh,
  Info,
  Timeline
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { apiService } from '../services/apiService';
import { useAuthStore } from '../stores/authStore';

const ResultsScreen = () => {
  const { user } = useAuthStore();
  const [selectedProposal, setSelectedProposal] = useState('');
  const [selectedMunicipality, setSelectedMunicipality] = useState(user?.municipality_code || '');
  const [selectedState, setSelectedState] = useState(user?.state_code || '');
  const [viewMode, setViewMode] = useState('municipality'); // 'municipality', 'state', 'comparison'
  const [showPercentages, setShowPercentages] = useState(true);
  const [timeRange, setTimeRange] = useState('all'); // 'all', '30d', '7d'

  // Fetch active proposals for dropdown
  const { data: proposals } = useQuery(
    'active-proposals',
    () => apiService.getProposals({ status: 'active', limit: 50 }),
    {
      staleTime: 5 * 60 * 1000,
    }
  );

  // Fetch vote results
  const { data: voteResults, isLoading, refetch } = useQuery(
    ['vote-results', selectedProposal, selectedMunicipality, selectedState, viewMode],
    () => {
      if (!selectedProposal) return null;
      
      if (viewMode === 'municipality' && selectedMunicipality) {
        return apiService.getVoteResultsByZone(selectedProposal, selectedMunicipality, 'municipality');
      } else if (viewMode === 'state' && selectedState) {
        return apiService.getVoteResultsByZone(selectedProposal, selectedState, 'state');
      } else {
        return apiService.getVoteResults(selectedProposal);
      }
    },
    {
      enabled: !!selectedProposal,
      refetchInterval: 30000, // Refresh every 30 seconds
    }
  );

  // Fetch participation data
  const { data: participationData } = useQuery(
    ['participation-data', selectedProposal, selectedMunicipality, selectedState],
    () => {
      if (!selectedProposal) return null;
      return apiService.getParticipationStats(selectedProposal, {
        municipality_code: selectedMunicipality,
        state_code: selectedState
      });
    },
    {
      enabled: !!selectedProposal,
    }
  );

  // Fetch comparison data for multiple municipalities
  const { data: comparisonData } = useQuery(
    ['comparison-data', selectedProposal, selectedState],
    () => {
      if (!selectedProposal || viewMode !== 'comparison') return null;
      return apiService.getMunicipalityComparison(selectedProposal, selectedState);
    },
    {
      enabled: !!selectedProposal && viewMode === 'comparison',
    }
  );

  // Auto-select first proposal if none selected
  useEffect(() => {
    if (proposals?.results?.length > 0 && !selectedProposal) {
      setSelectedProposal(proposals.results[0].id.toString());
    }
  }, [proposals, selectedProposal]);

  const getCurrentProposal = () => {
    return proposals?.results?.find(p => p.id.toString() === selectedProposal);
  };

  const formatVoteData = (results) => {
    if (!results) return [];
    
    return [
      {
        name: 'SÍ',
        value: showPercentages ? results.yes_percentage : results.yes_votes,
        count: results.yes_votes,
        color: '#10B981',
        percentage: results.yes_percentage
      },
      {
        name: 'NO',
        value: showPercentages ? results.no_percentage : results.no_votes,
        count: results.no_votes,
        color: '#EF4444',
        percentage: results.no_percentage
      },
      {
        name: 'ABSTENCIÓN',
        value: showPercentages ? results.abstain_percentage : results.abstain_votes,
        count: results.abstain_votes,
        color: '#F59E0B',
        percentage: results.abstain_percentage
      }
    ];
  };

  const getWinningOption = (results) => {
    if (!results) return null;
    
    const max = Math.max(results.yes_votes, results.no_votes, results.abstain_votes);
    if (results.yes_votes === max) return { option: 'SÍ', color: '#10B981', percentage: results.yes_percentage };
    if (results.no_votes === max) return { option: 'NO', color: '#EF4444', percentage: results.no_percentage };
    return { option: 'ABSTENCIÓN', color: '#F59E0B', percentage: results.abstain_percentage };
  };

  const municipalities = [
    { code: 9, name: 'Ciudad de México', state: 'CDMX' },
    { code: 39, name: 'Guadalajara', state: 'Jalisco' },
    { code: 39, name: 'Monterrey', state: 'Nuevo León' },
    { code: 1, name: 'Aguascalientes', state: 'Aguascalientes' },
    { code: 100, name: 'Puebla', state: 'Puebla' },
    { code: 106, name: 'Tijuana', state: 'Baja California' },
  ];

  const states = [
    { code: 9, name: 'Ciudad de México' },
    { code: 14, name: 'Jalisco' },
    { code: 19, name: 'Nuevo León' },
    { code: 1, name: 'Aguascalientes' },
    { code: 21, name: 'Puebla' },
    { code: 2, name: 'Baja California' },
  ];

  if (isLoading && !voteResults) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box mb={4}>
        <Typography variant="h4" gutterBottom>
          📊 Resultados de Votación
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Resultados en tiempo real de las votaciones ciudadanas por zona geográfica
        </Typography>
      </Box>

      {/* Controls */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Grid container spacing={3} alignItems="center">
            {/* Proposal Selection */}
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Propuesta</InputLabel>
                <Select
                  value={selectedProposal}
                  label="Propuesta"
                  onChange={(e) => setSelectedProposal(e.target.value)}
                >
                  {proposals?.results?.map((proposal) => (
                    <MenuItem key={proposal.id} value={proposal.id.toString()}>
                      {proposal.title.length > 50 ? 
                        `${proposal.title.substring(0, 50)}...` : 
                        proposal.title
                      }
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* View Mode */}
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Vista</InputLabel>
                <Select
                  value={viewMode}
                  label="Vista"
                  onChange={(e) => setViewMode(e.target.value)}
                >
                  <MenuItem value="municipality">Por Municipio</MenuItem>
                  <MenuItem value="state">Por Estado</MenuItem>
                  <MenuItem value="comparison">Comparación</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Location Selection */}
            {viewMode === 'municipality' && (
              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Municipio</InputLabel>
                  <Select
                    value={selectedMunicipality}
                    label="Municipio"
                    onChange={(e) => setSelectedMunicipality(e.target.value)}
                  >
                    {municipalities.map((muni) => (
                      <MenuItem key={muni.code} value={muni.code}>
                        {muni.name}, {muni.state}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}

            {(viewMode === 'state' || viewMode === 'comparison') && (
              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Estado</InputLabel>
                  <Select
                    value={selectedState}
                    label="Estado"
                    onChange={(e) => setSelectedState(e.target.value)}
                  >
                    {states.map((state) => (
                      <MenuItem key={state.code} value={state.code}>
                        {state.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}

            {/* Controls */}
            <Grid item xs={12} md={2}>
              <Stack spacing={1}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={showPercentages}
                      onChange={(e) => setShowPercentages(e.target.checked)}
                      size="small"
                    />
                  }
                  label="Porcentajes"
                />
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<Refresh />}
                  onClick={refetch}
                  disabled={isLoading}
                >
                  Actualizar
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Results Content */}
      {selectedProposal && voteResults ? (
        <AnimatePresence mode="wait">
          <motion.div
            key={`${selectedProposal}-${viewMode}-${selectedMunicipality}-${selectedState}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
          >
            {viewMode === 'comparison' ? (
              <ComparisonView 
                data={comparisonData} 
                proposalTitle={getCurrentProposal()?.title}
                selectedState={selectedState}
                stateName={states.find(s => s.code.toString() === selectedState)?.name}
                showPercentages={showPercentages}
              />
            ) : (
              <SingleZoneView 
                voteResults={voteResults}
                participationData={participationData}
                proposal={getCurrentProposal()}
                viewMode={viewMode}
                selectedMunicipality={selectedMunicipality}
                selectedState={selectedState}
                showPercentages={showPercentages}
                municipalities={municipalities}
                states={states}
              />
            )}
          </motion.div>
        </AnimatePresence>
      ) : (
        <Alert severity="info">
          Selecciona una propuesta para ver los resultados de votación.
        </Alert>
      )}
    </Box>
  );
};

// Single Zone View Component
const SingleZoneView = ({ 
  voteResults, 
  participationData, 
  proposal, 
  viewMode, 
  selectedMunicipality, 
  selectedState,
  showPercentages,
  municipalities,
  states 
}) => {
  const formatVoteData = (results) => {
    if (!results) return [];
    
    return [
      {
        name: 'SÍ',
        value: showPercentages ? results.yes_percentage : results.yes_votes,
        count: results.yes_votes,
        color: '#10B981',
        percentage: results.yes_percentage
      },
      {
        name: 'NO',
        value: showPercentages ? results.no_percentage : results.no_votes,
        count: results.no_votes,
        color: '#EF4444',
        percentage: results.no_percentage
      },
      {
        name: 'ABSTENCIÓN',
        value: showPercentages ? results.abstain_percentage : results.abstain_votes,
        count: results.abstain_votes,
        color: '#F59E0B',
        percentage: results.abstain_percentage
      }
    ];
  };

  const getWinningOption = (results) => {
    if (!results) return null;
    
    const max = Math.max(results.yes_votes, results.no_votes, results.abstain_votes);
    if (results.yes_votes === max) return { option: 'SÍ', color: '#10B981', percentage: results.yes_percentage };
    if (results.no_votes === max) return { option: 'NO', color: '#EF4444', percentage: results.no_percentage };
    return { option: 'ABSTENCIÓN', color: '#F59E0B', percentage: results.abstain_percentage };
  };

  const getLocationName = () => {
    if (viewMode === 'municipality') {
      const muni = municipalities.find(m => m.code.toString() === selectedMunicipality);
      return muni ? `${muni.name}, ${muni.state}` : 'Municipio seleccionado';
    } else {
      const state = states.find(s => s.code.toString() === selectedState);
      return state ? state.name : 'Estado seleccionado';
    }
  };

  const voteData = formatVoteData(voteResults);
  const winner = getWinningOption(voteResults);

  return (
    <Grid container spacing={3}>
      {/* Summary Cards */}
      <Grid item xs={12}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Total de Votos"
              value={voteResults.total_votes?.toLocaleString() || '0'}
              icon={<HowToVote />}
              color="primary"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Participación"
              value={`${participationData?.participation_rate?.toFixed(1) || '0'}%`}
              icon={<People />}
              color="secondary"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Opción Ganadora"
              value={winner?.option || 'N/A'}
              subtitle={`${winner?.percentage?.toFixed(1) || '0'}%`}
              icon={<TrendingUp />}
              color="success"
              valueColor={winner?.color}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Zona"
              value={getLocationName()}
              icon={<LocationOn />}
              color="info"
            />
          </Grid>
        </Grid>
      </Grid>

      {/* Proposal Info */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              📋 {proposal?.title}
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              {proposal?.summary}
            </Typography>
            <Stack direction="row" spacing={1}>
              <Chip label={proposal?.scope} color="primary" size="small" />
              <Chip label={proposal?.category} color="secondary" size="small" />
              <Chip 
                label={proposal?.status} 
                color={proposal?.status === 'active' ? 'success' : 'default'} 
                size="small" 
              />
            </Stack>
          </CardContent>
        </Card>
      </Grid>

      {/* Charts */}
      <Grid item xs={12} md={8}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              📊 Distribución de Votos
            </Typography>
            <Box height={400}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={voteData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <RechartsTooltip 
                    formatter={(value, name) => [
                      showPercentages ? `${value.toFixed(1)}%` : value.toLocaleString(),
                      name
                    ]}
                    labelFormatter={(label) => `Opción: ${label}`}
                  />
                  <Bar dataKey="value" fill="#8884d8">
                    {voteData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Pie Chart */}
      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              🥧 Proporción
            </Typography>
            <Box height={400}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={voteData}
                    cx="50%"
                    cy="50%"
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="count"
                    label={({ name, percentage }) => `${name}: ${percentage.toFixed(1)}%`}
                  >
                    {voteData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip formatter={(value) => [value.toLocaleString(), 'Votos']} />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Detailed Breakdown */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              📈 Análisis Detallado
            </Typography>
            <Grid container spacing={3}>
              {voteData.map((option) => (
                <Grid item xs={12} md={4} key={option.name}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h4" sx={{ color: option.color, fontWeight: 'bold' }}>
                      {option.count.toLocaleString()}
                    </Typography>
                    <Typography variant="h6" color="text.secondary">
                      {option.name}
                    </Typography>
                    <Typography variant="body1" sx={{ color: option.color }}>
                      {option.percentage.toFixed(2)}%
                    </Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      </Grid>

      {/* Participation Timeline */}
      {participationData?.timeline && (
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                📅 Evolución de Participación
              </Typography>
              <Box height={300}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={participationData.timeline}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(date) => format(new Date(date), 'dd/MM', { locale: es })}
                    />
                    <YAxis />
                    <RechartsTooltip 
                      labelFormatter={(date) => format(new Date(date), 'dd MMM yyyy', { locale: es })}
                      formatter={(value) => [value.toLocaleString(), 'Votos acumulados']}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="cumulative_votes" 
                      stroke="#3B82F6" 
                      fill="#3B82F6"
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      )}
    </Grid>
  );
};

// Comparison View Component
const ComparisonView = ({ data, proposalTitle, selectedState, stateName, showPercentages }) => {
  if (!data || !data.municipalities) {
    return (
      <Alert severity="info">
        No hay datos de comparación disponibles para el estado seleccionado.
      </Alert>
    );
  }

  const comparisonData = data.municipalities.map(muni => ({
    name: muni.municipality_name || `Municipio ${muni.municipality_code}`,
    yes: showPercentages ? muni.yes_percentage : muni.yes_votes,
    no: showPercentages ? muni.no_percentage : muni.no_votes,
    abstain: showPercentages ? muni.abstain_percentage : muni.abstain_votes,
    total: muni.total_votes,
    participation: muni.participation_rate
  }));

  return (
    <Grid container spacing={3}>
      {/* Header */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              🏛️ Comparación por Municipios - {stateName}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {proposalTitle}
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      {/* Comparison Chart */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              📊 Comparación de Resultados
            </Typography>
            <Box height={500}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparisonData} margin={{ top: 20, right: 30, left: 20, bottom: 100 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45}
                    textAnchor="end"
                    height={100}
                  />
                  <YAxis />
                  <RechartsTooltip />
                  <Legend />
                  <Bar dataKey="yes" stackId="a" fill="#10B981" name="SÍ" />
                  <Bar dataKey="no" stackId="a" fill="#EF4444" name="NO" />
                  <Bar dataKey="abstain" stackId="a" fill="#F59E0B" name="ABSTENCIÓN" />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Participation Comparison */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              👥 Participación por Municipio
            </Typography>
            <Box height={300}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparisonData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name"
                    angle={-45}
                    textAnchor="end"
                    height={100}
                  />
                  <YAxis />
                  <RechartsTooltip formatter={(value) => [`${value.toFixed(1)}%`, 'Participación']} />
                  <Bar dataKey="participation" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Summary Table */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              📋 Resumen Detallado
            </Typography>
            <Box sx={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f5f5f5' }}>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>
                      Municipio
                    </th>
                    <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #ddd' }}>
                      Total Votos
                    </th>
                    <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #ddd' }}>
                      SÍ
                    </th>
                    <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #ddd' }}>
                      NO
                    </th>
                    <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #ddd' }}>
                      ABSTENCIÓN
                    </th>
                    <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #ddd' }}>
                      Participación
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonData.map((muni, index) => (
                    <tr key={index} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '12px', fontWeight: 'bold' }}>{muni.name}</td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>{muni.total.toLocaleString()}</td>
                      <td style={{ padding: '12px', textAlign: 'center', color: '#10B981' }}>
                        {showPercentages ? `${muni.yes.toFixed(1)}%` : muni.yes.toLocaleString()}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center', color: '#EF4444' }}>
                        {showPercentages ? `${muni.no.toFixed(1)}%` : muni.no.toLocaleString()}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center', color: '#F59E0B' }}>
                        {showPercentages ? `${muni.abstain.toFixed(1)}%` : muni.abstain.toLocaleString()}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        {muni.participation.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

// StatCard Component
const StatCard = ({ title, value, subtitle, icon, color, valueColor }) => (
  <Card>
    <CardContent>
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Box>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {title}
          </Typography>
          <Typography 
            variant="h4" 
            sx={{ 
              color: valueColor || `${color}.main`,
              fontWeight: 'bold'
            }}
          >
            {value}
          </Typography>
          {subtitle && (
            <Typography variant="body2" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </Box>
        <Box sx={{ color: `${color}.main` }}>
          {icon}
        </Box>
      </Box>
    </CardContent>
  </Card>
);

export default ResultsScreen;

---

// src/services/apiService.js (métodos adicionales para resultados)

// Agregar estos métodos al apiService existente:

// Vote Results
async getVoteResults(proposalId) {
  return await api.get(`/proposals/${proposalId}/results`);
},

async getVoteResultsByZone(proposalId, zoneCode, zoneType = 'municipality') {
  return await api.get(`/proposals/${proposalId}/results?${zoneType}_code=${zoneCode}`);
},

async getParticipationStats(proposalId, filters = {}) {
  const params = new URLSearchParams(filters).toString();
  return await api.get(`/proposals/${proposalId}/participation?${params}`);
},

async getMunicipalityComparison(proposalId, stateCode) {
  return await api.get(`/proposals/${proposalId}/comparison?state_code=${stateCode}`);
},

async getVotingTrends(proposalId, timeRange = '30d') {
  return await api.get(`/proposals/${proposalId}/trends?range=${timeRange}`);
},

async exportResults(proposalId, format = 'csv') {
  return await api.get(`/proposals/${proposalId}/export?format=${format}`, {
    responseType: 'blob'
  });
},

---

// backend/routers/voting_results.py
"""
Voting results router with zone-based analytics
"""

from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, desc
from datetime import datetime, timedelta

from ..database import get_db
from .. import models, crud, schemas
from .auth import get_current_user

router = APIRouter()

@router.get("/{proposal_id}/results")
async def get_vote_results(
    proposal_id: int,
    municipality_code: Optional[int] = None,
    state_code: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """Get vote results for a proposal, optionally filtered by zone"""
    
    # Verify proposal exists
    proposal = crud.ProposalCRUD.get_proposal(db, proposal_id)
    if not proposal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Proposal not found"
        )
    
    # Get vote results
    if municipality_code:
        results = crud.VoteCRUD.get_zone_vote_results(db, proposal_id, municipality_code=municipality_code)
    elif state_code:
        results = crud.VoteCRUD.get_zone_vote_results(db, proposal_id, state_code=state_code)
    else:
        results = crud.VoteCRUD.get_vote_results(db, proposal_id)
    
    return results

@router.get("/{proposal_id}/participation")
async def get_participation_stats(
    proposal_id: int,
    municipality_code: Optional[int] = None,
    state_code: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """Get participation statistics for a proposal"""
    
    # Base query for votes
    votes_query = db.query(models.Vote).filter(models.Vote.proposal_id == proposal_id)
    
    # Base query for eligible users
    users_query = db.query(models.User).filter(models.User.is_active == True)
    
    # Apply zone filters
    if municipality_code:
        votes_query = votes_query.filter(models.Vote.municipality_code == municipality_code)
        users_query = users_query.filter(models.User.municipality_code == municipality_code)
    elif state_code:
        votes_query = votes_query.filter(models.Vote.state_code == state_code)
        users_query = users_query.filter(models.User.state_code == state_code)
    
    # Calculate statistics
    total_votes = votes_query.count()
    eligible_users = users_query.count()
    participation_rate = (total_votes / eligible_users * 100) if eligible_users > 0 else 0
    
    # Get participation timeline (last 30 days)
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    timeline_data = []
    
    for i in range(30):
        date = thirty_days_ago + timedelta(days=i)
        daily_votes = votes_query.filter(
            func.date(models.Vote.created_at) <= date.date()
        ).count()
        
        timeline_data.append({
            "date": date.isoformat(),
            "cumulative_votes": daily_votes,
            "daily_votes": daily_votes - (timeline_data[-1]["cumulative_votes"] if timeline_data else 0)
        })
    
    return {
        "proposal_id": proposal_id,
        "total_votes": total_votes,
        "eligible_users": eligible_users,
        "participation_rate": participation_rate,
        "timeline": timeline_data,
        "municipality_code": municipality_code,
        "state_code": state_code
    }

@router.get("/{proposal_id}/comparison")
async def get_municipality_comparison(
    proposal_id: int,
    state_code: int,
    db: Session = Depends(get_db)
):
    """Get comparison of vote results across municipalities in a state"""
    
    # Verify proposal exists
    proposal = crud.ProposalCRUD.get_proposal(db, proposal_id)
    if not proposal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Proposal not found"
        )
    
    # Get unique municipalities in the state that have votes
    municipalities_with_votes = db.query(
        models.Vote.municipality_code,
        func.count(models.Vote.id).label('total_votes')
    ).filter(
        models.Vote.proposal_id == proposal_id,
        models.Vote.state_code == state_code
    ).group_by(models.Vote.municipality_code).all()
    
    comparison_data = []
    
    for muni_code, total_votes in municipalities_with_votes:
        # Get detailed vote breakdown for this municipality
        vote_breakdown = db.query(
            models.Vote.vote_value,
            func.count(models.Vote.id).label('count')
        ).filter(
            models.Vote.proposal_id == proposal_id,
            models.Vote.municipality_code == muni_code
        ).group_by(models.Vote.vote_value).all()
        
        # Calculate percentages
        vote_counts = {1: 0, 2: 0, 3: 0}  # yes, no, abstain
        for vote_value, count in vote_breakdown:
            vote_counts[vote_value] = count
        
        # Get eligible users in this municipality
        eligible_users = db.query(models.User).filter(
            models.User.municipality_code == muni_code,
            models.User.state_code == state_code,
            models.User.is_active == True
        ).count()
        
        participation_rate = (total_votes / eligible_users * 100) if eligible_users > 0 else 0
        
        # Get municipality name (you might want to add a municipalities table)
        municipality_name = f"Municipio {muni_code}"  # Placeholder
        
        comparison_data.append({
            "municipality_code": muni_code,
            "municipality_name": municipality_name,
            "total_votes": total_votes,
            "yes_votes": vote_counts[1],
            "no_votes": vote_counts[2],
            "abstain_votes": vote_counts[3],
            "yes_percentage": (vote_counts[1] / total_votes * 100) if total_votes > 0 else 0,
            "no_percentage": (vote_counts[2] / total_votes * 100) if total_votes > 0 else 0,
            "abstain_percentage": (vote_counts[3] / total_votes * 100) if total_votes > 0 else 0,
            "eligible_users": eligible_users,
            "participation_rate": participation_rate
        })
    
    # Sort by total votes descending
    comparison_data.sort(key=lambda x: x["total_votes"], reverse=True)
    
    return {
        "proposal_id": proposal_id,
        "state_code": state_code,
        "municipalities": comparison_data,
        "total_municipalities": len(comparison_data)
    }

@router.get("/{proposal_id}/trends")
async def get_voting_trends(
    proposal_id: int,
    range: str = Query("30d", description="Time range: 7d, 30d, 90d"),
    municipality_code: Optional[int] = None,
    state_code: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """Get voting trends over time"""
    
    # Parse time range
    days_map = {"7d": 7, "30d": 30, "90d": 90}
    days = days_map.get(range, 30)
    
    start_date = datetime.utcnow() - timedelta(days=days)
    
    # Base query
    votes_query = db.query(models.Vote).filter(
        models.Vote.proposal_id == proposal_id,
        models.Vote.created_at >= start_date
    )
    
    # Apply zone filters
    if municipality_code:
        votes_query = votes_query.filter(models.Vote.municipality_code == municipality_code)
    elif state_code:
        votes_query = votes_query.filter(models.Vote.state_code == state_code)
    
    # Group by date and vote value
    daily_trends = db.query(
        func.date(models.Vote.created_at).label('date'),
        models.Vote.vote_value,
        func.count(models.Vote.id).label('count')
    ).filter(
        models.Vote.proposal_id == proposal_id,
        models.Vote.created_at >= start_date
    ).group_by(
        func.date(models.Vote.created_at),
        models.Vote.vote_value
    ).all()
    
    # Process into timeline format
    trend_data = {}
    for date, vote_value, count in daily_trends:
        date_str = date.isoformat()
        if date_str not in trend_data:
            trend_data[date_str] = {"date": date_str, "yes": 0, "no": 0, "abstain": 0}
        
        if vote_value == 1:
            trend_data[date_str]["yes"] = count
        elif vote_value == 2:
            trend_data[date_str]["no"] = count
        elif vote_value == 3:
            trend_data[date_str]["abstain"] = count
    
    # Convert to list and sort by date
    timeline = list(trend_data.values())
    timeline.sort(key=lambda x: x["date"])
    
    # Calculate cumulative data
    cumulative_yes = 0
    cumulative_no = 0
    cumulative_abstain = 0
    
    for entry in timeline:
        cumulative_yes += entry["yes"]
        cumulative_no += entry["no"]
        cumulative_abstain += entry["abstain"]
        
        entry["cumulative_yes"] = cumulative_yes
        entry["cumulative_no"] = cumulative_no
        entry["cumulative_abstain"] = cumulative_abstain
        entry["cumulative_total"] = cumulative_yes + cumulative_no + cumulative_abstain
    
    return {
        "proposal_id": proposal_id,
        "time_range": range,
        "municipality_code": municipality_code,
        "state_code": state_code,
        "timeline": timeline
    }

@router.get("/{proposal_id}/demographics")
async def get_voting_demographics(
    proposal_id: int,
    municipality_code: Optional[int] = None,
    state_code: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """Get demographic breakdown of voters"""
    
    # Base query joining votes with users
    query = db.query(
        models.Vote.vote_value,
        models.User.municipality_code,
        models.User.state_code,
        func.extract('year', models.User.created_at).label('registration_year'),
        func.count(models.Vote.id).label('count')
    ).join(models.User).filter(models.Vote.proposal_id == proposal_id)
    
    # Apply zone filters
    if municipality_code:
        query = query.filter(models.Vote.municipality_code == municipality_code)
    elif state_code:
        query = query.filter(models.Vote.state_code == state_code)
    
    # Group by demographics
    demographics = query.group_by(
        models.Vote.vote_value,
        models.User.municipality_code,
        models.User.state_code,
        func.extract('year', models.User.created_at)
    ).all()
    
    # Process results
    demographic_breakdown = {
        "by_municipality": {},
        "by_registration_year": {},
        "summary": {
            "total_municipalities": len(set(d.municipality_code for d in demographics)),
            "voter_tenure_distribution": {}
        }
    }
    
    for demo in demographics:
        # By municipality
        muni_key = f"muni_{demo.municipality_code}"
        if muni_key not in demographic_breakdown["by_municipality"]:
            demographic_breakdown["by_municipality"][muni_key] = {
                "municipality_code": demo.municipality_code,
                "yes": 0, "no": 0, "abstain": 0
            }
        
        vote_type = ["", "yes", "no", "abstain"][demo.vote_value]
        demographic_breakdown["by_municipality"][muni_key][vote_type] += demo.count
        
        # By registration year
        year_key = str(int(demo.registration_year))
        if year_key not in demographic_breakdown["by_registration_year"]:
            demographic_breakdown["by_registration_year"][year_key] = {
                "year": year_key,
                "yes": 0, "no": 0, "abstain": 0
            }
        
        demographic_breakdown["by_registration_year"][year_key][vote_type] += demo.count
    
    return demographic_breakdown

@router.get("/{proposal_id}/export")
async def export_results(
    proposal_id: int,
    format: str = Query("csv", description="Export format: csv, json, xlsx"),
    municipality_code: Optional[int] = None,
    state_code: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """Export vote results in various formats"""
    
    from fastapi.responses import StreamingResponse
    import csv
    import json
    import io
    
    # Get results data
    if municipality_code:
        results = crud.VoteCRUD.get_zone_vote_results(db, proposal_id, municipality_code=municipality_code)
    elif state_code:
        results = crud.VoteCRUD.get_zone_vote_results(db, proposal_id, state_code=state_code)
    else:
        results = crud.VoteCRUD.get_vote_results(db, proposal_id)
    
    # Get proposal info
    proposal = crud.ProposalCRUD.get_proposal(db, proposal_id)
    
    export_data = {
        "proposal_id": proposal_id,
        "proposal_title": proposal.title if proposal else "Unknown",
        "export_date": datetime.utcnow().isoformat(),
        "municipality_code": municipality_code,
        "state_code": state_code,
        "results": results
    }
    
    if format == "json":
        json_str = json.dumps(export_data, indent=2, default=str)
        return StreamingResponse(
            io.StringIO(json_str),
            media_type="application/json",
            headers={"Content-Disposition": f"attachment; filename=results_{proposal_id}.json"}
        )
    
    elif format == "csv":
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Write headers
        writer.writerow([
            "Propuesta ID", "Título", "Municipio", "Estado", 
            "Votos SÍ", "Votos NO", "Abstenciones", "Total Votos",
            "% SÍ", "% NO", "% Abstención", "Fecha Exportación"
        ])
        
        # Write data
        writer.writerow([
            proposal_id,
            proposal.title if proposal else "Unknown",
            municipality_code or "Todos",
            state_code or "Todos",
            results.get("yes_votes", 0),
            results.get("no_votes", 0),
            results.get("abstain_votes", 0),
            results.get("total_votes", 0),
            f"{results.get('yes_percentage', 0):.2f}%",
            f"{results.get('no_percentage', 0):.2f}%",
            f"{results.get('abstain_percentage', 0):.2f}%",
            datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
        ])
        
        output.seek(0)
        return StreamingResponse(
            io.StringIO(output.getvalue()),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename=results_{proposal_id}.csv"}
        )
    
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported export format"
        )

---

# backend/main.py (agregar router de resultados)

# Agregar esta línea en la sección de routers:
from .routers import voting_results

# Y esta línea para incluir el router:
app.include_router(voting_results.router, prefix="/proposals", tags=["Voting Results"])

---

# src/components/LiveResultsWidget.js
import React, { useState, useEffect } from 'react';
import { useQuery } from 'react-query';
import {
  Card,
  CardContent,
  Typography,
  Box,
  LinearProgress,
  Chip,
  Stack,
  IconButton,
  Collapse
} from '@mui/material';
import { ExpandMore, ExpandLess, TrendingUp } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { apiService } from '../services/apiService';

const LiveResultsWidget = ({ proposalId, title, compact = false }) => {
  const [expanded, setExpanded] = useState(false);

  const { data: results, isLoading } = useQuery(
    ['live-results', proposalId],
    () => apiService.getVoteResults(proposalId),
    {
      refetchInterval: 30000, // Refresh every 30 seconds
      enabled: !!proposalId,
    }
  );

  if (isLoading || !results) {
    return (
      <Card>
        <CardContent>
          <LinearProgress />
          <Typography variant="body2" sx={{ mt: 1 }}>
            Cargando resultados...
          </Typography>
        </CardContent>
      </Card>
    );
  }

  const getWinner = () => {
    const max = Math.max(results.yes_votes, results.no_votes, results.abstain_votes);
    if (results.yes_votes === max) return { option: 'SÍ', color: '#10B981' };
    if (results.no_votes === max) return { option: 'NO', color: '#EF4444' };
    return { option: 'ABSTENCIÓN', color: '#F59E0B' };
  };

  const winner = getWinner();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
            <Box flexGrow={1}>
              <Typography variant="h6" gutterBottom>
                📊 Resultados en Vivo
              </Typography>
              {title && (
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {title.length > 60 ? `${title.substring(0, 60)}...` : title}
                </Typography>
              )}
            </Box>
            <IconButton 
              onClick={() => setExpanded(!expanded)}
              size="small"
            >
              {expanded ? <ExpandLess /> : <ExpandMore />}
            </IconButton>
          </Box>

          {/* Quick Summary */}
          <Stack direction="row" spacing={2} alignItems="center" mb={2}>
            <Chip 
              label={`Ganando: ${winner.option}`}
              sx={{ 
                backgroundColor: winner.color,
                color: 'white',
                fontWeight: 'bold'
              }}
              icon={<TrendingUp sx={{ color: 'white !important' }} />}
            />
            <Typography variant="body2" color="text.secondary">
              {results.total_votes.toLocaleString()} votos totales
            </Typography>
          </Stack>

          {/* Progress Bars */}
          <Stack spacing={2}>
            <Box>
              <Box display="flex" justifyContent="space-between" mb={0.5}>
                <Typography variant="body2">SÍ</Typography>
                <Typography variant="body2" fontWeight="bold" color="#10B981">
                  {results.yes_percentage.toFixed(1)}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={results.yes_percentage}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: '#e0e0e0',
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: '#10B981'
                  }
                }}
              />
            </Box>

            <Box>
              <Box display="flex" justifyContent="space-between" mb={0.5}>
                <Typography variant="body2">NO</Typography>
                <Typography variant="body2" fontWeight="bold" color="#EF4444">
                  {results.no_percentage.toFixed(1)}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={results.no_percentage}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: '#e0e0e0',
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: '#EF4444'
                  }
                }}
              />
            </Box>

            <Box>
              <Box display="flex" justifyContent="space-between" mb={0.5}>
                <Typography variant="body2">ABSTENCIÓN</Typography>
                <Typography variant="body2" fontWeight="bold" color="#F59E0B">
                  {results.abstain_percentage.toFixed(1)}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={results.abstain_percentage}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: '#e0e0e0',
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: '#F59E0B'
                  }
                }}
              />
            </Box>
          </Stack>

          {/* Expanded Details */}
          <Collapse in={expanded}>
            <Box mt={3}>
              <Typography variant="subtitle2" gutterBottom>
                Desglose Detallado
              </Typography>
              <Stack spacing={1}>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2">Votos SÍ:</Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {results.yes_votes.toLocaleString()}
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2">Votos NO:</Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {results.no_votes.toLocaleString()}
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2">Abstenciones:</Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {results.abstain_votes.toLocaleString()}
                  </Typography>
                </Box>
              </Stack>
            </Box>
          </Collapse>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default LiveResultsWidget;