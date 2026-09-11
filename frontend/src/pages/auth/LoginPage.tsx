import { useState, FormEvent, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff } from 'lucide-react'
import { RootState, AppDispatch } from '@store/index'
import { loginUser, clearError } from '@store/slices/authSlice'
import { Button } from '@components/atoms/Button'
import { Input } from '@components/atoms/Input'
import { Logo } from '@components/atoms/Logo'
import { DashboardCard } from '@components/molecules/DashboardCard'
import { useAuthContent } from '@hooks/useContent'
import './Auth.css'

const LoginPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  })
  const [showPassword, setShowPassword] = useState(false)

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
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
    if (error) {
      dispatch(clearError())
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    try {
      const result = await dispatch(loginUser({
        email: formData.email,
        password: formData.password
      }))

      if (result.type === 'auth/login/fulfilled') {
        setTimeout(() => {
          navigate('/dashboard', { replace: true })
        }, 100)
      }
    } catch (error) {
      console.error('Login error:', error)
    }
  }

  return (
    <div className="auth-centered-wrapper">
      <DashboardCard className="auth-card">
        <Logo size="lg" className="auth-logo" />

        <div className="auth-title">
          <h1 className="auth-title__heading">{authContent.login.title}</h1>
          <p className="auth-title__subtitle">{authContent.login.subtitle}</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          {error && (
            <div className="auth-form__error" role="alert">
              {error}
            </div>
          )}

          <div className="auth-form-group auth-form-group--labeled">
            <Input
              id="login-email"
              type="email"
              name="email"
              label={authContent.login.emailLabel}
              placeholder={authContent.login.emailPlaceholder}
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
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              name="password"
              label={authContent.login.passwordLabel}
              placeholder={authContent.login.passwordPlaceholder}
              value={formData.password}
              onChange={handleChange}
              autoComplete="current-password"
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

          <div className="auth-form__options">
            <label className="auth-form__remember">
              <input
                type="checkbox"
                name="rememberMe"
                checked={formData.rememberMe}
                onChange={handleChange}
              />
              <span>{authContent.login.rememberMe}</span>
            </label>
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
              {authContent.login.loginButton}
            </Button>
          </div>
        </form>

        <div className="auth-switch">
          <p>
            {authContent.login.noAccount}{' '}
            <Link to="/signup" className="auth-switch__link">
              {authContent.login.signUpLink}
            </Link>
          </p>
        </div>
      </DashboardCard>
    </div>
  )
}

export default LoginPage
