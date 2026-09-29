from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from apps.products.models import Product, ProductVariant, ProductImage
from .serializers import ProductSerializer, ProductVariantSerializer, SellerProductCreateSerializer
import json

class IsSeller(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'SELLER')

class SellerProductViewSet(viewsets.ModelViewSet):
    permission_classes = [IsSeller]
    parser_classes = (MultiPartParser, FormParser, JSONParser)

    def get_serializer_class(self):
        if self.action in ['create']:
            return SellerProductCreateSerializer
        return ProductSerializer

    def get_queryset(self):
        # Only return products belonging to the seller's store (any status)
        user_stores = self.request.user.stores.all()
        if not user_stores.exists():
            return Product.objects.none()
        return Product.objects.filter(store=user_stores.first()).select_related('category', 'store').prefetch_related('variants', 'images', 'reviews')

    def perform_create(self, serializer):
        from rest_framework.exceptions import ValidationError
        store = self.request.user.stores.first()
        product = serializer.save(store=store, status=Product.STATUS_DRAFT)
        
        # Handle additional images
        additional_images = self.request.FILES.getlist('additional_images')
        for img in additional_images:
            if img.size > 5 * 1024 * 1024:
                raise ValidationError("Əlavə şəkillərin həcmi 5MB-dan çox ola bilməz.")
            ProductImage.objects.create(product=product, image=img)

    def partial_update(self, request, *args, **kwargs):
        from rest_framework.exceptions import ValidationError
        product = self.get_object()
        
        # Update basic fields
        if 'name' in request.data:
            product.name = request.data['name']
        if 'description' in request.data:
            product.description = request.data['description']
        if 'status' in request.data:
            product.status = request.data['status']
        if 'category_id' in request.data:
            from apps.products.models import Category
            cat_id = request.data['category_id']
            product.category = Category.objects.filter(id=cat_id).first() if cat_id else None
        if 'main_image' in request.FILES:
            img = request.FILES['main_image']
            if img.size > 5 * 1024 * 1024:
                raise ValidationError("Şəkil həcmi 5MB-dan çox ola bilməz.")
            product.main_image = img
        
        product.save()

        # Handle variants update (JSON string from FormData)
        variants_json = request.data.get('variants')
        if variants_json:
            if isinstance(variants_json, str):
                variants_data = json.loads(variants_json)
            else:
                variants_data = variants_json
            
            existing_ids = set(product.variants.values_list('id', flat=True))
            incoming_ids = set()

            for v in variants_data:
                v_id = v.get('id')
                if v_id and int(v_id) in existing_ids:
                    # Update existing variant
                    variant = ProductVariant.objects.get(id=v_id)
                    variant.size = v.get('size', variant.size)
                    variant.color = v.get('color', variant.color)
                    variant.price = v.get('price', variant.price)
                    variant.stock = v.get('stock', variant.stock)
                    variant.save()
                    incoming_ids.add(int(v_id))
                else:
                    # Create new variant
                    ProductVariant.objects.create(
                        product=product,
                        size=v.get('size', ''),
                        color=v.get('color', ''),
                        price=v.get('price', 0),
                        stock=v.get('stock', 0),
                    )

            # Delete variants that were removed
            to_delete = existing_ids - incoming_ids
            ProductVariant.objects.filter(id__in=to_delete).delete()

        # Handle delete images
        delete_images = request.data.get('delete_images')
        if delete_images:
            if isinstance(delete_images, str):
                delete_ids = json.loads(delete_images)
            else:
                delete_ids = delete_images
            ProductImage.objects.filter(id__in=delete_ids, product=product).delete()

        # Handle new images
        new_images = request.FILES.getlist('new_images')
        for img in new_images:
            if img.size > 5 * 1024 * 1024:
                raise ValidationError("Əlavə şəkillərin həcmi 5MB-dan çox ola bilməz.")
            ProductImage.objects.create(product=product, image=img)

        # Return updated product
        serializer = ProductSerializer(product)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def bulk_import(self, request):
        if 'file' not in request.FILES:
            return Response({"error": "Fayl təqdim edilməyib."}, status=400)
            
        file = request.FILES['file']
        if not file.name.endswith('.xlsx'):
            return Response({"error": "Yalnız Excel (.xlsx) faylları qəbul edilir."}, status=400)
            
        store = request.user.stores.first()
        if not store:
            return Response({"error": "Mağaza tapılmadı."}, status=404)
            
        try:
            import pandas as pd
            from django.db import transaction
            df = pd.read_excel(file)
            
            # Required columns: Name, Description, Category, ImageURL, Size, Color, Stock, Price
            required_cols = ['Name', 'Category', 'Size', 'Stock', 'Price']
            for col in required_cols:
                if col not in df.columns:
                    return Response({"error": f"Məcburi sütun çatışmır: {col}"}, status=400)
            
            from apps.products.models import Category
            
            products_created = 0
            variants_created = 0
            
            # Group by Name to create one Product for multiple variants
            grouped = df.groupby('Name')
            
            with transaction.atomic():
                product_objects = []
                variant_objects = []
                
                category_map = {c.name.lower(): c for c in Category.objects.all()}
                fallback_category = category_map.get('digər')

                for name, group in grouped:
                    first_row = group.iloc[0]
                    cat_name = str(first_row.get('Category', '')).strip().lower()
                    category = category_map.get(cat_name) or fallback_category
                        
                    # Create Product
                    product = Product(
                        store=store,
                        name=str(name).strip(),
                        description=str(first_row.get('Description', '')).strip() if pd.notna(first_row.get('Description')) else '',
                        category=category,
                        status=Product.STATUS_DRAFT
                    )
                    product.save() # Need ID for variants, so we save one by one. Still within a transaction!
                    products_created += 1
                    
                    # Create Variants
                    for _, row in group.iterrows():
                        variant_objects.append(ProductVariant(
                            product=product,
                            size=str(row['Size']).strip() if pd.notna(row['Size']) else 'Standart',
                            color=str(row.get('Color', '')).strip() if pd.notna(row.get('Color')) else '',
                            stock=int(row['Stock']) if pd.notna(row['Stock']) else 0,
                            price=float(row['Price']) if pd.notna(row['Price']) else 0.0
                        ))
                        variants_created += 1
                
                ProductVariant.objects.bulk_create(variant_objects)
            
            return Response({
                "message": f"Toplu əlavə tamamlandı. {products_created} məhsul və {variants_created} variant yaradıldı."
            })
            
        except Exception as e:
            return Response({"error": str(e)}, status=400)

