import{r as _}from"./index-BBkUAzwr.js";import{b as H,m}from"./index.modern-CvnqY6Qc.js";import{a as w}from"./index-DwtI8WR9.js";import{S as C}from"./spinner-CC0I4b9P.js";import"./index-DtBkkNk_.js";import"./axios-Bqepj0vs.js";import"./tslib.es6-ChmHIYM0.js";const E="_active_1t6em_15",G="_badge_1t6em_47",N={"name-hierarchy":"_name-hierarchy_1t6em_1","hierarchy-container":"_hierarchy-container_1t6em_8",active:E,"hierarchy-name":"_hierarchy-name_1t6em_20","hierarchy-link":"_hierarchy-link_1t6em_25","hierarchy-children":"_hierarchy-children_1t6em_35",badge:G},h=H(N);function p(r){const{subhierarchy:a=[],units:t=0,name:s,active:i=!1,onClick:e=c=>{}}=r;return h(`div.hierarchy-container  ${i?".active":""}`,{onClick:e},[h("div.hierarchy-name",[s,h("span.badge",[t])]),h.if(a.length>0)("div.hierarchy-children",[a.map((c,o)=>h(p,{...c,key:o}))])])}const x="https://macrostrat.org/api/v2/defs/strat_names";var f={SGp:null,Gp:"sgp",SubGp:"gp",Fm:"subgp",Mbr:"fm",Bed:"mbr",1:null,2:"sgp",3:"gp",4:"subgp",5:"fm",6:"mbr"},D={SGp:1,Gp:2,SubGp:3,Fm:4,Mbr:5,Bed:6};const M=async r=>{const a=await w.get(x,{params:{rule:"all",strat_name_id:r}});if(a.status!=200)return a.data;const t=a.data.success.data;t.forEach(e=>{e.active=!1,e.strat_name_id==r&&(e.active=!0),e.children=[],e.totalChildren=t.filter(n=>{if(n[e.rank.toLowerCase()+"_id"]==e.strat_name_id)return n}).length-1,e.total=e.totalChildren}),t.forEach(e=>{for(var n=e[f[e.rank]+"_id"],c=1;n===0;)n=e[f[D[e.rank]-c]+"_id"],c--;t.forEach(o=>{o.strat_name_id==n&&o.strat_name_id!=e.strat_name_id&&o.children.push(e)})});const s=t.sort((e,n)=>n.totalChildren-e.totalChildren)[0];return k(s)},k=r=>{const a={};return a.name=r.strat_name_long,a.units=r.t_units,a.active=r.active,a.onClick=t=>{var i;t.preventDefault();const s=`https://macrostrat.org/sift/#/strat_name/${r.strat_name_id}`;(i=window==null?void 0:window.open(s,"_blank"))==null||i.focus()},a.subhierarchy=r.children.map(t=>k(t)),a},R={name:"Rocks",subhierarchy:[{name:"Igneous",units:10,active:!1,subhierarchy:[{name:"Rhyolite",units:2,active:!0,subhierarchy:[]},{name:"Granite",units:5,active:!1,subhierarchy:[]}]},{name:"Sedimentary",units:100,active:!1,subhierarchy:[{name:"Limestone",units:2,active:!1,subhierarchy:[]},{name:"Sandstone",units:5,active:!1,subhierarchy:[{name:"arkose",units:2,active:!1,subhierarchy:[]}]}]}],active:!1,units:120},q={title:"Data-components/Hierarchy",component:p,args:{}},T=r=>m(p,{...r}),u=T.bind({});u.args=R;function l({strat_name_id:r}){const[a,t]=_.useState();return console.log(a),_.useEffect(()=>{async function s(){const i=await M(r);t(i)}s()},[r]),typeof a>"u"?m(C):m("div",[m("h3",["A strat name hierarchy from macrostrat for ",a.name]),m(p,{...a})])}l.args={strat_name_id:88021};var y,d,v;u.parameters={...u.parameters,docs:{...(y=u.parameters)==null?void 0:y.docs,source:{originalSource:`args => h(Hierarchy, {
  ...args
})`,...(v=(d=u.parameters)==null?void 0:d.docs)==null?void 0:v.source}}};var b,g,S;l.parameters={...l.parameters,docs:{...(b=l.parameters)==null?void 0:b.docs,source:{originalSource:`function StratNameHierarchy({
  strat_name_id
}: {
  strat_name_id: number;
}) {
  const [state, setState] = useState<IHierarchy>();
  console.log(state);
  useEffect(() => {
    async function fetch() {
      const res = await fetchStratNames(strat_name_id);
      setState(res);
    }
    fetch();
  }, [strat_name_id]);
  if (typeof state === "undefined") {
    return h(Spinner);
  }
  return h("div", [h("h3", ["A strat name hierarchy from macrostrat for ", state.name]), h(Hierarchy, {
    ...state
  })]);
}`,...(S=(g=l.parameters)==null?void 0:g.docs)==null?void 0:S.source}}};const z=["SimpleHierarchy","StratNameHierarchy"];export{u as SimpleHierarchy,l as StratNameHierarchy,z as __namedExportsOrder,q as default};
