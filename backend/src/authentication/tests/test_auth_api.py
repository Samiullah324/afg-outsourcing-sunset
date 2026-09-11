"""
Tests for authentication login and signup API endpoints.
"""

from django.contrib.auth import get_user_model
from django.test import TransactionTestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient, APITestCase

User = get_user_model()

VALID_PASSWORD = 'Str0ngPass!234'


class SignupAPITest(TransactionTestCase):
    """Tests for POST /api/auth/register/"""

    def setUp(self):
        self.client = APIClient()
        self.url = reverse('register')
        self.valid_payload = {
            'email': 'newuser@example.com',
            'password': VALID_PASSWORD,
            'password_confirm': VALID_PASSWORD,
        }

    def test_signup_success_creates_user_and_returns_expected_response(self):
        response = self.client.post(self.url, self.valid_payload, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(User.objects.filter(email='newuser@example.com').exists())

        user = User.objects.get(email='newuser@example.com')
        self.assertEqual(response.data['user']['email'], user.email)
        self.assertEqual(response.data['user']['id'], user.id)
        self.assertTrue(response.data['user']['is_active'])
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
        self.assertTrue(response.data['access'])
        self.assertTrue(response.data['refresh'])

    def test_signup_missing_required_fields_returns_400(self):
        response = self.client.post(self.url, {}, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', response.data)
        self.assertIn('password', response.data)
        self.assertIn('password_confirm', response.data)

    def test_signup_invalid_email_or_password_policy_returns_400(self):
        invalid_email_response = self.client.post(
            self.url,
            {
                'email': 'not-an-email',
                'password': VALID_PASSWORD,
                'password_confirm': VALID_PASSWORD,
            },
            format='json',
        )
        self.assertEqual(invalid_email_response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', invalid_email_response.data)

        weak_password_response = self.client.post(
            self.url,
            {
                'email': 'weakpass@example.com',
                'password': 'short',
                'password_confirm': 'short',
            },
            format='json',
        )
        self.assertEqual(weak_password_response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('password', weak_password_response.data)

    def test_signup_duplicate_user_returns_400_or_409(self):
        User.objects.create_user(email='existing@example.com', password=VALID_PASSWORD)

        response = self.client.post(
            self.url,
            {
                'email': 'existing@example.com',
                'password': VALID_PASSWORD,
                'password_confirm': VALID_PASSWORD,
            },
            format='json',
        )

        self.assertIn(response.status_code, (status.HTTP_400_BAD_REQUEST, status.HTTP_409_CONFLICT))
        self.assertIn('email', response.data)

    def test_signup_email_uniqueness_case_insensitive(self):
        User.objects.create_user(email='user@example.com', password=VALID_PASSWORD)

        self.client.raise_request_exception = False
        response = self.client.post(
            self.url,
            {
                'email': 'user@EXAMPLE.COM',
                'password': VALID_PASSWORD,
                'password_confirm': VALID_PASSWORD,
            },
            format='json',
        )

        self.assertNotEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(User.objects.filter(email='user@example.com').count(), 1)


class LoginAPITest(APITestCase):
    """Tests for POST /api/auth/login/"""

    def setUp(self):
        self.url = reverse('login')
        self.email = 'loginuser@example.com'
        self.password = VALID_PASSWORD
        self.user = User.objects.create_user(email=self.email, password=self.password)

    def test_login_success_returns_expected_status_and_token_or_session(self):
        response = self.client.post(
            self.url,
            {'email': self.email, 'password': self.password},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['user']['email'], self.email)
        self.assertEqual(response.data['user']['id'], self.user.id)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
        self.assertTrue(response.data['access'])
        self.assertTrue(response.data['refresh'])

    def test_login_invalid_credentials_returns_400_or_401(self):
        response = self.client.post(
            self.url,
            {'email': self.email, 'password': 'WrongPassword!99'},
            format='json',
        )

        self.assertIn(response.status_code, (status.HTTP_400_BAD_REQUEST, status.HTTP_401_UNAUTHORIZED))
        self.assertTrue(
            'non_field_errors' in response.data
            or 'detail' in response.data
        )

    def test_login_missing_fields_returns_400(self):
        response = self.client.post(self.url, {}, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', response.data)
        self.assertIn('password', response.data)

    def test_login_inactive_user_is_rejected(self):
        self.user.is_active = False
        self.user.save(update_fields=['is_active'])

        response = self.client.post(
            self.url,
            {'email': self.email, 'password': self.password},
            format='json',
        )

        self.assertIn(response.status_code, (status.HTTP_400_BAD_REQUEST, status.HTTP_401_UNAUTHORIZED))
        self.assertTrue(
            'non_field_errors' in response.data
            or 'detail' in response.data
        )
