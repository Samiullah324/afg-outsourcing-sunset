import { useState, FormEvent, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import { RootState, AppDispatch } from '@store/index'
import { registerUser, clearError } from '@store/slices/authSlice'
import { Button } from '@components/atoms/Button'
import { Input } from '@components/atoms/Input'
import { AuthLayout } from '@components/layouts/AuthLayout'
import { useAuthContent } from '@hooks/useContent'
import { Eye, EyeOff } from 'lucide-react'
import './AuthForm.css'

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    password_confirm: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

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
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    if (error) {
      dispatch(clearError())
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    if (formData.password !== formData.password_confirm) {
      dispatch(clearError())
      return
    }

    const result = await dispatch(registerUser(formData))
    if (result.type === 'auth/register/fulfilled') {
      setTimeout(() => {
        navigate('/dashboard', { replace: true })
      }, 100)
    }
  }

  return (
    <AuthLayout>
      <div className="auth-form-header">
        <h1>{authContent.register.title}</h1>
        <p>{authContent.register.subtitle}</p>
      </div>

      <form onSubmit={handleSubmit} className="auth-form">
        {error && <div className="auth-error">{error}</div>}

        <div className="auth-form-group">
          <Input
            type="email"
            name="email"
            label={`${authContent.register.emailLabel} *`}
            placeholder={authContent.register.emailPlaceholder}
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
              label={`${authContent.register.passwordLabel} *`}
              placeholder={authContent.register.passwordPlaceholder}
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

        <div className="auth-form-group">
          <div className="auth-password-wrapper">
            <Input
              type={showConfirmPassword ? 'text' : 'password'}
              name="password_confirm"
              label={`${authContent.register.confirmPasswordLabel} *`}
              placeholder={authContent.register.confirmPasswordPlaceholder}
              value={formData.password_confirm}
              onChange={handleChange}
              required
              fullWidth
            />
            <button
              type="button"
              className="auth-password-toggle"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
            >
              {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          isLoading={isLoading}
          className="auth-submit-button"
        >
          {authContent.register.registerButton}
        </Button>
      </form>

      <div className="auth-footer">
        <p>
          {authContent.register.hasAccount}{' '}
          <Link to="/login" className="auth-link">
            {authContent.register.signInLink}
          </Link>
        </p>
      </div>
    </AuthLayout>
  )
}

export default RegisterPage
