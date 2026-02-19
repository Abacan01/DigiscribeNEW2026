import { useState } from 'react';

export default function CreateUserForm({ onCreateUser, loading }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [admin, setAdmin] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const validate = () => {
    const newErrors = {};
    if (!email.trim()) {
      newErrors.email = 'Email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Enter a valid email address.';
    }
    if (!password) {
      newErrors.password = 'Password is required.';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters.';
    }
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validate();
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setSubmitting(true);
    try {
      await onCreateUser({ email: email.trim(), password, admin });
      setEmail('');
      setPassword('');
      setAdmin(false);
      setErrors({});
      setExpanded(false);
    } catch {
      // Error handling is done in the parent via the hook
    } finally {
      setSubmitting(false);
    }
  };

  const isDisabled = loading || submitting;

  // Collapsed state — just a button
  if (!expanded) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="w-full bg-white rounded-xl border border-dashed border-gray-200 p-4 flex items-center justify-center gap-2 text-sm font-medium text-gray-text hover:text-primary hover:border-primary/30 hover:bg-primary/5 transition-all"
      >
        <i className="fas fa-plus text-xs"></i>
        Add New User
      </button>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
            <i className="fas fa-user-plus text-primary text-xs"></i>
          </div>
          <h3 className="text-sm font-semibold text-dark-text">New User</h3>
        </div>
        <button
          type="button"
          onClick={() => { setExpanded(false); setErrors({}); }}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-dark-text hover:bg-gray-100 transition-colors"
        >
          <i className="fas fa-times text-xs"></i>
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Email */}
          <div>
            <label htmlFor="create-email" className="block text-[11px] font-medium text-gray-text uppercase tracking-wide mb-1.5">
              Email <span className="text-red-400">*</span>
            </label>
            <input
              id="create-email"
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setErrors((prev) => ({ ...prev, email: '' })); }}
              className={`w-full px-3 py-2.5 rounded-lg border text-sm text-dark-text placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all ${
                errors.email ? 'border-red-300 bg-red-50/30' : 'border-gray-200 bg-gray-50'
              }`}
              placeholder="user@company.com"
              disabled={isDisabled}
            />
            {errors.email && (
              <p className="mt-1 text-[11px] text-red-500">{errors.email}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label htmlFor="create-password" className="block text-[11px] font-medium text-gray-text uppercase tracking-wide mb-1.5">
              Password <span className="text-red-400">*</span>
            </label>
            <input
              id="create-password"
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setErrors((prev) => ({ ...prev, password: '' })); }}
              className={`w-full px-3 py-2.5 rounded-lg border text-sm text-dark-text placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all ${
                errors.password ? 'border-red-300 bg-red-50/30' : 'border-gray-200 bg-gray-50'
              }`}
              placeholder="Min. 6 characters"
              disabled={isDisabled}
            />
            {errors.password && (
              <p className="mt-1 text-[11px] text-red-500">{errors.password}</p>
            )}
          </div>


          {/* Role + Submit */}
          <div className="flex items-end gap-3">
            {/* Admin toggle */}
            <label className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-gray-200 bg-gray-50 cursor-pointer hover:border-primary/30 transition-colors flex-shrink-0">
              <input
                type="checkbox"
                checked={admin}
                onChange={(e) => setAdmin(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary/30 cursor-pointer"
                disabled={isDisabled}
              />
              <span className="text-xs font-medium text-dark-text whitespace-nowrap">Admin</span>
            </label>

            {/* Submit */}
            <button
              type="submit"
              disabled={isDisabled}
              className="btn-gradient text-white px-5 py-2.5 rounded-lg text-sm font-semibold shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {isDisabled ? (
                <i className="fas fa-spinner fa-spin text-xs"></i>
              ) : (
                <i className="fas fa-plus text-xs"></i>
              )}
              Create
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
