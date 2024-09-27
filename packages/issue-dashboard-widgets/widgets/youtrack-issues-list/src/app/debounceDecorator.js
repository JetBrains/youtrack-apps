class DebounceDecorator {
  // eslint-disable-next-line no-magic-numbers
  static REQUEST_DELAY = 150;
  static CANCEL_PROMISE_REASON = 'cancelled';

  decorate(call) {
    return new Promise((resolve, reject) => {
      if (this.lastTimeOut) {
        clearTimeout(this.lastTimeOut);
        this.reject && this.reject(DebounceDecorator.CANCEL_PROMISE_REASON);
      }
      this.reject = reject;
      this.lastTimeOut = setTimeout(() => {
        resolve(call());
      }, DebounceDecorator.REQUEST_DELAY);
    }).catch(reason => {
      if (reason !== DebounceDecorator.CANCEL_PROMISE_REASON) {
        throw reason;
      }
    });
  }
}

export default DebounceDecorator;
