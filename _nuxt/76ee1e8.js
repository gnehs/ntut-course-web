(window.webpackJsonp=window.webpackJsonp||[]).push([[5,12],{364:function(t,e,n){var content=n(370);content.__esModule&&(content=content.default),"string"==typeof content&&(content=[[t.i,content,""]]),content.locals&&(t.exports=content.locals);(0,n(55).default)("6e0a148b",content,!0,{sourceMap:!1})},369:function(t,e,n){"use strict";n(364)},370:function(t,e,n){var o=n(54)(!1);o.push([t.i,".tag[data-v-3749a4f2]{display:inline-flex;align-items:center;color:#fff;background-color:var(--color);color:var(--text-color);padding:.5em .75em;border-radius:.5em;font-size:.5em;line-height:1em;text-align:center;white-space:nowrap}.tag+.tag[data-v-3749a4f2]{margin-left:.5em}",""]),t.exports=o},371:function(t,e,n){"use strict";n.r(e);var o={props:{color:{type:String,default:"#409EFF"},textColor:{type:String,default:"#FFF"}}},r=(n(369),n(35)),component=Object(r.a)(o,(function(){var t=this,e=t.$createElement;return(t._self._c||e)("div",{staticClass:"tag",style:{"--color":t.color,"--text-color":t.textColor}},[t._t("default")],2)}),[],!1,null,"3749a4f2",null);e.default=component.exports},405:function(t,e,n){"use strict";n.r(e);n(25),n(207),n(13),n(41),n(56),n(36),n(116),n(88);var o={props:["courseData"],data:function(){return{show:!1,tags:[]}},created:function(){this.courseData.class.some((function(t){return t.name.match(/^博雅/)}))&&(this.tags=this.courseData.notes.replace(/◎|\*/g,"").split(/106-108：|。109 \(含\) 後：/).filter((function(t){return t})).map((function(t){return{name:t,color:(e=t,(e.match(/創新與創業|創創/)?"#FFC107":e.match(/文化|美學與藝術|人文與藝術/)?"#FF5722":e.match(/自然與科學|自然向度/)?"#03A9F4":e.match(/社會|法治/)?"#2196F3":null)||"#777")};var e}))),this.show=this.tags.length}},r=n(35),component=Object(r.a)(o,(function(){var t=this,e=t.$createElement,n=t._self._c||e;return t.show?n("div",t._l(t.tags,(function(e){return n("tag",{key:e.name,attrs:{color:e.color}},[e.icon?n("i",{class:e.icon}):t._e(),t._v("\n    "+t._s(e.name)+"\n  ")])})),1):t._e()}),[],!1,null,null,null);e.default=component.exports;installComponents(component,{Tag:n(371).default})}}]);