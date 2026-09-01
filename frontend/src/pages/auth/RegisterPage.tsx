import { useState, FormEvent, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { RootState, AppDispatch } from '@store/index'
import { registerUser, clearError } from '@store/slices/authSlice'
import { Button } from '@components/atoms/Button'
import { Input } from '@components/atoms/Input'
import { AuthCard } from '@components/molecules/AuthCard'
import { useAuthContent } from '@hooks/useContent'
import './Auth.css'

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    password_confirm: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)

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
    if (localError) {
      setLocalError(null)
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    if (formData.password !== formData.password_confirm) {
      setLocalError(authContent.register.passwordMismatch)
      return
    }

    try {
      const result = await dispatch(
        registerUser({
          email: formData.email,
          password: formData.password,
          password_confirm: formData.password_confirm,
        })
      )

      if (result.type === 'auth/register/fulfilled') {
        setTimeout(() => {
          navigate('/dashboard', { replace: true })
        }, 100)
      }
    } catch (registerError) {
      console.error('Registration error:', registerError)
    }
  }

  const displayError = localError || error

  return (
    <div className="auth-page">
      <AuthCard
        title="Create your account"
        subtitle="Join us in a few steps"
        footer={
          <p>
            Already have an account?{' '}
            <Link to="/login" className="auth-card__link">
              Log in
            </Link>
          </p>
        }
      >
        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          {displayError && (
            <div className="auth-form__error" role="alert">
              {displayError}
            </div>
          )}

          <Input
            type="text"
            name="fullName"
            label="Full name"
            placeholder="Enter your full name"
            value={formData.fullName}
            onChange={handleChange}
            required
            fullWidth
            autoComplete="name"
          />

          <Input
            type="email"
            name="email"
            label={authContent.register.emailLabel}
            placeholder={authContent.register.emailPlaceholder}
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
              label={authContent.register.passwordLabel}
              placeholder={authContent.register.passwordPlaceholder}
              value={formData.password}
              onChange={handleChange}
              required
              fullWidth
              autoComplete="new-password"
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

          <div className="auth-form__password">
            <Input
              type={showConfirmPassword ? 'text' : 'password'}
              name="password_confirm"
              label={authContent.register.confirmPasswordLabel}
              placeholder={authContent.register.confirmPasswordPlaceholder}
              value={formData.password_confirm}
              onChange={handleChange}
              required
              fullWidth
              autoComplete="new-password"
            />
            <button
              type="button"
              className="auth-form__password-toggle"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
            >
              {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            isLoading={isLoading}
            className="auth-form__submit"
          >
            Create account
          </Button>
        </form>
      </AuthCard>
    </div>
  )
}

export default RegisterPage
