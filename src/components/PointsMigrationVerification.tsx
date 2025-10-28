import React, { useState, useEffect } from 'react';
import { MigrationOTPService } from '@/lib/migrationOTPService';

interface Props {
  migrationId: string;
  userPhone: string;
  sourcePlatform: string;
  pointsAmount: number;
  onVerificationComplete: (success: boolean) => void;
  onCancel: () => void;
}

export const PointsMigrationVerification: React.FC<Props> = ({
  migrationId,
  userPhone,
  sourcePlatform,
  pointsAmount,
  onVerificationComplete,
  onCancel
}) => {
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [verificationId, setVerificationId] = useState<string>('');
  const [countdown, setCountdown] = useState(0);

  // Countdown timer for resend OTP
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [countdown]);

  const handleSendOTP = async (): Promise<void> => {
    setLoading(true);
    setError('');
    
    try {
      // Get current user ID (you'll need to pass this as a prop or get from context)
      const userId = 'current-user-id'; // TODO: Get from auth context
      
      const result = await MigrationOTPService.sendNetworkOTP(
        userId,
        migrationId, // Using migrationId as networkId
        userPhone
      );
      
      if (result.success) {
        setOtpSent(true);
        setVerificationId(result.verificationId || '');
        setCountdown(60); // 60 seconds countdown
        alert('Verification code sent to your phone');
      } else {
        setError(result.error || 'Failed to send verification code');
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Send OTP error:', err);
    }
    
    setLoading(false);
  };

  const handleVerifyOTP = async () => {
    if (!verificationId) {
      setError('Verification ID not found. Please try sending OTP again.');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const result = await MigrationOTPService.verifyNetworkOTP(
        verificationId,
        otpCode,
        'current-user-id', // TODO: Get from auth context
        migrationId
      );
      
      if (result.success) {
        onVerificationComplete(true);
      } else {
        setError(result.error || 'Verification failed');
      }
    } catch (err) {
      setError('An unexpected error occurred during verification');
      console.error('Verify OTP error:', err);
    }
    
    setLoading(false);
  };

  const handleResendOTP = async (): Promise<void> => {
    if (countdown > 0) return;
    
    setOtpCode('');
    setError('');
    await handleSendOTP();
  };

  const formatPhoneNumber = (phone: string) => {
    // Format phone number for display (e.g., +1234567890 -> +1 (234) 567-890)
    if (phone.length === 11 && phone.startsWith('+1')) {
      return `+1 (${phone.slice(2, 5)}) ${phone.slice(5, 8)}-${phone.slice(8)}`;
    }
    return phone;
  };

  return (
    <div className="points-migration-verification">
      <div className="verification-header">
        <h3>Verify Points Migration</h3>
        <p>We need to verify your identity before processing this migration</p>
      </div>
      
      <div className="migration-details">
        <div className="detail-item">
          <span className="label">Source Platform:</span>
          <span className="value">{sourcePlatform}</span>
        </div>
        <div className="detail-item">
          <span className="label">Points Amount:</span>
          <span className="value">{pointsAmount.toLocaleString()} points</span>
        </div>
        <div className="detail-item">
          <span className="label">Your Phone:</span>
          <span className="value">{formatPhoneNumber(userPhone)}</span>
        </div>
      </div>
      
      {!otpSent ? (
        <div className="send-otp-section">
          <p>We'll send a verification code to your phone to confirm this migration.</p>
          <button 
            onClick={handleSendOTP} 
            disabled={loading}
            className="btn btn-primary"
          >
            {loading ? 'Sending...' : 'Send Verification Code'}
          </button>
        </div>
      ) : (
        <div className="verify-otp-section">
          <p>Enter the 6-digit code sent to your phone:</p>
          <div className="otp-input-container">
            <input
              type="text"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="Enter 6-digit code"
              maxLength={6}
              className="otp-input"
              autoComplete="one-time-code"
            />
          </div>
          
          <div className="resend-section">
            {countdown > 0 ? (
              <p className="countdown">Resend available in {countdown}s</p>
            ) : (
              <button 
                onClick={handleResendOTP} 
                className="btn btn-link"
                disabled={loading}
              >
                Resend Code
              </button>
            )}
          </div>
          
          <div className="button-group">
            <button 
              onClick={handleVerifyOTP} 
              disabled={loading || !otpCode || otpCode.length !== 6}
              className="btn btn-success"
            >
              {loading ? 'Verifying...' : 'Verify & Migrate Points'}
            </button>
            <button 
              onClick={onCancel} 
              disabled={loading}
              className="btn btn-secondary"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      
      {error && (
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          {error}
        </div>
      )}
      
      <style>{`
        .points-migration-verification {
          max-width: 500px;
          margin: 0 auto;
          padding: 24px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        
        .verification-header {
          text-align: center;
          margin-bottom: 24px;
        }
        
        .verification-header h3 {
          margin: 0 0 8px 0;
          color: #1f2937;
          font-size: 24px;
          font-weight: 600;
        }
        
        .verification-header p {
          margin: 0;
          color: #6b7280;
          font-size: 14px;
        }
        
        .migration-details {
          background: #f9fafb;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 24px;
        }
        
        .detail-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 0;
          border-bottom: 1px solid #e5e7eb;
        }
        
        .detail-item:last-child {
          border-bottom: none;
        }
        
        .label {
          font-weight: 500;
          color: #374151;
        }
        
        .value {
          color: #1f2937;
          font-weight: 600;
        }
        
        .send-otp-section,
        .verify-otp-section {
          text-align: center;
        }
        
        .send-otp-section p {
          margin-bottom: 20px;
          color: #6b7280;
        }
        
        .verify-otp-section p {
          margin-bottom: 16px;
          color: #6b7280;
        }
        
        .otp-input-container {
          margin-bottom: 16px;
        }
        
        .otp-input {
          width: 200px;
          padding: 12px 16px;
          font-size: 18px;
          text-align: center;
          letter-spacing: 4px;
          border: 2px solid #d1d5db;
          border-radius: 8px;
          outline: none;
          transition: border-color 0.2s;
        }
        
        .otp-input:focus {
          border-color: #3b82f6;
        }
        
        .resend-section {
          margin-bottom: 20px;
        }
        
        .countdown {
          color: #6b7280;
          font-size: 14px;
          margin: 0;
        }
        
        .button-group {
          display: flex;
          gap: 12px;
          justify-content: center;
        }
        
        .btn {
          padding: 12px 24px;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          min-width: 120px;
        }
        
        .btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .btn-primary {
          background: #3b82f6;
          color: white;
        }
        
        .btn-primary:hover:not(:disabled) {
          background: #2563eb;
        }
        
        .btn-success {
          background: #10b981;
          color: white;
        }
        
        .btn-success:hover:not(:disabled) {
          background: #059669;
        }
        
        .btn-secondary {
          background: #6b7280;
          color: white;
        }
        
        .btn-secondary:hover:not(:disabled) {
          background: #4b5563;
        }
        
        .btn-link {
          background: none;
          color: #3b82f6;
          text-decoration: underline;
          padding: 8px 0;
          min-width: auto;
        }
        
        .btn-link:hover:not(:disabled) {
          color: #2563eb;
        }
        
        .error-message {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 16px;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 8px;
          color: #dc2626;
          font-size: 14px;
          margin-top: 16px;
        }
        
        .error-icon {
          font-size: 16px;
        }
      `}</style>
    </div>
  );
};
