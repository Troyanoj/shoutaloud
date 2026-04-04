import React from 'react';

interface CategoryData {
  category: string;
  count: number;
  percentage: number;
  color: string;
}

interface CategoryChartProps {
  data: CategoryData[];
  title: string;
  className?: string;
}

const CategoryChart: React.FC<CategoryChartProps> = ({
  data,
  title,
  className = ''
}) => {
  const maxCount = Math.max(...data.map(item => item.count));

  const getCategoryIcon = (category: string): string => {
    const icons: { [key: string]: string } = {
      'transporte': '🚌',
      'educacion': '🏫',
      'salud': '🏥',
      'seguridad': '🛡️',
      'medio_ambiente': '🌱',
      'infraestructura': '🏗️',
      'cultura': '🎭',
      'deportes': '⚽',
      'economia': '💰',
      'otros': '📋'
    };
    return icons[category.toLowerCase()] || '📋';
  };

  const formatCategoryName = (category: string): string => {
    return category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className={`bg-white rounded-xl p-6 border border-gray-100 shadow-sm ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-6">{title}</h3>
      
      <div className="space-y-4">
        {data.map((item, index) => (
          <div key={index} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">{getCategoryIcon(item.category)}</span>
                <span className="text-sm font-medium text-gray-700">
                  {formatCategoryName(item.category)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-900">
                  {item.count}
                </span>
                <span className="text-xs text-gray-500">
                  ({item.percentage.toFixed(1)}%)
                </span>
              </div>
            </div>
            
            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500 ease-out"
                style={{
                  width: `${(item.count / maxCount) * 100}%`,
                  backgroundColor: item.color
                }}
              />
            </div>
          </div>
        ))}
      </div>
      
      {data.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p className="text-sm">No hay datos de categorías disponibles</p>
        </div>
      )}
    </div>
  );
};

export default CategoryChart;