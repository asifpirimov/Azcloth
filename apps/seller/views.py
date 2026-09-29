from django.shortcuts import render, redirect, get_object_or_404
from django.urls import reverse
from django.contrib import messages
from django.views import View
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
from django.contrib.auth.hashers import make_password, check_password
from django.contrib.auth import login

from apps.stores.models import StoreInvitation, Store
from apps.seller.forms import StoreClaimForm, SellerRegistrationForm, ProductForm, ProductVariantForm
from django.contrib.auth.decorators import login_required
from django.utils.decorators import method_decorator
from django.forms import inlineformset_factory
from apps.products.models import Product, ProductVariant
from apps.accounts.models import EmailVerification, User
from apps.accounts.views import generate_otp

class ClaimStoreView(View):
    def get(self, request, token):
        invitation = get_object_or_404(StoreInvitation, token=token, is_revoked=False)
        if invitation.store.status != Store.STATUS_INVITED:
            messages.error(request, "Bu dəvət artıq istifadə edilib və ya etibarsızdır.")
            return redirect('marketplace:home')
            
        form = StoreClaimForm(instance=invitation.store)
        return render(request, 'seller/onboarding_step1.html', {'form': form, 'token': token})

    def post(self, request, token):
        invitation = get_object_or_404(StoreInvitation, token=token, is_revoked=False)
        if invitation.store.status != Store.STATUS_INVITED:
            return redirect('marketplace:home')

        form = StoreClaimForm(request.POST, request.FILES, instance=invitation.store)
        if form.is_valid():
            # Don't save to DB yet, or save it and proceed? We can save it.
            store = form.save(commit=False)
            store.save()
            request.session['claim_token'] = token
            return redirect('seller:claim_step2', token=token)
        return render(request, 'seller/onboarding_step1.html', {'form': form, 'token': token})


class SellerAccountView(View):
    def get(self, request, token):
        if request.session.get('claim_token') != token:
            return redirect('seller:claim', token=token)
        form = SellerRegistrationForm()
        return render(request, 'seller/onboarding_step2.html', {'form': form, 'token': token})

    def post(self, request, token):
        if request.session.get('claim_token') != token:
            return redirect('seller:claim', token=token)
            
        invitation = get_object_or_404(StoreInvitation, token=token, is_revoked=False)
        form = SellerRegistrationForm(request.POST)
        
        if form.is_valid():
            user = form.save(commit=False)
            user.username = form.cleaned_data['email']
            user.set_password(form.cleaned_data['password'])
            user.is_active = False
            user.role = User.ROLE_SELLER
            user.save()

            # Generate OTP
            otp = generate_otp()
            EmailVerification.objects.create(
                user=user,
                email=user.email,
                otp_hash=make_password(otp),
                expires_at=timezone.now() + timezone.timedelta(minutes=10)
            )

            # Send Email
            send_mail(
                'AzCloth Satıcı Təsdiq Kodu',
                f'Sizin təsdiq kodunuz: {otp}',
                settings.DEFAULT_FROM_EMAIL,
                [user.email],
                fail_silently=False,
            )

            request.session['seller_verification_email'] = user.email
            return redirect('seller:claim_step3', token=token)
            
        return render(request, 'seller/onboarding_step2.html', {'form': form, 'token': token})


