function totpCounter(epoch, step) {
  return Math.floor(epoch / (step * 1000.0));
}

export default totpCounter;
