import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { User, Mail, Phone, MapPin, LogOut, Settings, ShoppingBag, ArrowLeft } from 'lucide-react';
import { toast } from 'react-toastify';
import API from '../../api/apiClient';
import { clearUser, setUser } from '../redux/userSlice';

const addressText = (address = {}) => [address.street, address.city, address.zipcode].filter(Boolean).join(', ') || 'No address saved yet';

const Profile = () => {
  const user = useSelector((state) => state.user?.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [profile, setProfile] = useState(user);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', street: '', city: '', zipcode: '' });
  const isSettings = pathname === '/profile/settings';

  useEffect(() => {
    let active = true;
    API.get('/users/me').then(({ data }) => {
      if (active) { setProfile(data); dispatch(setUser(data)); }
    }).catch(() => { if (active) setProfile(user); });
    return () => { active = false; };
  }, [dispatch]);

  useEffect(() => {
    const current = profile || user || {};
    setForm({ firstName: current.firstName || current.name || '', lastName: current.lastName || '', email: current.email || '', street: current.address?.street || '', city: current.address?.city || '', zipcode: current.address?.zipcode || '' });
  }, [profile, user]);

  const handleLogout = async () => {
    try { await API.post('/auth/logout'); } catch { /* The local session still must be cleared. */ }
    dispatch(clearUser());
    localStorage.removeItem('token');
    toast.success('Logged out successfully!');
    navigate('/');
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const { data } = await API.put('/users/me', form);
      setProfile(data); dispatch(setUser(data)); toast.success('Profile updated successfully!'); navigate('/profile');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not update your profile.');
    } finally { setSaving(false); }
  };

  const currentUser = profile || user;
  if (!currentUser) return null;

  if (isSettings) return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <button onClick={() => navigate('/profile')} className="mb-5 inline-flex items-center gap-2 text-green-700 hover:text-green-800"><ArrowLeft size={18} /> Back to profile</button>
      <form onSubmit={saveProfile} className="bg-white rounded-2xl shadow-lg p-6 space-y-4">
        <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
        <div className="grid sm:grid-cols-2 gap-4">
          {[['firstName', 'First name'], ['lastName', 'Last name'], ['email', 'Email address'], ['street', 'Street address'], ['city', 'City'], ['zipcode', 'Postal code']].map(([name, label]) => <label key={name} className="block text-sm font-medium text-gray-700">{label}<input type={name === 'email' ? 'email' : 'text'} value={form[name]} onChange={(e) => setForm({ ...form, [name]: e.target.value })} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-green-500 focus:outline-none" /></label>)}
        </div>
        <button disabled={saving} className="rounded-lg bg-green-600 px-5 py-2.5 font-medium text-white hover:bg-green-700 disabled:opacity-60">{saving ? 'Saving...' : 'Save changes'}</button>
      </form>
    </div>
  );

  const displayName = currentUser.name || [currentUser.firstName, currentUser.lastName].filter(Boolean).join(' ') || 'Your profile';
  return (
    <div className="max-w-7xl mx-auto px-4 py-8"><div className="space-y-6">
      <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-xl"><div className="flex items-center gap-4"><div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg"><User size={40} className="text-green-500" /></div><div><h1 className="text-2xl font-bold">{displayName}</h1><p className="text-green-100">{currentUser.email || 'No email saved yet'}</p></div></div></div>
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden"><div className="divide-y divide-gray-100">
        <div className="p-4 flex items-center gap-4"><Mail className="w-5 h-5 text-green-600" /><div><label className="text-sm text-gray-500">Email</label><p className="font-medium text-gray-900">{currentUser.email || 'No email saved yet'}</p></div></div>
        <div className="p-4 flex items-center gap-4"><Phone className="w-5 h-5 text-green-600" /><div><label className="text-sm text-gray-500">Phone</label><p className="font-medium text-gray-900">{currentUser.phone || 'Not provided'}</p></div></div>
        <div className="p-4 flex items-center gap-4"><MapPin className="w-5 h-5 text-green-600" /><div><label className="text-sm text-gray-500">Default Address</label><p className="font-medium text-gray-900">{addressText(currentUser.address)}</p></div></div>
      </div></div>
      <div className="grid grid-cols-2 gap-4"><button onClick={() => navigate('/orders')} className="flex items-center gap-3 p-4 bg-white rounded-xl shadow-md hover:shadow-lg transition-all"><ShoppingBag className="w-5 h-5 text-green-600" /><span className="font-medium text-gray-800">My Orders</span></button><button onClick={() => navigate('/profile/settings')} className="flex items-center gap-3 p-4 bg-white rounded-xl shadow-md hover:shadow-lg transition-all"><Settings className="w-5 h-5 text-green-600" /><span className="font-medium text-gray-800">Settings</span></button></div>
      <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 bg-red-50 text-red-600 p-4 rounded-xl hover:bg-red-100 transition-all"><LogOut size={20} /><span className="font-medium">Logout</span></button>
    </div></div>
  );
};

export default Profile;
