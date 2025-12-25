interface QuickTaxLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function QuickTaxLogo({ className = '', size = 'md' }: QuickTaxLogoProps) {
  const sizeClasses = {
    sm: 'text-2xl',
    md: 'text-4xl',
    lg: 'text-5xl',
  };

  const taglineSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  const lineSizes = {
    sm: { width: 40, height: 3, gap: 2 },
    md: { width: 60, height: 4, gap: 3 },
    lg: { width: 80, height: 5, gap: 4 },
  };

  const lineConfig = lineSizes[size];

  return (
    <div className={`flex flex-col items-center ${className}`}>
      {/* Main Logo Text */}
      <div className="flex items-center gap-2">
        <span 
          className={`font-bold ${sizeClasses[size]} tracking-tight`}
          style={{ color: '#060644' }}
        >
          Quicktax
        </span>
        
        {/* Colored Lines */}
        <div 
          className="flex flex-col justify-center"
          style={{ gap: `${lineConfig.gap}px` }}
        >
          <div 
            style={{ 
              width: `${lineConfig.width}px`, 
              height: `${lineConfig.height}px`, 
              backgroundColor: '#5493f7',
              borderRadius: '2px'
            }} 
          />
          <div 
            style={{ 
              width: `${lineConfig.width}px`, 
              height: `${lineConfig.height}px`, 
              backgroundColor: '#00ca72',
              borderRadius: '2px'
            }} 
          />
          <div 
            style={{ 
              width: `${lineConfig.width}px`, 
              height: `${lineConfig.height}px`, 
              backgroundColor: '#ffcc00',
              borderRadius: '2px'
            }} 
          />
        </div>
      </div>

      {/* Hebrew Tagline */}
      <span 
        className={`${taglineSizes[size]} mt-1 font-medium`}
        style={{ color: '#666e81' }}
      >
        החזרי מס בקלות!
      </span>
    </div>
  );
}
