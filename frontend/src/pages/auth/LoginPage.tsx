import { useState, FormEvent, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import { RootState, AppDispatch } from '@store/index'
import { loginUser, clearError } from '@store/slices/authSlice'
import { Button } from '@components/atoms/Button'
import { Input } from '@components/atoms/Input'
import { AuthLayout } from '@components/layouts/AuthLayout'
import { useAuthContent } from '@hooks/useContent'
import { Eye, EyeOff } from 'lucide-react'
import './AuthForm.css'

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
  }

  return (
    <AuthLayout>
      <div className="auth-form-header">
        <h1>{authContent.login.title}</h1>
        <p>{authContent.login.subtitle}</p>
      </div>

      <form onSubmit={handleSubmit} className="auth-form">
        {error && <div className="auth-error">{error}</div>}

        <div className="auth-form-group">
          <Input
            type="email"
            name="email"
            label={`${authContent.login.emailLabel} *`}
            placeholder={authContent.login.emailPlaceholder}
            value={formData.email}
            onChange={handleChange}
            required
            fullWidth
          />
        </div>

        <div className="auth-form-group">
          <div className="auth-password-wrapper">
            <Input
              type={showPassword ? 'text' : 'password'}
              name="password"
              label={`${authContent.login.passwordLabel} *`}
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
          <a href="#" className="auth-forgot-link">
            {authContent.login.forgotPassword}
          </a>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          isLoading={isLoading}
          className="auth-submit-button"
        >
          {authContent.login.loginButton}
        </Button>
      </form>

      <div className="auth-footer">
        <p>
          {authContent.login.noAccount}{' '}
          <Link to="/signup" className="auth-link">
            {authContent.login.signUpLink}
          </Link>
        </p>
      </div>
    </AuthLayout>
  )
}

export default LoginPage
