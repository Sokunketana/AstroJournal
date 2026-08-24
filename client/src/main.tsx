/* eslint-disable react-refresh/only-export-components */
import { ClerkProvider, useAuth } from '@clerk/react'
import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { RouterProvider } from '@tanstack/react-router'
import { router } from './router'
import { setAuthTokenGetter } from './services/api'
import { clerkAppearance } from './config/clerkAppearance'
import LoadingScreen from './components/LoadingScreen'

const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY
  ?? import.meta.env.CLERK_PUBLISHABLE_KEY

function MissingClerkConfiguration() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#03040a] p-6 text-[#f8f5ed]">
      <section className="w-full max-w-md rounded-2xl border border-amber-200/20 bg-[#0b0e17] p-6 shadow-2xl">
        <h1 className="text-lg font-semibold">Sign-in is not configured</h1>
        <p className="mt-2 text-sm leading-6 text-[#969bad]">
          Add <code>VITE_CLERK_PUBLISHABLE_KEY</code> to the root <code>.env.local</code> file, then restart the Vite dev server.
        </p>
      </section>
    </main>
  )
}

function InnerApp() {
  const { getToken, isLoaded, isSignedIn } = useAuth()

  setAuthTokenGetter(getToken)

  useEffect(() => {
    void router.invalidate()
  }, [isLoaded, isSignedIn])

  if (!isLoaded) {
    return <LoadingScreen />
  }

  return (
    <RouterProvider
      router={router}
      context={{ auth: { isLoaded, isAuthenticated: Boolean(isSignedIn) } }}
    />
  )
}

const root = createRoot(document.getElementById('root')!)

root.render(
  <StrictMode>
    {clerkPublishableKey ? (
      <ClerkProvider
        publishableKey={clerkPublishableKey}
        signInForceRedirectUrl="/app"
        afterSignOutUrl="/"
        appearance={clerkAppearance}
      >
        <InnerApp />
      </ClerkProvider>
    ) : (
      <MissingClerkConfiguration />
    )}
  </StrictMode>,
)
