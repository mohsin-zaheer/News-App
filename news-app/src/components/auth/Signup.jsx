import React, { useState, useCallback } from 'react';
import styles from '../../stylesheets/auth.module.css';
import { Icon } from '@iconify/react';
import { useAuthStore } from '../../store/useAuthStore';
import toast, { Toaster } from 'react-hot-toast';
import { useNavigate } from 'react-router';

const Signup = () => {
  const { signup, loading } = useAuthStore();
  const {navigate} = useNavigate();


  const [formData, setFormData] = useState({
    username: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();

      if (formData.password !== formData.confirmPassword) {
        toast.error('Passwords must match');
        return;
      }

      try {
        await signup(formData);
        toast.success('Account created successfully!');
        navigate('/');
      } catch (err) {
        toast.error(err.message || 'Signup failed');
      }
    },
    [formData, signup]
  );

  const togglePasswordVisible = useCallback(() => {
    setShowPassword((v) => !v);
  }, []);

  const blocking = loading;

  return (
    <>
      <Toaster position="top-center" />
      <div className={styles.authBg}>
        <div className={styles.authCard}>
          <h2 className={styles.title}>Get Started!</h2>
          <p className={styles.info}>
            Enter the following details to create your new account
          </p>

          <form onSubmit={handleSubmit} className={styles.form} noValidate>
            {/* Username */}
            <label htmlFor="username" className={styles.label}>
              Username
            </label>
            <div className={styles.inpBg}>
              <Icon icon="solar:user-linear" className={styles.formIcon} />
              <input
                type="text"
                name="username"
                id="username"
                className={styles.inp}
                placeholder="Enter Your Username..."
                value={formData.username}
                onChange={handleChange}
                required
                autoComplete="username"
                disabled={blocking}
              />
            </div>

            {/* Email */}
            <label htmlFor="email" className={styles.label}>
              Email
            </label>
            <div className={styles.inpBg}>
              <Icon icon="mdi:email-outline" className={styles.formIcon} />
              <input
                type="email"
                name="email"
                id="email"
                className={styles.inp}
                placeholder="Enter Your Email..."
                value={formData.email}
                onChange={handleChange}
                required
                autoComplete="email"
                disabled={blocking}
              />
            </div>

            {/* Phone */}
            <label htmlFor="phone" className={styles.label}>
              Phone No
            </label>
            <div className={styles.inpBg}>
              <Icon icon="mdi:phone-outline" className={styles.formIcon} />
              <input
                type="tel"
                name="phone"
                id="phone"
                className={styles.inp}
                placeholder="Enter Your Phone..."
                value={formData.phone}
                onChange={handleChange}
                required
                autoComplete="tel"
                pattern="^[0-9+\\-\\s()]{6,}$"
                disabled={blocking}
              />
            </div>

            {/* Password */}
            <label htmlFor="password" className={styles.label}>
              Password
            </label>
            <div className={styles.inpBg}>
              <Icon icon="carbon:password" className={styles.formIcon} />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                id="password"
                className={styles.inp}
                placeholder="Enter Your Password Here..."
                value={formData.password}
                onChange={handleChange}
                required
                autoComplete="new-password"
                minLength={8}
                disabled={blocking}
              />
              <button
                type="button"
                onClick={togglePasswordVisible}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className={styles.toggleBtn}
                disabled={blocking}
              >
                <Icon icon={showPassword ? 'mdi:eye-off' : 'mdi:eye'} />
              </button>
            </div>

            {/* Confirm Password */}
            <label htmlFor="confirmPassword" className={styles.label}>
              Confirm Password
            </label>
            <div className={styles.inpBg}>
              <Icon icon="ic:outline-compare-arrows" className={styles.formIcon} />
              <input
                type={showPassword ? 'text' : 'password'}
                name="confirmPassword"
                id="confirmPassword"
                className={styles.inp}
                placeholder="Confirm Your Password..."
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                autoComplete="new-password"
                minLength={8}
                disabled={blocking}
              />
              <button
                type="button"
                onClick={togglePasswordVisible}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className={styles.toggleBtn}
                disabled={blocking}
              >
                <Icon icon={showPassword ? 'mdi:eye-off' : 'mdi:eye'} />
              </button>
            </div>

            {/* Submit */}
            <button type="submit" className={styles.formBtn} disabled={blocking}>
              <Icon
                icon="material-symbols-light:login-rounded"
                className={styles.btnIcon}
              />
              {blocking ? 'Signing up…' : 'Signup'}
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

export default Signup;
