import { createRouter } from '@tanstack/react-router';
import { routeTree } from './routeTree.gen';

export const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
  context: {
    // This will be set by the RouterProvider in main.tsx
    auth: undefined!,
  },
});

// Register the router instance for type-safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
