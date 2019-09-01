/* eslint-disable @typescript-eslint/explicit-function-return-type */
import {
  HOTP as HOTPNext,
  TOTP as TOTPNext,
  Authenticator as AuthenticatorNext
} from '@otplib/core';

export function epochUnixToJS(opt = {}) {
  if (!opt || typeof opt !== 'object') {
    return {};
  }

  const { epoch, ...others } = opt;

  if (epoch === null) {
    return others;
  }

  if (typeof epoch === 'number') {
    return {
      ...opt,
      epoch: opt.epoch * 1000
    };
  }

  return opt;
}

export function epochJSToUnix(opt = {}) {
  if (!opt || typeof opt !== 'object') {
    return {};
  }

  const { epoch, ...others } = opt;

  if (epoch === null) {
    return others;
  }

  if (typeof epoch === 'number') {
    return {
      ...opt,
      epoch: epoch / 1000
    };
  }

  return opt;
}

export function createV11(Base, legacyOptions) {
  class Legacy extends Base {
    constructor(defaultOptions = {}) {
      super(epochUnixToJS({ ...legacyOptions, ...defaultOptions }));
      console.warn(Base.name, 'initialised with v11.x adapter');
    }

    static get name() {
      // Overrides the derived class name
      return Base.name;
    }

    set options(opt = {}) {
      console.warn(
        Base.name,
        '.options setter will remove UNIX epoch if it is set to null.' +
          '\n Do note that library versions above v11.x uses JavaScript epoch.'
      );
      super.options = epochUnixToJS(opt);
    }

    get options() {
      console.warn(
        Base.name,
        '.options getter will remove epoch if it is set to null' +
          '\n Do note that library versions above v11.x uses JavaScript epoch.'
      );
      return epochJSToUnix(super.options);
    }

    get defaultOptions() {
      console.warn(
        Base.name,
        '.defaultOptions getter has been deprecated in favour of the .options getter' +
          '\n\n The .options getter now returns the combined defaultOptions and options values' +
          'instead of setting options when adding defaultOptions.'
      );

      return Object.freeze(epochJSToUnix(this._defaultOptions));
    }

    set defaultOptions(opt) {
      console.warn(
        Base.name,
        '.defaultOptions setter has been deprecated in favour of the .clone(defaultOptions) method'
      );
      this._defaultOptions = Object.freeze({
        ...this._defaultOptions,
        ...epochUnixToJS(opt)
      });
    }

    get optionsAll() {
      console.warn(
        Base.name,
        '.optionsAll getter has been deprecated in favour of the .allOptions() method.' +
          '\n That epoch returned here will be in Unix Epoch, while .allOptions()' +
          ' will return JavaScript epoch.' +
          '\n Do note that library versions above v11.x uses JavaScript epoch.'
      );
      return epochJSToUnix(this.allOptions());
    }

    allOptions() {
      return epochUnixToJS(super.allOptions());
    }

    getClass() {
      return Legacy;
    }

    verify(opts) {
      if (!opts || typeof opts !== 'object') {
        return false;
      }

      try {
        return super.verify(opts);
      } catch (err) {
        return false;
      }
    }
  }

  Legacy.prototype[Base.name] = Legacy;
  return Legacy;
}

export const HOTP = createV11(HOTPNext, {});

export const TOTP = createV11(TOTPNext, {
  epoch: null,
  step: 30,
  window: 0
});

export const Authenticator = createV11(AuthenticatorNext, {
  encoding: 'hex',
  epoch: null,
  step: 30,
  window: 0
});
