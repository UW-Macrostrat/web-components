function __vite__mapDeps(indexes) {
  if (!__vite__mapDeps.viteFileDeps) {
    __vite__mapDeps.viteFileDeps = ["./DocsRenderer-K4EAMTCU-e2lOg0hk.js","./iframe-DGfY3tjN.js","./index-BBkUAzwr.js","./client-CK1KAkj4.js","./index-PqR-_bA4.js","./index-Cnf7dsQe.js","./_baseAssignValue-CoIWEOUD.js","./_initCloneObject-CeqP1Y0d.js","./assertThisInitialized-CtXiITI_.js","./index-C-I6vmrZ.js","./getPrototypeOf-BYVhAdwF.js","./cloneDeep-9TMxW8q_.js","./index-DCWgdmFy.js","./mapValues-XiJZ_ddC.js","./index-DrFu-skq.js"]
  }
  return indexes.map((i) => __vite__mapDeps.viteFileDeps[i])
}
import{_ as a}from"./iframe-DGfY3tjN.js";import"../sb-preview/runtime.js";const{global:s}=__STORYBOOK_MODULE_GLOBAL__;var _=Object.entries(s.TAGS_OPTIONS??{}).reduce((e,r)=>{let[t,o]=r;return o.excludeFromDocsStories&&(e[t]=!0),e},{}),n={docs:{renderer:async()=>{let{DocsRenderer:e}=await a(()=>import("./DocsRenderer-K4EAMTCU-e2lOg0hk.js").then(r=>r.D),__vite__mapDeps([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14]),import.meta.url);return new e},stories:{filter:e=>{var r;return(e.tags||[]).filter(t=>_[t]).length===0&&!((r=e.parameters.docs)!=null&&r.disable)}}}};export{n as parameters};
