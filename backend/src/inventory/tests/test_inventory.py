import pytest
from decimal import Decimal

from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APIClient

from inventory.models import InventoryItem

User = get_user_model()


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def user(db):
    return User.objects.create_user(
        email='inventory@test.com',
        password='testpass123',
    )


@pytest.fixture
def auth_client(api_client, user):
    api_client.force_authenticate(user=user)
    return api_client


@pytest.fixture
def inventory_item(db):
    return InventoryItem.objects.create(
        name='Widget',
        description='A test widget',
        quantity=10,
        price=Decimal('19.99'),
        low_stock_threshold=5,
    )


@pytest.mark.django_db
class TestInventoryCreate:
    def test_create_item_success(self, auth_client):
        response = auth_client.post(
            '/api/inventory/',
            {
                'name': 'New Item',
                'description': 'Test description',
                'quantity': 20,
                'price': '29.99',
                'low_stock_threshold': 5,
            },
            format='json',
        )

        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert data['name'] == 'New Item'
        assert data['quantity'] == 20
        assert data['stock_status'] == 'in_stock'
        assert InventoryItem.objects.count() == 1

    def test_create_item_invalid_missing_name(self, auth_client):
        response = auth_client.post(
            '/api/inventory/',
            {
                'quantity': 5,
                'price': '10.00',
            },
            format='json',
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        body = response.json()
        assert body['error']['code'] == 'INVALID_INPUT'

    def test_create_item_invalid_negative_quantity(self, auth_client):
        response = auth_client.post(
            '/api/inventory/',
            {
                'name': 'Bad Item',
                'quantity': -1,
                'price': '10.00',
            },
            format='json',
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert response.json()['error']['code'] == 'INVALID_INPUT'


@pytest.mark.django_db
class TestInventoryListAndSearch:
    def test_list_items_ordered_by_created_at_desc(self, auth_client, inventory_item):
        InventoryItem.objects.create(
            name='Older Item',
            quantity=1,
            price=Decimal('5.00'),
        )

        response = auth_client.get('/api/inventory/')

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert len(data) == 2
        assert data[0]['name'] == 'Older Item'

    def test_search_by_name(self, auth_client, inventory_item):
        InventoryItem.objects.create(
            name='Gadget',
            quantity=3,
            price=Decimal('12.00'),
        )

        response = auth_client.get('/api/inventory/', {'q': 'widget'})

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert len(data) == 1
        assert data[0]['name'] == 'Widget'


@pytest.mark.django_db
class TestInventoryRetrieve:
    def test_get_item(self, auth_client, inventory_item):
        response = auth_client.get(f'/api/inventory/{inventory_item.id}/')

        assert response.status_code == status.HTTP_200_OK
        assert response.json()['id'] == inventory_item.id

    def test_get_item_not_found(self, auth_client):
        response = auth_client.get('/api/inventory/99999/')

        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert response.json()['error']['code'] == 'NOT_FOUND'


@pytest.mark.django_db
class TestInventoryUpdate:
    def test_update_item(self, auth_client, inventory_item):
        response = auth_client.put(
            f'/api/inventory/{inventory_item.id}/',
            {
                'name': 'Updated Widget',
                'description': inventory_item.description,
                'quantity': 3,
                'price': '19.99',
                'low_stock_threshold': 5,
            },
            format='json',
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data['name'] == 'Updated Widget'
        assert data['quantity'] == 3
        assert data['stock_status'] == 'low'

    def test_update_rejects_negative_price(self, auth_client, inventory_item):
        response = auth_client.put(
            f'/api/inventory/{inventory_item.id}/',
            {
                'name': inventory_item.name,
                'quantity': inventory_item.quantity,
                'price': '-1.00',
                'low_stock_threshold': inventory_item.low_stock_threshold,
            },
            format='json',
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert response.json()['error']['code'] == 'INVALID_INPUT'


@pytest.mark.django_db
class TestInventoryDelete:
    def test_delete_item(self, auth_client, inventory_item):
        response = auth_client.delete(f'/api/inventory/{inventory_item.id}/')

        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert InventoryItem.objects.count() == 0

    def test_get_after_delete_returns_404(self, auth_client, inventory_item):
        item_id = inventory_item.id
        auth_client.delete(f'/api/inventory/{item_id}/')

        response = auth_client.get(f'/api/inventory/{item_id}/')
        assert response.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.django_db
class TestStockStatus:
    @pytest.mark.parametrize(
        'quantity,threshold,expected_status',
        [
            (0, 5, 'out'),
            (3, 5, 'low'),
            (5, 5, 'low'),
            (6, 5, 'in_stock'),
        ],
    )
    def test_stock_status_transitions(
        self, auth_client, quantity, threshold, expected_status
    ):
        item = InventoryItem.objects.create(
            name='Status Item',
            quantity=quantity,
            price=Decimal('10.00'),
            low_stock_threshold=threshold,
        )

        response = auth_client.get(f'/api/inventory/{item.id}/')

        assert response.status_code == status.HTTP_200_OK
        assert response.json()['stock_status'] == expected_status
