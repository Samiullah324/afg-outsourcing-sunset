import { InputHTMLAttributes, ReactNode } from 'react'
import { clsx } from 'clsx'

interface AuthFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  label: string
  icon: ReactNode
  error?: string
  id: string
}

export const AuthField = ({
  label,
  icon,
  error,
  id,
  required,
  className,
  ...props
}: AuthFieldProps) => {
  return (
    <div className="auth-field">
      <label htmlFor={id} className="auth-field__label">
        {label}
        {required && <span className="auth-field__required" aria-hidden="true"> *</span>}
      </label>
      <div className={clsx('auth-field__control', { 'auth-field__control--error': error })}>
        <span className="auth-field__icon" aria-hidden="true">
          {icon}
        </span>
        <input
          id={id}
          className={clsx('auth-field__input', className)}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          required={required}
          {...props}
        />
      </div>
      {error && (
        <span id={`${id}-error`} className="auth-field__error" role="alert">
          {error}
        </span>
      )}
    </div>
  )
}
