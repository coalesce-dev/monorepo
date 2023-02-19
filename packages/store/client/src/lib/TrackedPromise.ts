export class TrackedPromise<T> {
  private readonly _promise: Promise<T>;
  private _complete = false;

  public then: Promise<T>['then'];

  constructor(promise: Promise<T>) {
    this._promise = promise;
    promise.then(() => {
      this._complete = true;
    });
    this.then = promise.then.bind(promise);
  }

  get promise() {
    return this._promise;
  }

  get isComplete() {
    return this._complete;
  }
}
