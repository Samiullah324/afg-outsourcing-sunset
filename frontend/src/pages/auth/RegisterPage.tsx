import { useState, FormEvent, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock } from 'lucide-react'
import { RootState, AppDispatch } from '@store/index'
import { registerUser, clearError } from '@store/slices/authSlice'
import { Button } from '@components/atoms/Button'
import { useAuthContent } from '@hooks/useContent'
import { AuthLayout } from './AuthLayout'
import { AuthField } from './AuthField'
import { AuthPasswordField } from './AuthPasswordField'
import './AuthPages.css'

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    password_confirm: '',
  })
  const [passwordMismatchError, setPasswordMismatchError] = useState('')

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
    if (passwordMismatchError) {
      setPasswordMismatchError('')
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    
    if (formData.password !== formData.password_confirm) {
      dispatch(clearError())
      setPasswordMismatchError(authContent.register.passwordMismatch)
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
    <AuthLayout>
      <div className="auth-heading">
        <h2 className="auth-heading__title">{authContent.register.title}</h2>
        <p className="auth-heading__subtitle">{authContent.register.subtitle}</p>
      </div>

      <form onSubmit={handleSubmit} className="auth-form" noValidate>
        {error && (
          <div className="auth-form__error" role="alert">
            {error}
          </div>
        )}

        <AuthField
          id="register-email"
          type="email"
          name="email"
          label={authContent.register.emailLabel}
          placeholder={authContent.register.emailPlaceholder}
          value={formData.email}
          onChange={handleChange}
          icon={<Mail size={18} />}
          autoComplete="email"
          required
        />

        <AuthPasswordField
          id="register-password"
          name="password"
          label={authContent.register.passwordLabel}
          placeholder={authContent.register.passwordPlaceholder}
          value={formData.password}
          onChange={handleChange}
          icon={<Lock size={18} />}
          autoComplete="new-password"
          required
        />

        <AuthPasswordField
          id="register-password-confirm"
          name="password_confirm"
          label={authContent.register.confirmPasswordLabel}
          placeholder={authContent.register.confirmPasswordPlaceholder}
          value={formData.password_confirm}
          onChange={handleChange}
          icon={<Lock size={18} />}
          error={passwordMismatchError}
          autoComplete="new-password"
          required
        />

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

      <div className="auth-footer">
        <p>
          {authContent.register.hasAccount}{' '}
          <Link to="/login" className="auth-footer__link">
            {authContent.register.signInLink}
          </Link>
        </p>
      </div>
    </AuthLayout>
  )
}

export default RegisterPage
