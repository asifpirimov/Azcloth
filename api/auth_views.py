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

import secrets
import hashlib
import logging
from html import escape as html_escape

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _mask_email(email: str) -> str:
    """Return a***@domain. Never log a full address."""
    if '@' not in email:
        return '***'
    local, domain = email.rsplit('@', 1)
    return f"{local[:1]}***@{domain}"


def _make_otp() -> str:
    """6-digit OTP using secrets module (cryptographically random)."""
    return f"{secrets.randbelow(1_000_000):06d}"


def _get_client_ip(request) -> str:
    """
    Derive the real client IP behind Render's reverse proxy.

    Render sets X-Forwarded-For: <client>, <proxy1>, ...
    We take the first (leftmost) address, which is the originating client IP.
    This value is used only for soft rate-limiting, not authentication.
    A shared or proxy IP will not lock out all users because:
    - The per-email 60-second cooldown is the primary control.
    - The per-IP limit (20 per 10 min) is intentionally generous.
    """
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR', '')
    if x_forwarded_for:
        return x_forwarded_for.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR', '0.0.0.0')


def _rate_limit_check(email: str, request) -> tuple:
    """
    Returns (blocked: bool, retry_after_seconds: int).

    Per-email: 60-second cooldown after any successful send (primary control).
    Per-IP: max 20 sends per 10-minute window (secondary, generous limit).
    Email keys are normalized (strip + lowercase) before hashing.
    No PII is stored in cache keys.

    Uses Django's default in-process LocMemCache. On multi-worker deployments
    each worker has its own cache; this is acceptable at current traffic levels.
    """
    from django.core.cache import cache

    email_norm = email.strip().lower()
    email_key = 'otp_cd_' + hashlib.sha256(email_norm.encode()).hexdigest()[:20]
    ip = _get_client_ip(request)
    ip_key = 'otp_ip_' + hashlib.sha256(ip.encode()).hexdigest()[:20]

    if cache.get(email_key):
        return True, 60  # conservative static value; actual TTL may be shorter

    ip_count = cache.get(ip_key, 0)
    if ip_count >= 20:
        return True, 600

    return False, 0


def _rate_limit_record(email: str, request) -> None:
    """Record a successful send against both rate-limit keys."""
    from django.core.cache import cache
    email_norm = email.strip().lower()
    email_key = 'otp_cd_' + hashlib.sha256(email_norm.encode()).hexdigest()[:20]
    ip = _get_client_ip(request)
    ip_key = 'otp_ip_' + hashlib.sha256(ip.encode()).hexdigest()[:20]

    cache.set(email_key, 1, timeout=60)
    ip_count = cache.get(ip_key, 0)
    cache.set(ip_key, ip_count + 1, timeout=600)


def _send_otp_email(user_username: str, user_email: str, otp: str, subject: str) -> None:
    """
    Send OTP email via Anymail/Resend (HTTPS, port 443).
    Raises AnymailError or requests.Timeout on failure.
    All interpolated values are HTML-escaped.
    """
    from django.core.mail import EmailMultiAlternatives

    safe_username = html_escape(user_username)
    safe_otp = html_escape(otp)

    text_body = (
        f"Salam {user_username},\n\n"
        f"Sizin e-poçt təsdiqləmə kodunuz: {otp}\n\n"
        "Bu kod 10 dəqiqə ərzində etibarlıdır.\n\n"
        "Əgər bu sorğunu siz göndərməmişsinizsə, bu e-poçtu nəzərə almayın.\n\n"
        "AzCloth\nhttps://www.azcloth.store"
    )

    html_body = (
        '<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;">'
        f'<h1 style="font-size:18px;color:#111;">Salam {safe_username},</h1>'
        '<p style="color:#444;">Sizin e-poçt t&#601;sdiqləmə kodunuz:</p>'
        f'<div style="font-size:36px;font-weight:bold;letter-spacing:8px;color:#f97316;'
        f'background:#fff7ed;border-radius:8px;padding:16px;text-align:center;'
        f'margin:16px 0;">{safe_otp}</div>'
        '<p style="color:#555;">Bu kod <strong>10 d&#601;qiq&#601;</strong> &#601;rzind&#601; etibarlıdır.</p>'
        '<p style="color:#999;font-size:12px;">'
        'Bu sorğunu siz g&#246;nd&#601;rm&#601;mişsinizsə, bu e-poçtu n&#601;z&#601;r&#601; almayın.'
        '</p>'
        '<hr style="border:none;border-top:1px solid #eee;margin:24px 0;">'
        '<p style="color:#999;font-size:12px;">'
        'AzCloth &mdash; <a href="https://www.azcloth.store">azcloth.store</a>'
        '</p>'
        '</div>'
    )

    msg = EmailMultiAlternatives(
        subject=subject,
        body=text_body,
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=[user_email],
    )
    msg.attach_alternative(html_body, 'text/html')
    msg.send()  # raises on failure — caller handles


# ---------------------------------------------------------------------------
# Cookie helpers
# ---------------------------------------------------------------------------

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

