import React from 'react';
import { Link } from 'gatsby';
import Layout from '../components/Layout';
import styles from './404.module.css';

const FourOhFour = () => (
  <Layout>
    <div className={styles.container}>
      <h2>Sorry! We couldn&apos;t find what you were looking for.</h2>
      <p>
        Maybe you&apos;re looking for is in the <Link to="/docs">docs</Link> or{' '}
        <a href="/api">API</a> page?
      </p>
    </div>
  </Layout>
);

export default FourOhFour;
