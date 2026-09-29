from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth import login, get_user_model
from django.contrib.auth.views import LoginView
from django.views.generic import CreateView, FormView
from django.urls import reverse_lazy, reverse
from django.utils import timezone
from django.core.mail import send_mail
from django.contrib import messages
from django.conf import settings
import random
import string
from django.contrib.auth.hashers import make_password, check_password

from apps.accounts.forms import BuyerRegistrationForm, OTPVerificationForm
from apps.accounts.models import EmailVerification

User = get_user_model()

def generate_otp():
    return ''.join(random.choices(string.digits, k=6))

class BuyerRegisterView(CreateView):
    template_name = 'accounts/buyer_register.html'
    form_class = BuyerRegistrationForm
    success_url = reverse_lazy('accounts:verify_otp')

    def form_valid(self, form):
        # Create inactive user
        user = form.save(commit=False)
        user.username = form.cleaned_data['email'] # Use email as username
        user.set_password(form.cleaned_data['password'])
        user.is_active = False # Require email verification
        user.role = User.ROLE_BUYER
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
            'AzCloth Təsdiq Kodu',
            f'Sizin təsdiq kodunuz: {otp}',
            settings.DEFAULT_FROM_EMAIL,
            [user.email],
            fail_silently=False,
        )

        self.request.session['verification_email'] = user.email
        return redirect(self.success_url)


class OTPVerifyView(FormView):
    template_name = 'accounts/verify_otp.html'
    form_class = OTPVerificationForm
    success_url = reverse_lazy('marketplace:home')

    def form_valid(self, form):
        email = self.request.session.get('verification_email')
        if not email:
            messages.error(self.request, "Sessiya müddəti bitib. Yenidən cəhd edin.")
            return redirect('accounts:register')

        verification = EmailVerification.objects.filter(email=email, is_verified=False).order_by('-created_at').first()
        
        if not verification or not verification.is_valid():
            messages.error(self.request, "Təsdiq kodu etibarsızdır və ya müddəti bitib.")
            return redirect('accounts:register')

        otp = form.cleaned_data['otp']
        if check_password(otp, verification.otp_hash):
            verification.is_verified = True
            verification.save()

            if verification.user:
                verification.user.is_active = True
                verification.user.save()
                login(self.request, verification.user)
                
            messages.success(self.request, "E-poçt uğurla təsdiqləndi.")
            # Clear session
            if 'verification_email' in self.request.session:
                del self.request.session['verification_email']
            return super().form_valid(form)
        else:
            verification.attempts += 1
            verification.save()
            messages.error(self.request, "Səhv təsdiq kodu.")
            return self.form_invalid(form)


class CustomLoginView(LoginView):
    template_name = 'accounts/login.html'
    
    def get_success_url(self):
        user = self.request.user
        if user.is_seller():
            return reverse_lazy('seller:dashboard')
        elif user.is_admin_role():
            return reverse_lazy('administration:dashboard')
        return reverse_lazy('marketplace:home')