# ---------------------------------------------------------------------------
# Auth views
# ---------------------------------------------------------------------------


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
        # Rate-limit check before creating anything.
        email = request.data.get('email', '')
        blocked, retry_after = _rate_limit_check(email, request)
        if blocked:
            resp = Response(
                {'error': f'Çox tez-tez cəhd edirsiniz. {retry_after} saniyə sonra yenidən cəhd edin.'},
                status=429,
            )
            resp['Retry-After'] = str(retry_after)
            return resp

        response = super().create(request, *args, **kwargs)
        user = User.objects.get(username=response.data['username'])

        otp = _make_otp()

        # Attempt send BEFORE writing EmailVerification.
        # On failure: delete the user so they can re-register cleanly; invitation is untouched.
        try:
            _send_otp_email(
                user_username=user.username,
                user_email=user.email,
                otp=otp,
                subject='AzCloth - E-poçt Təsdiqləmə Kodu',
            )
        except Exception as exc:
            logger.error('OTP email send failed for %s: %s', _mask_email(user.email), exc)
            user.delete()
            return Response(
                {'error': 'E-poçt göndərilmədi. Zəhmət olmasa bir az sonra yenidən cəhd edin.'},
                status=503,
            )

        # Send succeeded — persist verification record and record rate limit.
        from django.utils import timezone
        import datetime
        from django.contrib.auth.hashers import make_password
        from apps.accounts.models import EmailVerification

        EmailVerification.objects.create(
            user=user,
            email=user.email,
            otp_hash=make_password(otp),
            expires_at=timezone.now() + datetime.timedelta(minutes=10)
        )
        _rate_limit_record(user.email, request)

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

        # Rate-limit check
        blocked, retry_after = _rate_limit_check(email, request)
        if blocked:
            resp = Response(
                {'error': f'Çox tez-tez cəhd edirsiniz. {retry_after} saniyə sonra yenidən cəhd edin.'},
                status=429,
            )
            resp['Retry-After'] = str(retry_after)
            return resp

        user = User.objects.filter(email=email).first()
        if not user:
            return Response({'error': 'İstifadəçi tapılmadı.'}, status=404)

        if user.is_email_verified:
            return Response({'error': 'Bu email artıq təsdiqlənib.'}, status=400)

        otp = _make_otp()

        # Attempt send BEFORE writing the new EmailVerification row.
        try:
            _send_otp_email(
                user_username=user.username,
                user_email=user.email,
                otp=otp,
                subject='AzCloth - Yeni E-poçt Təsdiqləmə Kodu',
            )
        except Exception as exc:
            logger.error('Resend OTP email failed for %s: %s', _mask_email(user.email), exc)
            return Response(
                {'error': 'E-poçt göndərilmədi. Zəhmət olmasa bir az sonra yenidən cəhd edin.'},
                status=503,
            )

        # Send succeeded — persist and record rate limit.
        from django.utils import timezone
        import datetime
        from apps.accounts.models import EmailVerification

        EmailVerification.objects.create(
            user=user,
            email=user.email,
            otp_hash=make_password(otp),
            expires_at=timezone.now() + datetime.timedelta(minutes=10)
        )
        _rate_limit_record(user.email, request)

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
            CLIENT_ID = settings.GOOGLE_CLIENT_ID
            idinfo = id_token.verify_oauth2_token(token, google_requests.Request(), audience=CLIENT_ID)
            email = idinfo['email']

            user = User.objects.filter(email=email).first()
            if not user:
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

        except ValueError:
            return Response({'error': 'Invalid token'}, status=400)


from apps.stores.models import Store, StoreInvitation


class StoreRegisterView(generics.CreateAPIView):
    permission_classes = (AllowAny,)
    serializer_class = StoreRegisterSerializer

    def create(self, request, *args, **kwargs):
        token = request.data.get('token')
        if not token:
            return Response({'error': 'Token qeyd edilməyib.'}, status=400)

        # Validate invitation — do NOT revoke yet.
        invitation = StoreInvitation.objects.filter(
            token=token, is_revoked=False, store__status=Store.STATUS_INVITED
        ).first()
        if not invitation:
            return Response({'error': 'Dəvət linki etibarsızdır və ya artıq istifadə olunub.'}, status=400)

        # Rate-limit check
        email = request.data.get('email', '')
        blocked, retry_after = _rate_limit_check(email, request)
        if blocked:
            resp = Response(
                {'error': f'Çox tez-tez cəhd edirsiniz. {retry_after} saniyə sonra yenidən cəhd edin.'},
                status=429,
            )
            resp['Retry-After'] = str(retry_after)
            return resp

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        # Claim the store (status + optional fields) but do NOT revoke invitation yet.
        store = invitation.store
        store.owner = user
        store.status = Store.STATUS_ACTIVE
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

        otp = _make_otp()

        # Attempt send BEFORE committing invitation revocation or OTP record.
        # On failure: restore store state so invitation can be reused; delete user.
        try:
            _send_otp_email(
                user_username=user.username,
                user_email=user.email,
                otp=otp,
                subject='AzCloth - Mağaza E-poçt Təsdiqləmə Kodu',
            )
        except Exception as exc:
            logger.error('Store OTP email send failed for %s: %s', _mask_email(user.email), exc)
            store.owner = None
            store.status = Store.STATUS_INVITED
            store.save()
            user.delete()
            return Response(
                {'error': 'E-poçt göndərilmədi. Zəhmət olmasa bir az sonra yenidən cəhd edin.'},
                status=503,
            )

        # Send succeeded — now commit invitation revocation and OTP record.
        invitation.is_revoked = True
        invitation.save()

        from django.utils import timezone
        import datetime
        from apps.accounts.models import EmailVerification

        EmailVerification.objects.create(
            user=user,
            email=user.email,
            otp_hash=make_password(otp),
            expires_at=timezone.now() + datetime.timedelta(minutes=10)
        )
        _rate_limit_record(user.email, request)

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
