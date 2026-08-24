import React from 'react';
import { SignIn } from '@clerk/react';
import AuthShell from '../../components/AuthShell';
import { clerkAppearance } from '../../config/clerkAppearance';
import type { LoginPageProps } from './LoginPage.types';

const LoginPage: React.FC<LoginPageProps> = () => {
  return (
    <AuthShell subtitle="Return to your personal night sky.">
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
