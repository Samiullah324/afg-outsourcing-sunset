import { ReactNode } from 'react'
import { useAuthContent } from '@hooks/useContent'
import '@/styles/auth.css'

interface AuthLayoutProps {
  title: string
  subtitle: string
  children: ReactNode
  footer?: ReactNode
}

export const AuthLayout = ({ title, subtitle, children, footer }: AuthLayoutProps) => {
  const authContent = useAuthContent()

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="auth-brand__mark" aria-hidden="true">
            {authContent.brand.mark}
          </div>
          <div className="auth-brand__text">
            <span className="auth-brand__name">{authContent.brand.name}</span>
            <span className="auth-brand__tagline">{authContent.brand.tagline}</span>
            <span className="auth-brand__est">{authContent.brand.established}</span>
          </div>
        </div>

        <header className="auth-header">
          <h1 className="auth-header__title">{title}</h1>
          <p className="auth-header__subtitle">{subtitle}</p>
        </header>

        {children}

        {footer && <div className="auth-footer">{footer}</div>}
      </div>
    </div>
  )
}
