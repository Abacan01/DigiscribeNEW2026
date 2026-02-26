import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const REMEMBER_PREF_KEY = 'digiscribe-remember-login';

function getDefaultRoute(role) {
  return role === 'admin' ? '/admin/dashboard' : '/dashboard';
}

function resolvePostLoginRoute(role, fromPath) {
  const defaultRoute = getDefaultRoute(role);
  if (!fromPath) return defaultRoute;

  const isAdminRoute = fromPath.startsWith('/admin');

  if (role === 'admin') {
    if (fromPath === '/dashboard') return defaultRoute;
    return fromPath;
  }

  if (isAdminRoute) return defaultRoute;

  return fromPath;
}

export default function LoginPage() {
  const [isEntering, setIsEntering] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [isPasswordIconAnimating, setIsPasswordIconAnimating] = useState(false);
  const [isSubmitAnimating, setIsSubmitAnimating] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem(REMEMBER_PREF_KEY) === 'true';
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login, user, role } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const passwordAnimTimeoutRef = useRef(null);

  useEffect(() => {
    document.title = 'Login - DigiScribe Transcription Corp.';

    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (motionQuery.matches) {
      setIsEntering(true);
      return;
    }

    const frameId = window.requestAnimationFrame(() => {
      setIsEntering(true);
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (passwordAnimTimeoutRef.current) {
        window.clearTimeout(passwordAnimTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (user) {
      const from = location.state?.from?.pathname;
      const target = resolvePostLoginRoute(role, from);
      navigate(target, { replace: true });
    }
  }, [user, role, navigate, location.state]);

  useEffect(() => {
    window.localStorage.setItem(REMEMBER_PREF_KEY, String(rememberMe));
  }, [rememberMe]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitAnimating(true);
    setSubmitting(true);

    try {
      await login(email, password, { remember: rememberMe });
    } catch (err) {
      const code = err.code;
      if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        setError('Invalid email or password.');
      } else if (code === 'auth/too-many-requests') {
        setError('Too many failed attempts. Please try again later.');
      } else {
        setError('Login failed. Please try again.');
      }
    } finally {
      setIsSubmitAnimating(false);
      setSubmitting(false);
    }
  };

  const handleTogglePassword = () => {
    if (submitting) return;

    setShowPassword((prev) => !prev);
    setIsPasswordIconAnimating(true);

    if (passwordAnimTimeoutRef.current) {
      window.clearTimeout(passwordAnimTimeoutRef.current);
    }

    passwordAnimTimeoutRef.current = window.setTimeout(() => {
      setIsPasswordIconAnimating(false);
    }, 180);
  };

  const handleBackToHome = (e) => {
    e.preventDefault();
    if (isLeaving) return;

    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (motionQuery.matches) {
      navigate('/');
      return;
    }

    setIsLeaving(true);
    window.setTimeout(() => {
      navigate('/');
    }, 220);
  };

  return (
    <div
      className={`relative h-dvh overflow-hidden bg-gradient-to-br from-sky-50 via-white to-indigo-50 p-2 sm:p-3 lg:p-4 transition-all duration-500 ease-out ${
        isEntering && !isLeaving ? 'opacity-100 scale-100' : 'opacity-0 scale-[0.985]'
      }`}
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 -left-20 h-80 w-80 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -bottom-20 -right-24 h-[26rem] w-[26rem] rounded-full bg-sky-200/30 blur-3xl" />
        <div className="absolute inset-0 backdrop-blur-[5px]" />
      </div>

      <div
        className={`relative w-full h-full max-w-6xl mx-auto rounded-2xl lg:rounded-[2rem] overflow-hidden border border-sky-100/80 bg-white/80 shadow-2xl shadow-sky-100/60 backdrop-blur-xl grid lg:grid-cols-[1.1fr_0.9fr] transition-all duration-500 ease-out ${
          isEntering && !isLeaving ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0'
        }`}
      >
        <section className="relative hidden lg:block h-full">
          <img
            src="/images/manilacityhall.png"
            alt="DigiScribe"
            className="absolute inset-0 h-full w-full object-cover opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-slate-900/20 to-slate-900/10" />
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/30 via-sky-600/20 to-blue-700/25" />
          <div className="absolute top-5 left-5 z-10">
            <Link
              to="/"
              onClick={handleBackToHome}
              className="inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm border border-white/40 hover:bg-white/30 transition-colors"
            >
              <i className="fas fa-arrow-left text-xs"></i>
              Back to Home
            </Link>
          </div>
        </section>

        <section className="p-4 sm:p-6 lg:p-10 flex items-center justify-center h-full">
          <div className="w-full max-w-md mx-auto">
            <div className="text-center mb-6 sm:mb-7">
              <img
                src="/images/favicon.png"
                alt="DigiScribe Transcription Corp."
                className="h-12 sm:h-14 w-auto mx-auto"
              />
              <h1 className="mt-4 sm:mt-5 text-2xl sm:text-3xl font-semibold gradient-text">Digiscribe Login</h1>
              <p className="mt-2 text-sm text-gray-text">Sign in to continue to Digiscribe services.</p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 rounded-xl border border-red-100">
                <div className="flex items-center gap-3">
                  <i className="fas fa-exclamation-circle text-red-500"></i>
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              className={`space-y-4 sm:space-y-5 transition-all duration-200 ease-out ${
                isSubmitAnimating ? 'scale-[0.995] opacity-95' : 'scale-100 opacity-100'
              }`}
            >
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-dark-text mb-1.5">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/70 text-sm focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition-colors"
                  placeholder="Enter your email address"
                  disabled={submitting}
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-dark-text mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 pr-11 rounded-xl border border-slate-200 bg-slate-50/70 text-sm focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition-colors"
                    placeholder="Enter your password"
                    disabled={submitting}
                  />
                  <button
                    type="button"
                    onClick={handleTogglePassword}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 text-gray-text hover:text-primary transition-all duration-200 ${
                      isPasswordIconAnimating ? 'scale-110' : 'scale-100'
                    }`}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    disabled={submitting}
                  >
                    <i
                      className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'} transition-transform duration-200 ease-out ${
                        isPasswordIconAnimating ? 'rotate-12' : 'rotate-0'
                      }`}
                    ></i>
                  </button>
                </div>
              </div>

              <label className="inline-flex items-center gap-2.5 text-sm text-dark-text select-none cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary/25"
                  disabled={submitting}
                />
                <span>Remember me on this device</span>
              </label>

              <button
                type="submit"
                disabled={submitting}
                className={`w-full btn-gradient text-white py-3 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                  submitting
                    ? 'scale-[0.99] shadow-md shadow-primary/20'
                    : 'shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/35 hover:-translate-y-0.5'
                }`}
              >
                {submitting ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <i className="fas fa-arrow-right"></i>
                  </>
                )}
              </button>
            </form>

            <div className="text-center mt-5 sm:mt-6">
              <p className="text-xs text-gray-text">
                Session auto-ends on browser close when Remember me is unchecked.
              </p>
            </div>

            <div className="text-center mt-4 sm:mt-5 lg:hidden">
              <Link
                to="/"
                onClick={handleBackToHome}
                className="text-sm text-primary hover:text-primary-dark transition-colors font-medium"
              >
                <i className="fas fa-arrow-left mr-1.5"></i>
                Back to Home
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
