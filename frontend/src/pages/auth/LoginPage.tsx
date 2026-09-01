import { useState, FormEvent, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { RootState, AppDispatch } from '@store/index'
import { loginUser, clearError } from '@store/slices/authSlice'
import { Button } from '@components/atoms/Button'
import { Input } from '@components/atoms/Input'
import { AuthCard } from '@components/molecules/AuthCard'
import { useAuthContent } from '@hooks/useContent'
import './Auth.css'

const LoginPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
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
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
    if (error) {
      dispatch(clearError())
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    try {
      const result = await dispatch(
        loginUser({
          email: formData.email,
          password: formData.password,
        })
      )

      if (result.type === 'auth/login/fulfilled') {
        setTimeout(() => {
          navigate('/dashboard', { replace: true })
        }, 100)
      }
    } catch (loginError) {
      console.error('Login error:', loginError)
    }
  }

  return (
    <div className="auth-page">
      <AuthCard
        title="Welcome back"
        subtitle="Log in to your account"
        footer={
          <p>
            Don&apos;t have an account?{' '}
            <Link to="/signup" className="auth-card__link">
              Sign up
            </Link>
          </p>
        }
      >
        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          {error && (
            <div className="auth-form__error" role="alert">
              {error}
            </div>
          )}

          <Input
            type="email"
            name="email"
            label={authContent.login.emailLabel}
            placeholder={authContent.login.emailPlaceholder}
            value={formData.email}
            onChange={handleChange}
            required
            fullWidth
            autoComplete="email"
          />

          <div className="auth-form__password">
            <Input
              type={showPassword ? 'text' : 'password'}
              name="password"
              label={authContent.login.passwordLabel}
              placeholder={authContent.login.passwordPlaceholder}
              value={formData.password}
              onChange={handleChange}
              required
              fullWidth
              autoComplete="current-password"
            />
            <button
              type="button"
              className="auth-form__password-toggle"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
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

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            isLoading={isLoading}
            className="auth-form__submit"
          >
            Log In
          </Button>
        </form>
      </AuthCard>
    </div>
  )
}

export default LoginPage
