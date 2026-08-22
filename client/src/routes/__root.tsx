import { createRootRouteWithContext, Outlet } from '@tanstack/react-router';

export interface RouterContext {
  auth: {
    isLoaded: boolean;
    isAuthenticated: boolean;
  };
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: () => <Outlet />,
});
