'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Building2, User, Mail, Lock, ArrowRight, ArrowLeft, Check, AlertCircle } from 'lucide-react';
import '../../src/views/LoginView.css';
import './register.css';

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
    <div className="register-container">
      <div className="register-card">
        <div className="register-header">
          <Building2 size={32} style={{ color: 'var(--text-primary)', marginBottom: 'var(--spacing-md)' }} />
          <h1>Create Your Organization</h1>
          <p>Get started with TravelWeaver in 3 simple steps</p>
        </div>

        {/* Progress indicator */}
        <div className="progress-indicator">
          <div className="progress-bar">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`progress-step ${s <= step ? 'active' : ''}`}
              />
            ))}
          </div>
          <div className="progress-labels">
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

            <div className="form-actions">
              <button
                type="button"
                className="link-button"
                onClick={() => router.push('/login')}
              >
                Back to Login
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={handleNext}
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

            <div className="form-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={handleBack}
              >
                <ArrowLeft size={20} />
                Back
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={handleNext}
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
            <p style={{ marginBottom: 'var(--spacing-lg)', color: 'var(--text-secondary)' }}>
              Choose a plan to get started. You can change this later.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
              {[
                { id: 'starter', name: 'Starter', price: 'Free', features: ['Up to 10 bookings/month', 'Basic support'] },
                { id: 'professional', name: 'Professional', price: '$49/month', features: ['Unlimited bookings', 'Priority support', 'Advanced features'] },
                { id: 'enterprise', name: 'Enterprise', price: 'Custom', features: ['Everything in Professional', 'Dedicated support', 'Custom integrations'] },
              ].map((plan) => (
                <button
                  key={plan.id}
                  type="button"
                  onClick={() => setSelectedPlan(plan.id)}
                  className={`plan-card ${selectedPlan === plan.id ? 'selected' : ''}`}
                >
                  <div className="plan-header">
                    <div>
                      <div className="plan-name">{plan.name}</div>
                      <div className="plan-price">{plan.price}</div>
                    </div>
                    {selectedPlan === plan.id && <Check size={20} style={{ color: 'var(--text-primary)' }} />}
                  </div>
                  <ul className="plan-features">
                    {plan.features.map((feature, idx) => (
                      <li key={idx}>{feature}</li>
                    ))}
                  </ul>
                </button>
              ))}
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={handleBack}
              >
                <ArrowLeft size={20} />
                Back
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={handleSubmit}
                disabled={loading}
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

