import { SignUp } from '@clerk/react';
import AuthShell from '../../components/AuthShell';
import { clerkAppearance } from '../../config/clerkAppearance';

const SignUpPage = () => (
  <AuthShell subtitle="Create an account and launch your first star.">
    <SignUp
      routing="hash"
      signInUrl="/login"
      fallbackRedirectUrl="/app"
      appearance={clerkAppearance}
    />
  </AuthShell>
);

export default SignUpPage;
