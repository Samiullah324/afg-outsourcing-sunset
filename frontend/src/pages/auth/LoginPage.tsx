import { useState, FormEvent, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import { RootState, AppDispatch } from '@store/index'
import { loginUser, clearError } from '@store/slices/authSlice'
import { Button } from '@components/atoms/Button'
import { Input } from '@components/atoms/Input'
import { AuthLayout } from '@components/templates/Auth'
import { useAuthContent } from '@hooks/useContent'
import { Eye, EyeOff } from 'lucide-react'

const LoginPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  })
  const [showPassword, setShowPassword] = useState(false)

  const dispatch = useDispatch<AppDispatch>()
  const navigate = useNavigate()
  const { isLoading, error, isAuthenticated } = useSelector(
    (state: RootState) => state.auth
  )
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
    } catch {
      // Error state is handled via Redux
    }
  }

  return (
    <AuthLayout
      title={authContent.login.title}
      subtitle={authContent.login.subtitle}
    >
      <form onSubmit={handleSubmit} className="auth-form" noValidate>
        <div
          className="form-error"
          role="alert"
          hidden={!error}
          aria-live="polite"
        >
          {error}
        </div>

        <div className="auth-form__group">
          <Input
            id="login-email"
            type="email"
            name="email"
            label={`${authContent.login.emailLabel} *`}
            placeholder={authContent.login.emailPlaceholder}
            value={formData.email}
            onChange={handleChange}
            required
            fullWidth
            autoComplete="email"
            aria-label={authContent.login.emailLabel}
          />
        </div>

        <div className="auth-form__group">
          <div className="auth-form__password">
            <Input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              name="password"
              label={`${authContent.login.passwordLabel} *`}
              placeholder={authContent.login.passwordPlaceholder}
              value={formData.password}
              onChange={handleChange}
              required
              fullWidth
              autoComplete="current-password"
              aria-label={authContent.login.passwordLabel}
            />
            <button
              type="button"
              className="auth-form__toggle"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
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
          {authContent.login.loginButton}
        </Button>
      </form>

      <div className="auth-form__footer">
        <p>
          {authContent.login.noAccount}{' '}
          <Link to="/signup" className="auth-form__link">
            {authContent.login.signUpLink}
          </Link>
        </p>
      </div>
    </AuthLayout>
  )
}

export default LoginPage
