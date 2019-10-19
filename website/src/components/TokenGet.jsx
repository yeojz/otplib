import React, { useContext, useState, useEffect, Fragment } from 'react';
import { SecretContext } from './SecretStore';
import Input from './Input';
import { RowContent, RowAction, RowLabel } from './Row';

const TokenGet = () => {
  const { authenticator } = window.otplib;
  const [token, setToken] = useState();
  const [timeLeft, setTimeLeft] = useState(authenticator.timeRemaining());
  const { secret } = useContext(SecretContext);

  useEffect(() => {
    if (secret) {
      setToken(authenticator.generate(secret));
    }
  }, [secret]);

  useEffect(() => {
    if (timeLeft === 30) {
      setToken(authenticator.generate(secret));
    }
  }, [timeLeft]);

  useEffect(() => {
    const timing = setInterval(() => {
      setTimeLeft(authenticator.timeRemaining());
    }, 1000);

    return () => {
      clearInterval(timing);
    };
  }, []);

  return (
    <Fragment>
      <RowLabel>Next in: {timeLeft}s</RowLabel>
      <RowContent>
        <Input value={token || 'Loading...'} />
      </RowContent>
      <RowAction />
    </Fragment>
  );
};

export default TokenGet;
