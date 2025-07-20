import React from 'react';

interface LoadingOverlayProps {
  isVisible: boolean;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ isVisible }) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Blurred background */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-md" />
      
      {/* Loading content */}
      <div className="relative z-10 flex flex-col items-center justify-center space-y-8">
        {/* Animated logo */}
        <div className="relative">
          {/* Rotating ring around logo */}
          <div className="absolute inset-0 w-32 h-32 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          
          {/* Pulsing background circle */}
          <div className="absolute inset-2 w-28 h-28 bg-primary/10 rounded-full animate-pulse" />
          
          {/* Logo */}
          <div className="relative flex items-center justify-center w-32 h-32">
            <div className="text-3xl font-bold text-primary animate-scale-in">
              QuickTax
            </div>
          </div>
          
          {/* Orbiting dots */}
          <div className="absolute inset-0 w-32 h-32">
            <div className="absolute top-0 left-1/2 w-2 h-2 bg-primary rounded-full animate-orbit-1 -translate-x-1/2" />
            <div className="absolute top-1/2 right-0 w-2 h-2 bg-primary rounded-full animate-orbit-2 -translate-y-1/2" />
            <div className="absolute bottom-0 left-1/2 w-2 h-2 bg-primary rounded-full animate-orbit-3 -translate-x-1/2" />
            <div className="absolute top-1/2 left-0 w-2 h-2 bg-primary rounded-full animate-orbit-4 -translate-y-1/2" />
          </div>
        </div>
        
        {/* Hebrew text */}
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-foreground animate-fade-in">
            כמה רגעים אנחנו עובדים על זה
          </h2>
          <p className="text-muted-foreground animate-fade-in" style={{ animationDelay: '0.2s' }}>
            מעבד את החתימה ושולח למערכת...
          </p>
        </div>
        
        {/* Progress dots */}
        <div className="flex space-x-2">
          <div className="w-3 h-3 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
          <div className="w-3 h-3 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
          <div className="w-3 h-3 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
        </div>
      </div>
    </div>
  );
};