import React from 'react';
import { BarChart3, PieChart, TrendingUp, Calendar } from 'lucide-react';

interface ChartEmptyStateProps {
  title?: string;
  description?: string;
  type?: 'bar' | 'pie' | 'line' | 'area';
  className?: string;
}

export const ChartEmptyState: React.FC<ChartEmptyStateProps> = ({
  title = "Nincs adat",
  description = "Jelenleg nem áll rendelkezésre adat ehhez a diagramhoz.",
  type = 'bar',
  className = ""
}) => {
  const getIcon = () => {
    switch (type) {
      case 'pie':
        return <PieChart className="h-12 w-12 text-gray-400" />;
      case 'line':
      case 'area':
        return <TrendingUp className="h-12 w-12 text-gray-400" />;
      default:
        return <BarChart3 className="h-12 w-12 text-gray-400" />;
    }
  };

  return (
    <div className={`flex flex-col items-center justify-center h-full min-h-[200px] p-8 text-center ${className}`}>
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg"></div>
      </div>
      
      {/* Content */}
      <div className="relative z-10 flex flex-col items-center space-y-4">
        {/* Icon */}
        <div className="p-4 bg-gray-50 rounded-full border-2 border-dashed border-gray-300">
          {getIcon()}
        </div>
        
        {/* Title */}
        <h3 className="text-lg font-medium text-gray-700">
          {title}
        </h3>
        
        {/* Description */}
        <p className="text-sm text-gray-500 max-w-sm leading-relaxed">
          {description}
        </p>
        
        {/* Suggestion */}
        <div className="flex items-center space-x-2 text-xs text-gray-400 mt-4">
          <Calendar className="h-4 w-4" />
          <span>Próbáljon meg más időszakot választani</span>
        </div>
      </div>
    </div>
  );
};