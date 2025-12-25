import React from 'react';
import logoImage from '@/assets/quicktax-logo-new.png';

interface QuickTaxLogoProps {
  size?: 'small' | 'medium' | 'large';
}

export const QuickTaxLogo: React.FC<QuickTaxLogoProps> = ({ 
  size = 'medium' 
}) => {
  const sizeConfig = {
    small: 'h-8',
    medium: 'h-10',
    large: 'h-14',
  };

  return (
    <img 
      src={logoImage} 
      alt="QuickTax - החזרי מס בקלות!" 
      className={`${sizeConfig[size]} w-auto object-contain`}
    />
  );
};
