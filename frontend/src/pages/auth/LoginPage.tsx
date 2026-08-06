import { useState, FormEvent, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import { RootState, AppDispatch } from '@store/index'
import { loginUser, clearError } from '@store/slices/authSlice'
import { Button } from '@components/atoms/Button'
import { Input } from '@components/atoms/Input'
import { AuthLayout } from '@components/auth/AuthLayout'
import { useAuthContent } from '@hooks/useContent'
import { Eye, EyeOff, Mail, Lock } from 'lucide-react'

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
    <AuthLayout
      title={authContent.login.title}
      subtitle={authContent.login.subtitle}
      footer={
        <p>
          {authContent.login.noAccount}{' '}
          <Link to="/register" className="auth-link">
            {authContent.login.signUpLink}
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="auth-form">
        {error && (
          <div className="auth-error" role="alert">
            {error}
          </div>
        )}

        <div className="auth-field">
          <label className="auth-field__label" htmlFor="login-email">
            {authContent.login.emailLabel} <span className="auth-field__required">*</span>
          </label>
          <div className="auth-field__input-wrap">
            <Mail className="auth-field__icon" size={18} aria-hidden="true" />
            <Input
              id="login-email"
              type="email"
              name="email"
              placeholder={authContent.login.emailPlaceholder}
              value={formData.email}
              onChange={handleChange}
              required
              fullWidth
            />
          </div>
        </div>

        <div className="auth-field">
          <label className="auth-field__label" htmlFor="login-password">
            {authContent.login.passwordLabel} <span className="auth-field__required">*</span>
          </label>
          <div className="auth-field__input-wrap auth-field__input-wrap--password">
            <Lock className="auth-field__icon" size={18} aria-hidden="true" />
            <Input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              name="password"
              placeholder={authContent.login.passwordPlaceholder}
              value={formData.password}
              onChange={handleChange}
              required
              fullWidth
            />
            <button
              type="button"
              className="auth-password-toggle"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>

        <div className="auth-form-options">
          <label className="auth-remember-me">
            <input
              type="checkbox"
              name="rememberMe"
              checked={formData.rememberMe}
              onChange={handleChange}
            />
            <span>{authContent.login.rememberMe}</span>
          </label>
        </div>

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
      </form>
    </AuthLayout>
  )
}

export default LoginPage
