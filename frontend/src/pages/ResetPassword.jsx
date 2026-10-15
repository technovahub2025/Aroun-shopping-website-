import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import API from '../../api/apiClient';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    if (!token) return setError('This reset link is invalid. Request a new one.');
    if (password.length < 6) return setError('Password must be at least 6 characters.');
    if (password !== confirmPassword) return setError('Passwords do not match.');
    setSaving(true);
    try {
      const { data } = await API.post('/auth/reset-password', { token, newPassword: password });
      setSuccess(data.message || 'Password updated. You can now log in.');
      window.setTimeout(() => navigate('/', { state: { openAuth: true, authMode: 'login' } }), 1800);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not reset password. The link may have expired.');
    } finally {
      setSaving(false);
    }
  };

  return <main className="mx-auto max-w-md px-4 py-16">
    <section className="rounded-2xl bg-white p-8 shadow-lg">
      <h1 className="text-2xl font-bold text-gray-900">Choose a new password</h1>
      <p className="mt-2 text-sm text-gray-600">Your reset link expires after 15 minutes.</p>
      <form onSubmit={submit} className="mt-6 space-y-4">
        <label className="block text-sm font-medium text-gray-700">New password
          <input type="password" autoComplete="new-password" minLength={6} required value={password} onChange={e => setPassword(e.target.value)} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-green-500 focus:outline-none" />
        </label>
        <label className="block text-sm font-medium text-gray-700">Confirm new password
          <input type="password" autoComplete="new-password" minLength={6} required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-green-500 focus:outline-none" />
        </label>
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        {success && <p role="status" className="text-sm text-green-700">{success}</p>}
        <button disabled={saving || Boolean(success)} className="w-full rounded-lg bg-green-600 py-2 font-medium text-white hover:bg-green-700 disabled:opacity-60">{saving ? 'Updating…' : 'Update password'}</button>
      </form>
      <Link to="/" className="mt-5 block text-center text-sm font-medium text-green-700">Back to shop</Link>
    </section>
  </main>;
}
