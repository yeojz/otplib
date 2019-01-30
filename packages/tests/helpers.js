export function resetObjectMocks(obj) {
  Object.keys(obj).forEach(name => obj[name].mockReset());
}
