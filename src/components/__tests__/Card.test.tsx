/**
 * Tests for Card component
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { getCardStyles, getCardHeaderStyles, getCardTitleStyles, getCardDescriptionStyles, getCardContentStyles, getCardFooterStyles } from '../Card.styles';

describe('Card Component', () => {
  it('renders with default props', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Test Title</CardTitle>
          <CardDescription>Test Description</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Test content</p>
        </CardContent>
        <CardFooter>
          <p>Test footer</p>
        </CardFooter>
      </Card>
    );
    
    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test Description')).toBeInTheDocument();
    expect(screen.getByText('Test content')).toBeInTheDocument();
    expect(screen.getByText('Test footer')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(
      <Card className="custom-card">
        <CardContent>Content</CardContent>
      </Card>
    );
    
    const card = screen.getByText('Content').closest('[class*="custom-card"]');
    expect(card).toBeInTheDocument();
  });

  it('renders without header', () => {
    render(
      <Card>
        <CardContent>Content only</CardContent>
      </Card>
    );
    
    expect(screen.getByText('Content only')).toBeInTheDocument();
  });

  it('renders without footer', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Title</CardTitle>
        </CardHeader>
        <CardContent>Content</CardContent>
      </Card>
    );
    
    expect(screen.getByText('Title')).toBeInTheDocument();
    expect(screen.getByText('Content')).toBeInTheDocument();
  });
});

describe('Card Styles', () => {
  it('generates correct styles for default variant', () => {
    const styles = getCardStyles({ variant: 'default', size: 'default' });
    expect(styles).toContain('rounded-lg');
    expect(styles).toContain('border');
    expect(styles).toContain('bg-card');
    expect(styles).toContain('text-card-foreground');
    expect(styles).toContain('shadow-sm');
    expect(styles).toContain('p-6');
  });

  it('generates correct styles for elevated variant', () => {
    const styles = getCardStyles({ variant: 'elevated', size: 'sm' });
    expect(styles).toContain('shadow-md');
    expect(styles).toContain('p-4');
  });

  it('generates correct styles for outlined variant', () => {
    const styles = getCardStyles({ variant: 'outlined', size: 'lg' });
    expect(styles).toContain('border-2');
    expect(styles).toContain('p-8');
  });

  it('generates correct styles for ghost variant', () => {
    const styles = getCardStyles({ variant: 'ghost', size: 'none' });
    expect(styles).toContain('border-transparent');
    expect(styles).toContain('shadow-none');
    expect(styles).toContain('p-0');
  });

  it('generates correct header styles', () => {
    const styles = getCardHeaderStyles({ variant: 'default' });
    expect(styles).toContain('flex');
    expect(styles).toContain('flex-col');
    expect(styles).toContain('space-y-1.5');
    expect(styles).toContain('p-6');
  });

  it('generates correct title styles', () => {
    const styles = getCardTitleStyles({ variant: 'default' });
    expect(styles).toContain('text-2xl');
    expect(styles).toContain('font-semibold');
    expect(styles).toContain('leading-none');
    expect(styles).toContain('tracking-tight');
  });

  it('generates correct description styles', () => {
    const styles = getCardDescriptionStyles({ variant: 'default' });
    expect(styles).toContain('text-sm');
    expect(styles).toContain('text-muted-foreground');
  });

  it('generates correct content styles', () => {
    const styles = getCardContentStyles({ variant: 'default' });
    expect(styles).toContain('p-6');
    expect(styles).toContain('pt-0');
  });

  it('generates correct footer styles', () => {
    const styles = getCardFooterStyles({ variant: 'default' });
    expect(styles).toContain('flex');
    expect(styles).toContain('items-center');
    expect(styles).toContain('p-6');
    expect(styles).toContain('pt-0');
  });

  it('handles custom className', () => {
    const styles = getCardStyles({ 
      variant: 'default', 
      size: 'default', 
      className: 'custom-class' 
    });
    expect(styles).toContain('custom-class');
  });
});
