from django.db import models
from django.conf import settings
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.utils.translation import gettext_lazy as _

class Report(models.Model):
    STATUS_OPEN = 'OPEN'
    STATUS_REVIEWED = 'REVIEWED'
    STATUS_RESOLVED = 'RESOLVED'
    
    STATUS_CHOICES = [
        (STATUS_OPEN, _('Açıq')),
        (STATUS_REVIEWED, _('Baxılıb')),
        (STATUS_RESOLVED, _('Həll edilib')),
    ]

    REASON_CHOICES = [
        ('FRAUD', 'Fraud / Scam'),
        ('FAKE', 'Fake or misleading information'),
        ('SPAM', 'Spam'),
        ('COUNTERFEIT', 'Counterfeit'),
        ('INAPPROPRIATE', 'Inappropriate content'),
        ('OTHER', 'Other'),
    ]

    reporter = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='reports_submitted', null=True, blank=True)
    
    # Generic relation to support reporting Products, Stores, Comments
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.PositiveIntegerField()
    target = GenericForeignKey('content_type', 'object_id')
    
    reason = models.CharField(max_length=50, choices=REASON_CHOICES)
    details = models.TextField(blank=True)
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default=STATUS_OPEN)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Report {self.id} on {self.content_type} ({self.status})"
