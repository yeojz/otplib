import React, { useContext } from 'react';
import { SecretContext } from './SecretStore';
import styles from './Secret.module.css';
import { Row, RowAction, RowLabel, RowContent } from './Row';
import Input from './Input';
import Button from './Button';

const Secret = () => {
  const { secret, generateSecret } = useContext(SecretContext);
  return (
    <Row>
      <RowLabel>Demo Secret</RowLabel>

      <RowContent>
        <Input value={secret || 'Loading...'} />
      </RowContent>

      <RowAction>
        <Button
          onClick={generateSecret}
          className={styles.regenerate}
          disabled={!secret}
        >
          Generate
        </Button>
      </RowAction>
    </Row>
  );
};

export default Secret;
