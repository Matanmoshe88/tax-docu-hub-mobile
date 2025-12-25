interface QuickTaxLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function QuickTaxLogo({ className = '', size = 'md' }: QuickTaxLogoProps) {
  const sizeConfig = {
    sm: {
      textSize: '20px',
      taglineSize: '11px',
      lineWidth: 6,
      lineHeights: [15, 24, 33],
      gap: 2,
      radius: 3,
      containerGap: 8,
    },
    md: {
      textSize: '28px',
      taglineSize: '14px',
      lineWidth: 8,
      lineHeights: [20, 32, 44],
      gap: 3,
      radius: 4,
      containerGap: 12,
    },
    lg: {
      textSize: '36px',
      taglineSize: '16px',
      lineWidth: 10,
      lineHeights: [25, 40, 55],
      gap: 4,
      radius: 5,
      containerGap: 16,
    },
  };

  const config = sizeConfig[size];
  const colors = ['#ffcc00', '#00ca72', '#5493f7'];

  return (
    <div 
      className={className}
      dir="ltr"
      style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: `${config.containerGap}px` 
      }}
    >
      {/* Icon - Three diagonal lines */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'flex-end', 
        gap: `${config.gap}px`, 
        transform: 'rotate(-20deg)' 
      }}>
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

      {/* Text */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
        <span style={{ 
          fontSize: config.textSize, 
          fontWeight: 'bold', 
          color: '#060644',
          fontFamily: 'Inter, sans-serif',
          lineHeight: 1.1,
        }}>
          QuickTax
        </span>
        <span style={{ 
          fontSize: config.taglineSize, 
          color: '#666e81',
          fontFamily: 'Inter, sans-serif',
        }}>
          החזרי מס בקלות!
        </span>
      </div>
    </div>
  );
}
