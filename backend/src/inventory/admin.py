from django.contrib import admin

from .models import InventoryItem


@admin.register(InventoryItem)
class InventoryItemAdmin(admin.ModelAdmin):
    list_display = (
        'name',
        'quantity',
        'price',
        'low_stock_threshold',
        'created_at',
        'updated_at',
    )
    search_fields = ('name',)
    ordering = ('-created_at',)
