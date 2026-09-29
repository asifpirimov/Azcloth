from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('django-admin/', admin.site.urls),
    path('accounts/', include('apps.accounts.urls')),
    path('seller/', include('apps.seller.urls')),
    path('admin/', include('apps.administration.urls')),
    path('reviews/', include('apps.reviews.urls')),
    path('api/', include('api.urls')),
    path('', include('apps.marketplace.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
