function createClassStub(callback) {
  class ClassStub {
    constructor() {
      console.log('here');
      if (callback) {
        callback()
      }
    }
  }

  return ClassStub;
}

export default createClassStub;
