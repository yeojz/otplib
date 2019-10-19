import { epochUnixToJS, epochJSToUnix } from './v11';

test('should return empty object if argument is non-object', () => {
  expect(epochUnixToJS()).toEqual({});
  expect(epochUnixToJS(null)).toEqual({});

  expect(epochJSToUnix()).toEqual({});
  expect(epochJSToUnix(null)).toEqual({});
});

test('should return without epoch if NULL epoch found', () => {
  expect(epochUnixToJS({ epoch: null })).toEqual({});

  expect(epochJSToUnix({ epoch: null })).toEqual({});
});

test('should return AS-IS if no epoch found', () => {
  expect(epochUnixToJS({})).toEqual({});

  expect(epochJSToUnix({})).toEqual({});
});

test('should return js epoch', () => {
  expect(epochUnixToJS({ epoch: 1 })).toEqual({ epoch: 1000 });
});

test('should return unix epoch', () => {
  expect(epochJSToUnix({ epoch: 1000 })).toEqual({ epoch: 1 });
});
