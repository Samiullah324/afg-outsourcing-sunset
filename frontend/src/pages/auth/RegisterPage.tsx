import { useState, FormEvent, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import { RootState, AppDispatch } from '@store/index'
import { registerUser, clearError } from '@store/slices/authSlice'
import { Button } from '@components/atoms/Button'
import { Input } from '@components/atoms/Input'
import { AuthLayout } from '@components/templates/Auth'
import { useAuthContent } from '@hooks/useContent'
import { Eye, EyeOff } from 'lucide-react'

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    password_confirm: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)

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

  const displayError = localError || error

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
      const result = await dispatch(registerUser(formData))
      if (result.type === 'auth/register/fulfilled') {
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
      title={authContent.register.title}
      subtitle={authContent.register.subtitle}
    >
      <form onSubmit={handleSubmit} className="auth-form" noValidate>
        <div
          className="form-error"
          role="alert"
          hidden={!displayError}
          aria-live="polite"
        >
          {displayError}
        </div>

        <div className="auth-form__group">
          <Input
            id="register-email"
            type="email"
            name="email"
            label={`${authContent.register.emailLabel} *`}
            placeholder={authContent.register.emailPlaceholder}
            value={formData.email}
            onChange={handleChange}
            required
            fullWidth
            autoComplete="email"
            aria-label={authContent.register.emailLabel}
          />
        </div>

        <div className="auth-form__group">
          <div className="auth-form__password">
            <Input
              id="register-password"
              type={showPassword ? 'text' : 'password'}
              name="password"
              label={`${authContent.register.passwordLabel} *`}
              placeholder={authContent.register.passwordPlaceholder}
              value={formData.password}
              onChange={handleChange}
              required
              fullWidth
              autoComplete="new-password"
              aria-label={authContent.register.passwordLabel}
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

        <div className="auth-form__group">
          <div className="auth-form__password">
            <Input
              id="register-password-confirm"
              type={showConfirmPassword ? 'text' : 'password'}
              name="password_confirm"
              label={`${authContent.register.confirmPasswordLabel} *`}
              placeholder={authContent.register.confirmPasswordPlaceholder}
              value={formData.password_confirm}
              onChange={handleChange}
              required
              fullWidth
              autoComplete="new-password"
              aria-label={authContent.register.confirmPasswordLabel}
            />
            <button
              type="button"
              className="auth-form__toggle"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              aria-label={
                showConfirmPassword
                  ? 'Hide confirm password'
                  : 'Show confirm password'
              }
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
          className="auth-form__submit"
        >
          {authContent.register.registerButton}
        </Button>
      </form>

      <div className="auth-form__footer">
        <p>
          {authContent.register.hasAccount}{' '}
          <Link to="/login" className="auth-form__link">
            {authContent.register.signInLink}
          </Link>
        </p>
      </div>
    </AuthLayout>
  )
}

export default RegisterPage
