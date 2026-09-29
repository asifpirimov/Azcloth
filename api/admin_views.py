from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.utils.text import slugify
from django.db.models import Count, Sum
from apps.stores.models import Store, StoreInvitation, StoreReport
from apps.products.models import Product
from api.serializers import StoreReportSerializer

class IsAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_admin_role())

class StoreInvitationView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        # List all active invitations
        invites = StoreInvitation.objects.select_related('store').filter(is_revoked=False, store__status=Store.STATUS_INVITED)
        data = [
            {
                'store_name': inv.store.name,
                'token': inv.token,
                'created_at': inv.created_at,
            }
            for inv in invites
        ]
        return Response(data)

    def post(self, request):
        store_name = request.data.get('store_name')
        if not store_name:
            return Response({'error': 'Mağaza adı qeyd edilməlidir.'}, status=status.HTTP_400_BAD_REQUEST)
        
        base_slug = slugify(store_name)
        slug = base_slug
        counter = 1
        while Store.objects.filter(slug=slug).exists():
            slug = f"{base_slug}-{counter}"
            counter += 1

        store = Store.objects.create(
            name=store_name,
            slug=slug,
            status=Store.STATUS_INVITED
        )

        invitation = StoreInvitation.objects.create(
            store=store,
            token=StoreInvitation.generate_token()
        )
        
        from .admin_views import log_audit
        log_audit(request.user, 'invite_store', 'Store', store.id)

        return Response({
            'store_name': store.name,
            'token': invitation.token,
            'created_at': invitation.created_at
        }, status=status.HTTP_201_CREATED)

class AdminReportListView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        reports = StoreReport.objects.select_related('store', 'user').all()
        return Response(StoreReportSerializer(reports, many=True).data)

class AdminStoreStatusToggleView(APIView):
    permission_classes = [IsAdmin]

    def post(self, request, pk):
        store = Store.objects.filter(id=pk).first()
        if not store:
            return Response({'error': 'Mağaza tapılmadı.'}, status=404)
            
        action = request.data.get('action') # 'suspend' or 'activate'
        
        if action == 'suspend':
            reason = request.data.get('reason', '').strip()
            if not reason:
                return Response({'error': 'Dondurmaq üçün səbəb qeyd edilməlidir.'}, status=400)
            store.status = Store.STATUS_SUSPENDED
            store.suspension_reason = reason
            store.save()
            from .admin_views import log_audit
            log_audit(request.user, 'suspend_store', 'Store', store.id, {'reason': reason})
        elif action == 'activate':
            store.status = Store.STATUS_ACTIVE
            store.suspension_reason = ''
            store.save()
            from .admin_views import log_audit
            log_audit(request.user, 'activate_store', 'Store', store.id)
        else:
            return Response({'error': 'Yanlış əməliyyat.'}, status=400)
        return Response({'status': store.status, 'suspension_reason': store.suspension_reason})

class AdminDashboardView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        from apps.products.models import ProductVariant
        
        # Show ALL stores - admin should see everything with annotations to avoid N+1 queries
        all_stores = Store.objects.annotate(
            annotated_product_count=Count('products', distinct=True),
            annotated_store_value=Sum('products__variants__price')
        ).order_by('name')
        
        total_stores = all_stores.count()
        total_products = Product.objects.count()
        # Price is on ProductVariant, not Product
        total_value = ProductVariant.objects.aggregate(
            total=Sum('price')
        )['total'] or 0

        # Per-store breakdown
        stores_data = []
        for store in all_stores:
            stores_data.append({
                'id': store.id,
                'name': store.name,
                'slug': store.slug,
                'status': store.status,
                'owner': store.owner.username if store.owner else '-',
                'product_count': store.annotated_product_count,
                'total_value': float(store.annotated_store_value or 0),
                'created_at': store.created_at,
            })

        return Response({
            'total_stores': total_stores,
            'total_products': total_products,
            'total_value': float(total_value),
            'stores': stores_data,
        })

from apps.common.models import AuditLog
from apps.products.models import ProductReview, ProductReport

def log_audit(actor, action, target_type, target_id, metadata=None):
    AuditLog.objects.create(
        actor=actor,
        action=action,
        target_type=target_type,
        target_id=str(target_id),
        metadata=metadata or {}
    )

class AdminReviewActionView(APIView):
    permission_classes = [IsAdmin]

    def post(self, request, pk):
        review = ProductReview.objects.filter(id=pk).first()
        if not review:
            return Response({'error': 'Rəy tapılmadı.'}, status=404)
            
        action = request.data.get('action') # 'hide' or 'delete'
        
        if action == 'hide':
            review.status = ProductReview.STATUS_HIDDEN
            review.save()
            log_audit(request.user, 'hide_review', 'ProductReview', review.id)
            return Response({'message': 'Rəy gizlədildi.'})
        elif action == 'delete':
            review_id = review.id
            review.delete()
            log_audit(request.user, 'delete_review', 'ProductReview', review_id)
            return Response({'message': 'Rəy silindi.'})
        else:
            return Response({'error': 'Yanlış əməliyyat.'}, status=400)

class AdminProductReportActionView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        reports = ProductReport.objects.select_related('product', 'reporter').all()
        from api.serializers import ProductReportSerializer
        return Response(ProductReportSerializer(reports, many=True).data)

    def post(self, request, pk):
        report = ProductReport.objects.filter(id=pk).first()
        if not report:
            return Response({'error': 'Şikayət tapılmadı.'}, status=404)
            
        action = request.data.get('action') # 'review' or 'resolve'
        
        if action == 'review':
            report.status = ProductReport.STATUS_UNDER_REVIEW
            from django.utils import timezone
            report.reviewed_at = timezone.now()
            report.save()
            log_audit(request.user, 'review_report', 'ProductReport', report.id)
            return Response({'message': 'Şikayət baxışa götürüldü.'})
        elif action == 'resolve':
            report.status = ProductReport.STATUS_RESOLVED
            report.resolved_by = request.user
            report.save()
            log_audit(request.user, 'resolve_report', 'ProductReport', report.id)
            return Response({'message': 'Şikayət həll edildi.'})
        else:
            return Response({'error': 'Yanlış əməliyyat.'}, status=400)
