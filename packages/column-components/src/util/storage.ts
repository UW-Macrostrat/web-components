/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
export class LocalStorage {
  constructor(name) {
    this.get = this.get.bind(this);
    this.set = this.set.bind(this);
    this.name = name;
  }
  get() {
    const str = window.localStorage.getItem(this.name);
    const obj = JSON.parse(str);
    return obj;
  }
  set(obj) {
    const str = JSON.stringify(obj);
    return window.localStorage.setItem(this.name, str);
  }
}
