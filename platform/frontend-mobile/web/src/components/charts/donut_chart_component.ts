import React from 'react';

interface DonutData {
  label: string;
  value: number;
  color: string;
  percentage: number;
}

interface DonutChartProps {
  data: DonutData[];
  title: string;
  centerLabel?: string;
  centerValue?: string;
  className?: string;
}

const DonutChart: React.FC<DonutChartProps> = ({
  data,
  title,
  centerLabel,
  centerValue,
  className = ''
}) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const size = 160;
  const strokeWidth = 20;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  
  let cumulativePercentage = 0;

  const getStatusIcon = (label: string): string => {
    const icons: { [key: string]: string } = {
      'validadas': '✅',
      'pendientes': '⏳',
      'rechazadas': '❌',
      'validated': '✅',
      'pending': '⏳',
      'rejected': '❌'
    };
    return icons[label.toLowerCase()] || '📊';
  };

  const formatLabel = (label: string): string => {
    const translations: { [key: string]: string } = {
      'validated': 'Validadas',
      'pending': 'Pendientes',
      'rejected': 'Rechazadas'
    };
    return translations[label.toLowerCase()] || label;
  };

  return (
    <div className={`bg-white rounded-xl p-6 border border-gray-100 shadow-sm ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-6">{title}</h3>
      
      <div className="flex flex-col lg:flex-row items-center gap-6">
        {/* Gráfico Donut */}
        <div className="relative flex-shrink-0">
          <svg width={size} height={size} className="transform -rotate-90">
            {data.map((item, index) => {
              const strokeDasharray = `${(item.percentage / 100) * circumference} ${circumference}`;
              const strokeDashoffset = -cumulativePercentage * circumference / 100;
              cumulativePercentage += item.percentage;
              
              return (
                <circle
                  key={index}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="transparent"
                  stroke={item.color}
                  strokeWidth={strokeWidth}
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  className="transition-all duration-500 ease-out"
                />
              );
            })}
          </svg>
          
          {/* Centro del donut */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-center">
              {centerValue && (
                <div className="text-2xl font-bold text-gray-900">{centerValue}</div>
              )}
              {centerLabel && (
                <div className="text-sm text-gray-600 mt-1">{centerLabel}</div>
              )}
            </div>
          </div>
        </div>
        
        {/* Leyenda */}
        <div className="flex-1 space-y-3">
          {data.map((item, index) => (
            <div key={index} className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded-full flex-shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-lg">{getStatusIcon(item.label)}</span>
              </div>
              
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    {formatLabel(item.label)}
                  </span>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-gray-900">
                      {item.value.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500">
                      {item.percentage.toFixed(1)}%
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {total === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p className="text-sm">No hay datos disponibles</p>
        </div>
      )}
    </div>
  );
};

export default DonutChart;