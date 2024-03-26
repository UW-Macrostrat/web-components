import{m as o,b as T}from"./index.modern-CqpcyjV2.js";import{r as n}from"./index-BBkUAzwr.js";import{r as C}from"./index-PqR-_bA4.js";import{T as g,u as v,_ as y}from"./toaster-CUxSLCcg.js";import"./index-DtBkkNk_.js";import{b as B}from"./buttons-CKwIiXPX.js";import"./index-_4_hgnnR.js";import"./index-BQ5IbGbl.js";import"./tslib.es6-ChmHIYM0.js";import"./overlay-j4w1GPD7.js";import"./TransitionGroup-BEjLb10U.js";import"./assertThisInitialized-CtXiITI_.js";import"./removeClass-BFK1mqj1.js";import"./buttonGroup-Dyi9Gksa.js";import"./iconSvgPaths-uSutIUG7.js";const d=n.createContext(null);function b({containerRef:e,setToaster:t,...r}){const s=o(g,{usePortal:!1,ref:a=>t(a),...r});return(e==null?void 0:e.current)==null?s:C.createPortal(s,e.current)}function x(e){const{children:t,toasts:r,containerRef:s,...a}=e,[c,p]=n.useState(null);return o(d.Provider,{value:c},[o(b,{containerRef:s,setToaster:p,...a},r),t])}function R(){return n.useContext(d)}class q extends n.Component{constructor(t){console.warn("StatefulComponent is deprecated. Use useImmutableState instead."),super(t),this.updateState.bind(this)}updateState(t){const r=v(this.state,t);this.setState(r)}}q.__docgenInfo={description:"",methods:[{name:"updateState",docblock:null,modifiers:[],params:[{name:"spec",optional:!1,type:{name:"Spec",elements:[{name:"State"}],raw:"Spec<State>",alias:"Spec"}}],returns:null}],displayName:"StatefulComponent"};const h={"json-view-container":"_json-view-container_1q8ih_1","root-hidden":"_root-hidden_1q8ih_1","flex-row":"_flex-row_1q8ih_5","flex-col":"_flex-col_1q8ih_10","flex-spacer":"_flex-spacer_1q8ih_15"};T(h);const _=o.styled(h),l=y,w=n.forwardRef((e,t)=>{const{grow:r,shrink:s,className:a,style:c,textAlign:p,...S}=e;return _(l,{className:a,flexGrow:r,flexShrink:s,...S})});function G(e){return _(w,{display:"flex",flexDirection:"row",...e})}w.__docgenInfo={description:"",methods:[],displayName:"FlexBox"};const J={title:"UI components/Toaster",component:x};function P(){const e=R(),t=n.useRef(1);return o(B,{disabled:e==null,onClick:()=>{e.show({message:`Hello planet ${t.current}`}),t.current+=1}},["Show toast"])}const i={render:()=>{const e=n.useRef(null);return o(x,{containerRef:e},[o(G,{gap:10},[o(P),o(l,{flexGrow:1,innerRef:e,position:"relative"},[o(l,{is:"p",textAlign:"center"},"Toasts will be overlaid over this container")])])])}};var u,m,f;i.parameters={...i.parameters,docs:{...(u=i.parameters)==null?void 0:u.docs,source:{originalSource:`{
  render: () => {
    const containerRef = useRef<HTMLElement>(null);
    return h(ToasterContext, {
      containerRef
    }, [h(FlexRow, {
      gap: 10
    }, [h(GetToastButton), h(Box, {
      flexGrow: 1,
      innerRef: containerRef,
      position: "relative"
    }, [h(Box, {
      is: "p",
      textAlign: "center"
    }, "Toasts will be overlaid over this container")])])]);
  }
}`,...(f=(m=i.parameters)==null?void 0:m.docs)==null?void 0:f.source}}};const K=["Primary"];export{i as Primary,K as __namedExportsOrder,J as default};
