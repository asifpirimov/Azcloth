from rest_framework import generics
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from apps.accounts.models import User
from .auth_serializers import RegisterSerializer, UserSerializer, StoreRegisterSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from django.conf import settings

def set_auth_cookies(response, refresh):
    access_token = str(refresh.access_token)
    refresh_token = str(refresh)
    
    response.set_cookie(
        key=settings.SIMPLE_JWT.get('AUTH_COOKIE', 'access_token'),
        value=access_token,
        expires=settings.SIMPLE_JWT.get('ACCESS_TOKEN_LIFETIME'),
        secure=settings.SIMPLE_JWT.get('AUTH_COOKIE_SECURE', False),
        httponly=settings.SIMPLE_JWT.get('AUTH_COOKIE_HTTP_ONLY', True),
        samesite=settings.SIMPLE_JWT.get('AUTH_COOKIE_SAMESITE', 'Lax')
    )
    
    response.set_cookie(
        key=settings.SIMPLE_JWT.get('AUTH_COOKIE_REFRESH', 'refresh_token'),
        value=refresh_token,
        expires=settings.SIMPLE_JWT.get('REFRESH_TOKEN_LIFETIME'),
        secure=settings.SIMPLE_JWT.get('AUTH_COOKIE_SECURE', False),
        httponly=settings.SIMPLE_JWT.get('AUTH_COOKIE_HTTP_ONLY', True),
        samesite=settings.SIMPLE_JWT.get('AUTH_COOKIE_SAMESITE', 'Lax')
    )
    return response

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        if not self.user.is_email_verified:
            from rest_framework.exceptions import AuthenticationFailed
            raise AuthenticationFailed('Email hesabınızı təsdiqləyin.')
        data['user'] = UserSerializer(self.user).data
        return data

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        if response.status_code == 200:
            refresh_token = response.data.get('refresh')
            if refresh_token:
                from rest_framework_simplejwt.tokens import RefreshToken
                refresh = RefreshToken(refresh_token)
                set_auth_cookies(response, refresh)
                # Keep token in response body for now as fallback, or remove it later
        return response

class LogoutView(APIView):
    permission_classes = (AllowAny,)
    
    def post(self, request):
        response = Response({'message': 'Çıxış edildi.'})
        response.delete_cookie(settings.SIMPLE_JWT.get('AUTH_COOKIE', 'access_token'))
        response.delete_cookie(settings.SIMPLE_JWT.get('AUTH_COOKIE_REFRESH', 'refresh_token'))
        return response

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (AllowAny,)
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        response = super().create(request, *args, **kwargs)
        user = User.objects.get(username=response.data['username'])
        
        # Generate OTP
        import random
        from django.utils import timezone
        import datetime
        from django.contrib.auth.hashers import make_password
        from apps.accounts.models import EmailVerification
        from django.core.mail import send_mail
        from django.conf import settings
        
        otp = str(random.randint(100000, 999999))
        
        # Send Email
        subject = 'AzCloth - E-poçt Təsdiqləmə Kodu'
        message = f'Salam {user.username},\n\nSizin e-poçt təsdiqləmə kodunuz: {otp}\n\nBu kod 10 dəqiqə ərzində etibarlıdır.'
        
        try:
            send_mail(
                subject,
                message,
                settings.DEFAULT_FROM_EMAIL,
                [user.email],
                fail_silently=False,
            )
        except Exception as e:
            print(f"E-poçt göndərilərkən xəta: {e}")
            print(f"--- SIMULATED EMAIL (Fallback) --- \nTo: {user.email}\nOTP: {otp}\n-----------------------")
        
        EmailVerification.objects.create(
            user=user,
            email=user.email,
            otp_hash=make_password(otp),
            expires_at=timezone.now() + datetime.timedelta(minutes=10)
        )
        
        return Response({
            'message': 'Qeydiyyat uğurla tamamlandı. Zəhmət olmasa emailinizə göndərilən kodu daxil edərək hesabınızı təsdiqləyin.',
            'email': user.email
        }, status=201)

from django.contrib.auth.hashers import check_password, make_password

