import { useState, FormEvent, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff } from 'lucide-react'
import { RootState, AppDispatch } from '@store/index'
import { registerUser, clearError } from '@store/slices/authSlice'
import { Button } from '@components/atoms/Button'
import { Input } from '@components/atoms/Input'
import { Logo } from '@components/atoms/Logo'
import { DashboardCard } from '@components/molecules/DashboardCard'
import { useAuthContent } from '@hooks/useContent'
import './Auth.css'

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    password_confirm: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordMismatchError, setPasswordMismatchError] = useState('')

  const dispatch = useDispatch<AppDispatch>()
  const navigate = useNavigate()
  const { isLoading, error, isAuthenticated } = useSelector((state: RootState) => state.auth)
  const authContent = useAuthContent()

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true })
    }
  }, [isAuthenticated, navigate])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    if (error) {
      dispatch(clearError())
    }
    if (passwordMismatchError) {
      setPasswordMismatchError('')
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    if (formData.password !== formData.password_confirm) {
      dispatch(clearError())
      setPasswordMismatchError(authContent.register.passwordMismatch)
      return
    }

    try {
      const result = await dispatch(registerUser(formData))
      if (result.type === 'auth/register/fulfilled') {
        setTimeout(() => {
          navigate('/dashboard', { replace: true })
        }, 100)
      }
    } catch (error) {
      console.error('Registration error:', error)
    }
  }

  return (
    <div className="auth-centered-wrapper">
      <DashboardCard className="auth-card">
        <Logo size="lg" className="auth-logo" />

        <div className="auth-title">
          <h1 className="auth-title__heading">{authContent.register.title}</h1>
          <p className="auth-title__subtitle">{authContent.register.subtitle}</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          {error && (
            <div className="auth-form__error" role="alert">
              {error}
            </div>
          )}

          <div className="auth-form-group auth-form-group--labeled">
            <Input
              id="register-email"
              type="email"
              name="email"
              label={authContent.register.emailLabel}
              placeholder={authContent.register.emailPlaceholder}
              value={formData.email}
              onChange={handleChange}
              autoComplete="email"
              required
              fullWidth
            />
            <span className="auth-field-icon" aria-hidden="true">
              <Mail size={18} />
            </span>
          </div>

          <div className="auth-form-group auth-form-group--labeled auth-form-group--password">
            <Input
              id="register-password"
              type={showPassword ? 'text' : 'password'}
              name="password"
              label={authContent.register.passwordLabel}
              placeholder={authContent.register.passwordPlaceholder}
              value={formData.password}
              onChange={handleChange}
              autoComplete="new-password"
              required
              fullWidth
            />
            <span className="auth-field-icon" aria-hidden="true">
              <Lock size={18} />
            </span>
            <button
              type="button"
              className="auth-password-toggle"
              onClick={() => setShowPassword((current) => !current)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <div className="auth-form-group auth-form-group--labeled auth-form-group--password">
            <Input
              id="register-password-confirm"
              type={showConfirmPassword ? 'text' : 'password'}
              name="password_confirm"
              label={authContent.register.confirmPasswordLabel}
              placeholder={authContent.register.confirmPasswordPlaceholder}
              value={formData.password_confirm}
              onChange={handleChange}
              error={passwordMismatchError}
              autoComplete="new-password"
              required
              fullWidth
            />
            <span className="auth-field-icon" aria-hidden="true">
              <Lock size={18} />
            </span>
            <button
              type="button"
              className="auth-password-toggle"
              onClick={() => setShowConfirmPassword((current) => !current)}
              aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
            >
              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <div className="auth-actions">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              isLoading={isLoading}
              className="auth-submit"
            >
              {authContent.register.registerButton}
            </Button>
          </div>
        </form>

        <div className="auth-switch">
          <p>
            {authContent.register.hasAccount}{' '}
            <Link to="/login" className="auth-switch__link">
              {authContent.register.signInLink}
            </Link>
          </p>
        </div>
      </DashboardCard>
    </div>
  )
}

export default RegisterPage
