'use client';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface InstallButtonProps {
  className?: string;
  variant?: 'sidebar' | 'button' | 'compact';
}

export function InstallButton({ className = '', variant = 'button' }: InstallButtonProps) {
  function handleClick() {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('flowboard:install'));
    }
  }

  if (variant === 'sidebar') {
    return (
      <Button
        variant="ghost"
        size="sm"
        className={cn('w-full justify-start gap-2 text-xs font-normal text-muted-foreground hover:text-foreground', className)}
        onClick={handleClick}
        title="Install Flowboard PWA on your device"
      >
        <Download data-icon="inline-start" />
        <span>Install App</span>
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className={cn('text-xs font-normal', className)}
      onClick={handleClick}
      title="Install Flowboard as a progressive web application"
    >
      <Download data-icon="inline-start" />
      <span>Install App</span>
    </Button>
  );
}

