import { ReactNode } from 'react'
import { useAuthContent } from '@hooks/useContent'
import './AuthPages.css'

interface AuthLayoutProps {
  children: ReactNode
}

export const AuthLayout = ({ children }: AuthLayoutProps) => {
  const authContent = useAuthContent()

  return (
    <div className="auth-page">
      <div className="auth-card">
        <header className="auth-brand">
          <div className="auth-brand__logo" aria-hidden="true">
            <span className="auth-brand__logo-letter">S</span>
          </div>
          <div className="auth-brand__text">
            <h1 className="auth-brand__name">{authContent.brand.name}</h1>
            <p className="auth-brand__tagline">{authContent.brand.tagline}</p>
            <p className="auth-brand__est">{authContent.brand.established}</p>
          </div>
        </header>
        {children}
      </div>
    </div>
  )
}
