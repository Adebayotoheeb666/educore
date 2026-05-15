import React, { useState, useEffect } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useSelector } from 'react-redux';
import './Web.css';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { isAuthenticated } = useSelector(s => s.auth);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`web-navbar animate__animated animate__fadeInDown ${isScrolled ? 'scrolled' : ''}`}>
      <div className="web-container web-navbar__inner">
        {/* Logo */}
        <Link to="/" className="web-logo">
          EduCore <span>AI</span>
        </Link>

        {/* Desktop Nav Links */}
        <div className={`nav-links ${menuOpen ? 'nav-links--open' : ''}`}>
          <NavLink to="/" end className={({ isActive }) => isActive ? 'active' : ''}>
            Learners
          </NavLink>
          <NavLink to="/about-us" className={({ isActive }) => isActive ? 'active' : ''}>
            About
          </NavLink>
          <NavLink to="/for-schools" className={({ isActive }) => isActive ? 'active' : ''}>
            For Schools
          </NavLink>
          <NavLink to="/resources" className={({ isActive }) => isActive ? 'active' : ''}>
            Resources
          </NavLink>
          <NavLink to="/blog" className={({ isActive }) => isActive ? 'active' : ''}>
            Blog
          </NavLink>
          <NavLink to="/contact-us" className={({ isActive }) => isActive ? 'active' : ''}>
            Contact
          </NavLink>
        </div>

        {/* Auth Buttons */}
        <div className="nav-auth">
          {isAuthenticated ? (
            <Link to="/dashboard" className="btn-register">Dashboard</Link>
          ) : (
            <>
              <Link to="/login" className="btn-login">Login</Link>
              <Link to="/register" className="btn-register">Explore</Link>
            </>
          )}
        </div>

        {/* Hamburger */}
        <button
          className={`nav-hamburger ${menuOpen ? 'open' : ''}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <span /><span /><span />
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
