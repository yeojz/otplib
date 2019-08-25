import React from 'react';
import { Link } from 'gatsby';
import styles from './Layout.module.css';

const Layout = ({ children }) => (
  <div className={styles.container}>
    <header className={styles.header}>
      <div className={styles.headerConstraints}>
        <Link to="/" className={styles.headerLogo}>
          <img src="/otplib.png" />
        </Link>

        <nav className={styles.navlinks}>
          <a href="https://github.com/yeojz/otplib/blob/master/README.md">
            Docs
          </a>
          <a href="/api">API</a>
          <a href="https://github.com/yeojz/otplib">Github</a>
        </nav>
      </div>
    </header>

    {children}
  </div>
);

export default Layout;
