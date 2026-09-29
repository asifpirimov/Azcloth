import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { GoogleLogin } from '@react-oauth/google';
import { usePageTitle } from '../../hooks/usePageTitle';

export const Register = () => {
  usePageTitle('Qeydiyyat');
  const [step, setStep] = useState<'register' | 'otp'>('register');
  const [otp, setOtp] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/google/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: credentialResponse.credential })
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Google qeydiyyatı zamanı xəta baş verdi.');
      }

      login(data);
      if (data.user?.role === 'SELLER') {
        navigate('/seller/dashboard');
      } else if (data.user?.role === 'ADMIN') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/register/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password })
      });

      const data = await res.json();
      
      if (!res.ok) {
        let errorMessage = 'Qeydiyyat xətası.';
        if (data) {
          if (typeof data === 'string') {
            errorMessage = data;
          } else if (data.detail) {
            errorMessage = data.detail;
          } else if (data.error) {
            errorMessage = data.error;
          } else {
            // Collect all error messages from the dictionary
            const errors = [];
            for (const key in data) {
              if (Array.isArray(data[key])) {
                errors.push(`${key}: ${data[key].join(' ')}`);
              } else if (typeof data[key] === 'string') {
                errors.push(`${key}: ${data[key]}`);
              }
            }
            if (errors.length > 0) {
              errorMessage = errors.join(' | ');
            }
          }
        }
        throw new Error(errorMessage);
      }

      setStep('otp');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/verify-email/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp })
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'OTP xətası.');
      }

      login(data);
      if (data.user?.role === 'SELLER') {
        navigate('/seller/dashboard');
      } else if (data.user?.role === 'ADMIN') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (step === 'otp') {
    return (
      <div className="w-full max-w-md mx-auto mt-20 p-8 bg-white rounded-3xl border border-gray-100 shadow-sm">
        <div className="text-center mb-8">
          <h1 className="font-serif text-3xl font-bold text-gray-900 mb-2">E-poçt Təsdiqi</h1>
          <p className="text-gray-500">{email} ünvanına göndərilən 6 rəqəmli kodu daxil edin</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleOtpSubmit} className="flex flex-col gap-5">
          <div>
            <input 
              type="text" 
              value={otp}
              onChange={e => setOtp(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-orange-500 transition text-center tracking-widest font-bold text-xl"
              placeholder="000000"
              maxLength={6}
              required
            />
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
          <button 
            type="button" 
            onClick={async () => {
              try {
                const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/resend-otp/`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ email })
                });
                if (!res.ok) throw new Error('Yenidən göndərmə uğursuz oldu.');
                alert('Yeni kod göndərildi.');
              } catch (err: any) {
                alert(err.message);
              }
            }}
            className="text-sm font-bold text-gray-500 hover:text-gray-900 transition underline"
          >
            Kodu yenidən göndər
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto mt-20 p-8 bg-white rounded-3xl border border-gray-100 shadow-sm">
      <div className="text-center mb-8">
        <h1 className="font-serif text-3xl font-bold text-gray-900 mb-2">Qeydiyyat</h1>
        <p className="text-gray-500">Yeni alıcı hesabı yaradın</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium">
          {error}
        </div>
      )}

      <div className="flex justify-center mb-6">
        <GoogleLogin
          onSuccess={handleGoogleSuccess}
          onError={() => {
            setError('Google ilə qeydiyyat uğursuz oldu.');
          }}
          useOneTap
        />
      </div>

      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">və ya e-poçtla qeydiyyatdan keç</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div>
          <label className="block text-sm font-bold text-gray-900 mb-2">İstifadəçi adı</label>
          <input 
            type="text" 
            value={username}
            onChange={e => setUsername(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-orange-500 transition"
            placeholder="johndoe"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-900 mb-2">E-poçt</label>
          <input 
            type="email" 
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-orange-500 transition"
            placeholder="johndoe@email.com"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-900 mb-2">Şifrə</label>
          <input 
            type="password" 
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-orange-500 transition"
            placeholder="••••••••"
            required
          />
        </div>
        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-gray-900 text-white font-bold py-3.5 rounded-xl mt-2 hover:bg-gray-800 transition disabled:opacity-70"
        >
          {loading ? 'Yaradılır...' : 'Qeydiyyatdan Keç'}
        </button>
      </form>

      <div className="mt-8 text-center text-sm text-gray-500">
        Artıq hesabınız var? <Link to="/login" className="text-orange-500 font-bold hover:underline">Daxil Ol</Link>
      </div>
    </div>
  );
};
