import { useState, FormEvent, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock } from 'lucide-react'
import { RootState, AppDispatch } from '@store/index'
import { loginUser, clearError } from '@store/slices/authSlice'
import { Button } from '@components/atoms/Button'
import { useAuthContent } from '@hooks/useContent'
import { AuthLayout } from './AuthLayout'
import { AuthField } from './AuthField'
import { AuthPasswordField } from './AuthPasswordField'
import './AuthPages.css'

const LoginPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  })

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
    <AuthLayout>
      <div className="auth-heading">
        <h2 className="auth-heading__title">{authContent.login.title}</h2>
        <p className="auth-heading__subtitle">{authContent.login.subtitle}</p>
      </div>

      <form onSubmit={handleSubmit} className="auth-form" noValidate>
        {error && (
          <div className="auth-form__error" role="alert">
            {error}
          </div>
        )}

        <AuthField
          id="login-email"
          type="email"
          name="email"
          label={authContent.login.emailLabel}
          placeholder={authContent.login.emailPlaceholder}
          value={formData.email}
          onChange={handleChange}
          icon={<Mail size={18} />}
          autoComplete="email"
          required
        />

        <AuthPasswordField
          id="login-password"
          name="password"
          label={authContent.login.passwordLabel}
          placeholder={authContent.login.passwordPlaceholder}
          value={formData.password}
          onChange={handleChange}
          icon={<Lock size={18} />}
          autoComplete="current-password"
          required
        />

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

      <div className="auth-footer">
        <p>
          {authContent.login.footerNote}{' '}
          <Link to="/register" className="auth-footer__link">
            {authContent.login.signUpLink}
          </Link>
        </p>
      </div>
    </AuthLayout>
  )
}

export default LoginPage
