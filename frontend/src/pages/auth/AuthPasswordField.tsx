import { InputHTMLAttributes, ReactNode, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { clsx } from 'clsx'

interface AuthPasswordFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id' | 'type'> {
  label: string
  icon: ReactNode
  error?: string
  id: string
}

export const AuthPasswordField = ({
  label,
  icon,
  error,
  id,
  required,
  className,
  ...props
}: AuthPasswordFieldProps) => {
  const [showPassword, setShowPassword] = useState(false)

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
          type={showPassword ? 'text' : 'password'}
          className={clsx('auth-field__input auth-field__input--password', className)}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          required={required}
          {...props}
        />
        <button
          type="button"
          className="auth-field__toggle"
          onClick={() => setShowPassword((current) => !current)}
          aria-label={showPassword ? 'Hide password' : 'Show password'}
        >
          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
      {error && (
        <span id={`${id}-error`} className="auth-field__error" role="alert">
          {error}
        </span>
      )}
    </div>
  )
}
