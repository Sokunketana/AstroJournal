import React from 'react';
import { SignIn } from '@clerk/react';
import AuthShell from '../../components/AuthShell';
import { clerkAppearance } from '../../config/clerkAppearance';
import type { LoginPageProps } from './LoginPage.types';

const LoginPage: React.FC<LoginPageProps> = () => {
  return (
    <AuthShell
      eyebrow="Your universe remembers"
      title="Welcome back to your night sky."
      description="Return to the thoughts, moments, and memories you placed among the stars. Your journal is waiting right where you left it."
    >
      <SignIn
        routing="hash"
        signUpUrl="/sign-up"
        forceRedirectUrl="/app"
        fallbackRedirectUrl="/app"
        appearance={clerkAppearance}
      />
    </AuthShell>
  );
};

export default LoginPage;
