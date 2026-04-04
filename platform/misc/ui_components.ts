// src/components/ui/TagBadge.tsx
import React from 'react';

interface TagBadgeProps {
  tag: string;
  isSelected?: boolean;
  onClick?: () => void;
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'gray';
}

export const TagBadge: React.FC<TagBadgeProps> = ({ 
  tag, 
  isSelected = false, 
  onClick, 
  color = 'blue' 
}) => {
  const colorClasses = {
    blue: isSelected ? 'bg-blue-500 text-white' : 'bg-blue-100 text-blue-800 hover:bg-blue-200',
    green: isSelected ? 'bg-green-500 text-white' : 'bg-green-100 text-green-800 hover:bg-green-200',
    red: isSelected ? 'bg-red-500 text-white' : 'bg-red-100 text-red-800 hover:bg-red-200',
    yellow: isSelected ? 'bg-yellow-500 text-white' : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
    purple: isSelected ? 'bg-purple-500 text-white' : 'bg-purple-100 text-purple-800 hover:bg-purple-200',
    gray: isSelected ? 'bg-gray-500 text-white' : 'bg-gray-100 text-gray-800 hover:bg-gray-200',
  };

  return (
    <span
      className={`
        inline-flex items-center px-3 py-1 rounded-full text-sm font-medium
        ${colorClasses[color]}
        ${onClick ? 'cursor-pointer transition-colors duration-200' : ''}
        ${isSelected ? 'ring-2 ring-offset-2 ring-blue-500' : ''}
      `}
      onClick={onClick}
    >
      {tag}
    </span>
  );
};

// src/components/ui/StarRating.tsx
import React from 'react';

interface StarRatingProps {
  rating: number;
  totalStars?: number;
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  onRatingChange?: (rating: number) => void;
}

export const StarRating: React.FC<StarRatingProps> = ({
  rating,
  totalStars = 5,
  size = 'md',
  interactive = false,
  onRatingChange,
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const handleStarClick = (starIndex: number) => {
    if (interactive && onRatingChange) {
      onRatingChange(starIndex + 1);
    }
  };

  return (
    <div className="flex items-center space-x-1">
      {[...Array(totalStars)].map((_, index) => {
        const isFilled = index < Math.floor(rating);
        const isHalfFilled = index === Math.floor(rating) && rating % 1 !== 0;
        
        return (
          <button
            key={index}
            className={`
              ${sizeClasses[size]}
              ${interactive ? 'hover:scale-110 transition-transform duration-150 cursor-pointer' : 'cursor-default'}
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded
            `}
            onClick={() => handleStarClick(index)}
            disabled={!interactive}
          >
            <svg
              className={`
                w-full h-full
                ${isFilled ? 'text-yellow-400' : isHalfFilled ? 'text-yellow-400' : 'text-gray-300'}
              `}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </button>
        );
      })}
      <span className="ml-2 text-sm text-gray-600">
        {rating.toFixed(1)} / {totalStars}
      </span>
    </div>
  );
};

// src/components/ui/MunicipalityCard.tsx
import React from 'react';

interface MunicipalityCardProps {
  municipality: string;
  activeProposals: number;
  totalVotes: number;
  isSelected?: boolean;
  onClick?: () => void;
}

export const MunicipalityCard: React.FC<MunicipalityCardProps> = ({
  municipality,
  activeProposals,
  totalVotes,
  isSelected = false,
  onClick,
}) => {
  return (
    <div
      className={`
        p-6 rounded-lg shadow-md border-2 transition-all duration-200
        ${isSelected 
          ? 'border-blue-500 bg-blue-50 shadow-lg' 
          : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-lg'
        }
        ${onClick ? 'cursor-pointer' : ''}
      `}
      onClick={onClick}
    >
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {municipality}
      </h3>
      
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Propuestas activas:</span>
          <span className="font-medium text-blue-600">{activeProposals}</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Total de votos:</span>
          <span className="font-medium text-green-600">{totalVotes.toLocaleString()}</span>
        </div>
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">Participación ciudadana</span>
          <div className={`
            px-2 py-1 rounded-full text-xs font-medium
            ${totalVotes > 1000 
              ? 'bg-green-100 text-green-800' 
              : totalVotes > 500 
                ? 'bg-yellow-100 text-yellow-800' 
                : 'bg-red-100 text-red-800'
            }
          `}>
            {totalVotes > 1000 ? 'Alta' : totalVotes > 500 ? 'Media' : 'Baja'}
          </div>
        </div>
      </div>
    </div>
  );
};

// src/components/ui/VoteSummaryBar.tsx
import React from 'react';

interface VoteOption {
  id: string;
  text: string;
  votes: number;
  percentage: number;
  color: string;
}

interface VoteSummaryBarProps {
  options: VoteOption[];
  totalVotes: number;
  showPercentages?: boolean;
}

export const VoteSummaryBar: React.FC<VoteSummaryBarProps> = ({
  options,
  totalVotes,
  showPercentages = true,
}) => {
  const colors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-red-500',
    'bg-yellow-500',
    'bg-purple-500',
    'bg-pink-500',
  ];

  return (
    <div className="w-full">
      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-6 mb-4 overflow-hidden">
        <div className="h-full flex">
          {options.map((option, index) => (
            <div
              key={option.id}
              className={`${colors[index % colors.length]} transition-all duration-500`}
              style={{ width: `${option.percentage}%` }}
              title={`${option.text}: ${option.votes} votos (${option.percentage.toFixed(1)}%)`}
            />
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="space-y-2">
        {options.map((option, index) => (
          <div key={option.id} className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2">
              <div className={`w-4 h-4 rounded ${colors[index % colors.length]}`} />
              <span className="text-gray-700">{option.text}</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-600">
              <span>{option.votes.toLocaleString()} votos</span>
              {showPercentages && (
                <span className="font-medium">({option.percentage.toFixed(1)}%)</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Total */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex justify-between items-center text-sm font-medium text-gray-900">
          <span>Total de votos:</span>
          <span>{totalVotes.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
};