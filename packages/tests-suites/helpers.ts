/* eslint-disable @typescript-eslint/ban-ts-ignore */
import { OTP, HashAlgorithms } from '../otplib-core';

export interface GenericFunction {
  (...args: unknown[]): unknown;
}

export function getClassProperties(instance: OTP): string[] {
  // @ts-ignore
  const proto = Object.getOwnPropertyNames(instance.__proto__);
  const keys = Object.getOwnPropertyNames(instance);
  return [...proto, ...keys].sort();
}

export function testClassPropertiesEqual<T extends OTP, S extends OTP>(
  leftName: string,
  left: T,
  rightName: string,
  right: S
): void {
  test(`key parity between ${leftName} and ${rightName}`, (): void => {
    expect(getClassProperties(left)).toEqual(getClassProperties(right));
  });
}

export function runOptionValidator<T>(
  validator: (opt: Partial<T>) => void,
  opt: Partial<T>
): { error: boolean; message?: string } {
  try {
    validator(opt);
    return { error: false };
  } catch (err) {
    return { error: true, message: err.message };
  }
}

export function formatRFC6238Table(
  table: {
    epoch: number;
    counter: string;
    token: string;
    algorithm: string;
  }[]
): {
  epoch: number;
  counter: string;
  token: string;
  algorithm: HashAlgorithms;
}[] {
  return table.map(row => {
    let algorithm: HashAlgorithms;

    switch (row.algorithm) {
      case 'SHA1':
        algorithm = HashAlgorithms.SHA1;
        break;
      case 'SHA256':
        algorithm = HashAlgorithms.SHA256;
        break;
      case 'SHA512':
        algorithm = HashAlgorithms.SHA512;
        break;
      default:
        throw new Error('Unsupported Algorithm in tests');
    }

    return {
      ...row,
      algorithm
    };
  });
}
