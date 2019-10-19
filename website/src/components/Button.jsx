import React from 'react';
import styles from './Button.module.css';

const Button = ({ active, ...props }) => {
  return (
    <button
      {...props}
      className={`${styles.btn} ${active ? styles.active : ''}`}
    >
      {props.children}
    </button>
  );
};

export default Button;
