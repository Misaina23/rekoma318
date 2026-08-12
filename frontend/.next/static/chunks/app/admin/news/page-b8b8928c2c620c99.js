(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[229],{5531:function(e,t,r){"use strict";r.d(t,{Z:function(){return createLucideIcon}});var a=r(2265);/**
 * @license lucide-react v0.400.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let toKebabCase=e=>e.replace(/([a-z0-9])([A-Z])/g,"$1-$2").toLowerCase(),mergeClasses=(...e)=>e.filter((e,t,r)=>!!e&&r.indexOf(e)===t).join(" ");/**
 * @license lucide-react v0.400.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */var n={xmlns:"http://www.w3.org/2000/svg",width:24,height:24,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round"};/**
 * @license lucide-react v0.400.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let s=(0,a.forwardRef)(({color:e="currentColor",size:t=24,strokeWidth:r=2,absoluteStrokeWidth:s,className:l="",children:c,iconNode:d,...i},o)=>(0,a.createElement)("svg",{ref:o,...n,width:t,height:t,stroke:e,strokeWidth:s?24*Number(r)/Number(t):r,className:mergeClasses("lucide",l),...i},[...d.map(([e,t])=>(0,a.createElement)(e,t)),...Array.isArray(c)?c:[c]])),createLucideIcon=(e,t)=>{let r=(0,a.forwardRef)(({className:r,...n},l)=>(0,a.createElement)(s,{ref:l,iconNode:t,className:mergeClasses(`lucide-${toKebabCase(e)}`,r),...n}));return r.displayName=`${e}`,r}},6637:function(e,t,r){"use strict";r.d(t,{Z:function(){return n}});var a=r(5531);/**
 * @license lucide-react v0.400.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let n=(0,a.Z)("FileText",[["path",{d:"M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z",key:"1rqfz7"}],["path",{d:"M14 2v4a2 2 0 0 0 2 2h4",key:"tnqrlb"}],["path",{d:"M10 9H8",key:"b1mrlr"}],["path",{d:"M16 13H8",key:"t4e002"}],["path",{d:"M16 17H8",key:"z1uh3a"}]])},9591:function(e,t,r){"use strict";r.d(t,{Z:function(){return n}});var a=r(5531);/**
 * @license lucide-react v0.400.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let n=(0,a.Z)("Images",[["path",{d:"M18 22H4a2 2 0 0 1-2-2V6",key:"pblm9e"}],["path",{d:"m22 13-1.296-1.296a2.41 2.41 0 0 0-3.408 0L11 18",key:"nf6bnh"}],["circle",{cx:"12",cy:"8",r:"2",key:"1822b1"}],["rect",{width:"16",height:"16",x:"6",y:"2",rx:"2",key:"12espp"}]])},5462:function(e,t,r){"use strict";r.d(t,{Z:function(){return n}});var a=r(5531);/**
 * @license lucide-react v0.400.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let n=(0,a.Z)("Newspaper",[["path",{d:"M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2",key:"7pis2x"}],["path",{d:"M18 14h-8",key:"sponae"}],["path",{d:"M15 18h-5",key:"95g1m2"}],["path",{d:"M10 6h8v4h-8V6Z",key:"smlsk5"}]])},150:function(e,t,r){Promise.resolve().then(r.bind(r,1901))},1901:function(e,t,r){"use strict";r.r(t),r.d(t,{default:function(){return NewsAdminPage}});var a=r(7437),n=r(7922),s=r(8331);function NewsAdminPage(){let{t:e}=(0,n.Q)();return(0,a.jsx)(s.x,{kind:"news",note:"Le CMS d'actualit\xe9s (articles, cat\xe9gories, \xe9diteur riche, brouillons, SEO, traduction FR/EN) est pr\xeat \xe0 \xeatre branch\xe9 sur le store. Les routes API et le mod\xe8le de donn\xe9es sont en place."})}},8331:function(e,t,r){"use strict";r.d(t,{x:function(){return ModulePlaceholder}});var a=r(7437),n=r(5462),s=r(9591),l=r(6637),c=r(7922),d=r(9598);let i={news:n.Z,gallery:s.Z,documents:l.Z};function ModulePlaceholder(e){let{kind:t,note:r}=e,{t:n}=(0,c.Q)(),s=i[t];return(0,a.jsxs)("div",{className:"space-y-5",children:[(0,a.jsx)("h1",{className:"text-2xl font-bold",children:n.admin.nav[t]}),(0,a.jsx)(d.Zb,{children:(0,a.jsxs)(d.aY,{className:"flex flex-col items-center gap-3 p-12 text-center",children:[(0,a.jsx)("span",{className:"flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary",children:(0,a.jsx)(s,{className:"h-7 w-7"})}),(0,a.jsx)("p",{className:"max-w-md text-sm text-muted-foreground",children:r})]})})]})}},9598:function(e,t,r){"use strict";r.d(t,{Ol:function(){return c},Zb:function(){return l},aY:function(){return o},ll:function(){return d}});var a=r(7437),n=r(2265),s=r(1628);let l=n.forwardRef((e,t)=>{let{className:r,...n}=e;return(0,a.jsx)("div",{ref:t,className:(0,s.cn)("rounded-2xl border border-border bg-card text-card-foreground shadow-sm",r),...n})});l.displayName="Card";let c=n.forwardRef((e,t)=>{let{className:r,...n}=e;return(0,a.jsx)("div",{ref:t,className:(0,s.cn)("flex flex-col space-y-1.5 p-6",r),...n})});c.displayName="CardHeader";let d=n.forwardRef((e,t)=>{let{className:r,...n}=e;return(0,a.jsx)("h3",{ref:t,className:(0,s.cn)("text-xl font-semibold leading-tight tracking-tight",r),...n})});d.displayName="CardTitle";let i=n.forwardRef((e,t)=>{let{className:r,...n}=e;return(0,a.jsx)("p",{ref:t,className:(0,s.cn)("text-sm text-muted-foreground",r),...n})});i.displayName="CardDescription";let o=n.forwardRef((e,t)=>{let{className:r,...n}=e;return(0,a.jsx)("div",{ref:t,className:(0,s.cn)("p-6 pt-0",r),...n})});o.displayName="CardContent";let u=n.forwardRef((e,t)=>{let{className:r,...n}=e;return(0,a.jsx)("div",{ref:t,className:(0,s.cn)("flex items-center p-6 pt-0",r),...n})});u.displayName="CardFooter"}},function(e){e.O(0,[895,141,971,472,744],function(){return e(e.s=150)}),_N_E=e.O()}]);