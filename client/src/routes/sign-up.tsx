import { createFileRoute, redirect } from '@tanstack/react-router';
import SignUpPage from '../pages/SignUpPage';

export const Route = createFileRoute('/sign-up')({
  beforeLoad: ({ context }) => {
    if (context.auth.isAuthenticated) {
      throw redirect({ to: '/' });
    }
  },
  component: SignUpPage,
});
