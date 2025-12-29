'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Building2, User, Mail, Lock, ArrowRight, ArrowLeft, Check, AlertCircle } from 'lucide-react';
import '../../src/views/LoginView.css';

type Step = 1 | 2 | 3;

function RegisterPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { register } = useAuth();
  
  const [step, setStep] = useState<Step>(1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Step 1: Organization details
  const [organizationName, setOrganizationName] = useState('');
  const [country, setCountry] = useState('');
  const [phone, setPhone] = useState('');

  // Step 2: Admin user
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Step 3: Plan selection (optional)
  const [selectedPlan, setSelectedPlan] = useState<string | null>(
    searchParams.get('plan') || null
  );

  const validateStep1 = () => {
    if (!organizationName.trim()) {
      setError('Organization name is required');
      return false;
    }
    if (!country.trim()) {
      setError('Country is required');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!name.trim()) {
      setError('Full name is required');
      return false;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Valid email is required');
      return false;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    setError('');
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      setStep(3);
    }
  };

  const handleBack = () => {
    setError('');
    if (step > 1) {
      setStep((step - 1) as Step);
    }
  };

  const handleSubmit = async () => {
    setError('');
    setLoading(true);

    try {
      await register(email, password, name, organizationName);
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card" style={{ maxWidth: '600px' }}>
        <div className="login-header">
          <Building2 size={32} className="login-logo" />
          <h1>Create Your Organization</h1>
          <p>Get started with TravelWeaver in 3 simple steps</p>
        </div>

        {/* Progress indicator */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                style={{
                  flex: 1,
                  height: '4px',
                  backgroundColor: s <= step ? '#0073E6' : '#e5e7eb',
                  marginRight: s < 3 ? '0.5rem' : 0,
                  borderRadius: '2px',
                  transition: 'background-color 0.3s',
                }}
              />
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: '#6b7280' }}>
            <span>Organization</span>
            <span>Admin Account</span>
            <span>Plan</span>
          </div>
        </div>

        {error && (
          <div className="error-message">
            <AlertCircle size={16} style={{ marginRight: '8px', display: 'inline-block', verticalAlign: 'middle' }} />
            {error}
          </div>
        )}

        {/* Step 1: Organization Details */}
        {step === 1 && (
          <div>
            <div className="form-group">
              <label>
                <Building2 size={16} />
                Organization Name *
              </label>
              <input
                type="text"
                value={organizationName}
                onChange={(e) => setOrganizationName(e.target.value)}
                required
                placeholder="Safari Dreams Kenya"
                onKeyPress={(e) => e.key === 'Enter' && handleNext()}
              />
            </div>

            <div className="form-group">
              <label>
                <Building2 size={16} />
                Country *
              </label>
              <input
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                required
                placeholder="Kenya"
                onKeyPress={(e) => e.key === 'Enter' && handleNext()}
              />
            </div>

            <div className="form-group">
              <label>
                <Building2 size={16} />
                Phone (Optional)
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+254 722 555 123"
                onKeyPress={(e) => e.key === 'Enter' && handleNext()}
              />
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
              <button
                type="button"
                className="link-button"
                onClick={() => router.push('/login')}
                style={{ flex: 1 }}
              >
                Back to Login
              </button>
              <button
                type="button"
                className="login-button"
                onClick={handleNext}
                style={{ flex: 1 }}
              >
                Next
                <ArrowRight size={20} />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Admin User */}
        {step === 2 && (
          <div>
            <div className="form-group">
              <label>
                <User size={16} />
                Full Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="John Doe"
                onKeyPress={(e) => e.key === 'Enter' && handleNext()}
              />
            </div>

            <div className="form-group">
              <label>
                <Mail size={16} />
                Email *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                onKeyPress={(e) => e.key === 'Enter' && handleNext()}
              />
            </div>

            <div className="form-group">
              <label>
                <Lock size={16} />
                Password *
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                minLength={6}
                onKeyPress={(e) => e.key === 'Enter' && handleNext()}
              />
            </div>

            <div className="form-group">
              <label>
                <Lock size={16} />
                Confirm Password *
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="••••••••"
                minLength={6}
                onKeyPress={(e) => e.key === 'Enter' && handleNext()}
              />
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
              <button
                type="button"
                className="login-button"
                onClick={handleBack}
                style={{ flex: 1, background: '#f3f4f6', color: '#374151' }}
              >
                <ArrowLeft size={20} />
                Back
              </button>
              <button
                type="button"
                className="login-button"
                onClick={handleNext}
                style={{ flex: 1 }}
              >
                Next
                <ArrowRight size={20} />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Plan Selection */}
        {step === 3 && (
          <div>
            <p style={{ marginBottom: '1.5rem', color: '#6b7280' }}>
              Choose a plan to get started. You can change this later.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {[
                { id: 'starter', name: 'Starter', price: 'Free', features: ['Up to 10 bookings/month', 'Basic support'] },
                { id: 'professional', name: 'Professional', price: '$49/month', features: ['Unlimited bookings', 'Priority support', 'Advanced features'] },
                { id: 'enterprise', name: 'Enterprise', price: 'Custom', features: ['Everything in Professional', 'Dedicated support', 'Custom integrations'] },
              ].map((plan) => (
                <button
                  key={plan.id}
                  type="button"
                  onClick={() => setSelectedPlan(plan.id)}
                  style={{
                    padding: '1rem',
                    border: selectedPlan === plan.id ? '2px solid #0073E6' : '1px solid #e5e7eb',
                    borderRadius: '0.5rem',
                    background: selectedPlan === plan.id ? '#eff6ff' : 'white',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.2s',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <div>
                      <div style={{ fontWeight: 600, color: '#111827' }}>{plan.name}</div>
                      <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>{plan.price}</div>
                    </div>
                    {selectedPlan === plan.id && <Check size={20} color="#0073E6" />}
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.875rem', color: '#6b7280' }}>
                    {plan.features.map((feature, idx) => (
                      <li key={idx}>{feature}</li>
                    ))}
                  </ul>
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
              <button
                type="button"
                className="login-button"
                onClick={handleBack}
                style={{ flex: 1, background: '#f3f4f6', color: '#374151' }}
              >
                <ArrowLeft size={20} />
                Back
              </button>
              <button
                type="button"
                className="login-button"
                onClick={handleSubmit}
                disabled={loading}
                style={{ flex: 1 }}
              >
                {loading ? 'Creating Account...' : 'Create Account'}
                <ArrowRight size={20} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div style={{ padding: '20px', textAlign: 'center' }}>Loading...</div>}>
      <RegisterPageContent />
    </Suspense>
  );
}

