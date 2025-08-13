  import React, { useState, useCallback } from 'react';
  import styles from '../../stylesheets/auth.module.css';
  import { Icon } from '@iconify/react';
  import { useAuthStore } from '../../store/useAuthStore';
  import toast, { Toaster } from 'react-hot-toast';
  import { useNavigate } from 'react-router-dom';

  const Login = () => {
    const { login, loading } = useAuthStore();
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();

    const handleChange = useCallback((e) => {
      const { name, value } = e.target;
      setFormData((prev) => ({ ...prev, [name]: value }));
    }, []);

    const handleSubmit = useCallback(
      async (e) => {
        e.preventDefault();
        try {
          await login({ email: formData.email, password: formData.password });
          toast.success('Logged in successfully!');
          navigate('/');
        } catch (err) {
          toast.error(err?.message || 'Login failed');
        }
      },
      [login, formData]
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
            <h2 className={styles.title}>Welcome Back!</h2>
            <p className={styles.info}>Enter your credentials to login</p>

            <form onSubmit={handleSubmit} className={styles.form} noValidate>
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
                  autoComplete="current-password"
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

              <button type="submit" className={styles.formBtn} disabled={blocking}>
                <Icon icon="material-symbols-light:login-rounded" className={styles.btnIcon} />
                {blocking ? 'Logging in…' : 'Login'}
              </button>
            </form>
          </div>
        </div>
      </>
    );
  };

  export default Login;
