from decimal import Decimal

from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from inventory.models import InventoryItem

User = get_user_model()


class InventoryAPITestCase(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='inventory@example.com',
            password='testpass123',
        )
        self.client.force_authenticate(user=self.user)
        self.list_url = reverse('inventory-list')

    def _create_item(self, **kwargs):
        defaults = {
            'name': 'Widget',
            'quantity': 10,
            'price': Decimal('19.99'),
            'description': 'A useful widget',
        }
        defaults.update(kwargs)
        return InventoryItem.objects.create(**defaults)

    def test_create_and_list(self):
        payload = {
            'name': 'New Item',
            'quantity': 12,
            'price': 9.5,
            'description': 'Fresh stock',
        }
        create_response = self.client.post(self.list_url, payload, format='json')
        self.assertEqual(create_response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(create_response.data['name'], 'New Item')
        self.assertEqual(create_response.data['status'], 'in-stock')

        list_response = self.client.get(self.list_url)
        self.assertEqual(list_response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(list_response.data['items']), 1)
        self.assertEqual(list_response.data['items'][0]['name'], 'New Item')

    def test_search_filter(self):
        self._create_item(name='Alpha Bolt')
        self._create_item(name='Beta Nut')

        response = self.client.get(self.list_url, {'search': 'bolt'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['items']), 1)
        self.assertEqual(response.data['items'][0]['name'], 'Alpha Bolt')

    def test_get_by_id(self):
        item = self._create_item(name='Lookup Item')
        detail_url = reverse('inventory-detail', kwargs={'id': item.id})

        response = self.client.get(detail_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], str(item.id))
        self.assertEqual(response.data['name'], 'Lookup Item')

    def test_update_quantity_and_price(self):
        item = self._create_item(name='Adjustable', quantity=10, price=Decimal('5.00'))
        detail_url = reverse('inventory-detail', kwargs={'id': item.id})

        response = self.client.put(
            detail_url,
            {'quantity': 2, 'price': 7.25},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['quantity'], 2)
        self.assertEqual(str(response.data['price']), '7.25')
        self.assertEqual(response.data['status'], 'low-stock')

    def test_delete(self):
        item = self._create_item(name='Disposable')
        detail_url = reverse('inventory-detail', kwargs={'id': item.id})

        response = self.client.delete(detail_url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(InventoryItem.objects.filter(pk=item.id).exists())

    def test_validation_negative_quantity(self):
        response = self.client.post(
            self.list_url,
            {'name': 'Bad Qty', 'quantity': -1, 'price': 1},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)
        self.assertIn('quantity', response.data['details'])

    def test_validation_negative_price(self):
        response = self.client.post(
            self.list_url,
            {'name': 'Bad Price', 'quantity': 1, 'price': -5},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)
        self.assertIn('price', response.data['details'])

    def test_validation_missing_name(self):
        response = self.client.post(
            self.list_url,
            {'quantity': 1, 'price': 1},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)
        self.assertIn('name', response.data['details'])

    def test_not_found(self):
        detail_url = reverse(
            'inventory-detail',
            kwargs={'id': '00000000-0000-0000-0000-000000000000'},
        )
        response = self.client.get(detail_url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(response.data['error'], 'Item not found')

    def test_status_computation(self):
        in_stock = self._create_item(name='Plenty', quantity=6)
        low_stock = self._create_item(name='Low', quantity=3)
        out_stock = self._create_item(name='Empty', quantity=0)

        self.assertEqual(InventoryItem.compute_status(in_stock.quantity), 'in-stock')
        self.assertEqual(InventoryItem.compute_status(low_stock.quantity), 'low-stock')
        self.assertEqual(InventoryItem.compute_status(out_stock.quantity), 'out-of-stock')

        list_response = self.client.get(self.list_url)
        statuses = {item['name']: item['status'] for item in list_response.data['items']}
        self.assertEqual(statuses['Plenty'], 'in-stock')
        self.assertEqual(statuses['Low'], 'low-stock')
        self.assertEqual(statuses['Empty'], 'out-of-stock')
