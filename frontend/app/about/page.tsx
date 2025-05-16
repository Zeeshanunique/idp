"use client";

import React from 'react';
import { ColorPalette } from '@/components/ui/color-swatch';

export default function AboutPage() {
  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">About Demo Crew</h1>
      
      <div className="mb-8">
        <p className="text-lg">
          Demo Crew is an advanced system that demonstrates various UI components and 
          design patterns using our integrated color theme system.
        </p>
      </div>
      
      <div className="space-y-6">
        <div className="bg-card rounded-lg border p-6">
          <h2 className="text-xl font-semibold mb-4">Color System</h2>
          <p className="mb-6">
            Our color system is built on Tailwind CSS with custom HSL color variables that
            support both light and dark modes. The following color palette showcases our 
            design system's colors.
          </p>
          
          <ColorPalette />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <div className="bg-card rounded-lg border p-6">
            <h3 className="font-semibold mb-3 text-brand-primary">Features</h3>
            <ul className="space-y-2">
              <li className="flex items-center">
                <span className="mr-2 text-success">✓</span>
                Fully customizable color theme
              </li>
              <li className="flex items-center">
                <span className="mr-2 text-success">✓</span>
                Dark mode support
              </li>
              <li className="flex items-center">
                <span className="mr-2 text-success">✓</span>
                Responsive design patterns
              </li>
              <li className="flex items-center">
                <span className="mr-2 text-success">✓</span>
                Accessible components
              </li>
            </ul>
          </div>
          
          <div className="bg-card rounded-lg border p-6">
            <h3 className="font-semibold mb-3 text-brand-secondary">Status Indicators</h3>
            <div className="space-y-3">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-success mr-2"></div>
                <span>Success: Operation completed successfully</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-info mr-2"></div>
                <span>Info: Important information notice</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-warning mr-2"></div>
                <span>Warning: Proceed with caution</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-error mr-2"></div>
                <span>Error: Action could not be completed</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-12 p-6 border rounded-lg bg-brand-primary bg-opacity-10">
        <h2 className="text-xl font-semibold mb-4 text-brand-primary">Get Started</h2>
        <p className="mb-4">
          Explore our demo application to see how our color system can be utilized in various
          user interface elements and components.
        </p>
        <button className="bg-brand-primary hover:bg-brand-primary/90 text-white py-2 px-4 rounded-md">
          View Documentation
        </button>
      </div>
    </div>
  );
}