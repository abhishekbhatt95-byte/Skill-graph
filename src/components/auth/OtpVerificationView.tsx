import React, { useState, useEffect } from 'react';
import { supabaseAuth } from '../../services/supabaseAuth';
import { Shield, ArrowLeft, ArrowRight, AlertCircle, Loader2, RefreshCw } from 'lucide-react';

interface OtpVerificationViewProps {
  phoneNumber: string;
  onBack: () => void;
}

export function OtpVerificationView({ phoneNumber, onBack }: OtpVerificationViewProps) {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(60);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length < 6) {
      setError('Please enter the complete 6-digit verification code.');
      return;
    }

    setError(null);
    setLoading(true);

    const { error: err } = await supabaseAuth.verifyPhoneOtp(phoneNumber, otp);
    setLoading(false);

    if (err) {
      setError(err);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setError(null);
    const { error: err } = await supabaseAuth.signInWithPhone(phoneNumber);
    setResending(false);
    if (err) {
      setError(err);
    } else {
      setCountdown(60);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-2xl shadow-xl p-8 space-y-8">
        
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Change Phone Number
        </button>

        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-indigo-600 text-white font-bold text-2xl shadow-lg shadow-indigo-500/30">
            <Shield className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Enter Verification Code</h2>
          <p className="text-sm text-slate-400">
            We've sent a 6-digit SMS code to <span className="text-white font-medium">{phoneNumber}</span>
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-xl text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleVerify} className="space-y-6">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-300 text-center block">6-Digit SMS OTP</label>
            <input
              type="text"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              placeholder="123456"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-center text-2xl font-mono tracking-widest text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading || otp.length < 6}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-3 px-4 rounded-xl transition-all shadow-lg shadow-indigo-600/30 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Verify & Continue <ArrowRight className="w-4 h-4" /></>}
          </button>
        </form>

        <div className="text-center text-xs text-slate-400 space-y-2">
          <p>Didn't receive the code?</p>
          {countdown > 0 ? (
            <p className="text-slate-500">Resend code in <span className="text-slate-300 font-medium">{countdown}s</span></p>
          ) : (
            <button
              onClick={handleResend}
              disabled={resending}
              className="inline-flex items-center gap-1.5 text-indigo-400 font-medium hover:text-indigo-300 transition-colors"
            >
              {resending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />} Resend OTP
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
