"""Tests for the health version endpoint."""

import os
from unittest.mock import patch

from django.test import TestCase


class VersionEndpointTest(TestCase):
    """GET /api/health/version/"""

    def test_version_defaults_to_dev_when_unset(self):
        with patch.dict(os.environ, {}, clear=False):
            os.environ.pop('APP_VERSION', None)
            response = self.client.get('/api/health/version/')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {'version': 'dev'})

    def test_version_returns_app_version_when_set(self):
        with patch.dict(os.environ, {'APP_VERSION': '1.2.3'}, clear=False):
            response = self.client.get('/api/health/version/')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {'version': '1.2.3'})
