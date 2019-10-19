import React, { Fragment, useState, useContext } from 'react';
import Button from './Button';
import QRScan from './QRScan';
import TokenGet from './TokenGet';
import TokenValidate from './TokenValidate';
import { Row, RowLabel, RowContent, RowAction } from './Row';
import { SecretContext } from './SecretStore';
import styles from './ActionTabs.module.css';

const TAB_QR = 'qr';
const TAB_VALIDATE = 'validate';
const TAB_GENERATE = 'generate';

const DEFAULT_TAB = TAB_QR;

const Tab = props => (
  <Button
    active={props.active === props.name}
    disabled={props.disabled}
    name={props.name}
    onClick={props.onToggle}
  >
    {props.children}
  </Button>
);

const TabContent = ({ tab }) => {
  if (tab === TAB_QR) {
    return <QRScan />;
  }

  if (tab === TAB_GENERATE) {
    return <TokenGet />;
  }

  if (tab === TAB_VALIDATE) {
    return <TokenValidate />;
  }

  return null;
};

const ActionTabs = () => {
  const [tab, setTab] = useState(DEFAULT_TAB);
  const { secret } = useContext(SecretContext);

  const tabProps = {
    onToggle: evt => setTab(evt.target.name),
    active: tab,
    disabled: !secret
  };

  return (
    <Fragment>
      <Row>
        <RowLabel>Actions</RowLabel>

        <RowContent>
          <Tab {...tabProps} name={TAB_QR}>
            Scan QR
          </Tab>
          <Tab {...tabProps} name={TAB_GENERATE}>
            Get Token
          </Tab>
          <Tab {...tabProps} name={TAB_VALIDATE}>
            Verify Token
          </Tab>
        </RowContent>

        <RowAction />
      </Row>

      {secret && (
        <Row className={styles.content}>
          <TabContent tab={tab} />
        </Row>
      )}
    </Fragment>
  );
};

export default ActionTabs;
