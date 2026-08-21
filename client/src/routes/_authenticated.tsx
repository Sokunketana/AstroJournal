import { createFileRoute, redirect, Outlet } from '@tanstack/react-router';
import { isTimelineDemo } from '../utils/timelineDemo';

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: ({ context }) => {
    if (!context.auth.isAuthenticated && !isTimelineDemo()) {
      throw redirect({ to: '/login' });
    }
  },
  component: () => <Outlet />,
});
