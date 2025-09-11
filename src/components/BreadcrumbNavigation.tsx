import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  path?: string;
  current?: boolean;
}

interface BreadcrumbNavigationProps {
  className?: string;
  items?: BreadcrumbItem[];
}

const BreadcrumbNavigation: React.FC<BreadcrumbNavigationProps> = ({ 
  className = '',
  items = []
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Default breadcrumb based on current path
  const getDefaultBreadcrumbs = (): BreadcrumbItem[] => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [
      { label: 'Home', path: '/' }
    ];

    let currentPath = '';
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const isLast = index === pathSegments.length - 1;
      
      // Convert segment to readable label
      const label = segment
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

      breadcrumbs.push({
        label,
        path: isLast ? undefined : currentPath,
        current: isLast
      });
    });

    return breadcrumbs;
  };

  const breadcrumbs = items.length > 0 ? items : getDefaultBreadcrumbs();

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  return (
    <nav className={`flex items-center space-x-1 text-sm ${className}`}>
      {breadcrumbs.map((item, index) => (
        <React.Fragment key={index}>
          {index > 0 && (
            <ChevronRight className="h-4 w-4 text-gray-400" />
          )}
          {item.path ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleNavigation(item.path!)}
              className="h-auto p-0 text-gray-400 hover:text-white transition-colors"
            >
              {index === 0 && <Home className="h-3 w-3 mr-1" />}
              {item.label}
            </Button>
          ) : (
            <span className="text-white font-medium">
              {item.label}
            </span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};

export default BreadcrumbNavigation;
