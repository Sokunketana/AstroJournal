/* eslint-disable react-refresh/only-export-components */
import { ClerkProvider, useAuth } from '@clerk/react'
import { StrictMode, useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { RouterProvider } from '@tanstack/react-router'
import { router } from './router'
import { setAuthTokenGetter } from './services/api'
import { clerkAppearance } from './config/clerkAppearance'
import LoadingScreen from './components/LoadingScreen'
import { useJournals, useUserData } from './hooks/useDashboardData'

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
  const hasResolvedAuthRef = useRef(false)
  const [lastResolvedSignedIn, setLastResolvedSignedIn] = useState(false)
  const [isFinalizingAuth, setIsFinalizingAuth] = useState(false)
  const shouldPrepareDashboard = Boolean(isLoaded && isSignedIn)
  const shouldKeepCurrentApp = !isLoaded
    && lastResolvedSignedIn
    && window.location.pathname === '/app'
  const { isLoading: userLoading } = useUserData(shouldPrepareDashboard)
  const { isLoading: journalsLoading } = useJournals(shouldPrepareDashboard)

  setAuthTokenGetter(getToken)

  useEffect(() => {
    const isAuthRoute = window.location.pathname === '/login'
      || window.location.pathname === '/sign-up'

    if (!isLoaded && hasResolvedAuthRef.current && isAuthRoute) {
      setIsFinalizingAuth(true)
    }

    if (isLoaded) {
      hasResolvedAuthRef.current = true
    }
  }, [isLoaded])

  useEffect(() => {
    if (!isFinalizingAuth) return

    const timeout = window.setTimeout(() => setIsFinalizingAuth(false), 15_000)
    return () => window.clearTimeout(timeout)
  }, [isFinalizingAuth])

  useEffect(() => {
    if (!isLoaded) return

    if (lastResolvedSignedIn && !isSignedIn) {
      void router.navigate({ to: '/', replace: true })
    } else {
      void router.invalidate()
    }

    const timeout = window.setTimeout(
      () => setLastResolvedSignedIn(Boolean(isSignedIn)),
      0,
    )
    return () => window.clearTimeout(timeout)
  }, [isLoaded, isSignedIn, lastResolvedSignedIn])

  if (
    (!isLoaded && !shouldKeepCurrentApp)
    || (isFinalizingAuth && !isSignedIn)
    || (shouldPrepareDashboard && (userLoading || journalsLoading))
  ) {
    return <LoadingScreen />
  }

  return (
    <RouterProvider
      router={router}
      context={{
        auth: {
          isLoaded,
          isAuthenticated: isLoaded
            ? Boolean(isSignedIn)
            : lastResolvedSignedIn,
        },
      }}
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
        signUpForceRedirectUrl="/app"
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
