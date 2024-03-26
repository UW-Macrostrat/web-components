import{m as t}from"./index.modern-CqpcyjV2.js";import"./index-BBkUAzwr.js";import"./index-DtBkkNk_.js";const u=""+new URL("sunrift-gorge-v1-1-DJKM1hDk.jpg",import.meta.url).href,l=Object.freeze(Object.defineProperty({__proto__:null,default:u},Symbol.toStringTag,{value:"Module"})),f=""+new URL("sunrift-gorge-v1-2-BdVjKC6O.jpg",import.meta.url).href,p=Object.freeze(Object.defineProperty({__proto__:null,default:f},Symbol.toStringTag,{value:"Module"})),c=""+new URL("sunrift-gorge-v1-3-DID4T6Uq.jpg",import.meta.url).href,_=Object.freeze(Object.defineProperty({__proto__:null,default:c},Symbol.toStringTag,{value:"Module"})),m=""+new URL("sunrift-gorge-v1-4-DoAOkh9G.jpg",import.meta.url).href,d=Object.freeze(Object.defineProperty({__proto__:null,default:m},Symbol.toStringTag,{value:"Module"})),v=""+new URL("sunrift-gorge-v1-5-B1ylv7Z_.jpg",import.meta.url).href,j=Object.freeze(Object.defineProperty({__proto__:null,default:v},Symbol.toStringTag,{value:"Module"})),b=Object.assign({"./sunrift-gorge-photos/sunrift-gorge-v1-1.jpg":l,"./sunrift-gorge-photos/sunrift-gorge-v1-2.jpg":p,"./sunrift-gorge-photos/sunrift-gorge-v1-3.jpg":_,"./sunrift-gorge-photos/sunrift-gorge-v1-4.jpg":d,"./sunrift-gorge-photos/sunrift-gorge-v1-5.jpg":j});function S({images:o,width:n,inset:r}){return t("div.images",{style:{display:"flex",flexDirection:"column-reverse"}},o.map(a=>t("div",{style:{overflow:"hidden"}},[t("img",{src:a,style:{width:n,marginTop:-r,marginBottom:-r}})])))}function e({generalized:o=!1,sequenceStratigraphy:n=!0}){return t(S,{width:320,images:Object.values(b).map(r=>r.default),inset:36})}const G={title:"Column components/Sunrift Gorge",component:e,args:{generalized:!1,sequenceStratigraphy:!0}};var g,i,s;e.parameters={...e.parameters,docs:{...(g=e.parameters)==null?void 0:g.docs,source:{originalSource:`function SunriftGorgeSection({
  generalized = false,
  sequenceStratigraphy = true
}: SunriftGorgeProps) {
  // return h(MeasuredSection, { range: [0, 30], pixelScale: 100 }, [
  //   h(ImageBackdrop, {
  //     width: 320,
  //     images: Object.values(images).map((val) => val.default),
  //     inset: 36,
  //   }),
  // ]);
  return h(ImageBackdrop, {
    width: 320,
    images: Object.values(images).map(val => val.default),
    inset: 36
  });
}`,...(s=(i=e.parameters)==null?void 0:i.docs)==null?void 0:s.source}}};const w=["SunriftGorgeSection"];export{e as SunriftGorgeSection,w as __namedExportsOrder,G as default};