class VerifyEmailView(APIView):
    permission_classes = (AllowAny,)

    def post(self, request):
        email = request.data.get('email')
        otp = request.data.get('otp')
        
        if not email or not otp:
            return Response({'error': 'Email və OTP tələb olunur.'}, status=400)
            
        from apps.accounts.models import EmailVerification
        verification = EmailVerification.objects.filter(email=email).order_by('-created_at').first()
        
        if not verification or not verification.is_valid():
            return Response({'error': 'OTP kodu etibarsızdır və ya vaxtı bitib.'}, status=400)
            
        if not check_password(otp, verification.otp_hash):
            verification.attempts += 1
            verification.save()
            return Response({'error': 'OTP kodu səhvdir.'}, status=400)
            
        verification.is_verified = True
        verification.save()
        
        user = verification.user
        if user:
            user.is_email_verified = True
            user.save()
            
            refresh = RefreshToken.for_user(user)
            response = Response({
                'message': 'Email təsdiqləndi.',
                'user': UserSerializer(user).data,
                'access': str(refresh.access_token),
                'refresh': str(refresh),
            })
            return set_auth_cookies(response, refresh)
        return Response({'message': 'Email təsdiqləndi, lakin istifadəçi tapılmadı.'})

class ResendOTPView(APIView):
    permission_classes = (AllowAny,)
    
    def post(self, request):
        email = request.data.get('email')
        if not email:
            return Response({'error': 'Email tələb olunur.'}, status=400)
            
        user = User.objects.filter(email=email).first()
        if not user:
            return Response({'error': 'İstifadəçi tapılmadı.'}, status=404)
            
        if user.is_email_verified:
            return Response({'error': 'Bu email artıq təsdiqlənib.'}, status=400)
            
        import random
        from django.utils import timezone
        import datetime
        from apps.accounts.models import EmailVerification
        from django.core.mail import send_mail
        from django.conf import settings
        
        otp = str(random.randint(100000, 999999))
        
        subject = 'AzCloth - Yeni E-poçt Təsdiqləmə Kodu'
        message = f'Salam {user.username},\n\nSizin yeni e-poçt təsdiqləmə kodunuz: {otp}\n\nBu kod 10 dəqiqə ərzində etibarlıdır.'
        
        try:
            send_mail(
                subject,
                message,
                settings.DEFAULT_FROM_EMAIL,
                [user.email],
                fail_silently=False,
            )
        except Exception as e:
            print(f"E-poçt göndərilərkən xəta: {e}")
            print(f"--- SIMULATED EMAIL (Fallback) --- \nTo: {user.email}\nOTP: {otp}\n-----------------------")
        
        EmailVerification.objects.create(
            user=user,
            email=user.email,
            otp_hash=make_password(otp),
            expires_at=timezone.now() + datetime.timedelta(minutes=10)
        )
        
        return Response({'message': 'Yeni OTP kodu emailinizə göndərildi.'})

from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from rest_framework.views import APIView

class GoogleLoginView(APIView):
    permission_classes = (AllowAny,)

    def post(self, request, *args, **kwargs):
        token = request.data.get('token')
        if not token:
            return Response({'error': 'Token is required'}, status=400)

        try:
            # Verify the token against our specific Client ID
            CLIENT_ID = settings.GOOGLE_CLIENT_ID
            idinfo = id_token.verify_oauth2_token(token, google_requests.Request(), audience=CLIENT_ID)
            email = idinfo['email']
            
            # Check if user exists
            user = User.objects.filter(email=email).first()
            if not user:
                # Create user if it doesn't exist
                base_username = email.split('@')[0]
                username = base_username
                counter = 1
                while User.objects.filter(username=username).exists():
                    username = f"{base_username}{counter}"
                    counter += 1
                
                user = User.objects.create_user(
                    username=username,
                    email=email,
                    role=User.ROLE_BUYER,
                    is_email_verified=True
                )
                
            refresh = RefreshToken.for_user(user)
            response = Response({
                'user': UserSerializer(user).data,
                'access': str(refresh.access_token),
                'refresh': str(refresh),
            })
            return set_auth_cookies(response, refresh)
            
        except ValueError as e:
            return Response({'error': 'Invalid token'}, status=400)
