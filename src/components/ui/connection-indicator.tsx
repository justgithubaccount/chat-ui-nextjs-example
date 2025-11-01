import React from 'react';
import { cn } from '@/lib/utils';

interface ConnectionIndicatorProps {
  isConnected: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function ConnectionIndicator({
  isConnected,
  size = 'md',
  className
}: ConnectionIndicatorProps) {
  if (!isConnected) return null;

  const sizeMap = {
    sm: { container: 'h-2 w-2', ping: 'h-full w-full', dot: 'h-2 w-2' },
    md: { container: 'h-3 w-3', ping: 'h-full w-full', dot: 'h-3 w-3' },
    lg: { container: 'h-4 w-4', ping: 'h-full w-full', dot: 'h-4 w-4' },
  };

  const sizes = sizeMap[size];

  return (
    <span className={cn("relative flex", sizes.container, className)}>
      <span className={cn(
        "animate-ping absolute inline-flex rounded-full bg-green-400 opacity-75",
        sizes.ping
      )} />
      <span className={cn(
        "relative inline-flex rounded-full bg-green-500",
        sizes.dot
      )} />
    </span>
  );
}