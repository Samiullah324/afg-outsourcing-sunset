import { ReactNode } from 'react'
import { Logo } from '@components/atoms/Logo'
import './AuthLayout.css'

interface AuthLayoutProps {
  children: ReactNode
}

export const AuthLayout = ({ children }: AuthLayoutProps) => {
  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <Logo size="lg" />
        </div>
        <div className="auth-content">{children}</div>
      </div>
    </div>
  )
}