class SellerStoreView(APIView):
    permission_classes = [IsSeller]
    parser_classes = (MultiPartParser, FormParser, JSONParser)

    def get(self, request):
        store = request.user.stores.first()
        if not store:
            return Response({"error": "Mağaza tapılmadı"}, status=404)
        from .serializers import StoreSerializer
        serializer = StoreSerializer(store)
        return Response(serializer.data)

    def patch(self, request):
        store = request.user.stores.first()
        if not store:
            return Response({"error": "Mağaza tapılmadı"}, status=404)
        
        # Check if they want to deactivate/delete
        status_update = request.data.get('status')
        if status_update in ['INACTIVE', 'SUSPENDED']:
            # Maybe just allow INACTIVE for sellers
            store.status = 'INACTIVE'
            store.save()
            return Response({"message": "Mağaza deaktiv edildi."})
            
        # Update other fields
        if 'name' in request.data:
            store.name = request.data['name']
        if 'description' in request.data:
            store.description = request.data['description']
        if 'whatsapp_number' in request.data:
            store.whatsapp_number = request.data['whatsapp_number']
        if 'instagram_url' in request.data:
            store.instagram_url = request.data['instagram_url']
        if 'theme' in request.data:
            store.theme = request.data['theme']
        
        if 'logo' in request.FILES:
            store.logo = request.FILES['logo']
        if 'cover_image' in request.FILES:
            store.cover_image = request.FILES['cover_image']
            
        store.save()
        from .serializers import StoreSerializer
        return Response(StoreSerializer(store).data)

class SellerStatisticsView(APIView):
    permission_classes = [IsSeller]
    
    def get(self, request):
        store = request.user.stores.first()
        if not store:
            return Response({"error": "Mağaza tapılmadı"}, status=404)
            
        from django.db.models import Sum, Count, Avg
        from apps.products.models import Product
        
        products = Product.objects.filter(store=store)
        
        total_products = products.count()
        active_products = products.filter(status=Product.STATUS_PUBLISHED).count()
        
        stats = products.aggregate(
            total_views=Sum('views_count'),
            total_whatsapp_clicks=Sum('whatsapp_clicks'),
            total_reviews=Count('reviews'),
            avg_rating=Avg('reviews__rating')
        )
        
        return Response({
            'total_products': total_products,
            'active_products': active_products,
            'total_views': stats['total_views'] or 0,
            'total_whatsapp_clicks': stats['total_whatsapp_clicks'] or 0,
            'total_reviews': stats['total_reviews'] or 0,
            'avg_rating': round(stats['avg_rating'] or 0, 1)
        })
