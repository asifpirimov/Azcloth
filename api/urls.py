from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProductViewSet, CategoryViewSet, StoreViewSet

router = DefaultRouter()
router.register(r'products', ProductViewSet, basename='product')
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'stores', StoreViewSet, basename='store')

from .views import ProductViewSet, CategoryViewSet, StoreViewSet, ProductReviewListCreateAPIView, StoreReportCreateAPIView, ProductReviewRetrieveUpdateDestroyAPIView, ProductReportCreateAPIView
from .auth_views import RegisterView, CustomTokenObtainPairView, GoogleLoginView, ProfileView, StoreRegisterView, StoreTokenVerifyView, VerifyEmailView, ResendOTPView, LogoutView
from .seller_views import SellerProductViewSet, SellerStoreView, SellerStatisticsView
from .admin_views import StoreInvitationView, AdminReportListView, AdminStoreStatusToggleView, AdminDashboardView, AdminReviewActionView, AdminProductReportActionView
from rest_framework_simplejwt.views import TokenRefreshView

router.register(r'seller/products', SellerProductViewSet, basename='seller-product')

urlpatterns = [
    path('seller/store/', SellerStoreView.as_view(), name='seller_store'),
    path('seller/statistics/', SellerStatisticsView.as_view(), name='seller_statistics'),
    path('', include(router.urls)),
    path('products/<slug:slug>/reviews/', ProductReviewListCreateAPIView.as_view(), name='product_reviews'),
    path('reviews/<int:pk>/', ProductReviewRetrieveUpdateDestroyAPIView.as_view(), name='review_detail'),
    path('products/<slug:slug>/report/', ProductReportCreateAPIView.as_view(), name='product_report'),
    path('stores/<int:pk>/report/', StoreReportCreateAPIView.as_view(), name='store_report'),
    
    path('auth/register/', RegisterView.as_view(), name='auth_register'),
    path('auth/verify-email/', VerifyEmailView.as_view(), name='auth_verify_email'),
    path('auth/resend-otp/', ResendOTPView.as_view(), name='auth_resend_otp'),
    path('auth/login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/logout/', LogoutView.as_view(), name='auth_logout'),
    path('auth/google/', GoogleLoginView.as_view(), name='auth_google'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/profile/', ProfileView.as_view(), name='auth_profile'),
    path('auth/store-register/', StoreRegisterView.as_view(), name='store_register'),
    path('auth/store-token-verify/', StoreTokenVerifyView.as_view(), name='store_token_verify'),
    
    path('admin/invites/', StoreInvitationView.as_view(), name='admin_invites'),
    path('admin/reports/', AdminReportListView.as_view(), name='admin_reports'),
    path('admin/dashboard/', AdminDashboardView.as_view(), name='admin_dashboard'),
    path('admin/stores/<int:pk>/status/', AdminStoreStatusToggleView.as_view(), name='admin_store_status'),
    path('admin/reviews/<int:pk>/action/', AdminReviewActionView.as_view(), name='admin_review_action'),
    path('admin/product-reports/', AdminProductReportActionView.as_view(), name='admin_product_reports'),
    path('admin/product-reports/<int:pk>/action/', AdminProductReportActionView.as_view(), name='admin_product_report_action'),
]
