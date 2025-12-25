interface QuickTaxLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function QuickTaxLogo({ className = '', size = 'md' }: QuickTaxLogoProps) {
  const sizeConfig = {
    sm: {
      text: 'text-xl',
      tagline: 'text-xs',
      lineWidth: 6,
      lineHeights: [15, 24, 33],
      gap: 2,
      radius: 3,
    },
    md: {
      text: 'text-[28px]',
      tagline: 'text-sm',
      lineWidth: 8,
      lineHeights: [20, 32, 44],
      gap: 3,
      radius: 4,
    },
    lg: {
      text: 'text-4xl',
      tagline: 'text-base',
      lineWidth: 10,
      lineHeights: [25, 40, 55],
      gap: 4,
      radius: 5,
    },
  };

  const config = sizeConfig[size];
  const colors = ['#ffcc00', '#00ca72', '#5493f7'];

  return (
    <div className={`flex flex-col items-end ${className}`}>
      {/* Logo Row - Icon + Text */}
      <div className="flex items-center gap-2">
        {/* Icon - Three diagonal lines */}
        <div 
          className="flex items-end"
          style={{ 
            transform: 'rotate(-20deg)',
            gap: `${config.gap}px`,
          }}
        >
          {config.lineHeights.map((height, index) => (
            <div
              key={index}
              style={{
                width: `${config.lineWidth}px`,
                height: `${height}px`,
                backgroundColor: colors[index],
                borderRadius: `${config.radius}px`,
              }}
            />
          ))}
        </div>

        {/* QuickTax Text */}
        <span 
          className={`font-bold ${config.text} tracking-tight`}
          style={{ 
            color: '#060644',
            fontFamily: 'Inter, sans-serif',
          }}
        >
          QuickTax
        </span>
      </div>

      {/* Hebrew Tagline - aligned right */}
      <span 
        className={`${config.tagline} mt-1`}
        style={{ 
          color: '#666e81',
          fontFamily: 'Inter, sans-serif',
        }}
        dir="rtl"
      >
        החזרי מס בקלות!
      </span>
    </div>
  );
}
