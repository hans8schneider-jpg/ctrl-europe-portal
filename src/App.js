import { useEffect, useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { supabase } from './supabase'
import { AppDataProvider } from './context/AppDataContext'
import { AppLayout } from './components/layout/AppLayout'
import { LoginPage } from './pages/LoginPage'
import { DashboardPage } from './pages/DashboardPage'
import { BucketsPage } from './pages/BucketsPage'
import { BucketPage } from './pages/BucketPage'
import { ProfilePage } from './pages/ProfilePage'
import { MyTasksPage } from './pages/MyTasksPage'
import { AdminPage } from './pages/AdminPage'
import { canAccessAdminPanel } from './lib/permissions'
import { useAppData } from './context/AppDataContext'

function LoadingScreen() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-ctrl-bg gap-4">
      <img src="/ctrl_logo_bez_pozadi.png" alt="CTRL" className="h-20 w-auto" />
      <div className="font-mono text-[11px] tracking-[3px] text-ctrl-text2 uppercase animate-pulse-slow">Načítám portál...</div>
    </div>
  )
}

function AdminRoute() {
  const { profile, loading } = useAppData()
  if (loading) return <LoadingScreen />
  if (!canAccessAdminPanel(profile)) return <Navigate to="/" replace />
  return <AdminPage />
}

function AuthenticatedApp() {
  const { profile, loading } = useAppData()

  if (loading) return <LoadingScreen />
  if (!profile) return <LoginPage />

  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="bunky" element={<BucketsPage />} />
        <Route path="moje-ukoly" element={<MyTasksPage />} />
        <Route path="bunka/:slug" element={<BucketPage />} />
        <Route path="profil" element={<ProfilePage />} />
        <Route path="admin" element={<AdminRoute />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

export default function App() {
  const [session, setSession] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s)
      setAuthLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s)
      setAuthLoading(false)
    })
    return () => subscription.unsubscribe()
  }, [])

  if (authLoading) return <LoadingScreen />
  if (!session) return <LoginPage />

  return (
    <BrowserRouter>
      <AppDataProvider session={session}>
        <AuthenticatedApp />
      </AppDataProvider>
    </BrowserRouter>
  )
}
