from django.urls import path
from apps.administration.views import AdminDashboardView, CreateInvitationView

app_name = 'administration'

urlpatterns = [
    path('dashboard/', AdminDashboardView.as_view(), name='dashboard'),
    path('invitations/create/', CreateInvitationView.as_view(), name='create_invitation'),
]
