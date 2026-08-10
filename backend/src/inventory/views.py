import uuid

from django.core.exceptions import ValidationError
from rest_framework import status, viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema, extend_schema_view

from .models import InventoryItem
from .serializers import (
    InventoryItemCreateSerializer,
    InventoryItemSerializer,
    InventoryItemUpdateSerializer,
)


def format_validation_error(serializer):
    details = {}
    for field, errors in serializer.errors.items():
        if isinstance(errors, list):
            details[field] = str(errors[0])
        else:
            details[field] = str(errors)
    message = details.get('non_field_errors', 'Validation failed')
    if message == 'Validation failed' and len(details) == 1:
        message = next(iter(details.values()))
    elif message == 'Validation failed' and details:
        message = 'Validation failed'
    return Response({'error': message, 'details': details}, status=status.HTTP_400_BAD_REQUEST)


@extend_schema_view(
    list=extend_schema(tags=['Inventory'], summary='List inventory items'),
    retrieve=extend_schema(tags=['Inventory'], summary='Get inventory item'),
    create=extend_schema(tags=['Inventory'], summary='Create inventory item'),
    update=extend_schema(tags=['Inventory'], summary='Update inventory item'),
    partial_update=extend_schema(tags=['Inventory'], summary='Partially update inventory item'),
    destroy=extend_schema(tags=['Inventory'], summary='Delete inventory item'),
)
class InventoryItemViewSet(viewsets.ModelViewSet):
    queryset = InventoryItem.objects.all()
    permission_classes = [IsAuthenticated]
    pagination_class = None
    lookup_field = 'id'

    def get_serializer_class(self):
        if self.action == 'create':
            return InventoryItemCreateSerializer
        if self.action in ('update', 'partial_update'):
            return InventoryItemUpdateSerializer
        return InventoryItemSerializer

    def get_queryset(self):
        queryset = InventoryItem.objects.all()
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(name__icontains=search)
        return queryset

    def _get_item_or_404(self, pk):
        try:
            uuid.UUID(str(pk))
        except (ValueError, AttributeError, TypeError):
            return None
        try:
            return InventoryItem.objects.get(pk=pk)
        except (InventoryItem.DoesNotExist, ValidationError):
            return None

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = InventoryItemSerializer(queryset, many=True)
        return Response({'items': serializer.data})

    def retrieve(self, request, *args, **kwargs):
        instance = self._get_item_or_404(kwargs.get('id'))
        if instance is None:
            return Response({'error': 'Item not found'}, status=status.HTTP_404_NOT_FOUND)
        serializer = InventoryItemSerializer(instance)
        return Response(serializer.data)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            return format_validation_error(serializer)
        instance = serializer.save()
        return Response(
            InventoryItemSerializer(instance).data,
            status=status.HTTP_201_CREATED,
        )

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self._get_item_or_404(kwargs.get('id'))
        if instance is None:
            return Response({'error': 'Item not found'}, status=status.HTTP_404_NOT_FOUND)
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        if not serializer.is_valid():
            return format_validation_error(serializer)
        instance = serializer.save()
        return Response(InventoryItemSerializer(instance).data)

    def destroy(self, request, *args, **kwargs):
        instance = self._get_item_or_404(kwargs.get('id'))
        if instance is None:
            return Response({'error': 'Item not found'}, status=status.HTTP_404_NOT_FOUND)
        instance.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
