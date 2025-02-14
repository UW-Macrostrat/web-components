export class LocalStorage {
  name: string;
  constructor(name) {
    this.get = this.get.bind(this);
    this.set = this.set.bind(this);
    this.name = name;
  }
  get(): object {
    const str = window.localStorage.getItem(this.name);
    return JSON.parse(str) as object;
  }
  set(obj: object) {
    const str = JSON.stringify(obj);
    return window.localStorage.setItem(this.name, str);
  }
}
