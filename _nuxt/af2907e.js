(window.webpackJsonp=window.webpackJsonp||[]).push([[13],{372:function(e,t,n){var content=n(375);content.__esModule&&(content=content.default),"string"==typeof content&&(content=[[e.i,content,""]]),content.locals&&(e.exports=content.locals);(0,n(55).default)("2cc137c0",content,!0,{sourceMap:!1})},374:function(e,t,n){"use strict";n(372)},375:function(e,t,n){var o=n(54)(!1);o.push([e.i,".expand-enter-active,.expand-leave-active{transition:height 1s ease-in-out;overflow:hidden}.expand-enter,.expand-leave-to{height:0;opacity:0;margin-top:-16px}",""]),e.exports=o},380:function(e,t,n){"use strict";n.r(t);var o={name:"TransitionExpand",functional:!0,render:function(e,t){return e("transition",{props:{name:"expand"},on:{afterEnter:function(element){element.style.height="auto"},enter:function(element){var e=getComputedStyle(element).width;element.style.width=e,element.style.position="absolute",element.style.visibility="hidden",element.style.height="auto";var t=getComputedStyle(element).height;element.style.width=null,element.style.position=null,element.style.visibility=null,element.style.height=0,element.style.opacity=0,getComputedStyle(element).height,requestAnimationFrame((function(){element.style.height=t,element.style.opacity=1}))},leave:function(element){var e=getComputedStyle(element).height;element.style.height=e,getComputedStyle(element).height,requestAnimationFrame((function(){element.style.height=0}))}}},t.children)}},l=(n(374),n(35)),component=Object(l.a)(o,undefined,undefined,!1,null,null,null);t.default=component.exports}}]);