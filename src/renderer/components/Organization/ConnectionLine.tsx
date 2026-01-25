import React from 'react';
import type { ConnectionType } from '../../../shared/types';

interface ConnectionLineProps {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  connectionType?: ConnectionType;
}

const connectionColors: Record<ConnectionType, string> = {
  reports_to: '#6b7280',      // gray-500
  delegates_to: '#f59e0b',    // amber-500
  collaborates_with: '#3b82f6', // blue-500
};

export const ConnectionLine: React.FC<ConnectionLineProps> = ({
  startX,
  startY,
  endX,
  endY,
  connectionType = 'reports_to',
}) => {
  const color = connectionColors[connectionType];

  // Calculate control points for curved line
  const midY = (startY + endY) / 2;

  // Create a path that goes down from parent, then to child
  const path = `
    M ${startX} ${startY}
    L ${startX} ${midY}
    L ${endX} ${midY}
    L ${endX} ${endY}
  `;

  return (
    <path
      d={path}
      stroke={color}
      strokeWidth={2}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="transition-all"
    />
  );
};

// Simple vertical line for direct parent-child
interface VerticalLineProps {
  x: number;
  startY: number;
  endY: number;
  connectionType?: ConnectionType;
}

export const VerticalLine: React.FC<VerticalLineProps> = ({
  x,
  startY,
  endY,
  connectionType = 'reports_to',
}) => {
  const color = connectionColors[connectionType];

  return (
    <line
      x1={x}
      y1={startY}
      x2={x}
      y2={endY}
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
    />
  );
};

// Horizontal line for siblings
interface HorizontalLineProps {
  y: number;
  startX: number;
  endX: number;
  connectionType?: ConnectionType;
}

export const HorizontalLine: React.FC<HorizontalLineProps> = ({
  y,
  startX,
  endX,
  connectionType = 'reports_to',
}) => {
  const color = connectionColors[connectionType];

  return (
    <line
      x1={startX}
      y1={y}
      x2={endX}
      y2={y}
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
    />
  );
};
