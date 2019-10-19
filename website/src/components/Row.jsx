import React from 'react';
import styles from './Row.module.css';

export const Row = props => {
  return (
    <div className={`${styles.container} ${props.className}`}>
      {props.children}
    </div>
  );
};

export const RowLabel = props => {
  return (
    <div className={`${styles.label} ${props.className}`}>
      <h3>{props.children}</h3>
    </div>
  );
};

export const RowContent = props => {
  return (
    <div className={`${styles.content} ${props.className}`}>
      {props.children}
    </div>
  );
};

export const RowAction = props => {
  return (
    <div className={`${styles.action} ${props.className}`}>
      {props.children}
    </div>
  );
};
