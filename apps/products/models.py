from django.db import models
from django.conf import settings
from apps.stores.models import Store
from django.utils.translation import gettext_lazy as _

class Category(models.Model):
    name = models.CharField(max_length=255)
    slug = models.SlugField(unique=True)

    def __str__(self):
        return self.name

    class Meta:
        verbose_name_plural = 'Categories'

class Product(models.Model):
    STATUS_DRAFT = 'DRAFT'
    STATUS_PUBLISHED = 'PUBLISHED'
    STATUS_HIDDEN = 'HIDDEN'
    
    STATUS_CHOICES = [
        (STATUS_DRAFT, _('Qaralama')),
        (STATUS_PUBLISHED, _('Dərc edilib')),
        (STATUS_HIDDEN, _('Gizlədilib')),
    ]

    store = models.ForeignKey(Store, on_delete=models.CASCADE, related_name='products')
    name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255)
    description = models.TextField(blank=True)
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True, related_name='products')
    brand = models.CharField(max_length=255, blank=True)
    main_image = models.ImageField(upload_to='products/images/')
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default=STATUS_DRAFT)
    
    views_count = models.PositiveIntegerField(default=0)
    whatsapp_clicks = models.PositiveIntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('store', 'slug')

    def __str__(self):
        return self.name
        
    def save(self, *args, **kwargs):
        # Allow resizing if new or main_image changed
        if self.pk:
            old_obj = Product.objects.get(pk=self.pk)
            if old_obj.main_image != self.main_image:
                resize_image(self.main_image)
        else:
            resize_image(self.main_image)
        super().save(*args, **kwargs)
    
    @property
    def base_price(self):
        variants = self.variants.all()
        return variants[0].price if variants else 0

    @property
    def total_stock(self):
        return sum(variant.stock for variant in self.variants.all())

from PIL import Image
from io import BytesIO
from django.core.files.uploadedfile import InMemoryUploadedFile
import sys

def resize_image(image_field, max_width=1200):
    if not image_field:
        return
        
    img = Image.open(image_field)
    
    # Check if resize is needed
    if img.width > max_width:
        output_size = (max_width, int(img.height * (max_width / img.width)))
        img = img.resize(output_size, Image.Resampling.LANCZOS)
    
    # Always compress/convert to JPEG or optimize
    output = BytesIO()
    # Convert RGBA to RGB if necessary for JPEG
    if img.mode in ("RGBA", "P"):
        img = img.convert("RGB")
        
    img.save(output, format='JPEG', quality=85, optimize=True)
    output.seek(0)
    
    # Change the file extension to .jpg in the filename
    filename = image_field.name.rsplit('.', 1)[0] + '.jpg'
    
    image_field.file = InMemoryUploadedFile(
        output,
        'ImageField',
        filename,
        'image/jpeg',
        sys.getsizeof(output),
        None
    )
    image_field.name = filename

class ProductVariant(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='variants')
    sku = models.CharField(max_length=100, blank=True)
    size = models.CharField(max_length=50, blank=True)
    color = models.CharField(max_length=50, blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    stock = models.PositiveIntegerField(default=0)

    def __str__(self):
        return f"{self.product.name} - {self.color} / {self.size}"

class ProductImage(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to='products/images/')
    order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['order', 'created_at']

    def __str__(self):
        return f"Image for {self.product.name}"

    def save(self, *args, **kwargs):
        # Resize only on creation or if image field is updated.
        if self.pk is None:
            resize_image(self.image)
        super().save(*args, **kwargs)

class ProductReview(models.Model):
    STATUS_VISIBLE = 'VISIBLE'
    STATUS_HIDDEN = 'HIDDEN'
    STATUS_CHOICES = [
        (STATUS_VISIBLE, 'Görünür'),
        (STATUS_HIDDEN, 'Gizli'),
    ]

    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='reviews')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='product_reviews')
    rating = models.PositiveIntegerField(choices=[(i, i) for i in range(1, 6)])
    comment = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_VISIBLE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('product', 'user')
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username} - {self.product.name} ({self.rating}/5)"

class ProductReviewImage(models.Model):
    review = models.ForeignKey(ProductReview, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to='reviews/images/')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Image for Review {self.review.id}"

class ProductReport(models.Model):
    STATUS_OPEN = 'OPEN'
    STATUS_UNDER_REVIEW = 'UNDER_REVIEW'
    STATUS_RESOLVED = 'RESOLVED'
    
    STATUS_CHOICES = [
        (STATUS_OPEN, 'Açıq'),
        (STATUS_UNDER_REVIEW, 'Baxışdadır'),
        (STATUS_RESOLVED, 'Həll edilib'),
    ]

    reporter = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='product_reports')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='reports')
    reason = models.CharField(max_length=255)
    description = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_OPEN)
    
    created_at = models.DateTimeField(auto_now_add=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    resolved_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='resolved_product_reports')

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Report for {self.product.name} by {self.reporter.username}"

class ProductReportImage(models.Model):
    report = models.ForeignKey(ProductReport, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to='reports/product_images/')
    created_at = models.DateTimeField(auto_now_add=True)
