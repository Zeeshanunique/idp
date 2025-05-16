import React from 'react';

interface ColorSwatchProps {
  colorName: string;
  colorClass: string;
  textClass?: string;
  description?: string;
}

export function ColorSwatch({ colorName, colorClass, textClass = 'text-white', description }: ColorSwatchProps) {
  return (
    <div className="flex flex-col space-y-1">
      <div 
        className={`${colorClass} h-16 rounded-md flex items-center justify-center ${textClass}`}
      >
        {colorName}
      </div>
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
    </div>
  );
}

export function ColorPalette() {
  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold mb-3">Brand Colors</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ColorSwatch 
            colorName="Primary" 
            colorClass="bg-brand-primary" 
            description="Main brand color"
          />
          <ColorSwatch 
            colorName="Secondary" 
            colorClass="bg-brand-secondary" 
            description="Secondary brand color"
          />
          <ColorSwatch 
            colorName="Accent" 
            colorClass="bg-brand-accent" 
            description="Accent brand color"
          />
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-semibold mb-3">Status Colors</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <ColorSwatch 
            colorName="Success" 
            colorClass="bg-success" 
            description="For successful actions"
          />
          <ColorSwatch 
            colorName="Info" 
            colorClass="bg-info" 
            description="For informational elements"
          />
          <ColorSwatch 
            colorName="Warning" 
            colorClass="bg-warning" 
            description="For warnings and cautions"
          />
          <ColorSwatch 
            colorName="Error" 
            colorClass="bg-error" 
            description="For errors and critical issues"
          />
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-semibold mb-3">Chart Colors</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <ColorSwatch colorName="Chart 1" colorClass="bg-chart-1" />
          <ColorSwatch colorName="Chart 2" colorClass="bg-chart-2" />
          <ColorSwatch colorName="Chart 3" colorClass="bg-chart-3" />
          <ColorSwatch colorName="Chart 4" colorClass="bg-chart-4" />
          <ColorSwatch colorName="Chart 5" colorClass="bg-chart-5" />
        </div>
      </div>
    </div>
  );
}