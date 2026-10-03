import React, { useState, useEffect } from 'react';

interface OtpStepProps {
  email: string;
  error: string;
  setError: (e: string) => void;
  loading: boolean;
  otp: string;
  setOtp: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  apiBase: string;
}

/**
 * Shared OTP verification step.
 * - No alert() — all feedback is inline.
 * - 60-second resend cooldown driven by Retry-After response header.
 * - Spam folder hint always visible.
 */
export const OtpStep: React.FC<OtpStepProps> = ({
  email, error, setError, loading, otp, setOtp, onSubmit, apiBase
}) => {
  const [cooldown, setCooldown] = useState(0);         // seconds remaining
  const [resendMsg, setResendMsg] = useState('');      // inline success message
  const [resendLoading, setResendLoading] = useState(false);

  // Count down the cooldown timer every second.
  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => setCooldown(c => c - 1), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  const handleResend = async () => {
    setResendLoading(true);
    setResendMsg('');
    setError('');
    try {
      const res = await fetch(`${apiBase}/api/auth/resend-otp/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (res.status === 429) {
        const retryAfter = parseInt(res.headers.get('Retry-After') || '60', 10);
        setCooldown(retryAfter);
        setError(`Çox tez-tez cəhd edirsiniz. ${retryAfter} saniyə sonra yenidən cəhd edin.`);
        return;
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Yenidən göndərmə uğursuz oldu.');
        return;
      }

      setResendMsg('Yeni kod göndərildi.');
      setCooldown(60);
    } catch {
      setError('Şəbəkə xətası. Yenidən cəhd edin.');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto mt-20 p-8 bg-white rounded-3xl border border-gray-100 shadow-sm">
      <div className="text-center mb-8">
        <h1 className="font-serif text-3xl font-bold text-gray-900 mb-2">E-poçt Təsdiqi</h1>
        <p className="text-gray-500">{email} ünvanına göndərilən 6 rəqəmli kodu daxil edin</p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium">
          {error}
        </div>
      )}

      {resendMsg && !error && (
        <div className="mb-4 p-4 bg-green-50 text-green-700 rounded-xl text-sm font-medium">
          {resendMsg}
        </div>
      )}

      <form onSubmit={onSubmit} className="flex flex-col gap-5">
        <div>
          <input
            type="text"
            value={otp}
            onChange={e => setOtp(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-orange-500 transition text-center tracking-widest font-bold text-xl"
            placeholder="000000"
            maxLength={6}
            required
            autoComplete="one-time-code"
            inputMode="numeric"
          />
          <p className="mt-2 text-xs text-gray-400 text-center">
            Kodu görmürsünüzsə, spam/zibil qutusunu yoxlayın.
          </p>
        </div>
        <button
          type="submit"
          disabled={loading || otp.length < 6}
          className="w-full bg-orange-500 text-white font-bold py-3.5 rounded-xl hover:bg-orange-600 transition disabled:opacity-70"
        >
          {loading ? 'Yoxlanılır...' : 'Təsdiqlə'}
        </button>
      </form>

      <div className="mt-6 text-center">
        {cooldown > 0 ? (
          <span className="text-sm text-gray-400 font-medium">
            Kodu {cooldown} saniyə sonra yenidən göndər
          </span>
        ) : (
          <button
            type="button"
            onClick={handleResend}
            disabled={resendLoading}
            className="text-sm font-bold text-gray-500 hover:text-gray-900 transition underline disabled:opacity-50"
          >
            {resendLoading ? 'Göndərilir...' : 'Kodu yenidən göndər'}
          </button>
        )}
      </div>
    </div>
  );
};

