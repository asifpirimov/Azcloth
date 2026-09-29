from django.urls import path
from apps.marketplace.views import HomeView, ProductListView, ProductDetailView, StoreDetailView, CartView

app_name = 'marketplace'

urlpatterns = [
    path('', HomeView.as_view(), name='home'),
    path('products/', ProductListView.as_view(), name='product_list'),
    path('cart/', CartView.as_view(), name='cart'),
    path('stores/<slug:slug>/', StoreDetailView.as_view(), name='store_detail'),
    path('<slug:store_slug>/<slug:product_slug>/', ProductDetailView.as_view(), name='product_detail'),
]
