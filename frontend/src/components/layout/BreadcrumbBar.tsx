'use client';

import { usePathname, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import './BreadcrumbBar.css';

interface Breadcrumb {
  label: string;
  href?: string;
}

interface BackButton {
  label?: string;
  href?: string;
  onClick?: () => void;
}

interface BreadcrumbBarProps {
  breadcrumbs?: Breadcrumb[];
  backButton?: BackButton;
}

export function BreadcrumbBar({ breadcrumbs, backButton }: BreadcrumbBarProps) {
  const pathname = usePathname();
  const router = useRouter();

  // Generate breadcrumbs from pathname if not provided
  const generateBreadcrumbs = (): Breadcrumb[] => {
    if (breadcrumbs) return breadcrumbs;
    
    const paths = pathname?.split('/').filter(Boolean) || [];
    if (paths.length === 0) return [];
    
    const crumbs: Breadcrumb[] = [{ label: 'Dashboard', href: '/' }];
    
    let currentPath = '';
    paths.forEach((path, index) => {
      currentPath += `/${path}`;
      const label = path
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      crumbs.push({
        label,
        href: index === paths.length - 1 ? undefined : currentPath,
      });
    });
    
    return crumbs;
  };

  const finalBreadcrumbs = generateBreadcrumbs();
  const showBreadcrumbs = finalBreadcrumbs.length > 1;

  const handleBackClick = () => {
    if (backButton?.onClick) {
      backButton.onClick();
    } else if (backButton?.href) {
      router.push(backButton.href);
    } else if (finalBreadcrumbs.length > 1) {
      // Go to parent breadcrumb
      const parentBreadcrumb = finalBreadcrumbs[finalBreadcrumbs.length - 2];
      if (parentBreadcrumb?.href) {
        router.push(parentBreadcrumb.href);
      } else {
        router.back();
      }
    } else {
      router.back();
    }
  };

  if (!showBreadcrumbs && !backButton) {
    return null;
  }

  return (
    <div className="breadcrumb-bar">
      <div className="breadcrumb-bar-content">
        {backButton && (
          <button
            className="breadcrumb-back-button"
            onClick={handleBackClick}
            aria-label={backButton.label || 'Go back'}
          >
            <ArrowLeft size={18} />
            {backButton.label && <span>{backButton.label}</span>}
          </button>
        )}
        
        {showBreadcrumbs && (
          <nav className="breadcrumbs" aria-label="Breadcrumb">
            {finalBreadcrumbs.map((crumb, index) => (
              <span key={index} className="breadcrumb-item">
                {crumb.href ? (
                  <a
                    href={crumb.href}
                    onClick={(e) => {
                      e.preventDefault();
                      router.push(crumb.href!);
                    }}
                    className="breadcrumb-link"
                  >
                    {crumb.label}
                  </a>
                ) : (
                  <span className="breadcrumb-current">{crumb.label}</span>
                )}
                {index < finalBreadcrumbs.length - 1 && (
                  <span className="breadcrumb-separator">/</span>
                )}
              </span>
            ))}
          </nav>
        )}
      </div>
    </div>
  );
}

