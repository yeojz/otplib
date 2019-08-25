import React, { useContext, useState, useEffect, Fragment } from 'react';
import { SecretContext } from './SecretStore';
import Input from './Input';
import { RowContent, RowAction, RowLabel } from './Row';
import styles from './TokenValidate.module.css';

const Pass = props => <span className={styles.pass}>{props.value}</span>;
const Fail = props => <span className={styles.fail}>{props.value}</span>;

const Message = ({ delta, token }) => {
  if (!token) {
    return 'Please input a token.';
  }

  if (!Number.isInteger(delta)) {
    return <Fail value="The token is invalid." />;
  }

  if (delta === 0) {
    return (
      <Fragment>
        The token <Pass value="is valid" /> in this current window.
      </Fragment>
    );
  }

  return (
    <Fragment>
      The token <Fail value="was valid" /> at {delta} window(s).
    </Fragment>
  );
};

const TokenValidate = () => {
  const { authenticator } = window.otplib;
  const { secret } = useContext(SecretContext);
  const [token, setToken] = useState('');
  const [delta, setDelta] = useState(null);

  useEffect(() => {
    authenticator.options = {
      window: [2, 2]
    };
  }, []);

  useEffect(() => {
    setDelta(authenticator.checkDelta(`${token}`, secret));
  }, [token]);

  return (
    <Fragment>
      <RowLabel />
      <RowContent>
        <Input
          className={styles.input}
          onChange={evt => setToken(evt.target.value)}
          maxLength={6}
          value={token}
          placeholder="000000"
        />
        <span className={styles.message}>
          <Message delta={delta} token={token} />
        </span>
      </RowContent>
      <RowAction />
    </Fragment>
  );
};

export default TokenValidate;
