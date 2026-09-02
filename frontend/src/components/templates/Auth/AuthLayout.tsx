import { ReactNode } from 'react'
import { Logo } from '@components/atoms/Logo'
import './AuthLayout.css'

interface AuthLayoutProps {
  title: string
  subtitle?: string
  children: ReactNode
  sideContent?: ReactNode
}

export const AuthLayout = ({
  title,
  subtitle,
  children,
  sideContent,
}: AuthLayoutProps) => {
  return (
    <div className="auth-layout">
      <div
        className={
          sideContent
            ? 'auth-layout__shell auth-layout__shell--split'
            : 'auth-layout__shell'
        }
      >
        <div className="auth-layout__card">
          <div className="auth-layout__brand">
            <Logo size="md" />
            <p className="auth-layout__tagline">SEE THE HORIZON</p>
          </div>

          <header className="auth-layout__header">
            <h1 className="auth-layout__title">{title}</h1>
            {subtitle && (
              <p className="auth-layout__subtitle">{subtitle}</p>
            )}
          </header>

          <div className="auth-layout__body">{children}</div>
        </div>

        {sideContent && (
          <aside className="auth-layout__side" aria-hidden={false}>
            {sideContent}
          </aside>
        )}
      </div>
    </div>
  )
}
