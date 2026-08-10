from rest_framework import status, viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import InventoryItem
from .serializers import InventoryItemSerializer


def error_response(code, message, details=None, status_code=status.HTTP_400_BAD_REQUEST):
    payload = {'error': {'code': code, 'message': message}}
    if details is not None:
        payload['error']['details'] = details
    return Response(payload, status=status_code)


class InventoryItemViewSet(viewsets.ModelViewSet):
    serializer_class = InventoryItemSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None
    lookup_field = 'pk'

    def get_queryset(self):
        queryset = InventoryItem.objects.all().order_by('-created_at')
        search_query = self.request.query_params.get('q')
        if search_query:
            queryset = queryset.filter(name__icontains=search_query)
        return queryset

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            return error_response(
                'INVALID_INPUT',
                'Invalid inventory item data.',
                serializer.errors,
                status.HTTP_400_BAD_REQUEST,
            )
        item = serializer.save()
        return Response(
            self.get_serializer(item).data,
            status=status.HTTP_201_CREATED,
        )

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        if not serializer.is_valid():
            return error_response(
                'INVALID_INPUT',
                'Invalid inventory item data.',
                serializer.errors,
                status.HTTP_400_BAD_REQUEST,
            )
        item = serializer.save()
        return Response(self.get_serializer(item).data)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    def handle_exception(self, exc):
        response = super().handle_exception(exc)
        if response is not None and response.status_code == status.HTTP_404_NOT_FOUND:
            return error_response(
                'NOT_FOUND',
                'Inventory item not found.',
                status_code=status.HTTP_404_NOT_FOUND,
            )
        return response