from apps.stores.models import Store, StoreInvitation

class StoreRegisterView(generics.CreateAPIView):
    permission_classes = (AllowAny,)
    serializer_class = StoreRegisterSerializer

    def create(self, request, *args, **kwargs):
        token = request.data.get('token')
        if not token:
            return Response({'error': 'Token qeyd edilməyib.'}, status=400)

        # Validate token
        invitation = StoreInvitation.objects.filter(token=token, is_revoked=False, store__status=Store.STATUS_INVITED).first()
        if not invitation:
            return Response({'error': 'Dəvət linki etibarsızdır və ya artıq istifadə olunub.'}, status=400)

        # Validate and create user
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        # Claim the store
        store = invitation.store
        store.owner = user
        store.status = Store.STATUS_ACTIVE
        # Save optional fields
        whatsapp = request.data.get('whatsapp_number', '').strip()
        instagram = request.data.get('instagram_url', '').strip()
        theme = request.data.get('theme', '').strip()
        
        if whatsapp:
            store.whatsapp_number = whatsapp
        if instagram:
            store.instagram_url = instagram
        if theme in dict(Store.THEME_CHOICES).keys():
            store.theme = theme
            
        store.save()

        # Revoke the invitation
        invitation.is_revoked = True
        invitation.save()

        # Generate OTP
        import random
        from django.utils import timezone
        import datetime
        from django.contrib.auth.hashers import make_password
        from apps.accounts.models import EmailVerification
        from django.core.mail import send_mail
        from django.conf import settings
        
        otp = str(random.randint(100000, 999999))
        
        # Send Email
        subject = 'AzCloth - Mağaza E-poçt Təsdiqləmə Kodu'
        message = f'Salam {user.username},\n\nSizin mağaza hesabınız üçün e-poçt təsdiqləmə kodunuz: {otp}\n\nBu kod 10 dəqiqə ərzində etibarlıdır.'
        
        try:
            send_mail(
                subject,
                message,
                settings.DEFAULT_FROM_EMAIL,
                [user.email],
                fail_silently=False,
            )
        except Exception as e:
            print(f"E-poçt göndərilərkən xəta: {e}")
            print(f"--- SIMULATED EMAIL (Fallback) --- \nTo: {user.email}\nOTP: {otp}\n-----------------------")
        
        EmailVerification.objects.create(
            user=user,
            email=user.email,
            otp_hash=make_password(otp),
            expires_at=timezone.now() + datetime.timedelta(minutes=10)
        )
        
        return Response({
            'message': 'Qeydiyyat uğurla tamamlandı. Zəhmət olmasa emailinizə göndərilən kodu daxil edərək hesabınızı təsdiqləyin.',
            'email': user.email
        }, status=201)

class StoreTokenVerifyView(APIView):
    permission_classes = (AllowAny,)

    def get(self, request):
        token = request.query_params.get('token')
        if not token:
            return Response({'error': 'Token yoxdur.'}, status=400)
            
        invitation = StoreInvitation.objects.filter(token=token, is_revoked=False, store__status=Store.STATUS_INVITED).select_related('store').first()
        if not invitation:
            return Response({'valid': False, 'error': 'Token etibarsızdır və ya istifadə olunub.'})
            
        return Response({
            'valid': True,
            'store_name': invitation.store.name
        })

from rest_framework.permissions import IsAuthenticated

class ProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)

    def patch(self, request):
        user = request.user
        data = request.data

        # Update basic fields
        if 'first_name' in data:
            user.first_name = data['first_name']
        if 'last_name' in data:
            user.last_name = data['last_name']
        if 'email' in data:
            user.email = data['email']

        # Update password if provided
        new_password = data.get('new_password', '').strip()
        if new_password:
            old_password = data.get('old_password', '')
            if not user.check_password(old_password):
                return Response({'error': 'Köhnə şifrə yanlışdır.'}, status=400)
            user.set_password(new_password)

        user.save()
        return Response(UserSerializer(user).data)
