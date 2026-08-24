import { createFileRoute, redirect } from '@tanstack/react-router';
import LandingPage from '../pages/LandingPage';

export const Route = createFileRoute('/')({
  beforeLoad: ({ context }) => {
    if (context.auth.isAuthenticated) {
      throw redirect({ to: '/app' });
    }
  },
  component: LandingPage,
});
