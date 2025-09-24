/**
 * Tests for Button component
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '../ui/button';
import { getButtonStyles } from '../Button.styles';
import { vi } from 'vitest';

describe('Button Component', () => {
  it('renders with default props', () => {
    render(<Button>Click me</Button>);
    const button = screen.getByRole('button', { name: /click me/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('bg-primary', 'text-primary-foreground');
  });

  it('renders with different variants', () => {
    const { rerender } = render(<Button variant="destructive">Delete</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-destructive');

    rerender(<Button variant="outline">Outline</Button>);
    expect(screen.getByRole('button')).toHaveClass('border', 'border-input');

    rerender(<Button variant="ghost">Ghost</Button>);
    expect(screen.getByRole('button')).toHaveClass('hover:bg-accent');
  });

  it('renders with different sizes', () => {
    const { rerender } = render(<Button size="sm">Small</Button>);
    expect(screen.getByRole('button')).toHaveClass('h-9');

    rerender(<Button size="lg">Large</Button>);
    expect(screen.getByRole('button')).toHaveClass('h-11');

    rerender(<Button size="icon">Icon</Button>);
    expect(screen.getByRole('button')).toHaveClass('h-10', 'w-10');
  });

  it('handles click events', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveClass('disabled:opacity-50');
  });

  it('applies custom className', () => {
    render(<Button className="custom-class">Custom</Button>);
    expect(screen.getByRole('button')).toHaveClass('custom-class');
  });

  it('renders as different element when asChild is true', () => {
    render(
      <Button asChild>
        <a href="/test">Link Button</a>
      </Button>
    );
    const link = screen.getByRole('link');
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/test');
  });
});

describe('Button Styles', () => {
  it('generates correct styles for default variant', () => {
    const styles = getButtonStyles({ variant: 'default', size: 'default' });
    expect(styles).toContain('bg-primary');
    expect(styles).toContain('text-primary-foreground');
    expect(styles).toContain('h-10');
    expect(styles).toContain('px-4');
    expect(styles).toContain('py-2');
  });

  it('generates correct styles for destructive variant', () => {
    const styles = getButtonStyles({ variant: 'destructive', size: 'sm' });
    expect(styles).toContain('bg-destructive');
    expect(styles).toContain('text-destructive-foreground');
    expect(styles).toContain('h-9');
  });

  it('generates correct styles for outline variant', () => {
    const styles = getButtonStyles({ variant: 'outline', size: 'lg' });
    expect(styles).toContain('border');
    expect(styles).toContain('border-input');
    expect(styles).toContain('bg-background');
    expect(styles).toContain('h-11');
  });

  it('generates correct styles for ghost variant', () => {
    const styles = getButtonStyles({ variant: 'ghost', size: 'icon' });
    expect(styles).toContain('hover:bg-accent');
    expect(styles).toContain('hover:text-accent-foreground');
    expect(styles).toContain('h-10');
    expect(styles).toContain('w-10');
  });

  it('generates correct styles for link variant', () => {
    const styles = getButtonStyles({ variant: 'link', size: 'default' });
    expect(styles).toContain('text-primary');
    expect(styles).toContain('underline-offset-4');
    expect(styles).toContain('hover:underline');
  });

  it('handles custom className', () => {
    const styles = getButtonStyles({ 
      variant: 'default', 
      size: 'default', 
      className: 'custom-class' 
    });
    expect(styles).toContain('custom-class');
  });
});
