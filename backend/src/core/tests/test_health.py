"""
Tests for health and readiness endpoints.
"""

from unittest.mock import patch

from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient


class ReadyCheckTest(TestCase):
    """Tests for GET /api/health/ready/."""

    def setUp(self):
        self.client = APIClient()

    def test_ready_check_returns_true_when_database_available(self):
        """Database connectivity succeeds and returns ready true."""
        response = self.client.get(reverse('api_health_ready_check'))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json(), {'ready': True})

    def test_ready_check_returns_503_when_database_unavailable(self):
        """Database errors yield 503 with ready false."""
        with patch('core.urls.connection.cursor') as mock_cursor:
            mock_cursor.side_effect = Exception('database unavailable')
            response = self.client.get(reverse('api_health_ready_check'))

        self.assertEqual(response.status_code, status.HTTP_503_SERVICE_UNAVAILABLE)
        self.assertEqual(response.json(), {'ready': False})
