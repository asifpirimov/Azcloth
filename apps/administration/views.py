from django.shortcuts import render, redirect
from django.contrib.admin.views.decorators import staff_member_required
from django.utils.decorators import method_decorator
from django.views import View
from django.contrib import messages
from apps.stores.models import Store, StoreInvitation

@method_decorator(staff_member_required, name='dispatch')
class AdminDashboardView(View):
    def get(self, request):
        stores = Store.objects.all().order_by('-created_at')
        invitations = StoreInvitation.objects.all().order_by('-created_at')
        return render(request, 'administration/dashboard.html', {
            'stores': stores,
            'invitations': invitations
        })

@method_decorator(staff_member_required, name='dispatch')
class CreateInvitationView(View):
    def post(self, request):
        # Create a shell store
        store_name = request.POST.get('store_name')
        if not store_name:
            messages.error(request, "Mağaza adı qeyd edilməlidir.")
            return redirect('administration:dashboard')

        store = Store.objects.create(
            name=store_name,
            slug=store_name.lower().replace(' ', '-'),
            status=Store.STATUS_INVITED
        )
        
        token = StoreInvitation.generate_token()
        StoreInvitation.objects.create(store=store, token=token)
        
        messages.success(request, f"Dəvət yaradıldı. Dəvət linki: /seller/claim/{token}/")
        return redirect('administration:dashboard')
