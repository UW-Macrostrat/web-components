function i(){return i=Object.assign?Object.assign.bind():function(t){for(var e=1;e<arguments.length;e++){var r=arguments[e];for(var n in r)Object.prototype.hasOwnProperty.call(r,n)&&(t[n]=r[n])}return t},i.apply(this,arguments)}function o(t,e){return o=Object.setPrototypeOf?Object.setPrototypeOf.bind():function(n,a){return n.__proto__=a,n},o(t,e)}function c(t,e){t.prototype=Object.create(e.prototype),t.prototype.constructor=t,o(t,e)}function p(t){if(t===void 0)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return t}export{c as _,i as a,p as b,o as c};
