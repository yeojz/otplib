import React, { Fragment, useContext, useState, useEffect } from 'react';
import qrcode from 'qrcode';
import { SecretContext } from './SecretStore';
import { RowLabel, RowContent, RowAction } from './Row';

const QRScan = () => {
  const [image, setImage] = useState();
  const { secret } = useContext(SecretContext);

  useEffect(() => {
    if (!secret) {
      setImage('');
      return;
    }

    const otpauth = window.otplib.authenticator.keyuri(
      'otplib-demo-user',
      'otplib-website',
      secret
    );

    qrcode.toDataURL(otpauth, (err, imageUrl) => {
      if (err) {
        setImage('');
        return;
      }

      setImage(imageUrl);
    });
  }, [secret]);

  return (
    <Fragment>
      <RowLabel />
      <RowContent>
        {image && <img src={image} alt="" />}
        <p>
          Scan this QR Code image with Google Authenticator, Authy or any other
          compatible 2FA app.
        </p>
      </RowContent>
      <RowAction />
    </Fragment>
  );
};

export default QRScan;
