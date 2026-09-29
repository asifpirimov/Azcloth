from rest_framework import serializers
from apps.products.models import Product, ProductVariant, Category, ProductReview, ProductImage, ProductReviewImage
from apps.stores.models import Store, StoreReport, StoreReportImage
from api.auth_serializers import UserSerializer

class SimpleStoreSerializer(serializers.ModelSerializer):
    class Meta:
        model = Store
        fields = ['id', 'name', 'slug', 'logo']

class StoreSerializer(serializers.ModelSerializer):
    avg_rating = serializers.SerializerMethodField()
    product_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Store
        fields = ['id', 'name', 'slug', 'description', 'logo', 'cover_image', 'theme', 'whatsapp_number', 'instagram_url', 'status', 'suspension_reason', 'avg_rating', 'product_count']

    def get_avg_rating(self, obj):
        if hasattr(obj, 'annotated_avg_rating'):
            return obj.annotated_avg_rating or 0
        from django.db.models import Avg
        from apps.products.models import ProductReview
        avg = ProductReview.objects.filter(product__store=obj).aggregate(Avg('rating'))['rating__avg']
        return avg if avg else 0
        
    def get_product_count(self, obj):
        if hasattr(obj, 'annotated_product_count'):
            return obj.annotated_product_count
        return obj.products.filter(status='PUBLISHED').count()

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'slug']

class ProductVariantSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductVariant
        fields = ['id', 'color', 'size', 'price', 'stock']

class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ['id', 'image', 'order']

class ProductReviewImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductReviewImage
        fields = ['id', 'image']

class ProductReviewSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    images = ProductReviewImageSerializer(many=True, read_only=True)
    
    class Meta:
        model = ProductReview
        fields = ['id', 'product', 'user', 'rating', 'comment', 'images', 'created_at']
        read_only_fields = ['product']

class StoreReportImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = StoreReportImage
        fields = ['id', 'image']

class StoreReportSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    store = StoreSerializer(read_only=True)
    store_id = serializers.PrimaryKeyRelatedField(queryset=Store.objects.all(), source='store', write_only=True, required=False)
    images = StoreReportImageSerializer(many=True, read_only=True)
    
    class Meta:
        model = StoreReport
        fields = ['id', 'store', 'store_id', 'user', 'reason', 'description', 'images', 'created_at']

class ProductSerializer(serializers.ModelSerializer):
    store = SimpleStoreSerializer(read_only=True)
    category = CategorySerializer(read_only=True)
    variants = ProductVariantSerializer(many=True, read_only=True)
    images = ProductImageSerializer(many=True, read_only=True)
    base_price = serializers.ReadOnlyField()
    avg_rating = serializers.SerializerMethodField()
    review_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Product
        fields = ['id', 'store', 'category', 'name', 'slug', 'description', 'base_price', 'status', 'created_at', 'variants', 'images', 'main_image', 'avg_rating', 'review_count']

    def get_avg_rating(self, obj):
        if hasattr(obj, 'annotated_avg_rating'):
            return obj.annotated_avg_rating or 0
        reviews = obj.reviews.all()
        if reviews:
            return sum(r.rating for r in reviews) / len(reviews)
        return 0
        
    def get_review_count(self, obj):
        if hasattr(obj, 'annotated_review_count'):
            return obj.annotated_review_count
        return len(obj.reviews.all())

class SellerProductCreateSerializer(serializers.ModelSerializer):
    price = serializers.DecimalField(max_digits=10, decimal_places=2, write_only=True)
    stock = serializers.IntegerField(write_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(), source='category', required=False, allow_null=True
    )
    main_image = serializers.ImageField(required=False, allow_null=True)
    
    class Meta:
        model = Product
        fields = ['id', 'name', 'description', 'category_id', 'main_image', 'price', 'stock']

    def validate_main_image(self, value):
        if value.size > 5 * 1024 * 1024:
            raise serializers.ValidationError("Şəkil həcmi 5MB-dan çox ola bilməz.")
        # Optional: Further MIME checks can be done, but ImageField checks via Pillow
        return value

    def create(self, validated_data):
        price = validated_data.pop('price')
        stock = validated_data.pop('stock')
        
        # We need slug generation for products.
        from django.utils.text import slugify
        base_slug = slugify(validated_data['name'])
        slug = base_slug
        store = validated_data.get('store')
        counter = 1
        while Product.objects.filter(store=store, slug=slug).exists():
            slug = f"{base_slug}-{counter}"
            counter += 1
            
        validated_data['slug'] = slug
        
        product = Product.objects.create(**validated_data)
        
        ProductVariant.objects.create(
            product=product,
            sku=f"SKU-{product.id}",
            price=price,
            stock=stock
        )
        return product

from apps.products.models import ProductReport, ProductReportImage

class ProductReportImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductReportImage
        fields = ['id', 'image', 'created_at']

class ProductReportSerializer(serializers.ModelSerializer):
    reporter = UserSerializer(read_only=True)
    images = ProductReportImageSerializer(many=True, read_only=True)
    
    class Meta:
        model = ProductReport
        fields = ['id', 'reporter', 'reason', 'description', 'status', 'images', 'created_at']
