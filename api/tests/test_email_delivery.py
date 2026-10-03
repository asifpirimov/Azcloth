"""
Tests for the email delivery refactor (fix/email-delivery branch).

Covers:
- OTP generation is cryptographically random (secrets)
- Email masking never leaks full address
- IP derivation from X-Forwarded-For
- Per-email 60-second cooldown
- Per-IP 20/10-min throttle
- RegisterView: 503 on send failure; no User/EmailVerification rows left
- RegisterView: 201 on success
- ResendOTPView: 429 when cooldown active (Retry-After header)
- ResendOTPView: 503 on send failure
- StoreRegisterView: rolls back store + invitation on send failure
"""

import re
from unittest.mock import patch, MagicMock
from django.test import TestCase, RequestFactory, override_settings
from django.core.cache import cache
from django.utils import timezone
import datetime

from apps.accounts.models import User, EmailVerification
from apps.stores.models import Store, StoreInvitation
from api.auth_views import (
    _make_otp,
    _mask_email,
    _get_client_ip,
    _rate_limit_check,
    _rate_limit_record,
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def make_request(ip='1.2.3.4', forwarded=None, data=None, method='POST'):
    factory = RequestFactory()
    req = factory.post('/fake/', data or {}, content_type='application/json')
    req.META['REMOTE_ADDR'] = ip
    if forwarded:
        req.META['HTTP_X_FORWARDED_FOR'] = forwarded
    return req


# ---------------------------------------------------------------------------
# Unit: OTP generation
# ---------------------------------------------------------------------------

class OtpGenerationTests(TestCase):
    def test_otp_is_6_digits(self):
        for _ in range(50):
            otp = _make_otp()
            self.assertRegex(otp, r'^\d{6}$', msg=f"OTP '{otp}' is not 6 digits")

    def test_otp_has_variation(self):
        """Ensure outputs are not all the same (rules out constant generator)."""
        otps = {_make_otp() for _ in range(20)}
        self.assertGreater(len(otps), 1)


# ---------------------------------------------------------------------------
# Unit: email masking
# ---------------------------------------------------------------------------

class MaskEmailTests(TestCase):
    def test_masks_local_part(self):
        self.assertEqual(_mask_email('alice@example.com'), 'a***@example.com')

    def test_masks_short_local(self):
        self.assertEqual(_mask_email('a@b.com'), 'a***@b.com')

    def test_no_at_sign(self):
        self.assertEqual(_mask_email('notanemail'), '***')

    def test_no_otp_in_masked(self):
        masked = _mask_email('seller@azcloth.store')
        self.assertNotIn('seller', masked)


# ---------------------------------------------------------------------------
# Unit: IP derivation from X-Forwarded-For
# ---------------------------------------------------------------------------

class ClientIpTests(TestCase):
    def test_uses_first_forwarded_ip(self):
        req = make_request(ip='10.0.0.1', forwarded='203.0.113.5, 10.0.0.1')
        self.assertEqual(_get_client_ip(req), '203.0.113.5')

    def test_falls_back_to_remote_addr(self):
        req = make_request(ip='192.168.1.1')
        self.assertEqual(_get_client_ip(req), '192.168.1.1')

    def test_strips_whitespace(self):
        req = make_request(ip='0.0.0.0', forwarded='  1.2.3.4  ,5.6.7.8')
        self.assertEqual(_get_client_ip(req), '1.2.3.4')


# ---------------------------------------------------------------------------
# Unit: rate limiting
# ---------------------------------------------------------------------------

class RateLimitTests(TestCase):
    def setUp(self):
        cache.clear()

    def tearDown(self):
        cache.clear()

    def test_not_blocked_initially(self):
        req = make_request()
        blocked, _ = _rate_limit_check('test@example.com', req)
        self.assertFalse(blocked)

    def test_blocked_after_record(self):
        req = make_request()
        _rate_limit_record('test@example.com', req)
        blocked, retry_after = _rate_limit_check('test@example.com', req)
        self.assertTrue(blocked)
        self.assertGreater(retry_after, 0)

    def test_email_normalized_for_key(self):
        """Upper-case and padded email should hit the same cooldown key."""
        req = make_request()
        _rate_limit_record('  TEST@EXAMPLE.COM  ', req)
        blocked, _ = _rate_limit_check('test@example.com', req)
        self.assertTrue(blocked)

    def test_ip_throttle_at_20(self):
        """After 20 sends from the same IP, new emails from that IP are blocked."""
        req = make_request(ip='5.5.5.5')
        for i in range(20):
            _rate_limit_record(f'user{i}@test.com', req)
        # 21st send from same IP with a fresh email should be blocked
        blocked, retry_after = _rate_limit_check('fresh@test.com', req)
        self.assertTrue(blocked)
        self.assertEqual(retry_after, 600)

    def test_different_ips_not_affected(self):
        """Throttle on IP A should not affect IP B."""
        req_a = make_request(ip='5.5.5.5')
        req_b = make_request(ip='6.6.6.6')
        for i in range(20):
            _rate_limit_record(f'user{i}@test.com', req_a)
        blocked, _ = _rate_limit_check('other@test.com', req_b)
        self.assertFalse(blocked)


# ---------------------------------------------------------------------------
# Integration: RegisterView
# ---------------------------------------------------------------------------

@override_settings(
    EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend',
)
class RegisterViewTests(TestCase):
    def setUp(self):
        cache.clear()

    def tearDown(self):
        cache.clear()

    @patch('api.auth_views._send_otp_email', side_effect=Exception('SMTP failed'))
    def test_register_503_on_send_failure(self, _mock_send):
        """503 returned; User row deleted; no EmailVerification created."""
        from rest_framework.test import APIClient
        client = APIClient()
        res = client.post('/api/auth/register/', {
            'username': 'testfail',
            'email': 'testfail@example.com',
            'password': 'SecurePass123!',
        }, format='json')

        self.assertEqual(res.status_code, 503)
        self.assertIn('error', res.json())
        self.assertFalse(User.objects.filter(username='testfail').exists(),
                         "User row must be deleted on send failure")
        self.assertEqual(EmailVerification.objects.filter(email='testfail@example.com').count(), 0,
                         "No EmailVerification should be created on failure")

    @patch('api.auth_views._send_otp_email')
    def test_register_201_on_success(self, mock_send):
        """201 returned; User and EmailVerification rows created."""
        from rest_framework.test import APIClient
        client = APIClient()
        res = client.post('/api/auth/register/', {
            'username': 'testsuccess',
            'email': 'testsuccess@example.com',
            'password': 'SecurePass123!',
        }, format='json')

        self.assertEqual(res.status_code, 201)
        self.assertTrue(mock_send.called)
        self.assertTrue(User.objects.filter(username='testsuccess').exists())
        self.assertEqual(EmailVerification.objects.filter(email='testsuccess@example.com').count(), 1)


# ---------------------------------------------------------------------------
# Integration: ResendOTPView
# ---------------------------------------------------------------------------

class ResendOTPViewTests(TestCase):
    def setUp(self):
        cache.clear()
        self.user = User.objects.create_user(
            username='resenduser',
            email='resend@example.com',
            password='Pass123!',
            is_email_verified=False,
        )
        # Create a valid EmailVerification so the user can be in OTP state
        EmailVerification.objects.create(
            user=self.user,
            email=self.user.email,
            otp_hash='x',
            expires_at=timezone.now() + datetime.timedelta(minutes=10)
        )

    def tearDown(self):
        cache.clear()

    def test_429_when_cooldown_active(self):
        """429 with Retry-After header when per-email cooldown is active."""
        from rest_framework.test import APIClient
        client = APIClient()
        # Trigger cooldown by recording a send
        req = make_request()
        _rate_limit_record(self.user.email, req)

        res = client.post('/api/auth/resend-otp/', {'email': self.user.email}, format='json')
        self.assertEqual(res.status_code, 429)
        self.assertIn('Retry-After', res)
        self.assertGreater(int(res['Retry-After']), 0)

    @patch('api.auth_views._send_otp_email', side_effect=Exception('provider error'))
    def test_503_on_send_failure(self, _mock_send):
        """503 returned; no new EmailVerification row created."""
        from rest_framework.test import APIClient
        client = APIClient()
        before_count = EmailVerification.objects.filter(email=self.user.email).count()

        res = client.post('/api/auth/resend-otp/', {'email': self.user.email}, format='json')
        self.assertEqual(res.status_code, 503)
        after_count = EmailVerification.objects.filter(email=self.user.email).count()
        self.assertEqual(before_count, after_count,
                         "No new EmailVerification should be created on send failure")


# ---------------------------------------------------------------------------
# Integration: StoreRegisterView — invitation rollback on failure
# ---------------------------------------------------------------------------

class StoreRegisterRollbackTests(TestCase):
    def setUp(self):
        cache.clear()
        import uuid
        self.store = Store.objects.create(
            name='Test Boutique',
            slug='test-boutique',
            status=Store.STATUS_INVITED,
        )
        self.invitation = StoreInvitation.objects.create(
            store=self.store,
            token=str(uuid.uuid4()),
            is_revoked=False,
        )

    def tearDown(self):
        cache.clear()

    @patch('api.auth_views._send_otp_email', side_effect=Exception('timeout'))
    def test_invitation_not_consumed_on_send_failure(self, _mock_send):
        """
        When OTP send fails:
        - Store stays STATUS_INVITED with no owner.
        - StoreInvitation remains is_revoked=False.
        - User row is deleted.
        - 503 returned.
        """
        from rest_framework.test import APIClient
        client = APIClient()
        res = client.post('/api/auth/store-register/', {
            'token': str(self.invitation.token),
            'username': 'storeowner',
            'email': 'owner@example.com',
            'password': 'Secure123!',
        }, format='json')

        self.assertEqual(res.status_code, 503, res.json())

        self.invitation.refresh_from_db()
        self.assertFalse(self.invitation.is_revoked, "Invitation must NOT be revoked on failure")

        self.store.refresh_from_db()
        self.assertEqual(self.store.status, Store.STATUS_INVITED,
                         "Store must revert to INVITED status")
        self.assertIsNone(self.store.owner, "Store must have no owner after rollback")

        self.assertFalse(User.objects.filter(username='storeowner').exists(),
                         "User row must be deleted after rollback")

