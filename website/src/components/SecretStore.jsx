import React, { createContext, useState, useEffect } from 'react';

const DEMO_SECRET = 'otplib:demo:secret';
const noop = () => {};

export const SecretContext = createContext({
  token: '',
  generateSecret: noop
});

const { Provider } = SecretContext;

const SecretStore = props => {
  const [secret, setSecret] = useState();

  function generateSecret() {
    setSecret('');

    const newSecret = window.otplib.authenticator.generateSecret();
    window.localStorage.setItem(DEMO_SECRET, newSecret);
    setSecret(newSecret);
  }

  useEffect(() => {
    const savedSecret = window.localStorage.getItem(DEMO_SECRET);

    if (savedSecret) {
      setSecret(savedSecret);
      return;
    }

    generateSecret();
  }, []);

  return (
    <Provider value={{ secret, generateSecret }}>{props.children}</Provider>
  );
};

export default SecretStore;
