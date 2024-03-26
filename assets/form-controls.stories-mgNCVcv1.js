import{m as l}from"./index.modern-CqpcyjV2.js";import{u as p}from"./chunk-2WNKQWTL-DaoWLbBh.js";import"./index-BBkUAzwr.js";import"./index-DtBkkNk_.js";function m(o){const{component:n="a",isOn:e,toggle:t,name:r,...c}=o;return l(n,{onClick:()=>{t(!e)},...c},[e?"Hide":"Show"," ",r])}const A={title:"Controls/SimpleToggle",component:m,args:{name:"value",isOn:!0,toggle:()=>{}}},u=o=>{const[{isOn:n,...e},t]=p();return l(m,{...e,isOn:n,toggle:()=>t({isOn:!n,...e})})},s=u.bind({});s.args={name:"layer"};var g,a,i;s.parameters={...s.parameters,docs:{...(g=s.parameters)==null?void 0:g.docs,source:{originalSource:`args => {
  const [{
    isOn,
    ...rest
  }, updateArgs] = useArgs();
  const toggle = () => updateArgs({
    isOn: !isOn,
    ...rest
  });
  return h(SimpleToggle, {
    ...rest,
    isOn,
    toggle
  });
}`,...(i=(a=s.parameters)==null?void 0:a.docs)==null?void 0:i.source}}};const S=["TestToggle"];export{s as TestToggle,S as __namedExportsOrder,A as default};
