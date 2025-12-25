import React from 'react';

interface QuickTaxLogoProps {
  size?: 'small' | 'medium' | 'large';
  showTagline?: boolean;
}

export const QuickTaxLogo: React.FC<QuickTaxLogoProps> = ({ 
  size = 'medium',
  showTagline = true 
}) => {
  const sizeConfig = {
    small: {
      barWidth: 4,
      barHeight: 16,
      gap: 2,
      textSize: 'text-lg',
      taglineSize: 'text-xs',
    },
    medium: {
      barWidth: 6,
      barHeight: 24,
      gap: 3,
      textSize: 'text-2xl',
      taglineSize: 'text-sm',
    },
    large: {
      barWidth: 8,
      barHeight: 32,
      gap: 4,
      textSize: 'text-4xl',
      taglineSize: 'text-base',
    },
  };

  const config = sizeConfig[size];

  return (
    <div className="flex items-center gap-3">
      {/* Three colored bars */}
      <div className="flex" style={{ gap: config.gap }}>
        <div 
          className="rounded-full"
          style={{ 
            width: config.barWidth, 
            height: config.barHeight,
            backgroundColor: '#5493f7' 
          }} 
        />
        <div 
          className="rounded-full"
          style={{ 
            width: config.barWidth, 
            height: config.barHeight,
            backgroundColor: '#00ca72' 
          }} 
        />
        <div 
          className="rounded-full"
          style={{ 
            width: config.barWidth, 
            height: config.barHeight,
            backgroundColor: '#ffcc00' 
          }} 
        />
      </div>
      
      {/* Text content */}
      <div className="flex flex-col">
        <span 
          className={`${config.textSize} font-bold leading-tight`}
          style={{ color: '#060644' }}
        >
          QuickTax
        </span>
        {showTagline && (
          <span 
            className={`${config.taglineSize} leading-tight`}
            style={{ color: '#666e81' }}
          >
            החזרי מס בקלות!
          </span>
        )}
      </div>
    </div>
  );
};
