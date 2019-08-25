import React from 'react';
import styles from './Input.module.css';

const noop = () => null;

const Input = props => {
  return (
    <div className={styles.container}>
      <input
        {...props}
        className={`${styles.input} ${props.className}`}
        value={props.value}
        onChange={props.onChange || noop}
      />
    </div>
  );
};

export default Input;
