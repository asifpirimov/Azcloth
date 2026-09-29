from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils.translation import gettext_lazy as _
from django.utils import timezone
import random
import string

class User(AbstractUser):
    ROLE_GUEST = 'GUEST'
    ROLE_BUYER = 'BUYER'
    ROLE_SELLER = 'SELLER'
    ROLE_ADMIN = 'ADMIN'
    
    ROLE_CHOICES = [
        (ROLE_GUEST, _('Qonaq')),
        (ROLE_BUYER, _('Alıcı')),
        (ROLE_SELLER, _('Satıcı')),
        (ROLE_ADMIN, _('Admin')),
    ]
    
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default=ROLE_BUYER)
    is_email_verified = models.BooleanField(default=False)

    def is_buyer(self):
        return self.role == self.ROLE_BUYER

    def is_seller(self):
        return self.role == self.ROLE_SELLER
        
    def is_admin_role(self):
        return self.role == self.ROLE_ADMIN or self.is_superuser

class EmailVerification(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='verifications', null=True, blank=True)
    email = models.EmailField()
    otp_hash = models.CharField(max_length=128)
    attempts = models.IntegerField(default=0)
    expires_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)
    is_verified = models.BooleanField(default=False)

    def is_valid(self):
        return not self.is_verified and self.expires_at > timezone.now() and self.attempts < 3

