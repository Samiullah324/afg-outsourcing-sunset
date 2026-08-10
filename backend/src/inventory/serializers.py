from decimal import Decimal

from rest_framework import serializers

from .models import InventoryItem


class InventoryItemSerializer(serializers.ModelSerializer):
    stock_status = serializers.CharField(read_only=True)

    class Meta:
        model = InventoryItem
        fields = [
            'id',
            'name',
            'description',
            'quantity',
            'price',
            'low_stock_threshold',
            'stock_status',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'stock_status', 'created_at', 'updated_at']

    def validate_name(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError('Name is required.')
        return value.strip()

    def validate_quantity(self, value):
        if value < 0:
            raise serializers.ValidationError('Quantity must be greater than or equal to 0.')
        return value

    def validate_price(self, value):
        if value < Decimal('0'):
            raise serializers.ValidationError('Price must be greater than or equal to 0.')
        return value

    def validate_low_stock_threshold(self, value):
        if value < 0:
            raise serializers.ValidationError(
                'Low stock threshold must be greater than or equal to 0.'
            )
        return value

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['stock_status'] = instance.stock_status
        return data
