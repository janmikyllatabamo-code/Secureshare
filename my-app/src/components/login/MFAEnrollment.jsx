import { useState, useEffect } from 'react';
import { ShieldCheck } from 'lucide-react';
import { enrollMfa, createMfaChallenge, verifyMfa } from '../../utils/mfaApi';

const MFAEnrollment = ({ user, onComplete, onSkip }) => {
  const [qrCode, setQrCode] = useState(null);
  const [secret, setSecret] = useState('');
  const [factorId, setFactorId] = useState(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [enrolling, setEnrolling] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    handleEnrollMFA();
  }, []);

  const handleEnrollMFA = async () => {
    try {
      setEnrolling(true);
      setError('');

      const data = await enrollMfa();

      setFactorId(data.id);
      setQrCode(data.qr_code);
      setSecret(data.secret);
    } catch (err) {
      setError(err.message || 'Failed to enroll MFA');
    } finally {
      setEnrolling(false);
    }
  };

  const verifyEnrollment = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setError('Please enter a 6-digit code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Create a challenge for the factor we just enrolled
      const challengeData = await createMfaChallenge();

      // Verify the code via the API
      await verifyMfa(
        challengeData.factorId,
        challengeData.challengeId,
        verificationCode
      );

      onComplete();
    } catch (err) {
      setError(err.message || 'Invalid verification code');
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
            Enable Two-Factor Authentication
          </h2>
          <p className="text-gray-600 text-sm">
            Scan the QR code with Google Authenticator
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        {enrolling ? (
          <div className="mb-6 text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7A1C1C] mx-auto"></div>
            <p className="mt-4 text-gray-600">Setting up MFA...</p>
          </div>
        ) : qrCode && (
          <div className="mb-6 text-center">
            <div
              className="inline-block p-4 bg-white border-2 border-gray-200 rounded-lg"
              dangerouslySetInnerHTML={{ __html: qrCode }}
            />
            {secret && (
              <p className="mt-2 text-xs text-gray-500">
                Or enter this code manually: <code className="bg-gray-100 px-2 py-1 rounded">{secret}</code>
              </p>
            )}
          </div>
        )}

        <div className="mb-4">
          <label className="block text-sm font-semibold text-[#7A1C1C] mb-2">
            Enter 6-digit code from Google Authenticator
          </label>
          <input
            type="text"
            maxLength={6}
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
            placeholder="000000"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7A1C1C]"
            disabled={enrolling}
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={verifyEnrollment}
            disabled={loading || enrolling || verificationCode.length !== 6}
            className="flex-1 bg-[#7A1C1C] hover:bg-[#5a1515] text-white font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Verifying...' : 'Verify & Enable'}
          </button>
          {onSkip && (
            <button
              onClick={onSkip}
              disabled={loading || enrolling}
              className="px-4 py-2.5 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Skip for now
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MFAEnrollment;


