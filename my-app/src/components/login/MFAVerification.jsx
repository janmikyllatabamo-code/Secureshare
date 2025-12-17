import { useState, useEffect } from 'react';
import { ShieldCheck } from 'lucide-react';
import { createMfaChallenge, verifyMfa } from '../../utils/mfaApi';

const MFAVerification = ({ onVerified, onError }) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [challenge, setChallenge] = useState(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    initializeChallenge();
  }, []);

  const initializeChallenge = async () => {
    try {
      setInitializing(true);
      setError('');

      const challengeData = await createMfaChallenge();
      setChallenge(challengeData);
    } catch (err) {
      setError(err.message || 'Failed to initialize MFA challenge');
      if (onError) onError(err);
    } finally {
      setInitializing(false);
    }
  };

  const handleVerify = async () => {
    if (!code || code.length !== 6) {
      setError('Please enter a 6-digit code');
      return;
    }

    if (!challenge) {
      setError('MFA challenge not initialized. Please refresh and try again.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = await verifyMfa(
        challenge.factorId,
        challenge.challengeId,
        code
      );

      onVerified(data);
    } catch (err) {
      setError(err.message || 'Invalid verification code');
      if (onError) onError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
        <div className="text-center mb-6">
          <div className="bg-gradient-to-br from-[#7A1C1C] to-[#9B2D2D] p-3 rounded-lg inline-block mb-4">
            <ShieldCheck className="text-white w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-[#7A1C1C] mb-2">
            Two-Factor Authentication
          </h2>
          <p className="text-gray-600 text-sm">
            Enter the 6-digit code from Google Authenticator
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        {initializing ? (
          <div className="mb-6 text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#7A1C1C] mx-auto"></div>
            <p className="mt-2 text-sm text-gray-600">Preparing verification...</p>
          </div>
        ) : (
          <div className="mb-6">
            <input
              type="text"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
              className="w-full px-4 py-3 text-center text-2xl tracking-widest border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7A1C1C]"
              autoFocus
              disabled={!challenge}
            />
          </div>
        )}

        <button
          onClick={handleVerify}
          disabled={loading || initializing || code.length !== 6 || !challenge}
          className="w-full bg-[#7A1C1C] hover:bg-[#5a1515] text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Verifying...' : 'Verify'}
        </button>
      </div>
    </div>
  );
};

export default MFAVerification;


