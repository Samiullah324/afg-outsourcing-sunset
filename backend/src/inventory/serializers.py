from rest_framework import serializers

from .models import InventoryItem


class InventoryItemSerializer(serializers.ModelSerializer):
    status = serializers.SerializerMethodField()

    class Meta:
        model = InventoryItem
        fields = ('id', 'name', 'quantity', 'price', 'description', 'status')
        read_only_fields = ('id', 'status')

    def get_status(self, obj):
        return InventoryItem.compute_status(obj.quantity)

    def validate_name(self, value):
        trimmed = value.strip()
        if not trimmed:
            raise serializers.ValidationError('Name is required.')
        if len(trimmed) > 100:
            raise serializers.ValidationError('Name must be at most 100 characters.')
        return trimmed

    def validate_quantity(self, value):
        if value < 0:
            raise serializers.ValidationError('Quantity must be greater than or equal to 0.')
        return value

    def validate_price(self, value):
        if value < 0:
            raise serializers.ValidationError('Price must be greater than or equal to 0.')
        return value

    def validate_description(self, value):
        if value is None:
            return ''
        if len(value) > 500:
            raise serializers.ValidationError('Description must be at most 500 characters.')
        return value


class InventoryItemCreateSerializer(InventoryItemSerializer):
    class Meta(InventoryItemSerializer.Meta):
        extra_kwargs = {
            'name': {'required': True},
            'quantity': {'required': True},
            'price': {'required': True},
            'description': {'required': False},
        }


class InventoryItemUpdateSerializer(InventoryItemSerializer):
    class Meta(InventoryItemSerializer.Meta):
        extra_kwargs = {
            'name': {'required': False},
            'quantity': {'required': False},
            'price': {'required': False},
            'description': {'required': False},
        }

    def validate(self, attrs):
        if not attrs and not self.partial:
            raise serializers.ValidationError('At least one field must be provided.')
        return attrs

    def to_internal_value(self, data):
        if not isinstance(data, dict):
            raise serializers.ValidationError('Invalid payload.')
        cleaned = {}
        for field in ('name', 'quantity', 'price', 'description'):
            if field in data:
                cleaned[field] = data[field]
        if not cleaned:
            raise serializers.ValidationError('At least one field must be provided.')
        return super().to_internal_value(cleaned)
