import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';

export default function VerifyEmail() {
  const [message, setMessage] = useState('Verifying...');
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const uid = searchParams.get('uid');
    const token = searchParams.get('token');

    if (!uid || !token) {
      setMessage('Invalid verification link.');
      return;
    }

    axios.get(`http://localhost:8000/api/verify-email/?uid=${uid}&token=${token}`)
      .then(() => {
        setMessage('✅ Email verified successfully! You can now log in.');
      })
      .catch(() => {
        setMessage('❌ Verification failed. Link may be invalid or expired.');
      });
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-xl">{message}</p>
    </div>
  );
}
