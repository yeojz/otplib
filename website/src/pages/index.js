import React from 'react';
import ActionTabs from '../components/ActionTabs';
import Layout from '../components/Layout';
import Secret from '../components/Secret';
import SecretStore from '../components/SecretStore';
import styles from './index.module.css';

const Hero = () => (
  <h2 className={styles.hero}>
    otplib is a pluggable JavaScript One-Time Password (OTP) library with
    support for <a href="/api/classes/hotp.html">HOTP</a>,{' '}
    <a href="/api/classes/totp.html">TOTP</a> and{' '}
    <a href="/api/classes/authenticator.html">Google Authenticator</a>.
  </h2>
);

const Home = () => (
  <Layout>
    <div className={styles.container}>
      <Hero />

      <SecretStore>
        <Secret />
        <ActionTabs />
      </SecretStore>
    </div>
  </Layout>
);

export default Home;
