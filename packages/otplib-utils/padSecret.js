function padSecret(secret, size) {
  const len = secret.length;

  if (size && len < size) {
    const newSecret = new Array((size - len) + 1).join(secret.toString('hex'));
    return new Buffer(newSecret, 'hex').slice(0, size);
  }

  return secret;
}

export default padSecret;