class SellerOTPVerifyView(View):
    def get(self, request, token):
        if request.session.get('claim_token') != token:
            return redirect('seller:claim', token=token)
        form = OTPVerificationForm()
        return render(request, 'seller/onboarding_step3.html', {'form': form, 'token': token})

    def post(self, request, token):
        if request.session.get('claim_token') != token:
            return redirect('seller:claim', token=token)
            
        email = request.session.get('seller_verification_email')
        if not email:
            messages.error(request, "Sessiya müddəti bitib.")
            return redirect('seller:claim_step2', token=token)

        form = OTPVerificationForm(request.POST)
        if form.is_valid():
            verification = EmailVerification.objects.filter(email=email, is_verified=False).order_by('-created_at').first()
            
            if not verification or not verification.is_valid():
                messages.error(request, "Təsdiq kodu etibarsızdır.")
                return render(request, 'seller/onboarding_step3.html', {'form': form, 'token': token})

            otp = form.cleaned_data['otp']
            if check_password(otp, verification.otp_hash):
                # Success
                verification.is_verified = True
                verification.save()
                
                user = verification.user
                user.is_active = True
                user.save()
                
                # Claim the store
                invitation = get_object_or_404(StoreInvitation, token=token, is_revoked=False)
                store = invitation.store
                store.owner = user
                store.status = Store.STATUS_CLAIMED
                store.save()
                
                # Invalidate invitation
                invitation.is_revoked = True
                invitation.save()
                
                login(request, user)
                messages.success(request, "Mağaza uğurla qeydiyyatdan keçdi! İndi Admin tərəfindən aktivləşdirilməsini gözləyin.")
                
                # Cleanup session
                del request.session['claim_token']
                del request.session['seller_verification_email']
                
                return redirect('seller:dashboard')
            else:
                verification.attempts += 1
                verification.save()
                messages.error(request, "Səhv təsdiq kodu.")
        
        return render(request, 'seller/onboarding_step3.html', {'form': form, 'token': token})

@login_required
def dashboard(request):
    store = request.user.stores.first()
    if not store:
        return redirect('marketplace:home')
        
    products = store.products.all().order_by('-created_at')
    total_products = products.count()
    published_products = products.filter(status=Product.STATUS_PUBLISHED).count()
    hidden_products = products.filter(status=Product.STATUS_HIDDEN).count()
    
    return render(request, 'seller/dashboard.html', {
        'store': store,
        'products': products,
        'total_products': total_products,
        'published_products': published_products,
        'hidden_products': hidden_products
    })

VariantFormSet = inlineformset_factory(Product, ProductVariant, form=ProductVariantForm, extra=1, can_delete=True)


@method_decorator(login_required, name='dispatch')
class ProductCreateView(View):
    def get(self, request):
        form = ProductForm()
        variant_formset = VariantFormSet()
        variant_formset = VariantFormSet()
        return render(request, 'seller/product_form.html', {
            'form': form, 'variant_formset': variant_formset
        })

    def post(self, request):
        store = request.user.stores.first()
        form = ProductForm(request.POST, request.FILES)
        if form.is_valid():
            product = form.save(commit=False)
            product.store = store
            product.save()
            
            variant_formset = VariantFormSet(request.POST, instance=product)
            variant_formset = VariantFormSet(request.POST, instance=product)
            
            if variant_formset.is_valid():
                variant_formset.save()
                messages.success(request, "Məhsul uğurla yaradıldı.")
                return redirect('seller:dashboard')
        else:
            variant_formset = VariantFormSet(request.POST)
            
        return render(request, 'seller/product_form.html', {
            'form': form, 'variant_formset': variant_formset
        })

@method_decorator(login_required, name='dispatch')
class ProductEditView(View):
    def get(self, request, pk):
        store = request.user.stores.first()
        product = get_object_or_404(Product, pk=pk, store=store)
        form = ProductForm(instance=product)
        variant_formset = VariantFormSet(instance=product)
        variant_formset = VariantFormSet(instance=product)
        return render(request, 'seller/product_form.html', {
            'form': form, 'variant_formset': variant_formset, 'product': product
        })

    def post(self, request, pk):
        store = request.user.stores.first()
        product = get_object_or_404(Product, pk=pk, store=store)
        form = ProductForm(request.POST, request.FILES, instance=product)
        variant_formset = VariantFormSet(request.POST, instance=product)
        variant_formset = VariantFormSet(request.POST, instance=product)
        
        if form.is_valid() and variant_formset.is_valid():
            form.save()
            variant_formset.save()
            messages.success(request, "Məhsul uğurla yeniləndi.")
            return redirect('seller:dashboard')
            
        return render(request, 'seller/product_form.html', {
            'form': form, 'variant_formset': variant_formset, 'product': product
        })

