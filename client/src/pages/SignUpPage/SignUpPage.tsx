import { SignUp } from '@clerk/react';
import AuthShell from '../../components/AuthShell';
import { clerkAppearance } from '../../config/clerkAppearance';

const SignUpPage = () => (
  <AuthShell
    eyebrow="Your story starts here"
    title="Give your thoughts a place to shine."
    description="Create your own quiet corner of the universe. Write freely, trace the patterns, and watch your story become a sky that is uniquely yours."
  >
    <SignUp
      routing="hash"
      signInUrl="/login"
      forceRedirectUrl="/app"
      fallbackRedirectUrl="/app"
      appearance={clerkAppearance}
    />
  </AuthShell>
);

export default SignUpPage;
