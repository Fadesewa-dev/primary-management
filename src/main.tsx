import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { router } from './routes/index'
import { envMissing } from './lib/supabase'
import './index.css'

const root = createRoot(document.getElementById('root')!)

if (envMissing) {
  root.render(
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#f9fafb', fontFamily: 'system-ui, sans-serif', padding: '2rem',
    }}>
      <div style={{
        background: '#fff', borderRadius: '1.5rem', padding: '2.5rem', maxWidth: '480px', width: '100%',
        boxShadow: '0 8px 32px rgba(0,0,0,0.1)', border: '1px solid rgba(0,0,0,0.06)', textAlign: 'center',
      }}>
        <div style={{
          width: '64px', height: '64px', borderRadius: '1rem', background: '#fef2f2',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '2rem', margin: '0 auto 1.5rem',
        }}>⚙️</div>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#2c2c2c', margin: '0 0 0.5rem' }}>
          Missing Environment Variables
        </h1>
        <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1.5rem', lineHeight: 1.6 }}>
          The Supabase connection is not configured. Please set the following environment
          variables in your Vercel project settings and redeploy.
        </p>
        <div style={{
          background: '#f9fafb', borderRadius: '0.75rem', padding: '1rem',
          textAlign: 'left', fontFamily: 'monospace', fontSize: '0.8rem', color: '#374151',
        }}>
          <p style={{ margin: '0 0 0.25rem', color: '#ef4444', fontWeight: 700 }}>Required:</p>
          <p style={{ margin: '0 0 0.25rem' }}>VITE_SUPABASE_URL</p>
          <p style={{ margin: 0 }}>VITE_SUPABASE_ANON_KEY</p>
        </div>
        <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '1rem' }}>
          Vercel → Project → Settings → Environment Variables
        </p>
      </div>
    </div>
  )
} else {
  root.render(
    <StrictMode>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </StrictMode>,
  )
}
