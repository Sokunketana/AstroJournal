import { createRootRouteWithContext, Outlet } from '@tanstack/react-router';
import type { AuthContextType } from '../context/AuthContext';

export interface RouterContext {
  auth: AuthContextType;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: () => <Outlet />,
});
