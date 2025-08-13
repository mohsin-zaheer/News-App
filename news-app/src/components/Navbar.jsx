import React, { useState } from 'react';
import styles from '../stylesheets/nav.module.css';
import logo from '../assets/logo.png';
import { Icon } from '@iconify/react';
import userImg from '../assets/user.png';
import '../App.css';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';

const Navbar = () => {
  const { user } = useAuthStore();
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => setSearch(e.target.value);

  const handleSubmit = (e) => {
    e.preventDefault();
    const q = (search || '').trim();
    if (!q) return;
    // Go to route your SearchResults component reads (using :q param)
    navigate(`/searchResults/${encodeURIComponent(q)}`);
    // If you prefer a query string instead, use:
    // navigate(`/searchResults?q=${encodeURIComponent(q)}`);
  };

  return (
    <div className={styles.navBg}>
      <nav className="navbar navbar-expand-lg">
        <div className="container-fluid">
          <a className="navbar-brand" href="/">
            <img src={logo} alt="" className={styles.logo} />
          </a>

          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarSupportedContent"
            aria-controls="navbarSupportedContent"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          <div className="collapse navbar-collapse" id="navbarSupportedContent">
            <ul className="navbar-nav me-auto mb-2 mb-lg-0">
              <li className="nav-item">
                <Link className="nav-link active" to="/">Home</Link>
              </li>

              <li className="nav-item dropdown">
                <a className="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                  Categories
                </a>
                <ul className="dropdown-menu">
                  <li><Link className="dropdown-item" to="/category/sports">Sports</Link></li>
                  <li><Link className="dropdown-item" to="/category/food">Food</Link></li>
                  <li><Link className="dropdown-item" to="/category/domestic">Animal</Link></li>
                  <li><Link className="dropdown-item" to="/category/entertainment">Entertainment</Link></li>
                  <li><Link className="dropdown-item" to="/category/crime">Crime</Link></li>
                  <li><Link className="dropdown-item" to="/category/education">Education</Link></li>
                  <li><Link className="dropdown-item" to="/category/politics">Politics</Link></li>
                  <li><Link className="dropdown-item" to="/category/science">Science</Link></li>
                  <li><Link className="dropdown-item" to="/category/technology">Technology</Link></li>
                  <li><Link className="dropdown-item" to="/category/lifestyle">Lifestyle</Link></li>
                  <li><Link className="dropdown-item" to="/category/other">Other</Link></li>
                </ul>
              </li>

              <li className="nav-item">
                <Link className="nav-link" to="/about">About Us</Link>
              </li>

              <li className="nav-item">
                <Link className="nav-link" to="/blogs">Blogs</Link>
              </li>

              <li className="nav-item">
                <Link className="nav-link" to="/contact">Contact Us</Link>
              </li>
            </ul>

            <div className={styles.navRight}>
              {/* Desktop search */}
              <form className={`${styles.searchBg} d-none d-sm-flex`} onSubmit={handleSubmit}>
                <input
                  className={styles.search}
                  type="search"
                  placeholder="Search"
                  aria-label="Search"
                  value={search}
                  onChange={handleChange}
                />
                <button type="submit" className={styles.searchBtn} aria-label="Search">
                  <Icon icon="icon-park-outline:search" className={styles.searchIco} />
                </button>
              </form>

              {user ? (
                <Link to="/profile" className={styles.user}>
                  <img src={user?.avatar?.url || userImg} alt="" className={styles.userImg} />
                  {user?.username}
                </Link>
              ) : (
                <div className={styles.auth}>
                  <Link to="/login" className={styles.authLink}>Login</Link> / <Link to="/signup" className={styles.authLink}>Signup</Link>
                </div>
              )}

              <div className={styles.save}>
                <Link to="/savePosts">
                  <Icon icon="akar-icons:ribbon" className={styles.saveIco} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile search */}
      <form className={`${styles.searchBg} d-flex d-sm-none`} role="search" onSubmit={handleSubmit}>
        <input
          className={styles.search}
          type="search"
          placeholder="Search"
          aria-label="Search"
          value={search}
          onChange={handleChange}
        />
        <button type="submit" className={styles.searchBtn} aria-label="Search">
          <Icon icon="icon-park-outline:search" className={styles.searchIco} />
        </button>
      </form>
    </div>
  );
};

export default Navbar;
