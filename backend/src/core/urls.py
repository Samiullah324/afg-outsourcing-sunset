"""
URL configuration for the project.
"""
from django.contrib import admin
from django.db import connection
from django.urls import path, include
from django.http import JsonResponse
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)
from drf_spectacular.utils import extend_schema, OpenApiResponse, OpenApiExample


@extend_schema(
    tags=['Health'],
    summary='Health check',
    description='Simple health check endpoint to verify the API is running.',
    responses={
        200: OpenApiResponse(
            description='API is healthy',
            examples=[
                OpenApiExample(
                    'Health Check Success',
                    value={'status': 'ok'}
                )
            ]
        )
    }
)
@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    """Simple health check endpoint."""
    return Response({"status": "ok"})


@extend_schema(
    tags=['Health'],
    summary='Readiness check',
    description='Reports whether the API can reach the database.',
    responses={
        200: OpenApiResponse(
            description='Database is reachable',
            examples=[
                OpenApiExample(
                    'Readiness Check Success',
                    value={'ready': True}
                )
            ]
        ),
        503: OpenApiResponse(
            description='Database is not reachable',
            examples=[
                OpenApiExample(
                    'Readiness Check Failure',
                    value={'ready': False}
                )
            ]
        ),
    }
)
@api_view(['GET'])
@permission_classes([AllowAny])
def ready_check(request):
    """Readiness check that verifies database connectivity."""
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        return Response({"ready": True})
    except Exception:
        return Response({"ready": False}, status=status.HTTP_503_SERVICE_UNAVAILABLE)


urlpatterns = [
    path('admin/', admin.site.urls),
    
    # Health checks (multiple endpoints to catch different variations)
    path('health/', health_check, name='health_check'),
    path('api/health/', health_check, name='api_health_check'),
    path('api/health/ready/', ready_check, name='api_health_ready_check'),
    
    # Authentication
    path('api/auth/', include('authentication.urls')),
    
    # API Documentation
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
]
