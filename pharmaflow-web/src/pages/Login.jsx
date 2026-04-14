import React, { useState } from 'react';
import { auth } from '../services/api';

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const data = await auth.login(username, password);
      onLogin(data.user, data.token);
    } catch (err) { setError(err.message || 'Login failed'); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 to-purple-900 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-5xl mb-2">💊</div>
          <h1 className="text-3xl font-bold text-gray-800">PharmaFlow</h1>
          <p className="text-gray-500 mt-1">Pharmacy POS - India</p>
        </div>
        <form onSubmit={handleSubmit}>
          {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">{error}</div>}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <input type="text" value={username} onChange={e => setUsername(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-3 focus:border-indigo-500" placeholder="Enter username" autoFocus required />
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-3 focus:border-indigo-500" placeholder="Enter password" required />
          </div>
          <button type="submit" disabled={loading}
            className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold hover:bg-indigo-700 disabled:opacity-50 transition-colors">
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        <div className="mt-6 text-center text-xs text-gray-400">
          <p>Demo: admin / pharma123</p>
          <p className="mt-1">PharmaFlow v1.0 - Tamil Nadu</p>
        </div>
      </div>
    </div>
  );
}
