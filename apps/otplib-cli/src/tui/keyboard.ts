import readline from "node:readline";

export type Key = {
  name: string;
  ctrl: boolean;
  meta: boolean;
  shift: boolean;
  sequence: string;
};

export type KeyHandler = (key: Key) => void;

export function createKeyboardReader(
  input: NodeJS.ReadStream,
  onKey: KeyHandler,
): { close: () => void } {
  readline.emitKeypressEvents(input);

  if (input.isTTY) {
    input.setRawMode(true);
  }

  const handler = (_char: string, key: Key | undefined) => {
    if (key) {
      onKey(key);
    }
  };

  input.on("keypress", handler);
  input.resume();

  return {
    close: () => {
      input.removeListener("keypress", handler);
      if (input.isTTY) {
        input.setRawMode(false);
      }
      input.pause();
    },
  };
}

export function isKey(key: Key, name: string, ctrl = false): boolean {
  return key.name === name && key.ctrl === ctrl;
}
