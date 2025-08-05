import { useAuthState } from '@/lib/store';
import { useNavigate } from '@tanstack/react-router';
import { useCallback } from 'react';

/**
 * Hook for authentication-aware navigation and access control
 */
export const useAuthNavigation = () => {
  const { isAuthenticated, hasProviderAccess } = useAuthState();
  const navigate = useNavigate();

  const navigateWithAuth = useCallback((
    path: string, 
    options?: { 
      requiresAuth?: boolean; 
      requiredProvider?: string; 
      fallbackPath?: string; 
    }
  ) => {
    const { requiresAuth = false, requiredProvider, fallbackPath = '/settings' } = options || {};

    // Check authentication requirements
    if (requiresAuth && !isAuthenticated) {
      navigate({ to: fallbackPath });
      return false;
    }

    // Check provider-specific requirements
    if (requiredProvider && !hasProviderAccess(requiredProvider)) {
      navigate({ to: fallbackPath });
      return false;
    }

    // Navigate to the requested path
    navigate({ to: path });
    return true;
  }, [isAuthenticated, hasProviderAccess, navigate]);

  const canAccess = useCallback((
    options?: { 
      requiresAuth?: boolean; 
      requiredProvider?: string; 
    }
  ) => {
    const { requiresAuth = false, requiredProvider } = options || {};

    if (requiresAuth && !isAuthenticated) {
      return false;
    }

    if (requiredProvider && !hasProviderAccess(requiredProvider)) {
      return false;
    }

    return true;
  }, [isAuthenticated, hasProviderAccess]);

  return {
    navigateWithAuth,
    canAccess,
    isAuthenticated,
    hasProviderAccess,
  };
};

export default useAuthNavigation;
