import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Logo } from '@/components/Logo';
import { CanvasBackground } from '@/components/CanvasBackground';
import { toast } from 'sonner';

type AuthMode = 'signin' | 'signup';
type AuthStep = 'phone' | 'otp';

export default function Auth() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<AuthMode>('signin');
  const [step, setStep] = useState<AuthStep>('phone');
  const [countryCode, setCountryCode] = useState('+1');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [name, setName] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isModeTransitioning, setIsModeTransitioning] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleModeToggle = () => {
    setIsModeTransitioning(true);
    setTimeout(() => {
      setMode(mode === 'signin' ? 'signup' : 'signin');
      setTimeout(() => setIsModeTransitioning(false), 150);
    }, 150);
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber.trim()) {
      toast.error('Please enter your phone number');
      return;
    }
    if (mode === 'signup' && !name.trim()) {
      toast.error('Please enter your name');
      return;
    }

    setIsLoading(true);
    // Simulate OTP sending
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsLoading(false);
    setStep('otp');
    toast.success('OTP sent successfully!');
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpValue = otp.join('');
    if (otpValue.length !== 6) {
      toast.error('Please enter the complete OTP');
      return;
    }

    setIsLoading(true);
    // Simulate OTP verification
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsLoading(false);
    
    // Store mock user data
    localStorage.setItem('user', JSON.stringify({
      name: name || 'User',
      phone: `${countryCode}${phoneNumber}`,
      plan: 'Free Plan',
      diskSpace: { used: 45.7, total: 10240 },
      files: { used: 15, total: 100 },
    }));
    
    toast.success('Welcome to Itsyou!');
    navigate('/photos');
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      {/* Animated geometric background */}
      <CanvasBackground />

      {/* Auth Card */}
      <div 
        className={`relative z-10 w-full max-w-[420px] transition-all duration-500 ease-out ${
          isMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
        } ${isMounted ? 'auth-card-entrance' : ''}`}
      >
        <div className="auth-card-premium p-8 sm:p-10">
          {/* Logo */}
          <div className="flex justify-center mb-8 transition-transform duration-300 hover:scale-105">
            <Logo size="lg" />
          </div>

          {/* Title Section */}
          <div className={`text-center mb-8 transition-opacity duration-200 ${isModeTransitioning ? 'opacity-0' : 'opacity-100'}`}>
            <h1 className="text-3xl sm:text-4xl font-semibold text-foreground mb-2 tracking-tight">
              {step === 'otp' ? 'Enter verification code' : mode === 'signin' ? 'Welcome back' : 'Create account'}
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              {step === 'otp' 
                ? `We sent a code to ${countryCode} ${phoneNumber}` 
                : mode === 'signin' 
                  ? 'Sign in to continue to your account' 
                  : 'Get started with your free account'}
            </p>
          </div>

          <div className={`transition-all duration-200 ${isModeTransitioning ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
            {step === 'phone' ? (
              <form onSubmit={handleSendOtp} className="space-y-5">
                {/* Phone Input */}
                <div className="space-y-2">
                  <label htmlFor="phone" className="text-sm font-medium text-foreground/80">
                    Phone number
                  </label>
                  <div className="flex gap-3">
                    <Input
                      id="country-code"
                      type="text"
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      className="w-24 text-center font-medium auth-input"
                      placeholder="+1"
                      aria-label="Country code"
                    />
                    <Input
                      id="phone"
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                      className="flex-1 auth-input"
                      placeholder="Enter your phone number"
                      aria-label="Phone number"
                      autoComplete="tel"
                    />
                  </div>
                </div>

                {/* Name Input (Signup only) */}
                {mode === 'signup' && (
                  <div className="space-y-2 animate-fade-in">
                    <label htmlFor="name" className="text-sm font-medium text-foreground/80">
                      Full name
                    </label>
                    <Input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="auth-input"
                      placeholder="Enter your full name"
                      aria-label="Full name"
                      autoComplete="name"
                    />
                  </div>
                )}

                {/* Submit Button */}
                <Button
                  type="submit"
                  variant="default"
                  size="lg"
                  className="w-full mt-6 auth-button"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                      <span>Sending code...</span>
                    </div>
                  ) : (
                    'Continue'
                  )}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-6">
                {/* OTP Input */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-foreground/80 block text-center">
                    Enter 6-digit code
                  </label>
                  <div className="flex justify-center gap-2 sm:gap-3">
                    {otp.map((digit, index) => (
                      <Input
                        key={index}
                        id={`otp-${index}`}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(index, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                        className="w-12 h-14 sm:w-14 sm:h-16 text-center text-xl sm:text-2xl font-semibold auth-input-otp"
                        aria-label={`Digit ${index + 1}`}
                        autoFocus={index === 0}
                      />
                    ))}
                  </div>
                  <p className="text-center text-xs sm:text-sm text-muted-foreground">
                    Didn't receive a code? <button 
                      type="button" 
                      className="text-primary hover:underline font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 rounded-sm" 
                      onClick={async () => {
                        setIsLoading(true);
                        await new Promise(resolve => setTimeout(resolve, 1500));
                        setIsLoading(false);
                        toast.success('Code resent successfully!');
                      }}
                    >Resend</button>
                  </p>
                </div>

                {/* Verify Button */}
                <Button
                  type="submit"
                  variant="default"
                  size="lg"
                  className="w-full auth-button"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                      <span>Verifying...</span>
                    </div>
                  ) : (
                    'Verify and continue'
                  )}
                </Button>

                {/* Back button */}
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    setStep('phone');
                    setOtp(['', '', '', '', '', '']);
                  }}
                >
                  ← Change phone number
                </Button>
              </form>
            )}
          </div>

          {/* Toggle Mode */}
          {step === 'phone' && (
            <div className={`mt-8 pt-6 border-t border-border/50 transition-opacity duration-200 ${isModeTransitioning ? 'opacity-0' : 'opacity-100'}`}>
              <p className="text-center text-sm text-muted-foreground">
                {mode === 'signin' 
                  ? "Don't have an account? " 
                  : "Already have an account? "}
                <button
                  type="button"
                  onClick={handleModeToggle}
                  className="text-primary font-medium hover:underline focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 rounded-sm transition-all duration-200"
                >
                  {mode === 'signin' ? 'Sign up' : 'Sign in'}
                </button>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
