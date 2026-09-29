from django.urls import path
from django.contrib.auth.views import LogoutView
from apps.accounts.views import BuyerRegisterView, OTPVerifyView, CustomLoginView

app_name = 'accounts'

urlpatterns = [
    path('register/', BuyerRegisterView.as_view(), name='register'),
    path('verify-otp/', OTPVerifyView.as_view(), name='verify_otp'),
    path('login/', CustomLoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(next_page='marketplace:home'), name='logout'),
]
