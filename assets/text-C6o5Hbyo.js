import{_ as h,a as x,b as r}from"./tslib.es6-ChmHIYM0.js";import{c as v}from"./index-DtBkkNk_.js";import{r as _}from"./index-BBkUAzwr.js";import{T as N,D as C,A as g}from"./buttons-CKwIiXPX.js";var P=function(s){h(e,s);function e(){var t=s!==null&&s.apply(this,arguments)||this;return t.state={isContentOverflowing:!1,textContent:""},t.textRef=null,t}return e.prototype.componentDidMount=function(){this.update()},e.prototype.componentDidUpdate=function(){this.update()},e.prototype.render=function(){var t,n=this,i=this.props,l=i.children,p=i.className,c=i.ellipsize,o=i.tagName,f=o===void 0?"div":o,a=i.title,m=x(i,["children","className","ellipsize","tagName","title"]),u=v(p,(t={},t[N]=c,t));return _.createElement(f,r(r({},m),{className:u,ref:function(d){return n.textRef=d},title:a??(this.state.isContentOverflowing?this.state.textContent:void 0)}),l)},e.prototype.update=function(){var t;if(((t=this.textRef)===null||t===void 0?void 0:t.textContent)!=null){var n={isContentOverflowing:this.props.ellipsize&&this.textRef.scrollWidth>this.textRef.clientWidth,textContent:this.textRef.textContent};this.setState(n)}},e.displayName="".concat(C,".Text"),e.defaultProps={ellipsize:!1},e}(g);export{P as T};
