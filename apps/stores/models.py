from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _
import secrets

class Store(models.Model):
    STATUS_INVITED = 'INVITED'
    STATUS_CLAIMED = 'CLAIMED'
    STATUS_ACTIVE = 'ACTIVE'
    STATUS_SUSPENDED = 'SUSPENDED'
    
    STATUS_CHOICES = [
        (STATUS_INVITED, _('Dəvət edilib')),
        (STATUS_CLAIMED, _('Qeydiyyatdan keçib')),
        (STATUS_ACTIVE, _('Aktiv')),
        (STATUS_SUSPENDED, _('Dayandırılıb')),
    ]

    THEME_MODERN = 'modern'
    THEME_MINIMAL = 'minimal'
    THEME_BOUTIQUE = 'boutique'
    THEME_CLASSIC = 'classic'

    THEME_CHOICES = [
        (THEME_MODERN, 'Modern'),
        (THEME_MINIMAL, 'Minimal'),
        (THEME_BOUTIQUE, 'Boutique'),
        (THEME_CLASSIC, 'Classic'),
    ]

    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='stores')
    name = models.CharField(max_length=255)
    slug = models.SlugField(unique=True, max_length=255)
    description = models.TextField(blank=True)
    logo = models.ImageField(upload_to='stores/logos/', blank=True, null=True)
    cover_image = models.ImageField(upload_to='stores/covers/', blank=True, null=True)
    phone = models.CharField(max_length=50, blank=True)
    whatsapp_number = models.CharField(max_length=50, blank=True)
    address = models.TextField(blank=True)
    instagram_url = models.URLField(blank=True)
    tiktok_url = models.URLField(blank=True)
    theme = models.CharField(max_length=50, choices=THEME_CHOICES, default=THEME_MODERN)
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default=STATUS_INVITED)
    suspension_reason = models.TextField(blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

class StoreInvitation(models.Model):
    store = models.OneToOneField(Store, on_delete=models.CASCADE, related_name='invitation')
    token = models.CharField(max_length=100, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    is_revoked = models.BooleanField(default=False)

    @classmethod
    def generate_token(cls):
        return secrets.token_urlsafe(32)

    def __str__(self):
        return f"Invitation for {self.store.name}"

class StoreReport(models.Model):
    store = models.ForeignKey(Store, on_delete=models.CASCADE, related_name='reports')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='store_reports')
    reason = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Report for {self.store.name} by {self.user.username}"

class StoreReportImage(models.Model):
    report = models.ForeignKey(StoreReport, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to='reports/images/')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Image for Report {self.report.id}"
