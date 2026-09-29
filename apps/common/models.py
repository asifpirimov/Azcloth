from django.db import models
from django.conf import settings

class AuditLog(models.Model):
    actor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='audit_logs')
    action = models.CharField(max_length=255)
    target_type = models.CharField(max_length=100, default='')
    target_id = models.CharField(max_length=100, default='')
    timestamp = models.DateTimeField(auto_now_add=True)
    metadata = models.JSONField(default=dict, blank=True)

    def __str__(self):
        return f"{self.actor} - {self.action} on {self.target_type} ({self.target_id}) at {self.timestamp}"
