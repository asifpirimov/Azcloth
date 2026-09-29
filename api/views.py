from rest_framework import viewsets, generics
from rest_framework.permissions import AllowAny, IsAuthenticatedOrReadOnly, IsAuthenticated
from apps.products.models import Product, Category, ProductReview
from apps.stores.models import Store, StoreReport
from .serializers import ProductSerializer, CategorySerializer, StoreSerializer, ProductReviewSerializer, StoreReportSerializer
from django.db.models import Q
from rest_framework.response import Response
from rest_framework import status

class ProductViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = ProductSerializer
    permission_classes = [AllowAny]
    lookup_field = 'slug'

    def get_object(self):
        queryset = self.filter_queryset(self.get_queryset())
        lookup_url_kwarg = self.lookup_url_kwarg or self.lookup_field
        filter_kwargs = {self.lookup_field: self.kwargs[lookup_url_kwarg]}
        obj = queryset.filter(**filter_kwargs).first()
        if not obj:
            from django.http import Http404
            raise Http404
        self.check_object_permissions(self.request, obj)
        return obj

    def get_queryset(self):
        # Admin suspended stores should not show their products!
        queryset = Product.objects.filter(status=Product.STATUS_PUBLISHED, store__status=Store.STATUS_ACTIVE).select_related('category', 'store').prefetch_related(
            'variants', 'images', 'reviews'
        )
        category_slug = self.request.query_params.get('category')
        if category_slug:
            queryset = queryset.filter(category__slug=category_slug)
            
        search_query = self.request.query_params.get('search')
        if search_query:
            queryset = queryset.filter(
                Q(name__icontains=search_query) | 
                Q(description__icontains=search_query) |
                Q(store__name__icontains=search_query)
            )
            
        # Order by newest first instead of random which kills database performance
        return queryset.order_by('-created_at')

    from rest_framework.decorators import action

    @action(detail=True, methods=['post'])
    def track_view(self, request, slug=None):
        product = self.get_object()
        product.views_count += 1
        product.save(update_fields=['views_count'])
        return Response({'status': 'view tracked'})

    @action(detail=True, methods=['post'])
    def track_whatsapp(self, request, slug=None):
        product = self.get_object()
        product.whatsapp_clicks += 1
        product.save(update_fields=['whatsapp_clicks'])
        return Response({'status': 'whatsapp click tracked'})

class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [AllowAny]

class StoreViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = StoreSerializer
    permission_classes = [AllowAny]
    lookup_field = 'slug'
    
    def get_queryset(self):
        from django.db.models import Count, Avg, Q, F
        return Store.objects.filter(status=Store.STATUS_ACTIVE).annotate(
            annotated_product_count=Count('products', filter=Q(products__status='PUBLISHED'), distinct=True),
            annotated_avg_rating=Avg('products__reviews__rating')
        )

class ProductReviewListCreateAPIView(generics.ListCreateAPIView):
    serializer_class = ProductReviewSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        slug = self.kwargs['slug']
        return ProductReview.objects.filter(product__slug=slug, status=ProductReview.STATUS_VISIBLE)

    def perform_create(self, serializer):
        slug = self.kwargs['slug']
        product = Product.objects.filter(slug=slug).first()
        if not product:
            from django.http import Http404
            raise Http404("Məhsul tapılmadı")
        review = serializer.save(user=self.request.user, product=product)
        
        from apps.products.models import ProductReviewImage
        images = self.request.FILES.getlist('images')
        for img in images:
            ProductReviewImage.objects.create(review=review, image=img)

class ProductReviewRetrieveUpdateDestroyAPIView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ProductReviewSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Users can only edit/delete their own reviews
        return ProductReview.objects.filter(user=self.request.user)

class StoreReportCreateAPIView(generics.CreateAPIView):
    serializer_class = StoreReportSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        store_id = self.kwargs['pk']
        from apps.stores.models import Store
        store = Store.objects.get(id=store_id)
        report = serializer.save(user=self.request.user, store=store)
        
        from apps.stores.models import StoreReportImage
        images = self.request.FILES.getlist('images')
        for img in images:
            StoreReportImage.objects.create(report=report, image=img)

from apps.products.models import ProductReport
from .serializers import ProductReportSerializer

class ProductReportCreateAPIView(generics.CreateAPIView):
    serializer_class = ProductReportSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        slug = self.kwargs['slug']
        product = Product.objects.filter(slug=slug).first()
        if not product:
            from django.http import Http404
            raise Http404("Məhsul tapılmadı")
        report = serializer.save(reporter=self.request.user, product=product)
        
        from apps.products.models import ProductReportImage
        images = self.request.FILES.getlist('images')
        for img in images:
            ProductReportImage.objects.create(report=report, image=img)
