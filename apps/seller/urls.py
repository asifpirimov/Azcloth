from django.urls import path
from apps.seller.views import dashboard, ClaimStoreView, SellerAccountView, SellerOTPVerifyView, ProductCreateView, ProductEditView

app_name = 'seller'

urlpatterns = [
    path('dashboard/', dashboard, name='dashboard'),
    path('claim/<str:token>/', ClaimStoreView.as_view(), name='claim'),
    path('claim/<str:token>/account/', SellerAccountView.as_view(), name='claim_step2'),
    path('claim/<str:token>/verify/', SellerOTPVerifyView.as_view(), name='claim_step3'),
    path('products/create/', ProductCreateView.as_view(), name='product_create'),
    path('products/<int:pk>/edit/', ProductEditView.as_view(), name='product_edit'),
]
