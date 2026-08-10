from django.core.validators import MinValueValidator
from django.db import models


class InventoryItem(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, default='')
    quantity = models.PositiveIntegerField(default=0)
    price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)],
    )
    low_stock_threshold = models.PositiveIntegerField(default=5)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'inventory_items'
        ordering = ['-created_at']

    def __str__(self):
        return self.name

    @property
    def stock_status(self):
        if self.quantity == 0:
            return 'out'
        if self.quantity <= self.low_stock_threshold:
            return 'low'
        return 'in_stock'
