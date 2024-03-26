import{b as g}from"./index.modern-CvnqY6Qc.js";import{r as a}from"./index-BBkUAzwr.js";/* empty css                  */import{m as d}from"./mapbox-gl-MdAd9xHE.js";import{L as c,b as l}from"./map-InHQedIc.js";import"./index-DtBkkNk_.js";import"./index-DwtI8WR9.js";import"./axios-Bqepj0vs.js";import"./tslib.es6-ChmHIYM0.js";import"./index-PqR-_bA4.js";import"./index-BHADXxHn.js";import"./ResizeObserver-CGzHS_VR.js";import"./assertThisInitialized-CtXiITI_.js";import"./removeClass-BFK1mqj1.js";import"./clsx.m-irjavGej.js";import"./unitless.browser.esm-CW87jbl0.js";import"./iconSvgPaths-uSutIUG7.js";const P="_latlnginputs_1vmme_1",L={latlnginputs:P},i=g(L);d.accessToken="pk.eyJ1IjoidGhlZmFsbGluZ2R1Y2siLCJhIjoiY2tsOHAzeDZ6MWtsaTJ2cXhpMDAxc3k5biJ9.FUMK57K0UP7PSrTUi3DiFQ";const U={title:"Form-Components/Geographic",component:c,subcomponents:{LngLatInputs:l},args:{}};function h(t){let[n,r]=t.geometry.coordinates;t.geometry.coordinates=[parseFloat(n.toPrecision(7)),parseFloat(r.toPrecision(7))]}function e(t){const[n,r]=a.useState({geometry:{coordinates:[t.longitude,t.latitude],type:"Point"},id:"",properties:{},type:"Feature"}),s=o=>{h(o),r(o)};return a.useEffect(()=>{var o;(o=t.onChange)==null||o.call(t,n)},[n]),i("div",[i(c,{point:n,setPoint:s}),i("div.latlnginputs",[i(l,{point:n,setPoint:s})])])}e.args={longitude:-89,latitude:43,onChange:t=>console.log(t)};var p,m,u;e.parameters={...e.parameters,docs:{...(p=e.parameters)==null?void 0:p.docs,source:{originalSource:`function LngLatForm(props: {
  longitude: number;
  latitude: number;
  onChange: (p: Point) => void;
}) {
  const [point, setPoint] = useState<Point>({
    geometry: {
      coordinates: [props.longitude, props.latitude],
      type: "Point"
    },
    id: "",
    properties: {},
    type: "Feature"
  });
  const setPoint_ = (p: Point) => {
    roundCoordinates(p);
    setPoint(p);
  };
  useEffect(() => {
    props.onChange?.(point);
  }, [point]);
  return h("div", [h(LngLatMap, {
    point,
    setPoint: setPoint_
  }), h("div.latlnginputs", [h(LngLatInputs, {
    point,
    setPoint: setPoint_
  })])]);
}`,...(u=(m=e.parameters)==null?void 0:m.docs)==null?void 0:u.source}}};const Z=["LngLatForm"];export{e as LngLatForm,Z as __namedExportsOrder,U as default};
