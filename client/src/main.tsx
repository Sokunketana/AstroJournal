import { ClerkProvider, useAuth } from '@clerk/react'
import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { RouterProvider } from '@tanstack/react-router'
import { router } from './router'
import { setAuthTokenGetter } from './services/api'
import { clerkAppearance } from './config/clerkAppearance'

const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY
  ?? import.meta.env.CLERK_PUBLISHABLE_KEY

// eslint-disable-next-line react-refresh/only-export-components
function InnerApp() {
  const { getToken, isLoaded, isSignedIn } = useAuth()

  setAuthTokenGetter(getToken)

  useEffect(() => {
    void router.invalidate()
  }, [isLoaded, isSignedIn])

  return (
    <RouterProvider
      router={router}
      context={{ auth: { isLoaded, isAuthenticated: Boolean(isSignedIn) } }}
    />
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ClerkProvider
      publishableKey={clerkPublishableKey}
      afterSignOutUrl="/login"
      appearance={clerkAppearance}
    >
      <InnerApp />
    </ClerkProvider>
  </StrictMode>,
)
