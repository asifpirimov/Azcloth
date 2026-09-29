from django.urls import path
from apps.reviews.views import add_comment

app_name = 'reviews'

urlpatterns = [
    path('product/<int:product_id>/comment/', add_comment, name='add_comment'),
]
