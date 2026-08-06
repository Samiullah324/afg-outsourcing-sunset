import { useState, FormEvent, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import { RootState, AppDispatch } from '@store/index'
import { registerUser, clearError } from '@store/slices/authSlice'
import { Button } from '@components/atoms/Button'
import { Input } from '@components/atoms/Input'
import { AuthLayout } from '@components/auth/AuthLayout'
import { useAuthContent } from '@hooks/useContent'
import { Eye, EyeOff, Mail, Lock } from 'lucide-react'

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
    setFormData(prev => ({
      ...prev,
      [name]: value
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
    <AuthLayout
      title={authContent.register.title}
      subtitle={authContent.register.subtitle}
      footer={
        <p>
          {authContent.register.hasAccount}{' '}
          <Link to="/login" className="auth-link">
            {authContent.register.signInLink}
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
          <label className="auth-field__label" htmlFor="register-email">
            {authContent.register.emailLabel} <span className="auth-field__required">*</span>
          </label>
          <div className="auth-field__input-wrap">
            <Mail className="auth-field__icon" size={18} aria-hidden="true" />
            <Input
              id="register-email"
              type="email"
              name="email"
              placeholder={authContent.register.emailPlaceholder}
              value={formData.email}
              onChange={handleChange}
              required
              fullWidth
            />
          </div>
        </div>

        <div className="auth-field">
          <label className="auth-field__label" htmlFor="register-password">
            {authContent.register.passwordLabel} <span className="auth-field__required">*</span>
          </label>
          <div className="auth-field__input-wrap auth-field__input-wrap--password">
            <Lock className="auth-field__icon" size={18} aria-hidden="true" />
            <Input
              id="register-password"
              type={showPassword ? 'text' : 'password'}
              name="password"
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

        <div className="auth-field">
          <label className="auth-field__label" htmlFor="register-password-confirm">
            {authContent.register.confirmPasswordLabel} <span className="auth-field__required">*</span>
          </label>
          <div className="auth-field__input-wrap auth-field__input-wrap--password">
            <Lock className="auth-field__icon" size={18} aria-hidden="true" />
            <Input
              id="register-password-confirm"
              type={showConfirmPassword ? 'text' : 'password'}
              name="password_confirm"
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
          className="auth-submit"
        >
          {authContent.register.registerButton}
        </Button>
      </form>
    </AuthLayout>
  )
}

export default RegisterPage
