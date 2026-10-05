const di={ROTATE:0,DOLLY:1,PAN:2},ui={ROTATE:0,PAN:1,DOLLY_PAN:2,DOLLY_ROTATE:3},hc=0,Za=1,uc=2,Ms=1,fc=2,Ci=3,Xn=0,Ie=1,Ye=2,Sn=0,Di=1,Ka=2,Ja=3,$a=4,dc=5,hi=100,pc=101,mc=102,gc=103,_c=104,xc=200,vc=201,Sc=202,Mc=203,ol=204,ll=205,yc=206,Ec=207,bc=208,Tc=209,Ac=210,wc=211,Rc=212,Cc=213,Pc=214,Ar=0,wr=1,Rr=2,Ui=3,Cr=4,Pr=5,Lr=6,Dr=7,cl=0,Lc=1,Dc=2,an=0,hl=1,ul=2,fl=3,dl=4,pl=5,ml=6,gl=7,_l=300,qn=301,gi=302,Ws=303,Xs=304,Bs=306,Rs=1e3,nn=1001,Cs=1002,ye=1003,Ic=1004,Ki=1005,Ae=1006,qs=1007,Hn=1008,Be=1009,xl=1010,vl=1011,Fi=1012,ga=1013,ln=1014,sn=1015,cn=1016,_a=1017,xa=1018,Oi=1020,Sl=35902,Ml=35899,yl=1021,El=1022,Ke=1023,yn=1026,Wn=1027,bl=1028,va=1029,Yn=1030,Sa=1031,Ma=1033,ys=33776,Es=33777,bs=33778,Ts=33779,Ir=35840,Nr=35841,Ur=35842,Fr=35843,Or=36196,Br=37492,zr=37496,Gr=37488,Vr=37489,Ps=37490,kr=37491,Hr=37808,Wr=37809,Xr=37810,qr=37811,Yr=37812,Zr=37813,Kr=37814,Jr=37815,$r=37816,Qr=37817,jr=37818,ta=37819,ea=37820,na=37821,ia=36492,sa=36494,ra=36495,aa=36283,oa=36284,Ls=36285,la=36286,Nc=3200,ca=0,Uc=1,Ln="",Oe="srgb",Ds="srgb-linear",Is="linear",re="srgb",Ys=7680,Fc=519,Oc=512,Bc=513,zc=514,ya=515,Gc=516,Vc=517,Ea=518,kc=519,Hc=35044,Qa="300 es",rn=2e3,Bi=2001;function Wc(i){for(let t=i.length-1;t>=0;--t)if(i[t]>=65535)return!0;return!1}function Ns(i){return document.createElementNS("http://www.w3.org/1999/xhtml",i)}function Xc(){const i=Ns("canvas");return i.style.display="block",i}const ja={};function to(...i){const t="THREE."+i.shift();console.log(t,...i)}function Tl(i){const t=i[0];if(typeof t=="string"&&t.startsWith("TSL:")){const e=i[1];e&&e.isStackTrace?i[0]+=" "+e.getLocation():i[1]='Stack trace not available. Enable "THREE.Node.captureStackTrace" to capture stack traces.'}return i}function Wt(...i){i=Tl(i);const t="THREE."+i.shift();{const e=i[0];e&&e.isStackTrace?console.warn(e.getError(t)):console.warn(t,...i)}}function ne(...i){i=Tl(i);const t="THREE."+i.shift();{const e=i[0];e&&e.isStackTrace?console.error(e.getError(t)):console.error(t,...i)}}function pi(...i){const t=i.join(" ");t in ja||(ja[t]=!0,Wt(...i))}function qc(i,t,e){return new Promise(function(n,s){function r(){switch(i.clientWaitSync(t,i.SYNC_FLUSH_COMMANDS_BIT,0)){case i.WAIT_FAILED:s();break;case i.TIMEOUT_EXPIRED:setTimeout(r,e);break;default:n()}}setTimeout(r,e)})}const Yc={[Ar]:wr,[Rr]:Lr,[Cr]:Dr,[Ui]:Pr,[wr]:Ar,[Lr]:Rr,[Dr]:Cr,[Pr]:Ui};class Un{addEventListener(t,e){this._listeners===void 0&&(this._listeners={});const n=this._listeners;n[t]===void 0&&(n[t]=[]),n[t].indexOf(e)===-1&&n[t].push(e)}hasEventListener(t,e){const n=this._listeners;return n===void 0?!1:n[t]!==void 0&&n[t].indexOf(e)!==-1}removeEventListener(t,e){const n=this._listeners;if(n===void 0)return;const s=n[t];if(s!==void 0){const r=s.indexOf(e);r!==-1&&s.splice(r,1)}}dispatchEvent(t){const e=this._listeners;if(e===void 0)return;const n=e[t.type];if(n!==void 0){t.target=this;const s=n.slice(0);for(let r=0,a=s.length;r<a;r++)s[r].call(this,t);t.target=null}}}const be=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"],As=Math.PI/180,ha=180/Math.PI;function Si(){const i=Math.random()*4294967295|0,t=Math.random()*4294967295|0,e=Math.random()*4294967295|0,n=Math.random()*4294967295|0;return(be[i&255]+be[i>>8&255]+be[i>>16&255]+be[i>>24&255]+"-"+be[t&255]+be[t>>8&255]+"-"+be[t>>16&15|64]+be[t>>24&255]+"-"+be[e&63|128]+be[e>>8&255]+"-"+be[e>>16&255]+be[e>>24&255]+be[n&255]+be[n>>8&255]+be[n>>16&255]+be[n>>24&255]).toLowerCase()}function $t(i,t,e){return Math.max(t,Math.min(e,i))}function Zc(i,t){return(i%t+t)%t}function Zs(i,t,e){return(1-e)*i+e*t}function yi(i,t){switch(t.constructor){case Float32Array:return i;case Uint32Array:return i/4294967295;case Uint16Array:return i/65535;case Uint8Array:case Uint8ClampedArray:return i/255;case Int32Array:return Math.max(i/2147483647,-1);case Int16Array:return Math.max(i/32767,-1);case Int8Array:return Math.max(i/127,-1);default:throw new Error("THREE.MathUtils: Invalid component type.")}}function Le(i,t){switch(t.constructor){case Float32Array:return i;case Uint32Array:return Math.round(i*4294967295);case Uint16Array:return Math.round(i*65535);case Uint8Array:case Uint8ClampedArray:return Math.round(i*255);case Int32Array:return Math.round(i*2147483647);case Int16Array:return Math.round(i*32767);case Int8Array:return Math.round(i*127);default:throw new Error("THREE.MathUtils: Invalid component type.")}}const Kc={DEG2RAD:As},Ia=class Ia{constructor(t=0,e=0){this.x=t,this.y=e}get width(){return this.x}set width(t){this.x=t}get height(){return this.y}set height(t){this.y=t}set(t,e){return this.x=t,this.y=e,this}setScalar(t){return this.x=t,this.y=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;default:throw new Error("THREE.Vector2: index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;default:throw new Error("THREE.Vector2: index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y)}copy(t){return this.x=t.x,this.y=t.y,this}add(t){return this.x+=t.x,this.y+=t.y,this}addScalar(t){return this.x+=t,this.y+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this}subScalar(t){return this.x-=t,this.y-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this}multiply(t){return this.x*=t.x,this.y*=t.y,this}multiplyScalar(t){return this.x*=t,this.y*=t,this}divide(t){return this.x/=t.x,this.y/=t.y,this}divideScalar(t){return this.multiplyScalar(1/t)}applyMatrix3(t){const e=this.x,n=this.y,s=t.elements;return this.x=s[0]*e+s[3]*n+s[6],this.y=s[1]*e+s[4]*n+s[7],this}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this}clamp(t,e){return this.x=$t(this.x,t.x,e.x),this.y=$t(this.y,t.y,e.y),this}clampScalar(t,e){return this.x=$t(this.x,t,e),this.y=$t(this.y,t,e),this}clampLength(t,e){const n=this.length();return this.divideScalar(n||1).multiplyScalar($t(n,t,e))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(t){return this.x*t.x+this.y*t.y}cross(t){return this.x*t.y-this.y*t.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(t){const e=Math.sqrt(this.lengthSq()*t.lengthSq());if(e===0)return Math.PI/2;const n=this.dot(t)/e;return Math.acos($t(n,-1,1))}distanceTo(t){return Math.sqrt(this.distanceToSquared(t))}distanceToSquared(t){const e=this.x-t.x,n=this.y-t.y;return e*e+n*n}manhattanDistanceTo(t){return Math.abs(this.x-t.x)+Math.abs(this.y-t.y)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this}lerpVectors(t,e,n){return this.x=t.x+(e.x-t.x)*n,this.y=t.y+(e.y-t.y)*n,this}equals(t){return t.x===this.x&&t.y===this.y}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this}rotateAround(t,e){const n=Math.cos(e),s=Math.sin(e),r=this.x-t.x,a=this.y-t.y;return this.x=r*n-a*s+t.x,this.y=r*s+a*n+t.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}};Ia.prototype.isVector2=!0;let dt=Ia;class In{constructor(t=0,e=0,n=0,s=1){this.isQuaternion=!0,this._x=t,this._y=e,this._z=n,this._w=s}static slerpFlat(t,e,n,s,r,a,o){let c=n[s+0],l=n[s+1],u=n[s+2],f=n[s+3],h=r[a+0],p=r[a+1],_=r[a+2],y=r[a+3];if(f!==y||c!==h||l!==p||u!==_){let m=c*h+l*p+u*_+f*y;m<0&&(h=-h,p=-p,_=-_,y=-y,m=-m);let d=1-o;if(m<.9995){const P=Math.acos(m),D=Math.sin(P);d=Math.sin(d*P)/D,o=Math.sin(o*P)/D,c=c*d+h*o,l=l*d+p*o,u=u*d+_*o,f=f*d+y*o}else{c=c*d+h*o,l=l*d+p*o,u=u*d+_*o,f=f*d+y*o;const P=1/Math.sqrt(c*c+l*l+u*u+f*f);c*=P,l*=P,u*=P,f*=P}}t[e]=c,t[e+1]=l,t[e+2]=u,t[e+3]=f}static multiplyQuaternionsFlat(t,e,n,s,r,a){const o=n[s],c=n[s+1],l=n[s+2],u=n[s+3],f=r[a],h=r[a+1],p=r[a+2],_=r[a+3];return t[e]=o*_+u*f+c*p-l*h,t[e+1]=c*_+u*h+l*f-o*p,t[e+2]=l*_+u*p+o*h-c*f,t[e+3]=u*_-o*f-c*h-l*p,t}get x(){return this._x}set x(t){this._x=t,this._onChangeCallback()}get y(){return this._y}set y(t){this._y=t,this._onChangeCallback()}get z(){return this._z}set z(t){this._z=t,this._onChangeCallback()}get w(){return this._w}set w(t){this._w=t,this._onChangeCallback()}set(t,e,n,s){return this._x=t,this._y=e,this._z=n,this._w=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(t){return this._x=t.x,this._y=t.y,this._z=t.z,this._w=t.w,this._onChangeCallback(),this}setFromEuler(t,e=!0){const n=t._x,s=t._y,r=t._z,a=t._order,o=Math.cos,c=Math.sin,l=o(n/2),u=o(s/2),f=o(r/2),h=c(n/2),p=c(s/2),_=c(r/2);switch(a){case"XYZ":this._x=h*u*f+l*p*_,this._y=l*p*f-h*u*_,this._z=l*u*_+h*p*f,this._w=l*u*f-h*p*_;break;case"YXZ":this._x=h*u*f+l*p*_,this._y=l*p*f-h*u*_,this._z=l*u*_-h*p*f,this._w=l*u*f+h*p*_;break;case"ZXY":this._x=h*u*f-l*p*_,this._y=l*p*f+h*u*_,this._z=l*u*_+h*p*f,this._w=l*u*f-h*p*_;break;case"ZYX":this._x=h*u*f-l*p*_,this._y=l*p*f+h*u*_,this._z=l*u*_-h*p*f,this._w=l*u*f+h*p*_;break;case"YZX":this._x=h*u*f+l*p*_,this._y=l*p*f+h*u*_,this._z=l*u*_-h*p*f,this._w=l*u*f-h*p*_;break;case"XZY":this._x=h*u*f-l*p*_,this._y=l*p*f-h*u*_,this._z=l*u*_+h*p*f,this._w=l*u*f+h*p*_;break;default:Wt("Quaternion: .setFromEuler() encountered an unknown order: "+a)}return e===!0&&this._onChangeCallback(),this}setFromAxisAngle(t,e){const n=e/2,s=Math.sin(n);return this._x=t.x*s,this._y=t.y*s,this._z=t.z*s,this._w=Math.cos(n),this._onChangeCallback(),this}setFromRotationMatrix(t){const e=t.elements,n=e[0],s=e[4],r=e[8],a=e[1],o=e[5],c=e[9],l=e[2],u=e[6],f=e[10],h=n+o+f;if(h>0){const p=.5/Math.sqrt(h+1);this._w=.25/p,this._x=(u-c)*p,this._y=(r-l)*p,this._z=(a-s)*p}else if(n>o&&n>f){const p=2*Math.sqrt(1+n-o-f);this._w=(u-c)/p,this._x=.25*p,this._y=(s+a)/p,this._z=(r+l)/p}else if(o>f){const p=2*Math.sqrt(1+o-n-f);this._w=(r-l)/p,this._x=(s+a)/p,this._y=.25*p,this._z=(c+u)/p}else{const p=2*Math.sqrt(1+f-n-o);this._w=(a-s)/p,this._x=(r+l)/p,this._y=(c+u)/p,this._z=.25*p}return this._onChangeCallback(),this}setFromUnitVectors(t,e){let n=t.dot(e)+1;return n<1e-8?(n=0,Math.abs(t.x)>Math.abs(t.z)?(this._x=-t.y,this._y=t.x,this._z=0,this._w=n):(this._x=0,this._y=-t.z,this._z=t.y,this._w=n)):(this._x=t.y*e.z-t.z*e.y,this._y=t.z*e.x-t.x*e.z,this._z=t.x*e.y-t.y*e.x,this._w=n),this.normalize()}angleTo(t){return 2*Math.acos(Math.abs($t(this.dot(t),-1,1)))}rotateTowards(t,e){const n=this.angleTo(t);if(n===0)return this;const s=Math.min(1,e/n);return this.slerp(t,s),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(t){return this._x*t._x+this._y*t._y+this._z*t._z+this._w*t._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let t=this.length();return t===0?(this._x=0,this._y=0,this._z=0,this._w=1):(t=1/t,this._x=this._x*t,this._y=this._y*t,this._z=this._z*t,this._w=this._w*t),this._onChangeCallback(),this}multiply(t){return this.multiplyQuaternions(this,t)}premultiply(t){return this.multiplyQuaternions(t,this)}multiplyQuaternions(t,e){const n=t._x,s=t._y,r=t._z,a=t._w,o=e._x,c=e._y,l=e._z,u=e._w;return this._x=n*u+a*o+s*l-r*c,this._y=s*u+a*c+r*o-n*l,this._z=r*u+a*l+n*c-s*o,this._w=a*u-n*o-s*c-r*l,this._onChangeCallback(),this}slerp(t,e){let n=t._x,s=t._y,r=t._z,a=t._w,o=this.dot(t);o<0&&(n=-n,s=-s,r=-r,a=-a,o=-o);let c=1-e;if(o<.9995){const l=Math.acos(o),u=Math.sin(l);c=Math.sin(c*l)/u,e=Math.sin(e*l)/u,this._x=this._x*c+n*e,this._y=this._y*c+s*e,this._z=this._z*c+r*e,this._w=this._w*c+a*e,this._onChangeCallback()}else this._x=this._x*c+n*e,this._y=this._y*c+s*e,this._z=this._z*c+r*e,this._w=this._w*c+a*e,this.normalize();return this}slerpQuaternions(t,e,n){return this.copy(t).slerp(e,n)}random(){const t=2*Math.PI*Math.random(),e=2*Math.PI*Math.random(),n=Math.random(),s=Math.sqrt(1-n),r=Math.sqrt(n);return this.set(s*Math.sin(t),s*Math.cos(t),r*Math.sin(e),r*Math.cos(e))}equals(t){return t._x===this._x&&t._y===this._y&&t._z===this._z&&t._w===this._w}fromArray(t,e=0){return this._x=t[e],this._y=t[e+1],this._z=t[e+2],this._w=t[e+3],this._onChangeCallback(),this}toArray(t=[],e=0){return t[e]=this._x,t[e+1]=this._y,t[e+2]=this._z,t[e+3]=this._w,t}fromBufferAttribute(t,e){return this._x=t.getX(e),this._y=t.getY(e),this._z=t.getZ(e),this._w=t.getW(e),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(t){return this._onChangeCallback=t,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}}const Na=class Na{constructor(t=0,e=0,n=0){this.x=t,this.y=e,this.z=n}set(t,e,n){return n===void 0&&(n=this.z),this.x=t,this.y=e,this.z=n,this}setScalar(t){return this.x=t,this.y=t,this.z=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setZ(t){return this.z=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;case 2:this.z=e;break;default:throw new Error("THREE.Vector3: index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("THREE.Vector3: index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(t){return this.x=t.x,this.y=t.y,this.z=t.z,this}add(t){return this.x+=t.x,this.y+=t.y,this.z+=t.z,this}addScalar(t){return this.x+=t,this.y+=t,this.z+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this.z=t.z+e.z,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this.z+=t.z*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this.z-=t.z,this}subScalar(t){return this.x-=t,this.y-=t,this.z-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this.z=t.z-e.z,this}multiply(t){return this.x*=t.x,this.y*=t.y,this.z*=t.z,this}multiplyScalar(t){return this.x*=t,this.y*=t,this.z*=t,this}multiplyVectors(t,e){return this.x=t.x*e.x,this.y=t.y*e.y,this.z=t.z*e.z,this}applyEuler(t){return this.applyQuaternion(eo.setFromEuler(t))}applyAxisAngle(t,e){return this.applyQuaternion(eo.setFromAxisAngle(t,e))}applyMatrix3(t){const e=this.x,n=this.y,s=this.z,r=t.elements;return this.x=r[0]*e+r[3]*n+r[6]*s,this.y=r[1]*e+r[4]*n+r[7]*s,this.z=r[2]*e+r[5]*n+r[8]*s,this}applyNormalMatrix(t){return this.applyMatrix3(t).normalize()}applyMatrix4(t){const e=this.x,n=this.y,s=this.z,r=t.elements,a=1/(r[3]*e+r[7]*n+r[11]*s+r[15]);return this.x=(r[0]*e+r[4]*n+r[8]*s+r[12])*a,this.y=(r[1]*e+r[5]*n+r[9]*s+r[13])*a,this.z=(r[2]*e+r[6]*n+r[10]*s+r[14])*a,this}applyQuaternion(t){const e=this.x,n=this.y,s=this.z,r=t.x,a=t.y,o=t.z,c=t.w,l=2*(a*s-o*n),u=2*(o*e-r*s),f=2*(r*n-a*e);return this.x=e+c*l+a*f-o*u,this.y=n+c*u+o*l-r*f,this.z=s+c*f+r*u-a*l,this}project(t){return this.applyMatrix4(t.matrixWorldInverse).applyMatrix4(t.projectionMatrix)}unproject(t){return this.applyMatrix4(t.projectionMatrixInverse).applyMatrix4(t.matrixWorld)}transformDirection(t){const e=this.x,n=this.y,s=this.z,r=t.elements;return this.x=r[0]*e+r[4]*n+r[8]*s,this.y=r[1]*e+r[5]*n+r[9]*s,this.z=r[2]*e+r[6]*n+r[10]*s,this.normalize()}divide(t){return this.x/=t.x,this.y/=t.y,this.z/=t.z,this}divideScalar(t){return this.multiplyScalar(1/t)}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this.z=Math.min(this.z,t.z),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this.z=Math.max(this.z,t.z),this}clamp(t,e){return this.x=$t(this.x,t.x,e.x),this.y=$t(this.y,t.y,e.y),this.z=$t(this.z,t.z,e.z),this}clampScalar(t,e){return this.x=$t(this.x,t,e),this.y=$t(this.y,t,e),this.z=$t(this.z,t,e),this}clampLength(t,e){const n=this.length();return this.divideScalar(n||1).multiplyScalar($t(n,t,e))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(t){return this.x*t.x+this.y*t.y+this.z*t.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this.z+=(t.z-this.z)*e,this}lerpVectors(t,e,n){return this.x=t.x+(e.x-t.x)*n,this.y=t.y+(e.y-t.y)*n,this.z=t.z+(e.z-t.z)*n,this}cross(t){return this.crossVectors(this,t)}crossVectors(t,e){const n=t.x,s=t.y,r=t.z,a=e.x,o=e.y,c=e.z;return this.x=s*c-r*o,this.y=r*a-n*c,this.z=n*o-s*a,this}projectOnVector(t){const e=t.lengthSq();if(e===0)return this.set(0,0,0);const n=t.dot(this)/e;return this.copy(t).multiplyScalar(n)}projectOnPlane(t){return Ks.copy(this).projectOnVector(t),this.sub(Ks)}reflect(t){return this.sub(Ks.copy(t).multiplyScalar(2*this.dot(t)))}angleTo(t){const e=Math.sqrt(this.lengthSq()*t.lengthSq());if(e===0)return Math.PI/2;const n=this.dot(t)/e;return Math.acos($t(n,-1,1))}distanceTo(t){return Math.sqrt(this.distanceToSquared(t))}distanceToSquared(t){const e=this.x-t.x,n=this.y-t.y,s=this.z-t.z;return e*e+n*n+s*s}manhattanDistanceTo(t){return Math.abs(this.x-t.x)+Math.abs(this.y-t.y)+Math.abs(this.z-t.z)}setFromSpherical(t){return this.setFromSphericalCoords(t.radius,t.phi,t.theta)}setFromSphericalCoords(t,e,n){const s=Math.sin(e)*t;return this.x=s*Math.sin(n),this.y=Math.cos(e)*t,this.z=s*Math.cos(n),this}setFromCylindrical(t){return this.setFromCylindricalCoords(t.radius,t.theta,t.y)}setFromCylindricalCoords(t,e,n){return this.x=t*Math.sin(e),this.y=n,this.z=t*Math.cos(e),this}setFromMatrixPosition(t){const e=t.elements;return this.x=e[12],this.y=e[13],this.z=e[14],this}setFromMatrixScale(t){const e=this.setFromMatrixColumn(t,0).length(),n=this.setFromMatrixColumn(t,1).length(),s=this.setFromMatrixColumn(t,2).length();return this.x=e,this.y=n,this.z=s,this}setFromMatrixColumn(t,e){return this.fromArray(t.elements,e*4)}setFromMatrix3Column(t,e){return this.fromArray(t.elements,e*3)}setFromEuler(t){return this.x=t._x,this.y=t._y,this.z=t._z,this}setFromColor(t){return this.x=t.r,this.y=t.g,this.z=t.b,this}equals(t){return t.x===this.x&&t.y===this.y&&t.z===this.z}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this.z=t[e+2],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t[e+2]=this.z,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this.z=t.getZ(e),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){const t=Math.random()*Math.PI*2,e=Math.random()*2-1,n=Math.sqrt(1-e*e);return this.x=n*Math.cos(t),this.y=e,this.z=n*Math.sin(t),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}};Na.prototype.isVector3=!0;let H=Na;const Ks=new H,eo=new In,Ua=class Ua{constructor(t,e,n,s,r,a,o,c,l){this.elements=[1,0,0,0,1,0,0,0,1],t!==void 0&&this.set(t,e,n,s,r,a,o,c,l)}set(t,e,n,s,r,a,o,c,l){const u=this.elements;return u[0]=t,u[1]=s,u[2]=o,u[3]=e,u[4]=r,u[5]=c,u[6]=n,u[7]=a,u[8]=l,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(t){const e=this.elements,n=t.elements;return e[0]=n[0],e[1]=n[1],e[2]=n[2],e[3]=n[3],e[4]=n[4],e[5]=n[5],e[6]=n[6],e[7]=n[7],e[8]=n[8],this}extractBasis(t,e,n){return t.setFromMatrix3Column(this,0),e.setFromMatrix3Column(this,1),n.setFromMatrix3Column(this,2),this}setFromMatrix4(t){const e=t.elements;return this.set(e[0],e[4],e[8],e[1],e[5],e[9],e[2],e[6],e[10]),this}multiply(t){return this.multiplyMatrices(this,t)}premultiply(t){return this.multiplyMatrices(t,this)}multiplyMatrices(t,e){const n=t.elements,s=e.elements,r=this.elements,a=n[0],o=n[3],c=n[6],l=n[1],u=n[4],f=n[7],h=n[2],p=n[5],_=n[8],y=s[0],m=s[3],d=s[6],P=s[1],D=s[4],S=s[7],w=s[2],A=s[5],F=s[8];return r[0]=a*y+o*P+c*w,r[3]=a*m+o*D+c*A,r[6]=a*d+o*S+c*F,r[1]=l*y+u*P+f*w,r[4]=l*m+u*D+f*A,r[7]=l*d+u*S+f*F,r[2]=h*y+p*P+_*w,r[5]=h*m+p*D+_*A,r[8]=h*d+p*S+_*F,this}multiplyScalar(t){const e=this.elements;return e[0]*=t,e[3]*=t,e[6]*=t,e[1]*=t,e[4]*=t,e[7]*=t,e[2]*=t,e[5]*=t,e[8]*=t,this}determinant(){const t=this.elements,e=t[0],n=t[1],s=t[2],r=t[3],a=t[4],o=t[5],c=t[6],l=t[7],u=t[8];return e*a*u-e*o*l-n*r*u+n*o*c+s*r*l-s*a*c}invert(){const t=this.elements,e=t[0],n=t[1],s=t[2],r=t[3],a=t[4],o=t[5],c=t[6],l=t[7],u=t[8],f=u*a-o*l,h=o*c-u*r,p=l*r-a*c,_=e*f+n*h+s*p;if(_===0)return this.set(0,0,0,0,0,0,0,0,0);const y=1/_;return t[0]=f*y,t[1]=(s*l-u*n)*y,t[2]=(o*n-s*a)*y,t[3]=h*y,t[4]=(u*e-s*c)*y,t[5]=(s*r-o*e)*y,t[6]=p*y,t[7]=(n*c-l*e)*y,t[8]=(a*e-n*r)*y,this}transpose(){let t;const e=this.elements;return t=e[1],e[1]=e[3],e[3]=t,t=e[2],e[2]=e[6],e[6]=t,t=e[5],e[5]=e[7],e[7]=t,this}getNormalMatrix(t){return this.setFromMatrix4(t).invert().transpose()}transposeIntoArray(t){const e=this.elements;return t[0]=e[0],t[1]=e[3],t[2]=e[6],t[3]=e[1],t[4]=e[4],t[5]=e[7],t[6]=e[2],t[7]=e[5],t[8]=e[8],this}setUvTransform(t,e,n,s,r,a,o){const c=Math.cos(r),l=Math.sin(r);return this.set(n*c,n*l,-n*(c*a+l*o)+a+t,-s*l,s*c,-s*(-l*a+c*o)+o+e,0,0,1),this}scale(t,e){return pi("Matrix3: .scale() is deprecated. Use .makeScale() instead."),this.premultiply(Js.makeScale(t,e)),this}rotate(t){return pi("Matrix3: .rotate() is deprecated. Use .makeRotation() instead."),this.premultiply(Js.makeRotation(-t)),this}translate(t,e){return pi("Matrix3: .translate() is deprecated. Use .makeTranslation() instead."),this.premultiply(Js.makeTranslation(t,e)),this}makeTranslation(t,e){return t.isVector2?this.set(1,0,t.x,0,1,t.y,0,0,1):this.set(1,0,t,0,1,e,0,0,1),this}makeRotation(t){const e=Math.cos(t),n=Math.sin(t);return this.set(e,-n,0,n,e,0,0,0,1),this}makeScale(t,e){return this.set(t,0,0,0,e,0,0,0,1),this}equals(t){const e=this.elements,n=t.elements;for(let s=0;s<9;s++)if(e[s]!==n[s])return!1;return!0}fromArray(t,e=0){for(let n=0;n<9;n++)this.elements[n]=t[n+e];return this}toArray(t=[],e=0){const n=this.elements;return t[e]=n[0],t[e+1]=n[1],t[e+2]=n[2],t[e+3]=n[3],t[e+4]=n[4],t[e+5]=n[5],t[e+6]=n[6],t[e+7]=n[7],t[e+8]=n[8],t}clone(){return new this.constructor().fromArray(this.elements)}};Ua.prototype.isMatrix3=!0;let kt=Ua;const Js=new kt,no=new kt().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),io=new kt().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);function Jc(){const i={enabled:!0,workingColorSpace:Ds,spaces:{},convert:function(s,r,a){return this.enabled===!1||r===a||!r||!a||(this.spaces[r].transfer===re&&(s.r=Mn(s.r),s.g=Mn(s.g),s.b=Mn(s.b)),this.spaces[r].primaries!==this.spaces[a].primaries&&(s.applyMatrix3(this.spaces[r].toXYZ),s.applyMatrix3(this.spaces[a].fromXYZ)),this.spaces[a].transfer===re&&(s.r=mi(s.r),s.g=mi(s.g),s.b=mi(s.b))),s},workingToColorSpace:function(s,r){return this.convert(s,this.workingColorSpace,r)},colorSpaceToWorking:function(s,r){return this.convert(s,r,this.workingColorSpace)},getPrimaries:function(s){return this.spaces[s].primaries},getTransfer:function(s){return s===Ln?Is:this.spaces[s].transfer},getToneMappingMode:function(s){return this.spaces[s].outputColorSpaceConfig.toneMappingMode||"standard"},getLuminanceCoefficients:function(s,r=this.workingColorSpace){return s.fromArray(this.spaces[r].luminanceCoefficients)},define:function(s){Object.assign(this.spaces,s)},_getMatrix:function(s,r,a){return s.copy(this.spaces[r].toXYZ).multiply(this.spaces[a].fromXYZ)},_getDrawingBufferColorSpace:function(s){return this.spaces[s].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(s=this.workingColorSpace){return this.spaces[s].workingColorSpaceConfig.unpackColorSpace},fromWorkingColorSpace:function(s,r){return pi("ColorManagement: .fromWorkingColorSpace() has been renamed to .workingToColorSpace()."),i.workingToColorSpace(s,r)},toWorkingColorSpace:function(s,r){return pi("ColorManagement: .toWorkingColorSpace() has been renamed to .colorSpaceToWorking()."),i.colorSpaceToWorking(s,r)}},t=[.64,.33,.3,.6,.15,.06],e=[.2126,.7152,.0722],n=[.3127,.329];return i.define({[Ds]:{primaries:t,whitePoint:n,transfer:Is,toXYZ:no,fromXYZ:io,luminanceCoefficients:e,workingColorSpaceConfig:{unpackColorSpace:Oe},outputColorSpaceConfig:{drawingBufferColorSpace:Oe}},[Oe]:{primaries:t,whitePoint:n,transfer:re,toXYZ:no,fromXYZ:io,luminanceCoefficients:e,outputColorSpaceConfig:{drawingBufferColorSpace:Oe}}}),i}const te=Jc();function Mn(i){return i<.04045?i*.0773993808:Math.pow(i*.9478672986+.0521327014,2.4)}function mi(i){return i<.0031308?i*12.92:1.055*Math.pow(i,.41666)-.055}let $n;class $c{static getDataURL(t,e="image/png"){if(/^data:/i.test(t.src)||typeof HTMLCanvasElement>"u")return t.src;let n;if(t instanceof HTMLCanvasElement)n=t;else{$n===void 0&&($n=Ns("canvas")),$n.width=t.width,$n.height=t.height;const s=$n.getContext("2d");t instanceof ImageData?s.putImageData(t,0,0):s.drawImage(t,0,0,t.width,t.height),n=$n}return n.toDataURL(e)}static sRGBToLinear(t){if(typeof HTMLImageElement<"u"&&t instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&t instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&t instanceof ImageBitmap){const e=Ns("canvas");e.width=t.width,e.height=t.height;const n=e.getContext("2d");n.drawImage(t,0,0,t.width,t.height);const s=n.getImageData(0,0,t.width,t.height),r=s.data;for(let a=0;a<r.length;a++)r[a]=Mn(r[a]/255)*255;return n.putImageData(s,0,0),e}else if(t.data){const e=t.data.slice(0);for(let n=0;n<e.length;n++)e instanceof Uint8Array||e instanceof Uint8ClampedArray?e[n]=Math.floor(Mn(e[n]/255)*255):e[n]=Mn(e[n]);return{data:e,width:t.width,height:t.height}}else return Wt("ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),t}}let Qc=0;class ba{constructor(t=null){this.isTextureSource=!0,Object.defineProperty(this,"id",{value:Qc++}),this.uuid=Si(),this.data=t,this.dataReady=!0,this.version=0}getSize(t){const e=this.data;return typeof HTMLVideoElement<"u"&&e instanceof HTMLVideoElement?t.set(e.videoWidth,e.videoHeight,0):typeof VideoFrame<"u"&&e instanceof VideoFrame?t.set(e.displayWidth,e.displayHeight,0):e!==null?t.set(e.width,e.height,e.depth||0):t.set(0,0,0),t}set needsUpdate(t){t===!0&&this.version++}toJSON(t){const e=t===void 0||typeof t=="string";if(!e&&t.images[this.uuid]!==void 0)return t.images[this.uuid];const n={uuid:this.uuid,url:""},s=this.data;if(s!==null){let r;if(Array.isArray(s)){r=[];for(let a=0,o=s.length;a<o;a++)s[a].isDataTexture?r.push($s(s[a].image)):r.push($s(s[a]))}else r=$s(s);n.url=r}return e||(t.images[this.uuid]=n),n}}function $s(i){return typeof HTMLImageElement<"u"&&i instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&i instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&i instanceof ImageBitmap?$c.getDataURL(i):i.data?{data:Array.from(i.data),width:i.width,height:i.height,type:i.data.constructor.name}:(Wt("Texture: Unable to serialize Texture."),{})}let jc=0;const Qs=new H;class we extends Un{constructor(t=we.DEFAULT_IMAGE,e=we.DEFAULT_MAPPING,n=nn,s=nn,r=Ae,a=Hn,o=Ke,c=Be,l=we.DEFAULT_ANISOTROPY,u=Ln){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:jc++}),this.uuid=Si(),this.name="",this.source=new ba(t),this.mipmaps=[],this.mapping=e,this.channel=0,this.wrapS=n,this.wrapT=s,this.magFilter=r,this.minFilter=a,this.anisotropy=l,this.format=o,this.internalFormat=null,this.type=c,this.offset=new dt(0,0),this.repeat=new dt(1,1),this.center=new dt(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new kt,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=u,this.userData={},this.updateRanges=[],this.version=0,this.onUpdate=null,this.renderTarget=null,this.isRenderTargetTexture=!1,this.isArrayTexture=!!(t&&t.depth&&t.depth>1),this.pmremVersion=0,this.normalized=!1}get width(){return this.source.getSize(Qs).x}get height(){return this.source.getSize(Qs).y}get depth(){return this.source.getSize(Qs).z}get image(){return this.source.data}set image(t){this.source.data=t}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}addUpdateRange(t,e){this.updateRanges.push({start:t,count:e})}clearUpdateRanges(){this.updateRanges.length=0}clone(){return new this.constructor().copy(this)}copy(t){return this.name=t.name,this.source=t.source,this.mipmaps=t.mipmaps.slice(0),this.mapping=t.mapping,this.channel=t.channel,this.wrapS=t.wrapS,this.wrapT=t.wrapT,this.magFilter=t.magFilter,this.minFilter=t.minFilter,this.anisotropy=t.anisotropy,this.format=t.format,this.internalFormat=t.internalFormat,this.type=t.type,this.normalized=t.normalized,this.offset.copy(t.offset),this.repeat.copy(t.repeat),this.center.copy(t.center),this.rotation=t.rotation,this.matrixAutoUpdate=t.matrixAutoUpdate,this.matrix.copy(t.matrix),this.generateMipmaps=t.generateMipmaps,this.premultiplyAlpha=t.premultiplyAlpha,this.flipY=t.flipY,this.unpackAlignment=t.unpackAlignment,this.colorSpace=t.colorSpace,this.renderTarget=t.renderTarget,this.isRenderTargetTexture=t.isRenderTargetTexture,this.isArrayTexture=t.isArrayTexture,this.userData=JSON.parse(JSON.stringify(t.userData)),this.needsUpdate=!0,this}setValues(t){for(const e in t){const n=t[e];if(n===void 0){Wt(`Texture.setValues(): parameter '${e}' has value of undefined.`);continue}const s=this[e];if(s===void 0){Wt(`Texture.setValues(): property '${e}' does not exist.`);continue}s&&n&&s.isVector2&&n.isVector2||s&&n&&s.isVector3&&n.isVector3||s&&n&&s.isMatrix3&&n.isMatrix3?s.copy(n):this[e]=n}}toJSON(t){const e=t===void 0||typeof t=="string";if(!e&&t.textures[this.uuid]!==void 0)return t.textures[this.uuid];const n={metadata:{version:4.7,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(t).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,normalized:this.normalized,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(n.userData=this.userData),e||(t.textures[this.uuid]=n),n}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(t){if(this.mapping!==_l)return t;if(t.applyMatrix3(this.matrix),t.x<0||t.x>1)switch(this.wrapS){case Rs:t.x=t.x-Math.floor(t.x);break;case nn:t.x=t.x<0?0:1;break;case Cs:Math.abs(Math.floor(t.x)%2)===1?t.x=Math.ceil(t.x)-t.x:t.x=t.x-Math.floor(t.x);break}if(t.y<0||t.y>1)switch(this.wrapT){case Rs:t.y=t.y-Math.floor(t.y);break;case nn:t.y=t.y<0?0:1;break;case Cs:Math.abs(Math.floor(t.y)%2)===1?t.y=Math.ceil(t.y)-t.y:t.y=t.y-Math.floor(t.y);break}return this.flipY&&(t.y=1-t.y),t}set needsUpdate(t){t===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(t){t===!0&&this.pmremVersion++}}we.DEFAULT_IMAGE=null;we.DEFAULT_MAPPING=_l;we.DEFAULT_ANISOTROPY=1;const Fa=class Fa{constructor(t=0,e=0,n=0,s=1){this.x=t,this.y=e,this.z=n,this.w=s}get width(){return this.z}set width(t){this.z=t}get height(){return this.w}set height(t){this.w=t}set(t,e,n,s){return this.x=t,this.y=e,this.z=n,this.w=s,this}setScalar(t){return this.x=t,this.y=t,this.z=t,this.w=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setZ(t){return this.z=t,this}setW(t){return this.w=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;case 2:this.z=e;break;case 3:this.w=e;break;default:throw new Error("THREE.Vector4: index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("THREE.Vector4: index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(t){return this.x=t.x,this.y=t.y,this.z=t.z,this.w=t.w!==void 0?t.w:1,this}add(t){return this.x+=t.x,this.y+=t.y,this.z+=t.z,this.w+=t.w,this}addScalar(t){return this.x+=t,this.y+=t,this.z+=t,this.w+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this.z=t.z+e.z,this.w=t.w+e.w,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this.z+=t.z*e,this.w+=t.w*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this.z-=t.z,this.w-=t.w,this}subScalar(t){return this.x-=t,this.y-=t,this.z-=t,this.w-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this.z=t.z-e.z,this.w=t.w-e.w,this}multiply(t){return this.x*=t.x,this.y*=t.y,this.z*=t.z,this.w*=t.w,this}multiplyScalar(t){return this.x*=t,this.y*=t,this.z*=t,this.w*=t,this}applyMatrix4(t){const e=this.x,n=this.y,s=this.z,r=this.w,a=t.elements;return this.x=a[0]*e+a[4]*n+a[8]*s+a[12]*r,this.y=a[1]*e+a[5]*n+a[9]*s+a[13]*r,this.z=a[2]*e+a[6]*n+a[10]*s+a[14]*r,this.w=a[3]*e+a[7]*n+a[11]*s+a[15]*r,this}divide(t){return this.x/=t.x,this.y/=t.y,this.z/=t.z,this.w/=t.w,this}divideScalar(t){return this.multiplyScalar(1/t)}setAxisAngleFromQuaternion(t){this.w=2*Math.acos(t.w);const e=Math.sqrt(1-t.w*t.w);return e<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=t.x/e,this.y=t.y/e,this.z=t.z/e),this}setAxisAngleFromRotationMatrix(t){let e,n,s,r;const c=t.elements,l=c[0],u=c[4],f=c[8],h=c[1],p=c[5],_=c[9],y=c[2],m=c[6],d=c[10];if(Math.abs(u-h)<.01&&Math.abs(f-y)<.01&&Math.abs(_-m)<.01){if(Math.abs(u+h)<.1&&Math.abs(f+y)<.1&&Math.abs(_+m)<.1&&Math.abs(l+p+d-3)<.1)return this.set(1,0,0,0),this;e=Math.PI;const D=(l+1)/2,S=(p+1)/2,w=(d+1)/2,A=(u+h)/4,F=(f+y)/4,v=(_+m)/4;return D>S&&D>w?D<.01?(n=0,s=.707106781,r=.707106781):(n=Math.sqrt(D),s=A/n,r=F/n):S>w?S<.01?(n=.707106781,s=0,r=.707106781):(s=Math.sqrt(S),n=A/s,r=v/s):w<.01?(n=.707106781,s=.707106781,r=0):(r=Math.sqrt(w),n=F/r,s=v/r),this.set(n,s,r,e),this}let P=Math.sqrt((m-_)*(m-_)+(f-y)*(f-y)+(h-u)*(h-u));return Math.abs(P)<.001&&(P=1),this.x=(m-_)/P,this.y=(f-y)/P,this.z=(h-u)/P,this.w=Math.acos((l+p+d-1)/2),this}setFromMatrixPosition(t){const e=t.elements;return this.x=e[12],this.y=e[13],this.z=e[14],this.w=e[15],this}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this.z=Math.min(this.z,t.z),this.w=Math.min(this.w,t.w),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this.z=Math.max(this.z,t.z),this.w=Math.max(this.w,t.w),this}clamp(t,e){return this.x=$t(this.x,t.x,e.x),this.y=$t(this.y,t.y,e.y),this.z=$t(this.z,t.z,e.z),this.w=$t(this.w,t.w,e.w),this}clampScalar(t,e){return this.x=$t(this.x,t,e),this.y=$t(this.y,t,e),this.z=$t(this.z,t,e),this.w=$t(this.w,t,e),this}clampLength(t,e){const n=this.length();return this.divideScalar(n||1).multiplyScalar($t(n,t,e))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(t){return this.x*t.x+this.y*t.y+this.z*t.z+this.w*t.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this.z+=(t.z-this.z)*e,this.w+=(t.w-this.w)*e,this}lerpVectors(t,e,n){return this.x=t.x+(e.x-t.x)*n,this.y=t.y+(e.y-t.y)*n,this.z=t.z+(e.z-t.z)*n,this.w=t.w+(e.w-t.w)*n,this}equals(t){return t.x===this.x&&t.y===this.y&&t.z===this.z&&t.w===this.w}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this.z=t[e+2],this.w=t[e+3],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t[e+2]=this.z,t[e+3]=this.w,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this.z=t.getZ(e),this.w=t.getW(e),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}};Fa.prototype.isVector4=!0;let fe=Fa;class th extends Un{constructor(t=1,e=1,n={}){super(),n=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:Ae,depthBuffer:!0,stencilBuffer:!1,resolveColorBuffer:!0,resolveDepthBuffer:!0,resolveStencilBuffer:!0,storeMultisampledColorBuffer:!0,storeMultisampledDepthBuffer:!0,storeMultisampledStencilBuffer:!0,depthTexture:null,samples:0,count:1,depth:1,multiview:!1,useArrayDepthTexture:!1},n),this.isRenderTarget=!0,this.width=t,this.height=e,this.depth=n.depth,this.scissor=new fe(0,0,t,e),this.scissorTest=!1,this.viewport=new fe(0,0,t,e),this.textures=[];const s={width:t,height:e,depth:n.depth},r=new we(s),a=n.count;for(let o=0;o<a;o++)this.textures[o]=r.clone(),this.textures[o].isRenderTargetTexture=!0,this.textures[o].renderTarget=this;this._setTextureOptions(n),this.depthBuffer=n.depthBuffer,this.stencilBuffer=n.stencilBuffer,this.resolveColorBuffer=n.resolveColorBuffer,this.resolveDepthBuffer=n.resolveDepthBuffer,this.resolveStencilBuffer=n.resolveStencilBuffer,this.storeMultisampledColorBuffer=n.storeMultisampledColorBuffer,this.storeMultisampledDepthBuffer=n.storeMultisampledDepthBuffer,this.storeMultisampledStencilBuffer=n.storeMultisampledStencilBuffer,this._depthTexture=null,this.depthTexture=n.depthTexture,this.samples=n.samples,this.multiview=n.multiview,this.useArrayDepthTexture=n.useArrayDepthTexture}_setTextureOptions(t={}){const e={minFilter:Ae,generateMipmaps:!1,flipY:!1,internalFormat:null};t.mapping!==void 0&&(e.mapping=t.mapping),t.wrapS!==void 0&&(e.wrapS=t.wrapS),t.wrapT!==void 0&&(e.wrapT=t.wrapT),t.wrapR!==void 0&&(e.wrapR=t.wrapR),t.magFilter!==void 0&&(e.magFilter=t.magFilter),t.minFilter!==void 0&&(e.minFilter=t.minFilter),t.format!==void 0&&(e.format=t.format),t.type!==void 0&&(e.type=t.type),t.anisotropy!==void 0&&(e.anisotropy=t.anisotropy),t.colorSpace!==void 0&&(e.colorSpace=t.colorSpace),t.flipY!==void 0&&(e.flipY=t.flipY),t.generateMipmaps!==void 0&&(e.generateMipmaps=t.generateMipmaps),t.internalFormat!==void 0&&(e.internalFormat=t.internalFormat);for(let n=0;n<this.textures.length;n++)this.textures[n].setValues(e)}get texture(){return this.textures[0]}set texture(t){this.textures[0]=t}set depthTexture(t){this._depthTexture!==null&&this._depthTexture.renderTarget===this&&(this._depthTexture.renderTarget=null),t!==null&&t.renderTarget===null&&(t.renderTarget=this),this._depthTexture=t}get depthTexture(){return this._depthTexture}setSize(t,e,n=1){if(this.width!==t||this.height!==e||this.depth!==n){this.width=t,this.height=e,this.depth=n;for(let s=0,r=this.textures.length;s<r;s++)this.textures[s].image.width=t,this.textures[s].image.height=e,this.textures[s].image.depth=n,this.textures[s].isData3DTexture!==!0&&(this.textures[s].isArrayTexture=this.textures[s].image.depth>1);this.dispose()}this.viewport.set(0,0,t,e),this.scissor.set(0,0,t,e)}clone(){return new this.constructor().copy(this)}copy(t){this.width=t.width,this.height=t.height,this.depth=t.depth,this.scissor.copy(t.scissor),this.scissorTest=t.scissorTest,this.viewport.copy(t.viewport),this.textures.length=0;for(let e=0,n=t.textures.length;e<n;e++){this.textures[e]=t.textures[e].clone(),this.textures[e].isRenderTargetTexture=!0,this.textures[e].renderTarget=this;const s=Object.assign({},t.textures[e].image);this.textures[e].source=new ba(s)}if(this.depthBuffer=t.depthBuffer,this.stencilBuffer=t.stencilBuffer,this.resolveColorBuffer=t.resolveColorBuffer,this.resolveDepthBuffer=t.resolveDepthBuffer,this.resolveStencilBuffer=t.resolveStencilBuffer,this.storeMultisampledColorBuffer=t.storeMultisampledColorBuffer,this.storeMultisampledDepthBuffer=t.storeMultisampledDepthBuffer,this.storeMultisampledStencilBuffer=t.storeMultisampledStencilBuffer,t.depthTexture!==null)if(t.depthTexture.renderTarget===t){const e=t.depthTexture.clone();e.renderTarget=null,this.depthTexture=e}else this.depthTexture=t.depthTexture;return this.samples=t.samples,this.multiview=t.multiview,this.useArrayDepthTexture=t.useArrayDepthTexture,this}dispose(){this.dispatchEvent({type:"dispose"})}}class Je extends th{constructor(t=1,e=1,n={}){super(t,e,n),this.isWebGLRenderTarget=!0}}class Al extends we{constructor(t=null,e=1,n=1,s=1){super(null),this.isDataArrayTexture=!0,this.image={data:t,width:e,height:n,depth:s},this.magFilter=ye,this.minFilter=ye,this.wrapR=nn,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}copy(t){return super.copy(t),this.wrapR=t.wrapR,this}addLayerUpdate(t){this.layerUpdates.add(t)}clearLayerUpdates(){this.layerUpdates.clear()}}class eh extends we{constructor(t=null,e=1,n=1,s=1){super(null),this.isData3DTexture=!0,this.image={data:t,width:e,height:n,depth:s},this.magFilter=ye,this.minFilter=ye,this.wrapR=nn,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}copy(t){return super.copy(t),this.wrapR=t.wrapR,this}}const Os=class Os{constructor(t,e,n,s,r,a,o,c,l,u,f,h,p,_,y,m){this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],t!==void 0&&this.set(t,e,n,s,r,a,o,c,l,u,f,h,p,_,y,m)}set(t,e,n,s,r,a,o,c,l,u,f,h,p,_,y,m){const d=this.elements;return d[0]=t,d[4]=e,d[8]=n,d[12]=s,d[1]=r,d[5]=a,d[9]=o,d[13]=c,d[2]=l,d[6]=u,d[10]=f,d[14]=h,d[3]=p,d[7]=_,d[11]=y,d[15]=m,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new Os().fromArray(this.elements)}copy(t){const e=this.elements,n=t.elements;return e[0]=n[0],e[1]=n[1],e[2]=n[2],e[3]=n[3],e[4]=n[4],e[5]=n[5],e[6]=n[6],e[7]=n[7],e[8]=n[8],e[9]=n[9],e[10]=n[10],e[11]=n[11],e[12]=n[12],e[13]=n[13],e[14]=n[14],e[15]=n[15],this}copyPosition(t){const e=this.elements,n=t.elements;return e[12]=n[12],e[13]=n[13],e[14]=n[14],this}setFromMatrix3(t){const e=t.elements;return this.set(e[0],e[3],e[6],0,e[1],e[4],e[7],0,e[2],e[5],e[8],0,0,0,0,1),this}extractBasis(t,e,n){return this.determinantAffine()===0?(t.set(1,0,0),e.set(0,1,0),n.set(0,0,1),this):(t.setFromMatrixColumn(this,0),e.setFromMatrixColumn(this,1),n.setFromMatrixColumn(this,2),this)}makeBasis(t,e,n){return this.set(t.x,e.x,n.x,0,t.y,e.y,n.y,0,t.z,e.z,n.z,0,0,0,0,1),this}extractRotation(t){if(t.determinantAffine()===0)return this.identity();const e=this.elements,n=t.elements,s=1/Qn.setFromMatrixColumn(t,0).length(),r=1/Qn.setFromMatrixColumn(t,1).length(),a=1/Qn.setFromMatrixColumn(t,2).length();return e[0]=n[0]*s,e[1]=n[1]*s,e[2]=n[2]*s,e[3]=0,e[4]=n[4]*r,e[5]=n[5]*r,e[6]=n[6]*r,e[7]=0,e[8]=n[8]*a,e[9]=n[9]*a,e[10]=n[10]*a,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,this}makeRotationFromEuler(t){const e=this.elements,n=t.x,s=t.y,r=t.z,a=Math.cos(n),o=Math.sin(n),c=Math.cos(s),l=Math.sin(s),u=Math.cos(r),f=Math.sin(r);if(t.order==="XYZ"){const h=a*u,p=a*f,_=o*u,y=o*f;e[0]=c*u,e[4]=-c*f,e[8]=l,e[1]=p+_*l,e[5]=h-y*l,e[9]=-o*c,e[2]=y-h*l,e[6]=_+p*l,e[10]=a*c}else if(t.order==="YXZ"){const h=c*u,p=c*f,_=l*u,y=l*f;e[0]=h+y*o,e[4]=_*o-p,e[8]=a*l,e[1]=a*f,e[5]=a*u,e[9]=-o,e[2]=p*o-_,e[6]=y+h*o,e[10]=a*c}else if(t.order==="ZXY"){const h=c*u,p=c*f,_=l*u,y=l*f;e[0]=h-y*o,e[4]=-a*f,e[8]=_+p*o,e[1]=p+_*o,e[5]=a*u,e[9]=y-h*o,e[2]=-a*l,e[6]=o,e[10]=a*c}else if(t.order==="ZYX"){const h=a*u,p=a*f,_=o*u,y=o*f;e[0]=c*u,e[4]=_*l-p,e[8]=h*l+y,e[1]=c*f,e[5]=y*l+h,e[9]=p*l-_,e[2]=-l,e[6]=o*c,e[10]=a*c}else if(t.order==="YZX"){const h=a*c,p=a*l,_=o*c,y=o*l;e[0]=c*u,e[4]=y-h*f,e[8]=_*f+p,e[1]=f,e[5]=a*u,e[9]=-o*u,e[2]=-l*u,e[6]=p*f+_,e[10]=h-y*f}else if(t.order==="XZY"){const h=a*c,p=a*l,_=o*c,y=o*l;e[0]=c*u,e[4]=-f,e[8]=l*u,e[1]=h*f+y,e[5]=a*u,e[9]=p*f-_,e[2]=_*f-p,e[6]=o*u,e[10]=y*f+h}return e[3]=0,e[7]=0,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,this}makeRotationFromQuaternion(t){return this.compose(nh,t,ih)}lookAt(t,e,n){const s=this.elements;return Ue.subVectors(t,e),Ue.lengthSq()===0&&(Ue.z=1),Ue.normalize(),An.crossVectors(n,Ue),An.lengthSq()===0&&(Math.abs(n.z)===1?Ue.x+=1e-4:Ue.z+=1e-4,Ue.normalize(),An.crossVectors(n,Ue)),An.normalize(),Ji.crossVectors(Ue,An),s[0]=An.x,s[4]=Ji.x,s[8]=Ue.x,s[1]=An.y,s[5]=Ji.y,s[9]=Ue.y,s[2]=An.z,s[6]=Ji.z,s[10]=Ue.z,this}multiply(t){return this.multiplyMatrices(this,t)}premultiply(t){return this.multiplyMatrices(t,this)}multiplyMatrices(t,e){const n=t.elements,s=e.elements,r=this.elements,a=n[0],o=n[4],c=n[8],l=n[12],u=n[1],f=n[5],h=n[9],p=n[13],_=n[2],y=n[6],m=n[10],d=n[14],P=n[3],D=n[7],S=n[11],w=n[15],A=s[0],F=s[4],v=s[8],R=s[12],B=s[1],X=s[5],q=s[9],nt=s[13],G=s[2],J=s[6],lt=s[10],K=s[14],Z=s[3],it=s[7],rt=s[11],ht=s[15];return r[0]=a*A+o*B+c*G+l*Z,r[4]=a*F+o*X+c*J+l*it,r[8]=a*v+o*q+c*lt+l*rt,r[12]=a*R+o*nt+c*K+l*ht,r[1]=u*A+f*B+h*G+p*Z,r[5]=u*F+f*X+h*J+p*it,r[9]=u*v+f*q+h*lt+p*rt,r[13]=u*R+f*nt+h*K+p*ht,r[2]=_*A+y*B+m*G+d*Z,r[6]=_*F+y*X+m*J+d*it,r[10]=_*v+y*q+m*lt+d*rt,r[14]=_*R+y*nt+m*K+d*ht,r[3]=P*A+D*B+S*G+w*Z,r[7]=P*F+D*X+S*J+w*it,r[11]=P*v+D*q+S*lt+w*rt,r[15]=P*R+D*nt+S*K+w*ht,this}multiplyScalar(t){const e=this.elements;return e[0]*=t,e[4]*=t,e[8]*=t,e[12]*=t,e[1]*=t,e[5]*=t,e[9]*=t,e[13]*=t,e[2]*=t,e[6]*=t,e[10]*=t,e[14]*=t,e[3]*=t,e[7]*=t,e[11]*=t,e[15]*=t,this}determinant(){const t=this.elements,e=t[0],n=t[4],s=t[8],r=t[12],a=t[1],o=t[5],c=t[9],l=t[13],u=t[2],f=t[6],h=t[10],p=t[14],_=t[3],y=t[7],m=t[11],d=t[15],P=c*p-l*h,D=o*p-l*f,S=o*h-c*f,w=a*p-l*u,A=a*h-c*u,F=a*f-o*u;return e*(y*P-m*D+d*S)-n*(_*P-m*w+d*A)+s*(_*D-y*w+d*F)-r*(_*S-y*A+m*F)}determinantAffine(){const t=this.elements,e=t[0],n=t[4],s=t[8],r=t[1],a=t[5],o=t[9],c=t[2],l=t[6],u=t[10];return e*(a*u-o*l)-n*(r*u-o*c)+s*(r*l-a*c)}transpose(){const t=this.elements;let e;return e=t[1],t[1]=t[4],t[4]=e,e=t[2],t[2]=t[8],t[8]=e,e=t[6],t[6]=t[9],t[9]=e,e=t[3],t[3]=t[12],t[12]=e,e=t[7],t[7]=t[13],t[13]=e,e=t[11],t[11]=t[14],t[14]=e,this}setPosition(t,e,n){const s=this.elements;return t.isVector3?(s[12]=t.x,s[13]=t.y,s[14]=t.z):(s[12]=t,s[13]=e,s[14]=n),this}invert(){const t=this.elements,e=t[0],n=t[1],s=t[2],r=t[3],a=t[4],o=t[5],c=t[6],l=t[7],u=t[8],f=t[9],h=t[10],p=t[11],_=t[12],y=t[13],m=t[14],d=t[15],P=e*o-n*a,D=e*c-s*a,S=e*l-r*a,w=n*c-s*o,A=n*l-r*o,F=s*l-r*c,v=u*y-f*_,R=u*m-h*_,B=u*d-p*_,X=f*m-h*y,q=f*d-p*y,nt=h*d-p*m,G=P*nt-D*q+S*X+w*B-A*R+F*v;if(G===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);const J=1/G;return t[0]=(o*nt-c*q+l*X)*J,t[1]=(s*q-n*nt-r*X)*J,t[2]=(y*F-m*A+d*w)*J,t[3]=(h*A-f*F-p*w)*J,t[4]=(c*B-a*nt-l*R)*J,t[5]=(e*nt-s*B+r*R)*J,t[6]=(m*S-_*F-d*D)*J,t[7]=(u*F-h*S+p*D)*J,t[8]=(a*q-o*B+l*v)*J,t[9]=(n*B-e*q-r*v)*J,t[10]=(_*A-y*S+d*P)*J,t[11]=(f*S-u*A-p*P)*J,t[12]=(o*R-a*X-c*v)*J,t[13]=(e*X-n*R+s*v)*J,t[14]=(y*D-_*w-m*P)*J,t[15]=(u*w-f*D+h*P)*J,this}scale(t){const e=this.elements,n=t.x,s=t.y,r=t.z;return e[0]*=n,e[4]*=s,e[8]*=r,e[1]*=n,e[5]*=s,e[9]*=r,e[2]*=n,e[6]*=s,e[10]*=r,e[3]*=n,e[7]*=s,e[11]*=r,this}getMaxScaleOnAxis(){const t=this.elements,e=t[0]*t[0]+t[1]*t[1]+t[2]*t[2],n=t[4]*t[4]+t[5]*t[5]+t[6]*t[6],s=t[8]*t[8]+t[9]*t[9]+t[10]*t[10];return Math.sqrt(Math.max(e,n,s))}makeTranslation(t,e,n){return t.isVector3?this.set(1,0,0,t.x,0,1,0,t.y,0,0,1,t.z,0,0,0,1):this.set(1,0,0,t,0,1,0,e,0,0,1,n,0,0,0,1),this}makeRotationX(t){const e=Math.cos(t),n=Math.sin(t);return this.set(1,0,0,0,0,e,-n,0,0,n,e,0,0,0,0,1),this}makeRotationY(t){const e=Math.cos(t),n=Math.sin(t);return this.set(e,0,n,0,0,1,0,0,-n,0,e,0,0,0,0,1),this}makeRotationZ(t){const e=Math.cos(t),n=Math.sin(t);return this.set(e,-n,0,0,n,e,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(t,e){const n=Math.cos(e),s=Math.sin(e),r=1-n,a=t.x,o=t.y,c=t.z,l=r*a,u=r*o;return this.set(l*a+n,l*o-s*c,l*c+s*o,0,l*o+s*c,u*o+n,u*c-s*a,0,l*c-s*o,u*c+s*a,r*c*c+n,0,0,0,0,1),this}makeScale(t,e,n){return this.set(t,0,0,0,0,e,0,0,0,0,n,0,0,0,0,1),this}makeShear(t,e,n,s,r,a){return this.set(1,n,r,0,t,1,a,0,e,s,1,0,0,0,0,1),this}compose(t,e,n){const s=this.elements,r=e._x,a=e._y,o=e._z,c=e._w,l=r+r,u=a+a,f=o+o,h=r*l,p=r*u,_=r*f,y=a*u,m=a*f,d=o*f,P=c*l,D=c*u,S=c*f,w=n.x,A=n.y,F=n.z;return s[0]=(1-(y+d))*w,s[1]=(p+S)*w,s[2]=(_-D)*w,s[3]=0,s[4]=(p-S)*A,s[5]=(1-(h+d))*A,s[6]=(m+P)*A,s[7]=0,s[8]=(_+D)*F,s[9]=(m-P)*F,s[10]=(1-(h+y))*F,s[11]=0,s[12]=t.x,s[13]=t.y,s[14]=t.z,s[15]=1,this}decompose(t,e,n){const s=this.elements;t.x=s[12],t.y=s[13],t.z=s[14];const r=this.determinantAffine();if(r===0)return n.set(1,1,1),e.identity(),this;let a=Qn.set(s[0],s[1],s[2]).length();const o=Qn.set(s[4],s[5],s[6]).length(),c=Qn.set(s[8],s[9],s[10]).length();r<0&&(a=-a),We.copy(this);const l=1/a,u=1/o,f=1/c;return We.elements[0]*=l,We.elements[1]*=l,We.elements[2]*=l,We.elements[4]*=u,We.elements[5]*=u,We.elements[6]*=u,We.elements[8]*=f,We.elements[9]*=f,We.elements[10]*=f,e.setFromRotationMatrix(We),n.x=a,n.y=o,n.z=c,this}makePerspective(t,e,n,s,r,a,o=rn,c=!1){const l=this.elements,u=2*r/(e-t),f=2*r/(n-s),h=(e+t)/(e-t),p=(n+s)/(n-s);let _,y;if(c)_=r/(a-r),y=a*r/(a-r);else if(o===rn)_=-(a+r)/(a-r),y=-2*a*r/(a-r);else if(o===Bi)_=-a/(a-r),y=-a*r/(a-r);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+o);return l[0]=u,l[4]=0,l[8]=h,l[12]=0,l[1]=0,l[5]=f,l[9]=p,l[13]=0,l[2]=0,l[6]=0,l[10]=_,l[14]=y,l[3]=0,l[7]=0,l[11]=-1,l[15]=0,this}makeOrthographic(t,e,n,s,r,a,o=rn,c=!1){const l=this.elements,u=2/(e-t),f=2/(n-s),h=-(e+t)/(e-t),p=-(n+s)/(n-s);let _,y;if(c)_=1/(a-r),y=a/(a-r);else if(o===rn)_=-2/(a-r),y=-(a+r)/(a-r);else if(o===Bi)_=-1/(a-r),y=-r/(a-r);else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+o);return l[0]=u,l[4]=0,l[8]=0,l[12]=h,l[1]=0,l[5]=f,l[9]=0,l[13]=p,l[2]=0,l[6]=0,l[10]=_,l[14]=y,l[3]=0,l[7]=0,l[11]=0,l[15]=1,this}equals(t){const e=this.elements,n=t.elements;for(let s=0;s<16;s++)if(e[s]!==n[s])return!1;return!0}fromArray(t,e=0){for(let n=0;n<16;n++)this.elements[n]=t[n+e];return this}toArray(t=[],e=0){const n=this.elements;return t[e]=n[0],t[e+1]=n[1],t[e+2]=n[2],t[e+3]=n[3],t[e+4]=n[4],t[e+5]=n[5],t[e+6]=n[6],t[e+7]=n[7],t[e+8]=n[8],t[e+9]=n[9],t[e+10]=n[10],t[e+11]=n[11],t[e+12]=n[12],t[e+13]=n[13],t[e+14]=n[14],t[e+15]=n[15],t}};Os.prototype.isMatrix4=!0;let pe=Os;const Qn=new H,We=new pe,nh=new H(0,0,0),ih=new H(1,1,1),An=new H,Ji=new H,Ue=new H,so=new pe,ro=new In;class Nn{constructor(t=0,e=0,n=0,s=Nn.DEFAULT_ORDER){this.isEuler=!0,this._x=t,this._y=e,this._z=n,this._order=s}get x(){return this._x}set x(t){this._x=t,this._onChangeCallback()}get y(){return this._y}set y(t){this._y=t,this._onChangeCallback()}get z(){return this._z}set z(t){this._z=t,this._onChangeCallback()}get order(){return this._order}set order(t){this._order=t,this._onChangeCallback()}set(t,e,n,s=this._order){return this._x=t,this._y=e,this._z=n,this._order=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(t){return this._x=t._x,this._y=t._y,this._z=t._z,this._order=t._order,this._onChangeCallback(),this}setFromRotationMatrix(t,e=this._order,n=!0){const s=t.elements,r=s[0],a=s[4],o=s[8],c=s[1],l=s[5],u=s[9],f=s[2],h=s[6],p=s[10];switch(e){case"XYZ":this._y=Math.asin($t(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(-u,p),this._z=Math.atan2(-a,r)):(this._x=Math.atan2(h,l),this._z=0);break;case"YXZ":this._x=Math.asin(-$t(u,-1,1)),Math.abs(u)<.9999999?(this._y=Math.atan2(o,p),this._z=Math.atan2(c,l)):(this._y=Math.atan2(-f,r),this._z=0);break;case"ZXY":this._x=Math.asin($t(h,-1,1)),Math.abs(h)<.9999999?(this._y=Math.atan2(-f,p),this._z=Math.atan2(-a,l)):(this._y=0,this._z=Math.atan2(c,r));break;case"ZYX":this._y=Math.asin(-$t(f,-1,1)),Math.abs(f)<.9999999?(this._x=Math.atan2(h,p),this._z=Math.atan2(c,r)):(this._x=0,this._z=Math.atan2(-a,l));break;case"YZX":this._z=Math.asin($t(c,-1,1)),Math.abs(c)<.9999999?(this._x=Math.atan2(-u,l),this._y=Math.atan2(-f,r)):(this._x=0,this._y=Math.atan2(o,p));break;case"XZY":this._z=Math.asin(-$t(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(h,l),this._y=Math.atan2(o,r)):(this._x=Math.atan2(-u,p),this._y=0);break;default:Wt("Euler: .setFromRotationMatrix() encountered an unknown order: "+e)}return this._order=e,n===!0&&this._onChangeCallback(),this}setFromQuaternion(t,e,n){return so.makeRotationFromQuaternion(t),this.setFromRotationMatrix(so,e,n)}setFromVector3(t,e=this._order){return this.set(t.x,t.y,t.z,e)}reorder(t){return ro.setFromEuler(this),this.setFromQuaternion(ro,t)}equals(t){return t._x===this._x&&t._y===this._y&&t._z===this._z&&t._order===this._order}fromArray(t){return this._x=t[0],this._y=t[1],this._z=t[2],t[3]!==void 0&&(this._order=t[3]),this._onChangeCallback(),this}toArray(t=[],e=0){return t[e]=this._x,t[e+1]=this._y,t[e+2]=this._z,t[e+3]=this._order,t}_onChange(t){return this._onChangeCallback=t,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}}Nn.DEFAULT_ORDER="XYZ";class wl{constructor(){this.mask=1}set(t){this.mask=(1<<t|0)>>>0}enable(t){this.mask|=1<<t|0}enableAll(){this.mask=-1}toggle(t){this.mask^=1<<t|0}disable(t){this.mask&=~(1<<t|0)}disableAll(){this.mask=0}test(t){return(this.mask&t.mask)!==0}isEnabled(t){return(this.mask&(1<<t|0))!==0}}let sh=0;const ao=new H,jn=new In,dn=new pe,$i=new H,Ei=new H,rh=new H,ah=new In,oo=new H(1,0,0),lo=new H(0,1,0),co=new H(0,0,1),ho={type:"added"},oh={type:"removed"},ti={type:"childadded",child:null},js={type:"childremoved",child:null};class Re extends Un{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:sh++}),this.uuid=Si(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=Re.DEFAULT_UP.clone();const t=new H,e=new Nn,n=new In,s=new H(1,1,1);function r(){n.setFromEuler(e,!1)}function a(){e.setFromQuaternion(n,void 0,!1)}e._onChange(r),n._onChange(a),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:t},rotation:{configurable:!0,enumerable:!0,value:e},quaternion:{configurable:!0,enumerable:!0,value:n},scale:{configurable:!0,enumerable:!0,value:s},modelViewMatrix:{value:new pe},normalMatrix:{value:new kt}}),this.matrix=new pe,this.matrixWorld=new pe,this.matrixAutoUpdate=Re.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=Re.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new wl,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.customDepthMaterial=void 0,this.customDistanceMaterial=void 0,this.static=!1,this.userData={},this.pivot=null}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(t){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(t),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(t){return this.quaternion.premultiply(t),this}setRotationFromAxisAngle(t,e){this.quaternion.setFromAxisAngle(t,e)}setRotationFromEuler(t){this.quaternion.setFromEuler(t,!0)}setRotationFromMatrix(t){this.quaternion.setFromRotationMatrix(t)}setRotationFromQuaternion(t){this.quaternion.copy(t)}rotateOnAxis(t,e){return jn.setFromAxisAngle(t,e),this.quaternion.multiply(jn),this}rotateOnWorldAxis(t,e){return jn.setFromAxisAngle(t,e),this.quaternion.premultiply(jn),this}rotateX(t){return this.rotateOnAxis(oo,t)}rotateY(t){return this.rotateOnAxis(lo,t)}rotateZ(t){return this.rotateOnAxis(co,t)}translateOnAxis(t,e){return ao.copy(t).applyQuaternion(this.quaternion),this.position.add(ao.multiplyScalar(e)),this}translateX(t){return this.translateOnAxis(oo,t)}translateY(t){return this.translateOnAxis(lo,t)}translateZ(t){return this.translateOnAxis(co,t)}localToWorld(t){return this.updateWorldMatrix(!0,!1),t.applyMatrix4(this.matrixWorld)}worldToLocal(t){return this.updateWorldMatrix(!0,!1),t.applyMatrix4(dn.copy(this.matrixWorld).invert())}lookAt(t,e,n){t.isVector3?$i.copy(t):$i.set(t,e,n);const s=this.parent;this.updateWorldMatrix(!0,!1),Ei.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?dn.lookAt(Ei,$i,this.up):dn.lookAt($i,Ei,this.up),this.quaternion.setFromRotationMatrix(dn),s&&(dn.extractRotation(s.matrixWorld),jn.setFromRotationMatrix(dn),this.quaternion.premultiply(jn.invert()))}add(t){if(arguments.length>1){for(let e=0;e<arguments.length;e++)this.add(arguments[e]);return this}return t===this?(ne("Object3D.add: object can't be added as a child of itself.",t),this):(t&&t.isObject3D?(t.removeFromParent(),t.parent=this,this.children.push(t),t.dispatchEvent(ho),ti.child=t,this.dispatchEvent(ti),ti.child=null):ne("Object3D.add: object not an instance of THREE.Object3D.",t),this)}remove(t){if(arguments.length>1){for(let n=0;n<arguments.length;n++)this.remove(arguments[n]);return this}const e=this.children.indexOf(t);return e!==-1&&(t.parent=null,this.children.splice(e,1),t.dispatchEvent(oh),js.child=t,this.dispatchEvent(js),js.child=null),this}removeFromParent(){const t=this.parent;return t!==null&&t.remove(this),this}clear(){return this.remove(...this.children)}attach(t){return this.updateWorldMatrix(!0,!1),dn.copy(this.matrixWorld).invert(),t.parent!==null&&(t.parent.updateWorldMatrix(!0,!1),dn.multiply(t.parent.matrixWorld)),t.applyMatrix4(dn),t.removeFromParent(),t.parent=this,this.children.push(t),t.updateWorldMatrix(!1,!0),t.dispatchEvent(ho),ti.child=t,this.dispatchEvent(ti),ti.child=null,this}getObjectById(t){return this.getObjectByProperty("id",t)}getObjectByName(t){return this.getObjectByProperty("name",t)}getObjectByProperty(t,e){if(this[t]===e)return this;for(let n=0,s=this.children.length;n<s;n++){const a=this.children[n].getObjectByProperty(t,e);if(a!==void 0)return a}}getObjectsByProperty(t,e,n=[]){this[t]===e&&n.push(this);const s=this.children;for(let r=0,a=s.length;r<a;r++)s[r].getObjectsByProperty(t,e,n);return n}getWorldPosition(t){return this.updateWorldMatrix(!0,!1),t.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(t){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Ei,t,rh),t}getWorldScale(t){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Ei,ah,t),t}getWorldDirection(t){this.updateWorldMatrix(!0,!1);const e=this.matrixWorld.elements;return t.set(e[8],e[9],e[10]).normalize()}raycast(){}intersectsFrustum(){}traverse(t){t(this);const e=this.children;for(let n=0,s=e.length;n<s;n++)e[n].traverse(t)}traverseVisible(t){if(this.visible===!1)return;t(this);const e=this.children;for(let n=0,s=e.length;n<s;n++)e[n].traverseVisible(t)}traverseAncestors(t){const e=this.parent;e!==null&&(t(e),e.traverseAncestors(t))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale);const t=this.pivot;if(t!==null){const e=t.x,n=t.y,s=t.z,r=this.matrix.elements;r[12]+=e-r[0]*e-r[4]*n-r[8]*s,r[13]+=n-r[1]*e-r[5]*n-r[9]*s,r[14]+=s-r[2]*e-r[6]*n-r[10]*s}this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(t){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||t)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,t=!0);const e=this.children;for(let n=0,s=e.length;n<s;n++)e[n].updateMatrixWorld(t)}updateWorldMatrix(t,e,n=!1){const s=this.parent;if(t===!0&&s!==null&&s.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||n)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,n=!0),e===!0){const r=this.children;for(let a=0,o=r.length;a<o;a++)r[a].updateWorldMatrix(!1,!0,n)}}toJSON(t){const e=t===void 0||typeof t=="string",n={};e&&(t={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},n.metadata={version:4.7,type:"Object",generator:"Object3D.toJSON"});const s={};s.uuid=this.uuid,s.type=this.type,s.name=this.name,s.castShadow=this.castShadow,s.receiveShadow=this.receiveShadow,s.visible=this.visible,s.frustumCulled=this.frustumCulled,s.renderOrder=this.renderOrder,s.static=this.static,s.matrixAutoUpdate=this.matrixAutoUpdate,Object.keys(this.userData).length>0&&(s.userData=this.userData),s.layers=this.layers.mask,s.matrix=this.matrix.toArray(),s.up=this.up.toArray(),this.pivot!==null&&(s.pivot=this.pivot.toArray()),this.morphTargetDictionary!==void 0&&(s.morphTargetDictionary=Object.assign({},this.morphTargetDictionary)),this.morphTargetInfluences!==void 0&&(s.morphTargetInfluences=this.morphTargetInfluences.slice()),this.isInstancedMesh&&(s.type="InstancedMesh",s.count=this.count,s.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(s.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(s.type="BatchedMesh",s.perObjectFrustumCulled=this.perObjectFrustumCulled,s.sortObjects=this.sortObjects,s.drawRanges=this._drawRanges,s.reservedRanges=this._reservedRanges,s.geometryInfo=this._geometryInfo.map(o=>({...o,boundingBox:o.boundingBox?o.boundingBox.toJSON():void 0,boundingSphere:o.boundingSphere?o.boundingSphere.toJSON():void 0})),s.instanceInfo=this._instanceInfo.map(o=>({...o})),s.availableInstanceIds=this._availableInstanceIds.slice(),s.availableGeometryIds=this._availableGeometryIds.slice(),s.nextIndexStart=this._nextIndexStart,s.nextVertexStart=this._nextVertexStart,s.geometryCount=this._geometryCount,s.maxInstanceCount=this._maxInstanceCount,s.maxVertexCount=this._maxVertexCount,s.maxIndexCount=this._maxIndexCount,s.geometryInitialized=this._geometryInitialized,s.matricesTexture=this._matricesTexture.toJSON(t),s.indirectTexture=this._indirectTexture.toJSON(t),this._colorsTexture!==null&&(s.colorsTexture=this._colorsTexture.toJSON(t)),this.boundingSphere!==null&&(s.boundingSphere=this.boundingSphere.toJSON()),this.boundingBox!==null&&(s.boundingBox=this.boundingBox.toJSON()));function r(o,c){return o[c.uuid]===void 0&&(o[c.uuid]=c.toJSON(t)),c.uuid}if(this.isScene)this.background&&(this.background.isColor?s.background=this.background.toJSON():this.background.isTexture&&(s.background=this.background.toJSON(t).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(s.environment=this.environment.toJSON(t).uuid);else if(this.isMesh||this.isLine||this.isPoints){s.geometry=r(t.geometries,this.geometry);const o=this.geometry.parameters;if(o!==void 0&&o.shapes!==void 0){const c=o.shapes;if(Array.isArray(c))for(let l=0,u=c.length;l<u;l++){const f=c[l];r(t.shapes,f)}else r(t.shapes,c)}}if(this.isSkinnedMesh&&(s.bindMode=this.bindMode,s.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(r(t.skeletons,this.skeleton),s.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){const o=[];for(let c=0,l=this.material.length;c<l;c++)o.push(r(t.materials,this.material[c]));s.material=o}else s.material=r(t.materials,this.material);if(this.children.length>0){s.children=[];for(let o=0;o<this.children.length;o++)s.children.push(this.children[o].toJSON(t).object)}if(this.animations.length>0){s.animations=[];for(let o=0;o<this.animations.length;o++){const c=this.animations[o];s.animations.push(r(t.animations,c))}}if(e){const o=a(t.geometries),c=a(t.materials),l=a(t.textures),u=a(t.images),f=a(t.shapes),h=a(t.skeletons),p=a(t.animations),_=a(t.nodes);o.length>0&&(n.geometries=o),c.length>0&&(n.materials=c),l.length>0&&(n.textures=l),u.length>0&&(n.images=u),f.length>0&&(n.shapes=f),h.length>0&&(n.skeletons=h),p.length>0&&(n.animations=p),_.length>0&&(n.nodes=_)}return n.object=s,n;function a(o){const c=[];for(const l in o){const u=o[l];delete u.metadata,c.push(u)}return c}}clone(t){return new this.constructor().copy(this,t)}copy(t,e=!0){if(this.name=t.name,this.up.copy(t.up),this.position.copy(t.position),this.rotation.order=t.rotation.order,this.quaternion.copy(t.quaternion),this.scale.copy(t.scale),this.pivot=t.pivot!==null?t.pivot.clone():null,this.matrix.copy(t.matrix),this.matrixWorld.copy(t.matrixWorld),this.matrixAutoUpdate=t.matrixAutoUpdate,this.matrixWorldAutoUpdate=t.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=t.matrixWorldNeedsUpdate,this.layers.mask=t.layers.mask,this.visible=t.visible,this.castShadow=t.castShadow,this.receiveShadow=t.receiveShadow,this.frustumCulled=t.frustumCulled,this.renderOrder=t.renderOrder,this.static=t.static,this.animations=t.animations.slice(),this.userData=JSON.parse(JSON.stringify(t.userData)),e===!0)for(let n=0;n<t.children.length;n++){const s=t.children[n];this.add(s.clone())}return this}dispose(){this.dispatchEvent({type:"dispose"})}}Re.DEFAULT_UP=new H(0,1,0);Re.DEFAULT_MATRIX_AUTO_UPDATE=!0;Re.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;class Qi extends Re{constructor(){super(),this.isGroup=!0,this.type="Group"}}const lh={type:"move"};class tr{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new Qi,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new Qi,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new H,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new H),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new Qi,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new H,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new H,this._grip.eventsEnabled=!1),this._grip}dispatchEvent(t){return this._targetRay!==null&&this._targetRay.dispatchEvent(t),this._grip!==null&&this._grip.dispatchEvent(t),this._hand!==null&&this._hand.dispatchEvent(t),this}connect(t){if(t&&t.hand){const e=this._hand;if(e)for(const n of t.hand.values())this._getHandJoint(e,n)}return this.dispatchEvent({type:"connected",data:t}),this}disconnect(t){return this.dispatchEvent({type:"disconnected",data:t}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(t,e,n){let s=null,r=null,a=null;const o=this._targetRay,c=this._grip,l=this._hand;if(t&&e.session.visibilityState!=="visible-blurred"){if(l&&t.hand){a=!0;for(const y of t.hand.values()){const m=e.getJointPose(y,n),d=this._getHandJoint(l,y);m!==null&&(d.matrix.fromArray(m.transform.matrix),d.matrix.decompose(d.position,d.rotation,d.scale),d.matrixWorldNeedsUpdate=!0,d.jointRadius=m.radius),d.visible=m!==null}const u=l.joints["index-finger-tip"],f=l.joints["thumb-tip"],h=u.position.distanceTo(f.position),p=.02,_=.005;l.inputState.pinching&&h>p+_?(l.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:t.handedness,target:this})):!l.inputState.pinching&&h<=p-_&&(l.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:t.handedness,target:this}))}else c!==null&&t.gripSpace&&(r=e.getPose(t.gripSpace,n),r!==null&&(c.matrix.fromArray(r.transform.matrix),c.matrix.decompose(c.position,c.rotation,c.scale),c.matrixWorldNeedsUpdate=!0,r.linearVelocity?(c.hasLinearVelocity=!0,c.linearVelocity.copy(r.linearVelocity)):c.hasLinearVelocity=!1,r.angularVelocity?(c.hasAngularVelocity=!0,c.angularVelocity.copy(r.angularVelocity)):c.hasAngularVelocity=!1,c.eventsEnabled&&c.dispatchEvent({type:"gripUpdated",data:t,target:this})));o!==null&&(s=e.getPose(t.targetRaySpace,n),s===null&&r!==null&&(s=r),s!==null&&(o.matrix.fromArray(s.transform.matrix),o.matrix.decompose(o.position,o.rotation,o.scale),o.matrixWorldNeedsUpdate=!0,s.linearVelocity?(o.hasLinearVelocity=!0,o.linearVelocity.copy(s.linearVelocity)):o.hasLinearVelocity=!1,s.angularVelocity?(o.hasAngularVelocity=!0,o.angularVelocity.copy(s.angularVelocity)):o.hasAngularVelocity=!1,this.dispatchEvent(lh)))}return o!==null&&(o.visible=s!==null),c!==null&&(c.visible=r!==null),l!==null&&(l.visible=a!==null),this}_getHandJoint(t,e){if(t.joints[e.jointName]===void 0){const n=new Qi;n.matrixAutoUpdate=!1,n.visible=!1,t.joints[e.jointName]=n,t.add(n)}return t.joints[e.jointName]}}const Rl={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},wn={h:0,s:0,l:0},ji={h:0,s:0,l:0};function er(i,t,e){return e<0&&(e+=1),e>1&&(e-=1),e<1/6?i+(t-i)*6*e:e<1/2?t:e<2/3?i+(t-i)*6*(2/3-e):i}class jt{constructor(t,e,n){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(t,e,n)}set(t,e,n){if(e===void 0&&n===void 0){const s=t;s&&s.isColor?this.copy(s):typeof s=="number"?this.setHex(s):typeof s=="string"&&this.setStyle(s)}else this.setRGB(t,e,n);return this}setScalar(t){return this.r=t,this.g=t,this.b=t,this}setHex(t,e=Oe){return t=Math.floor(t),this.r=(t>>16&255)/255,this.g=(t>>8&255)/255,this.b=(t&255)/255,te.colorSpaceToWorking(this,e),this}setRGB(t,e,n,s=te.workingColorSpace){return this.r=t,this.g=e,this.b=n,te.colorSpaceToWorking(this,s),this}setHSL(t,e,n,s=te.workingColorSpace){if(t=Zc(t,1),e=$t(e,0,1),n=$t(n,0,1),e===0)this.r=this.g=this.b=n;else{const r=n<=.5?n*(1+e):n+e-n*e,a=2*n-r;this.r=er(a,r,t+1/3),this.g=er(a,r,t),this.b=er(a,r,t-1/3)}return te.colorSpaceToWorking(this,s),this}setStyle(t,e=Oe){function n(r){r!==void 0&&parseFloat(r)<1&&Wt("Color: Alpha component of "+t+" will be ignored.")}let s;if(s=/^(\w+)\(([^\)]*)\)/.exec(t)){let r;const a=s[1],o=s[2];switch(a){case"rgb":case"rgba":if(r=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(r[4]),this.setRGB(Math.min(255,parseInt(r[1],10))/255,Math.min(255,parseInt(r[2],10))/255,Math.min(255,parseInt(r[3],10))/255,e);if(r=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(r[4]),this.setRGB(Math.min(100,parseInt(r[1],10))/100,Math.min(100,parseInt(r[2],10))/100,Math.min(100,parseInt(r[3],10))/100,e);break;case"hsl":case"hsla":if(r=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(r[4]),this.setHSL(parseFloat(r[1])/360,parseFloat(r[2])/100,parseFloat(r[3])/100,e);break;default:Wt("Color: Unknown color model "+t)}}else if(s=/^\#([A-Fa-f\d]+)$/.exec(t)){const r=s[1],a=r.length;if(a===3)return this.setRGB(parseInt(r.charAt(0),16)/15,parseInt(r.charAt(1),16)/15,parseInt(r.charAt(2),16)/15,e);if(a===6)return this.setHex(parseInt(r,16),e);Wt("Color: Invalid hex color "+t)}else if(t&&t.length>0)return this.setColorName(t,e);return this}setColorName(t,e=Oe){const n=Rl[t.toLowerCase()];return n!==void 0?this.setHex(n,e):Wt("Color: Unknown color "+t),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(t){return this.r=t.r,this.g=t.g,this.b=t.b,this}copySRGBToLinear(t){return this.r=Mn(t.r),this.g=Mn(t.g),this.b=Mn(t.b),this}copyLinearToSRGB(t){return this.r=mi(t.r),this.g=mi(t.g),this.b=mi(t.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(t=Oe){return te.workingToColorSpace(Te.copy(this),t),Math.round($t(Te.r*255,0,255))*65536+Math.round($t(Te.g*255,0,255))*256+Math.round($t(Te.b*255,0,255))}getHexString(t=Oe){return("000000"+this.getHex(t).toString(16)).slice(-6)}getHSL(t,e=te.workingColorSpace){te.workingToColorSpace(Te.copy(this),e);const n=Te.r,s=Te.g,r=Te.b,a=Math.max(n,s,r),o=Math.min(n,s,r);let c,l;const u=(o+a)/2;if(o===a)c=0,l=0;else{const f=a-o;switch(l=u<=.5?f/(a+o):f/(2-a-o),a){case n:c=(s-r)/f+(s<r?6:0);break;case s:c=(r-n)/f+2;break;case r:c=(n-s)/f+4;break}c/=6}return t.h=c,t.s=l,t.l=u,t}getRGB(t,e=te.workingColorSpace){return te.workingToColorSpace(Te.copy(this),e),t.r=Te.r,t.g=Te.g,t.b=Te.b,t}getStyle(t=Oe){te.workingToColorSpace(Te.copy(this),t);const e=Te.r,n=Te.g,s=Te.b;return t!==Oe?`color(${t} ${e.toFixed(3)} ${n.toFixed(3)} ${s.toFixed(3)})`:`rgb(${Math.round(e*255)},${Math.round(n*255)},${Math.round(s*255)})`}offsetHSL(t,e,n){return this.getHSL(wn),this.setHSL(wn.h+t,wn.s+e,wn.l+n)}add(t){return this.r+=t.r,this.g+=t.g,this.b+=t.b,this}addColors(t,e){return this.r=t.r+e.r,this.g=t.g+e.g,this.b=t.b+e.b,this}addScalar(t){return this.r+=t,this.g+=t,this.b+=t,this}sub(t){return this.r=Math.max(0,this.r-t.r),this.g=Math.max(0,this.g-t.g),this.b=Math.max(0,this.b-t.b),this}multiply(t){return this.r*=t.r,this.g*=t.g,this.b*=t.b,this}multiplyScalar(t){return this.r*=t,this.g*=t,this.b*=t,this}lerp(t,e){return this.r+=(t.r-this.r)*e,this.g+=(t.g-this.g)*e,this.b+=(t.b-this.b)*e,this}lerpColors(t,e,n){return this.r=t.r+(e.r-t.r)*n,this.g=t.g+(e.g-t.g)*n,this.b=t.b+(e.b-t.b)*n,this}lerpHSL(t,e){this.getHSL(wn),t.getHSL(ji);const n=Zs(wn.h,ji.h,e),s=Zs(wn.s,ji.s,e),r=Zs(wn.l,ji.l,e);return this.setHSL(n,s,r),this}setFromVector3(t){return this.r=t.x,this.g=t.y,this.b=t.z,this}applyMatrix3(t){const e=this.r,n=this.g,s=this.b,r=t.elements;return this.r=r[0]*e+r[3]*n+r[6]*s,this.g=r[1]*e+r[4]*n+r[7]*s,this.b=r[2]*e+r[5]*n+r[8]*s,this}equals(t){return t.r===this.r&&t.g===this.g&&t.b===this.b}fromArray(t,e=0){return this.r=t[e],this.g=t[e+1],this.b=t[e+2],this}toArray(t=[],e=0){return t[e]=this.r,t[e+1]=this.g,t[e+2]=this.b,t}fromBufferAttribute(t,e){return this.r=t.getX(e),this.g=t.getY(e),this.b=t.getZ(e),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}}const Te=new jt;jt.NAMES=Rl;class ch extends Re{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new Nn,this.environmentIntensity=1,this.environmentRotation=new Nn,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(t,e){return super.copy(t,e),t.background!==null&&(this.background=t.background.clone()),t.environment!==null&&(this.environment=t.environment.clone()),t.fog!==null&&(this.fog=t.fog.clone()),this.backgroundBlurriness=t.backgroundBlurriness,this.backgroundIntensity=t.backgroundIntensity,this.backgroundRotation.copy(t.backgroundRotation),this.environmentIntensity=t.environmentIntensity,this.environmentRotation.copy(t.environmentRotation),t.overrideMaterial!==null&&(this.overrideMaterial=t.overrideMaterial.clone()),this.matrixAutoUpdate=t.matrixAutoUpdate,this}toJSON(t){const e=super.toJSON(t);return this.fog!==null&&(e.object.fog=this.fog.toJSON()),e.object.backgroundBlurriness=this.backgroundBlurriness,e.object.backgroundIntensity=this.backgroundIntensity,e.object.backgroundRotation=this.backgroundRotation.toArray(),e.object.environmentIntensity=this.environmentIntensity,e.object.environmentRotation=this.environmentRotation.toArray(),e}}const Xe=new H,pn=new H,nr=new H,mn=new H,ei=new H,ni=new H,uo=new H,ir=new H,sr=new H,rr=new H,ar=new fe,or=new fe,lr=new fe;class Ze{constructor(t=new H,e=new H,n=new H){this.a=t,this.b=e,this.c=n}static getNormal(t,e,n,s){s.subVectors(n,e),Xe.subVectors(t,e),s.cross(Xe);const r=s.lengthSq();return r>0?s.multiplyScalar(1/Math.sqrt(r)):s.set(0,0,0)}static getBarycoord(t,e,n,s,r){Xe.subVectors(s,e),pn.subVectors(n,e),nr.subVectors(t,e);const a=Xe.dot(Xe),o=Xe.dot(pn),c=Xe.dot(nr),l=pn.dot(pn),u=pn.dot(nr),f=a*l-o*o;if(f===0)return r.set(0,0,0),null;const h=1/f,p=(l*c-o*u)*h,_=(a*u-o*c)*h;return r.set(1-p-_,_,p)}static containsPoint(t,e,n,s){return this.getBarycoord(t,e,n,s,mn)===null?!1:mn.x>=0&&mn.y>=0&&mn.x+mn.y<=1}static getInterpolation(t,e,n,s,r,a,o,c){return this.getBarycoord(t,e,n,s,mn)===null?(c.x=0,c.y=0,"z"in c&&(c.z=0),"w"in c&&(c.w=0),null):(c.setScalar(0),c.addScaledVector(r,mn.x),c.addScaledVector(a,mn.y),c.addScaledVector(o,mn.z),c)}static getInterpolatedAttribute(t,e,n,s,r,a){return ar.setScalar(0),or.setScalar(0),lr.setScalar(0),ar.fromBufferAttribute(t,e),or.fromBufferAttribute(t,n),lr.fromBufferAttribute(t,s),a.setScalar(0),a.addScaledVector(ar,r.x),a.addScaledVector(or,r.y),a.addScaledVector(lr,r.z),a}static isFrontFacing(t,e,n,s){return Xe.subVectors(n,e),pn.subVectors(t,e),Xe.cross(pn).dot(s)<0}set(t,e,n){return this.a.copy(t),this.b.copy(e),this.c.copy(n),this}setFromPointsAndIndices(t,e,n,s){return this.a.copy(t[e]),this.b.copy(t[n]),this.c.copy(t[s]),this}setFromAttributeAndIndices(t,e,n,s){return this.a.fromBufferAttribute(t,e),this.b.fromBufferAttribute(t,n),this.c.fromBufferAttribute(t,s),this}clone(){return new this.constructor().copy(this)}copy(t){return this.a.copy(t.a),this.b.copy(t.b),this.c.copy(t.c),this}getArea(){return Xe.subVectors(this.c,this.b),pn.subVectors(this.a,this.b),Xe.cross(pn).length()*.5}getMidpoint(t){return t.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(t){return Ze.getNormal(this.a,this.b,this.c,t)}getPlane(t){return t.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(t,e){return Ze.getBarycoord(t,this.a,this.b,this.c,e)}getInterpolation(t,e,n,s,r){return Ze.getInterpolation(t,this.a,this.b,this.c,e,n,s,r)}containsPoint(t){return Ze.containsPoint(t,this.a,this.b,this.c)}isFrontFacing(t){return Ze.isFrontFacing(this.a,this.b,this.c,t)}intersectsBox(t){return t.intersectsTriangle(this)}closestPointToPoint(t,e){const n=this.a,s=this.b,r=this.c;let a,o;ei.subVectors(s,n),ni.subVectors(r,n),ir.subVectors(t,n);const c=ei.dot(ir),l=ni.dot(ir);if(c<=0&&l<=0)return e.copy(n);sr.subVectors(t,s);const u=ei.dot(sr),f=ni.dot(sr);if(u>=0&&f<=u)return e.copy(s);const h=c*f-u*l;if(h<=0&&c>=0&&u<=0)return a=c/(c-u),e.copy(n).addScaledVector(ei,a);rr.subVectors(t,r);const p=ei.dot(rr),_=ni.dot(rr);if(_>=0&&p<=_)return e.copy(r);const y=p*l-c*_;if(y<=0&&l>=0&&_<=0)return o=l/(l-_),e.copy(n).addScaledVector(ni,o);const m=u*_-p*f;if(m<=0&&f-u>=0&&p-_>=0)return uo.subVectors(r,s),o=(f-u)/(f-u+(p-_)),e.copy(s).addScaledVector(uo,o);const d=1/(m+y+h);return a=y*d,o=h*d,e.copy(n).addScaledVector(ei,a).addScaledVector(ni,o)}equals(t){return t.a.equals(this.a)&&t.b.equals(this.b)&&t.c.equals(this.c)}}class Wi{constructor(t=new H(1/0,1/0,1/0),e=new H(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=t,this.max=e}set(t,e){return this.min.copy(t),this.max.copy(e),this}setFromArray(t){this.makeEmpty();for(let e=0,n=t.length;e<n;e+=3)this.expandByPoint(qe.fromArray(t,e));return this}setFromBufferAttribute(t){this.makeEmpty();for(let e=0,n=t.count;e<n;e++)this.expandByPoint(qe.fromBufferAttribute(t,e));return this}setFromPoints(t){this.makeEmpty();for(let e=0,n=t.length;e<n;e++)this.expandByPoint(t[e]);return this}setFromCenterAndSize(t,e){const n=qe.copy(e).multiplyScalar(.5);return this.min.copy(t).sub(n),this.max.copy(t).add(n),this}setFromObject(t,e=!1){return this.makeEmpty(),this.expandByObject(t,e)}clone(){return new this.constructor().copy(this)}copy(t){return this.min.copy(t.min),this.max.copy(t.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(t){return this.isEmpty()?t.set(0,0,0):t.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(t){return this.isEmpty()?t.set(0,0,0):t.subVectors(this.max,this.min)}expandByPoint(t){return this.min.min(t),this.max.max(t),this}expandByVector(t){return this.min.sub(t),this.max.add(t),this}expandByScalar(t){return this.min.addScalar(-t),this.max.addScalar(t),this}expandByObject(t,e=!1){t.updateWorldMatrix(!1,!1);const n=t.geometry;if(n!==void 0){const r=n.getAttribute("position");if(e===!0&&r!==void 0&&t.isInstancedMesh!==!0)for(let a=0,o=r.count;a<o;a++)t.isMesh===!0?t.getVertexPosition(a,qe):qe.fromBufferAttribute(r,a),qe.applyMatrix4(t.matrixWorld),this.expandByPoint(qe);else t.boundingBox!==void 0?(t.boundingBox===null&&t.computeBoundingBox(),ts.copy(t.boundingBox)):(n.boundingBox===null&&n.computeBoundingBox(),ts.copy(n.boundingBox)),ts.applyMatrix4(t.matrixWorld),this.union(ts)}const s=t.children;for(let r=0,a=s.length;r<a;r++)this.expandByObject(s[r],e);return this}containsPoint(t){return t.x>=this.min.x&&t.x<=this.max.x&&t.y>=this.min.y&&t.y<=this.max.y&&t.z>=this.min.z&&t.z<=this.max.z}containsBox(t){return this.min.x<=t.min.x&&t.max.x<=this.max.x&&this.min.y<=t.min.y&&t.max.y<=this.max.y&&this.min.z<=t.min.z&&t.max.z<=this.max.z}getParameter(t,e){return e.set((t.x-this.min.x)/(this.max.x-this.min.x),(t.y-this.min.y)/(this.max.y-this.min.y),(t.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(t){return t.max.x>=this.min.x&&t.min.x<=this.max.x&&t.max.y>=this.min.y&&t.min.y<=this.max.y&&t.max.z>=this.min.z&&t.min.z<=this.max.z}intersectsSphere(t){return this.clampPoint(t.center,qe),qe.distanceToSquared(t.center)<=t.radius*t.radius}intersectsPlane(t){let e,n;return t.normal.x>0?(e=t.normal.x*this.min.x,n=t.normal.x*this.max.x):(e=t.normal.x*this.max.x,n=t.normal.x*this.min.x),t.normal.y>0?(e+=t.normal.y*this.min.y,n+=t.normal.y*this.max.y):(e+=t.normal.y*this.max.y,n+=t.normal.y*this.min.y),t.normal.z>0?(e+=t.normal.z*this.min.z,n+=t.normal.z*this.max.z):(e+=t.normal.z*this.max.z,n+=t.normal.z*this.min.z),e<=-t.constant&&n>=-t.constant}intersectsTriangle(t){if(this.isEmpty())return!1;this.getCenter(bi),es.subVectors(this.max,bi),ii.subVectors(t.a,bi),si.subVectors(t.b,bi),ri.subVectors(t.c,bi),Rn.subVectors(si,ii),Cn.subVectors(ri,si),On.subVectors(ii,ri);let e=[0,-Rn.z,Rn.y,0,-Cn.z,Cn.y,0,-On.z,On.y,Rn.z,0,-Rn.x,Cn.z,0,-Cn.x,On.z,0,-On.x,-Rn.y,Rn.x,0,-Cn.y,Cn.x,0,-On.y,On.x,0];return!cr(e,ii,si,ri,es)||(e=[1,0,0,0,1,0,0,0,1],!cr(e,ii,si,ri,es))?!1:(ns.crossVectors(Rn,Cn),e=[ns.x,ns.y,ns.z],cr(e,ii,si,ri,es))}clampPoint(t,e){return e.copy(t).clamp(this.min,this.max)}distanceToPoint(t){return this.clampPoint(t,qe).distanceTo(t)}getBoundingSphere(t){return this.isEmpty()?t.makeEmpty():(this.getCenter(t.center),t.radius=this.getSize(qe).length()*.5),t}intersect(t){return this.min.max(t.min),this.max.min(t.max),this.isEmpty()&&this.makeEmpty(),this}union(t){return this.min.min(t.min),this.max.max(t.max),this}applyMatrix4(t){return this.isEmpty()?this:(gn[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(t),gn[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(t),gn[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(t),gn[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(t),gn[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(t),gn[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(t),gn[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(t),gn[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(t),this.setFromPoints(gn),this)}translate(t){return this.min.add(t),this.max.add(t),this}equals(t){return t.min.equals(this.min)&&t.max.equals(this.max)}toJSON(){return{min:this.min.toArray(),max:this.max.toArray()}}fromJSON(t){return this.min.fromArray(t.min),this.max.fromArray(t.max),this}}const gn=[new H,new H,new H,new H,new H,new H,new H,new H],qe=new H,ts=new Wi,ii=new H,si=new H,ri=new H,Rn=new H,Cn=new H,On=new H,bi=new H,es=new H,ns=new H,Bn=new H;function cr(i,t,e,n,s){for(let r=0,a=i.length-3;r<=a;r+=3){Bn.fromArray(i,r);const o=s.x*Math.abs(Bn.x)+s.y*Math.abs(Bn.y)+s.z*Math.abs(Bn.z),c=t.dot(Bn),l=e.dot(Bn),u=n.dot(Bn);if(Math.max(-Math.max(c,l,u),Math.min(c,l,u))>o)return!1}return!0}const _e=new H,is=new dt;let hh=0;class on extends Un{constructor(t,e,n=!1){if(super(),Array.isArray(t))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,Object.defineProperty(this,"id",{value:hh++}),this.name="",this.array=t,this.itemSize=e,this.count=t!==void 0?t.length/e:0,this.normalized=n,this.usage=Hc,this.updateRanges=[],this.gpuType=sn,this.version=0}onUploadCallback(){}set needsUpdate(t){t===!0&&this.version++}setUsage(t){return this.usage=t,this}addUpdateRange(t,e){this.updateRanges.push({start:t,count:e})}clearUpdateRanges(){this.updateRanges.length=0}copy(t){return this.name=t.name,this.array=new t.array.constructor(t.array),this.itemSize=t.itemSize,this.count=t.count,this.normalized=t.normalized,this.usage=t.usage,this.gpuType=t.gpuType,this}copyAt(t,e,n){t*=this.itemSize,n*=e.itemSize;for(let s=0,r=this.itemSize;s<r;s++)this.array[t+s]=e.array[n+s];return this}copyArray(t){return this.array.set(t),this}applyMatrix3(t){if(this.itemSize===2)for(let e=0,n=this.count;e<n;e++)is.fromBufferAttribute(this,e),is.applyMatrix3(t),this.setXY(e,is.x,is.y);else if(this.itemSize===3)for(let e=0,n=this.count;e<n;e++)_e.fromBufferAttribute(this,e),_e.applyMatrix3(t),this.setXYZ(e,_e.x,_e.y,_e.z);return this}applyMatrix4(t){for(let e=0,n=this.count;e<n;e++)_e.fromBufferAttribute(this,e),_e.applyMatrix4(t),this.setXYZ(e,_e.x,_e.y,_e.z);return this}applyNormalMatrix(t){for(let e=0,n=this.count;e<n;e++)_e.fromBufferAttribute(this,e),_e.applyNormalMatrix(t),this.setXYZ(e,_e.x,_e.y,_e.z);return this}transformDirection(t){for(let e=0,n=this.count;e<n;e++)_e.fromBufferAttribute(this,e),_e.transformDirection(t),this.setXYZ(e,_e.x,_e.y,_e.z);return this}set(t,e=0){return this.array.set(t,e),this}getComponent(t,e){let n=this.array[t*this.itemSize+e];return this.normalized&&(n=yi(n,this.array)),n}setComponent(t,e,n){return this.normalized&&(n=Le(n,this.array)),this.array[t*this.itemSize+e]=n,this}getX(t){let e=this.array[t*this.itemSize];return this.normalized&&(e=yi(e,this.array)),e}setX(t,e){return this.normalized&&(e=Le(e,this.array)),this.array[t*this.itemSize]=e,this}getY(t){let e=this.array[t*this.itemSize+1];return this.normalized&&(e=yi(e,this.array)),e}setY(t,e){return this.normalized&&(e=Le(e,this.array)),this.array[t*this.itemSize+1]=e,this}getZ(t){let e=this.array[t*this.itemSize+2];return this.normalized&&(e=yi(e,this.array)),e}setZ(t,e){return this.normalized&&(e=Le(e,this.array)),this.array[t*this.itemSize+2]=e,this}getW(t){let e=this.array[t*this.itemSize+3];return this.normalized&&(e=yi(e,this.array)),e}setW(t,e){return this.normalized&&(e=Le(e,this.array)),this.array[t*this.itemSize+3]=e,this}setXY(t,e,n){return t*=this.itemSize,this.normalized&&(e=Le(e,this.array),n=Le(n,this.array)),this.array[t+0]=e,this.array[t+1]=n,this}setXYZ(t,e,n,s){return t*=this.itemSize,this.normalized&&(e=Le(e,this.array),n=Le(n,this.array),s=Le(s,this.array)),this.array[t+0]=e,this.array[t+1]=n,this.array[t+2]=s,this}setXYZW(t,e,n,s,r){return t*=this.itemSize,this.normalized&&(e=Le(e,this.array),n=Le(n,this.array),s=Le(s,this.array),r=Le(r,this.array)),this.array[t+0]=e,this.array[t+1]=n,this.array[t+2]=s,this.array[t+3]=r,this}onUpload(t){return this.onUploadCallback=t,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){const t={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return t.name=this.name,t.usage=this.usage,t.gpuType=this.gpuType,t}dispose(){this.dispatchEvent({type:"dispose"})}}class Cl extends on{constructor(t,e,n){super(new Uint16Array(t),e,n)}}class Pl extends on{constructor(t,e,n){super(new Uint32Array(t),e,n)}}class Ne extends on{constructor(t,e,n){super(new Float32Array(t),e,n)}}const uh=new Wi,Ti=new H,hr=new H;class Ta{constructor(t=new H,e=-1){this.isSphere=!0,this.center=t,this.radius=e}set(t,e){return this.center.copy(t),this.radius=e,this}setFromPoints(t,e){const n=this.center;e!==void 0?n.copy(e):uh.setFromPoints(t).getCenter(n);let s=0;for(let r=0,a=t.length;r<a;r++)s=Math.max(s,n.distanceToSquared(t[r]));return this.radius=Math.sqrt(s),this}copy(t){return this.center.copy(t.center),this.radius=t.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(t){return t.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(t){return t.distanceTo(this.center)-this.radius}intersectsSphere(t){const e=this.radius+t.radius;return t.center.distanceToSquared(this.center)<=e*e}intersectsBox(t){return t.intersectsSphere(this)}intersectsPlane(t){return Math.abs(t.distanceToPoint(this.center))<=this.radius}clampPoint(t,e){const n=this.center.distanceToSquared(t);return e.copy(t),n>this.radius*this.radius&&(e.sub(this.center).normalize(),e.multiplyScalar(this.radius).add(this.center)),e}getBoundingBox(t){return this.isEmpty()?(t.makeEmpty(),t):(t.set(this.center,this.center),t.expandByScalar(this.radius),t)}applyMatrix4(t){return this.center.applyMatrix4(t),this.radius=this.radius*t.getMaxScaleOnAxis(),this}translate(t){return this.center.add(t),this}expandByPoint(t){if(this.isEmpty())return this.center.copy(t),this.radius=0,this;Ti.subVectors(t,this.center);const e=Ti.lengthSq();if(e>this.radius*this.radius){const n=Math.sqrt(e),s=(n-this.radius)*.5;this.center.addScaledVector(Ti,s/n),this.radius+=s}return this}union(t){return t.isEmpty()?this:this.isEmpty()?(this.copy(t),this):(this.center.equals(t.center)===!0?this.radius=Math.max(this.radius,t.radius):(hr.subVectors(t.center,this.center).setLength(t.radius),this.expandByPoint(Ti.copy(t.center).add(hr)),this.expandByPoint(Ti.copy(t.center).sub(hr))),this)}equals(t){return t.center.equals(this.center)&&t.radius===this.radius}clone(){return new this.constructor().copy(this)}toJSON(){return{radius:this.radius,center:this.center.toArray()}}fromJSON(t){return this.radius=t.radius,this.center.fromArray(t.center),this}}let fh=0;const Ge=new pe,ur=new Re,ai=new H,Fe=new Wi,Ai=new Wi,Me=new H;class ke extends Un{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:fh++}),this.uuid=Si(),this.name="",this.type="BufferGeometry",this.index=null,this.indirect=null,this.indirectOffset=0,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={},this._transformed=!1}getIndex(){return this.index}setIndex(t){return Array.isArray(t)?this.index=new(Wc(t)?Pl:Cl)(t,1):this.index=t,this}setIndirect(t,e=0){return this.indirect=t,this.indirectOffset=e,this}getIndirect(){return this.indirect}getAttribute(t){return this.attributes[t]}setAttribute(t,e){return this.attributes[t]=e,this}deleteAttribute(t){return delete this.attributes[t],this}hasAttribute(t){return this.attributes[t]!==void 0}addGroup(t,e,n=0){this.groups.push({start:t,count:e,materialIndex:n})}clearGroups(){this.groups=[]}setDrawRange(t,e){this.drawRange.start=t,this.drawRange.count=e}applyMatrix4(t){const e=this.attributes.position;e!==void 0&&(e.applyMatrix4(t),e.needsUpdate=!0);const n=this.attributes.normal;if(n!==void 0){const r=new kt().getNormalMatrix(t);n.applyNormalMatrix(r),n.needsUpdate=!0}const s=this.attributes.tangent;return s!==void 0&&(s.transformDirection(t),s.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this._transformed=!0,this}applyQuaternion(t){return Ge.makeRotationFromQuaternion(t),this.applyMatrix4(Ge),this}rotateX(t){return Ge.makeRotationX(t),this.applyMatrix4(Ge),this}rotateY(t){return Ge.makeRotationY(t),this.applyMatrix4(Ge),this}rotateZ(t){return Ge.makeRotationZ(t),this.applyMatrix4(Ge),this}translate(t,e,n){return Ge.makeTranslation(t,e,n),this.applyMatrix4(Ge),this}scale(t,e,n){return Ge.makeScale(t,e,n),this.applyMatrix4(Ge),this}lookAt(t){return ur.lookAt(t),ur.updateMatrix(),this.applyMatrix4(ur.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(ai).negate(),this.translate(ai.x,ai.y,ai.z),this}setFromPoints(t){const e=this.getAttribute("position");if(e===void 0){const n=[];for(let s=0,r=t.length;s<r;s++){const a=t[s];n.push(a.x,a.y,a.z||0)}this.setAttribute("position",new Ne(n,3))}else{const n=Math.min(t.length,e.count);for(let s=0;s<n;s++){const r=t[s];e.setXYZ(s,r.x,r.y,r.z||0)}t.length>e.count&&Wt("BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry."),e.needsUpdate=!0}return this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new Wi);const t=this.attributes.position,e=this.morphAttributes.position;if(t&&t.isGLBufferAttribute){ne("BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new H(-1/0,-1/0,-1/0),new H(1/0,1/0,1/0));return}if(t!==void 0){if(this.boundingBox.setFromBufferAttribute(t),e)for(let n=0,s=e.length;n<s;n++){const r=e[n];Fe.setFromBufferAttribute(r),this.morphTargetsRelative?(Me.addVectors(this.boundingBox.min,Fe.min),this.boundingBox.expandByPoint(Me),Me.addVectors(this.boundingBox.max,Fe.max),this.boundingBox.expandByPoint(Me)):(this.boundingBox.expandByPoint(Fe.min),this.boundingBox.expandByPoint(Fe.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&ne('BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new Ta);const t=this.attributes.position,e=this.morphAttributes.position;if(t&&t.isGLBufferAttribute){ne("BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new H,1/0);return}if(t){const n=this.boundingSphere.center;if(Fe.setFromBufferAttribute(t),e)for(let r=0,a=e.length;r<a;r++){const o=e[r];Ai.setFromBufferAttribute(o),this.morphTargetsRelative?(Me.addVectors(Fe.min,Ai.min),Fe.expandByPoint(Me),Me.addVectors(Fe.max,Ai.max),Fe.expandByPoint(Me)):(Fe.expandByPoint(Ai.min),Fe.expandByPoint(Ai.max))}Fe.getCenter(n);let s=0;for(let r=0,a=t.count;r<a;r++)Me.fromBufferAttribute(t,r),s=Math.max(s,n.distanceToSquared(Me));if(e)for(let r=0,a=e.length;r<a;r++){const o=e[r],c=this.morphTargetsRelative;for(let l=0,u=o.count;l<u;l++)Me.fromBufferAttribute(o,l),c&&(ai.fromBufferAttribute(t,l),Me.add(ai)),s=Math.max(s,n.distanceToSquared(Me))}this.boundingSphere.radius=Math.sqrt(s),isNaN(this.boundingSphere.radius)&&ne('BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){const t=this.index,e=this.attributes;if(t===null||e.position===void 0||e.normal===void 0||e.uv===void 0){ne("BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}const n=e.position,s=e.normal,r=e.uv;let a=this.getAttribute("tangent");(a===void 0||a.count!==n.count)&&(a=new on(new Float32Array(4*n.count),4),this.setAttribute("tangent",a));const o=[],c=[];for(let v=0;v<n.count;v++)o[v]=new H,c[v]=new H;const l=new H,u=new H,f=new H,h=new dt,p=new dt,_=new dt,y=new H,m=new H;function d(v,R,B){l.fromBufferAttribute(n,v),u.fromBufferAttribute(n,R),f.fromBufferAttribute(n,B),h.fromBufferAttribute(r,v),p.fromBufferAttribute(r,R),_.fromBufferAttribute(r,B),u.sub(l),f.sub(l),p.sub(h),_.sub(h);const X=1/(p.x*_.y-_.x*p.y);isFinite(X)&&(y.copy(u).multiplyScalar(_.y).addScaledVector(f,-p.y).multiplyScalar(X),m.copy(f).multiplyScalar(p.x).addScaledVector(u,-_.x).multiplyScalar(X),o[v].add(y),o[R].add(y),o[B].add(y),c[v].add(m),c[R].add(m),c[B].add(m))}let P=this.groups;P.length===0&&(P=[{start:0,count:t.count}]);for(let v=0,R=P.length;v<R;++v){const B=P[v],X=B.start,q=B.count;for(let nt=X,G=X+q;nt<G;nt+=3)d(t.getX(nt+0),t.getX(nt+1),t.getX(nt+2))}const D=new H,S=new H,w=new H,A=new H;function F(v){w.fromBufferAttribute(s,v),A.copy(w);const R=o[v];D.copy(R),D.sub(w.multiplyScalar(w.dot(R))).normalize(),S.crossVectors(A,R);const X=S.dot(c[v])<0?-1:1;a.setXYZW(v,D.x,D.y,D.z,X)}for(let v=0,R=P.length;v<R;++v){const B=P[v],X=B.start,q=B.count;for(let nt=X,G=X+q;nt<G;nt+=3)F(t.getX(nt+0)),F(t.getX(nt+1)),F(t.getX(nt+2))}this._transformed=!0}computeVertexNormals(){const t=this.index,e=this.getAttribute("position");if(e!==void 0){let n=this.getAttribute("normal");if(n===void 0||n.count!==e.count)n=new on(new Float32Array(e.count*3),3),this.setAttribute("normal",n);else for(let h=0,p=n.count;h<p;h++)n.setXYZ(h,0,0,0);const s=new H,r=new H,a=new H,o=new H,c=new H,l=new H,u=new H,f=new H;if(t)for(let h=0,p=t.count;h<p;h+=3){const _=t.getX(h+0),y=t.getX(h+1),m=t.getX(h+2);s.fromBufferAttribute(e,_),r.fromBufferAttribute(e,y),a.fromBufferAttribute(e,m),u.subVectors(a,r),f.subVectors(s,r),u.cross(f),o.fromBufferAttribute(n,_),c.fromBufferAttribute(n,y),l.fromBufferAttribute(n,m),o.add(u),c.add(u),l.add(u),n.setXYZ(_,o.x,o.y,o.z),n.setXYZ(y,c.x,c.y,c.z),n.setXYZ(m,l.x,l.y,l.z)}else for(let h=0,p=e.count;h<p;h+=3)s.fromBufferAttribute(e,h+0),r.fromBufferAttribute(e,h+1),a.fromBufferAttribute(e,h+2),u.subVectors(a,r),f.subVectors(s,r),u.cross(f),n.setXYZ(h+0,u.x,u.y,u.z),n.setXYZ(h+1,u.x,u.y,u.z),n.setXYZ(h+2,u.x,u.y,u.z);this.normalizeNormals(),n.needsUpdate=!0}}normalizeNormals(){const t=this.attributes.normal;for(let e=0,n=t.count;e<n;e++)Me.fromBufferAttribute(t,e),Me.normalize(),t.setXYZ(e,Me.x,Me.y,Me.z)}toNonIndexed(){function t(o,c){const l=o.array,u=o.itemSize,f=o.normalized,h=new l.constructor(c.length*u);let p=0,_=0;for(let y=0,m=c.length;y<m;y++){o.isInterleavedBufferAttribute?p=c[y]*o.data.stride+o.offset:p=c[y]*u;for(let d=0;d<u;d++)h[_++]=l[p++]}return new on(h,u,f)}if(this.index===null)return Wt("BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;const e=new ke,n=this.index.array,s=this.attributes;for(const o in s){const c=s[o],l=t(c,n);e.setAttribute(o,l)}const r=this.morphAttributes;for(const o in r){const c=[],l=r[o];for(let u=0,f=l.length;u<f;u++){const h=l[u],p=t(h,n);c.push(p)}e.morphAttributes[o]=c}e.morphTargetsRelative=this.morphTargetsRelative;const a=this.groups;for(let o=0,c=a.length;o<c;o++){const l=a[o];e.addGroup(l.start,l.count,l.materialIndex)}return e}toJSON(){const t={metadata:{version:4.7,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(t.uuid=this.uuid,t.type=this.parameters!==void 0&&this._transformed===!0?"BufferGeometry":this.type,t.name=this.name,Object.keys(this.userData).length>0&&(t.userData=this.userData),this.parameters!==void 0&&this._transformed!==!0){const c=this.parameters;for(const l in c)c[l]!==void 0&&(t[l]=c[l]);return t}t.data={attributes:{}};const e=this.index;e!==null&&(t.data.index={type:e.array.constructor.name,array:Array.prototype.slice.call(e.array)});const n=this.attributes;for(const c in n){const l=n[c];t.data.attributes[c]=l.toJSON(t.data)}const s={};let r=!1;for(const c in this.morphAttributes){const l=this.morphAttributes[c],u=[];for(let f=0,h=l.length;f<h;f++){const p=l[f];u.push(p.toJSON(t.data))}u.length>0&&(s[c]=u,r=!0)}r&&(t.data.morphAttributes=s,t.data.morphTargetsRelative=this.morphTargetsRelative);const a=this.groups;a.length>0&&(t.data.groups=JSON.parse(JSON.stringify(a)));const o=this.boundingSphere;return o!==null&&(t.data.boundingSphere=o.toJSON()),t}clone(){return new this.constructor().copy(this)}copy(t){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;const e={};this.name=t.name;const n=t.index;n!==null&&this.setIndex(n.clone());const s=t.attributes;for(const l in s){const u=s[l];this.setAttribute(l,u.clone(e))}const r=t.morphAttributes;for(const l in r){const u=[],f=r[l];for(let h=0,p=f.length;h<p;h++)u.push(f[h].clone(e));this.morphAttributes[l]=u}this.morphTargetsRelative=t.morphTargetsRelative;const a=t.groups;for(let l=0,u=a.length;l<u;l++){const f=a[l];this.addGroup(f.start,f.count,f.materialIndex)}const o=t.boundingBox;o!==null&&(this.boundingBox=o.clone());const c=t.boundingSphere;return c!==null&&(this.boundingSphere=c.clone()),this.drawRange.start=t.drawRange.start,this.drawRange.count=t.drawRange.count,this.userData=t.userData,this._transformed=t._transformed,this}dispose(){this.dispatchEvent({type:"dispose"})}}const fr=new H,dh=new H,ph=new kt;class vn{constructor(t=new H(1,0,0),e=0){this.isPlane=!0,this.normal=t,this.constant=e}set(t,e){return this.normal.copy(t),this.constant=e,this}setComponents(t,e,n,s){return this.normal.set(t,e,n),this.constant=s,this}setFromNormalAndCoplanarPoint(t,e){return this.normal.copy(t),this.constant=-e.dot(this.normal),this}setFromCoplanarPoints(t,e,n){const s=fr.subVectors(n,e).cross(dh.subVectors(t,e)).normalize();return this.setFromNormalAndCoplanarPoint(s,t),this}copy(t){return this.normal.copy(t.normal),this.constant=t.constant,this}normalize(){const t=1/this.normal.length();return this.normal.multiplyScalar(t),this.constant*=t,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(t){return this.normal.dot(t)+this.constant}distanceToSphere(t){return this.distanceToPoint(t.center)-t.radius}projectPoint(t,e){return e.copy(t).addScaledVector(this.normal,-this.distanceToPoint(t))}intersectLine(t,e,n=!0){const s=t.delta(fr),r=this.normal.dot(s);if(r===0)return this.distanceToPoint(t.start)===0?e.copy(t.start):null;const a=-(t.start.dot(this.normal)+this.constant)/r;return n===!0&&(a<0||a>1)?null:e.copy(t.start).addScaledVector(s,a)}intersectsLine(t){const e=this.distanceToPoint(t.start),n=this.distanceToPoint(t.end);return e<0&&n>0||n<0&&e>0}intersectsBox(t){return t.intersectsPlane(this)}intersectsSphere(t){return t.intersectsPlane(this)}coplanarPoint(t){return t.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(t,e){const n=e||ph.getNormalMatrix(t),s=this.coplanarPoint(fr).applyMatrix4(t),r=this.normal.applyMatrix3(n).normalize();return this.constant=-s.dot(r),this}translate(t){return this.constant-=t.dot(this.normal),this}equals(t){return t.normal.equals(this.normal)&&t.constant===this.constant}clone(){return new this.constructor().copy(this)}toJSON(){return{normal:this.normal.toArray(),constant:this.constant}}fromJSON(t){return this.normal.fromArray(t.normal),this.constant=t.constant,this}}let mh=0;class Xi extends Un{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:mh++}),this.uuid=Si(),this.name="",this.type="Material",this.blending=Di,this.side=Xn,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=ol,this.blendDst=ll,this.blendEquation=hi,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new jt(0,0,0),this.blendAlpha=0,this.depthFunc=Ui,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=Fc,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=Ys,this.stencilZFail=Ys,this.stencilZPass=Ys,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.allowOverride=!0,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(t){this._alphaTest>0!=t>0&&this.version++,this._alphaTest=t}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(t){if(t!==void 0)for(const e in t){const n=t[e];if(n===void 0){Wt(`Material: parameter '${e}' has value of undefined.`);continue}const s=this[e];if(s===void 0){Wt(`Material: '${e}' is not a property of THREE.${this.type}.`);continue}s&&s.isColor?s.set(n):s&&s.isVector2&&n&&n.isVector2||s&&s.isEuler&&n&&n.isEuler||s&&s.isVector3&&n&&n.isVector3?s.copy(n):this[e]=n}}toJSON(t){const e=t===void 0||typeof t=="string";e&&(t={textures:{},images:{}});const n={metadata:{version:4.7,type:"Material",generator:"Material.toJSON"}};n.uuid=this.uuid,n.type=this.type,n.blending=this.blending,n.side=this.side,n.shadowSide=this.shadowSide,n.vertexColors=this.vertexColors,n.opacity=this.opacity,n.transparent=this.transparent,n.blendSrc=this.blendSrc,n.blendDst=this.blendDst,n.blendEquation=this.blendEquation,n.blendSrcAlpha=this.blendSrcAlpha,n.blendDstAlpha=this.blendDstAlpha,n.blendEquationAlpha=this.blendEquationAlpha,n.blendColor=this.blendColor.getHex(),n.blendAlpha=this.blendAlpha,n.depthFunc=this.depthFunc,n.depthTest=this.depthTest,n.depthWrite=this.depthWrite,n.colorWrite=this.colorWrite,n.clipIntersection=this.clipIntersection,n.clipShadows=this.clipShadows,n.stencilWriteMask=this.stencilWriteMask,n.stencilFunc=this.stencilFunc,n.stencilRef=this.stencilRef,n.stencilFuncMask=this.stencilFuncMask,n.stencilFail=this.stencilFail,n.stencilZFail=this.stencilZFail,n.stencilZPass=this.stencilZPass,n.stencilWrite=this.stencilWrite,n.polygonOffset=this.polygonOffset,n.polygonOffsetFactor=this.polygonOffsetFactor,n.polygonOffsetUnits=this.polygonOffsetUnits,n.dithering=this.dithering,n.alphaTest=this.alphaTest,n.alphaHash=this.alphaHash,n.alphaToCoverage=this.alphaToCoverage,n.premultipliedAlpha=this.premultipliedAlpha,n.forceSinglePass=this.forceSinglePass,n.allowOverride=this.allowOverride,n.visible=this.visible,n.toneMapped=this.toneMapped,n.name=this.name,this.color&&this.color.isColor&&(n.color=this.color.getHex()),this.roughness!==void 0&&(n.roughness=this.roughness),this.metalness!==void 0&&(n.metalness=this.metalness),this.sheen!==void 0&&(n.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(n.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(n.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(n.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&(n.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(n.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(n.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(n.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(n.shininess=this.shininess),this.clearcoat!==void 0&&(n.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(n.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(n.clearcoatMap=this.clearcoatMap.toJSON(t).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(n.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(t).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(n.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(t).uuid,n.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.sheenColorMap&&this.sheenColorMap.isTexture&&(n.sheenColorMap=this.sheenColorMap.toJSON(t).uuid),this.sheenRoughnessMap&&this.sheenRoughnessMap.isTexture&&(n.sheenRoughnessMap=this.sheenRoughnessMap.toJSON(t).uuid),this.dispersion!==void 0&&(n.dispersion=this.dispersion),this.retroreflectivity!==void 0&&(n.retroreflectivity=this.retroreflectivity),this.iridescence!==void 0&&(n.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(n.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(n.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(n.iridescenceMap=this.iridescenceMap.toJSON(t).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(n.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(t).uuid),this.anisotropy!==void 0&&(n.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(n.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(n.anisotropyMap=this.anisotropyMap.toJSON(t).uuid),this.map&&this.map.isTexture&&(n.map=this.map.toJSON(t).uuid),this.matcap&&this.matcap.isTexture&&(n.matcap=this.matcap.toJSON(t).uuid),this.alphaMap&&this.alphaMap.isTexture&&(n.alphaMap=this.alphaMap.toJSON(t).uuid),this.lightMap&&this.lightMap.isTexture&&(n.lightMap=this.lightMap.toJSON(t).uuid,n.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(n.aoMap=this.aoMap.toJSON(t).uuid,n.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(n.bumpMap=this.bumpMap.toJSON(t).uuid,n.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(n.normalMap=this.normalMap.toJSON(t).uuid,n.normalMapType=this.normalMapType,n.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(n.displacementMap=this.displacementMap.toJSON(t).uuid,n.displacementScale=this.displacementScale,n.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(n.roughnessMap=this.roughnessMap.toJSON(t).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(n.metalnessMap=this.metalnessMap.toJSON(t).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(n.emissiveMap=this.emissiveMap.toJSON(t).uuid),this.specularMap&&this.specularMap.isTexture&&(n.specularMap=this.specularMap.toJSON(t).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(n.specularIntensityMap=this.specularIntensityMap.toJSON(t).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(n.specularColorMap=this.specularColorMap.toJSON(t).uuid),this.envMap&&this.envMap.isTexture&&(n.envMap=this.envMap.toJSON(t).uuid,this.combine!==void 0&&(n.combine=this.combine)),this.envMapRotation!==void 0&&(n.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(n.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(n.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(n.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(n.gradientMap=this.gradientMap.toJSON(t).uuid),this.transmission!==void 0&&(n.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(n.transmissionMap=this.transmissionMap.toJSON(t).uuid),this.thickness!==void 0&&(n.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(n.thicknessMap=this.thicknessMap.toJSON(t).uuid),this.attenuationDistance!==void 0&&(n.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(n.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(n.size=this.size),this.sizeAttenuation!==void 0&&(n.sizeAttenuation=this.sizeAttenuation),Array.isArray(this.clippingPlanes)&&this.clippingPlanes.length>0&&(n.clippingPlanes=this.clippingPlanes.map(r=>r.toJSON())),this.rotation!==void 0&&(n.rotation=this.rotation),this.depthPacking!==void 0&&(n.depthPacking=this.depthPacking),this.linewidth!==void 0&&(n.linewidth=this.linewidth),this.linecap!==void 0&&(n.linecap=this.linecap),this.linejoin!==void 0&&(n.linejoin=this.linejoin),this.dashSize!==void 0&&(n.dashSize=this.dashSize),this.gapSize!==void 0&&(n.gapSize=this.gapSize),this.scale!==void 0&&(n.scale=this.scale),this.wireframe!==void 0&&(n.wireframe=this.wireframe),this.wireframeLinewidth!==void 0&&(n.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!==void 0&&(n.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!==void 0&&(n.wireframeLinejoin=this.wireframeLinejoin),this.flatShading!==void 0&&(n.flatShading=this.flatShading),this.fog!==void 0&&(n.fog=this.fog),Object.keys(this.userData).length>0&&(n.userData=this.userData);function s(r){const a=[];for(const o in r){const c=r[o];delete c.metadata,a.push(c)}return a}if(e){const r=s(t.textures),a=s(t.images);r.length>0&&(n.textures=r),a.length>0&&(n.images=a)}return n}fromJSON(t,e){if(t.uuid!==void 0&&(this.uuid=t.uuid),t.name!==void 0&&(this.name=t.name),t.color!==void 0&&this.color!==void 0&&this.color.setHex(t.color),t.roughness!==void 0&&(this.roughness=t.roughness),t.metalness!==void 0&&(this.metalness=t.metalness),t.sheen!==void 0&&(this.sheen=t.sheen),t.sheenColor!==void 0&&(this.sheenColor=new jt().setHex(t.sheenColor)),t.sheenRoughness!==void 0&&(this.sheenRoughness=t.sheenRoughness),t.emissive!==void 0&&this.emissive!==void 0&&this.emissive.setHex(t.emissive),t.specular!==void 0&&this.specular!==void 0&&this.specular.setHex(t.specular),t.specularIntensity!==void 0&&(this.specularIntensity=t.specularIntensity),t.specularColor!==void 0&&this.specularColor!==void 0&&this.specularColor.setHex(t.specularColor),t.shininess!==void 0&&(this.shininess=t.shininess),t.clearcoat!==void 0&&(this.clearcoat=t.clearcoat),t.clearcoatRoughness!==void 0&&(this.clearcoatRoughness=t.clearcoatRoughness),t.dispersion!==void 0&&(this.dispersion=t.dispersion),t.retroreflectivity!==void 0&&(this.retroreflectivity=t.retroreflectivity),t.iridescence!==void 0&&(this.iridescence=t.iridescence),t.iridescenceIOR!==void 0&&(this.iridescenceIOR=t.iridescenceIOR),t.iridescenceThicknessRange!==void 0&&(this.iridescenceThicknessRange=t.iridescenceThicknessRange),t.transmission!==void 0&&(this.transmission=t.transmission),t.thickness!==void 0&&(this.thickness=t.thickness),t.attenuationDistance!==void 0&&(this.attenuationDistance=t.attenuationDistance),t.attenuationColor!==void 0&&this.attenuationColor!==void 0&&this.attenuationColor.setHex(t.attenuationColor),t.anisotropy!==void 0&&(this.anisotropy=t.anisotropy),t.anisotropyRotation!==void 0&&(this.anisotropyRotation=t.anisotropyRotation),t.fog!==void 0&&(this.fog=t.fog),t.flatShading!==void 0&&(this.flatShading=t.flatShading),t.blending!==void 0&&(this.blending=t.blending),t.combine!==void 0&&(this.combine=t.combine),t.side!==void 0&&(this.side=t.side),t.shadowSide!==void 0&&(this.shadowSide=t.shadowSide),t.opacity!==void 0&&(this.opacity=t.opacity),t.transparent!==void 0&&(this.transparent=t.transparent),t.alphaTest!==void 0&&(this.alphaTest=t.alphaTest),t.alphaHash!==void 0&&(this.alphaHash=t.alphaHash),t.depthFunc!==void 0&&(this.depthFunc=t.depthFunc),t.depthTest!==void 0&&(this.depthTest=t.depthTest),t.depthWrite!==void 0&&(this.depthWrite=t.depthWrite),t.colorWrite!==void 0&&(this.colorWrite=t.colorWrite),t.clippingPlanes!==void 0&&(this.clippingPlanes=t.clippingPlanes.map(n=>new vn().fromJSON(n))),t.clipIntersection!==void 0&&(this.clipIntersection=t.clipIntersection),t.clipShadows!==void 0&&(this.clipShadows=t.clipShadows),t.depthPacking!==void 0&&(this.depthPacking=t.depthPacking),t.blendSrc!==void 0&&(this.blendSrc=t.blendSrc),t.blendDst!==void 0&&(this.blendDst=t.blendDst),t.blendEquation!==void 0&&(this.blendEquation=t.blendEquation),t.blendSrcAlpha!==void 0&&(this.blendSrcAlpha=t.blendSrcAlpha),t.blendDstAlpha!==void 0&&(this.blendDstAlpha=t.blendDstAlpha),t.blendEquationAlpha!==void 0&&(this.blendEquationAlpha=t.blendEquationAlpha),t.blendColor!==void 0&&this.blendColor!==void 0&&this.blendColor.setHex(t.blendColor),t.blendAlpha!==void 0&&(this.blendAlpha=t.blendAlpha),t.stencilWriteMask!==void 0&&(this.stencilWriteMask=t.stencilWriteMask),t.stencilFunc!==void 0&&(this.stencilFunc=t.stencilFunc),t.stencilRef!==void 0&&(this.stencilRef=t.stencilRef),t.stencilFuncMask!==void 0&&(this.stencilFuncMask=t.stencilFuncMask),t.stencilFail!==void 0&&(this.stencilFail=t.stencilFail),t.stencilZFail!==void 0&&(this.stencilZFail=t.stencilZFail),t.stencilZPass!==void 0&&(this.stencilZPass=t.stencilZPass),t.stencilWrite!==void 0&&(this.stencilWrite=t.stencilWrite),t.wireframe!==void 0&&(this.wireframe=t.wireframe),t.wireframeLinewidth!==void 0&&(this.wireframeLinewidth=t.wireframeLinewidth),t.wireframeLinecap!==void 0&&(this.wireframeLinecap=t.wireframeLinecap),t.wireframeLinejoin!==void 0&&(this.wireframeLinejoin=t.wireframeLinejoin),t.rotation!==void 0&&(this.rotation=t.rotation),t.linewidth!==void 0&&(this.linewidth=t.linewidth),t.linecap!==void 0&&(this.linecap=t.linecap),t.linejoin!==void 0&&(this.linejoin=t.linejoin),t.dashSize!==void 0&&(this.dashSize=t.dashSize),t.gapSize!==void 0&&(this.gapSize=t.gapSize),t.scale!==void 0&&(this.scale=t.scale),t.polygonOffset!==void 0&&(this.polygonOffset=t.polygonOffset),t.polygonOffsetFactor!==void 0&&(this.polygonOffsetFactor=t.polygonOffsetFactor),t.polygonOffsetUnits!==void 0&&(this.polygonOffsetUnits=t.polygonOffsetUnits),t.dithering!==void 0&&(this.dithering=t.dithering),t.alphaToCoverage!==void 0&&(this.alphaToCoverage=t.alphaToCoverage),t.premultipliedAlpha!==void 0&&(this.premultipliedAlpha=t.premultipliedAlpha),t.forceSinglePass!==void 0&&(this.forceSinglePass=t.forceSinglePass),t.allowOverride!==void 0&&(this.allowOverride=t.allowOverride),t.visible!==void 0&&(this.visible=t.visible),t.toneMapped!==void 0&&(this.toneMapped=t.toneMapped),t.userData!==void 0&&(this.userData=t.userData),t.vertexColors!==void 0&&(typeof t.vertexColors=="number"?this.vertexColors=t.vertexColors>0:this.vertexColors=t.vertexColors),t.size!==void 0&&(this.size=t.size),t.sizeAttenuation!==void 0&&(this.sizeAttenuation=t.sizeAttenuation),t.map!==void 0&&(this.map=e[t.map]||null),t.matcap!==void 0&&(this.matcap=e[t.matcap]||null),t.alphaMap!==void 0&&(this.alphaMap=e[t.alphaMap]||null),t.bumpMap!==void 0&&(this.bumpMap=e[t.bumpMap]||null),t.bumpScale!==void 0&&(this.bumpScale=t.bumpScale),t.normalMap!==void 0&&(this.normalMap=e[t.normalMap]||null),t.normalMapType!==void 0&&(this.normalMapType=t.normalMapType),t.normalScale!==void 0){let n=t.normalScale;Array.isArray(n)===!1&&(n=[n,n]),this.normalScale=new dt().fromArray(n)}return t.displacementMap!==void 0&&(this.displacementMap=e[t.displacementMap]||null),t.displacementScale!==void 0&&(this.displacementScale=t.displacementScale),t.displacementBias!==void 0&&(this.displacementBias=t.displacementBias),t.roughnessMap!==void 0&&(this.roughnessMap=e[t.roughnessMap]||null),t.metalnessMap!==void 0&&(this.metalnessMap=e[t.metalnessMap]||null),t.emissiveMap!==void 0&&(this.emissiveMap=e[t.emissiveMap]||null),t.emissiveIntensity!==void 0&&(this.emissiveIntensity=t.emissiveIntensity),t.specularMap!==void 0&&(this.specularMap=e[t.specularMap]||null),t.specularIntensityMap!==void 0&&(this.specularIntensityMap=e[t.specularIntensityMap]||null),t.specularColorMap!==void 0&&(this.specularColorMap=e[t.specularColorMap]||null),t.envMap!==void 0&&(this.envMap=e[t.envMap]||null),t.envMapRotation!==void 0&&this.envMapRotation.fromArray(t.envMapRotation),t.envMapIntensity!==void 0&&(this.envMapIntensity=t.envMapIntensity),t.reflectivity!==void 0&&(this.reflectivity=t.reflectivity),t.refractionRatio!==void 0&&(this.refractionRatio=t.refractionRatio),t.lightMap!==void 0&&(this.lightMap=e[t.lightMap]||null),t.lightMapIntensity!==void 0&&(this.lightMapIntensity=t.lightMapIntensity),t.aoMap!==void 0&&(this.aoMap=e[t.aoMap]||null),t.aoMapIntensity!==void 0&&(this.aoMapIntensity=t.aoMapIntensity),t.gradientMap!==void 0&&(this.gradientMap=e[t.gradientMap]||null),t.clearcoatMap!==void 0&&(this.clearcoatMap=e[t.clearcoatMap]||null),t.clearcoatRoughnessMap!==void 0&&(this.clearcoatRoughnessMap=e[t.clearcoatRoughnessMap]||null),t.clearcoatNormalMap!==void 0&&(this.clearcoatNormalMap=e[t.clearcoatNormalMap]||null),t.clearcoatNormalScale!==void 0&&(this.clearcoatNormalScale=new dt().fromArray(t.clearcoatNormalScale)),t.iridescenceMap!==void 0&&(this.iridescenceMap=e[t.iridescenceMap]||null),t.iridescenceThicknessMap!==void 0&&(this.iridescenceThicknessMap=e[t.iridescenceThicknessMap]||null),t.transmissionMap!==void 0&&(this.transmissionMap=e[t.transmissionMap]||null),t.thicknessMap!==void 0&&(this.thicknessMap=e[t.thicknessMap]||null),t.anisotropyMap!==void 0&&(this.anisotropyMap=e[t.anisotropyMap]||null),t.sheenColorMap!==void 0&&(this.sheenColorMap=e[t.sheenColorMap]||null),t.sheenRoughnessMap!==void 0&&(this.sheenRoughnessMap=e[t.sheenRoughnessMap]||null),this}clone(){return new this.constructor().copy(this)}copy(t){this.name=t.name,this.blending=t.blending,this.side=t.side,this.vertexColors=t.vertexColors,this.opacity=t.opacity,this.transparent=t.transparent,this.blendSrc=t.blendSrc,this.blendDst=t.blendDst,this.blendEquation=t.blendEquation,this.blendSrcAlpha=t.blendSrcAlpha,this.blendDstAlpha=t.blendDstAlpha,this.blendEquationAlpha=t.blendEquationAlpha,this.blendColor.copy(t.blendColor),this.blendAlpha=t.blendAlpha,this.depthFunc=t.depthFunc,this.depthTest=t.depthTest,this.depthWrite=t.depthWrite,this.stencilWriteMask=t.stencilWriteMask,this.stencilFunc=t.stencilFunc,this.stencilRef=t.stencilRef,this.stencilFuncMask=t.stencilFuncMask,this.stencilFail=t.stencilFail,this.stencilZFail=t.stencilZFail,this.stencilZPass=t.stencilZPass,this.stencilWrite=t.stencilWrite;const e=t.clippingPlanes;let n=null;if(e!==null){const s=e.length;n=new Array(s);for(let r=0;r!==s;++r)n[r]=e[r].clone()}return this.clippingPlanes=n,this.clipIntersection=t.clipIntersection,this.clipShadows=t.clipShadows,this.shadowSide=t.shadowSide,this.colorWrite=t.colorWrite,this.precision=t.precision,this.polygonOffset=t.polygonOffset,this.polygonOffsetFactor=t.polygonOffsetFactor,this.polygonOffsetUnits=t.polygonOffsetUnits,this.dithering=t.dithering,this.alphaTest=t.alphaTest,this.alphaHash=t.alphaHash,this.alphaToCoverage=t.alphaToCoverage,this.premultipliedAlpha=t.premultipliedAlpha,this.forceSinglePass=t.forceSinglePass,this.allowOverride=t.allowOverride,this.visible=t.visible,this.toneMapped=t.toneMapped,this.userData=JSON.parse(JSON.stringify(t.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(t){t===!0&&this.version++}}const _n=new H,dr=new H,ss=new H,rs=new H;class Ll{constructor(t=new H,e=new H(0,0,-1)){this.origin=t,this.direction=e}set(t,e){return this.origin.copy(t),this.direction.copy(e),this}copy(t){return this.origin.copy(t.origin),this.direction.copy(t.direction),this}at(t,e){return e.copy(this.origin).addScaledVector(this.direction,t)}lookAt(t){return this.direction.copy(t).sub(this.origin).normalize(),this}recast(t){return this.origin.copy(this.at(t,_n)),this}closestPointToPoint(t,e){e.subVectors(t,this.origin);const n=e.dot(this.direction);return n<0?e.copy(this.origin):e.copy(this.origin).addScaledVector(this.direction,n)}distanceToPoint(t){return Math.sqrt(this.distanceSqToPoint(t))}distanceSqToPoint(t){const e=_n.subVectors(t,this.origin).dot(this.direction);return e<0?this.origin.distanceToSquared(t):(_n.copy(this.origin).addScaledVector(this.direction,e),_n.distanceToSquared(t))}distanceSqToSegment(t,e,n,s){dr.copy(t).add(e).multiplyScalar(.5),ss.copy(e).sub(t).normalize(),rs.copy(this.origin).sub(dr);const r=t.distanceTo(e)*.5,a=-this.direction.dot(ss),o=rs.dot(this.direction),c=-rs.dot(ss),l=rs.lengthSq(),u=Math.abs(1-a*a);let f,h,p,_;if(u>0)if(f=a*c-o,h=a*o-c,_=r*u,f>=0)if(h>=-_)if(h<=_){const y=1/u;f*=y,h*=y,p=f*(f+a*h+2*o)+h*(a*f+h+2*c)+l}else h=r,f=Math.max(0,-(a*h+o)),p=-f*f+h*(h+2*c)+l;else h=-r,f=Math.max(0,-(a*h+o)),p=-f*f+h*(h+2*c)+l;else h<=-_?(f=Math.max(0,-(-a*r+o)),h=f>0?-r:Math.min(Math.max(-r,-c),r),p=-f*f+h*(h+2*c)+l):h<=_?(f=0,h=Math.min(Math.max(-r,-c),r),p=h*(h+2*c)+l):(f=Math.max(0,-(a*r+o)),h=f>0?r:Math.min(Math.max(-r,-c),r),p=-f*f+h*(h+2*c)+l);else h=a>0?-r:r,f=Math.max(0,-(a*h+o)),p=-f*f+h*(h+2*c)+l;return n&&n.copy(this.origin).addScaledVector(this.direction,f),s&&s.copy(dr).addScaledVector(ss,h),p}intersectSphere(t,e){if(t.radius<0)return null;_n.subVectors(t.center,this.origin);const n=_n.dot(this.direction),s=_n.dot(_n)-n*n,r=t.radius*t.radius;if(s>r)return null;const a=Math.sqrt(r-s),o=n-a,c=n+a;return c<0?null:o<0?this.at(c,e):this.at(o,e)}intersectsSphere(t){return t.radius<0?!1:this.distanceSqToPoint(t.center)<=t.radius*t.radius}distanceToPlane(t){const e=t.normal.dot(this.direction);if(e===0)return t.distanceToPoint(this.origin)===0?0:null;const n=-(this.origin.dot(t.normal)+t.constant)/e;return n>=0?n:null}intersectPlane(t,e){const n=this.distanceToPlane(t);return n===null?null:this.at(n,e)}intersectsPlane(t){const e=t.distanceToPoint(this.origin);return e===0||t.normal.dot(this.direction)*e<0}intersectBox(t,e){let n,s,r,a,o,c;const l=1/this.direction.x,u=1/this.direction.y,f=1/this.direction.z,h=this.origin;return l>=0?(n=(t.min.x-h.x)*l,s=(t.max.x-h.x)*l):(n=(t.max.x-h.x)*l,s=(t.min.x-h.x)*l),u>=0?(r=(t.min.y-h.y)*u,a=(t.max.y-h.y)*u):(r=(t.max.y-h.y)*u,a=(t.min.y-h.y)*u),n>a||r>s||((r>n||isNaN(n))&&(n=r),(a<s||isNaN(s))&&(s=a),f>=0?(o=(t.min.z-h.z)*f,c=(t.max.z-h.z)*f):(o=(t.max.z-h.z)*f,c=(t.min.z-h.z)*f),n>c||o>s)||((o>n||n!==n)&&(n=o),(c<s||s!==s)&&(s=c),s<0)?null:this.at(n>=0?n:s,e)}intersectsBox(t){return this.intersectBox(t,_n)!==null}intersectTriangle(t,e,n,s,r){const a=this.origin,o=this.direction,c=o.x,l=o.y,u=o.z,f=t.x-a.x,h=t.y-a.y,p=t.z-a.z,_=e.x-a.x,y=e.y-a.y,m=e.z-a.z,d=n.x-a.x,P=n.y-a.y,D=n.z-a.z,S=Math.abs(c),w=Math.abs(l),A=Math.abs(u);let F,v,R,B,X,q,nt,G,J,lt,K,Z;if(S>=w&&S>=A?(R=c,q=f,J=_,Z=d,c>=0?(F=l,v=u,B=h,X=p,nt=y,G=m,lt=P,K=D):(F=u,v=l,B=p,X=h,nt=m,G=y,lt=D,K=P)):w>=A?(R=l,q=h,J=y,Z=P,l>=0?(F=u,v=c,B=p,X=f,nt=m,G=_,lt=D,K=d):(F=c,v=u,B=f,X=p,nt=_,G=m,lt=d,K=D)):(R=u,q=p,J=m,Z=D,u>=0?(F=c,v=l,B=f,X=h,nt=_,G=y,lt=d,K=P):(F=l,v=c,B=h,X=f,nt=y,G=_,lt=P,K=d)),R===0)return null;const it=F/R,rt=v/R,ht=1/R,Dt=B-it*q,Ct=X-rt*q,qt=nt-it*J,Xt=G-rt*J,Zt=lt-it*Z,N=K-rt*Z,L=Zt*Xt-N*qt,C=Dt*N-Ct*Zt,T=qt*Ct-Xt*Dt;if(s){if(L<0||C<0||T<0)return null}else if((L<0||C<0||T<0)&&(L>0||C>0||T>0))return null;const U=L+C+T;if(U===0)return null;const et=ht*(L*q+C*J+T*Z);return(U>0?et<0:et>0)?null:this.at(et/U,r)}applyMatrix4(t){return this.origin.applyMatrix4(t),this.direction.transformDirection(t),this}equals(t){return t.origin.equals(this.origin)&&t.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}}class Us extends Xi{constructor(t){super(),this.isMeshBasicMaterial=!0,this.type="MeshBasicMaterial",this.color=new jt(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Nn,this.combine=cl,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.lightMap=t.lightMap,this.lightMapIntensity=t.lightMapIntensity,this.aoMap=t.aoMap,this.aoMapIntensity=t.aoMapIntensity,this.specularMap=t.specularMap,this.alphaMap=t.alphaMap,this.envMap=t.envMap,this.envMapRotation.copy(t.envMapRotation),this.combine=t.combine,this.reflectivity=t.reflectivity,this.refractionRatio=t.refractionRatio,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.wireframeLinecap=t.wireframeLinecap,this.wireframeLinejoin=t.wireframeLinejoin,this.fog=t.fog,this}}const fo=new pe,zn=new Ll,as=new Ta,po=new H,os=new H,ls=new H,cs=new H,pr=new H,hs=new H,mo=new H,us=new H;class hn extends Re{constructor(t=new ke,e=new Us){super(),this.isMesh=!0,this.type="Mesh",this.geometry=t,this.material=e,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.count=1,this.updateMorphTargets()}copy(t,e){return super.copy(t,e),t.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=t.morphTargetInfluences.slice()),t.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},t.morphTargetDictionary)),this.material=Array.isArray(t.material)?t.material.slice():t.material,this.geometry=t.geometry,this}updateMorphTargets(){const e=this.geometry.morphAttributes,n=Object.keys(e);if(n.length>0){const s=e[n[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,a=s.length;r<a;r++){const o=s[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=r}}}}getVertexPosition(t,e){const n=this.geometry,s=n.attributes.position,r=n.morphAttributes.position,a=n.morphTargetsRelative;e.fromBufferAttribute(s,t);const o=this.morphTargetInfluences;if(r&&o){hs.set(0,0,0);for(let c=0,l=r.length;c<l;c++){const u=o[c],f=r[c];u!==0&&(pr.fromBufferAttribute(f,t),a?hs.addScaledVector(pr,u):hs.addScaledVector(pr.sub(e),u))}e.add(hs)}return e}intersectsFrustum(t){return t.intersectsObject(this)}raycast(t,e){const n=this.geometry,s=this.material,r=this.matrixWorld;s!==void 0&&(n.boundingSphere===null&&n.computeBoundingSphere(),as.copy(n.boundingSphere),as.applyMatrix4(r),zn.copy(t.ray).recast(t.near),!(as.containsPoint(zn.origin)===!1&&(zn.intersectSphere(as,po)===null||zn.origin.distanceToSquared(po)>(t.far-t.near)**2))&&(fo.copy(r).invert(),zn.copy(t.ray).applyMatrix4(fo),!(n.boundingBox!==null&&zn.intersectsBox(n.boundingBox)===!1)&&this._computeIntersections(t,e,zn)))}_computeIntersections(t,e,n){let s;const r=this.geometry,a=this.material,o=r.index,c=r.attributes.position,l=r.attributes.uv,u=r.attributes.uv1,f=r.attributes.normal,h=r.groups,p=r.drawRange;if(o!==null)if(Array.isArray(a))for(let _=0,y=h.length;_<y;_++){const m=h[_],d=a[m.materialIndex],P=Math.max(m.start,p.start),D=Math.min(o.count,Math.min(m.start+m.count,p.start+p.count));for(let S=P,w=D;S<w;S+=3){const A=o.getX(S),F=o.getX(S+1),v=o.getX(S+2);s=fs(this,d,t,n,l,u,f,A,F,v),s&&(s.faceIndex=Math.floor(S/3),s.face.materialIndex=m.materialIndex,e.push(s))}}else{const _=Math.max(0,p.start),y=Math.min(o.count,p.start+p.count);for(let m=_,d=y;m<d;m+=3){const P=o.getX(m),D=o.getX(m+1),S=o.getX(m+2);s=fs(this,a,t,n,l,u,f,P,D,S),s&&(s.faceIndex=Math.floor(m/3),e.push(s))}}else if(c!==void 0)if(Array.isArray(a))for(let _=0,y=h.length;_<y;_++){const m=h[_],d=a[m.materialIndex],P=Math.max(m.start,p.start),D=Math.min(c.count,Math.min(m.start+m.count,p.start+p.count));for(let S=P,w=D;S<w;S+=3){const A=S,F=S+1,v=S+2;s=fs(this,d,t,n,l,u,f,A,F,v),s&&(s.faceIndex=Math.floor(S/3),s.face.materialIndex=m.materialIndex,e.push(s))}}else{const _=Math.max(0,p.start),y=Math.min(c.count,p.start+p.count);for(let m=_,d=y;m<d;m+=3){const P=m,D=m+1,S=m+2;s=fs(this,a,t,n,l,u,f,P,D,S),s&&(s.faceIndex=Math.floor(m/3),e.push(s))}}}}function gh(i,t,e,n,s,r,a,o){let c;if(t.side===Ie?c=n.intersectTriangle(a,r,s,!0,o):c=n.intersectTriangle(s,r,a,t.side===Xn,o),c===null)return null;us.copy(o),us.applyMatrix4(i.matrixWorld);const l=e.ray.origin.distanceTo(us);return l<e.near||l>e.far?null:{distance:l,point:us.clone(),object:i}}function fs(i,t,e,n,s,r,a,o,c,l){i.getVertexPosition(o,os),i.getVertexPosition(c,ls),i.getVertexPosition(l,cs);const u=gh(i,t,e,n,os,ls,cs,mo);if(u){const f=new H;Ze.getBarycoord(mo,os,ls,cs,f),s&&(u.uv=Ze.getInterpolatedAttribute(s,o,c,l,f,new dt)),r&&(u.uv1=Ze.getInterpolatedAttribute(r,o,c,l,f,new dt)),a&&(u.normal=Ze.getInterpolatedAttribute(a,o,c,l,f,new H),u.normal.dot(n.direction)>0&&u.normal.multiplyScalar(-1));const h={a:o,b:c,c:l,normal:new H,materialIndex:0};Ze.getNormal(os,ls,cs,h.normal),u.face=h,u.barycoord=f}return u}class _h extends we{constructor(t=null,e=1,n=1,s,r,a,o,c,l=ye,u=ye,f,h){super(null,a,o,c,l,u,s,r,f,h),this.isDataTexture=!0,this.image={data:t,width:e,height:n},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}}const Gn=new Ta,xh=new dt(.5,.5),ds=new H;class Aa{constructor(t=new vn,e=new vn,n=new vn,s=new vn,r=new vn,a=new vn){this.planes=[t,e,n,s,r,a]}set(t,e,n,s,r,a){const o=this.planes;return o[0].copy(t),o[1].copy(e),o[2].copy(n),o[3].copy(s),o[4].copy(r),o[5].copy(a),this}copy(t){const e=this.planes;for(let n=0;n<6;n++)e[n].copy(t.planes[n]);return this}setFromProjectionMatrix(t,e=rn,n=!1){const s=this.planes,r=t.elements,a=r[0],o=r[1],c=r[2],l=r[3],u=r[4],f=r[5],h=r[6],p=r[7],_=r[8],y=r[9],m=r[10],d=r[11],P=r[12],D=r[13],S=r[14],w=r[15];if(s[0].setComponents(l-a,p-u,d-_,w-P).normalize(),s[1].setComponents(l+a,p+u,d+_,w+P).normalize(),s[2].setComponents(l+o,p+f,d+y,w+D).normalize(),s[3].setComponents(l-o,p-f,d-y,w-D).normalize(),n)s[4].setComponents(c,h,m,S).normalize(),s[5].setComponents(l-c,p-h,d-m,w-S).normalize();else if(s[4].setComponents(l-c,p-h,d-m,w-S).normalize(),e===rn)s[5].setComponents(l+c,p+h,d+m,w+S).normalize();else if(e===Bi)s[5].setComponents(c,h,m,S).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+e);return this}intersectsObject(t){if(t.boundingSphere!==void 0)t.boundingSphere===null&&t.computeBoundingSphere(),Gn.copy(t.boundingSphere).applyMatrix4(t.matrixWorld);else{const e=t.geometry;e.boundingSphere===null&&e.computeBoundingSphere(),Gn.copy(e.boundingSphere).applyMatrix4(t.matrixWorld)}return this.intersectsSphere(Gn)}intersectsSprite(t){Gn.center.set(0,0,0);const e=xh.distanceTo(t.center);return Gn.radius=.7071067811865476+e,Gn.applyMatrix4(t.matrixWorld),this.intersectsSphere(Gn)}intersectsSphere(t){const e=this.planes,n=t.center,s=-t.radius;for(let r=0;r<6;r++)if(e[r].distanceToPoint(n)<s)return!1;return!0}intersectsBox(t){const e=this.planes;for(let n=0;n<6;n++){const s=e[n];if(ds.x=s.normal.x>0?t.max.x:t.min.x,ds.y=s.normal.y>0?t.max.y:t.min.y,ds.z=s.normal.z>0?t.max.z:t.min.z,s.distanceToPoint(ds)<0)return!1}return!0}containsPoint(t){const e=this.planes;for(let n=0;n<6;n++)if(e[n].distanceToPoint(t)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}}class Dl extends we{constructor(t=[],e=qn,n,s,r,a,o,c,l,u){super(t,e,n,s,r,a,o,c,l,u),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(t){this.image=t}}class vh extends we{constructor(t,e,n,s,r,a,o,c,l){super(t,e,n,s,r,a,o,c,l),this.isCanvasTexture=!0,this.needsUpdate=!0}}class zi extends we{constructor(t,e,n=ln,s,r,a,o=ye,c=ye,l,u=yn,f=1){if(u!==yn&&u!==Wn)throw new Error("THREE.DepthTexture: format must be either THREE.DepthFormat or THREE.DepthStencilFormat");const h={width:t,height:e,depth:f};super(h,s,r,a,o,c,u,n,l),this.isDepthTexture=!0,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(t){return super.copy(t),this.source=new ba(Object.assign({},t.image)),this.compareFunction=t.compareFunction,this}toJSON(t){const e=super.toJSON(t);return e.compareFunction=this.compareFunction,e}}class Sh extends zi{constructor(t,e=ln,n=qn,s,r,a=ye,o=ye,c,l=yn){const u={width:t,height:t,depth:1},f=[u,u,u,u,u,u];super(t,t,e,n,s,r,a,o,c,l),this.image=f,this.isCubeDepthTexture=!0,this.isCubeTexture=!0}get images(){return this.image}set images(t){this.image=t}}class Il extends we{constructor(t=null){super(),this.sourceTexture=t,this.isExternalTexture=!0}copy(t){return super.copy(t),this.sourceTexture=t.sourceTexture,this}}class qi extends ke{constructor(t=1,e=1,n=1,s=1,r=1,a=1){super(),this.type="BoxGeometry",this.parameters={width:t,height:e,depth:n,widthSegments:s,heightSegments:r,depthSegments:a};const o=this;s=Math.floor(s),r=Math.floor(r),a=Math.floor(a);const c=[],l=[],u=[],f=[];let h=0,p=0;_("z","y","x",-1,-1,n,e,t,a,r,0),_("z","y","x",1,-1,n,e,-t,a,r,1),_("x","z","y",1,1,t,n,e,s,a,2),_("x","z","y",1,-1,t,n,-e,s,a,3),_("x","y","z",1,-1,t,e,n,s,r,4),_("x","y","z",-1,-1,t,e,-n,s,r,5),this.setIndex(c),this.setAttribute("position",new Ne(l,3)),this.setAttribute("normal",new Ne(u,3)),this.setAttribute("uv",new Ne(f,2));function _(y,m,d,P,D,S,w,A,F,v,R){const B=S/F,X=w/v,q=S/2,nt=w/2,G=A/2,J=F+1,lt=v+1;let K=0,Z=0;const it=new H;for(let rt=0;rt<lt;rt++){const ht=rt*X-nt;for(let Dt=0;Dt<J;Dt++){const Ct=Dt*B-q;it[y]=Ct*P,it[m]=ht*D,it[d]=G,l.push(it.x,it.y,it.z),it[y]=0,it[m]=0,it[d]=A>0?1:-1,u.push(it.x,it.y,it.z),f.push(Dt/F),f.push(1-rt/v),K+=1}}for(let rt=0;rt<v;rt++)for(let ht=0;ht<F;ht++){const Dt=h+ht+J*rt,Ct=h+ht+J*(rt+1),qt=h+(ht+1)+J*(rt+1),Xt=h+(ht+1)+J*rt;c.push(Dt,Ct,Xt),c.push(Ct,qt,Xt),Z+=6}o.addGroup(p,Z,R),p+=Z,h+=K}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new qi(t.width,t.height,t.depth,t.widthSegments,t.heightSegments,t.depthSegments)}}class fn{constructor(){this.type="Curve",this.arcLengthDivisions=200,this.needsUpdate=!1,this.cacheArcLengths=null}getPoint(){Wt("Curve: .getPoint() not implemented.")}getPointAt(t,e){const n=this.getUtoTmapping(t);return this.getPoint(n,e)}getPoints(t=5){const e=[];for(let n=0;n<=t;n++)e.push(this.getPoint(n/t));return e}getSpacedPoints(t=5){const e=[];for(let n=0;n<=t;n++)e.push(this.getPointAt(n/t));return e}getLength(){const t=this.getLengths();return t[t.length-1]}getLengths(t=this.arcLengthDivisions){if(this.cacheArcLengths&&this.cacheArcLengths.length===t+1&&!this.needsUpdate)return this.cacheArcLengths;this.needsUpdate=!1;const e=[];let n,s=this.getPoint(0),r=0;e.push(0);for(let a=1;a<=t;a++)n=this.getPoint(a/t),r+=n.distanceTo(s),e.push(r),s=n;return this.cacheArcLengths=e,e}updateArcLengths(){this.needsUpdate=!0,this.getLengths()}getUtoTmapping(t,e=null){const n=this.getLengths();let s=0;const r=n.length;let a;e?a=e:a=t*n[r-1];let o=0,c=r-1,l;for(;o<=c;)if(s=Math.floor(o+(c-o)/2),l=n[s]-a,l<0)o=s+1;else if(l>0)c=s-1;else{c=s;break}if(s=c,n[s]===a)return s/(r-1);const u=n[s],h=n[s+1]-u,p=(a-u)/h;return(s+p)/(r-1)}getTangent(t,e){let s=t-1e-4,r=t+1e-4;s<0&&(s=0),r>1&&(r=1);const a=this.getPoint(s),o=this.getPoint(r),c=e||(a.isVector2?new dt:new H);return c.copy(o).sub(a).normalize(),c}getTangentAt(t,e){const n=this.getUtoTmapping(t);return this.getTangent(n,e)}computeFrenetFrames(t,e=!1){const n=new H,s=[],r=[],a=[],o=new H,c=new pe;for(let p=0;p<=t;p++){const _=p/t;s[p]=this.getTangentAt(_,new H)}r[0]=new H,a[0]=new H;let l=Number.MAX_VALUE;const u=Math.abs(s[0].x),f=Math.abs(s[0].y),h=Math.abs(s[0].z);u<=l&&(l=u,n.set(1,0,0)),f<=l&&(l=f,n.set(0,1,0)),h<=l&&n.set(0,0,1),o.crossVectors(s[0],n).normalize(),r[0].crossVectors(s[0],o),a[0].crossVectors(s[0],r[0]);for(let p=1;p<=t;p++){if(r[p]=r[p-1].clone(),a[p]=a[p-1].clone(),o.crossVectors(s[p-1],s[p]),o.length()>Number.EPSILON){o.normalize();const _=Math.acos($t(s[p-1].dot(s[p]),-1,1));r[p].applyMatrix4(c.makeRotationAxis(o,_))}a[p].crossVectors(s[p],r[p])}if(e===!0){let p=Math.acos($t(r[0].dot(r[t]),-1,1));p/=t,s[0].dot(o.crossVectors(r[0],r[t]))>0&&(p=-p);for(let _=1;_<=t;_++)r[_].applyMatrix4(c.makeRotationAxis(s[_],p*_)),a[_].crossVectors(s[_],r[_])}return{tangents:s,normals:r,binormals:a}}clone(){return new this.constructor().copy(this)}copy(t){return this.arcLengthDivisions=t.arcLengthDivisions,this}toJSON(){const t={metadata:{version:4.7,type:"Curve",generator:"Curve.toJSON"}};return t.arcLengthDivisions=this.arcLengthDivisions,t.type=this.type,t}fromJSON(t){return this.arcLengthDivisions=t.arcLengthDivisions,this}}class wa extends fn{constructor(t=0,e=0,n=1,s=1,r=0,a=Math.PI*2,o=!1,c=0){super(),this.isEllipseCurve=!0,this.type="EllipseCurve",this.aX=t,this.aY=e,this.xRadius=n,this.yRadius=s,this.aStartAngle=r,this.aEndAngle=a,this.aClockwise=o,this.aRotation=c}getPoint(t,e=new dt){const n=e,s=Math.PI*2;let r=this.aEndAngle-this.aStartAngle;const a=Math.abs(r)<Number.EPSILON;for(;r<0;)r+=s;for(;r>s;)r-=s;r<Number.EPSILON&&(a?r=0:r=s),this.aClockwise===!0&&!a&&(r===s?r=-s:r=r-s);const o=this.aStartAngle+t*r;let c=this.aX+this.xRadius*Math.cos(o),l=this.aY+this.yRadius*Math.sin(o);if(this.aRotation!==0){const u=Math.cos(this.aRotation),f=Math.sin(this.aRotation),h=c-this.aX,p=l-this.aY;c=h*u-p*f+this.aX,l=h*f+p*u+this.aY}return n.set(c,l)}copy(t){return super.copy(t),this.aX=t.aX,this.aY=t.aY,this.xRadius=t.xRadius,this.yRadius=t.yRadius,this.aStartAngle=t.aStartAngle,this.aEndAngle=t.aEndAngle,this.aClockwise=t.aClockwise,this.aRotation=t.aRotation,this}toJSON(){const t=super.toJSON();return t.aX=this.aX,t.aY=this.aY,t.xRadius=this.xRadius,t.yRadius=this.yRadius,t.aStartAngle=this.aStartAngle,t.aEndAngle=this.aEndAngle,t.aClockwise=this.aClockwise,t.aRotation=this.aRotation,t}fromJSON(t){return super.fromJSON(t),this.aX=t.aX,this.aY=t.aY,this.xRadius=t.xRadius,this.yRadius=t.yRadius,this.aStartAngle=t.aStartAngle,this.aEndAngle=t.aEndAngle,this.aClockwise=t.aClockwise,this.aRotation=t.aRotation,this}}class Mh extends wa{constructor(t,e,n,s,r,a){super(t,e,n,n,s,r,a),this.isArcCurve=!0,this.type="ArcCurve"}}function Ra(){let i=0,t=0,e=0,n=0;function s(r,a,o,c){i=r,t=o,e=-3*r+3*a-2*o-c,n=2*r-2*a+o+c}return{initCatmullRom:function(r,a,o,c,l){s(a,o,l*(o-r),l*(c-a))},initNonuniformCatmullRom:function(r,a,o,c,l,u,f){let h=(a-r)/l-(o-r)/(l+u)+(o-a)/u,p=(o-a)/u-(c-a)/(u+f)+(c-o)/f;h*=u,p*=u,s(a,o,h,p)},calc:function(r){const a=r*r,o=a*r;return i+t*r+e*a+n*o}}}const go=new H,_o=new H,mr=new Ra,gr=new Ra,_r=new Ra;class yh extends fn{constructor(t=[],e=!1,n="centripetal",s=.5){super(),this.isCatmullRomCurve3=!0,this.type="CatmullRomCurve3",this.points=t,this.closed=e,this.curveType=n,this.tension=s}getPoint(t,e=new H){const n=e,s=this.points,r=s.length,a=(r-(this.closed?0:1))*t;let o=Math.floor(a),c=a-o;this.closed?o+=o>0?0:(Math.floor(Math.abs(o)/r)+1)*r:c===0&&o===r-1&&(o=r-2,c=1);let l,u;this.closed||o>0?l=s[(o-1)%r]:(_o.subVectors(s[0],s[1]).add(s[0]),l=_o);const f=s[o%r],h=s[(o+1)%r];if(this.closed||o+2<r?u=s[(o+2)%r]:(go.subVectors(s[r-1],s[r-2]).add(s[r-1]),u=go),this.curveType==="centripetal"||this.curveType==="chordal"){const p=this.curveType==="chordal"?.5:.25;let _=Math.pow(l.distanceToSquared(f),p),y=Math.pow(f.distanceToSquared(h),p),m=Math.pow(h.distanceToSquared(u),p);y<1e-4&&(y=1),_<1e-4&&(_=y),m<1e-4&&(m=y),mr.initNonuniformCatmullRom(l.x,f.x,h.x,u.x,_,y,m),gr.initNonuniformCatmullRom(l.y,f.y,h.y,u.y,_,y,m),_r.initNonuniformCatmullRom(l.z,f.z,h.z,u.z,_,y,m)}else this.curveType==="catmullrom"&&(mr.initCatmullRom(l.x,f.x,h.x,u.x,this.tension),gr.initCatmullRom(l.y,f.y,h.y,u.y,this.tension),_r.initCatmullRom(l.z,f.z,h.z,u.z,this.tension));return n.set(mr.calc(c),gr.calc(c),_r.calc(c)),n}copy(t){super.copy(t),this.points=[];for(let e=0,n=t.points.length;e<n;e++){const s=t.points[e];this.points.push(s.clone())}return this.closed=t.closed,this.curveType=t.curveType,this.tension=t.tension,this}toJSON(){const t=super.toJSON();t.points=[];for(let e=0,n=this.points.length;e<n;e++){const s=this.points[e];t.points.push(s.toArray())}return t.closed=this.closed,t.curveType=this.curveType,t.tension=this.tension,t}fromJSON(t){super.fromJSON(t),this.points=[];for(let e=0,n=t.points.length;e<n;e++){const s=t.points[e];this.points.push(new H().fromArray(s))}return this.closed=t.closed,this.curveType=t.curveType,this.tension=t.tension,this}}function xo(i,t,e,n,s){const r=(n-t)*.5,a=(s-e)*.5,o=i*i,c=i*o;return(2*e-2*n+r+a)*c+(-3*e+3*n-2*r-a)*o+r*i+e}function Eh(i,t){const e=1-i;return e*e*t}function bh(i,t){return 2*(1-i)*i*t}function Th(i,t){return i*i*t}function Ii(i,t,e,n){return Eh(i,t)+bh(i,e)+Th(i,n)}function Ah(i,t){const e=1-i;return e*e*e*t}function wh(i,t){const e=1-i;return 3*e*e*i*t}function Rh(i,t){return 3*(1-i)*i*i*t}function Ch(i,t){return i*i*i*t}function Ni(i,t,e,n,s){return Ah(i,t)+wh(i,e)+Rh(i,n)+Ch(i,s)}class Nl extends fn{constructor(t=new dt,e=new dt,n=new dt,s=new dt){super(),this.isCubicBezierCurve=!0,this.type="CubicBezierCurve",this.v0=t,this.v1=e,this.v2=n,this.v3=s}getPoint(t,e=new dt){const n=e,s=this.v0,r=this.v1,a=this.v2,o=this.v3;return n.set(Ni(t,s.x,r.x,a.x,o.x),Ni(t,s.y,r.y,a.y,o.y)),n}copy(t){return super.copy(t),this.v0.copy(t.v0),this.v1.copy(t.v1),this.v2.copy(t.v2),this.v3.copy(t.v3),this}toJSON(){const t=super.toJSON();return t.v0=this.v0.toArray(),t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t.v3=this.v3.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v0.fromArray(t.v0),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this.v3.fromArray(t.v3),this}}class Ph extends fn{constructor(t=new H,e=new H,n=new H,s=new H){super(),this.isCubicBezierCurve3=!0,this.type="CubicBezierCurve3",this.v0=t,this.v1=e,this.v2=n,this.v3=s}getPoint(t,e=new H){const n=e,s=this.v0,r=this.v1,a=this.v2,o=this.v3;return n.set(Ni(t,s.x,r.x,a.x,o.x),Ni(t,s.y,r.y,a.y,o.y),Ni(t,s.z,r.z,a.z,o.z)),n}copy(t){return super.copy(t),this.v0.copy(t.v0),this.v1.copy(t.v1),this.v2.copy(t.v2),this.v3.copy(t.v3),this}toJSON(){const t=super.toJSON();return t.v0=this.v0.toArray(),t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t.v3=this.v3.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v0.fromArray(t.v0),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this.v3.fromArray(t.v3),this}}class Ul extends fn{constructor(t=new dt,e=new dt){super(),this.isLineCurve=!0,this.type="LineCurve",this.v1=t,this.v2=e}getPoint(t,e=new dt){const n=e;return t===1?n.copy(this.v2):(n.copy(this.v2).sub(this.v1),n.multiplyScalar(t).add(this.v1)),n}getPointAt(t,e){return this.getPoint(t,e)}getTangent(t,e=new dt){return e.subVectors(this.v2,this.v1).normalize()}getTangentAt(t,e){return this.getTangent(t,e)}copy(t){return super.copy(t),this.v1.copy(t.v1),this.v2.copy(t.v2),this}toJSON(){const t=super.toJSON();return t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this}}class Lh extends fn{constructor(t=new H,e=new H){super(),this.isLineCurve3=!0,this.type="LineCurve3",this.v1=t,this.v2=e}getPoint(t,e=new H){const n=e;return t===1?n.copy(this.v2):(n.copy(this.v2).sub(this.v1),n.multiplyScalar(t).add(this.v1)),n}getPointAt(t,e){return this.getPoint(t,e)}getTangent(t,e=new H){return e.subVectors(this.v2,this.v1).normalize()}getTangentAt(t,e){return this.getTangent(t,e)}copy(t){return super.copy(t),this.v1.copy(t.v1),this.v2.copy(t.v2),this}toJSON(){const t=super.toJSON();return t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this}}class Fl extends fn{constructor(t=new dt,e=new dt,n=new dt){super(),this.isQuadraticBezierCurve=!0,this.type="QuadraticBezierCurve",this.v0=t,this.v1=e,this.v2=n}getPoint(t,e=new dt){const n=e,s=this.v0,r=this.v1,a=this.v2;return n.set(Ii(t,s.x,r.x,a.x),Ii(t,s.y,r.y,a.y)),n}copy(t){return super.copy(t),this.v0.copy(t.v0),this.v1.copy(t.v1),this.v2.copy(t.v2),this}toJSON(){const t=super.toJSON();return t.v0=this.v0.toArray(),t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v0.fromArray(t.v0),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this}}class Dh extends fn{constructor(t=new H,e=new H,n=new H){super(),this.isQuadraticBezierCurve3=!0,this.type="QuadraticBezierCurve3",this.v0=t,this.v1=e,this.v2=n}getPoint(t,e=new H){const n=e,s=this.v0,r=this.v1,a=this.v2;return n.set(Ii(t,s.x,r.x,a.x),Ii(t,s.y,r.y,a.y),Ii(t,s.z,r.z,a.z)),n}copy(t){return super.copy(t),this.v0.copy(t.v0),this.v1.copy(t.v1),this.v2.copy(t.v2),this}toJSON(){const t=super.toJSON();return t.v0=this.v0.toArray(),t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v0.fromArray(t.v0),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this}}class Ol extends fn{constructor(t=[]){super(),this.isSplineCurve=!0,this.type="SplineCurve",this.points=t}getPoint(t,e=new dt){const n=e,s=this.points,r=(s.length-1)*t,a=Math.floor(r),o=r-a,c=s[a===0?a:a-1],l=s[a],u=s[a>s.length-2?s.length-1:a+1],f=s[a>s.length-3?s.length-1:a+2];return n.set(xo(o,c.x,l.x,u.x,f.x),xo(o,c.y,l.y,u.y,f.y)),n}copy(t){super.copy(t),this.points=[];for(let e=0,n=t.points.length;e<n;e++){const s=t.points[e];this.points.push(s.clone())}return this}toJSON(){const t=super.toJSON();t.points=[];for(let e=0,n=this.points.length;e<n;e++){const s=this.points[e];t.points.push(s.toArray())}return t}fromJSON(t){super.fromJSON(t),this.points=[];for(let e=0,n=t.points.length;e<n;e++){const s=t.points[e];this.points.push(new dt().fromArray(s))}return this}}var ua=Object.freeze({__proto__:null,ArcCurve:Mh,CatmullRomCurve3:yh,CubicBezierCurve:Nl,CubicBezierCurve3:Ph,EllipseCurve:wa,LineCurve:Ul,LineCurve3:Lh,QuadraticBezierCurve:Fl,QuadraticBezierCurve3:Dh,SplineCurve:Ol});class Ih extends fn{constructor(){super(),this.type="CurvePath",this.curves=[],this.autoClose=!1}add(t){this.curves.push(t)}closePath(){const t=this.curves[0].getPoint(0),e=this.curves[this.curves.length-1].getPoint(1);if(!t.equals(e)){const n=t.isVector2===!0?"LineCurve":"LineCurve3";this.curves.push(new ua[n](e,t))}return this}getPoint(t,e){const n=t*this.getLength(),s=this.getCurveLengths();let r=0;for(;r<s.length;){if(s[r]>=n){const a=s[r]-n,o=this.curves[r],c=o.getLength(),l=c===0?0:1-a/c;return o.getPointAt(l,e)}r++}return null}getLength(){const t=this.getCurveLengths();return t[t.length-1]}updateArcLengths(){this.needsUpdate=!0,this.cacheLengths=null,this.getCurveLengths()}getCurveLengths(){if(this.cacheLengths&&this.cacheLengths.length===this.curves.length)return this.cacheLengths;const t=[];let e=0;for(let n=0,s=this.curves.length;n<s;n++)e+=this.curves[n].getLength(),t.push(e);return this.cacheLengths=t,t}getSpacedPoints(t=40){const e=[];for(let n=0;n<=t;n++)e.push(this.getPoint(n/t));return this.autoClose&&e.push(e[0]),e}getPoints(t=12){const e=[];let n;for(let s=0,r=this.curves;s<r.length;s++){const a=r[s],o=a.isEllipseCurve?t*2:a.isLineCurve||a.isLineCurve3?1:a.isSplineCurve?t*a.points.length:t,c=a.getPoints(o);for(let l=0;l<c.length;l++){const u=c[l];n&&n.equals(u)||(e.push(u),n=u)}}return this.autoClose&&e.length>1&&!e[e.length-1].equals(e[0])&&e.push(e[0]),e}copy(t){super.copy(t),this.curves=[];for(let e=0,n=t.curves.length;e<n;e++){const s=t.curves[e];this.curves.push(s.clone())}return this.autoClose=t.autoClose,this}toJSON(){const t=super.toJSON();t.autoClose=this.autoClose,t.curves=[];for(let e=0,n=this.curves.length;e<n;e++){const s=this.curves[e];t.curves.push(s.toJSON())}return t}fromJSON(t){super.fromJSON(t),this.autoClose=t.autoClose,this.curves=[];for(let e=0,n=t.curves.length;e<n;e++){const s=t.curves[e];this.curves.push(new ua[s.type]().fromJSON(s))}return this}}class _i extends Ih{constructor(t){super(),this.type="Path",this.currentPoint=new dt,t&&this.setFromPoints(t)}setFromPoints(t){this.moveTo(t[0].x,t[0].y);for(let e=1,n=t.length;e<n;e++)this.lineTo(t[e].x,t[e].y);return this}moveTo(t,e){return this.currentPoint.set(t,e),this}lineTo(t,e){const n=new Ul(this.currentPoint.clone(),new dt(t,e));return this.curves.push(n),this.currentPoint.set(t,e),this}quadraticCurveTo(t,e,n,s){const r=new Fl(this.currentPoint.clone(),new dt(t,e),new dt(n,s));return this.curves.push(r),this.currentPoint.set(n,s),this}bezierCurveTo(t,e,n,s,r,a){const o=new Nl(this.currentPoint.clone(),new dt(t,e),new dt(n,s),new dt(r,a));return this.curves.push(o),this.currentPoint.set(r,a),this}splineThru(t){const e=[this.currentPoint.clone()].concat(t),n=new Ol(e);return this.curves.push(n),this.currentPoint.copy(t[t.length-1]),this}arc(t,e,n,s,r,a){const o=this.currentPoint.x,c=this.currentPoint.y;return this.absarc(t+o,e+c,n,s,r,a),this}absarc(t,e,n,s,r,a){return this.absellipse(t,e,n,n,s,r,a),this}ellipse(t,e,n,s,r,a,o,c){const l=this.currentPoint.x,u=this.currentPoint.y;return this.absellipse(t+l,e+u,n,s,r,a,o,c),this}absellipse(t,e,n,s,r,a,o,c){const l=new wa(t,e,n,s,r,a,o,c);if(this.curves.length>0){const f=l.getPoint(0);f.equals(this.currentPoint)||this.lineTo(f.x,f.y)}this.curves.push(l);const u=l.getPoint(1);return this.currentPoint.copy(u),this}copy(t){return super.copy(t),this.currentPoint.copy(t.currentPoint),this}toJSON(){const t=super.toJSON();return t.currentPoint=this.currentPoint.toArray(),t}fromJSON(t){return super.fromJSON(t),this.currentPoint.fromArray(t.currentPoint),this}}class Bl extends _i{constructor(t){super(t),this.uuid=Si(),this.type="Shape",this.holes=[]}getPointsHoles(t){const e=[];for(let n=0,s=this.holes.length;n<s;n++)e[n]=this.holes[n].getPoints(t);return e}extractPoints(t){return{shape:this.getPoints(t),holes:this.getPointsHoles(t)}}copy(t){super.copy(t),this.holes=[];for(let e=0,n=t.holes.length;e<n;e++){const s=t.holes[e];this.holes.push(s.clone())}return this}toJSON(){const t=super.toJSON();t.uuid=this.uuid,t.holes=[];for(let e=0,n=this.holes.length;e<n;e++){const s=this.holes[e];t.holes.push(s.toJSON())}return t}fromJSON(t){super.fromJSON(t),this.uuid=t.uuid,this.holes=[];for(let e=0,n=t.holes.length;e<n;e++){const s=t.holes[e];this.holes.push(new _i().fromJSON(s))}return this}}function Nh(i,t,e=2){const n=t&&t.length,s=n?t[0]*e:i.length;let r=zl(i,0,s,e,!0);const a=[];if(!r||r.next===r.prev)return a;let o,c,l;if(n&&(r=zh(i,t,r,e)),i.length>80*e){o=i[0],c=i[1];let u=o,f=c;for(let h=e;h<s;h+=e){const p=i[h],_=i[h+1];p<o&&(o=p),_<c&&(c=_),p>u&&(u=p),_>f&&(f=_)}l=Math.max(u-o,f-c),l=l!==0?32767/l:0}return Gi(r,a,e,o,c,l,0),a}function zl(i,t,e,n,s){let r;if(s===Jh(i,t,e,n)>0)for(let a=t;a<e;a+=n)r=vo(a/n|0,i[a],i[a+1],r);else for(let a=e-n;a>=t;a-=n)r=vo(a/n|0,i[a],i[a+1],r);return r&&xi(r,r.next)&&(ki(r),r=r.next),r}function Zn(i,t){if(!i)return i;t||(t=i);let e=i,n;do if(n=!1,!e.steiner&&(xi(e,e.next)||de(e.prev,e,e.next)===0)){if(ki(e),e=t=e.prev,e===e.next)break;n=!0}else e=e.next;while(n||e!==t);return t}function Gi(i,t,e,n,s,r,a){if(!i)return;!a&&r&&Wh(i,n,s,r);let o=i;for(;i.prev!==i.next;){const c=i.prev,l=i.next;if(r?Fh(i,n,s,r):Uh(i)){t.push(c.i,i.i,l.i),ki(i),i=l.next,o=l.next;continue}if(i=l,i===o){a?a===1?(i=Oh(Zn(i),t),Gi(i,t,e,n,s,r,2)):a===2&&Bh(i,t,e,n,s,r):Gi(Zn(i),t,e,n,s,r,1);break}}}function Uh(i){const t=i.prev,e=i,n=i.next;if(de(t,e,n)>=0)return!1;const s=t.x,r=e.x,a=n.x,o=t.y,c=e.y,l=n.y,u=Math.min(s,r,a),f=Math.min(o,c,l),h=Math.max(s,r,a),p=Math.max(o,c,l);let _=n.next;for(;_!==t;){if(_.x>=u&&_.x<=h&&_.y>=f&&_.y<=p&&Pi(s,o,r,c,a,l,_.x,_.y)&&de(_.prev,_,_.next)>=0)return!1;_=_.next}return!0}function Fh(i,t,e,n){const s=i.prev,r=i,a=i.next;if(de(s,r,a)>=0)return!1;const o=s.x,c=r.x,l=a.x,u=s.y,f=r.y,h=a.y,p=Math.min(o,c,l),_=Math.min(u,f,h),y=Math.max(o,c,l),m=Math.max(u,f,h),d=fa(p,_,t,e,n),P=fa(y,m,t,e,n);let D=i.prevZ,S=i.nextZ;for(;D&&D.z>=d&&S&&S.z<=P;){if(D.x>=p&&D.x<=y&&D.y>=_&&D.y<=m&&D!==s&&D!==a&&Pi(o,u,c,f,l,h,D.x,D.y)&&de(D.prev,D,D.next)>=0||(D=D.prevZ,S.x>=p&&S.x<=y&&S.y>=_&&S.y<=m&&S!==s&&S!==a&&Pi(o,u,c,f,l,h,S.x,S.y)&&de(S.prev,S,S.next)>=0))return!1;S=S.nextZ}for(;D&&D.z>=d;){if(D.x>=p&&D.x<=y&&D.y>=_&&D.y<=m&&D!==s&&D!==a&&Pi(o,u,c,f,l,h,D.x,D.y)&&de(D.prev,D,D.next)>=0)return!1;D=D.prevZ}for(;S&&S.z<=P;){if(S.x>=p&&S.x<=y&&S.y>=_&&S.y<=m&&S!==s&&S!==a&&Pi(o,u,c,f,l,h,S.x,S.y)&&de(S.prev,S,S.next)>=0)return!1;S=S.nextZ}return!0}function Oh(i,t){let e=i;do{const n=e.prev,s=e.next.next;!xi(n,s)&&Vl(n,e,e.next,s)&&Vi(n,s)&&Vi(s,n)&&(t.push(n.i,e.i,s.i),ki(e),ki(e.next),e=i=s),e=e.next}while(e!==i);return Zn(e)}function Bh(i,t,e,n,s,r){let a=i;do{let o=a.next.next;for(;o!==a.prev;){if(a.i!==o.i&&Yh(a,o)){let c=kl(a,o);a=Zn(a,a.next),c=Zn(c,c.next),Gi(a,t,e,n,s,r,0),Gi(c,t,e,n,s,r,0);return}o=o.next}a=a.next}while(a!==i)}function zh(i,t,e,n){const s=[];for(let r=0,a=t.length;r<a;r++){const o=t[r]*n,c=r<a-1?t[r+1]*n:i.length,l=zl(i,o,c,n,!1);l===l.next&&(l.steiner=!0),s.push(qh(l))}s.sort(Gh);for(let r=0;r<s.length;r++)e=Vh(s[r],e);return e}function Gh(i,t){let e=i.x-t.x;if(e===0&&(e=i.y-t.y,e===0)){const n=(i.next.y-i.y)/(i.next.x-i.x),s=(t.next.y-t.y)/(t.next.x-t.x);e=n-s}return e}function Vh(i,t){const e=kh(i,t);if(!e)return t;const n=kl(e,i);return Zn(n,n.next),Zn(e,e.next)}function kh(i,t){let e=t;const n=i.x,s=i.y;let r=-1/0,a;if(xi(i,e))return e;do{if(xi(i,e.next))return e.next;if(s<=e.y&&s>=e.next.y&&e.next.y!==e.y){const f=e.x+(s-e.y)*(e.next.x-e.x)/(e.next.y-e.y);if(f<=n&&f>r&&(r=f,a=e.x<e.next.x?e:e.next,f===n))return a}e=e.next}while(e!==t);if(!a)return null;const o=a,c=a.x,l=a.y;let u=1/0;e=a;do{if(n>=e.x&&e.x>=c&&n!==e.x&&Gl(s<l?n:r,s,c,l,s<l?r:n,s,e.x,e.y)){const f=Math.abs(s-e.y)/(n-e.x);Vi(e,i)&&(f<u||f===u&&(e.x>a.x||e.x===a.x&&Hh(a,e)))&&(a=e,u=f)}e=e.next}while(e!==o);return a}function Hh(i,t){return de(i.prev,i,t.prev)<0&&de(t.next,i,i.next)<0}function Wh(i,t,e,n){let s=i;do s.z===0&&(s.z=fa(s.x,s.y,t,e,n)),s.prevZ=s.prev,s.nextZ=s.next,s=s.next;while(s!==i);s.prevZ.nextZ=null,s.prevZ=null,Xh(s)}function Xh(i){let t,e=1;do{let n=i,s;i=null;let r=null;for(t=0;n;){t++;let a=n,o=0;for(let l=0;l<e&&(o++,a=a.nextZ,!!a);l++);let c=e;for(;o>0||c>0&&a;)o!==0&&(c===0||!a||n.z<=a.z)?(s=n,n=n.nextZ,o--):(s=a,a=a.nextZ,c--),r?r.nextZ=s:i=s,s.prevZ=r,r=s;n=a}r.nextZ=null,e*=2}while(t>1);return i}function fa(i,t,e,n,s){return i=(i-e)*s|0,t=(t-n)*s|0,i=(i|i<<8)&16711935,i=(i|i<<4)&252645135,i=(i|i<<2)&858993459,i=(i|i<<1)&1431655765,t=(t|t<<8)&16711935,t=(t|t<<4)&252645135,t=(t|t<<2)&858993459,t=(t|t<<1)&1431655765,i|t<<1}function qh(i){let t=i,e=i;do(t.x<e.x||t.x===e.x&&t.y<e.y)&&(e=t),t=t.next;while(t!==i);return e}function Gl(i,t,e,n,s,r,a,o){return(s-a)*(t-o)>=(i-a)*(r-o)&&(i-a)*(n-o)>=(e-a)*(t-o)&&(e-a)*(r-o)>=(s-a)*(n-o)}function Pi(i,t,e,n,s,r,a,o){return!(i===a&&t===o)&&Gl(i,t,e,n,s,r,a,o)}function Yh(i,t){return i.next.i!==t.i&&i.prev.i!==t.i&&!Zh(i,t)&&(Vi(i,t)&&Vi(t,i)&&Kh(i,t)&&(de(i.prev,i,t.prev)||de(i,t.prev,t))||xi(i,t)&&de(i.prev,i,i.next)>0&&de(t.prev,t,t.next)>0)}function de(i,t,e){return(t.y-i.y)*(e.x-t.x)-(t.x-i.x)*(e.y-t.y)}function xi(i,t){return i.x===t.x&&i.y===t.y}function Vl(i,t,e,n){const s=ms(de(i,t,e)),r=ms(de(i,t,n)),a=ms(de(e,n,i)),o=ms(de(e,n,t));return!!(s!==r&&a!==o||s===0&&ps(i,e,t)||r===0&&ps(i,n,t)||a===0&&ps(e,i,n)||o===0&&ps(e,t,n))}function ps(i,t,e){return t.x<=Math.max(i.x,e.x)&&t.x>=Math.min(i.x,e.x)&&t.y<=Math.max(i.y,e.y)&&t.y>=Math.min(i.y,e.y)}function ms(i){return i>0?1:i<0?-1:0}function Zh(i,t){let e=i;do{if(e.i!==i.i&&e.next.i!==i.i&&e.i!==t.i&&e.next.i!==t.i&&Vl(e,e.next,i,t))return!0;e=e.next}while(e!==i);return!1}function Vi(i,t){return de(i.prev,i,i.next)<0?de(i,t,i.next)>=0&&de(i,i.prev,t)>=0:de(i,t,i.prev)<0||de(i,i.next,t)<0}function Kh(i,t){let e=i,n=!1;const s=(i.x+t.x)/2,r=(i.y+t.y)/2;do e.y>r!=e.next.y>r&&e.next.y!==e.y&&s<(e.next.x-e.x)*(r-e.y)/(e.next.y-e.y)+e.x&&(n=!n),e=e.next;while(e!==i);return n}function kl(i,t){const e=da(i.i,i.x,i.y),n=da(t.i,t.x,t.y),s=i.next,r=t.prev;return i.next=t,t.prev=i,e.next=s,s.prev=e,n.next=e,e.prev=n,r.next=n,n.prev=r,n}function vo(i,t,e,n){const s=da(i,t,e);return n?(s.next=n.next,s.prev=n,n.next.prev=s,n.next=s):(s.prev=s,s.next=s),s}function ki(i){i.next.prev=i.prev,i.prev.next=i.next,i.prevZ&&(i.prevZ.nextZ=i.nextZ),i.nextZ&&(i.nextZ.prevZ=i.prevZ)}function da(i,t,e){return{i,x:t,y:e,prev:null,next:null,z:0,prevZ:null,nextZ:null,steiner:!1}}function Jh(i,t,e,n){let s=0;for(let r=t,a=e-n;r<e;r+=n)s+=(i[a]-i[r])*(i[r+1]+i[a+1]),a=r;return s}class $h{static triangulate(t,e,n=2){return Nh(t,e,n)}}class Dn{static area(t){const e=t.length;let n=0;for(let s=e-1,r=0;r<e;s=r++)n+=t[s].x*t[r].y-t[r].x*t[s].y;return n*.5}static isClockWise(t){return Dn.area(t)<0}static triangulateShape(t,e){const n=[],s=[],r=[];So(t),Mo(n,t);let a=t.length;e.forEach(So);for(let c=0;c<e.length;c++)s.push(a),a+=e[c].length,Mo(n,e[c]);const o=$h.triangulate(n,s);for(let c=0;c<o.length;c+=3)r.push(o.slice(c,c+3));return r}}function So(i){const t=i.length;t>2&&i[t-1].equals(i[0])&&i.pop()}function Mo(i,t){for(let e=0;e<t.length;e++)i.push(t[e].x),i.push(t[e].y)}class Ca extends ke{constructor(t=new Bl([new dt(.5,.5),new dt(-.5,.5),new dt(-.5,-.5),new dt(.5,-.5)]),e={}){super(),this.type="ExtrudeGeometry",this.parameters={shapes:t,options:e},t=Array.isArray(t)?t:[t];const n=this,s=[],r=[];for(let o=0,c=t.length;o<c;o++){const l=t[o];a(l)}this.setAttribute("position",new Ne(s,3)),this.setAttribute("uv",new Ne(r,2)),this.computeVertexNormals();function a(o){const c=[],l=e.curveSegments!==void 0?e.curveSegments:12,u=e.steps!==void 0?e.steps:1,f=e.depth!==void 0?e.depth:1;let h=e.bevelEnabled!==void 0?e.bevelEnabled:!0,p=e.bevelThickness!==void 0?e.bevelThickness:.2,_=e.bevelSize!==void 0?e.bevelSize:p-.1,y=e.bevelOffset!==void 0?e.bevelOffset:0,m=e.bevelSegments!==void 0?e.bevelSegments:3;const d=e.extrudePath,P=e.UVGenerator!==void 0?e.UVGenerator:Qh;let D,S=!1,w,A,F,v;if(d){D=d.getSpacedPoints(u),S=!0,h=!1;const E=d.isCatmullRomCurve3?d.closed:!1;w=d.computeFrenetFrames(u,E),A=new H,F=new H,v=new H}h||(m=0,p=0,_=0,y=0);const R=o.extractPoints(l);let B=R.shape;const X=R.holes;if(!Dn.isClockWise(B)){B=B.reverse();for(let E=0,O=X.length;E<O;E++){const I=X[E];Dn.isClockWise(I)&&(X[E]=I.reverse())}}function nt(E){const I=10000000000000001e-36;let Y=E[0];for(let $=1;$<=E.length;$++){const ot=$%E.length,mt=E[ot],pt=mt.x-Y.x,W=mt.y-Y.y,x=pt*pt+W*W,At=Math.max(Math.abs(mt.x),Math.abs(mt.y),Math.abs(Y.x),Math.abs(Y.y)),Nt=I*At*At;if(x<=Nt){E.splice(ot,1),$--;continue}Y=mt}}nt(B),X.forEach(nt);const G=X.length,J=B;for(let E=0;E<G;E++){const O=X[E];B=B.concat(O)}function lt(E,O,I){return O||ne("ExtrudeGeometry: vec does not exist"),E.clone().addScaledVector(O,I)}const K=B.length;function Z(E,O,I){let Y,$,ot;const mt=E.x-O.x,pt=E.y-O.y,W=I.x-E.x,x=I.y-E.y,At=mt*mt+pt*pt,Nt=mt*x-pt*W;if(Math.abs(Nt)>Number.EPSILON){const b=Math.sqrt(At),g=Math.sqrt(W*W+x*x),k=O.x-pt/b,Q=O.y+mt/b,at=I.x-x/g,xt=I.y+W/g,vt=((at-k)*x-(xt-Q)*W)/(mt*x-pt*W);Y=k+mt*vt-E.x,$=Q+pt*vt-E.y;const ct=Y*Y+$*$;if(ct<=2)return new dt(Y,$);ot=Math.sqrt(ct/2)}else{let b=!1;mt>Number.EPSILON?W>Number.EPSILON&&(b=!0):mt<-Number.EPSILON?W<-Number.EPSILON&&(b=!0):Math.sign(pt)===Math.sign(x)&&(b=!0),b?(Y=-pt,$=mt,ot=Math.sqrt(At)):(Y=mt,$=pt,ot=Math.sqrt(At/2))}return new dt(Y/ot,$/ot)}const it=[];for(let E=0,O=J.length,I=O-1,Y=E+1;E<O;E++,I++,Y++)I===O&&(I=0),Y===O&&(Y=0),it[E]=Z(J[E],J[I],J[Y]);const rt=[];let ht,Dt=it.concat();for(let E=0,O=G;E<O;E++){const I=X[E];ht=[];for(let Y=0,$=I.length,ot=$-1,mt=Y+1;Y<$;Y++,ot++,mt++)ot===$&&(ot=0),mt===$&&(mt=0),ht[Y]=Z(I[Y],I[ot],I[mt]);rt.push(ht),Dt=Dt.concat(ht)}let Ct;if(m===0)Ct=Dn.triangulateShape(J,X);else{const E=[],O=[];for(let I=0;I<m;I++){const Y=I/m,$=p*Math.cos(Y*Math.PI/2),ot=_*Math.sin(Y*Math.PI/2)+y;for(let mt=0,pt=J.length;mt<pt;mt++){const W=lt(J[mt],it[mt],ot);C(W.x,W.y,-$),Y===0&&E.push(W)}for(let mt=0,pt=G;mt<pt;mt++){const W=X[mt];ht=rt[mt];const x=[];for(let At=0,Nt=W.length;At<Nt;At++){const b=lt(W[At],ht[At],ot);C(b.x,b.y,-$),Y===0&&x.push(b)}Y===0&&O.push(x)}}Ct=Dn.triangulateShape(E,O)}const qt=Ct.length,Xt=_+y;for(let E=0;E<K;E++){const O=h?lt(B[E],Dt[E],Xt):B[E];S?(F.copy(w.normals[0]).multiplyScalar(O.x),A.copy(w.binormals[0]).multiplyScalar(O.y),v.copy(D[0]).add(F).add(A),C(v.x,v.y,v.z)):C(O.x,O.y,0)}for(let E=1;E<=u;E++)for(let O=0;O<K;O++){const I=h?lt(B[O],Dt[O],Xt):B[O];S?(F.copy(w.normals[E]).multiplyScalar(I.x),A.copy(w.binormals[E]).multiplyScalar(I.y),v.copy(D[E]).add(F).add(A),C(v.x,v.y,v.z)):C(I.x,I.y,f/u*E)}for(let E=m-1;E>=0;E--){const O=E/m,I=p*Math.cos(O*Math.PI/2),Y=_*Math.sin(O*Math.PI/2)+y;for(let $=0,ot=J.length;$<ot;$++){const mt=lt(J[$],it[$],Y);C(mt.x,mt.y,f+I)}for(let $=0,ot=X.length;$<ot;$++){const mt=X[$];ht=rt[$];for(let pt=0,W=mt.length;pt<W;pt++){const x=lt(mt[pt],ht[pt],Y);S?C(x.x,x.y+D[u-1].y,D[u-1].x+I):C(x.x,x.y,f+I)}}}Zt(),N();function Zt(){const E=s.length/3;if(h){let O=0,I=K*O;for(let Y=0;Y<qt;Y++){const $=Ct[Y];T($[2]+I,$[1]+I,$[0]+I)}O=u+m*2,I=K*O;for(let Y=0;Y<qt;Y++){const $=Ct[Y];T($[0]+I,$[1]+I,$[2]+I)}}else{for(let O=0;O<qt;O++){const I=Ct[O];T(I[2],I[1],I[0])}for(let O=0;O<qt;O++){const I=Ct[O];T(I[0]+K*u,I[1]+K*u,I[2]+K*u)}}n.addGroup(E,s.length/3-E,0)}function N(){const E=s.length/3;let O=0;L(J,O),O+=J.length;for(let I=0,Y=X.length;I<Y;I++){const $=X[I];L($,O),O+=$.length}n.addGroup(E,s.length/3-E,1)}function L(E,O){let I=E.length;for(;--I>=0;){const Y=I;let $=I-1;$<0&&($=E.length-1);for(let ot=0,mt=u+m*2;ot<mt;ot++){const pt=K*ot,W=K*(ot+1),x=O+Y+pt,At=O+$+pt,Nt=O+$+W,b=O+Y+W;U(x,At,Nt,b)}}}function C(E,O,I){c.push(E),c.push(O),c.push(I)}function T(E,O,I){et(E),et(O),et(I);const Y=s.length/3,$=P.generateTopUV(n,s,Y-3,Y-2,Y-1);_t($[0]),_t($[1]),_t($[2])}function U(E,O,I,Y){et(E),et(O),et(Y),et(O),et(I),et(Y);const $=s.length/3,ot=P.generateSideWallUV(n,s,$-6,$-3,$-2,$-1);_t(ot[0]),_t(ot[1]),_t(ot[3]),_t(ot[1]),_t(ot[2]),_t(ot[3])}function et(E){s.push(c[E*3+0]),s.push(c[E*3+1]),s.push(c[E*3+2])}function _t(E){r.push(E.x),r.push(E.y)}}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}toJSON(){const t=super.toJSON(),e=this.parameters.shapes,n=this.parameters.options;return jh(e,n,t)}static fromJSON(t,e){const n=[];for(let r=0,a=t.shapes.length;r<a;r++){const o=e[t.shapes[r]];n.push(o)}const s=t.options.extrudePath;return s!==void 0&&(t.options.extrudePath=new ua[s.type]().fromJSON(s)),new Ca(n,t.options)}}const Qh={generateTopUV:function(i,t,e,n,s){const r=t[e*3],a=t[e*3+1],o=t[n*3],c=t[n*3+1],l=t[s*3],u=t[s*3+1];return[new dt(r,a),new dt(o,c),new dt(l,u)]},generateSideWallUV:function(i,t,e,n,s,r){const a=t[e*3],o=t[e*3+1],c=t[e*3+2],l=t[n*3],u=t[n*3+1],f=t[n*3+2],h=t[s*3],p=t[s*3+1],_=t[s*3+2],y=t[r*3],m=t[r*3+1],d=t[r*3+2];return Math.abs(o-u)<Math.abs(a-l)?[new dt(a,1-c),new dt(l,1-f),new dt(h,1-_),new dt(y,1-d)]:[new dt(o,1-c),new dt(u,1-f),new dt(p,1-_),new dt(m,1-d)]}};function jh(i,t,e){if(e.shapes=[],Array.isArray(i))for(let n=0,s=i.length;n<s;n++){const r=i[n];e.shapes.push(r.uuid)}else e.shapes.push(i.uuid);return e.options=Object.assign({},t),t.extrudePath!==void 0&&(e.options.extrudePath=t.extrudePath.toJSON()),e}class zs extends ke{constructor(t=1,e=1,n=1,s=1){super(),this.type="PlaneGeometry",this.parameters={width:t,height:e,widthSegments:n,heightSegments:s};const r=t/2,a=e/2,o=Math.floor(n),c=Math.floor(s),l=o+1,u=c+1,f=t/o,h=e/c,p=[],_=[],y=[],m=[];for(let d=0;d<u;d++){const P=d*h-a;for(let D=0;D<l;D++){const S=D*f-r;_.push(S,-P,0),y.push(0,0,1),m.push(D/o),m.push(1-d/c)}}for(let d=0;d<c;d++)for(let P=0;P<o;P++){const D=P+l*d,S=P+l*(d+1),w=P+1+l*(d+1),A=P+1+l*d;p.push(D,S,A),p.push(S,w,A)}this.setIndex(p),this.setAttribute("position",new Ne(_,3)),this.setAttribute("normal",new Ne(y,3)),this.setAttribute("uv",new Ne(m,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new zs(t.width,t.height,t.widthSegments,t.heightSegments)}}function vi(i){const t={};for(const e in i){t[e]={};for(const n in i[e]){const s=i[e][n];if(yo(s))s.isRenderTargetTexture?(Wt("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),t[e][n]=null):t[e][n]=s.clone();else if(Array.isArray(s))if(yo(s[0])){const r=[];for(let a=0,o=s.length;a<o;a++)r[a]=s[a].clone();t[e][n]=r}else t[e][n]=s.slice();else t[e][n]=s}}return t}function Pe(i){const t={};for(let e=0;e<i.length;e++){const n=vi(i[e]);for(const s in n)t[s]=n[s]}return t}function yo(i){return i&&(i.isColor||i.isMatrix3||i.isMatrix4||i.isVector2||i.isVector3||i.isVector4||i.isTexture||i.isQuaternion)}function tu(i){const t=[];for(let e=0;e<i.length;e++)t.push(i[e].clone());return t}function Hl(i){const t=i.getRenderTarget();return t===null?i.outputColorSpace:t.isXRRenderTarget===!0?t.texture.colorSpace:te.workingColorSpace}const eu={clone:vi,merge:Pe};var nu=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,iu=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`;class un extends Xi{constructor(t){super(),this.isShaderMaterial=!0,this.type="ShaderMaterial",this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=nu,this.fragmentShader=iu,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,t!==void 0&&this.setValues(t)}copy(t){return super.copy(t),this.fragmentShader=t.fragmentShader,this.vertexShader=t.vertexShader,this.uniforms=vi(t.uniforms),this.uniformsGroups=tu(t.uniformsGroups),this.defines=Object.assign({},t.defines),this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.fog=t.fog,this.lights=t.lights,this.clipping=t.clipping,this.extensions=Object.assign({},t.extensions),this.glslVersion=t.glslVersion,this.defaultAttributeValues=Object.assign({},t.defaultAttributeValues),this.index0AttributeName=t.index0AttributeName,this.uniformsNeedUpdate=t.uniformsNeedUpdate,this}toJSON(t){const e=super.toJSON(t);e.glslVersion=this.glslVersion,e.uniforms={};for(const s in this.uniforms){const a=this.uniforms[s].value;a&&a.isTexture?e.uniforms[s]={type:"t",value:a.toJSON(t).uuid}:a&&a.isColor?e.uniforms[s]={type:"c",value:a.getHex()}:a&&a.isVector2?e.uniforms[s]={type:"v2",value:a.toArray()}:a&&a.isVector3?e.uniforms[s]={type:"v3",value:a.toArray()}:a&&a.isVector4?e.uniforms[s]={type:"v4",value:a.toArray()}:a&&a.isMatrix3?e.uniforms[s]={type:"m3",value:a.toArray()}:a&&a.isMatrix4?e.uniforms[s]={type:"m4",value:a.toArray()}:e.uniforms[s]={value:a}}Object.keys(this.defines).length>0&&(e.defines=this.defines),e.vertexShader=this.vertexShader,e.fragmentShader=this.fragmentShader,e.lights=this.lights,e.clipping=this.clipping;const n={};for(const s in this.extensions)this.extensions[s]===!0&&(n[s]=!0);return Object.keys(n).length>0&&(e.extensions=n),e}fromJSON(t,e){if(super.fromJSON(t,e),t.uniforms!==void 0)for(const n in t.uniforms){const s=t.uniforms[n];switch(this.uniforms[n]={},s.type){case"t":this.uniforms[n].value=e[s.value]||null;break;case"c":this.uniforms[n].value=new jt().setHex(s.value);break;case"v2":this.uniforms[n].value=new dt().fromArray(s.value);break;case"v3":this.uniforms[n].value=new H().fromArray(s.value);break;case"v4":this.uniforms[n].value=new fe().fromArray(s.value);break;case"m3":this.uniforms[n].value=new kt().fromArray(s.value);break;case"m4":this.uniforms[n].value=new pe().fromArray(s.value);break;default:this.uniforms[n].value=s.value}}if(t.defines!==void 0&&(this.defines=t.defines),t.vertexShader!==void 0&&(this.vertexShader=t.vertexShader),t.fragmentShader!==void 0&&(this.fragmentShader=t.fragmentShader),t.glslVersion!==void 0&&(this.glslVersion=t.glslVersion),t.extensions!==void 0)for(const n in t.extensions)this.extensions[n]=t.extensions[n];return t.lights!==void 0&&(this.lights=t.lights),t.clipping!==void 0&&(this.clipping=t.clipping),this}}class su extends un{constructor(t){super(t),this.isRawShaderMaterial=!0,this.type="RawShaderMaterial"}}class ru extends Xi{constructor(t){super(),this.isMeshStandardMaterial=!0,this.type="MeshStandardMaterial",this.defines={STANDARD:""},this.color=new jt(16777215),this.roughness=1,this.metalness=0,this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new jt(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=ca,this.normalScale=new dt(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.roughnessMap=null,this.metalnessMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Nn,this.envMapIntensity=1,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.defines={STANDARD:""},this.color.copy(t.color),this.roughness=t.roughness,this.metalness=t.metalness,this.map=t.map,this.lightMap=t.lightMap,this.lightMapIntensity=t.lightMapIntensity,this.aoMap=t.aoMap,this.aoMapIntensity=t.aoMapIntensity,this.emissive.copy(t.emissive),this.emissiveMap=t.emissiveMap,this.emissiveIntensity=t.emissiveIntensity,this.bumpMap=t.bumpMap,this.bumpScale=t.bumpScale,this.normalMap=t.normalMap,this.normalMapType=t.normalMapType,this.normalScale.copy(t.normalScale),this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this.roughnessMap=t.roughnessMap,this.metalnessMap=t.metalnessMap,this.alphaMap=t.alphaMap,this.envMap=t.envMap,this.envMapRotation.copy(t.envMapRotation),this.envMapIntensity=t.envMapIntensity,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.wireframeLinecap=t.wireframeLinecap,this.wireframeLinejoin=t.wireframeLinejoin,this.flatShading=t.flatShading,this.fog=t.fog,this}}class au extends Xi{constructor(t){super(),this.isMeshDepthMaterial=!0,this.type="MeshDepthMaterial",this.depthPacking=Nc,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(t)}copy(t){return super.copy(t),this.depthPacking=t.depthPacking,this.map=t.map,this.alphaMap=t.alphaMap,this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this}}class ou extends Xi{constructor(t){super(),this.isMeshDistanceMaterial=!0,this.type="MeshDistanceMaterial",this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(t)}copy(t){return super.copy(t),this.map=t.map,this.alphaMap=t.alphaMap,this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this}}const Eo={enabled:!1,files:{},add:function(i,t){this.enabled!==!1&&(bo(i)||(this.files[i]=t))},get:function(i){if(this.enabled!==!1&&!bo(i))return this.files[i]},remove:function(i){delete this.files[i]},clear:function(){this.files={}}};function bo(i){try{const t=i.slice(i.indexOf(":")+1);return new URL(t).protocol==="blob:"}catch{return!1}}class lu{constructor(t,e,n){const s=this;let r=!1,a=0,o=0,c;const l=[];this.onStart=void 0,this.onLoad=t,this.onProgress=e,this.onError=n,this._abortController=null,this.itemStart=function(u){o++,r===!1&&s.onStart!==void 0&&s.onStart(u,a,o),r=!0},this.itemEnd=function(u){a++,s.onProgress!==void 0&&s.onProgress(u,a,o),a===o&&(r=!1,s.onLoad!==void 0&&s.onLoad())},this.itemError=function(u){s.onError!==void 0&&s.onError(u)},this.resolveURL=function(u){return u=u.normalize("NFC"),c?c(u):u},this.setURLModifier=function(u){return c=u,this},this.addHandler=function(u,f){return l.push(u,f),this},this.removeHandler=function(u){const f=l.indexOf(u);return f!==-1&&l.splice(f,2),this},this.getHandler=function(u){for(let f=0,h=l.length;f<h;f+=2){const p=l[f],_=l[f+1];if(p.global&&(p.lastIndex=0),p.test(u))return _}return null},this.abort=function(){return this.abortController.abort(),this._abortController=null,this}}get abortController(){return this._abortController||(this._abortController=new AbortController),this._abortController}}const cu=new lu;class Pa{constructor(t){this.manager=t!==void 0?t:cu,this.crossOrigin="anonymous",this.withCredentials=!1,this.path="",this.resourcePath="",this.requestHeader={},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}load(){}loadAsync(t,e){const n=this;return new Promise(function(s,r){n.load(t,s,e,r)})}parse(){}setCrossOrigin(t){return this.crossOrigin=t,this}setWithCredentials(t){return this.withCredentials=t,this}setPath(t){return this.path=t,this}setResourcePath(t){return this.resourcePath=t,this}setRequestHeader(t){return this.requestHeader=t,this}abort(){return this}}Pa.DEFAULT_MATERIAL_NAME="__DEFAULT";const xn={};class hu extends Error{constructor(t,e){super(t),this.response=e}}class uu extends Pa{constructor(t){super(t),this.mimeType="",this.responseType="",this._abortController=new AbortController}load(t,e,n,s){t===void 0&&(t=""),this.path!==void 0&&(t=this.path+t),t=this.manager.resolveURL(t);const r=Eo.get(`file:${t}`);if(r!==void 0){this.manager.itemStart(t),setTimeout(()=>{e&&e(r),this.manager.itemEnd(t)},0);return}if(xn[t]!==void 0){xn[t].push({onLoad:e,onProgress:n,onError:s});return}xn[t]=[],xn[t].push({onLoad:e,onProgress:n,onError:s});const a=new Request(t,{headers:new Headers(this.requestHeader),credentials:this.withCredentials?"include":"same-origin",signal:typeof AbortSignal.any=="function"?AbortSignal.any([this._abortController.signal,this.manager.abortController.signal]):this._abortController.signal}),o=this.mimeType,c=this.responseType;fetch(a).then(l=>{if(l.status===200||l.status===0){if(l.status===0&&Wt("FileLoader: HTTP Status 0 received."),typeof ReadableStream>"u"||l.body===void 0||l.body.getReader===void 0)return l;const u=xn[t],f=l.body.getReader(),h=l.headers.get("X-File-Size")||l.headers.get("Content-Length"),p=h?parseInt(h):0,_=p!==0;let y=0;const m=new ReadableStream({start(d){P();function P(){f.read().then(({done:D,value:S})=>{if(D)d.close();else{y+=S.byteLength;const w=new ProgressEvent("progress",{lengthComputable:_,loaded:y,total:p});for(let A=0,F=u.length;A<F;A++){const v=u[A];v.onProgress&&v.onProgress(w)}d.enqueue(S),P()}},D=>{d.error(D)})}}});return new Response(m)}else throw new hu(`fetch for "${l.url}" responded with ${l.status}: ${l.statusText}`,l)}).then(l=>{switch(c){case"arraybuffer":return l.arrayBuffer();case"blob":return l.blob();case"document":return l.text().then(u=>new DOMParser().parseFromString(u,o));case"json":return l.json();default:if(o==="")return l.text();{const f=/charset="?([^;"\s]*)"?/i.exec(o),h=f&&f[1]?f[1].toLowerCase():void 0,p=new TextDecoder(h);return l.arrayBuffer().then(_=>p.decode(_))}}}).then(l=>{Eo.add(`file:${t}`,l);const u=xn[t];delete xn[t];for(let f=0,h=u.length;f<h;f++){const p=u[f];p.onLoad&&p.onLoad(l)}}).catch(l=>{const u=xn[t];if(u===void 0)throw this.manager.itemError(t),l;delete xn[t];for(let f=0,h=u.length;f<h;f++){const p=u[f];p.onError&&p.onError(l)}this.manager.itemError(t)}).finally(()=>{this.manager.itemEnd(t)}),this.manager.itemStart(t)}setResponseType(t){return this.responseType=t,this}setMimeType(t){return this.mimeType=t,this}abort(){return this._abortController.abort(),this._abortController=new AbortController,this}}class Wl extends Re{constructor(t,e=1){super(),this.isLight=!0,this.type="Light",this.color=new jt(t),this.intensity=e}copy(t,e){return super.copy(t,e),this.color.copy(t.color),this.intensity=t.intensity,this}toJSON(t){const e=super.toJSON(t);return e.object.color=this.color.getHex(),e.object.intensity=this.intensity,e}}const xr=new pe,To=new H,Ao=new H;class fu{constructor(t){this.camera=t,this.intensity=1,this.bias=0,this.biasNode=null,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new dt(512,512),this.mapType=Be,this.map=null,this.mapPass=null,this.matrix=new pe,this.autoUpdate=!0,this.needsUpdate=!1,this._frustum=new Aa,this._frameExtents=new dt(1,1),this._viewportCount=1,this._viewports=[new fe(0,0,1,1)]}getViewportCount(){return this._viewportCount}getCamera(){return this.camera}getFrustum(){return this._frustum}updateMatrices(t){const e=this.camera;To.setFromMatrixPosition(t.matrixWorld),e.position.copy(To),Ao.setFromMatrixPosition(t.target.matrixWorld),e.lookAt(Ao),e.updateMatrixWorld(),this._updateMatrix(e,this.matrix,this._frustum)}_updateMatrix(t,e,n,s){xr.multiplyMatrices(t.projectionMatrix,t.matrixWorldInverse),n.setFromProjectionMatrix(xr,t.coordinateSystem,t.reversedDepth);const r=this._frameExtents,a=s?s.z/r.x:1,o=s?s.w/r.y:1,c=s?s.x/r.x:0,l=s?s.y/r.y:0;t.coordinateSystem===Bi||t.reversedDepth?e.set(.5*a,0,0,.5*a+c,0,.5*o,0,.5*o+l,0,0,1,0,0,0,0,1):e.set(.5*a,0,0,.5*a+c,0,.5*o,0,.5*o+l,0,0,.5,.5,0,0,0,1),e.multiply(xr)}getViewport(t){return this._viewports[t]}getFrameExtents(){return this._frameExtents}dispose(){this.map&&this.map.dispose(),this.mapPass&&this.mapPass.dispose()}copy(t){return this.camera=t.camera.clone(),this.intensity=t.intensity,this.bias=t.bias,this.radius=t.radius,this.autoUpdate=t.autoUpdate,this.needsUpdate=t.needsUpdate,this.normalBias=t.normalBias,this.blurSamples=t.blurSamples,this.mapSize.copy(t.mapSize),this.biasNode=t.biasNode,this}clone(){return new this.constructor().copy(this)}toJSON(){const t={};return t.intensity=this.intensity,t.bias=this.bias,t.normalBias=this.normalBias,t.radius=this.radius,t.blurSamples=this.blurSamples,t.mapSize=this.mapSize.toArray(),t.camera=this.camera.toJSON(!1).object,delete t.camera.matrix,t}}const gs=new H,_s=new In,je=new H;class Xl extends Re{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new pe,this.projectionMatrix=new pe,this.projectionMatrixInverse=new pe,this.coordinateSystem=rn,this._reversedDepth=!1}get reversedDepth(){return this._reversedDepth}copy(t,e){return super.copy(t,e),this.matrixWorldInverse.copy(t.matrixWorldInverse),this.projectionMatrix.copy(t.projectionMatrix),this.projectionMatrixInverse.copy(t.projectionMatrixInverse),this.coordinateSystem=t.coordinateSystem,this}getWorldDirection(t){return super.getWorldDirection(t).negate()}updateMatrixWorld(t){super.updateMatrixWorld(t),this.matrixWorld.decompose(gs,_s,je),je.x===1&&je.y===1&&je.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(gs,_s,je.set(1,1,1)).invert()}updateWorldMatrix(t,e,n=!1){super.updateWorldMatrix(t,e,n),this.matrixWorld.decompose(gs,_s,je),je.x===1&&je.y===1&&je.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(gs,_s,je.set(1,1,1)).invert()}clone(){return new this.constructor().copy(this)}}const Pn=new H,wo=new dt,Ro=new dt;class Ve extends Xl{constructor(t=50,e=1,n=.1,s=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=t,this.zoom=1,this.near=n,this.far=s,this.focus=10,this.aspect=e,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(t,e){return super.copy(t,e),this.fov=t.fov,this.zoom=t.zoom,this.near=t.near,this.far=t.far,this.focus=t.focus,this.aspect=t.aspect,this.view=t.view===null?null:Object.assign({},t.view),this.filmGauge=t.filmGauge,this.filmOffset=t.filmOffset,this}setFocalLength(t){const e=.5*this.getFilmHeight()/t;this.fov=ha*2*Math.atan(e),this.updateProjectionMatrix()}getFocalLength(){const t=Math.tan(As*.5*this.fov);return .5*this.getFilmHeight()/t}getEffectiveFOV(){return ha*2*Math.atan(Math.tan(As*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(t,e,n){Pn.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),e.set(Pn.x,Pn.y).multiplyScalar(-t/Pn.z),Pn.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),n.set(Pn.x,Pn.y).multiplyScalar(-t/Pn.z)}getViewSize(t,e){return this.getViewBounds(t,wo,Ro),e.subVectors(Ro,wo)}setViewOffset(t,e,n,s,r,a){this.aspect=t/e,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=t,this.view.fullHeight=e,this.view.offsetX=n,this.view.offsetY=s,this.view.width=r,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const t=this.near;let e=t*Math.tan(As*.5*this.fov)/this.zoom,n=2*e,s=this.aspect*n,r=-.5*s;const a=this.view;if(this.view!==null&&this.view.enabled){const c=a.fullWidth,l=a.fullHeight;r+=a.offsetX*s/c,e-=a.offsetY*n/l,s*=a.width/c,n*=a.height/l}const o=this.filmOffset;o!==0&&(r+=t*o/this.getFilmWidth()),this.projectionMatrix.makePerspective(r,r+s,e,e-n,t,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(t){const e=super.toJSON(t);return e.object.fov=this.fov,e.object.zoom=this.zoom,e.object.near=this.near,e.object.far=this.far,e.object.focus=this.focus,e.object.aspect=this.aspect,this.view!==null&&(e.object.view=Object.assign({},this.view)),e.object.filmGauge=this.filmGauge,e.object.filmOffset=this.filmOffset,e}}class La extends Xl{constructor(t=-1,e=1,n=1,s=-1,r=.1,a=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=t,this.right=e,this.top=n,this.bottom=s,this.near=r,this.far=a,this.updateProjectionMatrix()}copy(t,e){return super.copy(t,e),this.left=t.left,this.right=t.right,this.top=t.top,this.bottom=t.bottom,this.near=t.near,this.far=t.far,this.zoom=t.zoom,this.view=t.view===null?null:Object.assign({},t.view),this}setViewOffset(t,e,n,s,r,a){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=t,this.view.fullHeight=e,this.view.offsetX=n,this.view.offsetY=s,this.view.width=r,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const t=(this.right-this.left)/(2*this.zoom),e=(this.top-this.bottom)/(2*this.zoom),n=(this.right+this.left)/2,s=(this.top+this.bottom)/2;let r=n-t,a=n+t,o=s+e,c=s-e;if(this.view!==null&&this.view.enabled){const l=(this.right-this.left)/this.view.fullWidth/this.zoom,u=(this.top-this.bottom)/this.view.fullHeight/this.zoom;r+=l*this.view.offsetX,a=r+l*this.view.width,o-=u*this.view.offsetY,c=o-u*this.view.height}this.projectionMatrix.makeOrthographic(r,a,o,c,this.near,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(t){const e=super.toJSON(t);return e.object.zoom=this.zoom,e.object.left=this.left,e.object.right=this.right,e.object.top=this.top,e.object.bottom=this.bottom,e.object.near=this.near,e.object.far=this.far,this.view!==null&&(e.object.view=Object.assign({},this.view)),e}}class du extends fu{constructor(){super(new La(-5,5,5,-5,.5,500)),this.isDirectionalLightShadow=!0}}class Co extends Wl{constructor(t,e){super(t,e),this.isDirectionalLight=!0,this.type="DirectionalLight",this.position.copy(Re.DEFAULT_UP),this.updateMatrix(),this.target=new Re,this.shadow=new du}dispose(){super.dispose(),this.shadow.dispose()}copy(t){return super.copy(t),this.target=t.target.clone(),this.shadow=t.shadow.clone(),this}toJSON(t){const e=super.toJSON(t);return e.object.shadow=this.shadow.toJSON(),e.object.target=this.target.uuid,e}}class pu extends Wl{constructor(t,e){super(t,e),this.isAmbientLight=!0,this.type="AmbientLight"}}const oi=-90,li=1;class mu extends Re{constructor(t,e,n){super(),this.type="CubeCamera",this.renderTarget=n,this.coordinateSystem=null,this.activeMipmapLevel=0;const s=new Ve(oi,li,t,e);s.layers=this.layers,this.add(s);const r=new Ve(oi,li,t,e);r.layers=this.layers,this.add(r);const a=new Ve(oi,li,t,e);a.layers=this.layers,this.add(a);const o=new Ve(oi,li,t,e);o.layers=this.layers,this.add(o);const c=new Ve(oi,li,t,e);c.layers=this.layers,this.add(c);const l=new Ve(oi,li,t,e);l.layers=this.layers,this.add(l)}updateCoordinateSystem(){const t=this.coordinateSystem,e=this.children.concat(),[n,s,r,a,o,c]=e;for(const l of e)this.remove(l);if(t===rn)n.up.set(0,1,0),n.lookAt(1,0,0),s.up.set(0,1,0),s.lookAt(-1,0,0),r.up.set(0,0,-1),r.lookAt(0,1,0),a.up.set(0,0,1),a.lookAt(0,-1,0),o.up.set(0,1,0),o.lookAt(0,0,1),c.up.set(0,1,0),c.lookAt(0,0,-1);else if(t===Bi)n.up.set(0,-1,0),n.lookAt(-1,0,0),s.up.set(0,-1,0),s.lookAt(1,0,0),r.up.set(0,0,1),r.lookAt(0,1,0),a.up.set(0,0,-1),a.lookAt(0,-1,0),o.up.set(0,-1,0),o.lookAt(0,0,1),c.up.set(0,-1,0),c.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+t);for(const l of e)this.add(l),l.updateMatrixWorld()}update(t,e){this.parent===null&&this.updateMatrixWorld();const{renderTarget:n,activeMipmapLevel:s}=this;this.coordinateSystem!==t.coordinateSystem&&(this.coordinateSystem=t.coordinateSystem,this.updateCoordinateSystem());const[r,a,o,c,l,u]=this.children,f=t.getRenderTarget(),h=t.getActiveCubeFace(),p=t.getActiveMipmapLevel(),_=t.xr.enabled;t.xr.enabled=!1;const y=n.texture.generateMipmaps;n.texture.generateMipmaps=!1;let m=!1;t.isWebGLRenderer===!0?m=t.state.buffers.depth.getReversed():m=t.reversedDepthBuffer,t.setRenderTarget(n,0,s),m&&t.autoClear===!1&&t.clearDepth(),t.render(e,r),t.setRenderTarget(n,1,s),m&&t.autoClear===!1&&t.clearDepth(),t.render(e,a),t.setRenderTarget(n,2,s),m&&t.autoClear===!1&&t.clearDepth(),t.render(e,o),t.setRenderTarget(n,3,s),m&&t.autoClear===!1&&t.clearDepth(),t.render(e,c),t.setRenderTarget(n,4,s),m&&t.autoClear===!1&&t.clearDepth(),t.render(e,l),n.texture.generateMipmaps=y,t.setRenderTarget(n,5,s),m&&t.autoClear===!1&&t.clearDepth(),t.render(e,u),t.setRenderTarget(f,h,p),t.xr.enabled=_,n.texture.needsPMREMUpdate=!0}}class gu extends Ve{constructor(t=[]){super(),this.isArrayCamera=!0,this.isMultiViewCamera=!1,this.cameras=t}}class Po{constructor(t=1,e=0,n=0){this.radius=t,this.phi=e,this.theta=n}set(t,e,n){return this.radius=t,this.phi=e,this.theta=n,this}copy(t){return this.radius=t.radius,this.phi=t.phi,this.theta=t.theta,this}makeSafe(){return this.phi=$t(this.phi,1e-6,Math.PI-1e-6),this}setFromVector3(t){return this.setFromCartesianCoords(t.x,t.y,t.z)}setFromCartesianCoords(t,e,n){return this.radius=Math.sqrt(t*t+e*e+n*n),this.radius===0?(this.theta=0,this.phi=0):(this.theta=Math.atan2(t,n),this.phi=Math.acos($t(e/this.radius,-1,1))),this}clone(){return new this.constructor().copy(this)}}const Oa=class Oa{constructor(t,e,n,s){this.elements=[1,0,0,1],t!==void 0&&this.set(t,e,n,s)}identity(){return this.set(1,0,0,1),this}fromArray(t,e=0){for(let n=0;n<4;n++)this.elements[n]=t[n+e];return this}set(t,e,n,s){const r=this.elements;return r[0]=t,r[2]=e,r[1]=n,r[3]=s,this}};Oa.prototype.isMatrix2=!0;let Lo=Oa;const Do=new dt;class ql{constructor(t=new dt(1/0,1/0),e=new dt(-1/0,-1/0)){this.isBox2=!0,this.min=t,this.max=e}set(t,e){return this.min.copy(t),this.max.copy(e),this}setFromPoints(t){this.makeEmpty();for(let e=0,n=t.length;e<n;e++)this.expandByPoint(t[e]);return this}setFromCenterAndSize(t,e){const n=Do.copy(e).multiplyScalar(.5);return this.min.copy(t).sub(n),this.max.copy(t).add(n),this}clone(){return new this.constructor().copy(this)}copy(t){return this.min.copy(t.min),this.max.copy(t.max),this}makeEmpty(){return this.min.x=this.min.y=1/0,this.max.x=this.max.y=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y}getCenter(t){return this.isEmpty()?t.set(0,0):t.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(t){return this.isEmpty()?t.set(0,0):t.subVectors(this.max,this.min)}expandByPoint(t){return this.min.min(t),this.max.max(t),this}expandByVector(t){return this.min.sub(t),this.max.add(t),this}expandByScalar(t){return this.min.addScalar(-t),this.max.addScalar(t),this}containsPoint(t){return t.x>=this.min.x&&t.x<=this.max.x&&t.y>=this.min.y&&t.y<=this.max.y}containsBox(t){return this.min.x<=t.min.x&&t.max.x<=this.max.x&&this.min.y<=t.min.y&&t.max.y<=this.max.y}getParameter(t,e){return e.set((t.x-this.min.x)/(this.max.x-this.min.x),(t.y-this.min.y)/(this.max.y-this.min.y))}intersectsBox(t){return t.max.x>=this.min.x&&t.min.x<=this.max.x&&t.max.y>=this.min.y&&t.min.y<=this.max.y}clampPoint(t,e){return e.copy(t).clamp(this.min,this.max)}distanceToPoint(t){return this.clampPoint(t,Do).distanceTo(t)}intersect(t){return this.min.max(t.min),this.max.min(t.max),this.isEmpty()&&this.makeEmpty(),this}union(t){return this.min.min(t.min),this.max.max(t.max),this}translate(t){return this.min.add(t),this.max.add(t),this}equals(t){return t.min.equals(this.min)&&t.max.equals(this.max)}}class Vn{constructor(){this.type="ShapePath",this.color=new jt,this.subPaths=[],this.currentPath=null,this.userData={}}moveTo(t,e){return this.currentPath=new _i,this.subPaths.push(this.currentPath),this.currentPath.moveTo(t,e),this}lineTo(t,e){return this.currentPath.lineTo(t,e),this}quadraticCurveTo(t,e,n,s){return this.currentPath.quadraticCurveTo(t,e,n,s),this}bezierCurveTo(t,e,n,s,r,a){return this.currentPath.bezierCurveTo(t,e,n,s,r,a),this}splineThru(t){return this.currentPath.splineThru(t),this}toShapes(){function t(c,l){let u=!1;const f=l.length;for(let h=0,p=f-1;h<f;p=h++){const _=l[h],y=l[p];_.y>c.y!=y.y>c.y&&c.x<(y.x-_.x)*(c.y-_.y)/(y.y-_.y)+_.x&&(u=!u)}return u}function e(c,l){const u=l.getCenter(new dt);if(t(u,c))return u;const f=u.y,h=[],p=c.length;for(let _=0;_<p;_++){const y=c[_],m=c[(_+1)%p];if(y.y>f!=m.y>f){const d=y.x+(f-y.y)*(m.x-y.x)/(m.y-y.y);h.push(d)}}return h.length>1&&(h.sort((_,y)=>_-y),u.x=(h[0]+h[1])/2),u}let n=this.userData.style&&this.userData.style.fillRule||"nonzero";n!=="nonzero"&&n!=="evenodd"&&(Wt('Fill-rule "'+n+'" is not supported, falling back to "nonzero".'),n="nonzero");const s=n==="nonzero"?(c=>c!==0):(c=>(c&1)!==0),r=[];for(const c of this.subPaths){const l=c.getPoints();if(l.length<3)continue;const u=Dn.area(l);if(u===0)continue;const f=new ql;for(let h=0;h<l.length;h++)f.expandByPoint(l[h]);r.push({subPath:c,points:l,boundingBox:f,interiorPoint:e(l,f),absArea:Math.abs(u),winding:u<0?-1:1,container:null,exclude:!1,role:null})}r.sort((c,l)=>l.absArea-c.absArea);for(let c=0;c<r.length;c++){const l=r[c];let u=0;for(let f=c-1;f>=0;f--){const h=r[f];if(h.boundingBox.containsBox(l.boundingBox)&&t(l.interiorPoint,h.points)){l.container=h.exclude?h.container:h,u=h.winding,l.winding+=u;break}}s(l.winding)===s(u)&&(l.exclude=!0)}for(const c of r)c.exclude||(c.role=c.container===null||c.container.role==="hole"?"outer":"hole");const a=[],o=new Map;for(const c of r){if(c.exclude||c.role!=="outer")continue;const l=new Bl;l.curves=c.subPath.curves,a.push(l),o.set(c,l)}for(const c of r){if(c.exclude||c.role!=="hole")continue;const l=o.get(c.container);if(!l)continue;const u=new _i;u.curves=c.subPath.curves,l.holes.push(u)}return a}}class _u extends Un{constructor(t,e=null){super(),this.object=t,this.domElement=e,this.enabled=!0,this.state=-1,this.keys={},this.mouseButtons={LEFT:null,MIDDLE:null,RIGHT:null},this.touches={ONE:null,TWO:null}}connect(t){this.domElement!==null&&this.disconnect(),this.domElement=t}disconnect(){}dispose(){}update(){}}function Io(i,t,e,n){const s=xu(n);switch(e){case yl:return i*t;case bl:return i*t/s.components*s.byteLength;case va:return i*t/s.components*s.byteLength;case Yn:return i*t*2/s.components*s.byteLength;case Sa:return i*t*2/s.components*s.byteLength;case El:return i*t*3/s.components*s.byteLength;case Ke:return i*t*4/s.components*s.byteLength;case Ma:return i*t*4/s.components*s.byteLength;case ys:case Es:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*8;case bs:case Ts:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*16;case Nr:case Fr:return Math.max(i,16)*Math.max(t,8)/4;case Ir:case Ur:return Math.max(i,8)*Math.max(t,8)/2;case Or:case Br:case Gr:case Vr:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*8;case zr:case Ps:case kr:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*16;case Hr:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*16;case Wr:return Math.floor((i+4)/5)*Math.floor((t+3)/4)*16;case Xr:return Math.floor((i+4)/5)*Math.floor((t+4)/5)*16;case qr:return Math.floor((i+5)/6)*Math.floor((t+4)/5)*16;case Yr:return Math.floor((i+5)/6)*Math.floor((t+5)/6)*16;case Zr:return Math.floor((i+7)/8)*Math.floor((t+4)/5)*16;case Kr:return Math.floor((i+7)/8)*Math.floor((t+5)/6)*16;case Jr:return Math.floor((i+7)/8)*Math.floor((t+7)/8)*16;case $r:return Math.floor((i+9)/10)*Math.floor((t+4)/5)*16;case Qr:return Math.floor((i+9)/10)*Math.floor((t+5)/6)*16;case jr:return Math.floor((i+9)/10)*Math.floor((t+7)/8)*16;case ta:return Math.floor((i+9)/10)*Math.floor((t+9)/10)*16;case ea:return Math.floor((i+11)/12)*Math.floor((t+9)/10)*16;case na:return Math.floor((i+11)/12)*Math.floor((t+11)/12)*16;case ia:case sa:case ra:return Math.ceil(i/4)*Math.ceil(t/4)*16;case aa:case oa:return Math.ceil(i/4)*Math.ceil(t/4)*8;case Ls:case la:return Math.ceil(i/4)*Math.ceil(t/4)*16}throw new Error(`Unable to determine texture byte length for ${e} format.`)}function xu(i){switch(i){case Be:case xl:return{byteLength:1,components:1};case Fi:case vl:case cn:return{byteLength:2,components:1};case _a:case xa:return{byteLength:2,components:4};case ln:case ga:case sn:return{byteLength:4,components:1};case Sl:case Ml:return{byteLength:4,components:3}}throw new Error(`THREE.TextureUtils: Unknown texture type ${i}.`)}typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:"186"}}));typeof window<"u"&&(window.__THREE__?Wt("WARNING: Multiple instances of Three.js being imported."):window.__THREE__="186");function Yl(){let i=null,t=!1,e=null,n=null;function s(r,a){n=i.requestAnimationFrame(s),e(r,a)}return{start:function(){t!==!0&&e!==null&&i!==null&&(n=i.requestAnimationFrame(s),t=!0)},stop:function(){i!==null&&i.cancelAnimationFrame(n),t=!1},setAnimationLoop:function(r){e=r},setContext:function(r){i=r}}}function vu(i){const t=new WeakMap;function e(o,c){const l=o.array,u=o.usage,f=l.byteLength,h=i.createBuffer();i.bindBuffer(c,h),i.bufferData(c,l,u),o.onUploadCallback();let p;if(l instanceof Float32Array)p=i.FLOAT;else if(typeof Float16Array<"u"&&l instanceof Float16Array)p=i.HALF_FLOAT;else if(l instanceof Uint16Array)o.isFloat16BufferAttribute?p=i.HALF_FLOAT:p=i.UNSIGNED_SHORT;else if(l instanceof Int16Array)p=i.SHORT;else if(l instanceof Uint32Array)p=i.UNSIGNED_INT;else if(l instanceof Int32Array)p=i.INT;else if(l instanceof Int8Array)p=i.BYTE;else if(l instanceof Uint8Array)p=i.UNSIGNED_BYTE;else if(l instanceof Uint8ClampedArray)p=i.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+l);return{buffer:h,type:p,bytesPerElement:l.BYTES_PER_ELEMENT,version:o.version,size:f}}function n(o,c,l){const u=c.array,f=c.updateRanges;if(i.bindBuffer(l,o),f.length===0)i.bufferSubData(l,0,u);else{f.sort((p,_)=>p.start-_.start);let h=0;for(let p=1;p<f.length;p++){const _=f[h],y=f[p];y.start<=_.start+_.count+1?_.count=Math.max(_.count,y.start+y.count-_.start):(++h,f[h]=y)}f.length=h+1;for(let p=0,_=f.length;p<_;p++){const y=f[p];i.bufferSubData(l,y.start*u.BYTES_PER_ELEMENT,u,y.start,y.count)}c.clearUpdateRanges()}c.onUploadCallback()}function s(o){return o.isInterleavedBufferAttribute&&(o=o.data),t.get(o)}function r(o){o.isInterleavedBufferAttribute&&(o=o.data);const c=t.get(o);c&&(i.deleteBuffer(c.buffer),t.delete(o))}function a(o,c){if(o.isInterleavedBufferAttribute&&(o=o.data),o.isGLBufferAttribute){const u=t.get(o);(!u||u.version<o.version)&&t.set(o,{buffer:o.buffer,type:o.type,bytesPerElement:o.elementSize,version:o.version});return}const l=t.get(o);if(l===void 0)t.set(o,e(o,c));else if(l.version<o.version){if(l.size!==o.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");n(l.buffer,o,c),l.version=o.version}}return{get:s,remove:r,update:a}}var Su=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,Mu=`#ifdef USE_ALPHAHASH
	const float ALPHA_HASH_SCALE = 0.05;
	float hash2D( vec2 value ) {
		return fract( 1.0e4 * sin( 17.0 * value.x + 0.1 * value.y ) * ( 0.1 + abs( sin( 13.0 * value.y + value.x ) ) ) );
	}
	float hash3D( vec3 value ) {
		return hash2D( vec2( hash2D( value.xy ), value.z ) );
	}
	float getAlphaHashThreshold( vec3 position ) {
		float maxDeriv = max(
			length( dFdx( position.xyz ) ),
			length( dFdy( position.xyz ) )
		);
		float pixScale = 1.0 / ( ALPHA_HASH_SCALE * maxDeriv );
		vec2 pixScales = vec2(
			exp2( floor( log2( pixScale ) ) ),
			exp2( ceil( log2( pixScale ) ) )
		);
		vec2 alpha = vec2(
			hash3D( floor( pixScales.x * position.xyz ) ),
			hash3D( floor( pixScales.y * position.xyz ) )
		);
		float lerpFactor = fract( log2( pixScale ) );
		float x = ( 1.0 - lerpFactor ) * alpha.x + lerpFactor * alpha.y;
		float a = min( lerpFactor, 1.0 - lerpFactor );
		vec3 cases = vec3(
			x * x / ( 2.0 * a * ( 1.0 - a ) ),
			( x - 0.5 * a ) / ( 1.0 - a ),
			1.0 - ( ( 1.0 - x ) * ( 1.0 - x ) / ( 2.0 * a * ( 1.0 - a ) ) )
		);
		float threshold = ( x < ( 1.0 - a ) )
			? ( ( x < a ) ? cases.x : cases.y )
			: cases.z;
		return clamp( threshold , 1.0e-6, 1.0 );
	}
#endif`,yu=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,Eu=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,bu=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,Tu=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,Au=`#ifdef USE_AOMAP
	float ambientOcclusion = ( texture2D( aoMap, vAoMapUv ).r - 1.0 ) * aoMapIntensity + 1.0;
	reflectedLight.indirectDiffuse *= ambientOcclusion;
	#if defined( USE_CLEARCOAT ) 
		clearcoatSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_SHEEN ) 
		sheenSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD )
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );
	#endif
#endif`,wu=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,Ru=`#ifdef USE_BATCHING
	#if ! defined( GL_ANGLE_multi_draw )
	#define gl_DrawID _gl_DrawID
	uniform int _gl_DrawID;
	#endif
	uniform highp sampler2D batchingTexture;
	uniform highp usampler2D batchingIdTexture;
	mat4 getBatchingMatrix( const in float i ) {
		int size = textureSize( batchingTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( batchingTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( batchingTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( batchingTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( batchingTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
	float getIndirectIndex( const in int i ) {
		int size = textureSize( batchingIdTexture, 0 ).x;
		int x = i % size;
		int y = i / size;
		return float( texelFetch( batchingIdTexture, ivec2( x, y ), 0 ).r );
	}
#endif
#ifdef USE_BATCHING_COLOR
	uniform sampler2D batchingColorTexture;
	vec4 getBatchingColor( const in float i ) {
		int size = textureSize( batchingColorTexture, 0 ).x;
		int j = int( i );
		int x = j % size;
		int y = j / size;
		return texelFetch( batchingColorTexture, ivec2( x, y ), 0 );
	}
#endif`,Cu=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,Pu=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,Lu=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,Du=`float G_BlinnPhong_Implicit( ) {
	return 0.25;
}
float D_BlinnPhong( const in float shininess, const in float dotNH ) {
	return RECIPROCAL_PI * ( shininess * 0.5 + 1.0 ) * pow( dotNH, shininess );
}
vec3 BRDF_BlinnPhong( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 specularColor, const in float shininess ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( specularColor, 1.0, dotVH );
	float G = G_BlinnPhong_Implicit( );
	float D = D_BlinnPhong( shininess, dotNH );
	return F * ( G * D );
} // validated`,Iu=`#ifdef USE_IRIDESCENCE
	const mat3 XYZ_TO_REC709 = mat3(
		 3.2404542, -0.9692660,  0.0556434,
		-1.5371385,  1.8760108, -0.2040259,
		-0.4985314,  0.0415560,  1.0572252
	);
	vec3 Fresnel0ToIor( vec3 fresnel0 ) {
		vec3 sqrtF0 = sqrt( fresnel0 );
		return ( vec3( 1.0 ) + sqrtF0 ) / ( vec3( 1.0 ) - sqrtF0 );
	}
	vec3 IorToFresnel0( vec3 transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - vec3( incidentIor ) ) / ( transmittedIor + vec3( incidentIor ) ) );
	}
	float IorToFresnel0( float transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - incidentIor ) / ( transmittedIor + incidentIor ));
	}
	vec3 evalSensitivity( float OPD, vec3 shift ) {
		float phase = 2.0 * PI * OPD * 1.0e-9;
		vec3 val = vec3( 5.4856e-13, 4.4201e-13, 5.2481e-13 );
		vec3 pos = vec3( 1.6810e+06, 1.7953e+06, 2.2084e+06 );
		vec3 var = vec3( 4.3278e+09, 9.3046e+09, 6.6121e+09 );
		vec3 xyz = val * sqrt( 2.0 * PI * var ) * cos( pos * phase + shift ) * exp( - pow2( phase ) * var );
		xyz.x += 9.7470e-14 * sqrt( 2.0 * PI * 4.5282e+09 ) * cos( 2.2399e+06 * phase + shift[ 0 ] ) * exp( - 4.5282e+09 * pow2( phase ) );
		xyz /= 1.0685e-7;
		vec3 rgb = XYZ_TO_REC709 * xyz;
		return rgb;
	}
	vec3 evalIridescence( float outsideIOR, float eta2, float cosTheta1, float thinFilmThickness, vec3 baseF0 ) {
		vec3 I;
		float iridescenceIOR = mix( outsideIOR, eta2, smoothstep( 0.0, 0.03, thinFilmThickness ) );
		float sinTheta2Sq = pow2( outsideIOR / iridescenceIOR ) * ( 1.0 - pow2( cosTheta1 ) );
		float cosTheta2Sq = 1.0 - sinTheta2Sq;
		if ( cosTheta2Sq < 0.0 ) {
			return vec3( 1.0 );
		}
		float cosTheta2 = sqrt( cosTheta2Sq );
		float R0 = IorToFresnel0( iridescenceIOR, outsideIOR );
		float R12 = F_Schlick( R0, 1.0, cosTheta1 );
		float T121 = 1.0 - R12;
		float phi12 = 0.0;
		if ( iridescenceIOR < outsideIOR ) phi12 = PI;
		float phi21 = PI - phi12;
		vec3 baseIOR = Fresnel0ToIor( clamp( baseF0, 0.0, 0.9999 ) );		vec3 R1 = IorToFresnel0( baseIOR, iridescenceIOR );
		vec3 R23 = F_Schlick( R1, 1.0, cosTheta2 );
		vec3 phi23 = vec3( 0.0 );
		if ( baseIOR[ 0 ] < iridescenceIOR ) phi23[ 0 ] = PI;
		if ( baseIOR[ 1 ] < iridescenceIOR ) phi23[ 1 ] = PI;
		if ( baseIOR[ 2 ] < iridescenceIOR ) phi23[ 2 ] = PI;
		float OPD = 2.0 * iridescenceIOR * thinFilmThickness * cosTheta2;
		vec3 phi = vec3( phi21 ) + phi23;
		vec3 R123 = clamp( R12 * R23, 1e-5, 0.9999 );
		vec3 r123 = sqrt( R123 );
		vec3 Rs = pow2( T121 ) * R23 / ( vec3( 1.0 ) - R123 );
		vec3 C0 = R12 + Rs;
		I = C0;
		vec3 Cm = Rs - T121;
		for ( int m = 1; m <= 2; ++ m ) {
			Cm *= r123;
			vec3 Sm = 2.0 * evalSensitivity( float( m ) * OPD, float( m ) * phi );
			I += Cm * Sm;
		}
		return max( I, vec3( 0.0 ) );
	}
#endif`,Nu=`#ifdef USE_BUMPMAP
	uniform sampler2D bumpMap;
	uniform float bumpScale;
	vec2 dHdxy_fwd() {
		vec2 dSTdx = dFdx( vBumpMapUv );
		vec2 dSTdy = dFdy( vBumpMapUv );
		float Hll = bumpScale * texture2D( bumpMap, vBumpMapUv ).x;
		float dBx = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdx ).x - Hll;
		float dBy = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdy ).x - Hll;
		return vec2( dBx, dBy );
	}
	vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection ) {
		vec3 vSigmaX = normalize( dFdx( surf_pos.xyz ) );
		vec3 vSigmaY = normalize( dFdy( surf_pos.xyz ) );
		vec3 vN = surf_norm;
		vec3 R1 = cross( vSigmaY, vN );
		vec3 R2 = cross( vN, vSigmaX );
		float fDet = dot( vSigmaX, R1 ) * faceDirection;
		vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
		return normalize( abs( fDet ) * surf_norm - vGrad );
	}
#endif`,Uu=`#if NUM_CLIPPING_PLANES > 0
	vec4 plane;
	#ifdef ALPHA_TO_COVERAGE
		float distanceToPlane, distanceGradient;
		float clipOpacity = 1.0;
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
			distanceGradient = fwidth( distanceToPlane ) / 2.0;
			clipOpacity *= smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			if ( clipOpacity == 0.0 ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			float unionClipOpacity = 1.0;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
				distanceGradient = fwidth( distanceToPlane ) / 2.0;
				unionClipOpacity *= 1.0 - smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			}
			#pragma unroll_loop_end
			clipOpacity *= 1.0 - unionClipOpacity;
		#endif
		diffuseColor.a *= clipOpacity;
		if ( diffuseColor.a == 0.0 ) discard;
	#else
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			if ( dot( vClipPosition, plane.xyz ) > plane.w ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			bool clipped = true;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				clipped = ( dot( vClipPosition, plane.xyz ) > plane.w ) && clipped;
			}
			#pragma unroll_loop_end
			if ( clipped ) discard;
		#endif
	#endif
#endif`,Fu=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,Ou=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,Bu=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,zu=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#endif`,Gu=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#endif`,Vu=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec4 vColor;
#endif`,ku=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	vColor = vec4( 1.0 );
#endif
#ifdef USE_COLOR_ALPHA
	vColor *= color;
#elif defined( USE_COLOR )
	vColor.rgb *= color;
#endif
#ifdef USE_INSTANCING_COLOR
	vColor.rgb *= instanceColor.rgb;
#endif
#ifdef USE_BATCHING_COLOR
	vColor *= getBatchingColor( getIndirectIndex( gl_DrawID ) );
#endif`,Hu=`#define PI 3.141592653589793
#define PI2 6.283185307179586
#define PI_HALF 1.5707963267948966
#define RECIPROCAL_PI 0.3183098861837907
#define RECIPROCAL_PI2 0.15915494309189535
#define EPSILON 1e-6
#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
#define whiteComplement( a ) ( 1.0 - saturate( a ) )
float pow2( const in float x ) { return x*x; }
vec3 pow2( const in vec3 x ) { return x*x; }
float pow3( const in float x ) { return x*x*x; }
float pow4( const in float x ) { float x2 = x*x; return x2*x2; }
float max3( const in vec3 v ) { return max( max( v.x, v.y ), v.z ); }
float average( const in vec3 v ) { return dot( v, vec3( 0.3333333 ) ); }
highp float rand( const in vec2 uv ) {
	const highp float a = 12.9898, b = 78.233, c = 43758.5453;
	highp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );
	return fract( sin( sn ) * c );
}
#ifdef HIGH_PRECISION
	float precisionSafeLength( vec3 v ) { return length( v ); }
#else
	float precisionSafeLength( vec3 v ) {
		float maxComponent = max3( abs( v ) );
		return length( v / maxComponent ) * maxComponent;
	}
#endif
struct IncidentLight {
	vec3 color;
	vec3 direction;
	bool visible;
};
struct ReflectedLight {
	vec3 directDiffuse;
	vec3 directSpecular;
	vec3 indirectDiffuse;
	vec3 indirectSpecular;
};
#ifdef USE_ALPHAHASH
	varying vec3 vPosition;
#endif
vec3 transformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );
}
#define inverseTransformDirection transformDirectionByInverseViewMatrix
vec3 transformNormalByInverseViewMatrix( in vec3 normal, in mat4 viewMatrix ) {
	return normalize( ( vec4( normal, 0.0 ) * viewMatrix ).xyz );
}
vec3 transformDirectionByInverseViewMatrix( in vec3 dir, in mat4 viewMatrix ) {
	return normalize( ( vec4( dir, 0.0 ) * viewMatrix ).xyz );
}
bool isPerspectiveMatrix( mat4 m ) {
	return m[ 2 ][ 3 ] == - 1.0;
}
vec2 equirectUv( in vec3 dir ) {
	float u = atan( dir.z, dir.x ) * RECIPROCAL_PI2 + 0.5;
	float v = asin( clamp( dir.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;
	return vec2( u, v );
}
vec3 BRDF_Lambert( const in vec3 diffuseColor ) {
	return RECIPROCAL_PI * diffuseColor;
}
vec3 F_Schlick( const in vec3 f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
}
float F_Schlick( const in float f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
} // validated`,Wu=`#ifdef ENVMAP_TYPE_CUBE_UV
	#define cubeUV_minMipLevel 4.0
	#define cubeUV_minTileSize 16.0
	float getFace( vec3 direction ) {
		vec3 absDirection = abs( direction );
		float face = - 1.0;
		if ( absDirection.x > absDirection.z ) {
			if ( absDirection.x > absDirection.y )
				face = direction.x > 0.0 ? 0.0 : 3.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		} else {
			if ( absDirection.z > absDirection.y )
				face = direction.z > 0.0 ? 2.0 : 5.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		}
		return face;
	}
	vec2 getUV( vec3 direction, float face ) {
		vec2 uv;
		if ( face == 0.0 ) {
			uv = vec2( direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 1.0 ) {
			uv = vec2( - direction.x, - direction.z ) / abs( direction.y );
		} else if ( face == 2.0 ) {
			uv = vec2( - direction.x, direction.y ) / abs( direction.z );
		} else if ( face == 3.0 ) {
			uv = vec2( - direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 4.0 ) {
			uv = vec2( - direction.x, direction.z ) / abs( direction.y );
		} else {
			uv = vec2( direction.x, direction.y ) / abs( direction.z );
		}
		return 0.5 * ( uv + 1.0 );
	}
	vec3 bilinearCubeUV( sampler2D envMap, vec3 direction, float mipInt ) {
		float face = getFace( direction );
		float filterInt = max( cubeUV_minMipLevel - mipInt, 0.0 );
		mipInt = max( mipInt, cubeUV_minMipLevel );
		float faceSize = exp2( mipInt );
		highp vec2 uv = getUV( direction, face ) * ( faceSize - 2.0 ) + 1.0;
		if ( face > 2.0 ) {
			uv.y += faceSize;
			face -= 3.0;
		}
		uv.x += face * faceSize;
		uv.x += filterInt * 3.0 * cubeUV_minTileSize;
		uv.y += 4.0 * ( exp2( CUBEUV_MAX_MIP ) - faceSize );
		uv.x *= CUBEUV_TEXEL_WIDTH;
		uv.y *= CUBEUV_TEXEL_HEIGHT;
		#ifdef texture2DGradEXT
			return texture2DGradEXT( envMap, uv, vec2( 0.0 ), vec2( 0.0 ) ).rgb;
		#else
			return texture2D( envMap, uv ).rgb;
		#endif
	}
	#define cubeUV_r0 1.0
	#define cubeUV_m0 - 2.0
	#define cubeUV_r1 0.8
	#define cubeUV_m1 - 1.0
	#define cubeUV_r4 0.4
	#define cubeUV_m4 2.0
	#define cubeUV_r5 0.305
	#define cubeUV_m5 3.0
	#define cubeUV_r6 0.21
	#define cubeUV_m6 4.0
	float roughnessToMip( float roughness ) {
		float mip = 0.0;
		if ( roughness >= cubeUV_r1 ) {
			mip = ( cubeUV_r0 - roughness ) * ( cubeUV_m1 - cubeUV_m0 ) / ( cubeUV_r0 - cubeUV_r1 ) + cubeUV_m0;
		} else if ( roughness >= cubeUV_r4 ) {
			mip = ( cubeUV_r1 - roughness ) * ( cubeUV_m4 - cubeUV_m1 ) / ( cubeUV_r1 - cubeUV_r4 ) + cubeUV_m1;
		} else if ( roughness >= cubeUV_r5 ) {
			mip = ( cubeUV_r4 - roughness ) * ( cubeUV_m5 - cubeUV_m4 ) / ( cubeUV_r4 - cubeUV_r5 ) + cubeUV_m4;
		} else if ( roughness >= cubeUV_r6 ) {
			mip = ( cubeUV_r5 - roughness ) * ( cubeUV_m6 - cubeUV_m5 ) / ( cubeUV_r5 - cubeUV_r6 ) + cubeUV_m5;
		} else {
			mip = - 2.0 * log2( 1.16 * roughness );		}
		return mip;
	}
	vec4 textureCubeUV( sampler2D envMap, vec3 sampleDir, float roughness ) {
		float mip = clamp( roughnessToMip( roughness ), cubeUV_m0, CUBEUV_MAX_MIP );
		float mipF = fract( mip );
		float mipInt = floor( mip );
		vec3 color0 = bilinearCubeUV( envMap, sampleDir, mipInt );
		if ( mipF == 0.0 ) {
			return vec4( color0, 1.0 );
		} else {
			vec3 color1 = bilinearCubeUV( envMap, sampleDir, mipInt + 1.0 );
			return vec4( mix( color0, color1, mipF ), 1.0 );
		}
	}
#endif`,Xu=`vec3 transformedNormal = objectNormal;
#ifdef USE_TANGENT
	vec3 transformedTangent = objectTangent;
#endif
#ifdef USE_BATCHING
	mat3 bm = mat3( batchingMatrix );
	transformedNormal /= vec3( dot( bm[ 0 ], bm[ 0 ] ), dot( bm[ 1 ], bm[ 1 ] ), dot( bm[ 2 ], bm[ 2 ] ) );
	transformedNormal = bm * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = bm * transformedTangent;
	#endif
#endif
#ifdef USE_INSTANCING
	mat3 im = mat3( instanceMatrix );
	transformedNormal /= vec3( dot( im[ 0 ], im[ 0 ] ), dot( im[ 1 ], im[ 1 ] ), dot( im[ 2 ], im[ 2 ] ) );
	transformedNormal = im * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = im * transformedTangent;
	#endif
#endif
transformedNormal = normalMatrix * transformedNormal;
#ifdef FLIP_SIDED
	transformedNormal = - transformedNormal;
#endif
#ifdef USE_TANGENT
	transformedTangent = ( modelViewMatrix * vec4( transformedTangent, 0.0 ) ).xyz;
#endif`,qu=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,Yu=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,Zu=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,Ku=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,Ju="gl_FragColor = linearToOutputTexel( gl_FragColor );",$u=`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,Qu=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vec3 cameraToFrag;
		if ( isOrthographic ) {
			cameraToFrag = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToFrag = normalize( vWorldPosition - cameraPosition );
		}
		vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vec3 reflectVec = reflect( cameraToFrag, worldNormal );
		#else
			vec3 reflectVec = refract( cameraToFrag, worldNormal, refractionRatio );
		#endif
	#else
		vec3 reflectVec = vReflect;
	#endif
	#ifdef ENVMAP_TYPE_CUBE
		vec4 envColor = textureCube( envMap, envMapRotation * reflectVec );
		#ifdef ENVMAP_BLENDING_MULTIPLY
			outgoingLight = mix( outgoingLight, outgoingLight * envColor.xyz, specularStrength * reflectivity );
		#elif defined( ENVMAP_BLENDING_MIX )
			outgoingLight = mix( outgoingLight, envColor.xyz, specularStrength * reflectivity );
		#elif defined( ENVMAP_BLENDING_ADD )
			outgoingLight += envColor.xyz * specularStrength * reflectivity;
		#endif
	#endif
#endif`,ju=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
#endif`,tf=`#ifdef USE_ENVMAP
	uniform float reflectivity;
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		varying vec3 vWorldPosition;
		uniform float refractionRatio;
	#else
		varying vec3 vReflect;
	#endif
#endif`,ef=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,nf=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vWorldPosition = worldPosition.xyz;
	#else
		vec3 cameraToVertex;
		if ( isOrthographic ) {
			cameraToVertex = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToVertex = normalize( worldPosition.xyz - cameraPosition );
		}
		vec3 worldNormal = transformNormalByInverseViewMatrix( transformedNormal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vReflect = reflect( cameraToVertex, worldNormal );
		#else
			vReflect = refract( cameraToVertex, worldNormal, refractionRatio );
		#endif
	#endif
#endif`,sf=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,rf=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,af=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,of=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,lf=`#ifdef USE_GRADIENTMAP
	uniform sampler2D gradientMap;
#endif
vec3 getGradientIrradiance( vec3 normal, vec3 lightDirection ) {
	float dotNL = dot( normal, lightDirection );
	vec2 coord = vec2( dotNL * 0.5 + 0.5, 0.0 );
	#ifdef USE_GRADIENTMAP
		return vec3( texture2D( gradientMap, coord ).r );
	#else
		vec2 fw = fwidth( coord ) * 0.5;
		return mix( vec3( 0.7 ), vec3( 1.0 ), smoothstep( 0.7 - fw.x, 0.7 + fw.x, coord.x ) );
	#endif
}`,cf=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,hf=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,uf=`varying vec3 vViewPosition;
struct LambertMaterial {
	vec3 diffuseColor;
	float specularStrength;
};
void RE_Direct_Lambert( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Lambert( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Lambert
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,ff=`uniform bool receiveShadow;
uniform vec3 ambientLightColor;
#if defined( USE_LIGHT_PROBES )
	uniform vec3 lightProbe[ 9 ];
#endif
vec3 shGetIrradianceAt( in vec3 normal, in vec3 shCoefficients[ 9 ] ) {
	float x = normal.x, y = normal.y, z = normal.z;
	vec3 result = shCoefficients[ 0 ] * 0.886227;
	result += shCoefficients[ 1 ] * 2.0 * 0.511664 * y;
	result += shCoefficients[ 2 ] * 2.0 * 0.511664 * z;
	result += shCoefficients[ 3 ] * 2.0 * 0.511664 * x;
	result += shCoefficients[ 4 ] * 2.0 * 0.429043 * x * y;
	result += shCoefficients[ 5 ] * 2.0 * 0.429043 * y * z;
	result += shCoefficients[ 6 ] * ( 0.743125 * z * z - 0.247708 );
	result += shCoefficients[ 7 ] * 2.0 * 0.429043 * x * z;
	result += shCoefficients[ 8 ] * 0.429043 * ( x * x - y * y );
	return result;
}
vec3 getLightProbeIrradiance( const in vec3 lightProbe[ 9 ], const in vec3 normal ) {
	vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
	vec3 irradiance = shGetIrradianceAt( worldNormal, lightProbe );
	return irradiance;
}
vec3 getAmbientLightIrradiance( const in vec3 ambientLightColor ) {
	vec3 irradiance = ambientLightColor;
	return irradiance;
}
float getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {
	float distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.01 );
	if ( cutoffDistance > 0.0 ) {
		distanceFalloff *= pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );
	}
	return distanceFalloff;
}
float getSpotAttenuation( const in float coneCosine, const in float penumbraCosine, const in float angleCosine ) {
	return smoothstep( coneCosine, penumbraCosine, angleCosine );
}
#if NUM_SUN_LIGHTS > 0
	struct SunLight {
		vec3 direction;
		vec3 color;
	};
	uniform SunLight sunLights[ NUM_SUN_LIGHTS ];
	void getSunLightInfo( const in SunLight sunLight, out IncidentLight light ) {
		light.color = sunLight.color;
		light.direction = sunLight.direction;
		light.visible = true;
	}
#endif
#if NUM_DIR_LIGHTS > 0
	struct DirectionalLight {
		vec3 direction;
		vec3 color;
	};
	uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];
	void getDirectionalLightInfo( const in DirectionalLight directionalLight, out IncidentLight light ) {
		light.color = directionalLight.color;
		light.direction = directionalLight.direction;
		light.visible = true;
	}
#endif
#if NUM_POINT_LIGHTS > 0
	struct PointLight {
		vec3 position;
		vec3 color;
		float distance;
		float decay;
	};
	uniform PointLight pointLights[ NUM_POINT_LIGHTS ];
	void getPointLightInfo( const in PointLight pointLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = pointLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float lightDistance = length( lVector );
		light.color = pointLight.color;
		light.color *= getDistanceAttenuation( lightDistance, pointLight.distance, pointLight.decay );
		light.visible = ( light.color != vec3( 0.0 ) );
	}
#endif
#if NUM_SPOT_LIGHTS > 0
	struct SpotLight {
		vec3 position;
		vec3 direction;
		vec3 color;
		float distance;
		float decay;
		float coneCos;
		float penumbraCos;
	};
	uniform SpotLight spotLights[ NUM_SPOT_LIGHTS ];
	void getSpotLightInfo( const in SpotLight spotLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = spotLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float angleCos = dot( light.direction, spotLight.direction );
		float spotAttenuation = getSpotAttenuation( spotLight.coneCos, spotLight.penumbraCos, angleCos );
		if ( spotAttenuation > 0.0 ) {
			float lightDistance = length( lVector );
			light.color = spotLight.color * spotAttenuation;
			light.color *= getDistanceAttenuation( lightDistance, spotLight.distance, spotLight.decay );
			light.visible = ( light.color != vec3( 0.0 ) );
		} else {
			light.color = vec3( 0.0 );
			light.visible = false;
		}
	}
#endif
#if NUM_RECT_AREA_LIGHTS > 0
	struct RectAreaLight {
		vec3 color;
		vec3 position;
		vec3 halfWidth;
		vec3 halfHeight;
	};
	uniform sampler2D ltc_1;	uniform sampler2D ltc_2;
	uniform RectAreaLight rectAreaLights[ NUM_RECT_AREA_LIGHTS ];
#endif
#if NUM_HEMI_LIGHTS > 0
	struct HemisphereLight {
		vec3 direction;
		vec3 skyColor;
		vec3 groundColor;
	};
	uniform HemisphereLight hemisphereLights[ NUM_HEMI_LIGHTS ];
	vec3 getHemisphereLightIrradiance( const in HemisphereLight hemiLight, const in vec3 normal ) {
		float dotNL = dot( normal, hemiLight.direction );
		float hemiDiffuseWeight = 0.5 * dotNL + 0.5;
		vec3 irradiance = mix( hemiLight.groundColor, hemiLight.skyColor, hemiDiffuseWeight );
		return irradiance;
	}
#endif
#include <lightprobes_pars_fragment>`,df=`#ifdef USE_ENVMAP
	vec3 getIBLIrradiance( const in vec3 normal ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * worldNormal, 1.0 );
			return PI * envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 reflectVec = reflect( - viewDir, normal );
			reflectVec = normalize( mix( reflectVec, normal, pow4( roughness ) ) );
			reflectVec = transformDirectionByInverseViewMatrix( reflectVec, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * reflectVec, roughness );
			return envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	#ifdef USE_RETROREFLECTION
		vec3 getIBLRetroRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
			#ifdef ENVMAP_TYPE_CUBE_UV
				vec3 retroVec = normalize( mix( viewDir, normal, pow4( roughness ) ) );
				retroVec = transformDirectionByInverseViewMatrix( retroVec, viewMatrix );
				vec4 envMapColor = textureCubeUV( envMap, envMapRotation * retroVec, roughness );
				return envMapColor.rgb * envMapIntensity;
			#else
				return vec3( 0.0 );
			#endif
		}
	#endif
	#ifdef USE_ANISOTROPY
		vec3 getIBLAnisotropyRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
			#ifdef ENVMAP_TYPE_CUBE_UV
				vec3 bentNormal = cross( bitangent, viewDir );
				bentNormal = normalize( cross( bentNormal, bitangent ) );
				bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
				return getIBLRadiance( viewDir, bentNormal, roughness );
			#else
				return vec3( 0.0 );
			#endif
		}
		#ifdef USE_RETROREFLECTION
			vec3 getIBLAnisotropyRetroRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
				#ifdef ENVMAP_TYPE_CUBE_UV
					vec3 bentNormal = cross( bitangent, viewDir );
					bentNormal = normalize( cross( bentNormal, bitangent ) );
					bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
					return getIBLRetroRadiance( viewDir, bentNormal, roughness );
				#else
					return vec3( 0.0 );
				#endif
			}
		#endif
	#endif
#endif`,pf=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,mf=`varying vec3 vViewPosition;
struct ToonMaterial {
	vec3 diffuseColor;
};
void RE_Direct_Toon( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 irradiance = getGradientIrradiance( geometryNormal, directLight.direction ) * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Toon( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Toon
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,gf=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,_f=`varying vec3 vViewPosition;
struct BlinnPhongMaterial {
	vec3 diffuseColor;
	vec3 specularColor;
	float specularShininess;
	float specularStrength;
};
void RE_Direct_BlinnPhong( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
	reflectedLight.directSpecular += irradiance * BRDF_BlinnPhong( directLight.direction, geometryViewDir, geometryNormal, material.specularColor, material.specularShininess ) * material.specularStrength;
}
void RE_IndirectDiffuse_BlinnPhong( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_BlinnPhong
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,xf=`PhysicalMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.diffuseContribution = diffuseColor.rgb * ( 1.0 - metalnessFactor );
material.metalness = metalnessFactor;
vec3 dxy = max( abs( dFdx( nonPerturbedNormal ) ), abs( dFdy( nonPerturbedNormal ) ) );
float geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );
material.roughness = max( roughnessFactor, 0.0525 );material.roughness += geometryRoughness;
material.roughness = min( material.roughness, 1.0 );
#ifdef IOR
	material.ior = ior;
	#ifdef USE_SPECULAR
		float specularIntensityFactor = specularIntensity;
		vec3 specularColorFactor = specularColor;
		#ifdef USE_SPECULAR_COLORMAP
			specularColorFactor *= texture2D( specularColorMap, vSpecularColorMapUv ).rgb;
		#endif
		#ifdef USE_SPECULAR_INTENSITYMAP
			specularIntensityFactor *= texture2D( specularIntensityMap, vSpecularIntensityMapUv ).a;
		#endif
		material.specularF90 = mix( specularIntensityFactor, 1.0, metalnessFactor );
	#else
		float specularIntensityFactor = 1.0;
		vec3 specularColorFactor = vec3( 1.0 );
		material.specularF90 = 1.0;
	#endif
	material.specularColor = min( pow2( ( material.ior - 1.0 ) / ( material.ior + 1.0 ) ) * specularColorFactor, vec3( 1.0 ) ) * specularIntensityFactor;
	material.specularColorBlended = mix( material.specularColor, diffuseColor.rgb, metalnessFactor );
#else
	material.specularColor = vec3( 0.04 );
	material.specularColorBlended = mix( material.specularColor, diffuseColor.rgb, metalnessFactor );
	material.specularF90 = 1.0;
#endif
#ifdef USE_CLEARCOAT
	material.clearcoat = clearcoat;
	material.clearcoatRoughness = clearcoatRoughness;
	material.clearcoatF0 = vec3( 0.04 );
	material.clearcoatF90 = 1.0;
	#ifdef USE_CLEARCOATMAP
		material.clearcoat *= texture2D( clearcoatMap, vClearcoatMapUv ).x;
	#endif
	#ifdef USE_CLEARCOAT_ROUGHNESSMAP
		material.clearcoatRoughness *= texture2D( clearcoatRoughnessMap, vClearcoatRoughnessMapUv ).y;
	#endif
	material.clearcoat = saturate( material.clearcoat );	material.clearcoatRoughness = max( material.clearcoatRoughness, 0.0525 );
	material.clearcoatRoughness += geometryRoughness;
	material.clearcoatRoughness = min( material.clearcoatRoughness, 1.0 );
#endif
#ifdef USE_DISPERSION
	material.dispersion = dispersion;
#endif
#ifdef USE_RETROREFLECTION
	material.retroreflectivity = retroreflectivity;
#endif
#ifdef USE_IRIDESCENCE
	material.iridescence = iridescence;
	material.iridescenceIOR = iridescenceIOR;
	#ifdef USE_IRIDESCENCEMAP
		material.iridescence *= texture2D( iridescenceMap, vIridescenceMapUv ).r;
	#endif
	#ifdef USE_IRIDESCENCE_THICKNESSMAP
		material.iridescenceThickness = (iridescenceThicknessMaximum - iridescenceThicknessMinimum) * texture2D( iridescenceThicknessMap, vIridescenceThicknessMapUv ).g + iridescenceThicknessMinimum;
	#else
		material.iridescenceThickness = iridescenceThicknessMaximum;
	#endif
#endif
#ifdef USE_SHEEN
	material.sheenColor = sheenColor;
	#ifdef USE_SHEEN_COLORMAP
		material.sheenColor *= texture2D( sheenColorMap, vSheenColorMapUv ).rgb;
	#endif
	material.sheenRoughness = clamp( sheenRoughness, 0.0001, 1.0 );
	#ifdef USE_SHEEN_ROUGHNESSMAP
		material.sheenRoughness *= texture2D( sheenRoughnessMap, vSheenRoughnessMapUv ).a;
	#endif
#endif
#ifdef USE_ANISOTROPY
	#ifdef USE_ANISOTROPYMAP
		mat2 anisotropyMat = mat2( anisotropyVector.x, anisotropyVector.y, - anisotropyVector.y, anisotropyVector.x );
		vec3 anisotropyPolar = texture2D( anisotropyMap, vAnisotropyMapUv ).rgb;
		vec2 anisotropyV = anisotropyMat * normalize( 2.0 * anisotropyPolar.rg - vec2( 1.0 ) ) * anisotropyPolar.b;
	#else
		vec2 anisotropyV = anisotropyVector;
	#endif
	material.anisotropy = length( anisotropyV );
	if( material.anisotropy == 0.0 ) {
		anisotropyV = vec2( 1.0, 0.0 );
	} else {
		anisotropyV /= material.anisotropy;
		material.anisotropy = saturate( material.anisotropy );
	}
	material.alphaT = mix( pow2( material.roughness ), 1.0, pow2( material.anisotropy ) );
	material.anisotropyT = tbn[ 0 ] * anisotropyV.x + tbn[ 1 ] * anisotropyV.y;
	material.anisotropyB = tbn[ 1 ] * anisotropyV.x - tbn[ 0 ] * anisotropyV.y;
#endif`,vf=`uniform sampler2D dfgLUT;
struct PhysicalMaterial {
	vec3 diffuseColor;
	vec3 diffuseContribution;
	vec3 specularColor;
	vec3 specularColorBlended;
	float roughness;
	float metalness;
	float specularF90;
	float dispersion;
	vec2 dfg;
	vec3 multiScatteringCompensation;
	#ifdef USE_RETROREFLECTION
		float retroreflectivity;
	#endif
	#ifdef USE_CLEARCOAT
		float clearcoat;
		float clearcoatRoughness;
		vec3 clearcoatF0;
		float clearcoatF90;
	#endif
	#ifdef USE_IRIDESCENCE
		float iridescence;
		float iridescenceIOR;
		float iridescenceThickness;
		vec3 iridescenceFresnel;
		vec3 iridescenceF0Dielectric;
		vec3 iridescenceF0Metallic;
	#endif
	#ifdef USE_SHEEN
		vec3 sheenColor;
		float sheenRoughness;
	#endif
	#ifdef IOR
		float ior;
	#endif
	#ifdef USE_TRANSMISSION
		float transmission;
		float transmissionAlpha;
		float thickness;
		float attenuationDistance;
		vec3 attenuationColor;
	#endif
	#ifdef USE_ANISOTROPY
		float anisotropy;
		float alphaT;
		vec3 anisotropyT;
		vec3 anisotropyB;
	#endif
};
vec3 clearcoatSpecularDirect = vec3( 0.0 );
vec3 clearcoatSpecularIndirect = vec3( 0.0 );
vec3 sheenSpecularDirect = vec3( 0.0 );
vec3 sheenSpecularIndirect = vec3(0.0 );
vec3 Schlick_to_F0( const in vec3 f, const in float f90, const in float dotVH ) {
    float x = clamp( 1.0 - dotVH, 0.0, 1.0 );
    float x2 = x * x;
    float x5 = clamp( x * x2 * x2, 0.0, 0.9999 );
    return ( f - vec3( f90 ) * x5 ) / ( 1.0 - x5 );
}
float V_GGX_SmithCorrelated( const in float alpha, const in float dotNL, const in float dotNV ) {
	float a2 = pow2( alpha );
	float gv = dotNL * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNV ) );
	float gl = dotNV * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNL ) );
	return 0.5 / max( gv + gl, EPSILON );
}
float D_GGX( const in float alpha, const in float dotNH ) {
	float a2 = pow2( alpha );
	float denom = pow2( dotNH ) * ( a2 - 1.0 ) + 1.0;
	return RECIPROCAL_PI * a2 / pow2( denom );
}
#ifdef USE_ANISOTROPY
	float V_GGX_SmithCorrelated_Anisotropic( const in float alphaT, const in float alphaB, const in float dotTV, const in float dotBV, const in float dotTL, const in float dotBL, const in float dotNV, const in float dotNL ) {
		float gv = dotNL * length( vec3( alphaT * dotTV, alphaB * dotBV, dotNV ) );
		float gl = dotNV * length( vec3( alphaT * dotTL, alphaB * dotBL, dotNL ) );
		return 0.5 / max( gv + gl, EPSILON );
	}
	float D_GGX_Anisotropic( const in float alphaT, const in float alphaB, const in float dotNH, const in float dotTH, const in float dotBH ) {
		float a2 = alphaT * alphaB;
		highp vec3 v = vec3( alphaB * dotTH, alphaT * dotBH, a2 * dotNH );
		highp float v2 = dot( v, v );
		float w2 = a2 / v2;
		return RECIPROCAL_PI * a2 * pow2 ( w2 );
	}
#endif
#ifdef USE_CLEARCOAT
	vec3 BRDF_GGX_Clearcoat( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material) {
		vec3 f0 = material.clearcoatF0;
		float f90 = material.clearcoatF90;
		float roughness = material.clearcoatRoughness;
		float alpha = pow2( roughness );
		vec3 halfDir = normalize( lightDir + viewDir );
		float dotNL = saturate( dot( normal, lightDir ) );
		float dotNV = saturate( dot( normal, viewDir ) );
		float dotNH = saturate( dot( normal, halfDir ) );
		float dotVH = saturate( dot( viewDir, halfDir ) );
		vec3 F = F_Schlick( f0, f90, dotVH );
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
		return F * ( V * D );
	}
#endif
vec3 BRDF_GGX( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 f0 = material.specularColorBlended;
	float f90 = material.specularF90;
	float roughness = material.roughness;
	float alpha = pow2( roughness );
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( f0, f90, dotVH );
	#ifdef USE_IRIDESCENCE
		F = mix( F, material.iridescenceFresnel, material.iridescence );
	#endif
	#ifdef USE_ANISOTROPY
		float dotTL = dot( material.anisotropyT, lightDir );
		float dotTV = dot( material.anisotropyT, viewDir );
		float dotTH = dot( material.anisotropyT, halfDir );
		float dotBL = dot( material.anisotropyB, lightDir );
		float dotBV = dot( material.anisotropyB, viewDir );
		float dotBH = dot( material.anisotropyB, halfDir );
		float V = V_GGX_SmithCorrelated_Anisotropic( material.alphaT, alpha, dotTV, dotBV, dotTL, dotBL, dotNV, dotNL );
		float D = D_GGX_Anisotropic( material.alphaT, alpha, dotNH, dotTH, dotBH );
	#else
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
	#endif
	return F * ( V * D );
}
vec2 LTC_Uv( const in vec3 N, const in vec3 V, const in float roughness ) {
	const float LUT_SIZE = 64.0;
	const float LUT_SCALE = ( LUT_SIZE - 1.0 ) / LUT_SIZE;
	const float LUT_BIAS = 0.5 / LUT_SIZE;
	float dotNV = saturate( dot( N, V ) );
	vec2 uv = vec2( roughness, sqrt( 1.0 - dotNV ) );
	uv = uv * LUT_SCALE + LUT_BIAS;
	return uv;
}
float LTC_ClippedSphereFormFactor( const in vec3 f ) {
	float l = length( f );
	return max( ( l * l + f.z ) / ( l + 1.0 ), 0.0 );
}
vec3 LTC_EdgeVectorFormFactor( const in vec3 v1, const in vec3 v2 ) {
	float x = dot( v1, v2 );
	float y = abs( x );
	float a = 0.8543985 + ( 0.4965155 + 0.0145206 * y ) * y;
	float b = 3.4175940 + ( 4.1616724 + y ) * y;
	float v = a / b;
	float theta_sintheta = ( x > 0.0 ) ? v : 0.5 * inversesqrt( max( 1.0 - x * x, 1e-7 ) ) - v;
	return cross( v1, v2 ) * theta_sintheta;
}
vec3 LTC_Evaluate( const in vec3 N, const in vec3 V, const in vec3 P, const in mat3 mInv, const in vec3 rectCoords[ 4 ] ) {
	vec3 v1 = rectCoords[ 1 ] - rectCoords[ 0 ];
	vec3 v2 = rectCoords[ 3 ] - rectCoords[ 0 ];
	vec3 lightNormal = cross( v1, v2 );
	if( dot( lightNormal, P - rectCoords[ 0 ] ) < 0.0 ) return vec3( 0.0 );
	vec3 T1, T2;
	T1 = normalize( V - N * dot( V, N ) );
	T2 = - cross( N, T1 );
	mat3 mat = mInv * transpose( mat3( T1, T2, N ) );
	vec3 coords[ 4 ];
	coords[ 0 ] = mat * ( rectCoords[ 0 ] - P );
	coords[ 1 ] = mat * ( rectCoords[ 1 ] - P );
	coords[ 2 ] = mat * ( rectCoords[ 2 ] - P );
	coords[ 3 ] = mat * ( rectCoords[ 3 ] - P );
	coords[ 0 ] = normalize( coords[ 0 ] );
	coords[ 1 ] = normalize( coords[ 1 ] );
	coords[ 2 ] = normalize( coords[ 2 ] );
	coords[ 3 ] = normalize( coords[ 3 ] );
	vec3 vectorFormFactor = vec3( 0.0 );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 0 ], coords[ 1 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 1 ], coords[ 2 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 2 ], coords[ 3 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 3 ], coords[ 0 ] );
	float result = LTC_ClippedSphereFormFactor( vectorFormFactor );
	return vec3( result );
}
#if defined( USE_SHEEN )
float D_Charlie( float roughness, float dotNH ) {
	float alpha = pow2( roughness );
	float invAlpha = 1.0 / alpha;
	float cos2h = dotNH * dotNH;
	float sin2h = max( 1.0 - cos2h, 0.0078125 );
	return ( 2.0 + invAlpha ) * pow( sin2h, invAlpha * 0.5 ) / ( 2.0 * PI );
}
float V_Neubelt( float dotNV, float dotNL ) {
	return saturate( 1.0 / ( 4.0 * ( dotNL + dotNV - dotNL * dotNV ) ) );
}
vec3 BRDF_Sheen( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, vec3 sheenColor, const in float sheenRoughness ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float D = D_Charlie( sheenRoughness, dotNH );
	float V = V_Neubelt( dotNV, dotNL );
	return sheenColor * ( D * V );
}
#endif
float IBLSheenBRDF( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	float r2 = roughness * roughness;
	float rInv = 1.0 / ( roughness + 0.1 );
	float a = -1.9362 + 1.0678 * roughness + 0.4573 * r2 - 0.8469 * rInv;
	float b = -0.6014 + 0.5538 * roughness - 0.4670 * r2 - 0.1255 * rInv;
	float DG = exp( a * dotNV + b );
	return saturate( DG );
}
vec3 EnvironmentBRDF( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	vec2 fab = texture2D( dfgLUT, vec2( roughness, dotNV ) ).rg;
	return specularColor * fab.x + specularF90 * fab.y;
}
#ifdef USE_IRIDESCENCE
void computeMultiscatteringIridescence( const in vec2 fab, const in vec3 specularColor, const in float specularF90, const in float iridescence, const in vec3 iridescenceF0, inout vec3 singleScatter, inout vec3 multiScatter ) {
#else
void computeMultiscattering( const in vec2 fab, const in vec3 specularColor, const in float specularF90, inout vec3 singleScatter, inout vec3 multiScatter ) {
#endif
	#ifdef USE_IRIDESCENCE
		vec3 Fr = mix( specularColor, iridescenceF0, iridescence );
	#else
		vec3 Fr = specularColor;
	#endif
	vec3 FssEss = Fr * fab.x + specularF90 * fab.y;
	float Ess = fab.x + fab.y;
	float Ems = 1.0 - Ess;
	vec3 Favg = Fr + ( 1.0 - Fr ) * 0.047619;	vec3 Fms = FssEss * Favg / ( 1.0 - Ems * Favg );
	singleScatter += FssEss;
	multiScatter += Fms * Ems;
}
#if NUM_RECT_AREA_LIGHTS > 0
	void RE_Direct_RectArea_Physical( const in RectAreaLight rectAreaLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
		vec3 normal = geometryNormal;
		vec3 viewDir = geometryViewDir;
		vec3 position = geometryPosition;
		vec3 lightPos = rectAreaLight.position;
		vec3 halfWidth = rectAreaLight.halfWidth;
		vec3 halfHeight = rectAreaLight.halfHeight;
		vec3 lightColor = rectAreaLight.color;
		float roughness = material.roughness;
		vec3 rectCoords[ 4 ];
		rectCoords[ 0 ] = lightPos + halfWidth - halfHeight;		rectCoords[ 1 ] = lightPos - halfWidth - halfHeight;
		rectCoords[ 2 ] = lightPos - halfWidth + halfHeight;
		rectCoords[ 3 ] = lightPos + halfWidth + halfHeight;
		vec2 uv = LTC_Uv( normal, viewDir, roughness );
		vec4 t1 = texture2D( ltc_1, uv );
		vec4 t2 = texture2D( ltc_2, uv );
		mat3 mInv = mat3(
			vec3( t1.x, 0, t1.y ),
			vec3(    0, 1,    0 ),
			vec3( t1.z, 0, t1.w )
		);
		vec3 fresnel = ( material.specularColorBlended * t2.x + ( material.specularF90 - material.specularColorBlended ) * t2.y );
		reflectedLight.directSpecular += lightColor * fresnel * LTC_Evaluate( normal, viewDir, position, mInv, rectCoords );
		reflectedLight.directDiffuse += lightColor * material.diffuseContribution * LTC_Evaluate( normal, viewDir, position, mat3( 1.0 ), rectCoords );
		#ifdef USE_CLEARCOAT
			vec3 Ncc = geometryClearcoatNormal;
			vec2 uvClearcoat = LTC_Uv( Ncc, viewDir, material.clearcoatRoughness );
			vec4 t1Clearcoat = texture2D( ltc_1, uvClearcoat );
			vec4 t2Clearcoat = texture2D( ltc_2, uvClearcoat );
			mat3 mInvClearcoat = mat3(
				vec3( t1Clearcoat.x, 0, t1Clearcoat.y ),
				vec3(             0, 1,             0 ),
				vec3( t1Clearcoat.z, 0, t1Clearcoat.w )
			);
			vec3 fresnelClearcoat = material.clearcoatF0 * t2Clearcoat.x + ( material.clearcoatF90 - material.clearcoatF0 ) * t2Clearcoat.y;
			clearcoatSpecularDirect += lightColor * fresnelClearcoat * LTC_Evaluate( Ncc, viewDir, position, mInvClearcoat, rectCoords );
		#endif
	}
#endif
void RE_Direct_Physical( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	#ifdef USE_CLEARCOAT
		float dotNLcc = saturate( dot( geometryClearcoatNormal, directLight.direction ) );
		vec3 ccIrradiance = dotNLcc * directLight.color;
		clearcoatSpecularDirect += ccIrradiance * BRDF_GGX_Clearcoat( directLight.direction, geometryViewDir, geometryClearcoatNormal, material );
	#endif
	#ifdef USE_SHEEN
 
 		sheenSpecularDirect += irradiance * BRDF_Sheen( directLight.direction, geometryViewDir, geometryNormal, material.sheenColor, material.sheenRoughness );
 
 		float sheenAlbedoV = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
 		float sheenAlbedoL = IBLSheenBRDF( geometryNormal, directLight.direction, material.sheenRoughness );
 
 		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * max( sheenAlbedoV, sheenAlbedoL );
 
 		irradiance *= sheenEnergyComp;
 
 	#endif
	vec3 specularBRDF = BRDF_GGX( directLight.direction, geometryViewDir, geometryNormal, material );
	#ifdef USE_RETROREFLECTION
		vec3 retroViewDir = reflect( - geometryViewDir, geometryNormal );
		vec3 retroSpecularBRDF = BRDF_GGX( directLight.direction, retroViewDir, geometryNormal, material );
		specularBRDF = mix( specularBRDF, retroSpecularBRDF, saturate( material.retroreflectivity ) );
	#endif
	reflectedLight.directSpecular += irradiance * specularBRDF * material.multiScatteringCompensation;
	vec3 halfDir = normalize( directLight.direction + geometryViewDir );
	float dotVH = saturate( dot( geometryViewDir, halfDir ) );
	vec3 F = F_Schlick( material.specularColor, material.specularF90, dotVH );
	#ifdef USE_RETROREFLECTION
		vec3 retroHalfDir = normalize( directLight.direction + retroViewDir );
		float dotRetroVH = saturate( dot( retroViewDir, retroHalfDir ) );
		vec3 retroF = F_Schlick( material.specularColor, material.specularF90, dotRetroVH );
		F = mix( F, retroF, saturate( material.retroreflectivity ) );
	#endif
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseContribution ) * ( 1.0 - F );
}
void RE_IndirectDiffuse_Physical( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 singleScattering = vec3( 0.0 );
	vec3 multiScattering = vec3( 0.0 );
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( material.dfg, material.specularColor, material.specularF90, material.iridescence, material.iridescenceF0Dielectric, singleScattering, multiScattering );
	#else
		computeMultiscattering( material.dfg, material.specularColor, material.specularF90, singleScattering, multiScattering );
	#endif
	vec3 diffuse = irradiance * BRDF_Lambert( material.diffuseContribution ) * ( 1.0 - singleScattering - multiScattering );
	#ifdef USE_SHEEN
		float sheenAlbedo = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
		sheenSpecularIndirect += irradiance * material.sheenColor * sheenAlbedo * RECIPROCAL_PI;
		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * sheenAlbedo;
		diffuse *= sheenEnergyComp;
	#endif
	reflectedLight.indirectDiffuse += diffuse;
}
void RE_IndirectSpecular_Physical( const in vec3 radiance, const in vec3 irradiance, const in vec3 clearcoatRadiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight) {
	#ifdef USE_CLEARCOAT
		clearcoatSpecularIndirect += clearcoatRadiance * EnvironmentBRDF( geometryClearcoatNormal, geometryViewDir, material.clearcoatF0, material.clearcoatF90, material.clearcoatRoughness );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularIndirect += irradiance * material.sheenColor * IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness ) * RECIPROCAL_PI;
 	#endif
	vec3 singleScatteringDielectric = vec3( 0.0 );
	vec3 multiScatteringDielectric = vec3( 0.0 );
	vec3 singleScatteringMetallic = vec3( 0.0 );
	vec3 multiScatteringMetallic = vec3( 0.0 );
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( material.dfg, material.specularColor, material.specularF90, material.iridescence, material.iridescenceF0Dielectric, singleScatteringDielectric, multiScatteringDielectric );
		computeMultiscatteringIridescence( material.dfg, material.diffuseColor, material.specularF90, material.iridescence, material.iridescenceF0Metallic, singleScatteringMetallic, multiScatteringMetallic );
	#else
		computeMultiscattering( material.dfg, material.specularColor, material.specularF90, singleScatteringDielectric, multiScatteringDielectric );
		computeMultiscattering( material.dfg, material.diffuseColor, material.specularF90, singleScatteringMetallic, multiScatteringMetallic );
	#endif
	vec3 singleScattering = mix( singleScatteringDielectric, singleScatteringMetallic, material.metalness );
	vec3 multiScattering = mix( multiScatteringDielectric, multiScatteringMetallic, material.metalness );
	vec3 totalScatteringDielectric = singleScatteringDielectric + multiScatteringDielectric;
	vec3 diffuse = material.diffuseContribution * ( 1.0 - totalScatteringDielectric );
	vec3 cosineWeightedIrradiance = irradiance * RECIPROCAL_PI;
	vec3 indirectSpecular = radiance * singleScattering;
	indirectSpecular += multiScattering * cosineWeightedIrradiance;
	vec3 indirectDiffuse = diffuse * cosineWeightedIrradiance;
	#ifdef USE_SHEEN
		float sheenAlbedo = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * sheenAlbedo;
		indirectSpecular *= sheenEnergyComp;
		indirectDiffuse *= sheenEnergyComp;
	#endif
	reflectedLight.indirectSpecular += indirectSpecular;
	reflectedLight.indirectDiffuse += indirectDiffuse;
}
#define RE_Direct				RE_Direct_Physical
#define RE_Direct_RectArea		RE_Direct_RectArea_Physical
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Physical
#define RE_IndirectSpecular		RE_IndirectSpecular_Physical
float computeSpecularOcclusion( const in float dotNV, const in float ambientOcclusion, const in float roughness ) {
	return saturate( pow( dotNV + ambientOcclusion, exp2( - 16.0 * roughness - 1.0 ) ) - 1.0 + ambientOcclusion );
}`,Sf=`
vec3 geometryPosition = - vViewPosition;
vec3 geometryNormal = normal;
vec3 geometryViewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );
vec3 geometryClearcoatNormal = vec3( 0.0 );
#ifdef USE_CLEARCOAT
	geometryClearcoatNormal = clearcoatNormal;
#endif
#ifdef USE_IRIDESCENCE
	float dotNVi = saturate( dot( normal, geometryViewDir ) );
	if ( material.iridescenceThickness == 0.0 ) {
		material.iridescence = 0.0;
	} else {
		material.iridescence = saturate( material.iridescence );
	}
	if ( material.iridescence > 0.0 ) {
		vec3 iridescenceFresnelDielectric = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.specularColor );
		vec3 iridescenceFresnelMetallic = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.diffuseColor );
		material.iridescenceFresnel = mix( iridescenceFresnelDielectric, iridescenceFresnelMetallic, material.metalness );
		material.iridescenceF0Dielectric = Schlick_to_F0( iridescenceFresnelDielectric, 1.0, dotNVi );
		material.iridescenceF0Metallic = Schlick_to_F0( iridescenceFresnelMetallic, 1.0, dotNVi );
	}
#endif
#ifdef STANDARD
	float dotNVms = saturate( dot( geometryNormal, geometryViewDir ) );
	material.dfg = texture2D( dfgLUT, vec2( material.roughness, dotNVms ) ).rg;
	#if ( NUM_SUN_LIGHTS > 0 || NUM_DIR_LIGHTS > 0 || NUM_POINT_LIGHTS > 0 || NUM_SPOT_LIGHTS > 0 )
		float EssMs = material.dfg.x + material.dfg.y;
		material.multiScatteringCompensation = 1.0 + material.specularColorBlended * ( 1.0 / EssMs - 1.0 );
	#endif
#endif
IncidentLight directLight;
#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )
	PointLight pointLight;
	#if defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {
		pointLight = pointLights[ i ];
		getPointLightInfo( pointLight, geometryPosition, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS ) && ( defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_BASIC ) )
		pointLightShadow = pointLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowIntensity, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )
	SpotLight spotLight;
	vec4 spotColor;
	vec3 spotLightCoord;
	bool inSpotLightMap;
	#if defined( USE_SHADOWMAP ) && NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {
		spotLight = spotLights[ i ];
		getSpotLightInfo( spotLight, geometryPosition, directLight );
		#if ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#define SPOT_LIGHT_MAP_INDEX UNROLLED_LOOP_INDEX
		#elif ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		#define SPOT_LIGHT_MAP_INDEX NUM_SPOT_LIGHT_MAPS
		#else
		#define SPOT_LIGHT_MAP_INDEX ( UNROLLED_LOOP_INDEX - NUM_SPOT_LIGHT_SHADOWS + NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#endif
		#if ( SPOT_LIGHT_MAP_INDEX < NUM_SPOT_LIGHT_MAPS )
			spotLightCoord = vSpotLightCoord[ i ].xyz / vSpotLightCoord[ i ].w;
			inSpotLightMap = all( lessThan( abs( spotLightCoord * 2. - 1. ), vec3( 1.0 ) ) );
			spotColor = texture2D( spotLightMap[ SPOT_LIGHT_MAP_INDEX ], spotLightCoord.xy );
			directLight.color = inSpotLightMap ? directLight.color * spotColor.rgb : directLight.color;
		#endif
		#undef SPOT_LIGHT_MAP_INDEX
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		spotLightShadow = spotLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowIntensity, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SUN_LIGHTS > 0 ) && defined( RE_Direct )
	SunLight sunLight;
	#if defined( USE_SHADOWMAP ) && NUM_SUN_LIGHT_SHADOWS > 0
	SunLightShadow sunLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SUN_LIGHTS; i ++ ) {
		sunLight = sunLights[ i ];
		getSunLightInfo( sunLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SUN_LIGHT_SHADOWS )
		sunLightShadow = sunLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getSunShadow( sunShadowMap[ i ], sunLightShadow, UNROLLED_LOOP_INDEX ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )
	DirectionalLight directionalLight;
	#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
		directionalLight = directionalLights[ i ];
		getDirectionalLightInfo( directionalLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )
		directionalLightShadow = directionalLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowIntensity, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )
	RectAreaLight rectAreaLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {
		rectAreaLight = rectAreaLights[ i ];
		RE_Direct_RectArea( rectAreaLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if defined( RE_IndirectDiffuse )
	vec3 iblIrradiance = vec3( 0.0 );
	vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );
	#if defined( USE_LIGHT_PROBES )
		irradiance += getLightProbeIrradiance( lightProbe, geometryNormal );
	#endif
	#if ( NUM_HEMI_LIGHTS > 0 )
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {
			irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometryNormal );
		}
		#pragma unroll_loop_end
	#endif
	#ifdef USE_LIGHT_PROBES_GRID
		vec3 probeWorldPos = ( ( vec4( geometryPosition, 1.0 ) - viewMatrix[ 3 ] ) * viewMatrix ).xyz;
		vec3 probeWorldNormal = transformNormalByInverseViewMatrix( geometryNormal, viewMatrix );
		irradiance += getLightProbeGridIrradiance( probeWorldPos, probeWorldNormal );
	#endif
#endif
#if defined( RE_IndirectSpecular )
	vec3 radiance = vec3( 0.0 );
	vec3 clearcoatRadiance = vec3( 0.0 );
#endif`,Mf=`#if defined( RE_IndirectDiffuse )
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
		irradiance += lightMapIrradiance;
	#endif
	#if defined( USE_ENVMAP ) && defined( ENVMAP_TYPE_CUBE_UV )
		#if defined( STANDARD ) || defined( LAMBERT ) || defined( PHONG )
			iblIrradiance += getIBLIrradiance( geometryNormal );
		#endif
	#endif
#endif
#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )
	#ifdef USE_ANISOTROPY
		vec3 iblRadiance = getIBLAnisotropyRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
	#else
		vec3 iblRadiance = getIBLRadiance( geometryViewDir, geometryNormal, material.roughness );
	#endif
	#ifdef USE_RETROREFLECTION
		#ifdef USE_ANISOTROPY
			vec3 retroIBLRadiance = getIBLAnisotropyRetroRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
		#else
			vec3 retroIBLRadiance = getIBLRetroRadiance( geometryViewDir, geometryNormal, material.roughness );
		#endif
		iblRadiance = mix( iblRadiance, retroIBLRadiance, saturate( material.retroreflectivity ) );
	#endif
	radiance += iblRadiance;
	#ifdef USE_CLEARCOAT
		clearcoatRadiance += getIBLRadiance( geometryViewDir, geometryClearcoatNormal, material.clearcoatRoughness );
	#endif
#endif`,yf=`#if defined( RE_IndirectDiffuse )
	#if defined( LAMBERT ) || defined( PHONG )
		irradiance += iblIrradiance;
	#endif
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,Ef=`#ifdef USE_LIGHT_PROBES_GRID
uniform highp sampler3D probesSH;
uniform vec3 probesMin;
uniform vec3 probesMax;
uniform vec3 probesResolution;
vec3 getLightProbeGridIrradiance( vec3 worldPos, vec3 worldNormal ) {
	vec3 res = probesResolution;
	vec3 gridRange = probesMax - probesMin;
	vec3 resMinusOne = res - 1.0;
	vec3 probeSpacing = gridRange / resMinusOne;
	vec3 samplePos = worldPos + worldNormal * probeSpacing * 0.5;
	vec3 uvw = clamp( ( samplePos - probesMin ) / gridRange, 0.0, 1.0 );
	uvw = uvw * resMinusOne / res + 0.5 / res;
	float nz          = res.z;
	float paddedSlices = nz + 2.0;
	float atlasDepth  = 7.0 * paddedSlices;
	float uvZBase     = uvw.z * nz + 1.0;
	vec4 s0 = texture( probesSH, vec3( uvw.xy, ( uvZBase                       ) / atlasDepth ) );
	vec4 s1 = texture( probesSH, vec3( uvw.xy, ( uvZBase +       paddedSlices   ) / atlasDepth ) );
	vec4 s2 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 2.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s3 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 3.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s4 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 4.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s5 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 5.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s6 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 6.0 * paddedSlices   ) / atlasDepth ) );
	vec3 c0 = s0.xyz;
	vec3 c1 = vec3( s0.w, s1.xy );
	vec3 c2 = vec3( s1.zw, s2.x );
	vec3 c3 = s2.yzw;
	vec3 c4 = s3.xyz;
	vec3 c5 = vec3( s3.w, s4.xy );
	vec3 c6 = vec3( s4.zw, s5.x );
	vec3 c7 = s5.yzw;
	vec3 c8 = s6.xyz;
	float x = worldNormal.x, y = worldNormal.y, z = worldNormal.z;
	vec3 result = c0 * 0.886227;
	result += c1 * 2.0 * 0.511664 * y;
	result += c2 * 2.0 * 0.511664 * z;
	result += c3 * 2.0 * 0.511664 * x;
	result += c4 * 2.0 * 0.429043 * x * y;
	result += c5 * 2.0 * 0.429043 * y * z;
	result += c6 * ( 0.743125 * z * z - 0.247708 );
	result += c7 * 2.0 * 0.429043 * x * z;
	result += c8 * 0.429043 * ( x * x - y * y );
	return max( result, vec3( 0.0 ) );
}
#endif`,bf=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,Tf=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,Af=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,wf=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,Rf=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,Cf=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,Pf=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
	#if defined( USE_POINTS_UV )
		vec2 uv = vUv;
	#else
		vec2 uv = ( uvTransform * vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;
	#endif
#endif
#ifdef USE_MAP
	diffuseColor *= texture2D( map, uv );
#endif
#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, uv ).g;
#endif`,Lf=`#if defined( USE_POINTS_UV )
	varying vec2 vUv;
#else
	#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
		uniform mat3 uvTransform;
	#endif
#endif
#ifdef USE_MAP
	uniform sampler2D map;
#endif
#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,Df=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,If=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,Nf=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,Uf=`#if defined( USE_MORPHCOLORS )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,Ff=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,Of=`#ifdef USE_MORPHTARGETS
	#ifndef USE_INSTANCING_MORPH
		uniform float morphTargetBaseInfluence;
		uniform float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	#endif
	uniform sampler2DArray morphTargetsTexture;
	uniform ivec2 morphTargetsTextureSize;
	vec4 getMorph( const in int vertexIndex, const in int morphTargetIndex, const in int offset ) {
		int texelIndex = vertexIndex * MORPHTARGETS_TEXTURE_STRIDE + offset;
		int y = texelIndex / morphTargetsTextureSize.x;
		int x = texelIndex - y * morphTargetsTextureSize.x;
		ivec3 morphUV = ivec3( x, y, morphTargetIndex );
		return texelFetch( morphTargetsTexture, morphUV, 0 );
	}
#endif`,Bf=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,zf=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
#ifdef FLAT_SHADED
	vec3 fdx = dFdx( vViewPosition );
	vec3 fdy = dFdy( vViewPosition );
	vec3 normal = normalize( cross( fdx, fdy ) );
#else
	vec3 normal = normalize( vNormal );
	#ifdef DOUBLE_SIDED
		normal *= faceDirection;
	#endif
#endif
#if defined( USE_NORMALMAP_TANGENTSPACE ) || defined( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY )
	#ifdef USE_TANGENT
		mat3 tbn = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn = getTangentFrame( - vViewPosition, normal,
		#if defined( USE_NORMALMAP )
			vNormalMapUv
		#elif defined( USE_CLEARCOAT_NORMALMAP )
			vClearcoatNormalMapUv
		#else
			vUv
		#endif
		);
	#endif
	#ifdef DOUBLE_SIDED
		tbn[0] *= faceDirection;
		tbn[1] *= faceDirection;
	#endif
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	#ifdef USE_TANGENT
		mat3 tbn2 = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn2 = getTangentFrame( - vViewPosition, normal, vClearcoatNormalMapUv );
	#endif
	#ifdef DOUBLE_SIDED
		tbn2[0] *= faceDirection;
		tbn2[1] *= faceDirection;
	#endif
#endif
vec3 nonPerturbedNormal = normal;`,Gf=`#ifdef USE_NORMALMAP_OBJECTSPACE
	normal = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#ifdef FLIP_SIDED
		normal = - normal;
	#endif
	#ifdef DOUBLE_SIDED
		normal = normal * faceDirection;
	#endif
	normal = normalize( normalMatrix * normal );
#elif defined( USE_NORMALMAP_TANGENTSPACE )
	vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#if defined( USE_PACKED_NORMALMAP )
		mapN = vec3( mapN.xy, sqrt( saturate( 1.0 - dot( mapN.xy, mapN.xy ) ) ) );
	#endif
	mapN.xy *= normalScale;
	normal = normalize( tbn * mapN );
#elif defined( USE_BUMPMAP )
	normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );
#endif`,Vf=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,kf=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,Hf=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
		#ifdef FLIP_SIDED
			vBitangent = - vBitangent;
		#endif
	#endif
#endif`,Wf=`#ifdef USE_NORMALMAP
	uniform sampler2D normalMap;
	uniform vec2 normalScale;
#endif
#ifdef USE_NORMALMAP_OBJECTSPACE
	uniform mat3 normalMatrix;
#endif
#if ! defined ( USE_TANGENT ) && ( defined ( USE_NORMALMAP_TANGENTSPACE ) || defined ( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY ) )
	mat3 getTangentFrame( vec3 eye_pos, vec3 surf_norm, vec2 uv ) {
		vec3 q0 = dFdx( eye_pos.xyz );
		vec3 q1 = dFdy( eye_pos.xyz );
		vec2 st0 = dFdx( uv.st );
		vec2 st1 = dFdy( uv.st );
		vec3 N = surf_norm;
		vec3 q1perp = cross( q1, N );
		vec3 q0perp = cross( N, q0 );
		vec3 T = q1perp * st0.x + q0perp * st1.x;
		vec3 B = q1perp * st0.y + q0perp * st1.y;
		float det = max( dot( T, T ), dot( B, B ) );
		float scale = ( det == 0.0 ) ? 0.0 : inversesqrt( det );
		return mat3( T * scale, B * scale, N );
	}
#endif`,Xf=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,qf=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,Yf=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,Zf=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,Kf=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,Jf=`vec3 packNormalToRGB( const in vec3 normal ) {
	return normalize( normal ) * 0.5 + 0.5;
}
vec3 unpackRGBToNormal( const in vec3 rgb ) {
	return 2.0 * rgb.xyz - 1.0;
}
const float PackUpscale = 256. / 255.;const float UnpackDownscale = 255. / 256.;const float ShiftRight8 = 1. / 256.;
const float Inv255 = 1. / 255.;
const vec4 PackFactors = vec4( 1.0, 256.0, 256.0 * 256.0, 256.0 * 256.0 * 256.0 );
const vec2 UnpackFactors2 = vec2( UnpackDownscale, 1.0 / PackFactors.g );
const vec3 UnpackFactors3 = vec3( UnpackDownscale / PackFactors.rg, 1.0 / PackFactors.b );
const vec4 UnpackFactors4 = vec4( UnpackDownscale / PackFactors.rgb, 1.0 / PackFactors.a );
vec4 packDepthToRGBA( const in float v ) {
	if( v <= 0.0 )
		return vec4( 0., 0., 0., 0. );
	if( v >= 1.0 )
		return vec4( 1., 1., 1., 1. );
	float vuf;
	float af = modf( v * PackFactors.a, vuf );
	float bf = modf( vuf * ShiftRight8, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec4( vuf * Inv255, gf * PackUpscale, bf * PackUpscale, af );
}
vec3 packDepthToRGB( const in float v ) {
	if( v <= 0.0 )
		return vec3( 0., 0., 0. );
	if( v >= 1.0 )
		return vec3( 1., 1., 1. );
	float vuf;
	float bf = modf( v * PackFactors.b, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec3( vuf * Inv255, gf * PackUpscale, bf );
}
vec2 packDepthToRG( const in float v ) {
	if( v <= 0.0 )
		return vec2( 0., 0. );
	if( v >= 1.0 )
		return vec2( 1., 1. );
	float vuf;
	float gf = modf( v * 256., vuf );
	return vec2( vuf * Inv255, gf );
}
float unpackRGBAToDepth( const in vec4 v ) {
	return dot( v, UnpackFactors4 );
}
float unpackRGBToDepth( const in vec3 v ) {
	return dot( v, UnpackFactors3 );
}
float unpackRGToDepth( const in vec2 v ) {
	return v.r * UnpackFactors2.r + v.g * UnpackFactors2.g;
}
vec4 pack2HalfToRGBA( const in vec2 v ) {
	vec4 r = vec4( v.x, fract( v.x * 255.0 ), v.y, fract( v.y * 255.0 ) );
	return vec4( r.x - r.y / 255.0, r.y, r.z - r.w / 255.0, r.w );
}
vec2 unpackRGBATo2Half( const in vec4 v ) {
	return vec2( v.x + ( v.y / 255.0 ), v.z + ( v.w / 255.0 ) );
}
float viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {
	return ( viewZ + near ) / ( near - far );
}
float orthographicDepthToViewZ( const in float depth, const in float near, const in float far ) {
	#ifdef USE_REVERSED_DEPTH_BUFFER
	
		return depth * ( far - near ) - far;
	#else
		return depth * ( near - far ) - near;
	#endif
}
float viewZToPerspectiveDepth( const in float viewZ, const in float near, const in float far ) {
	return ( ( near + viewZ ) * far ) / ( ( far - near ) * viewZ );
}
float perspectiveDepthToViewZ( const in float depth, const in float near, const in float far ) {
	
	#ifdef USE_REVERSED_DEPTH_BUFFER
		return ( near * far ) / ( ( near - far ) * depth - near );
	#else
		return ( near * far ) / ( ( far - near ) * depth - far );
	#endif
}`,$f=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,Qf=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,jf=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,td=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,ed=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,nd=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,id=`#if NUM_SPOT_LIGHT_COORDS > 0
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#if NUM_SPOT_LIGHT_MAPS > 0
	uniform sampler2D spotLightMap[ NUM_SPOT_LIGHT_MAPS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_SUN_LIGHT_SHADOWS > 0
		#define SUN_LIGHT_CASCADES 2
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow sunShadowMap[ NUM_SUN_LIGHT_SHADOWS ];
		#else
			uniform sampler2D sunShadowMap[ NUM_SUN_LIGHT_SHADOWS ];
		#endif
		uniform mat4 sunShadowMatrix[ NUM_SUN_LIGHT_SHADOWS * SUN_LIGHT_CASCADES ];
		uniform vec4 sunShadowCascade[ NUM_SUN_LIGHT_SHADOWS * SUN_LIGHT_CASCADES ];
		varying vec4 vSunShadowWorldPosition;
		varying vec3 vSunShadowWorldNormal;
		struct SunLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SunLightShadow sunLightShadows[ NUM_SUN_LIGHT_SHADOWS ];
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		#else
			uniform sampler2D directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		#endif
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		#else
			uniform sampler2D spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		#endif
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform samplerCubeShadow pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		#elif defined( SHADOWMAP_TYPE_BASIC )
			uniform samplerCube pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		#endif
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
	#if defined( SHADOWMAP_TYPE_PCF )
		float interleavedGradientNoise( vec2 position ) {
			return fract( 52.9829189 * fract( dot( position, vec2( 0.06711056, 0.00583715 ) ) ) );
		}
		vec2 vogelDiskSample( int sampleIndex, int samplesCount, float phi ) {
			const float goldenAngle = 2.399963229728653;
			float r = sqrt( ( float( sampleIndex ) + 0.5 ) / float( samplesCount ) );
			float theta = float( sampleIndex ) * goldenAngle + phi;
			return vec2( cos( theta ), sin( theta ) ) * r;
		}
	#endif
	#if defined( SHADOWMAP_TYPE_PCF )
		float getShadow( sampler2DShadow shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			shadowCoord.z += shadowBias;
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
				float radius = shadowRadius * texelSize.x;
				float phi = interleavedGradientNoise( gl_FragCoord.xy ) * PI2;
				shadow = (
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 0, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 1, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 2, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 3, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 4, 5, phi ) * radius, shadowCoord.z ) )
				) * 0.2;
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#elif defined( SHADOWMAP_TYPE_VSM )
		float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				shadowCoord.z -= shadowBias;
			#else
				shadowCoord.z += shadowBias;
			#endif
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				vec2 distribution = texture2D( shadowMap, shadowCoord.xy ).rg;
				float mean = distribution.x;
				float variance = distribution.y * distribution.y;
				#ifdef USE_REVERSED_DEPTH_BUFFER
					float hard_shadow = step( mean, shadowCoord.z );
				#else
					float hard_shadow = step( shadowCoord.z, mean );
				#endif
				
				if ( hard_shadow == 1.0 ) {
					shadow = 1.0;
				} else {
					variance = max( variance, 0.0000001 );
					float d = shadowCoord.z - mean;
					float p_max = variance / ( variance + d * d );
					p_max = clamp( ( p_max - 0.3 ) / 0.65, 0.0, 1.0 );
					shadow = max( hard_shadow, p_max );
				}
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#else
		float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				shadowCoord.z -= shadowBias;
			#else
				shadowCoord.z += shadowBias;
			#endif
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				float depth = texture2D( shadowMap, shadowCoord.xy ).r;
				#ifdef USE_REVERSED_DEPTH_BUFFER
					shadow = step( depth, shadowCoord.z );
				#else
					shadow = step( shadowCoord.z, depth );
				#endif
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#endif
	#if NUM_SUN_LIGHT_SHADOWS > 0
		float getSunShadow(
			#if defined( SHADOWMAP_TYPE_PCF )
				sampler2DShadow shadowMap,
			#else
				sampler2D shadowMap,
			#endif
			SunLightShadow sunLightShadow,
			int shadowIndex
		) {
			vec4 shadowWorldPosition = vec4( vSunShadowWorldPosition.xyz + vSunShadowWorldNormal * sunLightShadow.shadowNormalBias, 1.0 );
			float viewDepth = vSunShadowWorldPosition.w;
			int cascadeOffset = shadowIndex * SUN_LIGHT_CASCADES;
			float shadow = 1.0;
			for ( int i = SUN_LIGHT_CASCADES - 1; i >= 0; i -- ) {
				vec4 cascade = sunShadowCascade[ cascadeOffset + i ];
				if ( viewDepth >= cascade.x && viewDepth < cascade.y ) {
					float cascadeShadow = getShadow(
						shadowMap,
						sunLightShadow.shadowMapSize,
						sunLightShadow.shadowIntensity,
						sunLightShadow.shadowBias,
						sunLightShadow.shadowRadius,
						sunShadowMatrix[ cascadeOffset + i ] * shadowWorldPosition
					);
					shadow = mix( cascadeShadow, shadow, smoothstep( cascade.z, cascade.y, viewDepth ) );
				}
			}
			return shadow;
		}
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
	#if defined( SHADOWMAP_TYPE_PCF )
	float getPointShadow( samplerCubeShadow shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		vec3 bd3D = normalize( lightToPosition );
		vec3 absVec = abs( lightToPosition );
		float viewSpaceZ = max( max( absVec.x, absVec.y ), absVec.z );
		if ( viewSpaceZ - shadowCameraFar <= 0.0 && viewSpaceZ - shadowCameraNear >= 0.0 ) {
			#ifdef USE_REVERSED_DEPTH_BUFFER
				float dp = ( shadowCameraNear * ( shadowCameraFar - viewSpaceZ ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
				dp -= shadowBias;
			#else
				float dp = ( shadowCameraFar * ( viewSpaceZ - shadowCameraNear ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
				dp += shadowBias;
			#endif
			float texelSize = shadowRadius / shadowMapSize.x;
			vec3 absDir = abs( bd3D );
			vec3 tangent = absDir.x > absDir.z ? vec3( 0.0, 1.0, 0.0 ) : vec3( 1.0, 0.0, 0.0 );
			tangent = normalize( cross( bd3D, tangent ) );
			vec3 bitangent = cross( bd3D, tangent );
			float phi = interleavedGradientNoise( gl_FragCoord.xy ) * PI2;
			vec2 sample0 = vogelDiskSample( 0, 5, phi );
			vec2 sample1 = vogelDiskSample( 1, 5, phi );
			vec2 sample2 = vogelDiskSample( 2, 5, phi );
			vec2 sample3 = vogelDiskSample( 3, 5, phi );
			vec2 sample4 = vogelDiskSample( 4, 5, phi );
			shadow = (
				texture( shadowMap, vec4( bd3D + ( tangent * sample0.x + bitangent * sample0.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample1.x + bitangent * sample1.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample2.x + bitangent * sample2.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample3.x + bitangent * sample3.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample4.x + bitangent * sample4.y ) * texelSize, dp ) )
			) * 0.2;
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	#elif defined( SHADOWMAP_TYPE_BASIC )
	float getPointShadow( samplerCube shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		vec3 absVec = abs( lightToPosition );
		float viewSpaceZ = max( max( absVec.x, absVec.y ), absVec.z );
		if ( viewSpaceZ - shadowCameraFar <= 0.0 && viewSpaceZ - shadowCameraNear >= 0.0 ) {
			float dp = ( shadowCameraFar * ( viewSpaceZ - shadowCameraNear ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
			dp += shadowBias;
			vec3 bd3D = normalize( lightToPosition );
			float depth = textureCube( shadowMap, bd3D ).r;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				depth = 1.0 - depth;
			#endif
			shadow = step( dp, depth );
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	#endif
	#endif
#endif`,sd=`#if NUM_SPOT_LIGHT_COORDS > 0
	uniform mat4 spotLightMatrix[ NUM_SPOT_LIGHT_COORDS ];
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_SUN_LIGHT_SHADOWS > 0
		varying vec4 vSunShadowWorldPosition;
		varying vec3 vSunShadowWorldNormal;
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform mat4 directionalShadowMatrix[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform mat4 pointShadowMatrix[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
#endif`,rd=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_SUN_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
	#ifdef HAS_NORMAL
		vec3 shadowWorldNormal = transformNormalByInverseViewMatrix( transformedNormal, viewMatrix );
	#else
		vec3 shadowWorldNormal = vec3( 0.0 );
	#endif
	vec4 shadowWorldPosition;
#endif
#if defined( USE_SHADOWMAP )
	#if NUM_SUN_LIGHT_SHADOWS > 0
		vSunShadowWorldPosition = vec4( worldPosition.xyz, - mvPosition.z );
		vSunShadowWorldNormal = shadowWorldNormal;
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * directionalLightShadows[ i ].shadowNormalBias, 0 );
			vDirectionalShadowCoord[ i ] = directionalShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * pointLightShadows[ i ].shadowNormalBias, 0 );
			vPointShadowCoord[ i ] = pointShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
#endif
#if NUM_SPOT_LIGHT_COORDS > 0
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_COORDS; i ++ ) {
		shadowWorldPosition = worldPosition;
		#if ( defined( USE_SHADOWMAP ) && UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
			shadowWorldPosition.xyz += shadowWorldNormal * spotLightShadows[ i ].shadowNormalBias;
		#endif
		vSpotLightCoord[ i ] = spotLightMatrix[ i ] * shadowWorldPosition;
	}
	#pragma unroll_loop_end
#endif`,ad=`float getShadowMask() {
	float shadow = 1.0;
	#ifdef USE_SHADOWMAP
	#if NUM_SUN_LIGHT_SHADOWS > 0
	SunLightShadow sunLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SUN_LIGHT_SHADOWS; i ++ ) {
		sunLight = sunLightShadows[ i ];
		shadow *= receiveShadow ? getSunShadow( sunShadowMap[ i ], sunLight, UNROLLED_LOOP_INDEX ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
		directionalLight = directionalLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowIntensity, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_SHADOWS; i ++ ) {
		spotLight = spotLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowIntensity, spotLight.shadowBias, spotLight.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0 && ( defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_BASIC ) )
	PointLightShadow pointLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
		pointLight = pointLightShadows[ i ];
		shadow *= receiveShadow ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowIntensity, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ], pointLight.shadowCameraNear, pointLight.shadowCameraFar ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#endif
	return shadow;
}`,od=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,ld=`#ifdef USE_SKINNING
	uniform mat4 bindMatrix;
	uniform mat4 bindMatrixInverse;
	uniform highp sampler2D boneTexture;
	mat4 getBoneMatrix( const in float i ) {
		int size = textureSize( boneTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( boneTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( boneTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( boneTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( boneTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
#endif`,cd=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,hd=`#ifdef USE_SKINNING
	mat4 skinMatrix = mat4( 0.0 );
	skinMatrix += skinWeight.x * boneMatX;
	skinMatrix += skinWeight.y * boneMatY;
	skinMatrix += skinWeight.z * boneMatZ;
	skinMatrix += skinWeight.w * boneMatW;
	skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;
	objectNormal = vec4( skinMatrix * vec4( objectNormal, 0.0 ) ).xyz;
	#ifdef USE_TANGENT
		objectTangent = vec4( skinMatrix * vec4( objectTangent, 0.0 ) ).xyz;
	#endif
#endif`,ud=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,fd=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,dd=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,pd=`#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
uniform float toneMappingExposure;
vec3 LinearToneMapping( vec3 color ) {
	return saturate( toneMappingExposure * color );
}
vec3 ReinhardToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	return saturate( color / ( vec3( 1.0 ) + color ) );
}
vec3 CineonToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	color = max( vec3( 0.0 ), color - 0.004 );
	return pow( ( color * ( 6.2 * color + 0.5 ) ) / ( color * ( 6.2 * color + 1.7 ) + 0.06 ), vec3( 2.2 ) );
}
vec3 RRTAndODTFit( vec3 v ) {
	vec3 a = v * ( v + 0.0245786 ) - 0.000090537;
	vec3 b = v * ( 0.983729 * v + 0.4329510 ) + 0.238081;
	return a / b;
}
vec3 ACESFilmicToneMapping( vec3 color ) {
	const mat3 ACESInputMat = mat3(
		vec3( 0.59719, 0.07600, 0.02840 ),		vec3( 0.35458, 0.90834, 0.13383 ),
		vec3( 0.04823, 0.01566, 0.83777 )
	);
	const mat3 ACESOutputMat = mat3(
		vec3(  1.60475, -0.10208, -0.00327 ),		vec3( -0.53108,  1.10813, -0.07276 ),
		vec3( -0.07367, -0.00605,  1.07602 )
	);
	color *= toneMappingExposure / 0.6;
	color = ACESInputMat * color;
	color = RRTAndODTFit( color );
	color = ACESOutputMat * color;
	return saturate( color );
}
const mat3 LINEAR_REC2020_TO_LINEAR_SRGB = mat3(
	vec3( 1.6605, - 0.1246, - 0.0182 ),
	vec3( - 0.5876, 1.1329, - 0.1006 ),
	vec3( - 0.0728, - 0.0083, 1.1187 )
);
const mat3 LINEAR_SRGB_TO_LINEAR_REC2020 = mat3(
	vec3( 0.6274, 0.0691, 0.0164 ),
	vec3( 0.3293, 0.9195, 0.0880 ),
	vec3( 0.0433, 0.0113, 0.8956 )
);
vec3 agxDefaultContrastApprox( vec3 x ) {
	vec3 x2 = x * x;
	vec3 x4 = x2 * x2;
	return + 15.5 * x4 * x2
		- 40.14 * x4 * x
		+ 31.96 * x4
		- 6.868 * x2 * x
		+ 0.4298 * x2
		+ 0.1191 * x
		- 0.00232;
}
vec3 AgXToneMapping( vec3 color ) {
	const mat3 AgXInsetMatrix = mat3(
		vec3( 0.856627153315983, 0.137318972929847, 0.11189821299995 ),
		vec3( 0.0951212405381588, 0.761241990602591, 0.0767994186031903 ),
		vec3( 0.0482516061458583, 0.101439036467562, 0.811302368396859 )
	);
	const mat3 AgXOutsetMatrix = mat3(
		vec3( 1.1271005818144368, - 0.1413297634984383, - 0.14132976349843826 ),
		vec3( - 0.11060664309660323, 1.157823702216272, - 0.11060664309660294 ),
		vec3( - 0.016493938717834573, - 0.016493938717834257, 1.2519364065950405 )
	);
	const float AgxMinEv = - 12.47393;	const float AgxMaxEv = 4.026069;
	color *= toneMappingExposure;
	color = LINEAR_SRGB_TO_LINEAR_REC2020 * color;
	color = AgXInsetMatrix * color;
	color = max( color, 1e-10 );	color = log2( color );
	color = ( color - AgxMinEv ) / ( AgxMaxEv - AgxMinEv );
	color = clamp( color, 0.0, 1.0 );
	color = agxDefaultContrastApprox( color );
	color = AgXOutsetMatrix * color;
	color = pow( max( vec3( 0.0 ), color ), vec3( 2.2 ) );
	color = LINEAR_REC2020_TO_LINEAR_SRGB * color;
	color = clamp( color, 0.0, 1.0 );
	return color;
}
vec3 NeutralToneMapping( vec3 color ) {
	const float StartCompression = 0.8 - 0.04;
	const float Desaturation = 0.15;
	color *= toneMappingExposure;
	float x = min( color.r, min( color.g, color.b ) );
	float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
	color -= offset;
	float peak = max( color.r, max( color.g, color.b ) );
	if ( peak < StartCompression ) return color;
	float d = 1. - StartCompression;
	float newPeak = 1. - d * d / ( peak + d - StartCompression );
	color *= newPeak / peak;
	float g = 1. - 1. / ( Desaturation * ( peak - newPeak ) + 1. );
	return mix( color, vec3( newPeak ), g );
}
vec3 CustomToneMapping( vec3 color ) { return color; }`,md=`#ifdef USE_TRANSMISSION
	material.transmission = transmission;
	material.transmissionAlpha = 1.0;
	material.thickness = thickness;
	material.attenuationDistance = attenuationDistance;
	material.attenuationColor = attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		material.transmission *= texture2D( transmissionMap, vTransmissionMapUv ).r;
	#endif
	#ifdef USE_THICKNESSMAP
		material.thickness *= texture2D( thicknessMap, vThicknessMapUv ).g;
	#endif
	vec3 pos = vWorldPosition;
	vec3 v = normalize( cameraPosition - pos );
	vec3 n = transformNormalByInverseViewMatrix( normal, viewMatrix );
	vec4 transmitted = getIBLVolumeRefraction(
		n, v, material.roughness, material.diffuseContribution, material.specularColorBlended, material.specularF90,
		pos, modelMatrix, viewMatrix, projectionMatrix, material.dispersion, material.ior, material.thickness,
		material.attenuationColor, material.attenuationDistance );
	material.transmissionAlpha = mix( material.transmissionAlpha, transmitted.a, material.transmission );
	totalDiffuse = mix( totalDiffuse, transmitted.rgb, material.transmission );
#endif`,gd=`#ifdef USE_TRANSMISSION
	uniform float transmission;
	uniform float thickness;
	uniform float attenuationDistance;
	uniform vec3 attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		uniform sampler2D transmissionMap;
	#endif
	#ifdef USE_THICKNESSMAP
		uniform sampler2D thicknessMap;
	#endif
	uniform vec2 transmissionSamplerSize;
	uniform sampler2D transmissionSamplerMap;
	uniform mat4 modelMatrix;
	uniform mat4 projectionMatrix;
	varying vec3 vWorldPosition;
	float w0( float a ) {
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - a + 3.0 ) - 3.0 ) + 1.0 );
	}
	float w1( float a ) {
		return ( 1.0 / 6.0 ) * ( a *  a * ( 3.0 * a - 6.0 ) + 4.0 );
	}
	float w2( float a ){
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - 3.0 * a + 3.0 ) + 3.0 ) + 1.0 );
	}
	float w3( float a ) {
		return ( 1.0 / 6.0 ) * ( a * a * a );
	}
	float g0( float a ) {
		return w0( a ) + w1( a );
	}
	float g1( float a ) {
		return w2( a ) + w3( a );
	}
	float h0( float a ) {
		return - 1.0 + w1( a ) / ( w0( a ) + w1( a ) );
	}
	float h1( float a ) {
		return 1.0 + w3( a ) / ( w2( a ) + w3( a ) );
	}
	vec4 bicubic( sampler2D tex, vec2 uv, vec4 texelSize, float lod ) {
		uv = uv * texelSize.zw + 0.5;
		vec2 iuv = floor( uv );
		vec2 fuv = fract( uv );
		float g0x = g0( fuv.x );
		float g1x = g1( fuv.x );
		float h0x = h0( fuv.x );
		float h1x = h1( fuv.x );
		float h0y = h0( fuv.y );
		float h1y = h1( fuv.y );
		vec2 p0 = ( vec2( iuv.x + h0x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p1 = ( vec2( iuv.x + h1x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p2 = ( vec2( iuv.x + h0x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		vec2 p3 = ( vec2( iuv.x + h1x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		return g0( fuv.y ) * ( g0x * textureLod( tex, p0, lod ) + g1x * textureLod( tex, p1, lod ) ) +
			g1( fuv.y ) * ( g0x * textureLod( tex, p2, lod ) + g1x * textureLod( tex, p3, lod ) );
	}
	vec4 textureBicubic( sampler2D sampler, vec2 uv, float lod ) {
		vec2 fLodSize = vec2( textureSize( sampler, int( lod ) ) );
		vec2 cLodSize = vec2( textureSize( sampler, int( lod + 1.0 ) ) );
		vec2 fLodSizeInv = 1.0 / fLodSize;
		vec2 cLodSizeInv = 1.0 / cLodSize;
		vec4 fSample = bicubic( sampler, uv, vec4( fLodSizeInv, fLodSize ), floor( lod ) );
		vec4 cSample = bicubic( sampler, uv, vec4( cLodSizeInv, cLodSize ), ceil( lod ) );
		return mix( fSample, cSample, fract( lod ) );
	}
	vec3 getVolumeTransmissionRay( const in vec3 n, const in vec3 v, const in float thickness, const in float ior, const in mat4 modelMatrix ) {
		vec3 refractionVector = refract( - v, normalize( n ), 1.0 / ior );
		vec3 modelScale;
		modelScale.x = length( vec3( modelMatrix[ 0 ].xyz ) );
		modelScale.y = length( vec3( modelMatrix[ 1 ].xyz ) );
		modelScale.z = length( vec3( modelMatrix[ 2 ].xyz ) );
		return normalize( refractionVector ) * thickness * modelScale;
	}
	float applyIorToRoughness( const in float roughness, const in float ior ) {
		return roughness * clamp( ior * 2.0 - 2.0, 0.0, 1.0 );
	}
	vec4 getTransmissionSample( const in vec2 fragCoord, const in float roughness, const in float ior ) {
		float lod = log2( transmissionSamplerSize.x ) * applyIorToRoughness( roughness, ior );
		return textureBicubic( transmissionSamplerMap, fragCoord.xy, lod );
	}
	vec3 volumeAttenuation( const in float transmissionDistance, const in vec3 attenuationColor, const in float attenuationDistance ) {
		if ( isinf( attenuationDistance ) ) {
			return vec3( 1.0 );
		} else {
			vec3 attenuationCoefficient = -log( attenuationColor ) / attenuationDistance;
			vec3 transmittance = exp( - attenuationCoefficient * transmissionDistance );			return transmittance;
		}
	}
	vec4 getIBLVolumeRefraction( const in vec3 n, const in vec3 v, const in float roughness, const in vec3 diffuseColor,
		const in vec3 specularColor, const in float specularF90, const in vec3 position, const in mat4 modelMatrix,
		const in mat4 viewMatrix, const in mat4 projMatrix, const in float dispersion, const in float ior, const in float thickness,
		const in vec3 attenuationColor, const in float attenuationDistance ) {
		vec4 transmittedLight;
		vec3 transmittance;
		#ifdef USE_DISPERSION
			float halfSpread = ( ior - 1.0 ) * 0.025 * dispersion;
			vec3 iors = vec3( ior - halfSpread, ior, ior + halfSpread );
			for ( int i = 0; i < 3; i ++ ) {
				vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, iors[ i ], modelMatrix );
				vec3 refractedRayExit = position + transmissionRay;
				vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
				vec2 refractionCoords = ndcPos.xy / ndcPos.w;
				refractionCoords += 1.0;
				refractionCoords /= 2.0;
				vec4 transmissionSample = getTransmissionSample( refractionCoords, roughness, iors[ i ] );
				transmittedLight[ i ] = transmissionSample[ i ];
				transmittedLight.a += transmissionSample.a;
				transmittance[ i ] = diffuseColor[ i ] * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance )[ i ];
			}
			transmittedLight.a /= 3.0;
		#else
			vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, ior, modelMatrix );
			vec3 refractedRayExit = position + transmissionRay;
			vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
			vec2 refractionCoords = ndcPos.xy / ndcPos.w;
			refractionCoords += 1.0;
			refractionCoords /= 2.0;
			transmittedLight = getTransmissionSample( refractionCoords, roughness, ior );
			transmittance = diffuseColor * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance );
		#endif
		vec3 attenuatedColor = transmittance * transmittedLight.rgb;
		vec3 F = EnvironmentBRDF( n, v, specularColor, specularF90, roughness );
		float transmittanceFactor = ( transmittance.r + transmittance.g + transmittance.b ) / 3.0;
		return vec4( ( 1.0 - F ) * attenuatedColor, 1.0 - ( 1.0 - transmittedLight.a ) * transmittanceFactor );
	}
#endif`,_d=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_SPECULARMAP
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,xd=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	uniform mat3 mapTransform;
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	uniform mat3 alphaMapTransform;
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	uniform mat3 lightMapTransform;
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	uniform mat3 aoMapTransform;
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	uniform mat3 bumpMapTransform;
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	uniform mat3 normalMapTransform;
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_DISPLACEMENTMAP
	uniform mat3 displacementMapTransform;
	varying vec2 vDisplacementMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	uniform mat3 emissiveMapTransform;
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	uniform mat3 metalnessMapTransform;
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	uniform mat3 roughnessMapTransform;
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	uniform mat3 anisotropyMapTransform;
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	uniform mat3 clearcoatMapTransform;
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform mat3 clearcoatNormalMapTransform;
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform mat3 clearcoatRoughnessMapTransform;
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	uniform mat3 sheenColorMapTransform;
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	uniform mat3 sheenRoughnessMapTransform;
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	uniform mat3 iridescenceMapTransform;
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform mat3 iridescenceThicknessMapTransform;
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SPECULARMAP
	uniform mat3 specularMapTransform;
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	uniform mat3 specularColorMapTransform;
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	uniform mat3 specularIntensityMapTransform;
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,vd=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	vUv = vec3( uv, 1 ).xy;
#endif
#ifdef USE_MAP
	vMapUv = ( mapTransform * vec3( MAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ALPHAMAP
	vAlphaMapUv = ( alphaMapTransform * vec3( ALPHAMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_LIGHTMAP
	vLightMapUv = ( lightMapTransform * vec3( LIGHTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_AOMAP
	vAoMapUv = ( aoMapTransform * vec3( AOMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_BUMPMAP
	vBumpMapUv = ( bumpMapTransform * vec3( BUMPMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_NORMALMAP
	vNormalMapUv = ( normalMapTransform * vec3( NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_DISPLACEMENTMAP
	vDisplacementMapUv = ( displacementMapTransform * vec3( DISPLACEMENTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_EMISSIVEMAP
	vEmissiveMapUv = ( emissiveMapTransform * vec3( EMISSIVEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_METALNESSMAP
	vMetalnessMapUv = ( metalnessMapTransform * vec3( METALNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ROUGHNESSMAP
	vRoughnessMapUv = ( roughnessMapTransform * vec3( ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ANISOTROPYMAP
	vAnisotropyMapUv = ( anisotropyMapTransform * vec3( ANISOTROPYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOATMAP
	vClearcoatMapUv = ( clearcoatMapTransform * vec3( CLEARCOATMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	vClearcoatNormalMapUv = ( clearcoatNormalMapTransform * vec3( CLEARCOAT_NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	vClearcoatRoughnessMapUv = ( clearcoatRoughnessMapTransform * vec3( CLEARCOAT_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCEMAP
	vIridescenceMapUv = ( iridescenceMapTransform * vec3( IRIDESCENCEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	vIridescenceThicknessMapUv = ( iridescenceThicknessMapTransform * vec3( IRIDESCENCE_THICKNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_COLORMAP
	vSheenColorMapUv = ( sheenColorMapTransform * vec3( SHEEN_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	vSheenRoughnessMapUv = ( sheenRoughnessMapTransform * vec3( SHEEN_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULARMAP
	vSpecularMapUv = ( specularMapTransform * vec3( SPECULARMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_COLORMAP
	vSpecularColorMapUv = ( specularColorMapTransform * vec3( SPECULAR_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	vSpecularIntensityMapUv = ( specularIntensityMapTransform * vec3( SPECULAR_INTENSITYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_TRANSMISSIONMAP
	vTransmissionMapUv = ( transmissionMapTransform * vec3( TRANSMISSIONMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_THICKNESSMAP
	vThicknessMapUv = ( thicknessMapTransform * vec3( THICKNESSMAP_UV, 1 ) ).xy;
#endif`,Sd=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`;const Md=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,yd=`uniform sampler2D t2D;
uniform float backgroundIntensity;
varying vec2 vUv;
void main() {
	vec4 texColor = texture2D( t2D, vUv );
	#ifdef DECODE_VIDEO_TEXTURE
		texColor = vec4( mix( pow( texColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), texColor.rgb * 0.0773993808, vec3( lessThanEqual( texColor.rgb, vec3( 0.04045 ) ) ) ), texColor.w );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Ed=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,bd=`#ifdef ENVMAP_TYPE_CUBE
	uniform samplerCube envMap;
#elif defined( ENVMAP_TYPE_CUBE_UV )
	uniform sampler2D envMap;
#endif
uniform float backgroundBlurriness;
uniform float backgroundIntensity;
uniform mat3 backgroundRotation;
varying vec3 vWorldDirection;
#include <cube_uv_reflection_fragment>
void main() {
	#ifdef ENVMAP_TYPE_CUBE
		vec4 texColor = textureCube( envMap, backgroundRotation * vWorldDirection );
	#elif defined( ENVMAP_TYPE_CUBE_UV )
		vec4 texColor = textureCubeUV( envMap, backgroundRotation * vWorldDirection, backgroundBlurriness );
	#else
		vec4 texColor = vec4( 0.0, 0.0, 0.0, 1.0 );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Td=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,Ad=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,wd=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
varying vec2 vHighPrecisionZW;
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vHighPrecisionZW = gl_Position.zw;
}`,Rd=`#if DEPTH_PACKING == 3200
	uniform float opacity;
#endif
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
varying vec2 vHighPrecisionZW;
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#if DEPTH_PACKING == 3200
		diffuseColor.a = opacity;
	#endif
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <logdepthbuf_fragment>
	#ifdef USE_REVERSED_DEPTH_BUFFER
		float fragCoordZ = vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ];
	#else
		float fragCoordZ = 0.5 * vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ] + 0.5;
	#endif
	#if DEPTH_PACKING == 3200
		gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );
	#elif DEPTH_PACKING == 3201
		gl_FragColor = packDepthToRGBA( fragCoordZ );
	#elif DEPTH_PACKING == 3202
		gl_FragColor = vec4( packDepthToRGB( fragCoordZ ), 1.0 );
	#elif DEPTH_PACKING == 3203
		gl_FragColor = vec4( packDepthToRG( fragCoordZ ), 0.0, 1.0 );
	#endif
}`,Cd=`#define DISTANCE
varying vec3 vWorldPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <worldpos_vertex>
	#include <clipping_planes_vertex>
	vWorldPosition = worldPosition.xyz;
}`,Pd=`#define DISTANCE
uniform vec3 referencePosition;
uniform float nearDistance;
uniform float farDistance;
varying vec3 vWorldPosition;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	float dist = length( vWorldPosition - referencePosition );
	dist = ( dist - nearDistance ) / ( farDistance - nearDistance );
	dist = saturate( dist );
	gl_FragColor = vec4( dist, 0.0, 0.0, 1.0 );
}`,Ld=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,Dd=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Id=`uniform float scale;
attribute float lineDistance;
varying float vLineDistance;
#include <common>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	vLineDistance = scale * lineDistance;
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,Nd=`uniform vec3 diffuse;
uniform float opacity;
uniform float dashSize;
uniform float totalSize;
varying float vLineDistance;
#include <common>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	if ( mod( vLineDistance, totalSize ) > dashSize ) {
		discard;
	}
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,Ud=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#if defined ( USE_ENVMAP ) || defined ( USE_SKINNING )
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinbase_vertex>
		#include <skinnormal_vertex>
		#include <defaultnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <fog_vertex>
}`,Fd=`uniform vec3 diffuse;
uniform float opacity;
#ifndef FLAT_SHADED
	varying vec3 vNormal;
#endif
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		reflectedLight.indirectDiffuse += lightMapTexel.rgb * lightMapIntensity * RECIPROCAL_PI;
	#else
		reflectedLight.indirectDiffuse += vec3( 1.0 );
	#endif
	#include <aomap_fragment>
	reflectedLight.indirectDiffuse *= diffuseColor.rgb;
	vec3 outgoingLight = reflectedLight.indirectDiffuse;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Od=`#define LAMBERT
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,Bd=`#define LAMBERT
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_lambert_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_lambert_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,zd=`#define MATCAP
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <displacementmap_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
	vViewPosition = - mvPosition.xyz;
}`,Gd=`#define MATCAP
uniform vec3 diffuse;
uniform float opacity;
uniform sampler2D matcap;
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	vec3 viewDir = normalize( vViewPosition );
	vec3 x = normalize( vec3( viewDir.z, 0.0, - viewDir.x ) );
	vec3 y = cross( viewDir, x );
	vec2 uv = vec2( dot( x, normal ), dot( y, normal ) ) * 0.495 + 0.5;
	#ifdef USE_MATCAP
		vec4 matcapColor = texture2D( matcap, uv );
	#else
		vec4 matcapColor = vec4( vec3( mix( 0.2, 0.8, uv.y ) ), 1.0 );
	#endif
	vec3 outgoingLight = diffuseColor.rgb * matcapColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Vd=`#define NORMAL
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	vViewPosition = - mvPosition.xyz;
#endif
}`,kd=`#define NORMAL
uniform float opacity;
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <uv_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 0.0, 0.0, 0.0, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	gl_FragColor = vec4( normalize( normal ) * 0.5 + 0.5, diffuseColor.a );
	#ifdef OPAQUE
		gl_FragColor.a = 1.0;
	#endif
}`,Hd=`#define PHONG
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,Wd=`#define PHONG
uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_phong_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Xd=`#define STANDARD
varying vec3 vViewPosition;
#ifdef USE_TRANSMISSION
	varying vec3 vWorldPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
#ifdef USE_TRANSMISSION
	vWorldPosition = worldPosition.xyz;
#endif
}`,qd=`#define STANDARD
#ifdef PHYSICAL
	#define IOR
	#define USE_SPECULAR
#endif
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float roughness;
uniform float metalness;
uniform float opacity;
#ifdef IOR
	uniform float ior;
#endif
#ifdef USE_SPECULAR
	uniform float specularIntensity;
	uniform vec3 specularColor;
	#ifdef USE_SPECULAR_COLORMAP
		uniform sampler2D specularColorMap;
	#endif
	#ifdef USE_SPECULAR_INTENSITYMAP
		uniform sampler2D specularIntensityMap;
	#endif
#endif
#ifdef USE_CLEARCOAT
	uniform float clearcoat;
	uniform float clearcoatRoughness;
#endif
#ifdef USE_DISPERSION
	uniform float dispersion;
#endif
#ifdef USE_RETROREFLECTION
	uniform float retroreflectivity;
#endif
#ifdef USE_IRIDESCENCE
	uniform float iridescence;
	uniform float iridescenceIOR;
	uniform float iridescenceThicknessMinimum;
	uniform float iridescenceThicknessMaximum;
#endif
#ifdef USE_SHEEN
	uniform vec3 sheenColor;
	uniform float sheenRoughness;
	#ifdef USE_SHEEN_COLORMAP
		uniform sampler2D sheenColorMap;
	#endif
	#ifdef USE_SHEEN_ROUGHNESSMAP
		uniform sampler2D sheenRoughnessMap;
	#endif
#endif
#ifdef USE_ANISOTROPY
	uniform vec2 anisotropyVector;
	#ifdef USE_ANISOTROPYMAP
		uniform sampler2D anisotropyMap;
	#endif
#endif
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <iridescence_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_physical_pars_fragment>
#include <transmission_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <clearcoat_pars_fragment>
#include <iridescence_pars_fragment>
#include <roughnessmap_pars_fragment>
#include <metalnessmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <roughnessmap_fragment>
	#include <metalnessmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <clearcoat_normal_fragment_begin>
	#include <clearcoat_normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_physical_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
	vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;
	#include <transmission_fragment>
	vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;
	#ifdef USE_SHEEN
 
		outgoingLight = outgoingLight + sheenSpecularDirect + sheenSpecularIndirect;
 
 	#endif
	#ifdef USE_CLEARCOAT
		float dotNVcc = saturate( dot( geometryClearcoatNormal, geometryViewDir ) );
		vec3 Fcc = F_Schlick( material.clearcoatF0, material.clearcoatF90, dotNVcc );
		outgoingLight = outgoingLight * ( 1.0 - material.clearcoat * Fcc ) + ( clearcoatSpecularDirect + clearcoatSpecularIndirect ) * material.clearcoat;
	#endif
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Yd=`#define TOON
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,Zd=`#define TOON
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <gradientmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_toon_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_toon_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Kd=`uniform float size;
uniform float scale;
#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
#ifdef USE_POINTS_UV
	varying vec2 vUv;
	uniform mat3 uvTransform;
#endif
void main() {
	#ifdef USE_POINTS_UV
		vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	#endif
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	gl_PointSize = size;
	#ifdef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z );
	#endif
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <fog_vertex>
}`,Jd=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <color_pars_fragment>
#include <map_particle_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_particle_fragment>
	#include <color_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,$d=`#include <common>
#include <batching_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <shadowmap_pars_vertex>
void main() {
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,Qd=`uniform vec3 color;
uniform float opacity;
#include <common>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <logdepthbuf_pars_fragment>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
void main() {
	#include <logdepthbuf_fragment>
	gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,jd=`uniform float rotation;
uniform vec2 center;
#include <common>
#include <uv_pars_vertex>
#include <fog_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	vec4 mvPosition = modelViewMatrix[ 3 ];
	vec2 scale = vec2( length( modelMatrix[ 0 ].xyz ), length( modelMatrix[ 1 ].xyz ) );
	#ifndef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) scale *= - mvPosition.z;
	#endif
	vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale;
	vec2 rotatedPosition;
	rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
	rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;
	mvPosition.xy += rotatedPosition;
	gl_Position = projectionMatrix * mvPosition;
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,tp=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,Jt={alphahash_fragment:Su,alphahash_pars_fragment:Mu,alphamap_fragment:yu,alphamap_pars_fragment:Eu,alphatest_fragment:bu,alphatest_pars_fragment:Tu,aomap_fragment:Au,aomap_pars_fragment:wu,batching_pars_vertex:Ru,batching_vertex:Cu,begin_vertex:Pu,beginnormal_vertex:Lu,bsdfs:Du,iridescence_fragment:Iu,bumpmap_pars_fragment:Nu,clipping_planes_fragment:Uu,clipping_planes_pars_fragment:Fu,clipping_planes_pars_vertex:Ou,clipping_planes_vertex:Bu,color_fragment:zu,color_pars_fragment:Gu,color_pars_vertex:Vu,color_vertex:ku,common:Hu,cube_uv_reflection_fragment:Wu,defaultnormal_vertex:Xu,displacementmap_pars_vertex:qu,displacementmap_vertex:Yu,emissivemap_fragment:Zu,emissivemap_pars_fragment:Ku,colorspace_fragment:Ju,colorspace_pars_fragment:$u,envmap_fragment:Qu,envmap_common_pars_fragment:ju,envmap_pars_fragment:tf,envmap_pars_vertex:ef,envmap_physical_pars_fragment:df,envmap_vertex:nf,fog_vertex:sf,fog_pars_vertex:rf,fog_fragment:af,fog_pars_fragment:of,gradientmap_pars_fragment:lf,lightmap_pars_fragment:cf,lights_lambert_fragment:hf,lights_lambert_pars_fragment:uf,lights_pars_begin:ff,lights_toon_fragment:pf,lights_toon_pars_fragment:mf,lights_phong_fragment:gf,lights_phong_pars_fragment:_f,lights_physical_fragment:xf,lights_physical_pars_fragment:vf,lights_fragment_begin:Sf,lights_fragment_maps:Mf,lights_fragment_end:yf,lightprobes_pars_fragment:Ef,logdepthbuf_fragment:bf,logdepthbuf_pars_fragment:Tf,logdepthbuf_pars_vertex:Af,logdepthbuf_vertex:wf,map_fragment:Rf,map_pars_fragment:Cf,map_particle_fragment:Pf,map_particle_pars_fragment:Lf,metalnessmap_fragment:Df,metalnessmap_pars_fragment:If,morphinstance_vertex:Nf,morphcolor_vertex:Uf,morphnormal_vertex:Ff,morphtarget_pars_vertex:Of,morphtarget_vertex:Bf,normal_fragment_begin:zf,normal_fragment_maps:Gf,normal_pars_fragment:Vf,normal_pars_vertex:kf,normal_vertex:Hf,normalmap_pars_fragment:Wf,clearcoat_normal_fragment_begin:Xf,clearcoat_normal_fragment_maps:qf,clearcoat_pars_fragment:Yf,iridescence_pars_fragment:Zf,opaque_fragment:Kf,packing:Jf,premultiplied_alpha_fragment:$f,project_vertex:Qf,dithering_fragment:jf,dithering_pars_fragment:td,roughnessmap_fragment:ed,roughnessmap_pars_fragment:nd,shadowmap_pars_fragment:id,shadowmap_pars_vertex:sd,shadowmap_vertex:rd,shadowmask_pars_fragment:ad,skinbase_vertex:od,skinning_pars_vertex:ld,skinning_vertex:cd,skinnormal_vertex:hd,specularmap_fragment:ud,specularmap_pars_fragment:fd,tonemapping_fragment:dd,tonemapping_pars_fragment:pd,transmission_fragment:md,transmission_pars_fragment:gd,uv_pars_fragment:_d,uv_pars_vertex:xd,uv_vertex:vd,worldpos_vertex:Sd,background_vert:Md,background_frag:yd,backgroundCube_vert:Ed,backgroundCube_frag:bd,cube_vert:Td,cube_frag:Ad,depth_vert:wd,depth_frag:Rd,distance_vert:Cd,distance_frag:Pd,equirect_vert:Ld,equirect_frag:Dd,linedashed_vert:Id,linedashed_frag:Nd,meshbasic_vert:Ud,meshbasic_frag:Fd,meshlambert_vert:Od,meshlambert_frag:Bd,meshmatcap_vert:zd,meshmatcap_frag:Gd,meshnormal_vert:Vd,meshnormal_frag:kd,meshphong_vert:Hd,meshphong_frag:Wd,meshphysical_vert:Xd,meshphysical_frag:qd,meshtoon_vert:Yd,meshtoon_frag:Zd,points_vert:Kd,points_frag:Jd,shadow_vert:$d,shadow_frag:Qd,sprite_vert:jd,sprite_frag:tp},Tt={common:{diffuse:{value:new jt(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new kt},alphaMap:{value:null},alphaMapTransform:{value:new kt},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new kt}},envmap:{envMap:{value:null},envMapRotation:{value:new kt},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98},dfgLUT:{value:null}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new kt}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new kt}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new kt},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new kt},normalScale:{value:new dt(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new kt},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new kt}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new kt}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new kt}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new jt(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},sunLights:{value:[],properties:{direction:{},color:{}}},sunLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},sunShadowMatrix:{value:[]},sunShadowCascade:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null},probesSH:{value:null},probesMin:{value:new H},probesMax:{value:new H},probesResolution:{value:new H}},points:{diffuse:{value:new jt(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new kt},alphaTest:{value:0},uvTransform:{value:new kt}},sprite:{diffuse:{value:new jt(16777215)},opacity:{value:1},center:{value:new dt(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new kt},alphaMap:{value:null},alphaMapTransform:{value:new kt},alphaTest:{value:0}}},en={basic:{uniforms:Pe([Tt.common,Tt.specularmap,Tt.envmap,Tt.aomap,Tt.lightmap,Tt.fog]),vertexShader:Jt.meshbasic_vert,fragmentShader:Jt.meshbasic_frag},lambert:{uniforms:Pe([Tt.common,Tt.specularmap,Tt.envmap,Tt.aomap,Tt.lightmap,Tt.emissivemap,Tt.bumpmap,Tt.normalmap,Tt.displacementmap,Tt.fog,Tt.lights,{emissive:{value:new jt(0)},envMapIntensity:{value:1}}]),vertexShader:Jt.meshlambert_vert,fragmentShader:Jt.meshlambert_frag},phong:{uniforms:Pe([Tt.common,Tt.specularmap,Tt.envmap,Tt.aomap,Tt.lightmap,Tt.emissivemap,Tt.bumpmap,Tt.normalmap,Tt.displacementmap,Tt.fog,Tt.lights,{emissive:{value:new jt(0)},specular:{value:new jt(1118481)},shininess:{value:30},envMapIntensity:{value:1}}]),vertexShader:Jt.meshphong_vert,fragmentShader:Jt.meshphong_frag},standard:{uniforms:Pe([Tt.common,Tt.envmap,Tt.aomap,Tt.lightmap,Tt.emissivemap,Tt.bumpmap,Tt.normalmap,Tt.displacementmap,Tt.roughnessmap,Tt.metalnessmap,Tt.fog,Tt.lights,{emissive:{value:new jt(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:Jt.meshphysical_vert,fragmentShader:Jt.meshphysical_frag},toon:{uniforms:Pe([Tt.common,Tt.aomap,Tt.lightmap,Tt.emissivemap,Tt.bumpmap,Tt.normalmap,Tt.displacementmap,Tt.gradientmap,Tt.fog,Tt.lights,{emissive:{value:new jt(0)}}]),vertexShader:Jt.meshtoon_vert,fragmentShader:Jt.meshtoon_frag},matcap:{uniforms:Pe([Tt.common,Tt.bumpmap,Tt.normalmap,Tt.displacementmap,Tt.fog,{matcap:{value:null}}]),vertexShader:Jt.meshmatcap_vert,fragmentShader:Jt.meshmatcap_frag},points:{uniforms:Pe([Tt.points,Tt.fog]),vertexShader:Jt.points_vert,fragmentShader:Jt.points_frag},dashed:{uniforms:Pe([Tt.common,Tt.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:Jt.linedashed_vert,fragmentShader:Jt.linedashed_frag},depth:{uniforms:Pe([Tt.common,Tt.displacementmap]),vertexShader:Jt.depth_vert,fragmentShader:Jt.depth_frag},normal:{uniforms:Pe([Tt.common,Tt.bumpmap,Tt.normalmap,Tt.displacementmap,{opacity:{value:1}}]),vertexShader:Jt.meshnormal_vert,fragmentShader:Jt.meshnormal_frag},sprite:{uniforms:Pe([Tt.sprite,Tt.fog]),vertexShader:Jt.sprite_vert,fragmentShader:Jt.sprite_frag},background:{uniforms:{uvTransform:{value:new kt},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:Jt.background_vert,fragmentShader:Jt.background_frag},backgroundCube:{uniforms:{envMap:{value:null},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new kt}},vertexShader:Jt.backgroundCube_vert,fragmentShader:Jt.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:Jt.cube_vert,fragmentShader:Jt.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:Jt.equirect_vert,fragmentShader:Jt.equirect_frag},distance:{uniforms:Pe([Tt.common,Tt.displacementmap,{referencePosition:{value:new H},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:Jt.distance_vert,fragmentShader:Jt.distance_frag},shadow:{uniforms:Pe([Tt.lights,Tt.fog,{color:{value:new jt(0)},opacity:{value:1}}]),vertexShader:Jt.shadow_vert,fragmentShader:Jt.shadow_frag}};en.physical={uniforms:Pe([en.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new kt},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new kt},clearcoatNormalScale:{value:new dt(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new kt},dispersion:{value:0},retroreflectivity:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new kt},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new kt},sheen:{value:0},sheenColor:{value:new jt(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new kt},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new kt},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new kt},transmissionSamplerSize:{value:new dt},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new kt},attenuationDistance:{value:0},attenuationColor:{value:new jt(0)},specularColor:{value:new jt(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new kt},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new kt},anisotropyVector:{value:new dt},anisotropyMap:{value:null},anisotropyMapTransform:{value:new kt}}]),vertexShader:Jt.meshphysical_vert,fragmentShader:Jt.meshphysical_frag};const xs={r:0,b:0,g:0},ep=new pe,Zl=new kt;Zl.set(-1,0,0,0,1,0,0,0,1);function np(i,t,e,n,s,r){const a=new jt(0);let o=s===!0?0:1,c,l,u=null,f=0,h=null;function p(P){let D=P.isScene===!0?P.background:null;if(D&&D.isTexture){const S=P.backgroundBlurriness>0;D=t.get(D,S)}return D}function _(P){let D=!1;const S=p(P);S===null?m(a,o):S&&S.isColor&&(m(S,1),D=!0);const w=i.xr.getEnvironmentBlendMode();w==="additive"?e.buffers.color.setClear(0,0,0,1,r):w==="alpha-blend"&&e.buffers.color.setClear(0,0,0,0,r),(i.autoClear||D)&&(e.buffers.depth.setTest(!0),e.buffers.depth.setMask(!0),e.buffers.color.setMask(!0),i.clear(i.autoClearColor,i.autoClearDepth,i.autoClearStencil))}function y(P,D){const S=p(D);S&&(S.isCubeTexture||S.mapping===Bs)?(l===void 0&&(l=new hn(new qi(1,1,1),new un({name:"BackgroundCubeMaterial",uniforms:vi(en.backgroundCube.uniforms),vertexShader:en.backgroundCube.vertexShader,fragmentShader:en.backgroundCube.fragmentShader,side:Ie,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),l.geometry.deleteAttribute("normal"),l.geometry.deleteAttribute("uv"),l.onBeforeRender=function(w,A,F){this.matrixWorld.copyPosition(F.matrixWorld)},Object.defineProperty(l.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),n.update(l)),l.material.uniforms.envMap.value=S,l.material.uniforms.backgroundBlurriness.value=D.backgroundBlurriness,l.material.uniforms.backgroundIntensity.value=D.backgroundIntensity,l.material.uniforms.backgroundRotation.value.setFromMatrix4(ep.makeRotationFromEuler(D.backgroundRotation)).transpose(),S.isCubeTexture&&S.isRenderTargetTexture===!1&&l.material.uniforms.backgroundRotation.value.premultiply(Zl),l.material.toneMapped=te.getTransfer(S.colorSpace)!==re,(u!==S||f!==S.version||h!==i.toneMapping)&&(l.material.needsUpdate=!0,u=S,f=S.version,h=i.toneMapping),l.layers.enableAll(),P.unshift(l,l.geometry,l.material,0,0,null)):S&&S.isTexture&&(c===void 0&&(c=new hn(new zs(2,2),new un({name:"BackgroundMaterial",uniforms:vi(en.background.uniforms),vertexShader:en.background.vertexShader,fragmentShader:en.background.fragmentShader,side:Xn,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),c.geometry.deleteAttribute("normal"),Object.defineProperty(c.material,"map",{get:function(){return this.uniforms.t2D.value}}),n.update(c)),c.material.uniforms.t2D.value=S,c.material.uniforms.backgroundIntensity.value=D.backgroundIntensity,c.material.toneMapped=te.getTransfer(S.colorSpace)!==re,S.matrixAutoUpdate===!0&&S.updateMatrix(),c.material.uniforms.uvTransform.value.copy(S.matrix),(u!==S||f!==S.version||h!==i.toneMapping)&&(c.material.needsUpdate=!0,u=S,f=S.version,h=i.toneMapping),c.layers.enableAll(),P.unshift(c,c.geometry,c.material,0,0,null))}function m(P,D){P.getRGB(xs,Hl(i)),e.buffers.color.setClear(xs.r,xs.g,xs.b,D,r)}function d(){l!==void 0&&(l.geometry.dispose(),l.material.dispose(),l=void 0),c!==void 0&&(c.geometry.dispose(),c.material.dispose(),c=void 0)}return{getClearColor:function(){return a},setClearColor:function(P,D=1){a.set(P),o=D,m(a,o)},getClearAlpha:function(){return o},setClearAlpha:function(P){o=P,m(a,o)},render:_,addToRenderList:y,dispose:d}}function ip(i,t){const e=i.getParameter(i.MAX_VERTEX_ATTRIBS),n={},s=h(null);let r=s,a=!1;function o(X,q,nt,G,J){let lt=!1;const K=f(X,G,nt,q);r!==K&&(r=K,l(r.object)),lt=p(X,G,nt,J),lt&&_(X,G,nt,J),J!==null&&t.update(J,i.ELEMENT_ARRAY_BUFFER),(lt||a)&&(a=!1,S(X,q,nt,G),J!==null&&i.bindBuffer(i.ELEMENT_ARRAY_BUFFER,t.get(J).buffer))}function c(){return i.createVertexArray()}function l(X){return i.bindVertexArray(X)}function u(X){return i.deleteVertexArray(X)}function f(X,q,nt,G){const J=G.wireframe===!0;let lt=n[q.id];lt===void 0&&(lt={},n[q.id]=lt);const K=X.isInstancedMesh===!0?X.id:0;let Z=lt[K];Z===void 0&&(Z={},lt[K]=Z);let it=Z[nt.id];it===void 0&&(it={},Z[nt.id]=it);let rt=it[J];return rt===void 0&&(rt=h(c()),it[J]=rt),rt}function h(X){const q=[],nt=[],G=[];for(let J=0;J<e;J++)q[J]=0,nt[J]=0,G[J]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:q,enabledAttributes:nt,attributeDivisors:G,object:X,attributes:{},index:null}}function p(X,q,nt,G){const J=r.attributes,lt=q.attributes;let K=0;const Z=nt.getAttributes();for(const it in Z)if(Z[it].location>=0){const ht=J[it];let Dt=lt[it];if(Dt===void 0&&(it==="instanceMatrix"&&X.instanceMatrix&&(Dt=X.instanceMatrix),it==="instanceColor"&&X.instanceColor&&(Dt=X.instanceColor)),ht===void 0||ht.attribute!==Dt||Dt&&ht.data!==Dt.data)return!0;K++}return r.attributesNum!==K||r.index!==G}function _(X,q,nt,G){const J={},lt=q.attributes;let K=0;const Z=nt.getAttributes();for(const it in Z)if(Z[it].location>=0){let ht=lt[it];ht===void 0&&(it==="instanceMatrix"&&X.instanceMatrix&&(ht=X.instanceMatrix),it==="instanceColor"&&X.instanceColor&&(ht=X.instanceColor));const Dt={};Dt.attribute=ht,ht&&ht.data&&(Dt.data=ht.data),J[it]=Dt,K++}r.attributes=J,r.attributesNum=K,r.index=G}function y(){const X=r.newAttributes;for(let q=0,nt=X.length;q<nt;q++)X[q]=0}function m(X){d(X,0)}function d(X,q){const nt=r.newAttributes,G=r.enabledAttributes,J=r.attributeDivisors;nt[X]=1,G[X]===0&&(i.enableVertexAttribArray(X),G[X]=1),J[X]!==q&&(i.vertexAttribDivisor(X,q),J[X]=q)}function P(){const X=r.newAttributes,q=r.enabledAttributes;for(let nt=0,G=q.length;nt<G;nt++)q[nt]!==X[nt]&&(i.disableVertexAttribArray(nt),q[nt]=0)}function D(X,q,nt,G,J,lt,K){K===!0?i.vertexAttribIPointer(X,q,nt,J,lt):i.vertexAttribPointer(X,q,nt,G,J,lt)}function S(X,q,nt,G){y();const J=G.attributes,lt=nt.getAttributes(),K=q.defaultAttributeValues;for(const Z in lt){const it=lt[Z];if(it.location>=0){let rt=J[Z];if(rt===void 0&&(Z==="instanceMatrix"&&X.instanceMatrix&&(rt=X.instanceMatrix),Z==="instanceColor"&&X.instanceColor&&(rt=X.instanceColor)),rt!==void 0){const ht=rt.normalized,Dt=rt.itemSize,Ct=t.get(rt);if(Ct===void 0)continue;const qt=Ct.buffer,Xt=Ct.type,Zt=Ct.bytesPerElement,N=Xt===i.INT||Xt===i.UNSIGNED_INT||rt.gpuType===ga;if(rt.isInterleavedBufferAttribute){const L=rt.data,C=L.stride,T=rt.offset;if(L.isInstancedInterleavedBuffer){for(let U=0;U<it.locationSize;U++)d(it.location+U,L.meshPerAttribute);X.isInstancedMesh!==!0&&G._maxInstanceCount===void 0&&(G._maxInstanceCount=L.meshPerAttribute*L.count)}else for(let U=0;U<it.locationSize;U++)m(it.location+U);i.bindBuffer(i.ARRAY_BUFFER,qt);for(let U=0;U<it.locationSize;U++)D(it.location+U,Dt/it.locationSize,Xt,ht,C*Zt,(T+Dt/it.locationSize*U)*Zt,N)}else{if(rt.isInstancedBufferAttribute){for(let L=0;L<it.locationSize;L++)d(it.location+L,rt.meshPerAttribute);X.isInstancedMesh!==!0&&G._maxInstanceCount===void 0&&(G._maxInstanceCount=rt.meshPerAttribute*rt.count)}else for(let L=0;L<it.locationSize;L++)m(it.location+L);i.bindBuffer(i.ARRAY_BUFFER,qt);for(let L=0;L<it.locationSize;L++)D(it.location+L,Dt/it.locationSize,Xt,ht,Dt*Zt,Dt/it.locationSize*L*Zt,N)}}else if(K!==void 0){const ht=K[Z];if(ht!==void 0)switch(ht.length){case 2:i.vertexAttrib2fv(it.location,ht);break;case 3:i.vertexAttrib3fv(it.location,ht);break;case 4:i.vertexAttrib4fv(it.location,ht);break;default:i.vertexAttrib1fv(it.location,ht)}}}}P()}function w(){R();for(const X in n){const q=n[X];for(const nt in q){const G=q[nt];for(const J in G){const lt=G[J];for(const K in lt)u(lt[K].object),delete lt[K];delete G[J]}}delete n[X]}}function A(X){if(n[X.id]===void 0)return;const q=n[X.id];for(const nt in q){const G=q[nt];for(const J in G){const lt=G[J];for(const K in lt)u(lt[K].object),delete lt[K];delete G[J]}}delete n[X.id]}function F(X){for(const q in n){const nt=n[q];for(const G in nt){const J=nt[G];if(J[X.id]===void 0)continue;const lt=J[X.id];for(const K in lt)u(lt[K].object),delete lt[K];delete J[X.id]}}}function v(X){for(const q in n){const nt=n[q],G=X.isInstancedMesh===!0?X.id:0,J=nt[G];if(J!==void 0){for(const lt in J){const K=J[lt];for(const Z in K)u(K[Z].object),delete K[Z];delete J[lt]}delete nt[G],Object.keys(nt).length===0&&delete n[q]}}}function R(){B(),a=!0,r!==s&&(r=s,l(r.object))}function B(){s.geometry=null,s.program=null,s.wireframe=!1}return{setup:o,reset:R,resetDefaultState:B,dispose:w,releaseStatesOfGeometry:A,releaseStatesOfObject:v,releaseStatesOfProgram:F,initAttributes:y,enableAttribute:m,disableUnusedAttributes:P}}function sp(i,t,e){let n;function s(c){n=c}function r(c,l){i.drawArrays(n,c,l),e.update(l,n,1)}function a(c,l,u){u!==0&&(i.drawArraysInstanced(n,c,l,u),e.update(l,n,u))}function o(c,l,u){if(u===0)return;t.get("WEBGL_multi_draw").multiDrawArraysWEBGL(n,c,0,l,0,u);let h=0;for(let p=0;p<u;p++)h+=l[p];e.update(h,n,1)}this.setMode=s,this.render=r,this.renderInstances=a,this.renderMultiDraw=o}function rp(i,t,e,n){let s;function r(){if(s!==void 0)return s;if(t.has("EXT_texture_filter_anisotropic")===!0){const F=t.get("EXT_texture_filter_anisotropic");s=i.getParameter(F.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else s=0;return s}function a(F){return!(F!==Ke&&n.convert(F)!==i.getParameter(i.IMPLEMENTATION_COLOR_READ_FORMAT))}function o(F){const v=F===cn&&(t.has("EXT_color_buffer_half_float")||t.has("EXT_color_buffer_float"));return!(F!==Be&&F!==sn&&!v&&n.convert(F)!==i.getParameter(i.IMPLEMENTATION_COLOR_READ_TYPE))}function c(F){if(F==="highp"){if(i.getShaderPrecisionFormat(i.VERTEX_SHADER,i.HIGH_FLOAT).precision>0&&i.getShaderPrecisionFormat(i.FRAGMENT_SHADER,i.HIGH_FLOAT).precision>0)return"highp";F="mediump"}return F==="mediump"&&i.getShaderPrecisionFormat(i.VERTEX_SHADER,i.MEDIUM_FLOAT).precision>0&&i.getShaderPrecisionFormat(i.FRAGMENT_SHADER,i.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}let l=e.precision!==void 0?e.precision:"highp";const u=c(l);u!==l&&(Wt("WebGLRenderer:",l,"not supported, using",u,"instead."),l=u);const f=e.logarithmicDepthBuffer===!0,h=e.reversedDepthBuffer===!0&&t.has("EXT_clip_control");e.reversedDepthBuffer===!0&&h===!1&&Wt("WebGLRenderer: Unable to use reversed depth buffer due to missing EXT_clip_control extension. Fallback to default depth buffer.");const p=i.getParameter(i.MAX_TEXTURE_IMAGE_UNITS),_=i.getParameter(i.MAX_VERTEX_TEXTURE_IMAGE_UNITS),y=i.getParameter(i.MAX_TEXTURE_SIZE),m=i.getParameter(i.MAX_CUBE_MAP_TEXTURE_SIZE),d=i.getParameter(i.MAX_VERTEX_ATTRIBS),P=i.getParameter(i.MAX_VERTEX_UNIFORM_VECTORS),D=i.getParameter(i.MAX_VARYING_VECTORS),S=i.getParameter(i.MAX_FRAGMENT_UNIFORM_VECTORS),w=i.getParameter(i.MAX_SAMPLES),A=i.getParameter(i.SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:r,getMaxPrecision:c,textureFormatReadable:a,textureTypeReadable:o,precision:l,logarithmicDepthBuffer:f,reversedDepthBuffer:h,maxTextures:p,maxVertexTextures:_,maxTextureSize:y,maxCubemapSize:m,maxAttributes:d,maxVertexUniforms:P,maxVaryings:D,maxFragmentUniforms:S,maxSamples:w,samples:A}}function ap(i){const t=this;let e=null,n=0,s=!1,r=!1;const a=new vn,o=new kt,c={value:null,needsUpdate:!1};this.uniform=c,this.numPlanes=0,this.numIntersection=0,this.init=function(f,h){const p=f.length!==0||h||n!==0||s;return s=h,n=f.length,p},this.beginShadows=function(){r=!0,u(null)},this.endShadows=function(){r=!1},this.setGlobalState=function(f,h){e=u(f,h,0)},this.setState=function(f,h,p){const _=f.clippingPlanes,y=f.clipIntersection,m=f.clipShadows,d=i.get(f);if(!s||_===null||_.length===0||r&&!m)r?u(null):l();else{const P=r?0:n,D=P*4;let S=d.clippingState||null;c.value=S,S=u(_,h,D,p);for(let w=0;w!==D;++w)S[w]=e[w];d.clippingState=S,this.numIntersection=y?this.numPlanes:0,this.numPlanes+=P}};function l(){c.value!==e&&(c.value=e,c.needsUpdate=n>0),t.numPlanes=n,t.numIntersection=0}function u(f,h,p,_){const y=f!==null?f.length:0;let m=null;if(y!==0){if(m=c.value,_!==!0||m===null){const d=p+y*4,P=h.matrixWorldInverse;o.getNormalMatrix(P),(m===null||m.length<d)&&(m=new Float32Array(d));for(let D=0,S=p;D!==y;++D,S+=4)a.copy(f[D]).applyMatrix4(P,o),a.normal.toArray(m,S),m[S+3]=a.constant}c.value=m,c.needsUpdate=!0}return t.numPlanes=y,t.numIntersection=0,m}}const fi=4,op=6,lp=20,cp=256,wi=new La,No=new jt;let vr=null,Sr=0,Mr=0,yr=!1;const hp=new H,kn=new H;class Uo{constructor(t){this._renderer=t,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._sizeLods=[],this._lodMeshes=[],this._backgroundBox=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._blurMaterial=null,this._ggxMaterial=null}fromScene(t,e=0,n=.1,s=100,r={}){const{size:a=256,position:o=hp}=r;vr=this._renderer.getRenderTarget(),Sr=this._renderer.getActiveCubeFace(),Mr=this._renderer.getActiveMipmapLevel(),yr=this._renderer.xr.enabled,this._renderer.xr.enabled=!1,this._setSize(a);const c=this._allocateTargets();return c.depthBuffer=!0,this._sceneToCubeUV(t,n,s,c,o),e>0&&this._blur(c,0,0,e),this._applyPMREM(c),this._cleanup(c),c}fromEquirectangular(t,e=null){return this._fromTexture(t,e)}fromCubemap(t,e=null){return this._fromTexture(t,e)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=Bo(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=Oo(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose(),this._backgroundBox!==null&&(this._backgroundBox.geometry.dispose(),this._backgroundBox.material.dispose())}_setSize(t){this._lodMax=Math.floor(Math.log2(t)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._ggxMaterial!==null&&this._ggxMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let t=0;t<this._lodMeshes.length;t++)this._lodMeshes[t].geometry.dispose()}_cleanup(t){this._renderer.setRenderTarget(vr,Sr,Mr),this._renderer.xr.enabled=yr,t.scissorTest=!1,ci(t,0,0,t.width,t.height)}_fromTexture(t,e){t.mapping===qn||t.mapping===gi?this._setSize(t.image.length===0?16:t.image[0].width||t.image[0].image.width):this._setSize(t.image.width/4),vr=this._renderer.getRenderTarget(),Sr=this._renderer.getActiveCubeFace(),Mr=this._renderer.getActiveMipmapLevel(),yr=this._renderer.xr.enabled,this._renderer.xr.enabled=!1;const n=e||this._allocateTargets();return this._textureToCubeUV(t,n),this._applyPMREM(n),this._cleanup(n),n}_allocateTargets(){const t=3*Math.max(this._cubeSize,112),e=4*this._cubeSize,n={magFilter:Ae,minFilter:Ae,generateMipmaps:!1,type:cn,format:Ke,colorSpace:Ds,depthBuffer:!1},s=Fo(t,e,n);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==t||this._pingPongRenderTarget.height!==e){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=Fo(t,e,n);const{_lodMax:r}=this;({lodMeshes:this._lodMeshes,sizeLods:this._sizeLods}=up(r)),this._blurMaterial=dp(r,t,e),this._ggxMaterial=fp(r,t,e)}return s}_compileMaterial(t){const e=new hn(new ke,t);this._renderer.compile(e,wi)}_sceneToCubeUV(t,e,n,s,r){const c=new Ve(90,1,e,n),l=[1,-1,1,1,1,1],u=[1,1,1,-1,-1,-1],f=this._renderer,h=f.autoClear,p=f.toneMapping;f.getClearColor(No),f.toneMapping=an,f.autoClear=!1,f.state.buffers.depth.getReversed()&&(f.setRenderTarget(s),f.clearDepth(),f.setRenderTarget(null)),this._backgroundBox===null&&(this._backgroundBox=new hn(new qi,new Us({name:"PMREM.Background",side:Ie,depthWrite:!1,depthTest:!1})));const y=this._backgroundBox,m=y.material;let d=!1;const P=t.background;P?P.isColor&&(m.color.copy(P),t.background=null,d=!0):(m.color.copy(No),d=!0);for(let D=0;D<6;D++){const S=D%3;S===0?(c.up.set(0,l[D],0),c.position.set(r.x,r.y,r.z),c.lookAt(r.x+u[D],r.y,r.z)):S===1?(c.up.set(0,0,l[D]),c.position.set(r.x,r.y,r.z),c.lookAt(r.x,r.y+u[D],r.z)):(c.up.set(0,l[D],0),c.position.set(r.x,r.y,r.z),c.lookAt(r.x,r.y,r.z+u[D]));const w=this._cubeSize;ci(s,S*w,D>2?w:0,w,w),f.setRenderTarget(s),d&&f.render(y,c),f.render(t,c)}f.toneMapping=p,f.autoClear=h,t.background=P}_textureToCubeUV(t,e){const n=this._renderer,s=t.mapping===qn||t.mapping===gi;s?(this._cubemapMaterial===null&&(this._cubemapMaterial=Bo()),this._cubemapMaterial.uniforms.flipEnvMap.value=t.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=Oo());const r=s?this._cubemapMaterial:this._equirectMaterial,a=this._lodMeshes[0];a.material=r;const o=r.uniforms;o.envMap.value=t;const c=this._cubeSize;ci(e,0,0,3*c,2*c),n.setRenderTarget(e),n.render(a,wi)}_applyPMREM(t){const e=this._renderer,n=e.autoClear;e.autoClear=!1;const s=this._lodMeshes.length;for(let r=1;r<s;r++)this._applyGGXFilter(t,r-1,r);e.autoClear=n}_applyGGXFilter(t,e,n){const s=this._renderer,r=this._pingPongRenderTarget,a=this._ggxMaterial,o=this._lodMeshes[n];o.material=a;const c=a.uniforms,l=n/(this._lodMeshes.length-1),u=e/(this._lodMeshes.length-1),f=Math.sqrt(l*l-u*u),h=l*1.25,p=f*h,{_lodMax:_}=this,y=this._sizeLods[n],m=3*y*(n>_-fi?n-_+fi:0),d=4*(this._cubeSize-y);c.envMap.value=t.texture,c.roughness.value=p,c.mipInt.value=_-e,ci(r,m,d,3*y,2*y),s.setRenderTarget(r),s.render(o,wi),c.envMap.value=r.texture,c.roughness.value=0,c.mipInt.value=_-n,ci(t,m,d,3*y,2*y),s.setRenderTarget(t),s.render(o,wi)}_blur(t,e,n,s){const r=this._pingPongRenderTarget,a=Math.min(s,Math.PI)/Math.SQRT2;this._blurPass(t,r,e,n,a),this._blurPass(r,t,n,n,a)}_blurPass(t,e,n,s,r){const a=this._renderer,o=this._blurMaterial,c=this._lodMeshes[s];c.material=o;const l=o.uniforms;l.envMap.value=t.texture,l.sigma.value=r,l.mipInt.value=this._lodMax-n;const u=this._sizeLods[s],f=3*u*(s>this._lodMax-fi?s-this._lodMax+fi:0),h=4*(this._cubeSize-u);ci(e,f,h,3*u,2*u),a.setRenderTarget(e),a.render(c,wi)}}function up(i){const t=[],e=[];let n=i;const s=i-fi+1+op;for(let r=0;r<s;r++){const a=Math.pow(2,n);t.push(a);const o=1/(a-2),c=-o,l=1+o,u=[c,c,l,c,l,l,c,c,l,l,c,l],f=6,h=6,p=3,_=new Float32Array(p*h*f),y=new Float32Array(p*h*f);for(let d=0;d<f;d++){const P=d%3*2/3-1,D=d>2?0:-1,S=[P,D,0,P+2/3,D,0,P+2/3,D+1,0,P,D,0,P+2/3,D+1,0,P,D+1,0];_.set(S,p*h*d);for(let w=0;w<h;w++){const A=u[w*2]*2-1,F=u[w*2+1]*2-1;d===0?kn.set(1,F,A):d===1?kn.set(-A,1,-F):d===2?kn.set(-A,F,1):d===3?kn.set(-1,F,-A):d===4?kn.set(-A,-1,F):kn.set(A,F,-1),kn.toArray(y,(d*h+w)*p)}}const m=new ke;m.setAttribute("position",new on(_,p)),m.setAttribute("outputDirection",new on(y,p)),e.push(new hn(m,null)),n>fi&&n--}return{lodMeshes:e,sizeLods:t}}function Fo(i,t,e){const n=new Je(i,t,e);return n.texture.mapping=Bs,n.texture.name="PMREM.cubeUv",n.scissorTest=!0,n}function ci(i,t,e,n,s){i.viewport.set(t,e,n,s),i.scissor.set(t,e,n,s)}function fp(i,t,e){return new un({name:"PMREMGGXConvolution",defines:{GGX_SAMPLES:cp,CUBEUV_TEXEL_WIDTH:1/t,CUBEUV_TEXEL_HEIGHT:1/e,CUBEUV_MAX_MIP:`${i}.0`},uniforms:{envMap:{value:null},roughness:{value:0},mipInt:{value:0}},vertexShader:Gs(),fragmentShader:`

			precision highp float;
			precision highp int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform float roughness;
			uniform float mipInt;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			#define PI 3.14159265359

			// Van der Corput radical inverse
			float radicalInverse_VdC(uint bits) {
				bits = (bits << 16u) | (bits >> 16u);
				bits = ((bits & 0x55555555u) << 1u) | ((bits & 0xAAAAAAAAu) >> 1u);
				bits = ((bits & 0x33333333u) << 2u) | ((bits & 0xCCCCCCCCu) >> 2u);
				bits = ((bits & 0x0F0F0F0Fu) << 4u) | ((bits & 0xF0F0F0F0u) >> 4u);
				bits = ((bits & 0x00FF00FFu) << 8u) | ((bits & 0xFF00FF00u) >> 8u);
				return float(bits) * 2.3283064365386963e-10; // / 0x100000000
			}

			// Hammersley sequence
			vec2 hammersley(uint i, uint N) {
				return vec2(float(i) / float(N), radicalInverse_VdC(i));
			}

			// GGX VNDF importance sampling (Eric Heitz 2018)
			// "Sampling the GGX Distribution of Visible Normals"
			// https://jcgt.org/published/0007/04/01/
			vec3 importanceSampleGGX_VNDF(vec2 Xi, vec3 V, float roughness) {
				float alpha = roughness * roughness;

				// Section 4.1: Orthonormal basis
				vec3 T1 = vec3(1.0, 0.0, 0.0);
				vec3 T2 = cross(V, T1);

				// Section 4.2: Parameterization of projected area
				float r = sqrt(Xi.x);
				float phi = 2.0 * PI * Xi.y;
				float t1 = r * cos(phi);
				float t2 = r * sin(phi);
				float s = 0.5 * (1.0 + V.z);
				t2 = (1.0 - s) * sqrt(1.0 - t1 * t1) + s * t2;

				// Section 4.3: Reprojection onto hemisphere
				vec3 Nh = t1 * T1 + t2 * T2 + sqrt(max(0.0, 1.0 - t1 * t1 - t2 * t2)) * V;

				// Section 3.4: Transform back to ellipsoid configuration
				return normalize(vec3(alpha * Nh.x, alpha * Nh.y, max(0.0, Nh.z)));
			}

			void main() {
				vec3 N = normalize(vOutputDirection);
				vec3 V = N; // Assume view direction equals normal for pre-filtering

				vec3 prefilteredColor = vec3(0.0);
				float totalWeight = 0.0;

				// For very low roughness, just sample the environment directly
				if (roughness < 0.001) {
					gl_FragColor = vec4(bilinearCubeUV(envMap, N, mipInt), 1.0);
					return;
				}

				// Tangent space basis for VNDF sampling
				vec3 up = abs(N.z) < 0.999 ? vec3(0.0, 0.0, 1.0) : vec3(1.0, 0.0, 0.0);
				vec3 tangent = normalize(cross(up, N));
				vec3 bitangent = cross(N, tangent);

				for(uint i = 0u; i < uint(GGX_SAMPLES); i++) {
					vec2 Xi = hammersley(i, uint(GGX_SAMPLES));

					// For PMREM, V = N, so in tangent space V is always (0, 0, 1)
					vec3 H_tangent = importanceSampleGGX_VNDF(Xi, vec3(0.0, 0.0, 1.0), roughness);

					// Transform H back to world space
					vec3 H = normalize(tangent * H_tangent.x + bitangent * H_tangent.y + N * H_tangent.z);
					vec3 L = normalize(2.0 * dot(V, H) * H - V);

					float NdotL = max(dot(N, L), 0.0);

					if(NdotL > 0.0) {
						// Sample environment at fixed mip level
						// VNDF importance sampling handles the distribution filtering
						vec3 sampleColor = bilinearCubeUV(envMap, L, mipInt);

						// Weight by NdotL for the split-sum approximation
						// VNDF PDF naturally accounts for the visible microfacet distribution
						prefilteredColor += sampleColor * NdotL;
						totalWeight += NdotL;
					}
				}

				if (totalWeight > 0.0) {
					prefilteredColor = prefilteredColor / totalWeight;
				}

				gl_FragColor = vec4(prefilteredColor, 1.0);
			}
		`,blending:Sn,depthTest:!1,depthWrite:!1})}function dp(i,t,e){return new un({name:"SphericalGaussianBlur",defines:{SAMPLES:lp,CUBEUV_TEXEL_WIDTH:1/t,CUBEUV_TEXEL_HEIGHT:1/e,CUBEUV_MAX_MIP:`${i}.0`},uniforms:{envMap:{value:null},sigma:{value:0},mipInt:{value:0}},vertexShader:Gs(),fragmentShader:`

			precision highp float;
			precision highp int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform float sigma;
			uniform float mipInt;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			#define PI 3.14159265359
			#define GOLDEN_ANGLE 2.39996322973

			void main() {

				if ( sigma == 0.0 ) {

					gl_FragColor = vec4( bilinearCubeUV( envMap, vOutputDirection, mipInt ), 1.0 );
					return;

				}

				vec3 outputDirection = normalize( vOutputDirection );

				vec3 up = abs( outputDirection.z ) < 0.999 ? vec3( 0.0, 0.0, 1.0 ) : vec3( 1.0, 0.0, 0.0 );
				vec3 tangent = normalize( cross( up, outputDirection ) );
				vec3 bitangent = cross( outputDirection, tangent );

				// Truncate the kernel at three standard deviations or at the antipode.
				float thetaMax = min( 3.0 * sigma, PI );
				float truncation = 1.0 - exp( - 0.5 * thetaMax * thetaMax / ( sigma * sigma ) );

				vec3 accumColor = vec3( 0.0 );
				float accumWeight = 0.0;

				for ( int i = 0; i < SAMPLES; i ++ ) {

					// Stratified inverse-CDF sampling of the Gaussian, placed on a golden-angle spiral.
					float stratum = ( float( i ) + 0.5 ) / float( SAMPLES );
					float theta = sigma * sqrt( - 2.0 * log( 1.0 - stratum * truncation ) );
					float phi = float( i ) * GOLDEN_ANGLE;

					vec3 offset = cos( phi ) * tangent + sin( phi ) * bitangent;
					vec3 sampleDirection = cos( theta ) * outputDirection + sin( theta ) * offset;

					// Correct the planar sample density to solid angle.
					float weight = sin( theta ) / theta;

					accumColor += weight * bilinearCubeUV( envMap, sampleDirection, mipInt );
					accumWeight += weight;

				}

				gl_FragColor = vec4( accumColor / accumWeight, 1.0 );

			}
		`,blending:Sn,depthTest:!1,depthWrite:!1})}function Oo(){return new un({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:Gs(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;

			#include <common>

			void main() {

				vec3 outputDirection = normalize( vOutputDirection );
				vec2 uv = equirectUv( outputDirection );

				gl_FragColor = vec4( texture2D ( envMap, uv ).rgb, 1.0 );

			}
		`,blending:Sn,depthTest:!1,depthWrite:!1})}function Bo(){return new un({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:Gs(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:Sn,depthTest:!1,depthWrite:!1})}function Gs(){return`

		precision mediump float;
		precision mediump int;

		attribute vec3 outputDirection;

		varying vec3 vOutputDirection;

		void main() {

			vOutputDirection = outputDirection;
			gl_Position = vec4( position, 1.0 );

		}
	`}class Kl extends Je{constructor(t=1,e={}){super(t,t,e),this.isWebGLCubeRenderTarget=!0;const n={width:t,height:t,depth:1},s=[n,n,n,n,n,n];this.texture=new Dl(s),this._setTextureOptions(e),this.texture.isRenderTargetTexture=!0}fromEquirectangularTexture(t,e){this.texture.type=e.type,this.texture.colorSpace=e.colorSpace,this.texture.generateMipmaps=e.generateMipmaps,this.texture.minFilter=e.minFilter,this.texture.magFilter=e.magFilter;const n={uniforms:{tEquirect:{value:null}},vertexShader:`

				varying vec3 vWorldDirection;

				vec3 transformDirection( in vec3 dir, in mat4 matrix ) {

					return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );

				}

				void main() {

					vWorldDirection = transformDirection( position, modelMatrix );

					#include <begin_vertex>
					#include <project_vertex>

				}
			`,fragmentShader:`

				uniform sampler2D tEquirect;

				varying vec3 vWorldDirection;

				#include <common>

				void main() {

					vec3 direction = normalize( vWorldDirection );

					vec2 sampleUV = equirectUv( direction );

					gl_FragColor = texture2D( tEquirect, sampleUV );

				}
			`},s=new qi(5,5,5),r=new un({name:"CubemapFromEquirect",uniforms:vi(n.uniforms),vertexShader:n.vertexShader,fragmentShader:n.fragmentShader,side:Ie,blending:Sn});r.uniforms.tEquirect.value=e;const a=new hn(s,r),o=e.minFilter;return e.minFilter===Hn&&(e.minFilter=Ae),new mu(1,10,this).update(t,a),e.minFilter=o,a.geometry.dispose(),a.material.dispose(),this}clear(t,e=!0,n=!0,s=!0){const r=t.getRenderTarget();for(let a=0;a<6;a++)t.setRenderTarget(this,a),t.clear(e,n,s);t.setRenderTarget(r)}}function pp(i){let t=new WeakMap,e=new WeakMap,n=null;function s(h,p=!1){return h==null?null:p?a(h):r(h)}function r(h){if(h&&h.isTexture){const p=h.mapping;if(p===Ws||p===Xs)if(t.has(h)){const _=t.get(h).texture;return o(_,h.mapping)}else{const _=h.image;if(_&&_.height>0){const y=new Kl(_.height);return y.fromEquirectangularTexture(i,h),t.set(h,y),h.addEventListener("dispose",l),o(y.texture,h.mapping)}else return null}}return h}function a(h){if(h&&h.isTexture){const p=h.mapping,_=p===Ws||p===Xs,y=p===qn||p===gi;if(_||y){let m=e.get(h);const d=m!==void 0?m.texture.pmremVersion:0;if(h.isRenderTargetTexture&&h.pmremVersion!==d)return n===null&&(n=new Uo(i)),m=_?n.fromEquirectangular(h,m):n.fromCubemap(h,m),m.texture.pmremVersion=h.pmremVersion,e.set(h,m),m.texture;if(m!==void 0)return m.texture;{const P=h.image;return _&&P&&P.height>0||y&&P&&c(P)?(n===null&&(n=new Uo(i)),m=_?n.fromEquirectangular(h):n.fromCubemap(h),m.texture.pmremVersion=h.pmremVersion,e.set(h,m),h.addEventListener("dispose",u),m.texture):null}}}return h}function o(h,p){return p===Ws?h.mapping=qn:p===Xs&&(h.mapping=gi),h}function c(h){let p=0;const _=6;for(let y=0;y<_;y++)h[y]!==void 0&&p++;return p===_}function l(h){const p=h.target;p.removeEventListener("dispose",l);const _=t.get(p);_!==void 0&&(t.delete(p),_.dispose())}function u(h){const p=h.target;p.removeEventListener("dispose",u);const _=e.get(p);_!==void 0&&(e.delete(p),_.dispose())}function f(){t=new WeakMap,e=new WeakMap,n!==null&&(n.dispose(),n=null)}return{get:s,dispose:f}}function mp(i){const t={};function e(n){if(t[n]!==void 0)return t[n];const s=i.getExtension(n);return t[n]=s,s}return{has:function(n){return e(n)!==null},init:function(){e("EXT_color_buffer_float"),e("WEBGL_clip_cull_distance"),e("OES_texture_float_linear"),e("EXT_color_buffer_half_float"),e("WEBGL_multisampled_render_to_texture"),e("WEBGL_render_shared_exponent")},get:function(n){const s=e(n);return s===null&&pi("WebGLRenderer: "+n+" extension not supported."),s}}}function gp(i,t,e,n){const s={},r=new WeakMap;function a(f){const h=f.target;h.index!==null&&t.remove(h.index);for(const _ in h.attributes)t.remove(h.attributes[_]);h.removeEventListener("dispose",a),delete s[h.id];const p=r.get(h);p&&(t.remove(p),r.delete(h)),n.releaseStatesOfGeometry(h),h.isInstancedBufferGeometry===!0&&delete h._maxInstanceCount,e.memory.geometries--}function o(f,h){return s[h.id]===!0||(h.addEventListener("dispose",a),s[h.id]=!0,e.memory.geometries++),h}function c(f){const h=f.attributes;for(const p in h)t.update(h[p],i.ARRAY_BUFFER)}function l(f){const h=[],p=f.index,_=f.attributes.position;let y=0;if(_===void 0)return;if(p!==null){const P=p.array;y=p.version;for(let D=0,S=P.length;D<S;D+=3){const w=P[D+0],A=P[D+1],F=P[D+2];h.push(w,A,A,F,F,w)}}else{const P=_.array;y=_.version;for(let D=0,S=P.length/3-1;D<S;D+=3){const w=D+0,A=D+1,F=D+2;h.push(w,A,A,F,F,w)}}const m=new(_.count>=65535?Pl:Cl)(h,1);m.version=y;const d=r.get(f);d&&t.remove(d),r.set(f,m)}function u(f){const h=r.get(f);if(h){const p=f.index;p!==null&&h.version<p.version&&l(f)}else l(f);return r.get(f)}return{get:o,update:c,getWireframeAttribute:u}}function _p(i,t,e){let n;function s(f){n=f}let r,a;function o(f){r=f.type,a=f.bytesPerElement}function c(f,h){i.drawElements(n,h,r,f*a),e.update(h,n,1)}function l(f,h,p){p!==0&&(i.drawElementsInstanced(n,h,r,f*a,p),e.update(h,n,p))}function u(f,h,p){if(p===0)return;t.get("WEBGL_multi_draw").multiDrawElementsWEBGL(n,h,0,r,f,0,p);let y=0;for(let m=0;m<p;m++)y+=h[m];e.update(y,n,1)}this.setMode=s,this.setIndex=o,this.render=c,this.renderInstances=l,this.renderMultiDraw=u}function xp(i){const t={geometries:0,textures:0},e={frame:0,calls:0,triangles:0,points:0,lines:0};function n(r,a,o){switch(e.calls++,a){case i.TRIANGLES:e.triangles+=o*(r/3);break;case i.LINES:e.lines+=o*(r/2);break;case i.LINE_STRIP:e.lines+=o*(r-1);break;case i.LINE_LOOP:e.lines+=o*r;break;case i.POINTS:e.points+=o*r;break;default:ne("WebGLInfo: Unknown draw mode:",a);break}}function s(){e.calls=0,e.triangles=0,e.points=0,e.lines=0}return{memory:t,render:e,programs:null,autoReset:!0,reset:s,update:n}}function vp(i,t,e){const n=new WeakMap,s=new fe;function r(a,o,c){const l=a.morphTargetInfluences,u=o.morphAttributes.position||o.morphAttributes.normal||o.morphAttributes.color,f=u!==void 0?u.length:0;let h=n.get(o);if(h===void 0||h.count!==f){let R=function(){F.dispose(),n.delete(o),o.removeEventListener("dispose",R)};h!==void 0&&h.texture.dispose();const p=o.morphAttributes.position!==void 0,_=o.morphAttributes.normal!==void 0,y=o.morphAttributes.color!==void 0,m=o.morphAttributes.position||[],d=o.morphAttributes.normal||[],P=o.morphAttributes.color||[];let D=0;p===!0&&(D=1),_===!0&&(D=2),y===!0&&(D=3);let S=o.attributes.position.count*D,w=1;S>t.maxTextureSize&&(w=Math.ceil(S/t.maxTextureSize),S=t.maxTextureSize);const A=new Float32Array(S*w*4*f),F=new Al(A,S,w,f);F.type=sn,F.needsUpdate=!0;const v=D*4;for(let B=0;B<f;B++){const X=m[B],q=d[B],nt=P[B],G=S*w*4*B;for(let J=0;J<X.count;J++){const lt=J*v;p===!0&&(s.fromBufferAttribute(X,J),A[G+lt+0]=s.x,A[G+lt+1]=s.y,A[G+lt+2]=s.z,A[G+lt+3]=0),_===!0&&(s.fromBufferAttribute(q,J),A[G+lt+4]=s.x,A[G+lt+5]=s.y,A[G+lt+6]=s.z,A[G+lt+7]=0),y===!0&&(s.fromBufferAttribute(nt,J),A[G+lt+8]=s.x,A[G+lt+9]=s.y,A[G+lt+10]=s.z,A[G+lt+11]=nt.itemSize===4?s.w:1)}}h={count:f,texture:F,size:new dt(S,w)},n.set(o,h),o.addEventListener("dispose",R)}if(a.isInstancedMesh===!0&&a.morphTexture!==null)c.getUniforms().setValue(i,"morphTexture",a.morphTexture,e);else{let p=0;for(let y=0;y<l.length;y++)p+=l[y];const _=o.morphTargetsRelative?1:1-p;c.getUniforms().setValue(i,"morphTargetBaseInfluence",_),c.getUniforms().setValue(i,"morphTargetInfluences",l)}c.getUniforms().setValue(i,"morphTargetsTexture",h.texture,e),c.getUniforms().setValue(i,"morphTargetsTextureSize",h.size)}return{update:r}}function Sp(i,t,e,n,s){let r=new WeakMap;function a(l){const u=s.render.frame,f=l.geometry,h=t.get(l,f);if(r.get(h)!==u&&(t.update(h),r.set(h,u)),l.isInstancedMesh&&(l.hasEventListener("dispose",c)===!1&&l.addEventListener("dispose",c),r.get(l)!==u&&(e.update(l.instanceMatrix,i.ARRAY_BUFFER),l.instanceColor!==null&&e.update(l.instanceColor,i.ARRAY_BUFFER),r.set(l,u))),l.isSkinnedMesh){const p=l.skeleton;r.get(p)!==u&&(p.update(),r.set(p,u))}return h}function o(){r=new WeakMap}function c(l){const u=l.target;u.removeEventListener("dispose",c),n.releaseStatesOfObject(u),e.remove(u.instanceMatrix),u.instanceColor!==null&&e.remove(u.instanceColor)}return{update:a,dispose:o}}const Mp={[hl]:"LINEAR_TONE_MAPPING",[ul]:"REINHARD_TONE_MAPPING",[fl]:"CINEON_TONE_MAPPING",[dl]:"ACES_FILMIC_TONE_MAPPING",[ml]:"AGX_TONE_MAPPING",[gl]:"NEUTRAL_TONE_MAPPING",[pl]:"CUSTOM_TONE_MAPPING"};function yp(i,t,e,n,s,r){const a=new Je(t,e,{type:i,depthBuffer:s,stencilBuffer:r,samples:n?4:0,storeMultisampledDepthBuffer:!1,storeMultisampledStencilBuffer:!1,resolveDepthBuffer:!1,resolveStencilBuffer:!1});let o=null,c=null;const l=new ke;l.setAttribute("position",new Ne([-1,3,0,-1,-1,0,3,-1,0],3)),l.setAttribute("uv",new Ne([0,2,0,0,2,0],2));const u=new su({uniforms:{tDiffuse:{value:null}},vertexShader:`
			precision highp float;

			uniform mat4 modelViewMatrix;
			uniform mat4 projectionMatrix;

			attribute vec3 position;
			attribute vec2 uv;

			varying vec2 vUv;

			void main() {
				vUv = uv;
				gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
			}`,fragmentShader:`
			precision highp float;

			uniform sampler2D tDiffuse;

			varying vec2 vUv;

			#include <tonemapping_pars_fragment>
			#include <colorspace_pars_fragment>

			void main() {
				gl_FragColor = texture2D( tDiffuse, vUv );

				#ifdef LINEAR_TONE_MAPPING
					gl_FragColor.rgb = LinearToneMapping( gl_FragColor.rgb );
				#elif defined( REINHARD_TONE_MAPPING )
					gl_FragColor.rgb = ReinhardToneMapping( gl_FragColor.rgb );
				#elif defined( CINEON_TONE_MAPPING )
					gl_FragColor.rgb = CineonToneMapping( gl_FragColor.rgb );
				#elif defined( ACES_FILMIC_TONE_MAPPING )
					gl_FragColor.rgb = ACESFilmicToneMapping( gl_FragColor.rgb );
				#elif defined( AGX_TONE_MAPPING )
					gl_FragColor.rgb = AgXToneMapping( gl_FragColor.rgb );
				#elif defined( NEUTRAL_TONE_MAPPING )
					gl_FragColor.rgb = NeutralToneMapping( gl_FragColor.rgb );
				#elif defined( CUSTOM_TONE_MAPPING )
					gl_FragColor.rgb = CustomToneMapping( gl_FragColor.rgb );
				#endif

				#ifdef SRGB_TRANSFER
					gl_FragColor = sRGBTransferOETF( gl_FragColor );
				#endif
			}`,depthTest:!1,depthWrite:!1}),f=new hn(l,u),h=new La(-1,1,1,-1,0,1);let p=null,_=null,y=!1,m,d=null,P=[],D=!1;this.setSize=function(S,w){a.setSize(S,w),o!==null&&o.setSize(S,w),c!==null&&c.setSize(S,w);for(let A=0;A<P.length;A++){const F=P[A];F.setSize&&F.setSize(S,w)}},this.setEffects=function(S){P=S,D=P.length>0&&P[0].isRenderPass===!0;const w=a.width,A=a.height;P.length>0&&o===null&&(o=new Je(w,A,{type:cn,depthBuffer:!1,stencilBuffer:!1}),c=new Je(w,A,{type:cn,depthBuffer:!1,stencilBuffer:!1}));for(let F=0;F<P.length;F++){const v=P[F];v.setSize&&v.setSize(w,A)}},this.begin=function(S,w){if(y||S.toneMapping===an&&P.length===0)return!1;if(d=w,w!==null){const A=w.width,F=w.height;(a.width!==A||a.height!==F)&&this.setSize(A,F)}return D===!1&&S.setRenderTarget(a),m=S.toneMapping,S.toneMapping=an,!0},this.hasRenderPass=function(){return D},this.end=function(S,w){S.toneMapping=m,y=!0;let A=a,F=o;for(let v=0;v<P.length;v++){const R=P[v];R.enabled!==!1&&(R.render(S,F,A,w),R.needsSwap!==!1&&(A=F,F=F===o?c:o))}if(p!==S.outputColorSpace||_!==S.toneMapping){p=S.outputColorSpace,_=S.toneMapping,u.defines={},te.getTransfer(p)===re&&(u.defines.SRGB_TRANSFER="");const v=Mp[_];v&&(u.defines[v]=""),u.needsUpdate=!0}u.uniforms.tDiffuse.value=A.texture,S.setRenderTarget(d),S.render(f,h),d=null,y=!1},this.isCompositing=function(){return y},this.dispose=function(){a.dispose(),o!==null&&o.dispose(),c!==null&&c.dispose(),l.dispose(),u.dispose()}}const Jl=new we,pa=new zi(1,1),$l=new Al,Ql=new eh,jl=new Dl,zo=[],Go=[],Vo=new Float32Array(16),ko=new Float32Array(9),Ho=new Float32Array(4);function Mi(i,t,e){const n=i[0];if(n<=0||n>0)return i;const s=t*e;let r=zo[s];if(r===void 0&&(r=new Float32Array(s),zo[s]=r),t!==0){n.toArray(r,0);for(let a=1,o=0;a!==t;++a)o+=e,i[a].toArray(r,o)}return r}function ve(i,t){if(i.length!==t.length)return!1;for(let e=0,n=i.length;e<n;e++)if(i[e]!==t[e])return!1;return!0}function Se(i,t){for(let e=0,n=t.length;e<n;e++)i[e]=t[e]}function Vs(i,t){let e=Go[t];e===void 0&&(e=new Int32Array(t),Go[t]=e);for(let n=0;n!==t;++n)e[n]=i.allocateTextureUnit();return e}function Ep(i,t){const e=this.cache;e[0]!==t&&(i.uniform1f(this.addr,t),e[0]=t)}function bp(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(i.uniform2f(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(ve(e,t))return;i.uniform2fv(this.addr,t),Se(e,t)}}function Tp(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(i.uniform3f(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else if(t.r!==void 0)(e[0]!==t.r||e[1]!==t.g||e[2]!==t.b)&&(i.uniform3f(this.addr,t.r,t.g,t.b),e[0]=t.r,e[1]=t.g,e[2]=t.b);else{if(ve(e,t))return;i.uniform3fv(this.addr,t),Se(e,t)}}function Ap(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(i.uniform4f(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(ve(e,t))return;i.uniform4fv(this.addr,t),Se(e,t)}}function wp(i,t){const e=this.cache,n=t.elements;if(n===void 0){if(ve(e,t))return;i.uniformMatrix2fv(this.addr,!1,t),Se(e,t)}else{if(ve(e,n))return;Ho.set(n),i.uniformMatrix2fv(this.addr,!1,Ho),Se(e,n)}}function Rp(i,t){const e=this.cache,n=t.elements;if(n===void 0){if(ve(e,t))return;i.uniformMatrix3fv(this.addr,!1,t),Se(e,t)}else{if(ve(e,n))return;ko.set(n),i.uniformMatrix3fv(this.addr,!1,ko),Se(e,n)}}function Cp(i,t){const e=this.cache,n=t.elements;if(n===void 0){if(ve(e,t))return;i.uniformMatrix4fv(this.addr,!1,t),Se(e,t)}else{if(ve(e,n))return;Vo.set(n),i.uniformMatrix4fv(this.addr,!1,Vo),Se(e,n)}}function Pp(i,t){const e=this.cache;e[0]!==t&&(i.uniform1i(this.addr,t),e[0]=t)}function Lp(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(i.uniform2i(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(ve(e,t))return;i.uniform2iv(this.addr,t),Se(e,t)}}function Dp(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(i.uniform3i(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else{if(ve(e,t))return;i.uniform3iv(this.addr,t),Se(e,t)}}function Ip(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(i.uniform4i(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(ve(e,t))return;i.uniform4iv(this.addr,t),Se(e,t)}}function Np(i,t){const e=this.cache;e[0]!==t&&(i.uniform1ui(this.addr,t),e[0]=t)}function Up(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(i.uniform2ui(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(ve(e,t))return;i.uniform2uiv(this.addr,t),Se(e,t)}}function Fp(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(i.uniform3ui(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else{if(ve(e,t))return;i.uniform3uiv(this.addr,t),Se(e,t)}}function Op(i,t){const e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(i.uniform4ui(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(ve(e,t))return;i.uniform4uiv(this.addr,t),Se(e,t)}}function Bp(i,t,e){const n=this.cache,s=e.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s);let r;this.type===i.SAMPLER_2D_SHADOW?(pa.compareFunction=e.isReversedDepthBuffer()?Ea:ya,r=pa):r=Jl,e.setTexture2D(t||r,s)}function zp(i,t,e){const n=this.cache,s=e.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),e.setTexture3D(t||Ql,s)}function Gp(i,t,e){const n=this.cache,s=e.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),e.setTextureCube(t||jl,s)}function Vp(i,t,e){const n=this.cache,s=e.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),e.setTexture2DArray(t||$l,s)}function kp(i){switch(i){case 5126:return Ep;case 35664:return bp;case 35665:return Tp;case 35666:return Ap;case 35674:return wp;case 35675:return Rp;case 35676:return Cp;case 5124:case 35670:return Pp;case 35667:case 35671:return Lp;case 35668:case 35672:return Dp;case 35669:case 35673:return Ip;case 5125:return Np;case 36294:return Up;case 36295:return Fp;case 36296:return Op;case 35678:case 36198:case 36298:case 36306:case 35682:return Bp;case 35679:case 36299:case 36307:return zp;case 35680:case 36300:case 36308:case 36293:return Gp;case 36289:case 36303:case 36311:case 36292:return Vp}}function Hp(i,t){i.uniform1fv(this.addr,t)}function Wp(i,t){const e=Mi(t,this.size,2);i.uniform2fv(this.addr,e)}function Xp(i,t){const e=Mi(t,this.size,3);i.uniform3fv(this.addr,e)}function qp(i,t){const e=Mi(t,this.size,4);i.uniform4fv(this.addr,e)}function Yp(i,t){const e=Mi(t,this.size,4);i.uniformMatrix2fv(this.addr,!1,e)}function Zp(i,t){const e=Mi(t,this.size,9);i.uniformMatrix3fv(this.addr,!1,e)}function Kp(i,t){const e=Mi(t,this.size,16);i.uniformMatrix4fv(this.addr,!1,e)}function Jp(i,t){i.uniform1iv(this.addr,t)}function $p(i,t){i.uniform2iv(this.addr,t)}function Qp(i,t){i.uniform3iv(this.addr,t)}function jp(i,t){i.uniform4iv(this.addr,t)}function tm(i,t){i.uniform1uiv(this.addr,t)}function em(i,t){i.uniform2uiv(this.addr,t)}function nm(i,t){i.uniform3uiv(this.addr,t)}function im(i,t){i.uniform4uiv(this.addr,t)}function sm(i,t,e){const n=this.cache,s=t.length,r=Vs(e,s);ve(n,r)||(i.uniform1iv(this.addr,r),Se(n,r));let a;this.type===i.SAMPLER_2D_SHADOW?a=pa:a=Jl;for(let o=0;o!==s;++o)e.setTexture2D(t[o]||a,r[o])}function rm(i,t,e){const n=this.cache,s=t.length,r=Vs(e,s);ve(n,r)||(i.uniform1iv(this.addr,r),Se(n,r));for(let a=0;a!==s;++a)e.setTexture3D(t[a]||Ql,r[a])}function am(i,t,e){const n=this.cache,s=t.length,r=Vs(e,s);ve(n,r)||(i.uniform1iv(this.addr,r),Se(n,r));for(let a=0;a!==s;++a)e.setTextureCube(t[a]||jl,r[a])}function om(i,t,e){const n=this.cache,s=t.length,r=Vs(e,s);ve(n,r)||(i.uniform1iv(this.addr,r),Se(n,r));for(let a=0;a!==s;++a)e.setTexture2DArray(t[a]||$l,r[a])}function lm(i){switch(i){case 5126:return Hp;case 35664:return Wp;case 35665:return Xp;case 35666:return qp;case 35674:return Yp;case 35675:return Zp;case 35676:return Kp;case 5124:case 35670:return Jp;case 35667:case 35671:return $p;case 35668:case 35672:return Qp;case 35669:case 35673:return jp;case 5125:return tm;case 36294:return em;case 36295:return nm;case 36296:return im;case 35678:case 36198:case 36298:case 36306:case 35682:return sm;case 35679:case 36299:case 36307:return rm;case 35680:case 36300:case 36308:case 36293:return am;case 36289:case 36303:case 36311:case 36292:return om}}class cm{constructor(t,e,n){this.id=t,this.addr=n,this.cache=[],this.type=e.type,this.setValue=kp(e.type)}}class hm{constructor(t,e,n){this.id=t,this.addr=n,this.cache=[],this.type=e.type,this.size=e.size,this.setValue=lm(e.type)}}class um{constructor(t){this.id=t,this.seq=[],this.map={}}setValue(t,e,n){const s=this.seq;for(let r=0,a=s.length;r!==a;++r){const o=s[r];o.setValue(t,e[o.id],n)}}}const Er=/(\w+)(\])?(\[|\.)?/g;function Wo(i,t){i.seq.push(t),i.map[t.id]=t}function fm(i,t,e){const n=i.name,s=n.length;for(Er.lastIndex=0;;){const r=Er.exec(n),a=Er.lastIndex;let o=r[1];const c=r[2]==="]",l=r[3];if(c&&(o=o|0),l===void 0||l==="["&&a+2===s){Wo(e,l===void 0?new cm(o,i,t):new hm(o,i,t));break}else{let f=e.map[o];f===void 0&&(f=new um(o),Wo(e,f)),e=f}}}class ws{constructor(t,e){this.seq=[],this.map={};const n=t.getProgramParameter(e,t.ACTIVE_UNIFORMS);for(let a=0;a<n;++a){const o=t.getActiveUniform(e,a),c=t.getUniformLocation(e,o.name);fm(o,c,this)}const s=[],r=[];for(const a of this.seq)a.type===t.SAMPLER_2D_SHADOW||a.type===t.SAMPLER_CUBE_SHADOW||a.type===t.SAMPLER_2D_ARRAY_SHADOW?s.push(a):r.push(a);s.length>0&&(this.seq=s.concat(r))}setValue(t,e,n,s){const r=this.map[e];r!==void 0&&r.setValue(t,n,s)}setOptional(t,e,n){const s=e[n];s!==void 0&&this.setValue(t,n,s)}static upload(t,e,n,s){for(let r=0,a=e.length;r!==a;++r){const o=e[r],c=n[o.id];c.needsUpdate!==!1&&o.setValue(t,c.value,s)}}static seqWithValue(t,e){const n=[];for(let s=0,r=t.length;s!==r;++s){const a=t[s];a.id in e&&n.push(a)}return n}}function Xo(i,t,e){const n=i.createShader(t);return i.shaderSource(n,e),i.compileShader(n),n}const dm=37297;let pm=0;function mm(i,t){const e=i.split(`
`),n=[],s=Math.max(t-6,0),r=Math.min(t+6,e.length);for(let a=s;a<r;a++){const o=a+1;n.push(`${o===t?">":" "} ${o}: ${e[a]}`)}return n.join(`
`)}const qo=new kt;function gm(i){te._getMatrix(qo,te.workingColorSpace,i);const t=`mat3( ${qo.elements.map(e=>e.toFixed(4))} )`;switch(te.getTransfer(i)){case Is:return[t,"LinearTransferOETF"];case re:return[t,"sRGBTransferOETF"];default:return Wt("WebGLProgram: Unsupported color space: ",i),[t,"LinearTransferOETF"]}}function Yo(i,t,e){const n=i.getShaderParameter(t,i.COMPILE_STATUS),r=(i.getShaderInfoLog(t)||"").trim();if(n&&r==="")return"";const a=/ERROR: 0:(\d+)/.exec(r);if(a){const o=parseInt(a[1]);return e.toUpperCase()+`

`+r+`

`+mm(i.getShaderSource(t),o)}else return r}function _m(i,t){const e=gm(t);return[`vec4 ${i}( vec4 value ) {`,`	return ${e[1]}( vec4( value.rgb * ${e[0]}, value.a ) );`,"}"].join(`
`)}const xm={[hl]:"Linear",[ul]:"Reinhard",[fl]:"Cineon",[dl]:"ACESFilmic",[ml]:"AgX",[gl]:"Neutral",[pl]:"Custom"};function vm(i,t){const e=xm[t];return e===void 0?(Wt("WebGLProgram: Unsupported toneMapping:",t),"vec3 "+i+"( vec3 color ) { return LinearToneMapping( color ); }"):"vec3 "+i+"( vec3 color ) { return "+e+"ToneMapping( color ); }"}const vs=new H;function Sm(){te.getLuminanceCoefficients(vs);const i=vs.x.toFixed(4),t=vs.y.toFixed(4),e=vs.z.toFixed(4);return["float luminance( const in vec3 rgb ) {",`	const vec3 weights = vec3( ${i}, ${t}, ${e} );`,"	return dot( weights, rgb );","}"].join(`
`)}function Mm(i){return[i.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",i.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(Li).join(`
`)}function ym(i){const t=[];for(const e in i){const n=i[e];n!==!1&&t.push("#define "+e+" "+n)}return t.join(`
`)}function Em(i,t){const e={},n=i.getProgramParameter(t,i.ACTIVE_ATTRIBUTES);for(let s=0;s<n;s++){const r=i.getActiveAttrib(t,s),a=r.name;let o=1;r.type===i.FLOAT_MAT2&&(o=2),r.type===i.FLOAT_MAT3&&(o=3),r.type===i.FLOAT_MAT4&&(o=4),e[a]={type:r.type,location:i.getAttribLocation(t,a),locationSize:o}}return e}function Li(i){return i!==""}function Zo(i,t){const e=t.numSpotLightShadows+t.numSpotLightMaps-t.numSpotLightShadowsWithMaps;return i.replace(/NUM_SUN_LIGHTS/g,t.numSunLights).replace(/NUM_DIR_LIGHTS/g,t.numDirLights).replace(/NUM_SPOT_LIGHTS/g,t.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,t.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,e).replace(/NUM_RECT_AREA_LIGHTS/g,t.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,t.numPointLights).replace(/NUM_HEMI_LIGHTS/g,t.numHemiLights).replace(/NUM_SUN_LIGHT_SHADOWS/g,t.numSunLightShadows).replace(/NUM_DIR_LIGHT_SHADOWS/g,t.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,t.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,t.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,t.numPointLightShadows)}function Ko(i,t){return i.replace(/NUM_CLIPPING_PLANES/g,t.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,t.numClippingPlanes-t.numClipIntersection)}const bm=/^[ \t]*#include +<([\w\d./]+)>/gm;function ma(i){return i.replace(bm,Am)}const Tm=new Map;function Am(i,t){let e=Jt[t];if(e===void 0){const n=Tm.get(t);if(n!==void 0)e=Jt[n],Wt('WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',t,n);else throw new Error("THREE.WebGLProgram: Can not resolve #include <"+t+">")}return ma(e)}const wm=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function Jo(i){return i.replace(wm,Rm)}function Rm(i,t,e,n){let s="";for(let r=parseInt(t);r<parseInt(e);r++)s+=n.replace(/\[\s*i\s*\]/g,"[ "+r+" ]").replace(/UNROLLED_LOOP_INDEX/g,r);return s}function $o(i){let t=`precision ${i.precision} float;
	precision ${i.precision} int;
	precision ${i.precision} sampler2D;
	precision ${i.precision} samplerCube;
	precision ${i.precision} sampler3D;
	precision ${i.precision} sampler2DArray;
	precision ${i.precision} sampler2DShadow;
	precision ${i.precision} samplerCubeShadow;
	precision ${i.precision} sampler2DArrayShadow;
	precision ${i.precision} isampler2D;
	precision ${i.precision} isampler3D;
	precision ${i.precision} isamplerCube;
	precision ${i.precision} isampler2DArray;
	precision ${i.precision} usampler2D;
	precision ${i.precision} usampler3D;
	precision ${i.precision} usamplerCube;
	precision ${i.precision} usampler2DArray;
	`;return i.precision==="highp"?t+=`
#define HIGH_PRECISION`:i.precision==="mediump"?t+=`
#define MEDIUM_PRECISION`:i.precision==="lowp"&&(t+=`
#define LOW_PRECISION`),t}const Cm={[Ms]:"SHADOWMAP_TYPE_PCF",[Ci]:"SHADOWMAP_TYPE_VSM"};function Pm(i){return Cm[i.shadowMapType]||"SHADOWMAP_TYPE_BASIC"}const Lm={[qn]:"ENVMAP_TYPE_CUBE",[gi]:"ENVMAP_TYPE_CUBE",[Bs]:"ENVMAP_TYPE_CUBE_UV"};function Dm(i){return i.envMap===!1?"ENVMAP_TYPE_CUBE":Lm[i.envMapMode]||"ENVMAP_TYPE_CUBE"}const Im={[gi]:"ENVMAP_MODE_REFRACTION"};function Nm(i){return i.envMap===!1?"ENVMAP_MODE_REFLECTION":Im[i.envMapMode]||"ENVMAP_MODE_REFLECTION"}const Um={[cl]:"ENVMAP_BLENDING_MULTIPLY",[Lc]:"ENVMAP_BLENDING_MIX",[Dc]:"ENVMAP_BLENDING_ADD"};function Fm(i){return i.envMap===!1?"ENVMAP_BLENDING_NONE":Um[i.combine]||"ENVMAP_BLENDING_NONE"}function Om(i){const t=i.envMapCubeUVHeight;if(t===null)return null;const e=Math.log2(t)-2,n=1/t;return{texelWidth:1/(3*Math.max(Math.pow(2,e),112)),texelHeight:n,maxMip:e}}function Bm(i,t,e,n){const s=i.getContext(),r=e.defines;let a=e.vertexShader,o=e.fragmentShader;const c=Pm(e),l=Dm(e),u=Nm(e),f=Fm(e),h=Om(e),p=Mm(e),_=ym(r),y=s.createProgram();let m,d,P=e.glslVersion?"#version "+e.glslVersion+`
`:"";e.isRawShaderMaterial?(m=["#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,_].filter(Li).join(`
`),m.length>0&&(m+=`
`),d=["#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,_].filter(Li).join(`
`),d.length>0&&(d+=`
`)):(m=[$o(e),"#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,_,e.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",e.batching?"#define USE_BATCHING":"",e.batchingColor?"#define USE_BATCHING_COLOR":"",e.instancing?"#define USE_INSTANCING":"",e.instancingColor?"#define USE_INSTANCING_COLOR":"",e.instancingMorph?"#define USE_INSTANCING_MORPH":"",e.useFog&&e.fog?"#define USE_FOG":"",e.useFog&&e.fogExp2?"#define FOG_EXP2":"",e.map?"#define USE_MAP":"",e.envMap?"#define USE_ENVMAP":"",e.envMap?"#define "+u:"",e.lightMap?"#define USE_LIGHTMAP":"",e.aoMap?"#define USE_AOMAP":"",e.bumpMap?"#define USE_BUMPMAP":"",e.normalMap?"#define USE_NORMALMAP":"",e.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",e.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",e.displacementMap?"#define USE_DISPLACEMENTMAP":"",e.emissiveMap?"#define USE_EMISSIVEMAP":"",e.anisotropy?"#define USE_ANISOTROPY":"",e.anisotropyMap?"#define USE_ANISOTROPYMAP":"",e.clearcoatMap?"#define USE_CLEARCOATMAP":"",e.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",e.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",e.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",e.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",e.specularMap?"#define USE_SPECULARMAP":"",e.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",e.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",e.roughnessMap?"#define USE_ROUGHNESSMAP":"",e.metalnessMap?"#define USE_METALNESSMAP":"",e.alphaMap?"#define USE_ALPHAMAP":"",e.alphaHash?"#define USE_ALPHAHASH":"",e.transmission?"#define USE_TRANSMISSION":"",e.transmissionMap?"#define USE_TRANSMISSIONMAP":"",e.thicknessMap?"#define USE_THICKNESSMAP":"",e.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",e.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",e.mapUv?"#define MAP_UV "+e.mapUv:"",e.alphaMapUv?"#define ALPHAMAP_UV "+e.alphaMapUv:"",e.lightMapUv?"#define LIGHTMAP_UV "+e.lightMapUv:"",e.aoMapUv?"#define AOMAP_UV "+e.aoMapUv:"",e.emissiveMapUv?"#define EMISSIVEMAP_UV "+e.emissiveMapUv:"",e.bumpMapUv?"#define BUMPMAP_UV "+e.bumpMapUv:"",e.normalMapUv?"#define NORMALMAP_UV "+e.normalMapUv:"",e.displacementMapUv?"#define DISPLACEMENTMAP_UV "+e.displacementMapUv:"",e.metalnessMapUv?"#define METALNESSMAP_UV "+e.metalnessMapUv:"",e.roughnessMapUv?"#define ROUGHNESSMAP_UV "+e.roughnessMapUv:"",e.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+e.anisotropyMapUv:"",e.clearcoatMapUv?"#define CLEARCOATMAP_UV "+e.clearcoatMapUv:"",e.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+e.clearcoatNormalMapUv:"",e.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+e.clearcoatRoughnessMapUv:"",e.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+e.iridescenceMapUv:"",e.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+e.iridescenceThicknessMapUv:"",e.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+e.sheenColorMapUv:"",e.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+e.sheenRoughnessMapUv:"",e.specularMapUv?"#define SPECULARMAP_UV "+e.specularMapUv:"",e.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+e.specularColorMapUv:"",e.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+e.specularIntensityMapUv:"",e.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+e.transmissionMapUv:"",e.thicknessMapUv?"#define THICKNESSMAP_UV "+e.thicknessMapUv:"",e.vertexTangents&&e.flatShading===!1?"#define USE_TANGENT":"",e.vertexNormals?"#define HAS_NORMAL":"",e.vertexColors?"#define USE_COLOR":"",e.vertexAlphas?"#define USE_COLOR_ALPHA":"",e.vertexUv1s?"#define USE_UV1":"",e.vertexUv2s?"#define USE_UV2":"",e.vertexUv3s?"#define USE_UV3":"",e.pointsUvs?"#define USE_POINTS_UV":"",e.flatShading?"#define FLAT_SHADED":"",e.skinning?"#define USE_SKINNING":"",e.morphTargets?"#define USE_MORPHTARGETS":"",e.morphNormals&&e.flatShading===!1?"#define USE_MORPHNORMALS":"",e.morphColors?"#define USE_MORPHCOLORS":"",e.morphTargetsCount>0?"#define MORPHTARGETS_TEXTURE_STRIDE "+e.morphTextureStride:"",e.morphTargetsCount>0?"#define MORPHTARGETS_COUNT "+e.morphTargetsCount:"",e.doubleSided?"#define DOUBLE_SIDED":"",e.flipSided?"#define FLIP_SIDED":"",e.shadowMapEnabled?"#define USE_SHADOWMAP":"",e.shadowMapEnabled?"#define "+c:"",e.sizeAttenuation?"#define USE_SIZEATTENUATION":"",e.numLightProbes>0?"#define USE_LIGHT_PROBES":"",e.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",e.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","	uniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(Li).join(`
`),d=[$o(e),"#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,_,e.useFog&&e.fog?"#define USE_FOG":"",e.useFog&&e.fogExp2?"#define FOG_EXP2":"",e.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",e.map?"#define USE_MAP":"",e.matcap?"#define USE_MATCAP":"",e.envMap?"#define USE_ENVMAP":"",e.envMap?"#define "+l:"",e.envMap?"#define "+u:"",e.envMap?"#define "+f:"",h?"#define CUBEUV_TEXEL_WIDTH "+h.texelWidth:"",h?"#define CUBEUV_TEXEL_HEIGHT "+h.texelHeight:"",h?"#define CUBEUV_MAX_MIP "+h.maxMip+".0":"",e.lightMap?"#define USE_LIGHTMAP":"",e.aoMap?"#define USE_AOMAP":"",e.bumpMap?"#define USE_BUMPMAP":"",e.normalMap?"#define USE_NORMALMAP":"",e.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",e.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",e.packedNormalMap?"#define USE_PACKED_NORMALMAP":"",e.emissiveMap?"#define USE_EMISSIVEMAP":"",e.anisotropy?"#define USE_ANISOTROPY":"",e.anisotropyMap?"#define USE_ANISOTROPYMAP":"",e.clearcoat?"#define USE_CLEARCOAT":"",e.clearcoatMap?"#define USE_CLEARCOATMAP":"",e.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",e.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",e.dispersion?"#define USE_DISPERSION":"",e.retroreflection?"#define USE_RETROREFLECTION":"",e.iridescence?"#define USE_IRIDESCENCE":"",e.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",e.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",e.specularMap?"#define USE_SPECULARMAP":"",e.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",e.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",e.roughnessMap?"#define USE_ROUGHNESSMAP":"",e.metalnessMap?"#define USE_METALNESSMAP":"",e.alphaMap?"#define USE_ALPHAMAP":"",e.alphaTest?"#define USE_ALPHATEST":"",e.alphaHash?"#define USE_ALPHAHASH":"",e.sheen?"#define USE_SHEEN":"",e.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",e.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",e.transmission?"#define USE_TRANSMISSION":"",e.transmissionMap?"#define USE_TRANSMISSIONMAP":"",e.thicknessMap?"#define USE_THICKNESSMAP":"",e.vertexTangents&&e.flatShading===!1?"#define USE_TANGENT":"",e.vertexColors||e.instancingColor?"#define USE_COLOR":"",e.vertexAlphas||e.batchingColor?"#define USE_COLOR_ALPHA":"",e.vertexUv1s?"#define USE_UV1":"",e.vertexUv2s?"#define USE_UV2":"",e.vertexUv3s?"#define USE_UV3":"",e.pointsUvs?"#define USE_POINTS_UV":"",e.gradientMap?"#define USE_GRADIENTMAP":"",e.flatShading?"#define FLAT_SHADED":"",e.doubleSided?"#define DOUBLE_SIDED":"",e.flipSided?"#define FLIP_SIDED":"",e.shadowMapEnabled?"#define USE_SHADOWMAP":"",e.shadowMapEnabled?"#define "+c:"",e.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",e.numLightProbes>0?"#define USE_LIGHT_PROBES":"",e.numLightProbeGrids>0?"#define USE_LIGHT_PROBES_GRID":"",e.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",e.decodeVideoTextureEmissive?"#define DECODE_VIDEO_TEXTURE_EMISSIVE":"",e.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",e.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",e.toneMapping!==an?"#define TONE_MAPPING":"",e.toneMapping!==an?Jt.tonemapping_pars_fragment:"",e.toneMapping!==an?vm("toneMapping",e.toneMapping):"",e.dithering?"#define DITHERING":"",e.opaque?"#define OPAQUE":"",Jt.colorspace_pars_fragment,_m("linearToOutputTexel",e.outputColorSpace),Sm(),e.useDepthPacking?"#define DEPTH_PACKING "+e.depthPacking:"",`
`].filter(Li).join(`
`)),a=ma(a),a=Zo(a,e),a=Ko(a,e),o=ma(o),o=Zo(o,e),o=Ko(o,e),a=Jo(a),o=Jo(o),e.isRawShaderMaterial!==!0&&(P=`#version 300 es
`,m=[p,"#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+m,d=["#define varying in",e.glslVersion===Qa?"":"layout(location = 0) out highp vec4 pc_fragColor;",e.glslVersion===Qa?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+d);const D=P+m+a,S=P+d+o,w=Xo(s,s.VERTEX_SHADER,D),A=Xo(s,s.FRAGMENT_SHADER,S);s.attachShader(y,w),s.attachShader(y,A),e.index0AttributeName!==void 0?s.bindAttribLocation(y,0,e.index0AttributeName):e.hasPositionAttribute===!0&&s.bindAttribLocation(y,0,"position"),s.linkProgram(y);function F(X){if(i.debug.checkShaderErrors){const q=s.getProgramInfoLog(y)||"",nt=s.getShaderInfoLog(w)||"",G=s.getShaderInfoLog(A)||"",J=q.trim(),lt=nt.trim(),K=G.trim();let Z=!0,it=!0;if(s.getProgramParameter(y,s.LINK_STATUS)===!1)if(Z=!1,typeof i.debug.onShaderError=="function")i.debug.onShaderError(s,y,w,A);else{const rt=Yo(s,w,"vertex"),ht=Yo(s,A,"fragment");ne("WebGLProgram: Shader Error "+s.getError()+" - VALIDATE_STATUS "+s.getProgramParameter(y,s.VALIDATE_STATUS)+`

Material Name: `+X.name+`
Material Type: `+X.type+`

Program Info Log: `+J+`
`+rt+`
`+ht)}else J!==""?Wt("WebGLProgram: Program Info Log:",J):(lt===""||K==="")&&(it=!1);it&&(X.diagnostics={runnable:Z,programLog:J,vertexShader:{log:lt,prefix:m},fragmentShader:{log:K,prefix:d}})}s.deleteShader(w),s.deleteShader(A),v=new ws(s,y),R=Em(s,y)}let v;this.getUniforms=function(){return v===void 0&&F(this),v};let R;this.getAttributes=function(){return R===void 0&&F(this),R};let B=e.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return B===!1&&(B=s.getProgramParameter(y,dm)),B},this.destroy=function(){n.releaseStatesOfProgram(this),s.deleteProgram(y),this.program=void 0},this.type=e.shaderType,this.name=e.shaderName,this.id=pm++,this.cacheKey=t,this.usedTimes=1,this.program=y,this.vertexShader=w,this.fragmentShader=A,this}let zm=0;class Gm{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(t,e,n){const s=this._getShaderCacheForMaterial(t);return s.has(e)===!1&&(s.add(e),e.usedTimes++),s.has(n)===!1&&(s.add(n),n.usedTimes++),this}remove(t){const e=this.materialCache.get(t);for(const n of e)n.usedTimes--,n.usedTimes===0&&this.shaderCache.delete(n.code);return this.materialCache.delete(t),this}getVertexShaderStage(t){return this._getShaderStage(t.vertexShader)}getFragmentShaderStage(t){return this._getShaderStage(t.fragmentShader)}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(t){const e=this.materialCache;let n=e.get(t);return n===void 0&&(n=new Set,e.set(t,n)),n}_getShaderStage(t){const e=this.shaderCache;let n=e.get(t);return n===void 0&&(n=new Vm(t),e.set(t,n)),n}}class Vm{constructor(t){this.id=zm++,this.code=t,this.usedTimes=0}}function km(i){return i===Yn||i===Ps||i===Ls}function Hm(i,t,e,n,s,r){const a=new wl,o=new Gm,c=new Set,l=[],u=new Map,f=n.logarithmicDepthBuffer;let h=n.precision;const p={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distance",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function _(v){return c.add(v),v===0?"uv":`uv${v}`}function y(v,R,B,X,q,nt){const G=X.fog,J=q.geometry,lt=v.isMeshStandardMaterial||v.isMeshLambertMaterial||v.isMeshPhongMaterial?X.environment:null,K=v.isMeshStandardMaterial||v.isMeshLambertMaterial&&!v.envMap||v.isMeshPhongMaterial&&!v.envMap,Z=t.get(v.envMap||lt,K),it=Z&&Z.mapping===Bs?Z.image.height:null,rt=p[v.type];v.precision!==null&&(h=n.getMaxPrecision(v.precision),h!==v.precision&&Wt("WebGLProgram.getParameters:",v.precision,"not supported, using",h,"instead."));const ht=J.morphAttributes.position||J.morphAttributes.normal||J.morphAttributes.color,Dt=ht!==void 0?ht.length:0;let Ct=0;J.morphAttributes.position!==void 0&&(Ct=1),J.morphAttributes.normal!==void 0&&(Ct=2),J.morphAttributes.color!==void 0&&(Ct=3);let qt,Xt,Zt,N;if(rt){const ce=en[rt];qt=ce.vertexShader,Xt=ce.fragmentShader}else{qt=v.vertexShader,Xt=v.fragmentShader;const ce=o.getVertexShaderStage(v),ie=o.getFragmentShaderStage(v);o.update(v,ce,ie),Zt=ce.id,N=ie.id}const L=i.getRenderTarget(),C=i.state.buffers.depth.getReversed(),T=q.isInstancedMesh===!0,U=q.isBatchedMesh===!0,et=!!v.map,_t=!!v.matcap,E=!!Z,O=!!v.aoMap,I=!!v.lightMap,Y=!!v.bumpMap&&v.wireframe===!1,$=!!v.normalMap,ot=!!v.displacementMap,mt=!!v.emissiveMap,pt=!!v.metalnessMap,W=!!v.roughnessMap,x=v.anisotropy>0,At=v.clearcoat>0,Nt=v.dispersion>0,b=v.retroreflectivity>0,g=v.iridescence>0,k=v.sheen>0,Q=v.transmission>0,at=x&&!!v.anisotropyMap,xt=At&&!!v.clearcoatMap,vt=At&&!!v.clearcoatNormalMap,ct=At&&!!v.clearcoatRoughnessMap,ut=g&&!!v.iridescenceMap,St=g&&!!v.iridescenceThicknessMap,Ot=k&&!!v.sheenColorMap,yt=k&&!!v.sheenRoughnessMap,Mt=!!v.specularMap,Gt=!!v.specularColorMap,Ht=!!v.specularIntensityMap,Yt=Q&&!!v.transmissionMap,V=Q&&!!v.thicknessMap,Et=!!v.gradientMap,ft=!!v.alphaMap,bt=v.alphaTest>0,Pt=!!v.alphaHash,gt=!!v.extensions;let Vt=an;v.toneMapped&&(L===null||L.isXRRenderTarget===!0)&&(Vt=i.toneMapping);const Bt={shaderID:rt,shaderType:v.type,shaderName:v.name,vertexShader:qt,fragmentShader:Xt,defines:v.defines,customVertexShaderID:Zt,customFragmentShaderID:N,isRawShaderMaterial:v.isRawShaderMaterial===!0,glslVersion:v.glslVersion,precision:h,batching:U,batchingColor:U&&q._colorsTexture!==null,instancing:T,instancingColor:T&&q.instanceColor!==null,instancingMorph:T&&q.morphTexture!==null,outputColorSpace:L===null?i.outputColorSpace:L.isXRRenderTarget===!0?L.texture.colorSpace:te.workingColorSpace,alphaToCoverage:!!v.alphaToCoverage,map:et,matcap:_t,envMap:E,envMapMode:E&&Z.mapping,envMapCubeUVHeight:it,aoMap:O,lightMap:I,bumpMap:Y,normalMap:$,displacementMap:ot,emissiveMap:mt,normalMapObjectSpace:$&&v.normalMapType===Uc,normalMapTangentSpace:$&&v.normalMapType===ca,packedNormalMap:$&&v.normalMapType===ca&&km(v.normalMap.format),metalnessMap:pt,roughnessMap:W,anisotropy:x,anisotropyMap:at,clearcoat:At,clearcoatMap:xt,clearcoatNormalMap:vt,clearcoatRoughnessMap:ct,dispersion:Nt,retroreflection:b,iridescence:g,iridescenceMap:ut,iridescenceThicknessMap:St,sheen:k,sheenColorMap:Ot,sheenRoughnessMap:yt,specularMap:Mt,specularColorMap:Gt,specularIntensityMap:Ht,transmission:Q,transmissionMap:Yt,thicknessMap:V,gradientMap:Et,opaque:v.transparent===!1&&v.blending===Di&&v.alphaToCoverage===!1,alphaMap:ft,alphaTest:bt,alphaHash:Pt,combine:v.combine,mapUv:et&&_(v.map.channel),aoMapUv:O&&_(v.aoMap.channel),lightMapUv:I&&_(v.lightMap.channel),bumpMapUv:Y&&_(v.bumpMap.channel),normalMapUv:$&&_(v.normalMap.channel),displacementMapUv:ot&&_(v.displacementMap.channel),emissiveMapUv:mt&&_(v.emissiveMap.channel),metalnessMapUv:pt&&_(v.metalnessMap.channel),roughnessMapUv:W&&_(v.roughnessMap.channel),anisotropyMapUv:at&&_(v.anisotropyMap.channel),clearcoatMapUv:xt&&_(v.clearcoatMap.channel),clearcoatNormalMapUv:vt&&_(v.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:ct&&_(v.clearcoatRoughnessMap.channel),iridescenceMapUv:ut&&_(v.iridescenceMap.channel),iridescenceThicknessMapUv:St&&_(v.iridescenceThicknessMap.channel),sheenColorMapUv:Ot&&_(v.sheenColorMap.channel),sheenRoughnessMapUv:yt&&_(v.sheenRoughnessMap.channel),specularMapUv:Mt&&_(v.specularMap.channel),specularColorMapUv:Gt&&_(v.specularColorMap.channel),specularIntensityMapUv:Ht&&_(v.specularIntensityMap.channel),transmissionMapUv:Yt&&_(v.transmissionMap.channel),thicknessMapUv:V&&_(v.thicknessMap.channel),alphaMapUv:ft&&_(v.alphaMap.channel),vertexTangents:!!J.attributes.tangent&&($||x),vertexNormals:!!J.attributes.normal,vertexColors:v.vertexColors,vertexAlphas:v.vertexColors===!0&&!!J.attributes.color&&J.attributes.color.itemSize===4,pointsUvs:q.isPoints===!0&&!!J.attributes.uv&&(et||ft),fog:!!G,useFog:v.fog===!0,fogExp2:!!G&&G.isFogExp2,flatShading:v.wireframe===!1&&(v.flatShading===!0||J.attributes.normal===void 0&&$===!1&&(v.isMeshLambertMaterial||v.isMeshPhongMaterial||v.isMeshStandardMaterial||v.isMeshPhysicalMaterial)),sizeAttenuation:v.sizeAttenuation===!0,logarithmicDepthBuffer:f,reversedDepthBuffer:C,skinning:q.isSkinnedMesh===!0,hasPositionAttribute:J.attributes.position!==void 0,morphTargets:J.morphAttributes.position!==void 0,morphNormals:J.morphAttributes.normal!==void 0,morphColors:J.morphAttributes.color!==void 0,morphTargetsCount:Dt,morphTextureStride:Ct,numSunLights:R.sun.length,numDirLights:R.directional.length,numPointLights:R.point.length,numSpotLights:R.spot.length,numSpotLightMaps:R.spotLightMap.length,numRectAreaLights:R.rectArea.length,numHemiLights:R.hemi.length,numSunLightShadows:R.sunShadowMap.length,numDirLightShadows:R.directionalShadowMap.length,numPointLightShadows:R.pointShadowMap.length,numSpotLightShadows:R.spotShadowMap.length,numSpotLightShadowsWithMaps:R.numSpotLightShadowsWithMaps,numLightProbes:R.numLightProbes,numLightProbeGrids:nt.length,numClippingPlanes:r.numPlanes,numClipIntersection:r.numIntersection,dithering:v.dithering,shadowMapEnabled:i.shadowMap.enabled&&B.length>0,shadowMapType:i.shadowMap.type,toneMapping:Vt,decodeVideoTexture:et&&v.map.isVideoTexture===!0&&te.getTransfer(v.map.colorSpace)===re,decodeVideoTextureEmissive:mt&&v.emissiveMap.isVideoTexture===!0&&te.getTransfer(v.emissiveMap.colorSpace)===re,premultipliedAlpha:v.premultipliedAlpha,doubleSided:v.side===Ye,flipSided:v.side===Ie,useDepthPacking:v.depthPacking>=0,depthPacking:v.depthPacking||0,index0AttributeName:v.index0AttributeName,extensionClipCullDistance:gt&&v.extensions.clipCullDistance===!0&&e.has("WEBGL_clip_cull_distance"),extensionMultiDraw:(gt&&v.extensions.multiDraw===!0||U)&&e.has("WEBGL_multi_draw"),rendererExtensionParallelShaderCompile:e.has("KHR_parallel_shader_compile"),customProgramCacheKey:v.customProgramCacheKey()};return Bt.vertexUv1s=c.has(1),Bt.vertexUv2s=c.has(2),Bt.vertexUv3s=c.has(3),c.clear(),Bt}function m(v){const R=[];if(v.shaderID?R.push(v.shaderID):(R.push(v.customVertexShaderID),R.push(v.customFragmentShaderID)),v.defines!==void 0)for(const B in v.defines)R.push(B),R.push(v.defines[B]);return v.isRawShaderMaterial===!1&&(d(R,v),P(R,v),R.push(i.outputColorSpace)),R.push(v.customProgramCacheKey),R.join()}function d(v,R){v.push(R.precision),v.push(R.outputColorSpace),v.push(R.envMapMode),v.push(R.envMapCubeUVHeight),v.push(R.mapUv),v.push(R.alphaMapUv),v.push(R.lightMapUv),v.push(R.aoMapUv),v.push(R.bumpMapUv),v.push(R.normalMapUv),v.push(R.displacementMapUv),v.push(R.emissiveMapUv),v.push(R.metalnessMapUv),v.push(R.roughnessMapUv),v.push(R.anisotropyMapUv),v.push(R.clearcoatMapUv),v.push(R.clearcoatNormalMapUv),v.push(R.clearcoatRoughnessMapUv),v.push(R.iridescenceMapUv),v.push(R.iridescenceThicknessMapUv),v.push(R.sheenColorMapUv),v.push(R.sheenRoughnessMapUv),v.push(R.specularMapUv),v.push(R.specularColorMapUv),v.push(R.specularIntensityMapUv),v.push(R.transmissionMapUv),v.push(R.thicknessMapUv),v.push(R.combine),v.push(R.fogExp2),v.push(R.sizeAttenuation),v.push(R.morphTargetsCount),v.push(R.morphAttributeCount),v.push(R.numSunLights),v.push(R.numDirLights),v.push(R.numPointLights),v.push(R.numSpotLights),v.push(R.numSpotLightMaps),v.push(R.numHemiLights),v.push(R.numRectAreaLights),v.push(R.numSunLightShadows),v.push(R.numDirLightShadows),v.push(R.numPointLightShadows),v.push(R.numSpotLightShadows),v.push(R.numSpotLightShadowsWithMaps),v.push(R.numLightProbes),v.push(R.shadowMapType),v.push(R.toneMapping),v.push(R.numClippingPlanes),v.push(R.numClipIntersection),v.push(R.depthPacking)}function P(v,R){a.disableAll(),R.instancing&&a.enable(0),R.instancingColor&&a.enable(1),R.instancingMorph&&a.enable(2),R.matcap&&a.enable(3),R.envMap&&a.enable(4),R.normalMapObjectSpace&&a.enable(5),R.normalMapTangentSpace&&a.enable(6),R.clearcoat&&a.enable(7),R.iridescence&&a.enable(8),R.alphaTest&&a.enable(9),R.vertexColors&&a.enable(10),R.vertexAlphas&&a.enable(11),R.vertexUv1s&&a.enable(12),R.vertexUv2s&&a.enable(13),R.vertexUv3s&&a.enable(14),R.vertexTangents&&a.enable(15),R.anisotropy&&a.enable(16),R.alphaHash&&a.enable(17),R.batching&&a.enable(18),R.dispersion&&a.enable(19),R.retroreflection&&a.enable(24),R.batchingColor&&a.enable(20),R.gradientMap&&a.enable(21),R.packedNormalMap&&a.enable(22),R.vertexNormals&&a.enable(23),v.push(a.mask),a.disableAll(),R.fog&&a.enable(0),R.useFog&&a.enable(1),R.flatShading&&a.enable(2),R.logarithmicDepthBuffer&&a.enable(3),R.reversedDepthBuffer&&a.enable(4),R.skinning&&a.enable(5),R.morphTargets&&a.enable(6),R.morphNormals&&a.enable(7),R.morphColors&&a.enable(8),R.premultipliedAlpha&&a.enable(9),R.shadowMapEnabled&&a.enable(10),R.doubleSided&&a.enable(11),R.flipSided&&a.enable(12),R.useDepthPacking&&a.enable(13),R.dithering&&a.enable(14),R.transmission&&a.enable(15),R.sheen&&a.enable(16),R.opaque&&a.enable(17),R.pointsUvs&&a.enable(18),R.decodeVideoTexture&&a.enable(19),R.decodeVideoTextureEmissive&&a.enable(20),R.alphaToCoverage&&a.enable(21),R.numLightProbeGrids>0&&a.enable(22),R.hasPositionAttribute&&a.enable(23),v.push(a.mask)}function D(v){const R=p[v.type];let B;if(R){const X=en[R];B=eu.clone(X.uniforms)}else B=v.uniforms;return B}function S(v,R){let B=u.get(R);return B!==void 0?++B.usedTimes:(B=new Bm(i,R,v,s),l.push(B),u.set(R,B)),B}function w(v){if(--v.usedTimes===0){const R=l.indexOf(v);l[R]=l[l.length-1],l.pop(),u.delete(v.cacheKey),v.destroy()}}function A(v){o.remove(v)}function F(){o.dispose()}return{getParameters:y,getProgramCacheKey:m,getUniforms:D,acquireProgram:S,releaseProgram:w,releaseShaderCache:A,programs:l,dispose:F}}function Wm(){let i=new WeakMap;function t(a){return i.has(a)}function e(a){let o=i.get(a);return o===void 0&&(o={},i.set(a,o)),o}function n(a){i.delete(a)}function s(a,o,c){i.get(a)[o]=c}function r(){i=new WeakMap}return{has:t,get:e,remove:n,update:s,dispose:r}}function Xm(i,t){return i.groupOrder!==t.groupOrder?i.groupOrder-t.groupOrder:i.renderOrder!==t.renderOrder?i.renderOrder-t.renderOrder:i.material.id!==t.material.id?i.material.id-t.material.id:i.materialVariant!==t.materialVariant?i.materialVariant-t.materialVariant:i.z!==t.z?i.z-t.z:i.id-t.id}function Qo(i,t){return i.groupOrder!==t.groupOrder?i.groupOrder-t.groupOrder:i.renderOrder!==t.renderOrder?i.renderOrder-t.renderOrder:i.z!==t.z?t.z-i.z:i.id-t.id}function jo(){const i=[];let t=0;const e=[],n=[],s=[];function r(){t=0,e.length=0,n.length=0,s.length=0}function a(h){let p=0;return h.isInstancedMesh&&(p+=2),h.isSkinnedMesh&&(p+=1),p}function o(h,p,_,y,m,d){let P=i[t];return P===void 0?(P={id:h.id,object:h,geometry:p,material:_,materialVariant:a(h),groupOrder:y,renderOrder:h.renderOrder,z:m,group:d},i[t]=P):(P.id=h.id,P.object=h,P.geometry=p,P.material=_,P.materialVariant=a(h),P.groupOrder=y,P.renderOrder=h.renderOrder,P.z=m,P.group=d),t++,P}function c(h,p,_,y,m,d,P){P.reversedDepth===!0&&(m=-m);const D=o(h,p,_,y,m,d);_.transmission>0?n.push(D):_.transparent===!0?s.push(D):e.push(D)}function l(h,p,_,y,m,d){const P=o(h,p,_,y,m,d);_.transmission>0?n.unshift(P):_.transparent===!0?s.unshift(P):e.unshift(P)}function u(h,p){e.length>1&&e.sort(h||Xm),n.length>1&&n.sort(p||Qo),s.length>1&&s.sort(p||Qo)}function f(){for(let h=t,p=i.length;h<p;h++){const _=i[h];if(_.id===null)break;_.id=null,_.object=null,_.geometry=null,_.material=null,_.group=null}}return{opaque:e,transmissive:n,transparent:s,init:r,push:c,unshift:l,finish:f,sort:u}}function qm(){let i=new WeakMap;function t(n,s){const r=i.get(n);let a;return r===void 0?(a=new jo,i.set(n,[a])):s>=r.length?(a=new jo,r.push(a)):a=r[s],a}function e(){i=new WeakMap}return{get:t,dispose:e}}function Ym(){const i={};return{get:function(t){if(i[t.id]!==void 0)return i[t.id];let e;switch(t.type){case"SunLight":case"DirectionalLight":e={direction:new H,color:new jt};break;case"SpotLight":e={position:new H,direction:new H,color:new jt,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":e={position:new H,color:new jt,distance:0,decay:0};break;case"HemisphereLight":e={direction:new H,skyColor:new jt,groundColor:new jt};break;case"RectAreaLight":e={color:new jt,position:new H,halfWidth:new H,halfHeight:new H};break}return i[t.id]=e,e}}}function Zm(){const i={};return{get:function(t){if(i[t.id]!==void 0)return i[t.id];let e;switch(t.type){case"SunLight":case"DirectionalLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new dt};break;case"SpotLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new dt};break;case"PointLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new dt,shadowCameraNear:1,shadowCameraFar:1e3};break}return i[t.id]=e,e}}}let Km=0;function Jm(i,t){return(t.castShadow?2:0)-(i.castShadow?2:0)+(t.map?1:0)-(i.map?1:0)}function $m(i){const t=new Ym,e=Zm(),n={version:0,hash:{sunLength:-1,directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numSunShadows:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],sun:[],sunShadow:[],sunShadowMap:[],sunShadowMatrix:[],sunShadowCascade:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let l=0;l<9;l++)n.probe.push(new H);const s=new H,r=new pe,a=new pe;function o(l){let u=0,f=0,h=0;for(let q=0;q<9;q++)n.probe[q].set(0,0,0);let p=0,_=0,y=0,m=0,d=0,P=0,D=0,S=0,w=0,A=0,F=0,v=0,R=0,B=0;l.sort(Jm);for(let q=0,nt=l.length;q<nt;q++){const G=l[q],J=G.color,lt=G.intensity,K=G.distance;let Z=null;if(G.shadow&&G.shadow.map&&(G.shadow.map.texture.format===Yn?Z=G.shadow.map.texture:Z=G.shadow.map.depthTexture||G.shadow.map.texture),G.isAmbientLight)u+=J.r*lt,f+=J.g*lt,h+=J.b*lt;else if(G.isLightProbe){for(let it=0;it<9;it++)n.probe[it].addScaledVector(G.sh.coefficients[it],lt);B++}else if(G.isSunLight){const it=t.get(G);if(it.color.copy(G.color).multiplyScalar(G.intensity),G.castShadow){const rt=G.shadow,ht=e.get(G);ht.shadowIntensity=rt.intensity,ht.shadowBias=rt.bias,ht.shadowNormalBias=rt.normalBias,ht.shadowRadius=rt.radius,ht.shadowMapSize.copy(rt.mapSize).multiply(rt.getFrameExtents()),n.sunShadow[_]=ht,n.sunShadowMap[_]=Z;const Dt=rt.getViewportCount();for(let Ct=0;Ct<Dt;Ct++)n.sunShadowMatrix[y+Ct]=rt.getMatrix(Ct),n.sunShadowCascade[y+Ct]=rt._cascadeData[Ct];y+=Dt,_++}n.sun[p]=it,p++}else if(G.isDirectionalLight){const it=t.get(G);if(it.color.copy(G.color).multiplyScalar(G.intensity),G.castShadow){const rt=G.shadow,ht=e.get(G);ht.shadowIntensity=rt.intensity,ht.shadowBias=rt.bias,ht.shadowNormalBias=rt.normalBias,ht.shadowRadius=rt.radius,ht.shadowMapSize=rt.mapSize,n.directionalShadow[m]=ht,n.directionalShadowMap[m]=Z,n.directionalShadowMatrix[m]=G.shadow.matrix,w++}n.directional[m]=it,m++}else if(G.isSpotLight){const it=t.get(G);it.position.setFromMatrixPosition(G.matrixWorld),it.color.copy(J).multiplyScalar(lt),it.distance=K,it.coneCos=Math.cos(G.angle),it.penumbraCos=Math.cos(G.angle*(1-G.penumbra)),it.decay=G.decay,n.spot[P]=it;const rt=G.shadow;if(G.map&&(n.spotLightMap[v]=G.map,v++,rt.updateMatrices(G),G.castShadow&&R++),n.spotLightMatrix[P]=rt.matrix,G.castShadow){const ht=e.get(G);ht.shadowIntensity=rt.intensity,ht.shadowBias=rt.bias,ht.shadowNormalBias=rt.normalBias,ht.shadowRadius=rt.radius,ht.shadowMapSize=rt.mapSize,n.spotShadow[P]=ht,n.spotShadowMap[P]=Z,F++}P++}else if(G.isRectAreaLight){const it=t.get(G);it.color.copy(J).multiplyScalar(lt),it.halfWidth.set(G.width*.5,0,0),it.halfHeight.set(0,G.height*.5,0),n.rectArea[D]=it,D++}else if(G.isPointLight){const it=t.get(G);if(it.color.copy(G.color).multiplyScalar(G.intensity),it.distance=G.distance,it.decay=G.decay,G.castShadow){const rt=G.shadow,ht=e.get(G);ht.shadowIntensity=rt.intensity,ht.shadowBias=rt.bias,ht.shadowNormalBias=rt.normalBias,ht.shadowRadius=rt.radius,ht.shadowMapSize=rt.mapSize,ht.shadowCameraNear=rt.camera.near,ht.shadowCameraFar=rt.camera.far,n.pointShadow[d]=ht,n.pointShadowMap[d]=Z,n.pointShadowMatrix[d]=G.shadow.matrix,A++}n.point[d]=it,d++}else if(G.isHemisphereLight){const it=t.get(G);it.skyColor.copy(G.color).multiplyScalar(lt),it.groundColor.copy(G.groundColor).multiplyScalar(lt),n.hemi[S]=it,S++}}D>0&&(i.has("OES_texture_float_linear")===!0?(n.rectAreaLTC1=Tt.LTC_FLOAT_1,n.rectAreaLTC2=Tt.LTC_FLOAT_2):(n.rectAreaLTC1=Tt.LTC_HALF_1,n.rectAreaLTC2=Tt.LTC_HALF_2)),n.ambient[0]=u,n.ambient[1]=f,n.ambient[2]=h;const X=n.hash;(X.sunLength!==p||X.directionalLength!==m||X.pointLength!==d||X.spotLength!==P||X.rectAreaLength!==D||X.hemiLength!==S||X.numSunShadows!==_||X.numDirectionalShadows!==w||X.numPointShadows!==A||X.numSpotShadows!==F||X.numSpotMaps!==v||X.numLightProbes!==B)&&(n.sun.length=p,n.directional.length=m,n.spot.length=P,n.rectArea.length=D,n.point.length=d,n.hemi.length=S,n.sunShadow.length=_,n.sunShadowMap.length=_,n.sunShadowMatrix.length=y,n.sunShadowCascade.length=y,n.directionalShadow.length=w,n.directionalShadowMap.length=w,n.directionalShadowMatrix.length=w,n.pointShadow.length=A,n.pointShadowMap.length=A,n.pointShadowMatrix.length=A,n.spotShadow.length=F,n.spotShadowMap.length=F,n.spotLightMatrix.length=F+v-R,n.spotLightMap.length=v,n.numSpotLightShadowsWithMaps=R,n.numLightProbes=B,X.sunLength=p,X.directionalLength=m,X.pointLength=d,X.spotLength=P,X.rectAreaLength=D,X.hemiLength=S,X.numSunShadows=_,X.numDirectionalShadows=w,X.numPointShadows=A,X.numSpotShadows=F,X.numSpotMaps=v,X.numLightProbes=B,n.version=Km++)}function c(l,u){let f=0,h=0,p=0,_=0,y=0,m=0;const d=u.matrixWorldInverse;for(let P=0,D=l.length;P<D;P++){const S=l[P];if(S.isSunLight){const w=n.sun[f];w.direction.setFromMatrixPosition(S.matrixWorld),w.direction.transformDirection(d),f++}else if(S.isDirectionalLight){const w=n.directional[h];w.direction.setFromMatrixPosition(S.matrixWorld),s.setFromMatrixPosition(S.target.matrixWorld),w.direction.sub(s),w.direction.transformDirection(d),h++}else if(S.isSpotLight){const w=n.spot[_];w.position.setFromMatrixPosition(S.matrixWorld),w.position.applyMatrix4(d),w.direction.setFromMatrixPosition(S.matrixWorld),s.setFromMatrixPosition(S.target.matrixWorld),w.direction.sub(s),w.direction.transformDirection(d),_++}else if(S.isRectAreaLight){const w=n.rectArea[y];w.position.setFromMatrixPosition(S.matrixWorld),w.position.applyMatrix4(d),a.identity(),r.copy(S.matrixWorld),r.premultiply(d),a.extractRotation(r),w.halfWidth.set(S.width*.5,0,0),w.halfHeight.set(0,S.height*.5,0),w.halfWidth.applyMatrix4(a),w.halfHeight.applyMatrix4(a),y++}else if(S.isPointLight){const w=n.point[p];w.position.setFromMatrixPosition(S.matrixWorld),w.position.applyMatrix4(d),p++}else if(S.isHemisphereLight){const w=n.hemi[m];w.direction.setFromMatrixPosition(S.matrixWorld),w.direction.transformDirection(d),m++}}}return{setup:o,setupView:c,state:n}}function tl(i){const t=new $m(i),e=[],n=[],s=[];function r(h){f.camera=h,e.length=0,n.length=0,s.length=0}function a(h){e.push(h)}function o(h){n.push(h)}function c(h){s.push(h)}function l(){t.setup(e)}function u(h){t.setupView(e,h)}const f={lightsArray:e,shadowsArray:n,lightProbeGridArray:s,camera:null,lights:t,transmissionRenderTarget:{},textureUnits:0};return{init:r,state:f,setupLights:l,setupLightsView:u,pushLight:a,pushShadow:o,pushLightProbeGrid:c}}function Qm(i){let t=new WeakMap;function e(s,r=0){const a=t.get(s);let o;return a===void 0?(o=new tl(i),t.set(s,[o])):r>=a.length?(o=new tl(i),a.push(o)):o=a[r],o}function n(){t=new WeakMap}return{get:e,dispose:n}}const jm=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,tg=`uniform sampler2D shadow_pass;
uniform vec2 resolution;
uniform float radius;
void main() {
	const float samples = float( VSM_SAMPLES );
	float mean = 0.0;
	float squared_mean = 0.0;
	float uvStride = samples <= 1.0 ? 0.0 : 2.0 / ( samples - 1.0 );
	float uvStart = samples <= 1.0 ? 0.0 : - 1.0;
	for ( float i = 0.0; i < samples; i ++ ) {
		float uvOffset = uvStart + i * uvStride;
		#ifdef HORIZONTAL_PASS
			vec2 distribution = texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( uvOffset, 0.0 ) * radius ) / resolution ).rg;
			mean += distribution.x;
			squared_mean += distribution.y * distribution.y + distribution.x * distribution.x;
		#else
			float depth = texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( 0.0, uvOffset ) * radius ) / resolution ).r;
			mean += depth;
			squared_mean += depth * depth;
		#endif
	}
	mean = mean / samples;
	squared_mean = squared_mean / samples;
	float std_dev = sqrt( max( 0.0, squared_mean - mean * mean ) );
	gl_FragColor = vec4( mean, std_dev, 0.0, 1.0 );
}`,eg=[new H(1,0,0),new H(-1,0,0),new H(0,1,0),new H(0,-1,0),new H(0,0,1),new H(0,0,-1)],ng=[new H(0,-1,0),new H(0,-1,0),new H(0,0,1),new H(0,0,-1),new H(0,-1,0),new H(0,-1,0)],el=new pe,Ri=new H,br=new H;function ig(i,t,e){let n=new Aa;const s=new dt,r=new dt,a=new fe,o=new au,c=new ou,l={},u=e.maxTextureSize,f={[Xn]:Ie,[Ie]:Xn,[Ye]:Ye},h=new un({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new dt},radius:{value:4}},vertexShader:jm,fragmentShader:tg}),p=h.clone();p.defines.HORIZONTAL_PASS=1;const _=new ke;_.setAttribute("position",new on(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));const y=new hn(_,h),m=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=Ms;let d=this.type;this.render=function(A,F,v){if(m.enabled===!1||m.autoUpdate===!1&&m.needsUpdate===!1||A.length===0)return;this.type===fc&&(Wt("WebGLShadowMap: PCFSoftShadowMap has been removed. Using PCFShadowMap instead."),this.type=Ms);const R=i.getRenderTarget(),B=i.getActiveCubeFace(),X=i.getActiveMipmapLevel(),q=i.state;q.setBlending(Sn),q.buffers.depth.getReversed()===!0?q.buffers.color.setClear(0,0,0,0):q.buffers.color.setClear(1,1,1,1),q.buffers.depth.setTest(!0),q.setScissorTest(!1);const nt=d!==this.type;nt&&F.traverse(function(G){G.material&&(Array.isArray(G.material)?G.material.forEach(J=>J.needsUpdate=!0):G.material.needsUpdate=!0)});for(let G=0,J=A.length;G<J;G++){const lt=A[G],K=lt.shadow;if(K===void 0){Wt("WebGLShadowMap:",lt,"has no shadow.");continue}if(K.autoUpdate===!1&&K.needsUpdate===!1)continue;s.copy(K.mapSize);const Z=K.getFrameExtents();s.multiply(Z),r.copy(K.mapSize),(s.x>u||s.y>u)&&(s.x>u&&(r.x=Math.floor(u/Z.x),s.x=r.x*Z.x,K.mapSize.x=r.x),s.y>u&&(r.y=Math.floor(u/Z.y),s.y=r.y*Z.y,K.mapSize.y=r.y));const it=i.state.buffers.depth.getReversed();if(K.camera._reversedDepth=it,K.map===null||nt===!0){if(K.map!==null&&(K.map.depthTexture!==null&&(K.map.depthTexture.dispose(),K.map.depthTexture=null),K.map.dispose()),this.type===Ci){if(lt.isPointLight){Wt("WebGLShadowMap: VSM shadow maps are not supported for PointLights. Use PCF or BasicShadowMap instead.");continue}K.map=new Je(s.x,s.y,{format:Yn,type:cn,minFilter:Ae,magFilter:Ae,generateMipmaps:!1}),K.map.texture.name=lt.name+".shadowMap",K.map.depthTexture=new zi(s.x,s.y,sn),K.map.depthTexture.name=lt.name+".shadowMapDepth",K.map.depthTexture.format=yn,K.map.depthTexture.compareFunction=null,K.map.depthTexture.minFilter=ye,K.map.depthTexture.magFilter=ye}else lt.isPointLight?(K.map=new Kl(s.x),K.map.depthTexture=new Sh(s.x,ln)):(K.map=new Je(s.x,s.y),K.map.depthTexture=new zi(s.x,s.y,ln)),K.map.depthTexture.name=lt.name+".shadowMap",K.map.depthTexture.format=yn,this.type===Ms?(K.map.depthTexture.compareFunction=it?Ea:ya,K.map.depthTexture.minFilter=Ae,K.map.depthTexture.magFilter=Ae):(K.map.depthTexture.compareFunction=null,K.map.depthTexture.minFilter=ye,K.map.depthTexture.magFilter=ye);K.camera.updateProjectionMatrix()}K.map.isWebGLCubeRenderTarget!==!0&&(K.map.width!==s.x||K.map.height!==s.y)&&K.map.setSize(s.x,s.y);const rt=K.map.isWebGLCubeRenderTarget?6:K.getViewportCount();lt.isPointLight!==!0&&K.updateMatrices(lt,v);for(let ht=0;ht<rt;ht++){const Dt=K.getCamera(ht);if(lt.isPointLight){const Ct=K.camera,qt=K.matrix,Xt=lt.distance||Ct.far;Xt!==Ct.far&&(Ct.far=Xt,Ct.updateProjectionMatrix()),Ri.setFromMatrixPosition(lt.matrixWorld),Ct.position.copy(Ri),br.copy(Ct.position),br.add(eg[ht]),Ct.up.copy(ng[ht]),Ct.lookAt(br),Ct.updateMatrixWorld(),qt.makeTranslation(-Ri.x,-Ri.y,-Ri.z),el.multiplyMatrices(Ct.projectionMatrix,Ct.matrixWorldInverse),K._frustum.setFromProjectionMatrix(el,Ct.coordinateSystem,Ct.reversedDepth)}if(K.map.isWebGLCubeRenderTarget)i.setRenderTarget(K.map,ht),i.clear();else{ht===0&&(i.setRenderTarget(K.map),i.clear());const Ct=K.getViewport(ht);a.set(r.x*Ct.x,r.y*Ct.y,r.x*Ct.z,r.y*Ct.w),q.viewport(a)}n=K.getFrustum(ht),S(F,v,Dt,lt,this.type)}K.isPointLightShadow!==!0&&this.type===Ci&&P(K,v),K.needsUpdate=!1}d=this.type,m.needsUpdate=!1,i.setRenderTarget(R,B,X)};function P(A,F){const v=t.update(y);h.defines.VSM_SAMPLES!==A.blurSamples&&(h.defines.VSM_SAMPLES=A.blurSamples,p.defines.VSM_SAMPLES=A.blurSamples,h.needsUpdate=!0,p.needsUpdate=!0),A.mapPass===null?A.mapPass=new Je(s.x,s.y,{format:Yn,type:cn}):(A.mapPass.width!==A.map.width||A.mapPass.height!==A.map.height)&&A.mapPass.setSize(A.map.width,A.map.height),h.uniforms.shadow_pass.value=A.map.depthTexture,h.uniforms.resolution.value.set(A.map.width,A.map.height),h.uniforms.radius.value=A.radius,i.setRenderTarget(A.mapPass),i.clear(),i.renderBufferDirect(F,null,v,h,y,null),p.uniforms.shadow_pass.value=A.mapPass.texture,p.uniforms.resolution.value.set(A.map.width,A.map.height),p.uniforms.radius.value=A.radius,i.setRenderTarget(A.map),i.clear(),i.renderBufferDirect(F,null,v,p,y,null)}function D(A,F,v,R){let B=null;const X=v.isPointLight===!0?A.customDistanceMaterial:A.customDepthMaterial;if(X!==void 0)B=X;else if(B=v.isPointLight===!0?c:o,i.localClippingEnabled&&F.clipShadows===!0&&Array.isArray(F.clippingPlanes)&&F.clippingPlanes.length!==0||F.displacementMap&&F.displacementScale!==0||F.alphaMap&&F.alphaTest>0||F.map&&F.alphaTest>0||F.alphaToCoverage===!0){const q=B.uuid,nt=F.uuid;let G=l[q];G===void 0&&(G={},l[q]=G);let J=G[nt];J===void 0&&(J=B.clone(),G[nt]=J,F.addEventListener("dispose",w)),B=J}if(B.visible=F.visible,B.wireframe=F.wireframe,R===Ci?B.side=F.shadowSide!==null?F.shadowSide:F.side:B.side=F.shadowSide!==null?F.shadowSide:f[F.side],B.alphaMap=F.alphaMap,B.alphaTest=F.alphaToCoverage===!0?.5:F.alphaTest,B.map=F.map,B.clipShadows=F.clipShadows,B.clippingPlanes=F.clippingPlanes,B.clipIntersection=F.clipIntersection,B.displacementMap=F.displacementMap,B.displacementScale=F.displacementScale,B.displacementBias=F.displacementBias,B.wireframeLinewidth=F.wireframeLinewidth,B.linewidth=F.linewidth,v.isPointLight===!0&&B.isMeshDistanceMaterial===!0){const q=i.properties.get(B);q.light=v}return B}function S(A,F,v,R,B){if(A.visible===!1)return;if(A.layers.test(F.layers)&&(A.isMesh||A.isLine||A.isPoints)&&(A.castShadow||A.receiveShadow&&B===Ci)&&(!A.frustumCulled||A.intersectsFrustum(n))){A.modelViewMatrix.multiplyMatrices(v.matrixWorldInverse,A.matrixWorld);const nt=t.update(A),G=A.material;if(Array.isArray(G)){const J=nt.groups;for(let lt=0,K=J.length;lt<K;lt++){const Z=J[lt],it=G[Z.materialIndex];if(it&&it.visible){const rt=D(A,it,R,B);A.onBeforeShadow(i,A,F,v,nt,rt,Z),i.renderBufferDirect(v,null,nt,rt,A,Z),A.onAfterShadow(i,A,F,v,nt,rt,Z)}}}else if(G.visible){const J=D(A,G,R,B);A.onBeforeShadow(i,A,F,v,nt,J,null),i.renderBufferDirect(v,null,nt,J,A,null),A.onAfterShadow(i,A,F,v,nt,J,null)}}const q=A.children;for(let nt=0,G=q.length;nt<G;nt++)S(q[nt],F,v,R,B)}function w(A){A.target.removeEventListener("dispose",w);for(const v in l){const R=l[v],B=A.target.uuid;B in R&&(R[B].dispose(),delete R[B])}}}function sg(i,t){function e(){let V=!1;const Et=new fe;let ft=null;const bt=new fe(0,0,0,0);return{setMask:function(Pt){ft!==Pt&&!V&&(i.colorMask(Pt,Pt,Pt,Pt),ft=Pt)},setLocked:function(Pt){V=Pt},setClear:function(Pt,gt,Vt,Bt,ce){ce===!0&&(Pt*=Bt,gt*=Bt,Vt*=Bt),Et.set(Pt,gt,Vt,Bt),bt.equals(Et)===!1&&(i.clearColor(Pt,gt,Vt,Bt),bt.copy(Et))},reset:function(){V=!1,ft=null,bt.set(-1,0,0,0)}}}function n(){let V=!1,Et=!1,ft=null,bt=null,Pt=null;return{setReversed:function(gt){if(Et!==gt){const Vt=t.get("EXT_clip_control");gt?Vt.clipControlEXT(Vt.LOWER_LEFT_EXT,Vt.ZERO_TO_ONE_EXT):Vt.clipControlEXT(Vt.LOWER_LEFT_EXT,Vt.NEGATIVE_ONE_TO_ONE_EXT),Et=gt;const Bt=Pt;Pt=null,this.setClear(Bt)}},getReversed:function(){return Et},setTest:function(gt){gt?L(i.DEPTH_TEST):C(i.DEPTH_TEST)},setMask:function(gt){ft!==gt&&!V&&(i.depthMask(gt),ft=gt)},setFunc:function(gt){if(Et&&(gt=Yc[gt]),bt!==gt){switch(gt){case Ar:i.depthFunc(i.NEVER);break;case wr:i.depthFunc(i.ALWAYS);break;case Rr:i.depthFunc(i.LESS);break;case Ui:i.depthFunc(i.LEQUAL);break;case Cr:i.depthFunc(i.EQUAL);break;case Pr:i.depthFunc(i.GEQUAL);break;case Lr:i.depthFunc(i.GREATER);break;case Dr:i.depthFunc(i.NOTEQUAL);break;default:i.depthFunc(i.LEQUAL)}bt=gt}},setLocked:function(gt){V=gt},setClear:function(gt){Pt!==gt&&(Pt=gt,Et&&(gt=1-gt),i.clearDepth(gt))},reset:function(){V=!1,ft=null,bt=null,Pt=null,Et=!1}}}function s(){let V=!1,Et=null,ft=null,bt=null,Pt=null,gt=null,Vt=null,Bt=null,ce=null;return{setTest:function(ie){V||(ie?L(i.STENCIL_TEST):C(i.STENCIL_TEST))},setMask:function(ie){Et!==ie&&!V&&(i.stencilMask(ie),Et=ie)},setFunc:function(ie,He,$e){(ft!==ie||bt!==He||Pt!==$e)&&(i.stencilFunc(ie,He,$e),ft=ie,bt=He,Pt=$e)},setOp:function(ie,He,$e){(gt!==ie||Vt!==He||Bt!==$e)&&(i.stencilOp(ie,He,$e),gt=ie,Vt=He,Bt=$e)},setLocked:function(ie){V=ie},setClear:function(ie){ce!==ie&&(i.clearStencil(ie),ce=ie)},reset:function(){V=!1,Et=null,ft=null,bt=null,Pt=null,gt=null,Vt=null,Bt=null,ce=null}}}const r=new e,a=new n,o=new s,c=new WeakMap,l=new WeakMap;let u={},f={},h={},p=new WeakMap,_=[],y=null,m=!1,d=null,P=null,D=null,S=null,w=null,A=null,F=null,v=new jt(0,0,0),R=0,B=!1,X=null,q=null,nt=null,G=null,J=null;const lt=i.getParameter(i.MAX_COMBINED_TEXTURE_IMAGE_UNITS);let K=!1,Z=0;const it=i.getParameter(i.VERSION);it.indexOf("WebGL")!==-1?(Z=parseFloat(/^WebGL (\d)/.exec(it)[1]),K=Z>=1):it.indexOf("OpenGL ES")!==-1&&(Z=parseFloat(/^OpenGL ES (\d)/.exec(it)[1]),K=Z>=2);let rt=null,ht={};const Dt=i.getParameter(i.SCISSOR_BOX),Ct=i.getParameter(i.VIEWPORT),qt=new fe().fromArray(Dt),Xt=new fe().fromArray(Ct);function Zt(V,Et,ft,bt){const Pt=new Uint8Array(4),gt=i.createTexture();i.bindTexture(V,gt),i.texParameteri(V,i.TEXTURE_MIN_FILTER,i.NEAREST),i.texParameteri(V,i.TEXTURE_MAG_FILTER,i.NEAREST);for(let Vt=0;Vt<ft;Vt++)V===i.TEXTURE_3D||V===i.TEXTURE_2D_ARRAY?i.texImage3D(Et,0,i.RGBA,1,1,bt,0,i.RGBA,i.UNSIGNED_BYTE,Pt):i.texImage2D(Et+Vt,0,i.RGBA,1,1,0,i.RGBA,i.UNSIGNED_BYTE,Pt);return gt}const N={};N[i.TEXTURE_2D]=Zt(i.TEXTURE_2D,i.TEXTURE_2D,1),N[i.TEXTURE_CUBE_MAP]=Zt(i.TEXTURE_CUBE_MAP,i.TEXTURE_CUBE_MAP_POSITIVE_X,6),N[i.TEXTURE_2D_ARRAY]=Zt(i.TEXTURE_2D_ARRAY,i.TEXTURE_2D_ARRAY,1,1),N[i.TEXTURE_3D]=Zt(i.TEXTURE_3D,i.TEXTURE_3D,1,1),r.setClear(0,0,0,1),a.setClear(1),o.setClear(0),L(i.DEPTH_TEST),a.setFunc(Ui),Y(!1),$(Za),L(i.CULL_FACE),O(Sn);function L(V){u[V]!==!0&&(i.enable(V),u[V]=!0)}function C(V){u[V]!==!1&&(i.disable(V),u[V]=!1)}function T(V,Et){return h[V]!==Et?(i.bindFramebuffer(V,Et),h[V]=Et,V===i.DRAW_FRAMEBUFFER&&(h[i.FRAMEBUFFER]=Et),V===i.FRAMEBUFFER&&(h[i.DRAW_FRAMEBUFFER]=Et),!0):!1}function U(V,Et){let ft=_,bt=!1;if(V){ft=p.get(Et),ft===void 0&&(ft=[],p.set(Et,ft));const Pt=V.textures;if(ft.length!==Pt.length||ft[0]!==i.COLOR_ATTACHMENT0){for(let gt=0,Vt=Pt.length;gt<Vt;gt++)ft[gt]=i.COLOR_ATTACHMENT0+gt;ft.length=Pt.length,bt=!0}}else ft[0]!==i.BACK&&(ft[0]=i.BACK,bt=!0);bt&&i.drawBuffers(ft)}function et(V){return y!==V?(i.useProgram(V),y=V,!0):!1}const _t={[hi]:i.FUNC_ADD,[pc]:i.FUNC_SUBTRACT,[mc]:i.FUNC_REVERSE_SUBTRACT};_t[gc]=i.MIN,_t[_c]=i.MAX;const E={[xc]:i.ZERO,[vc]:i.ONE,[Sc]:i.SRC_COLOR,[ol]:i.SRC_ALPHA,[Ac]:i.SRC_ALPHA_SATURATE,[bc]:i.DST_COLOR,[yc]:i.DST_ALPHA,[Mc]:i.ONE_MINUS_SRC_COLOR,[ll]:i.ONE_MINUS_SRC_ALPHA,[Tc]:i.ONE_MINUS_DST_COLOR,[Ec]:i.ONE_MINUS_DST_ALPHA,[wc]:i.CONSTANT_COLOR,[Rc]:i.ONE_MINUS_CONSTANT_COLOR,[Cc]:i.CONSTANT_ALPHA,[Pc]:i.ONE_MINUS_CONSTANT_ALPHA};function O(V,Et,ft,bt,Pt,gt,Vt,Bt,ce,ie){if(V===Sn){m===!0&&(C(i.BLEND),m=!1);return}if(m===!1&&(L(i.BLEND),m=!0),V!==dc){if(V!==d||ie!==B){if((P!==hi||w!==hi)&&(i.blendEquation(i.FUNC_ADD),P=hi,w=hi),ie)switch(V){case Di:i.blendFuncSeparate(i.ONE,i.ONE_MINUS_SRC_ALPHA,i.ONE,i.ONE_MINUS_SRC_ALPHA);break;case Ka:i.blendFunc(i.ONE,i.ONE);break;case Ja:i.blendFuncSeparate(i.ZERO,i.ONE_MINUS_SRC_COLOR,i.ZERO,i.ONE);break;case $a:i.blendFuncSeparate(i.DST_COLOR,i.ONE_MINUS_SRC_ALPHA,i.ZERO,i.ONE);break;default:ne("WebGLState: Invalid blending: ",V);break}else switch(V){case Di:i.blendFuncSeparate(i.SRC_ALPHA,i.ONE_MINUS_SRC_ALPHA,i.ONE,i.ONE_MINUS_SRC_ALPHA);break;case Ka:i.blendFuncSeparate(i.SRC_ALPHA,i.ONE,i.ONE,i.ONE);break;case Ja:ne("WebGLState: SubtractiveBlending requires material.premultipliedAlpha = true");break;case $a:ne("WebGLState: MultiplyBlending requires material.premultipliedAlpha = true");break;default:ne("WebGLState: Invalid blending: ",V);break}D=null,S=null,A=null,F=null,v.set(0,0,0),R=0,d=V,B=ie}return}Pt=Pt||Et,gt=gt||ft,Vt=Vt||bt,(Et!==P||Pt!==w)&&(i.blendEquationSeparate(_t[Et],_t[Pt]),P=Et,w=Pt),(ft!==D||bt!==S||gt!==A||Vt!==F)&&(i.blendFuncSeparate(E[ft],E[bt],E[gt],E[Vt]),D=ft,S=bt,A=gt,F=Vt),(Bt.equals(v)===!1||ce!==R)&&(i.blendColor(Bt.r,Bt.g,Bt.b,ce),v.copy(Bt),R=ce),d=V,B=!1}function I(V,Et){V.side===Ye?C(i.CULL_FACE):L(i.CULL_FACE);let ft=V.side===Ie;Et&&(ft=!ft),Y(ft),V.blending===Di&&V.transparent===!1?O(Sn):O(V.blending,V.blendEquation,V.blendSrc,V.blendDst,V.blendEquationAlpha,V.blendSrcAlpha,V.blendDstAlpha,V.blendColor,V.blendAlpha,V.premultipliedAlpha),a.setFunc(V.depthFunc),a.setTest(V.depthTest),a.setMask(V.depthWrite),r.setMask(V.colorWrite);const bt=V.stencilWrite;o.setTest(bt),bt&&(o.setMask(V.stencilWriteMask),o.setFunc(V.stencilFunc,V.stencilRef,V.stencilFuncMask),o.setOp(V.stencilFail,V.stencilZFail,V.stencilZPass)),mt(V.polygonOffset,V.polygonOffsetFactor,V.polygonOffsetUnits),V.alphaToCoverage===!0?L(i.SAMPLE_ALPHA_TO_COVERAGE):C(i.SAMPLE_ALPHA_TO_COVERAGE)}function Y(V){X!==V&&(V?i.frontFace(i.CW):i.frontFace(i.CCW),X=V)}function $(V){V!==hc?(L(i.CULL_FACE),V!==q&&(V===Za?i.cullFace(i.BACK):V===uc?i.cullFace(i.FRONT):i.cullFace(i.FRONT_AND_BACK))):C(i.CULL_FACE),q=V}function ot(V){V!==nt&&(K&&i.lineWidth(V),nt=V)}function mt(V,Et,ft){V?(L(i.POLYGON_OFFSET_FILL),(G!==Et||J!==ft)&&(G=Et,J=ft,a.getReversed()&&(Et=-Et),i.polygonOffset(Et,ft))):C(i.POLYGON_OFFSET_FILL)}function pt(V){V?L(i.SCISSOR_TEST):C(i.SCISSOR_TEST)}function W(V){V===void 0&&(V=i.TEXTURE0+lt-1),rt!==V&&(i.activeTexture(V),rt=V)}function x(V,Et,ft){ft===void 0&&(rt===null?ft=i.TEXTURE0+lt-1:ft=rt);let bt=ht[ft];bt===void 0&&(bt={type:void 0,texture:void 0},ht[ft]=bt),(bt.type!==V||bt.texture!==Et)&&(rt!==ft&&(i.activeTexture(ft),rt=ft),i.bindTexture(V,Et||N[V]),bt.type=V,bt.texture=Et)}function At(){const V=ht[rt];V!==void 0&&V.type!==void 0&&(i.bindTexture(V.type,null),V.type=void 0,V.texture=void 0)}function Nt(){try{i.compressedTexImage2D(...arguments)}catch(V){ne("WebGLState:",V)}}function b(){try{i.compressedTexImage3D(...arguments)}catch(V){ne("WebGLState:",V)}}function g(){try{i.texSubImage2D(...arguments)}catch(V){ne("WebGLState:",V)}}function k(){try{i.texSubImage3D(...arguments)}catch(V){ne("WebGLState:",V)}}function Q(){try{i.compressedTexSubImage2D(...arguments)}catch(V){ne("WebGLState:",V)}}function at(){try{i.compressedTexSubImage3D(...arguments)}catch(V){ne("WebGLState:",V)}}function xt(){try{i.texStorage2D(...arguments)}catch(V){ne("WebGLState:",V)}}function vt(){try{i.texStorage3D(...arguments)}catch(V){ne("WebGLState:",V)}}function ct(){try{i.texImage2D(...arguments)}catch(V){ne("WebGLState:",V)}}function ut(){try{i.texImage3D(...arguments)}catch(V){ne("WebGLState:",V)}}function St(V){return f[V]!==void 0?f[V]:i.getParameter(V)}function Ot(V,Et){f[V]!==Et&&(i.pixelStorei(V,Et),f[V]=Et)}function yt(V){qt.equals(V)===!1&&(i.scissor(V.x,V.y,V.z,V.w),qt.copy(V))}function Mt(V){Xt.equals(V)===!1&&(i.viewport(V.x,V.y,V.z,V.w),Xt.copy(V))}function Gt(V,Et){let ft=l.get(Et);ft===void 0&&(ft=new WeakMap,l.set(Et,ft));let bt=ft.get(V);bt===void 0&&(bt=i.getUniformBlockIndex(Et,V.name),ft.set(V,bt))}function Ht(V,Et){const bt=l.get(Et).get(V);c.get(Et)!==bt&&(i.uniformBlockBinding(Et,bt,V.__bindingPointIndex),c.set(Et,bt))}function Yt(){i.disable(i.BLEND),i.disable(i.CULL_FACE),i.disable(i.DEPTH_TEST),i.disable(i.POLYGON_OFFSET_FILL),i.disable(i.SCISSOR_TEST),i.disable(i.STENCIL_TEST),i.disable(i.SAMPLE_ALPHA_TO_COVERAGE),i.blendEquation(i.FUNC_ADD),i.blendFunc(i.ONE,i.ZERO),i.blendFuncSeparate(i.ONE,i.ZERO,i.ONE,i.ZERO),i.blendColor(0,0,0,0),i.colorMask(!0,!0,!0,!0),i.clearColor(0,0,0,0),i.depthMask(!0),i.depthFunc(i.LESS),a.setReversed(!1),i.clearDepth(1),i.stencilMask(4294967295),i.stencilFunc(i.ALWAYS,0,4294967295),i.stencilOp(i.KEEP,i.KEEP,i.KEEP),i.clearStencil(0),i.cullFace(i.BACK),i.frontFace(i.CCW),i.polygonOffset(0,0),i.activeTexture(i.TEXTURE0),i.bindFramebuffer(i.FRAMEBUFFER,null),i.bindFramebuffer(i.DRAW_FRAMEBUFFER,null),i.bindFramebuffer(i.READ_FRAMEBUFFER,null),i.useProgram(null),i.lineWidth(1),i.scissor(0,0,i.canvas.width,i.canvas.height),i.viewport(0,0,i.canvas.width,i.canvas.height),i.pixelStorei(i.PACK_ALIGNMENT,4),i.pixelStorei(i.UNPACK_ALIGNMENT,4),i.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,!1),i.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,!1),i.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,i.BROWSER_DEFAULT_WEBGL),i.pixelStorei(i.PACK_ROW_LENGTH,0),i.pixelStorei(i.PACK_SKIP_PIXELS,0),i.pixelStorei(i.PACK_SKIP_ROWS,0),i.pixelStorei(i.UNPACK_ROW_LENGTH,0),i.pixelStorei(i.UNPACK_IMAGE_HEIGHT,0),i.pixelStorei(i.UNPACK_SKIP_PIXELS,0),i.pixelStorei(i.UNPACK_SKIP_ROWS,0),i.pixelStorei(i.UNPACK_SKIP_IMAGES,0),u={},f={},rt=null,ht={},h={},p=new WeakMap,_=[],y=null,m=!1,d=null,P=null,D=null,S=null,w=null,A=null,F=null,v=new jt(0,0,0),R=0,B=!1,X=null,q=null,nt=null,G=null,J=null,qt.set(0,0,i.canvas.width,i.canvas.height),Xt.set(0,0,i.canvas.width,i.canvas.height),r.reset(),a.reset(),o.reset()}return{buffers:{color:r,depth:a,stencil:o},enable:L,disable:C,bindFramebuffer:T,drawBuffers:U,useProgram:et,setBlending:O,setMaterial:I,setFlipSided:Y,setCullFace:$,setLineWidth:ot,setPolygonOffset:mt,setScissorTest:pt,activeTexture:W,bindTexture:x,unbindTexture:At,compressedTexImage2D:Nt,compressedTexImage3D:b,texImage2D:ct,texImage3D:ut,pixelStorei:Ot,getParameter:St,updateUBOMapping:Gt,uniformBlockBinding:Ht,texStorage2D:xt,texStorage3D:vt,texSubImage2D:g,texSubImage3D:k,compressedTexSubImage2D:Q,compressedTexSubImage3D:at,scissor:yt,viewport:Mt,reset:Yt}}function rg(i,t,e,n,s,r,a){const o=t.has("WEBGL_multisampled_render_to_texture")?t.get("WEBGL_multisampled_render_to_texture"):null,c=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),l=new dt,u=new WeakMap,f=new Set;let h;const p=new WeakMap;let _=!1;try{_=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function y(b,g){return _?new OffscreenCanvas(b,g):Ns("canvas")}function m(b,g,k){let Q=1;const at=Nt(b);if((at.width>k||at.height>k)&&(Q=k/Math.max(at.width,at.height)),Q<1)if(typeof HTMLImageElement<"u"&&b instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&b instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&b instanceof ImageBitmap||typeof VideoFrame<"u"&&b instanceof VideoFrame){const xt=Math.floor(Q*at.width),vt=Math.floor(Q*at.height);h===void 0&&(h=y(xt,vt));const ct=g?y(xt,vt):h;return ct.width=xt,ct.height=vt,ct.getContext("2d").drawImage(b,0,0,xt,vt),Wt("WebGLRenderer: Texture has been resized from ("+at.width+"x"+at.height+") to ("+xt+"x"+vt+")."),ct}else return"data"in b&&Wt("WebGLRenderer: Image in DataTexture is too big ("+at.width+"x"+at.height+")."),b;return b}function d(b){return b.generateMipmaps}function P(b){i.generateMipmap(b)}function D(b){return b.isWebGLCubeRenderTarget?i.TEXTURE_CUBE_MAP:b.isWebGL3DRenderTarget?i.TEXTURE_3D:b.isWebGLArrayRenderTarget||b.isCompressedArrayTexture?i.TEXTURE_2D_ARRAY:i.TEXTURE_2D}function S(b,g,k,Q,at,xt=!1){if(b!==null){if(i[b]!==void 0)return i[b];Wt("WebGLRenderer: Attempt to use non-existing WebGL internal format '"+b+"'")}let vt;Q&&(vt=t.get("EXT_texture_norm16"),vt||Wt("WebGLRenderer: Unable to use normalized textures without EXT_texture_norm16 extension"));let ct=g;if(g===i.RED&&(k===i.FLOAT&&(ct=i.R32F),k===i.HALF_FLOAT&&(ct=i.R16F),k===i.UNSIGNED_BYTE&&(ct=i.R8),k===i.UNSIGNED_SHORT&&vt&&(ct=vt.R16_EXT),k===i.SHORT&&vt&&(ct=vt.R16_SNORM_EXT)),g===i.RED_INTEGER&&(k===i.UNSIGNED_BYTE&&(ct=i.R8UI),k===i.UNSIGNED_SHORT&&(ct=i.R16UI),k===i.UNSIGNED_INT&&(ct=i.R32UI),k===i.BYTE&&(ct=i.R8I),k===i.SHORT&&(ct=i.R16I),k===i.INT&&(ct=i.R32I)),g===i.RG&&(k===i.FLOAT&&(ct=i.RG32F),k===i.HALF_FLOAT&&(ct=i.RG16F),k===i.UNSIGNED_BYTE&&(ct=i.RG8),k===i.UNSIGNED_SHORT&&vt&&(ct=vt.RG16_EXT),k===i.SHORT&&vt&&(ct=vt.RG16_SNORM_EXT)),g===i.RG_INTEGER&&(k===i.UNSIGNED_BYTE&&(ct=i.RG8UI),k===i.UNSIGNED_SHORT&&(ct=i.RG16UI),k===i.UNSIGNED_INT&&(ct=i.RG32UI),k===i.BYTE&&(ct=i.RG8I),k===i.SHORT&&(ct=i.RG16I),k===i.INT&&(ct=i.RG32I)),g===i.RGB_INTEGER&&(k===i.UNSIGNED_BYTE&&(ct=i.RGB8UI),k===i.UNSIGNED_SHORT&&(ct=i.RGB16UI),k===i.UNSIGNED_INT&&(ct=i.RGB32UI),k===i.BYTE&&(ct=i.RGB8I),k===i.SHORT&&(ct=i.RGB16I),k===i.INT&&(ct=i.RGB32I)),g===i.RGBA_INTEGER&&(k===i.UNSIGNED_BYTE&&(ct=i.RGBA8UI),k===i.UNSIGNED_SHORT&&(ct=i.RGBA16UI),k===i.UNSIGNED_INT&&(ct=i.RGBA32UI),k===i.BYTE&&(ct=i.RGBA8I),k===i.SHORT&&(ct=i.RGBA16I),k===i.INT&&(ct=i.RGBA32I)),g===i.RGB&&(k===i.UNSIGNED_SHORT&&vt&&(ct=vt.RGB16_EXT),k===i.SHORT&&vt&&(ct=vt.RGB16_SNORM_EXT),k===i.UNSIGNED_INT_5_9_9_9_REV&&(ct=i.RGB9_E5),k===i.UNSIGNED_INT_10F_11F_11F_REV&&(ct=i.R11F_G11F_B10F)),g===i.RGBA){const ut=xt?Is:te.getTransfer(at);k===i.FLOAT&&(ct=i.RGBA32F),k===i.HALF_FLOAT&&(ct=i.RGBA16F),k===i.UNSIGNED_BYTE&&(ct=ut===re?i.SRGB8_ALPHA8:i.RGBA8),k===i.UNSIGNED_SHORT&&vt&&(ct=vt.RGBA16_EXT),k===i.SHORT&&vt&&(ct=vt.RGBA16_SNORM_EXT),k===i.UNSIGNED_SHORT_4_4_4_4&&(ct=i.RGBA4),k===i.UNSIGNED_SHORT_5_5_5_1&&(ct=i.RGB5_A1)}return(ct===i.R16F||ct===i.R32F||ct===i.RG16F||ct===i.RG32F||ct===i.RGBA16F||ct===i.RGBA32F)&&t.get("EXT_color_buffer_float"),ct}function w(b,g){let k;return b?g===null||g===ln||g===Oi?k=i.DEPTH24_STENCIL8:g===sn?k=i.DEPTH32F_STENCIL8:g===Fi&&(k=i.DEPTH24_STENCIL8,Wt("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")):g===null||g===ln||g===Oi?k=i.DEPTH_COMPONENT24:g===sn?k=i.DEPTH_COMPONENT32F:g===Fi&&(k=i.DEPTH_COMPONENT16),k}function A(b,g){return d(b)===!0||b.isFramebufferTexture&&b.minFilter!==ye&&b.minFilter!==Ae?Math.log2(Math.max(g.width,g.height))+1:b.mipmaps!==void 0&&b.mipmaps.length>0?b.mipmaps.length:b.isCompressedTexture&&Array.isArray(b.image)?g.mipmaps.length:1}function F(b){const g=b.target;g.removeEventListener("dispose",F),R(g),g.isVideoTexture&&u.delete(g),g.isHTMLTexture&&f.delete(g)}function v(b){const g=b.target;g.removeEventListener("dispose",v),X(g)}function R(b){const g=n.get(b);if(g.__webglInit===void 0)return;const k=b.source,Q=p.get(k);if(Q){const at=Q[g.__cacheKey];at.usedTimes--,at.usedTimes===0&&B(b),Object.keys(Q).length===0&&p.delete(k)}n.remove(b)}function B(b){const g=n.get(b);i.deleteTexture(g.__webglTexture);const k=b.source,Q=p.get(k);delete Q[g.__cacheKey],a.memory.textures--}function X(b){const g=n.get(b);if(b.depthTexture&&(b.depthTexture.dispose(),n.remove(b.depthTexture)),b.isWebGLCubeRenderTarget)for(let Q=0;Q<6;Q++){if(Array.isArray(g.__webglFramebuffer[Q]))for(let at=0;at<g.__webglFramebuffer[Q].length;at++)i.deleteFramebuffer(g.__webglFramebuffer[Q][at]);else i.deleteFramebuffer(g.__webglFramebuffer[Q]);g.__webglDepthbuffer&&i.deleteRenderbuffer(g.__webglDepthbuffer[Q])}else{if(Array.isArray(g.__webglFramebuffer))for(let Q=0;Q<g.__webglFramebuffer.length;Q++)i.deleteFramebuffer(g.__webglFramebuffer[Q]);else i.deleteFramebuffer(g.__webglFramebuffer);if(g.__webglDepthbuffer&&i.deleteRenderbuffer(g.__webglDepthbuffer),g.__webglMultisampledFramebuffer&&i.deleteFramebuffer(g.__webglMultisampledFramebuffer),g.__webglColorRenderbuffer)for(let Q=0;Q<g.__webglColorRenderbuffer.length;Q++)g.__webglColorRenderbuffer[Q]&&i.deleteRenderbuffer(g.__webglColorRenderbuffer[Q]);g.__webglDepthRenderbuffer&&i.deleteRenderbuffer(g.__webglDepthRenderbuffer)}const k=b.textures;for(let Q=0,at=k.length;Q<at;Q++){const xt=n.get(k[Q]);xt.__webglTexture&&(i.deleteTexture(xt.__webglTexture),a.memory.textures--),n.remove(k[Q])}n.remove(b)}let q=0;function nt(){q=0}function G(){return q}function J(b){q=b}function lt(){const b=q;return b>=s.maxTextures&&Wt("WebGLTextures: Trying to use "+(b+1)+" texture units while this GPU supports only "+s.maxTextures),q+=1,b}function K(b){const g=[];return g.push(b.wrapS),g.push(b.wrapT),g.push(b.wrapR||0),g.push(b.magFilter),g.push(b.minFilter),g.push(b.anisotropy),g.push(b.internalFormat),g.push(b.format),g.push(b.type),g.push(b.generateMipmaps),g.push(b.premultiplyAlpha),g.push(b.flipY),g.push(b.unpackAlignment),g.push(b.colorSpace),g.join()}function Z(b,g){const k=n.get(b);if(b.isVideoTexture&&x(b),b.isRenderTargetTexture===!1&&b.isExternalTexture!==!0&&b.version>0&&k.__version!==b.version){const Q=b.image;if(Q===null)Wt("WebGLRenderer: Texture marked for update but no image data found.");else if(Q.complete===!1)Wt("WebGLRenderer: Texture marked for update but image is incomplete");else{C(k,b,g);return}}else b.isExternalTexture&&(k.__webglTexture=b.sourceTexture?b.sourceTexture:null);e.bindTexture(i.TEXTURE_2D,k.__webglTexture,i.TEXTURE0+g)}function it(b,g){const k=n.get(b);if(b.isRenderTargetTexture===!1&&b.version>0&&k.__version!==b.version){C(k,b,g);return}else b.isExternalTexture&&(k.__webglTexture=b.sourceTexture?b.sourceTexture:null);e.bindTexture(i.TEXTURE_2D_ARRAY,k.__webglTexture,i.TEXTURE0+g)}function rt(b,g){const k=n.get(b);if(b.isRenderTargetTexture===!1&&b.version>0&&k.__version!==b.version){C(k,b,g);return}e.bindTexture(i.TEXTURE_3D,k.__webglTexture,i.TEXTURE0+g)}function ht(b,g){const k=n.get(b);if(b.isCubeDepthTexture!==!0&&b.version>0&&k.__version!==b.version){T(k,b,g);return}e.bindTexture(i.TEXTURE_CUBE_MAP,k.__webglTexture,i.TEXTURE0+g)}const Dt={[Rs]:i.REPEAT,[nn]:i.CLAMP_TO_EDGE,[Cs]:i.MIRRORED_REPEAT},Ct={[ye]:i.NEAREST,[Ic]:i.NEAREST_MIPMAP_NEAREST,[Ki]:i.NEAREST_MIPMAP_LINEAR,[Ae]:i.LINEAR,[qs]:i.LINEAR_MIPMAP_NEAREST,[Hn]:i.LINEAR_MIPMAP_LINEAR},qt={[Oc]:i.NEVER,[kc]:i.ALWAYS,[Bc]:i.LESS,[ya]:i.LEQUAL,[zc]:i.EQUAL,[Ea]:i.GEQUAL,[Gc]:i.GREATER,[Vc]:i.NOTEQUAL};function Xt(b,g){if(g.type===sn&&t.has("OES_texture_float_linear")===!1&&(g.magFilter===Ae||g.magFilter===qs||g.magFilter===Ki||g.magFilter===Hn||g.minFilter===Ae||g.minFilter===qs||g.minFilter===Ki||g.minFilter===Hn)&&Wt("WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device."),i.texParameteri(b,i.TEXTURE_WRAP_S,Dt[g.wrapS]),i.texParameteri(b,i.TEXTURE_WRAP_T,Dt[g.wrapT]),(b===i.TEXTURE_3D||b===i.TEXTURE_2D_ARRAY)&&i.texParameteri(b,i.TEXTURE_WRAP_R,Dt[g.wrapR]),i.texParameteri(b,i.TEXTURE_MAG_FILTER,Ct[g.magFilter]),i.texParameteri(b,i.TEXTURE_MIN_FILTER,Ct[g.minFilter]),g.compareFunction&&(i.texParameteri(b,i.TEXTURE_COMPARE_MODE,i.COMPARE_REF_TO_TEXTURE),i.texParameteri(b,i.TEXTURE_COMPARE_FUNC,qt[g.compareFunction])),t.has("EXT_texture_filter_anisotropic")===!0){if(g.magFilter===ye||g.minFilter!==Ki&&g.minFilter!==Hn||g.type===sn&&t.has("OES_texture_float_linear")===!1)return;if(g.anisotropy>1||n.get(g).__currentAnisotropy){const k=t.get("EXT_texture_filter_anisotropic");i.texParameterf(b,k.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(g.anisotropy,s.getMaxAnisotropy())),n.get(g).__currentAnisotropy=g.anisotropy}}}function Zt(b,g){let k=!1;b.__webglInit===void 0&&(b.__webglInit=!0,g.addEventListener("dispose",F));const Q=g.source;let at=p.get(Q);at===void 0&&(at={},p.set(Q,at));const xt=K(g);if(xt!==b.__cacheKey){at[xt]===void 0&&(at[xt]={texture:i.createTexture(),usedTimes:0},a.memory.textures++,k=!0),at[xt].usedTimes++;const vt=at[b.__cacheKey];vt!==void 0&&(at[b.__cacheKey].usedTimes--,vt.usedTimes===0&&B(g)),b.__cacheKey=xt,b.__webglTexture=at[xt].texture}return k}function N(b,g,k){return Math.floor(Math.floor(b/k)/g)}function L(b,g,k,Q){const xt=b.updateRanges;if(xt.length===0)e.texSubImage2D(i.TEXTURE_2D,0,0,0,g.width,g.height,k,Q,g.data);else{xt.sort((Ot,yt)=>Ot.start-yt.start);let vt=0;for(let Ot=1;Ot<xt.length;Ot++){const yt=xt[vt],Mt=xt[Ot],Gt=yt.start+yt.count,Ht=N(Mt.start,g.width,4),Yt=N(yt.start,g.width,4);Mt.start<=Gt+1&&Ht===Yt&&N(Mt.start+Mt.count-1,g.width,4)===Ht?yt.count=Math.max(yt.count,Mt.start+Mt.count-yt.start):(++vt,xt[vt]=Mt)}xt.length=vt+1;const ct=e.getParameter(i.UNPACK_ROW_LENGTH),ut=e.getParameter(i.UNPACK_SKIP_PIXELS),St=e.getParameter(i.UNPACK_SKIP_ROWS);e.pixelStorei(i.UNPACK_ROW_LENGTH,g.width);for(let Ot=0,yt=xt.length;Ot<yt;Ot++){const Mt=xt[Ot],Gt=Math.floor(Mt.start/4),Ht=Math.ceil(Mt.count/4),Yt=Gt%g.width,V=Math.floor(Gt/g.width),Et=Ht,ft=1;e.pixelStorei(i.UNPACK_SKIP_PIXELS,Yt),e.pixelStorei(i.UNPACK_SKIP_ROWS,V),e.texSubImage2D(i.TEXTURE_2D,0,Yt,V,Et,ft,k,Q,g.data)}b.clearUpdateRanges(),e.pixelStorei(i.UNPACK_ROW_LENGTH,ct),e.pixelStorei(i.UNPACK_SKIP_PIXELS,ut),e.pixelStorei(i.UNPACK_SKIP_ROWS,St)}}function C(b,g,k){let Q=i.TEXTURE_2D;(g.isDataArrayTexture||g.isCompressedArrayTexture)&&(Q=i.TEXTURE_2D_ARRAY),g.isData3DTexture&&(Q=i.TEXTURE_3D);const at=Zt(b,g),xt=g.source;e.bindTexture(Q,b.__webglTexture,i.TEXTURE0+k);const vt=n.get(xt);if(xt.version!==vt.__version||at===!0){if(e.activeTexture(i.TEXTURE0+k),(typeof ImageBitmap<"u"&&g.image instanceof ImageBitmap)===!1){const ft=te.getPrimaries(te.workingColorSpace),bt=g.colorSpace===Ln?null:te.getPrimaries(g.colorSpace),Pt=g.colorSpace===Ln||ft===bt?i.NONE:i.BROWSER_DEFAULT_WEBGL;e.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,g.flipY),e.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,g.premultiplyAlpha),e.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,Pt)}e.pixelStorei(i.UNPACK_ALIGNMENT,g.unpackAlignment);let ut=m(g.image,!1,s.maxTextureSize);ut=At(g,ut);const St=r.convert(g.format,g.colorSpace),Ot=r.convert(g.type);let yt=S(g.internalFormat,St,Ot,g.normalized,g.colorSpace,g.isVideoTexture);Xt(Q,g);let Mt;const Gt=g.mipmaps,Ht=g.isVideoTexture!==!0,Yt=vt.__version===void 0||at===!0,V=xt.dataReady,Et=A(g,ut);if(g.isDepthTexture)yt=w(g.format===Wn,g.type),Yt&&(Ht?e.texStorage2D(i.TEXTURE_2D,1,yt,ut.width,ut.height):e.texImage2D(i.TEXTURE_2D,0,yt,ut.width,ut.height,0,St,Ot,null));else if(g.isDataTexture)if(Gt.length>0){Ht&&Yt&&e.texStorage2D(i.TEXTURE_2D,Et,yt,Gt[0].width,Gt[0].height);for(let ft=0,bt=Gt.length;ft<bt;ft++)Mt=Gt[ft],Ht?V&&e.texSubImage2D(i.TEXTURE_2D,ft,0,0,Mt.width,Mt.height,St,Ot,Mt.data):e.texImage2D(i.TEXTURE_2D,ft,yt,Mt.width,Mt.height,0,St,Ot,Mt.data);g.generateMipmaps=!1}else Ht?(Yt&&e.texStorage2D(i.TEXTURE_2D,Et,yt,ut.width,ut.height),V&&L(g,ut,St,Ot)):e.texImage2D(i.TEXTURE_2D,0,yt,ut.width,ut.height,0,St,Ot,ut.data);else if(g.isCompressedTexture)if(g.isCompressedArrayTexture){Ht&&Yt&&e.texStorage3D(i.TEXTURE_2D_ARRAY,Et,yt,Gt[0].width,Gt[0].height,ut.depth);for(let ft=0,bt=Gt.length;ft<bt;ft++)if(Mt=Gt[ft],g.format!==Ke)if(St!==null)if(Ht){if(V)if(g.layerUpdates.size>0){const Pt=Io(Mt.width,Mt.height,g.format,g.type);for(const gt of g.layerUpdates){const Vt=Mt.data.subarray(gt*Pt/Mt.data.BYTES_PER_ELEMENT,(gt+1)*Pt/Mt.data.BYTES_PER_ELEMENT);e.compressedTexSubImage3D(i.TEXTURE_2D_ARRAY,ft,0,0,gt,Mt.width,Mt.height,1,St,Vt)}}else e.compressedTexSubImage3D(i.TEXTURE_2D_ARRAY,ft,0,0,0,Mt.width,Mt.height,ut.depth,St,Mt.data)}else e.compressedTexImage3D(i.TEXTURE_2D_ARRAY,ft,yt,Mt.width,Mt.height,ut.depth,0,Mt.data,0,0);else Wt("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else Ht?V&&e.texSubImage3D(i.TEXTURE_2D_ARRAY,ft,0,0,0,Mt.width,Mt.height,ut.depth,St,Ot,Mt.data):e.texImage3D(i.TEXTURE_2D_ARRAY,ft,yt,Mt.width,Mt.height,ut.depth,0,St,Ot,Mt.data);g.layerUpdates.size>0&&g.clearLayerUpdates()}else{Ht&&Yt&&e.texStorage2D(i.TEXTURE_2D,Et,yt,Gt[0].width,Gt[0].height);for(let ft=0,bt=Gt.length;ft<bt;ft++)Mt=Gt[ft],g.format!==Ke?St!==null?Ht?V&&e.compressedTexSubImage2D(i.TEXTURE_2D,ft,0,0,Mt.width,Mt.height,St,Mt.data):e.compressedTexImage2D(i.TEXTURE_2D,ft,yt,Mt.width,Mt.height,0,Mt.data):Wt("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):Ht?V&&e.texSubImage2D(i.TEXTURE_2D,ft,0,0,Mt.width,Mt.height,St,Ot,Mt.data):e.texImage2D(i.TEXTURE_2D,ft,yt,Mt.width,Mt.height,0,St,Ot,Mt.data)}else if(g.isDataArrayTexture)if(Ht){if(Yt&&e.texStorage3D(i.TEXTURE_2D_ARRAY,Et,yt,ut.width,ut.height,ut.depth),V)if(g.layerUpdates.size>0){const ft=Io(ut.width,ut.height,g.format,g.type);for(const bt of g.layerUpdates){const Pt=ut.data.subarray(bt*ft/ut.data.BYTES_PER_ELEMENT,(bt+1)*ft/ut.data.BYTES_PER_ELEMENT);e.texSubImage3D(i.TEXTURE_2D_ARRAY,0,0,0,bt,ut.width,ut.height,1,St,Ot,Pt)}g.clearLayerUpdates()}else e.texSubImage3D(i.TEXTURE_2D_ARRAY,0,0,0,0,ut.width,ut.height,ut.depth,St,Ot,ut.data)}else e.texImage3D(i.TEXTURE_2D_ARRAY,0,yt,ut.width,ut.height,ut.depth,0,St,Ot,ut.data);else if(g.isData3DTexture)Ht?(Yt&&e.texStorage3D(i.TEXTURE_3D,Et,yt,ut.width,ut.height,ut.depth),V&&e.texSubImage3D(i.TEXTURE_3D,0,0,0,0,ut.width,ut.height,ut.depth,St,Ot,ut.data)):e.texImage3D(i.TEXTURE_3D,0,yt,ut.width,ut.height,ut.depth,0,St,Ot,ut.data);else if(g.isFramebufferTexture){if(Yt)if(Ht)e.texStorage2D(i.TEXTURE_2D,Et,yt,ut.width,ut.height);else{let ft=ut.width,bt=ut.height;for(let Pt=0;Pt<Et;Pt++)e.texImage2D(i.TEXTURE_2D,Pt,yt,ft,bt,0,St,Ot,null),ft>>=1,bt>>=1}}else if(g.isHTMLTexture){if("texElementImage2D"in i){const ft=i.canvas;if(ft.hasAttribute("layoutsubtree")||ft.setAttribute("layoutsubtree","true"),ut.parentNode!==ft){ft.appendChild(ut),f.add(g),ft.onpaint=bt=>{const Pt=bt.changedElements;for(const gt of f)Pt.includes(gt.image)&&(gt.needsUpdate=!0)},ft.requestPaint();return}if(i.texElementImage2D.length===3)i.texElementImage2D(i.TEXTURE_2D,i.RGBA8,ut);else{const Pt=i.RGBA,gt=i.RGBA,Vt=i.UNSIGNED_BYTE;i.texElementImage2D(i.TEXTURE_2D,0,Pt,gt,Vt,ut)}i.texParameteri(i.TEXTURE_2D,i.TEXTURE_MIN_FILTER,i.LINEAR),i.texParameteri(i.TEXTURE_2D,i.TEXTURE_WRAP_S,i.CLAMP_TO_EDGE),i.texParameteri(i.TEXTURE_2D,i.TEXTURE_WRAP_T,i.CLAMP_TO_EDGE)}}else if(Gt.length>0){if(Ht&&Yt){const ft=Nt(Gt[0]);e.texStorage2D(i.TEXTURE_2D,Et,yt,ft.width,ft.height)}for(let ft=0,bt=Gt.length;ft<bt;ft++)Mt=Gt[ft],Ht?V&&e.texSubImage2D(i.TEXTURE_2D,ft,0,0,St,Ot,Mt):e.texImage2D(i.TEXTURE_2D,ft,yt,St,Ot,Mt);g.generateMipmaps=!1}else if(Ht){if(Yt){const ft=Nt(ut);e.texStorage2D(i.TEXTURE_2D,Et,yt,ft.width,ft.height)}V&&e.texSubImage2D(i.TEXTURE_2D,0,0,0,St,Ot,ut)}else e.texImage2D(i.TEXTURE_2D,0,yt,St,Ot,ut);d(g)&&P(Q),vt.__version=xt.version,g.onUpdate&&g.onUpdate(g)}b.__version=g.version}function T(b,g,k){if(g.image.length!==6)return;const Q=Zt(b,g),at=g.source;e.bindTexture(i.TEXTURE_CUBE_MAP,b.__webglTexture,i.TEXTURE0+k);const xt=n.get(at);if(at.version!==xt.__version||Q===!0){e.activeTexture(i.TEXTURE0+k);const vt=te.getPrimaries(te.workingColorSpace),ct=g.colorSpace===Ln?null:te.getPrimaries(g.colorSpace),ut=g.colorSpace===Ln||vt===ct?i.NONE:i.BROWSER_DEFAULT_WEBGL;e.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,g.flipY),e.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,g.premultiplyAlpha),e.pixelStorei(i.UNPACK_ALIGNMENT,g.unpackAlignment),e.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,ut);const St=g.isCompressedTexture||g.image[0].isCompressedTexture,Ot=g.image[0]&&g.image[0].isDataTexture,yt=[];for(let gt=0;gt<6;gt++)!St&&!Ot?yt[gt]=m(g.image[gt],!0,s.maxCubemapSize):yt[gt]=Ot?g.image[gt].image:g.image[gt],yt[gt]=At(g,yt[gt]);const Mt=yt[0],Gt=r.convert(g.format,g.colorSpace),Ht=r.convert(g.type),Yt=S(g.internalFormat,Gt,Ht,g.normalized,g.colorSpace),V=g.isVideoTexture!==!0,Et=xt.__version===void 0||Q===!0,ft=at.dataReady;let bt=A(g,Mt);Xt(i.TEXTURE_CUBE_MAP,g);let Pt;if(St){V&&Et&&e.texStorage2D(i.TEXTURE_CUBE_MAP,bt,Yt,Mt.width,Mt.height);for(let gt=0;gt<6;gt++){Pt=yt[gt].mipmaps;for(let Vt=0;Vt<Pt.length;Vt++){const Bt=Pt[Vt];g.format!==Ke?Gt!==null?V?ft&&e.compressedTexSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+gt,Vt,0,0,Bt.width,Bt.height,Gt,Bt.data):e.compressedTexImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+gt,Vt,Yt,Bt.width,Bt.height,0,Bt.data):Wt("WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):V?ft&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+gt,Vt,0,0,Bt.width,Bt.height,Gt,Ht,Bt.data):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+gt,Vt,Yt,Bt.width,Bt.height,0,Gt,Ht,Bt.data)}}}else{if(Pt=g.mipmaps,V&&Et){Pt.length>0&&bt++;const gt=Nt(yt[0]);e.texStorage2D(i.TEXTURE_CUBE_MAP,bt,Yt,gt.width,gt.height)}for(let gt=0;gt<6;gt++)if(Ot){V?ft&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+gt,0,0,0,yt[gt].width,yt[gt].height,Gt,Ht,yt[gt].data):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+gt,0,Yt,yt[gt].width,yt[gt].height,0,Gt,Ht,yt[gt].data);for(let Vt=0;Vt<Pt.length;Vt++){const ce=Pt[Vt].image[gt].image;V?ft&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+gt,Vt+1,0,0,ce.width,ce.height,Gt,Ht,ce.data):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+gt,Vt+1,Yt,ce.width,ce.height,0,Gt,Ht,ce.data)}}else{V?ft&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+gt,0,0,0,Gt,Ht,yt[gt]):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+gt,0,Yt,Gt,Ht,yt[gt]);for(let Vt=0;Vt<Pt.length;Vt++){const Bt=Pt[Vt];V?ft&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+gt,Vt+1,0,0,Gt,Ht,Bt.image[gt]):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+gt,Vt+1,Yt,Gt,Ht,Bt.image[gt])}}}d(g)&&P(i.TEXTURE_CUBE_MAP),xt.__version=at.version,g.onUpdate&&g.onUpdate(g)}b.__version=g.version}function U(b,g,k,Q,at,xt){const vt=r.convert(k.format,k.colorSpace),ct=r.convert(k.type),ut=S(k.internalFormat,vt,ct,k.normalized,k.colorSpace),St=n.get(g),Ot=n.get(k);if(Ot.__renderTarget=g,!St.__hasExternalTextures){const yt=Math.max(1,g.width>>xt),Mt=Math.max(1,g.height>>xt);at===i.TEXTURE_3D||at===i.TEXTURE_2D_ARRAY?e.texImage3D(at,xt,ut,yt,Mt,g.depth,0,vt,ct,null):e.texImage2D(at,xt,ut,yt,Mt,0,vt,ct,null)}e.bindFramebuffer(i.FRAMEBUFFER,b),W(g)?o.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,Q,at,Ot.__webglTexture,0,pt(g)):(at===i.TEXTURE_2D||at>=i.TEXTURE_CUBE_MAP_POSITIVE_X&&at<=i.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&i.framebufferTexture2D(i.FRAMEBUFFER,Q,at,Ot.__webglTexture,xt),e.bindFramebuffer(i.FRAMEBUFFER,null)}function et(b,g,k){if(i.bindRenderbuffer(i.RENDERBUFFER,b),g.depthBuffer){const Q=g.depthTexture,at=Q&&Q.isDepthTexture?Q.type:null,xt=w(g.stencilBuffer,at),vt=g.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT;W(g)?o.renderbufferStorageMultisampleEXT(i.RENDERBUFFER,pt(g),xt,g.width,g.height):k?i.renderbufferStorageMultisample(i.RENDERBUFFER,pt(g),xt,g.width,g.height):i.renderbufferStorage(i.RENDERBUFFER,xt,g.width,g.height),i.framebufferRenderbuffer(i.FRAMEBUFFER,vt,i.RENDERBUFFER,b)}else{const Q=g.textures;for(let at=0;at<Q.length;at++){const xt=Q[at],vt=r.convert(xt.format,xt.colorSpace),ct=r.convert(xt.type),ut=S(xt.internalFormat,vt,ct,xt.normalized,xt.colorSpace);W(g)?o.renderbufferStorageMultisampleEXT(i.RENDERBUFFER,pt(g),ut,g.width,g.height):k?i.renderbufferStorageMultisample(i.RENDERBUFFER,pt(g),ut,g.width,g.height):i.renderbufferStorage(i.RENDERBUFFER,ut,g.width,g.height)}}i.bindRenderbuffer(i.RENDERBUFFER,null)}function _t(b,g,k){const Q=g.isWebGLCubeRenderTarget===!0;if(e.bindFramebuffer(i.FRAMEBUFFER,b),!(g.depthTexture&&g.depthTexture.isDepthTexture))throw new Error("THREE.WebGLTextures: renderTarget.depthTexture must be an instance of THREE.DepthTexture.");const at=n.get(g.depthTexture);if(at.__renderTarget=g,(!at.__webglTexture||g.depthTexture.image.width!==g.width||g.depthTexture.image.height!==g.height)&&(g.depthTexture.image.width=g.width,g.depthTexture.image.height=g.height,g.depthTexture.needsUpdate=!0),Q){if(at.__webglInit===void 0&&(at.__webglInit=!0,g.depthTexture.addEventListener("dispose",F)),at.__webglTexture===void 0){at.__webglTexture=i.createTexture(),e.bindTexture(i.TEXTURE_CUBE_MAP,at.__webglTexture),Xt(i.TEXTURE_CUBE_MAP,g.depthTexture);const St=r.convert(g.depthTexture.format),Ot=r.convert(g.depthTexture.type);let yt;g.depthTexture.format===yn?yt=i.DEPTH_COMPONENT24:g.depthTexture.format===Wn&&(yt=i.DEPTH24_STENCIL8);for(let Mt=0;Mt<6;Mt++)i.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+Mt,0,yt,g.width,g.height,0,St,Ot,null)}}else Z(g.depthTexture,0);const xt=at.__webglTexture,vt=pt(g),ct=Q?i.TEXTURE_CUBE_MAP_POSITIVE_X+k:i.TEXTURE_2D,ut=g.depthTexture.format===Wn?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT;if(g.depthTexture.format===yn)W(g)?o.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,ut,ct,xt,0,vt):i.framebufferTexture2D(i.FRAMEBUFFER,ut,ct,xt,0);else if(g.depthTexture.format===Wn)W(g)?o.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,ut,ct,xt,0,vt):i.framebufferTexture2D(i.FRAMEBUFFER,ut,ct,xt,0);else throw new Error("THREE.WebGLTextures: Unknown depthTexture format.")}function E(b){const g=n.get(b),k=b.isWebGLCubeRenderTarget===!0;if(g.__boundDepthTexture!==b.depthTexture){const Q=b.depthTexture;if(g.__depthDisposeCallback&&g.__depthDisposeCallback(),Q){const at=()=>{delete g.__boundDepthTexture,delete g.__depthDisposeCallback,Q.removeEventListener("dispose",at)};Q.addEventListener("dispose",at),g.__depthDisposeCallback=at}g.__boundDepthTexture=Q}if(b.depthTexture&&!g.__autoAllocateDepthBuffer)if(k)for(let Q=0;Q<6;Q++)_t(g.__webglFramebuffer[Q],b,Q);else{const Q=b.texture.mipmaps;Q&&Q.length>0?_t(g.__webglFramebuffer[0],b,0):_t(g.__webglFramebuffer,b,0)}else if(k){g.__webglDepthbuffer=[];for(let Q=0;Q<6;Q++)if(e.bindFramebuffer(i.FRAMEBUFFER,g.__webglFramebuffer[Q]),g.__webglDepthbuffer[Q]===void 0)g.__webglDepthbuffer[Q]=i.createRenderbuffer(),et(g.__webglDepthbuffer[Q],b,!1);else{const at=b.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,xt=g.__webglDepthbuffer[Q];i.bindRenderbuffer(i.RENDERBUFFER,xt),i.framebufferRenderbuffer(i.FRAMEBUFFER,at,i.RENDERBUFFER,xt)}}else{const Q=b.texture.mipmaps;if(Q&&Q.length>0?e.bindFramebuffer(i.FRAMEBUFFER,g.__webglFramebuffer[0]):e.bindFramebuffer(i.FRAMEBUFFER,g.__webglFramebuffer),g.__webglDepthbuffer===void 0)g.__webglDepthbuffer=i.createRenderbuffer(),et(g.__webglDepthbuffer,b,!1);else{const at=b.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,xt=g.__webglDepthbuffer;i.bindRenderbuffer(i.RENDERBUFFER,xt),i.framebufferRenderbuffer(i.FRAMEBUFFER,at,i.RENDERBUFFER,xt)}}e.bindFramebuffer(i.FRAMEBUFFER,null)}function O(b,g,k){const Q=n.get(b);g!==void 0&&U(Q.__webglFramebuffer,b,b.texture,i.COLOR_ATTACHMENT0,i.TEXTURE_2D,0),k!==void 0&&E(b)}function I(b){const g=b.texture,k=n.get(b),Q=n.get(g);b.addEventListener("dispose",v);const at=b.textures,xt=b.isWebGLCubeRenderTarget===!0,vt=at.length>1;if(vt||(Q.__webglTexture===void 0&&(Q.__webglTexture=i.createTexture()),Q.__version=g.version,a.memory.textures++),xt){k.__webglFramebuffer=[];for(let ct=0;ct<6;ct++)if(g.mipmaps&&g.mipmaps.length>0){k.__webglFramebuffer[ct]=[];for(let ut=0;ut<g.mipmaps.length;ut++)k.__webglFramebuffer[ct][ut]=i.createFramebuffer()}else k.__webglFramebuffer[ct]=i.createFramebuffer()}else{if(g.mipmaps&&g.mipmaps.length>0){k.__webglFramebuffer=[];for(let ct=0;ct<g.mipmaps.length;ct++)k.__webglFramebuffer[ct]=i.createFramebuffer()}else k.__webglFramebuffer=i.createFramebuffer();if(vt)for(let ct=0,ut=at.length;ct<ut;ct++){const St=n.get(at[ct]);St.__webglTexture===void 0&&(St.__webglTexture=i.createTexture(),a.memory.textures++)}if(b.samples>0&&W(b)===!1){k.__webglMultisampledFramebuffer=i.createFramebuffer(),k.__webglColorRenderbuffer=[],e.bindFramebuffer(i.FRAMEBUFFER,k.__webglMultisampledFramebuffer);for(let ct=0;ct<at.length;ct++){const ut=at[ct];k.__webglColorRenderbuffer[ct]=i.createRenderbuffer(),i.bindRenderbuffer(i.RENDERBUFFER,k.__webglColorRenderbuffer[ct]);const St=r.convert(ut.format,ut.colorSpace),Ot=r.convert(ut.type),yt=S(ut.internalFormat,St,Ot,ut.normalized,ut.colorSpace,b.isXRRenderTarget===!0),Mt=pt(b);i.renderbufferStorageMultisample(i.RENDERBUFFER,Mt,yt,b.width,b.height),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+ct,i.RENDERBUFFER,k.__webglColorRenderbuffer[ct])}i.bindRenderbuffer(i.RENDERBUFFER,null),b.depthBuffer&&(k.__webglDepthRenderbuffer=i.createRenderbuffer(),et(k.__webglDepthRenderbuffer,b,!0)),e.bindFramebuffer(i.FRAMEBUFFER,null)}}if(xt){e.bindTexture(i.TEXTURE_CUBE_MAP,Q.__webglTexture),Xt(i.TEXTURE_CUBE_MAP,g);for(let ct=0;ct<6;ct++)if(g.mipmaps&&g.mipmaps.length>0)for(let ut=0;ut<g.mipmaps.length;ut++)U(k.__webglFramebuffer[ct][ut],b,g,i.COLOR_ATTACHMENT0,i.TEXTURE_CUBE_MAP_POSITIVE_X+ct,ut);else U(k.__webglFramebuffer[ct],b,g,i.COLOR_ATTACHMENT0,i.TEXTURE_CUBE_MAP_POSITIVE_X+ct,0);d(g)&&P(i.TEXTURE_CUBE_MAP),e.unbindTexture()}else if(vt){for(let ct=0,ut=at.length;ct<ut;ct++){const St=at[ct],Ot=n.get(St);let yt=i.TEXTURE_2D;(b.isWebGL3DRenderTarget||b.isWebGLArrayRenderTarget)&&(yt=b.isWebGL3DRenderTarget?i.TEXTURE_3D:i.TEXTURE_2D_ARRAY),e.bindTexture(yt,Ot.__webglTexture),Xt(yt,St),U(k.__webglFramebuffer,b,St,i.COLOR_ATTACHMENT0+ct,yt,0),d(St)&&P(yt)}e.unbindTexture()}else{let ct=i.TEXTURE_2D;if((b.isWebGL3DRenderTarget||b.isWebGLArrayRenderTarget)&&(ct=b.isWebGL3DRenderTarget?i.TEXTURE_3D:i.TEXTURE_2D_ARRAY),e.bindTexture(ct,Q.__webglTexture),Xt(ct,g),g.mipmaps&&g.mipmaps.length>0)for(let ut=0;ut<g.mipmaps.length;ut++)U(k.__webglFramebuffer[ut],b,g,i.COLOR_ATTACHMENT0,ct,ut);else U(k.__webglFramebuffer,b,g,i.COLOR_ATTACHMENT0,ct,0);d(g)&&P(ct),e.unbindTexture()}b.depthBuffer&&E(b)}function Y(b){const g=b.textures;for(let k=0,Q=g.length;k<Q;k++){const at=g[k];if(d(at)){const xt=D(b),vt=n.get(at).__webglTexture;e.bindTexture(xt,vt),P(xt),e.unbindTexture()}}}const $=[],ot=[];function mt(b){if(b.samples>0){if(W(b)===!1){const g=b.textures,k=b.width,Q=b.height;let at=i.COLOR_BUFFER_BIT;const xt=b.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,vt=n.get(b),ct=g.length>1;if(ct)for(let St=0;St<g.length;St++)e.bindFramebuffer(i.FRAMEBUFFER,vt.__webglMultisampledFramebuffer),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+St,i.RENDERBUFFER,null),e.bindFramebuffer(i.FRAMEBUFFER,vt.__webglFramebuffer),i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0+St,i.TEXTURE_2D,null,0);e.bindFramebuffer(i.READ_FRAMEBUFFER,vt.__webglMultisampledFramebuffer);const ut=b.texture.mipmaps;ut&&ut.length>0?e.bindFramebuffer(i.DRAW_FRAMEBUFFER,vt.__webglFramebuffer[0]):e.bindFramebuffer(i.DRAW_FRAMEBUFFER,vt.__webglFramebuffer);for(let St=0;St<g.length;St++){if(b.resolveDepthBuffer&&(b.depthBuffer&&(at|=i.DEPTH_BUFFER_BIT),b.stencilBuffer&&b.resolveStencilBuffer&&(at|=i.STENCIL_BUFFER_BIT)),ct){i.framebufferRenderbuffer(i.READ_FRAMEBUFFER,i.COLOR_ATTACHMENT0,i.RENDERBUFFER,vt.__webglColorRenderbuffer[St]);const Ot=n.get(g[St]).__webglTexture;i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0,i.TEXTURE_2D,Ot,0)}i.blitFramebuffer(0,0,k,Q,0,0,k,Q,at,i.NEAREST),c===!0&&($.length=0,ot.length=0,$.push(i.COLOR_ATTACHMENT0+St),b.depthBuffer&&b.storeMultisampledDepthBuffer===!1&&($.push(xt),ot.push(xt),i.invalidateFramebuffer(i.DRAW_FRAMEBUFFER,ot)),i.invalidateFramebuffer(i.READ_FRAMEBUFFER,$))}if(e.bindFramebuffer(i.READ_FRAMEBUFFER,null),e.bindFramebuffer(i.DRAW_FRAMEBUFFER,null),ct)for(let St=0;St<g.length;St++){e.bindFramebuffer(i.FRAMEBUFFER,vt.__webglMultisampledFramebuffer),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+St,i.RENDERBUFFER,vt.__webglColorRenderbuffer[St]);const Ot=n.get(g[St]).__webglTexture;e.bindFramebuffer(i.FRAMEBUFFER,vt.__webglFramebuffer),i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0+St,i.TEXTURE_2D,Ot,0)}e.bindFramebuffer(i.DRAW_FRAMEBUFFER,vt.__webglMultisampledFramebuffer)}else if(b.depthBuffer&&b.storeMultisampledDepthBuffer===!1&&c){const g=b.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT;i.invalidateFramebuffer(i.DRAW_FRAMEBUFFER,[g])}}}function pt(b){return Math.min(s.maxSamples,b.samples)}function W(b){const g=n.get(b);return b.samples>0&&t.has("WEBGL_multisampled_render_to_texture")===!0&&g.__useRenderToTexture!==!1}function x(b){const g=a.render.frame;u.get(b)!==g&&(u.set(b,g),b.update())}function At(b,g){const k=b.colorSpace,Q=b.format,at=b.type;return b.isCompressedTexture===!0||b.isVideoTexture===!0||k!==Ds&&k!==Ln&&(te.getTransfer(k)===re?(Q!==Ke||at!==Be)&&Wt("WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):ne("WebGLTextures: Unsupported texture color space:",k)),g}function Nt(b){return typeof HTMLImageElement<"u"&&b instanceof HTMLImageElement?(l.width=b.naturalWidth||b.width,l.height=b.naturalHeight||b.height):typeof VideoFrame<"u"&&b instanceof VideoFrame?(l.width=b.displayWidth,l.height=b.displayHeight):(l.width=b.width,l.height=b.height),l}this.allocateTextureUnit=lt,this.resetTextureUnits=nt,this.getTextureUnits=G,this.setTextureUnits=J,this.setTexture2D=Z,this.setTexture2DArray=it,this.setTexture3D=rt,this.setTextureCube=ht,this.rebindTextures=O,this.setupRenderTarget=I,this.updateRenderTargetMipmap=Y,this.updateMultisampleRenderTarget=mt,this.setupDepthRenderbuffer=E,this.setupFrameBufferTexture=U,this.useMultisampledRTT=W,this.isReversedDepthBuffer=function(){return e.buffers.depth.getReversed()}}function ag(i,t){function e(n,s=Ln){let r;const a=te.getTransfer(s);if(n===Be)return i.UNSIGNED_BYTE;if(n===_a)return i.UNSIGNED_SHORT_4_4_4_4;if(n===xa)return i.UNSIGNED_SHORT_5_5_5_1;if(n===Sl)return i.UNSIGNED_INT_5_9_9_9_REV;if(n===Ml)return i.UNSIGNED_INT_10F_11F_11F_REV;if(n===xl)return i.BYTE;if(n===vl)return i.SHORT;if(n===Fi)return i.UNSIGNED_SHORT;if(n===ga)return i.INT;if(n===ln)return i.UNSIGNED_INT;if(n===sn)return i.FLOAT;if(n===cn)return i.HALF_FLOAT;if(n===yl)return i.ALPHA;if(n===El)return i.RGB;if(n===Ke)return i.RGBA;if(n===yn)return i.DEPTH_COMPONENT;if(n===Wn)return i.DEPTH_STENCIL;if(n===bl)return i.RED;if(n===va)return i.RED_INTEGER;if(n===Yn)return i.RG;if(n===Sa)return i.RG_INTEGER;if(n===Ma)return i.RGBA_INTEGER;if(n===ys||n===Es||n===bs||n===Ts)if(a===re)if(r=t.get("WEBGL_compressed_texture_s3tc_srgb"),r!==null){if(n===ys)return r.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(n===Es)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(n===bs)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(n===Ts)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(r=t.get("WEBGL_compressed_texture_s3tc"),r!==null){if(n===ys)return r.COMPRESSED_RGB_S3TC_DXT1_EXT;if(n===Es)return r.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(n===bs)return r.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(n===Ts)return r.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(n===Ir||n===Nr||n===Ur||n===Fr)if(r=t.get("WEBGL_compressed_texture_pvrtc"),r!==null){if(n===Ir)return r.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(n===Nr)return r.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(n===Ur)return r.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(n===Fr)return r.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(n===Or||n===Br||n===zr||n===Gr||n===Vr||n===Ps||n===kr)if(r=t.get("WEBGL_compressed_texture_etc"),r!==null){if(n===Or||n===Br)return a===re?r.COMPRESSED_SRGB8_ETC2:r.COMPRESSED_RGB8_ETC2;if(n===zr)return a===re?r.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:r.COMPRESSED_RGBA8_ETC2_EAC;if(n===Gr)return r.COMPRESSED_R11_EAC;if(n===Vr)return r.COMPRESSED_SIGNED_R11_EAC;if(n===Ps)return r.COMPRESSED_RG11_EAC;if(n===kr)return r.COMPRESSED_SIGNED_RG11_EAC}else return null;if(n===Hr||n===Wr||n===Xr||n===qr||n===Yr||n===Zr||n===Kr||n===Jr||n===$r||n===Qr||n===jr||n===ta||n===ea||n===na)if(r=t.get("WEBGL_compressed_texture_astc"),r!==null){if(n===Hr)return a===re?r.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:r.COMPRESSED_RGBA_ASTC_4x4_KHR;if(n===Wr)return a===re?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:r.COMPRESSED_RGBA_ASTC_5x4_KHR;if(n===Xr)return a===re?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:r.COMPRESSED_RGBA_ASTC_5x5_KHR;if(n===qr)return a===re?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:r.COMPRESSED_RGBA_ASTC_6x5_KHR;if(n===Yr)return a===re?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:r.COMPRESSED_RGBA_ASTC_6x6_KHR;if(n===Zr)return a===re?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:r.COMPRESSED_RGBA_ASTC_8x5_KHR;if(n===Kr)return a===re?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:r.COMPRESSED_RGBA_ASTC_8x6_KHR;if(n===Jr)return a===re?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:r.COMPRESSED_RGBA_ASTC_8x8_KHR;if(n===$r)return a===re?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:r.COMPRESSED_RGBA_ASTC_10x5_KHR;if(n===Qr)return a===re?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:r.COMPRESSED_RGBA_ASTC_10x6_KHR;if(n===jr)return a===re?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:r.COMPRESSED_RGBA_ASTC_10x8_KHR;if(n===ta)return a===re?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:r.COMPRESSED_RGBA_ASTC_10x10_KHR;if(n===ea)return a===re?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:r.COMPRESSED_RGBA_ASTC_12x10_KHR;if(n===na)return a===re?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:r.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(n===ia||n===sa||n===ra)if(r=t.get("EXT_texture_compression_bptc"),r!==null){if(n===ia)return a===re?r.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:r.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(n===sa)return r.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(n===ra)return r.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(n===aa||n===oa||n===Ls||n===la)if(r=t.get("EXT_texture_compression_rgtc"),r!==null){if(n===aa)return r.COMPRESSED_RED_RGTC1_EXT;if(n===oa)return r.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(n===Ls)return r.COMPRESSED_RED_GREEN_RGTC2_EXT;if(n===la)return r.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return n===Oi?i.UNSIGNED_INT_24_8:i[n]!==void 0?i[n]:null}return{convert:e}}const og=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,lg=`
uniform sampler2DArray depthColor;
uniform float depthWidth;
uniform float depthHeight;

void main() {

	vec2 coord = vec2( gl_FragCoord.x / depthWidth, gl_FragCoord.y / depthHeight );

	if ( coord.x >= 1.0 ) {

		gl_FragDepth = texture( depthColor, vec3( coord.x - 1.0, coord.y, 1 ) ).r;

	} else {

		gl_FragDepth = texture( depthColor, vec3( coord.x, coord.y, 0 ) ).r;

	}

}`;class cg{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(t,e){if(this.texture===null){const n=new Il(t.texture);(t.depthNear!==e.depthNear||t.depthFar!==e.depthFar)&&(this.depthNear=t.depthNear,this.depthFar=t.depthFar),this.texture=n}}getMesh(t){if(this.texture!==null&&this.mesh===null){const e=t.cameras[0].viewport,n=new un({vertexShader:og,fragmentShader:lg,uniforms:{depthColor:{value:this.texture},depthWidth:{value:e.z},depthHeight:{value:e.w}}});this.mesh=new hn(new zs(20,20),n)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}}class hg extends Un{constructor(t,e){super();const n=this;let s=null,r=1,a=null,o="local-floor",c=1,l=null,u=null,f=null,h=null,p=null,_=null;const y=typeof XRWebGLBinding<"u",m=new cg,d={},P=e.getContextAttributes();let D=null,S=null;const w=[],A=[],F=new dt;let v=null,R=null;const B=new Ve;B.viewport=new fe;const X=new Ve;X.viewport=new fe;const q=[B,X],nt=new gu;let G=null,J=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(N){let L=w[N];return L===void 0&&(L=new tr,w[N]=L),L.getTargetRaySpace()},this.getControllerGrip=function(N){let L=w[N];return L===void 0&&(L=new tr,w[N]=L),L.getGripSpace()},this.getHand=function(N){let L=w[N];return L===void 0&&(L=new tr,w[N]=L),L.getHandSpace()};function lt(N){const L=A.indexOf(N.inputSource);if(L===-1)return;const C=w[L];C!==void 0&&(C.update(N.inputSource,N.frame,l||a),C.dispatchEvent({type:N.type,data:N.inputSource}))}function K(){s.removeEventListener("select",lt),s.removeEventListener("selectstart",lt),s.removeEventListener("selectend",lt),s.removeEventListener("squeeze",lt),s.removeEventListener("squeezestart",lt),s.removeEventListener("squeezeend",lt),s.removeEventListener("end",K),s.removeEventListener("inputsourceschange",Z);for(let N=0;N<w.length;N++){const L=A[N];L!==null&&(A[N]=null,w[N].disconnect(L))}G=null,J=null,m.reset();for(const N in d)delete d[N];if(t.setRenderTarget(D),p=null,h=null,f=null,s=null,S=null,Zt.stop(),n.isPresenting=!1,t.setPixelRatio(v),t.setSize(F.width,F.height,!1),R!==null){const N=R.camera;N.fov=R.fov,N.zoom=R.zoom,N.updateProjectionMatrix(),R=null}n.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(N){r=N,n.isPresenting===!0&&Wt("WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(N){o=N,n.isPresenting===!0&&Wt("WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return l||a},this.setReferenceSpace=function(N){l=N},this.getBaseLayer=function(){return h!==null?h:p},this.getBinding=function(){return f===null&&y&&(f=new XRWebGLBinding(s,e)),f},this.getFrame=function(){return _},this.getSession=function(){return s},this.setSession=async function(N){if(s=N,s!==null){if(D=t.getRenderTarget(),s.addEventListener("select",lt),s.addEventListener("selectstart",lt),s.addEventListener("selectend",lt),s.addEventListener("squeeze",lt),s.addEventListener("squeezestart",lt),s.addEventListener("squeezeend",lt),s.addEventListener("end",K),s.addEventListener("inputsourceschange",Z),P.xrCompatible!==!0&&await e.makeXRCompatible(),v=t.getPixelRatio(),t.getSize(F),y&&"createProjectionLayer"in XRWebGLBinding.prototype){let C=null,T=null,U=null;P.depth&&(U=P.stencil?e.DEPTH24_STENCIL8:e.DEPTH_COMPONENT24,C=P.stencil?Wn:yn,T=P.stencil?Oi:ln);const et={colorFormat:e.RGBA8,depthFormat:U,scaleFactor:r};f=this.getBinding(),h=f.createProjectionLayer(et),s.updateRenderState({layers:[h]}),t.setPixelRatio(1),t.setSize(h.textureWidth,h.textureHeight,!1),S=new Je(h.textureWidth,h.textureHeight,{format:Ke,type:Be,depthTexture:new zi(h.textureWidth,h.textureHeight,T,void 0,void 0,void 0,void 0,void 0,void 0,C),stencilBuffer:P.stencil,colorSpace:t.outputColorSpace,samples:P.antialias?4:0,resolveDepthBuffer:h.ignoreDepthValues===!1,resolveStencilBuffer:h.ignoreDepthValues===!1,storeMultisampledDepthBuffer:h.ignoreDepthValues===!1,storeMultisampledStencilBuffer:h.ignoreDepthValues===!1})}else{const C={antialias:P.antialias,alpha:!0,depth:P.depth,stencil:P.stencil,framebufferScaleFactor:r};p=new XRWebGLLayer(s,e,C),s.updateRenderState({baseLayer:p}),t.setPixelRatio(1),t.setSize(p.framebufferWidth,p.framebufferHeight,!1),S=new Je(p.framebufferWidth,p.framebufferHeight,{format:Ke,type:Be,colorSpace:t.outputColorSpace,stencilBuffer:P.stencil,resolveDepthBuffer:p.ignoreDepthValues===!1,resolveStencilBuffer:p.ignoreDepthValues===!1,storeMultisampledDepthBuffer:p.ignoreDepthValues===!1,storeMultisampledStencilBuffer:p.ignoreDepthValues===!1})}S.isXRRenderTarget=!0,this.setFoveation(c),l=null,a=await s.requestReferenceSpace(o),Zt.setContext(s),Zt.start(),n.isPresenting=!0,n.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(s!==null)return s.environmentBlendMode},this.getDepthTexture=function(){return m.getDepthTexture()};function Z(N){for(let L=0;L<N.removed.length;L++){const C=N.removed[L],T=A.indexOf(C);T>=0&&(A[T]=null,w[T].disconnect(C))}for(let L=0;L<N.added.length;L++){const C=N.added[L];let T=A.indexOf(C);if(T===-1){for(let et=0;et<w.length;et++)if(et>=A.length){A.push(C),T=et;break}else if(A[et]===null){A[et]=C,T=et;break}if(T===-1)break}const U=w[T];U&&U.connect(C)}}const it=new H,rt=new H;function ht(N,L,C){it.setFromMatrixPosition(L.matrixWorld),rt.setFromMatrixPosition(C.matrixWorld);const T=it.distanceTo(rt),U=L.projectionMatrix.elements,et=C.projectionMatrix.elements,_t=U[14]/(U[10]-1),E=U[14]/(U[10]+1),O=(U[9]+1)/U[5],I=(U[9]-1)/U[5],Y=(U[8]-1)/U[0],$=(et[8]+1)/et[0],ot=_t*Y,mt=_t*$,pt=T/(-Y+$),W=pt*-Y;if(L.matrixWorld.decompose(N.position,N.quaternion,N.scale),N.translateX(W),N.translateZ(pt),N.matrixWorld.compose(N.position,N.quaternion,N.scale),N.matrixWorldInverse.copy(N.matrixWorld).invert(),U[10]===-1)N.projectionMatrix.copy(L.projectionMatrix),N.projectionMatrixInverse.copy(L.projectionMatrixInverse);else{const x=_t+pt,At=E+pt,Nt=ot-W,b=mt+(T-W),g=O*E/At*x,k=I*E/At*x;N.projectionMatrix.makePerspective(Nt,b,g,k,x,At),N.projectionMatrixInverse.copy(N.projectionMatrix).invert()}}function Dt(N,L){L===null?N.matrixWorld.copy(N.matrix):N.matrixWorld.multiplyMatrices(L.matrixWorld,N.matrix),N.matrixWorldInverse.copy(N.matrixWorld).invert()}this.updateCamera=function(N){if(s===null)return;let L=N.near,C=N.far;m.texture!==null&&(m.depthNear>0&&(L=m.depthNear),m.depthFar>0&&(C=m.depthFar)),nt.near=X.near=B.near=L,nt.far=X.far=B.far=C,(G!==nt.near||J!==nt.far)&&(s.updateRenderState({depthNear:nt.near,depthFar:nt.far}),G=nt.near,J=nt.far),nt.layers.mask=N.layers.mask|6,B.layers.mask=nt.layers.mask&-5,X.layers.mask=nt.layers.mask&-3;const T=N.parent,U=nt.cameras;Dt(nt,T);for(let et=0;et<U.length;et++)Dt(U[et],T);U.length===2?ht(nt,B,X):nt.projectionMatrix.copy(B.projectionMatrix),R===null&&N.isPerspectiveCamera&&(R={camera:N,fov:N.fov,zoom:N.zoom}),Ct(N,nt,T)};function Ct(N,L,C){C===null?N.matrix.copy(L.matrixWorld):(N.matrix.copy(C.matrixWorld),N.matrix.invert(),N.matrix.multiply(L.matrixWorld)),N.matrix.decompose(N.position,N.quaternion,N.scale),N.updateMatrixWorld(!0),N.projectionMatrix.copy(L.projectionMatrix),N.projectionMatrixInverse.copy(L.projectionMatrixInverse),N.isPerspectiveCamera&&(N.fov=ha*2*Math.atan(1/N.projectionMatrix.elements[5]),N.zoom=1)}this.getCamera=function(){return nt},this.getFoveation=function(){if(!(h===null&&p===null))return c},this.setFoveation=function(N){c=N,h!==null&&(h.fixedFoveation=N),p!==null&&p.fixedFoveation!==void 0&&(p.fixedFoveation=N)},this.hasDepthSensing=function(){return m.texture!==null},this.getDepthSensingMesh=function(){return m.getMesh(nt)},this.getCameraTexture=function(N){return d[N]};let qt=null;function Xt(N,L){if(u=L.getViewerPose(l||a),_=L,u!==null){const C=u.views;p!==null&&(t.setRenderTargetFramebuffer(S,p.framebuffer),t.setRenderTarget(S));let T=!1;C.length!==nt.cameras.length&&(nt.cameras.length=0,T=!0);for(let E=0;E<C.length;E++){const O=C[E];let I=null;if(p!==null)I=p.getViewport(O);else{const $=f.getViewSubImage(h,O);I=$.viewport,E===0&&(t.setRenderTargetTextures(S,$.colorTexture,$.depthStencilTexture),t.setRenderTarget(S))}let Y=q[E];Y===void 0&&(Y=new Ve,Y.layers.enable(E),Y.viewport=new fe,q[E]=Y),Y.matrix.fromArray(O.transform.matrix),Y.matrix.decompose(Y.position,Y.quaternion,Y.scale),Y.projectionMatrix.fromArray(O.projectionMatrix),Y.projectionMatrixInverse.copy(Y.projectionMatrix).invert(),Y.viewport.set(I.x,I.y,I.width,I.height),E===0&&(nt.matrix.copy(Y.matrix),nt.matrix.decompose(nt.position,nt.quaternion,nt.scale)),T===!0&&nt.cameras.push(Y)}const U=s.enabledFeatures;if(U&&U.includes("depth-sensing")&&s.depthUsage=="gpu-optimized"&&y){f=n.getBinding();const E=f.getDepthInformation(C[0]);E&&E.isValid&&E.texture&&m.init(E,s.renderState)}if(U&&U.includes("camera-access")&&y){t.state.unbindTexture(),f=n.getBinding();for(let E=0;E<C.length;E++){const O=C[E].camera;if(O){let I=d[O];I||(I=new Il,d[O]=I);const Y=f.getCameraImage(O);I.sourceTexture=Y}}}}for(let C=0;C<w.length;C++){const T=A[C],U=w[C];T!==null&&U!==void 0&&U.update(T,L,l||a)}qt&&qt(N,L),L.detectedPlanes&&n.dispatchEvent({type:"planesdetected",data:L}),_=null}const Zt=new Yl;Zt.setAnimationLoop(Xt),this.setAnimationLoop=function(N){qt=N},this.dispose=function(){}}}const ug=new pe,tc=new kt;tc.set(-1,0,0,0,1,0,0,0,1);function fg(i,t){function e(m,d){m.matrixAutoUpdate===!0&&m.updateMatrix(),d.value.copy(m.matrix)}function n(m,d){d.color.getRGB(m.fogColor.value,Hl(i)),d.isFog?(m.fogNear.value=d.near,m.fogFar.value=d.far):d.isFogExp2&&(m.fogDensity.value=d.density)}function s(m,d,P,D,S){d.isNodeMaterial?d.uniformsNeedUpdate=!1:d.isMeshBasicMaterial?r(m,d):d.isMeshLambertMaterial?(r(m,d),d.envMap&&(m.envMapIntensity.value=d.envMapIntensity)):d.isMeshToonMaterial?(r(m,d),f(m,d)):d.isMeshPhongMaterial?(r(m,d),u(m,d),d.envMap&&(m.envMapIntensity.value=d.envMapIntensity)):d.isMeshStandardMaterial?(r(m,d),h(m,d),d.isMeshPhysicalMaterial&&p(m,d,S)):d.isMeshMatcapMaterial?(r(m,d),_(m,d)):d.isMeshDepthMaterial?r(m,d):d.isMeshDistanceMaterial?(r(m,d),y(m,d)):d.isMeshNormalMaterial?r(m,d):d.isLineBasicMaterial?(a(m,d),d.isLineDashedMaterial&&o(m,d)):d.isPointsMaterial?c(m,d,P,D):d.isSpriteMaterial?l(m,d):d.isShadowMaterial?(m.color.value.copy(d.color),m.opacity.value=d.opacity):d.isShaderMaterial&&(d.uniformsNeedUpdate=!1)}function r(m,d){m.opacity.value=d.opacity,d.color&&m.diffuse.value.copy(d.color),d.emissive&&m.emissive.value.copy(d.emissive).multiplyScalar(d.emissiveIntensity),d.map&&(m.map.value=d.map,e(d.map,m.mapTransform)),d.alphaMap&&(m.alphaMap.value=d.alphaMap,e(d.alphaMap,m.alphaMapTransform)),d.bumpMap&&(m.bumpMap.value=d.bumpMap,e(d.bumpMap,m.bumpMapTransform),m.bumpScale.value=d.bumpScale,d.side===Ie&&(m.bumpScale.value*=-1)),d.normalMap&&(m.normalMap.value=d.normalMap,e(d.normalMap,m.normalMapTransform),m.normalScale.value.copy(d.normalScale),d.side===Ie&&m.normalScale.value.negate()),d.displacementMap&&(m.displacementMap.value=d.displacementMap,e(d.displacementMap,m.displacementMapTransform),m.displacementScale.value=d.displacementScale,m.displacementBias.value=d.displacementBias),d.emissiveMap&&(m.emissiveMap.value=d.emissiveMap,e(d.emissiveMap,m.emissiveMapTransform)),d.specularMap&&(m.specularMap.value=d.specularMap,e(d.specularMap,m.specularMapTransform)),d.alphaTest>0&&(m.alphaTest.value=d.alphaTest);const P=t.get(d),D=P.envMap,S=P.envMapRotation;D&&(m.envMap.value=D,m.envMapRotation.value.setFromMatrix4(ug.makeRotationFromEuler(S)).transpose(),D.isCubeTexture&&D.isRenderTargetTexture===!1&&m.envMapRotation.value.premultiply(tc),m.reflectivity.value=d.reflectivity,m.ior.value=d.ior,m.refractionRatio.value=d.refractionRatio),d.lightMap&&(m.lightMap.value=d.lightMap,m.lightMapIntensity.value=d.lightMapIntensity,e(d.lightMap,m.lightMapTransform)),d.aoMap&&(m.aoMap.value=d.aoMap,m.aoMapIntensity.value=d.aoMapIntensity,e(d.aoMap,m.aoMapTransform))}function a(m,d){m.diffuse.value.copy(d.color),m.opacity.value=d.opacity,d.map&&(m.map.value=d.map,e(d.map,m.mapTransform))}function o(m,d){m.dashSize.value=d.dashSize,m.totalSize.value=d.dashSize+d.gapSize,m.scale.value=d.scale}function c(m,d,P,D){m.diffuse.value.copy(d.color),m.opacity.value=d.opacity,m.size.value=d.size*P,m.scale.value=D*.5,d.map&&(m.map.value=d.map,e(d.map,m.uvTransform)),d.alphaMap&&(m.alphaMap.value=d.alphaMap,e(d.alphaMap,m.alphaMapTransform)),d.alphaTest>0&&(m.alphaTest.value=d.alphaTest)}function l(m,d){m.diffuse.value.copy(d.color),m.opacity.value=d.opacity,m.rotation.value=d.rotation,d.map&&(m.map.value=d.map,e(d.map,m.mapTransform)),d.alphaMap&&(m.alphaMap.value=d.alphaMap,e(d.alphaMap,m.alphaMapTransform)),d.alphaTest>0&&(m.alphaTest.value=d.alphaTest)}function u(m,d){m.specular.value.copy(d.specular),m.shininess.value=Math.max(d.shininess,1e-4)}function f(m,d){d.gradientMap&&(m.gradientMap.value=d.gradientMap)}function h(m,d){m.metalness.value=d.metalness,d.metalnessMap&&(m.metalnessMap.value=d.metalnessMap,e(d.metalnessMap,m.metalnessMapTransform)),m.roughness.value=d.roughness,d.roughnessMap&&(m.roughnessMap.value=d.roughnessMap,e(d.roughnessMap,m.roughnessMapTransform)),d.envMap&&(m.envMapIntensity.value=d.envMapIntensity)}function p(m,d,P){m.ior.value=d.ior,d.sheen>0&&(m.sheenColor.value.copy(d.sheenColor).multiplyScalar(d.sheen),m.sheenRoughness.value=d.sheenRoughness,d.sheenColorMap&&(m.sheenColorMap.value=d.sheenColorMap,e(d.sheenColorMap,m.sheenColorMapTransform)),d.sheenRoughnessMap&&(m.sheenRoughnessMap.value=d.sheenRoughnessMap,e(d.sheenRoughnessMap,m.sheenRoughnessMapTransform))),d.clearcoat>0&&(m.clearcoat.value=d.clearcoat,m.clearcoatRoughness.value=d.clearcoatRoughness,d.clearcoatMap&&(m.clearcoatMap.value=d.clearcoatMap,e(d.clearcoatMap,m.clearcoatMapTransform)),d.clearcoatRoughnessMap&&(m.clearcoatRoughnessMap.value=d.clearcoatRoughnessMap,e(d.clearcoatRoughnessMap,m.clearcoatRoughnessMapTransform)),d.clearcoatNormalMap&&(m.clearcoatNormalMap.value=d.clearcoatNormalMap,e(d.clearcoatNormalMap,m.clearcoatNormalMapTransform),m.clearcoatNormalScale.value.copy(d.clearcoatNormalScale),d.side===Ie&&m.clearcoatNormalScale.value.negate())),d.dispersion>0&&(m.dispersion.value=d.dispersion),d.retroreflectivity>0&&(m.retroreflectivity.value=d.retroreflectivity),d.iridescence>0&&(m.iridescence.value=d.iridescence,m.iridescenceIOR.value=d.iridescenceIOR,m.iridescenceThicknessMinimum.value=d.iridescenceThicknessRange[0],m.iridescenceThicknessMaximum.value=d.iridescenceThicknessRange[1],d.iridescenceMap&&(m.iridescenceMap.value=d.iridescenceMap,e(d.iridescenceMap,m.iridescenceMapTransform)),d.iridescenceThicknessMap&&(m.iridescenceThicknessMap.value=d.iridescenceThicknessMap,e(d.iridescenceThicknessMap,m.iridescenceThicknessMapTransform))),d.transmission>0&&(m.transmission.value=d.transmission,m.transmissionSamplerMap.value=P.texture,m.transmissionSamplerSize.value.set(P.width,P.height),d.transmissionMap&&(m.transmissionMap.value=d.transmissionMap,e(d.transmissionMap,m.transmissionMapTransform)),m.thickness.value=d.thickness,d.thicknessMap&&(m.thicknessMap.value=d.thicknessMap,e(d.thicknessMap,m.thicknessMapTransform)),m.attenuationDistance.value=d.attenuationDistance,m.attenuationColor.value.copy(d.attenuationColor)),d.anisotropy>0&&(m.anisotropyVector.value.set(d.anisotropy*Math.cos(d.anisotropyRotation),d.anisotropy*Math.sin(d.anisotropyRotation)),d.anisotropyMap&&(m.anisotropyMap.value=d.anisotropyMap,e(d.anisotropyMap,m.anisotropyMapTransform))),m.specularIntensity.value=d.specularIntensity,m.specularColor.value.copy(d.specularColor),d.specularColorMap&&(m.specularColorMap.value=d.specularColorMap,e(d.specularColorMap,m.specularColorMapTransform)),d.specularIntensityMap&&(m.specularIntensityMap.value=d.specularIntensityMap,e(d.specularIntensityMap,m.specularIntensityMapTransform))}function _(m,d){d.matcap&&(m.matcap.value=d.matcap)}function y(m,d){const P=t.get(d).light;m.referencePosition.value.setFromMatrixPosition(P.matrixWorld),m.nearDistance.value=P.shadow.camera.near,m.farDistance.value=P.shadow.camera.far}return{refreshFogUniforms:n,refreshMaterialUniforms:s}}function dg(i,t,e,n){let s={},r={},a=[];const o=i.getParameter(i.MAX_UNIFORM_BUFFER_BINDINGS);function c(S,w){const A=w.program;n.uniformBlockBinding(S,A)}function l(S,w){let A=s[S.id];A===void 0&&(m(S),A=u(S),s[S.id]=A,S.addEventListener("dispose",P));const F=w.program;n.updateUBOMapping(S,F);const v=t.render.frame;r[S.id]!==v&&(h(S),r[S.id]=v)}function u(S){const w=f();S.__bindingPointIndex=w;const A=i.createBuffer(),F=S.__size,v=S.usage;return i.bindBuffer(i.UNIFORM_BUFFER,A),i.bufferData(i.UNIFORM_BUFFER,F,v),i.bindBuffer(i.UNIFORM_BUFFER,null),i.bindBufferBase(i.UNIFORM_BUFFER,w,A),A}function f(){for(let S=0;S<o;S++)if(a.indexOf(S)===-1)return a.push(S),S;return ne("WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function h(S){const w=s[S.id],A=S.uniforms,F=S.__cache;i.bindBuffer(i.UNIFORM_BUFFER,w);for(let v=0,R=A.length;v<R;v++){const B=A[v];if(Array.isArray(B))for(let X=0,q=B.length;X<q;X++)p(B[X],v,X,F);else p(B,v,0,F)}i.bindBuffer(i.UNIFORM_BUFFER,null)}function p(S,w,A,F){if(y(S,w,A,F)===!0){const v=S.__offset,R=S.value;if(Array.isArray(R)){let B=0;for(let X=0;X<R.length;X++){const q=R[X],nt=d(q);_(q,S.__data,B),typeof q!="number"&&typeof q!="boolean"&&!q.isMatrix3&&!ArrayBuffer.isView(q)&&(B+=nt.storage/Float32Array.BYTES_PER_ELEMENT)}}else _(R,S.__data,0);i.bufferSubData(i.UNIFORM_BUFFER,v,S.__data)}}function _(S,w,A){typeof S=="number"||typeof S=="boolean"?w[0]=S:S.isMatrix3?(w[0]=S.elements[0],w[1]=S.elements[1],w[2]=S.elements[2],w[3]=0,w[4]=S.elements[3],w[5]=S.elements[4],w[6]=S.elements[5],w[7]=0,w[8]=S.elements[6],w[9]=S.elements[7],w[10]=S.elements[8],w[11]=0):ArrayBuffer.isView(S)?w.set(new S.constructor(S.buffer,S.byteOffset,w.length)):S.toArray(w,A)}function y(S,w,A,F){const v=S.value,R=w+"_"+A;if(F[R]===void 0)return typeof v=="number"||typeof v=="boolean"?F[R]=v:ArrayBuffer.isView(v)?F[R]=v.slice():F[R]=v.clone(),!0;{const B=F[R];if(typeof v=="number"||typeof v=="boolean"){if(B!==v)return F[R]=v,!0}else{if(ArrayBuffer.isView(v))return!0;if(B.equals(v)===!1)return B.copy(v),!0}}return!1}function m(S){const w=S.uniforms;let A=0;const F=16;for(let R=0,B=w.length;R<B;R++){const X=Array.isArray(w[R])?w[R]:[w[R]];for(let q=0,nt=X.length;q<nt;q++){const G=X[q],J=Array.isArray(G.value)?G.value:[G.value];for(let lt=0,K=J.length;lt<K;lt++){const Z=J[lt],it=d(Z),rt=A%F,ht=rt%it.boundary,Dt=rt+ht;A+=ht,Dt!==0&&F-Dt<it.storage&&(A+=F-Dt),G.__data=new Float32Array(it.storage/Float32Array.BYTES_PER_ELEMENT),G.__offset=A,A+=it.storage}}}const v=A%F;return v>0&&(A+=F-v),S.__size=A,S.__cache={},this}function d(S){const w={boundary:0,storage:0};return typeof S=="number"||typeof S=="boolean"?(w.boundary=4,w.storage=4):S.isVector2?(w.boundary=8,w.storage=8):S.isVector3||S.isColor?(w.boundary=16,w.storage=12):S.isVector4?(w.boundary=16,w.storage=16):S.isMatrix3?(w.boundary=48,w.storage=48):S.isMatrix4?(w.boundary=64,w.storage=64):S.isTexture?Wt("WebGLRenderer: Texture samplers can not be part of an uniforms group."):ArrayBuffer.isView(S)?(w.boundary=16,w.storage=S.byteLength):Wt("WebGLRenderer: Unsupported uniform value type.",S),w}function P(S){const w=S.target;w.removeEventListener("dispose",P);const A=a.indexOf(w.__bindingPointIndex);a.splice(A,1),i.deleteBuffer(s[w.id]),delete s[w.id],delete r[w.id]}function D(){for(const S in s)i.deleteBuffer(s[S]);a=[],s={},r={}}return{bind:c,update:l,dispose:D}}const pg=new Uint16Array([12469,15057,12620,14925,13266,14620,13807,14376,14323,13990,14545,13625,14713,13328,14840,12882,14931,12528,14996,12233,15039,11829,15066,11525,15080,11295,15085,10976,15082,10705,15073,10495,13880,14564,13898,14542,13977,14430,14158,14124,14393,13732,14556,13410,14702,12996,14814,12596,14891,12291,14937,11834,14957,11489,14958,11194,14943,10803,14921,10506,14893,10278,14858,9960,14484,14039,14487,14025,14499,13941,14524,13740,14574,13468,14654,13106,14743,12678,14818,12344,14867,11893,14889,11509,14893,11180,14881,10751,14852,10428,14812,10128,14765,9754,14712,9466,14764,13480,14764,13475,14766,13440,14766,13347,14769,13070,14786,12713,14816,12387,14844,11957,14860,11549,14868,11215,14855,10751,14825,10403,14782,10044,14729,9651,14666,9352,14599,9029,14967,12835,14966,12831,14963,12804,14954,12723,14936,12564,14917,12347,14900,11958,14886,11569,14878,11247,14859,10765,14828,10401,14784,10011,14727,9600,14660,9289,14586,8893,14508,8533,15111,12234,15110,12234,15104,12216,15092,12156,15067,12010,15028,11776,14981,11500,14942,11205,14902,10752,14861,10393,14812,9991,14752,9570,14682,9252,14603,8808,14519,8445,14431,8145,15209,11449,15208,11451,15202,11451,15190,11438,15163,11384,15117,11274,15055,10979,14994,10648,14932,10343,14871,9936,14803,9532,14729,9218,14645,8742,14556,8381,14461,8020,14365,7603,15273,10603,15272,10607,15267,10619,15256,10631,15231,10614,15182,10535,15118,10389,15042,10167,14963,9787,14883,9447,14800,9115,14710,8665,14615,8318,14514,7911,14411,7507,14279,7198,15314,9675,15313,9683,15309,9712,15298,9759,15277,9797,15229,9773,15166,9668,15084,9487,14995,9274,14898,8910,14800,8539,14697,8234,14590,7790,14479,7409,14367,7067,14178,6621,15337,8619,15337,8631,15333,8677,15325,8769,15305,8871,15264,8940,15202,8909,15119,8775,15022,8565,14916,8328,14804,8009,14688,7614,14569,7287,14448,6888,14321,6483,14088,6171,15350,7402,15350,7419,15347,7480,15340,7613,15322,7804,15287,7973,15229,8057,15148,8012,15046,7846,14933,7611,14810,7357,14682,7069,14552,6656,14421,6316,14251,5948,14007,5528,15356,5942,15356,5977,15353,6119,15348,6294,15332,6551,15302,6824,15249,7044,15171,7122,15070,7050,14949,6861,14818,6611,14679,6349,14538,6067,14398,5651,14189,5311,13935,4958,15359,4123,15359,4153,15356,4296,15353,4646,15338,5160,15311,5508,15263,5829,15188,6042,15088,6094,14966,6001,14826,5796,14678,5543,14527,5287,14377,4985,14133,4586,13869,4257,15360,1563,15360,1642,15358,2076,15354,2636,15341,3350,15317,4019,15273,4429,15203,4732,15105,4911,14981,4932,14836,4818,14679,4621,14517,4386,14359,4156,14083,3795,13808,3437,15360,122,15360,137,15358,285,15355,636,15344,1274,15322,2177,15281,2765,15215,3223,15120,3451,14995,3569,14846,3567,14681,3466,14511,3305,14344,3121,14037,2800,13753,2467,15360,0,15360,1,15359,21,15355,89,15346,253,15325,479,15287,796,15225,1148,15133,1492,15008,1749,14856,1882,14685,1886,14506,1783,14324,1608,13996,1398,13702,1183]);let tn=null;function mg(){return tn===null&&(tn=new _h(pg,16,16,Yn,cn),tn.name="DFG_LUT",tn.minFilter=Ae,tn.magFilter=Ae,tn.wrapS=nn,tn.wrapT=nn,tn.generateMipmaps=!1,tn.needsUpdate=!0),tn}class gg{constructor(t={}){const{canvas:e=Xc(),context:n=null,depth:s=!0,stencil:r=!1,alpha:a=!1,antialias:o=!1,premultipliedAlpha:c=!0,preserveDrawingBuffer:l=!1,powerPreference:u="default",failIfMajorPerformanceCaveat:f=!1,reversedDepthBuffer:h=!1,outputBufferType:p=Be}=t;this.isWebGLRenderer=!0;let _;if(n!==null){if(typeof WebGLRenderingContext<"u"&&n instanceof WebGLRenderingContext)throw new Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");_=n.getContextAttributes().alpha}else _=a;const y=p,m=new Set([Ma,Sa,va]),d=new Set([Be,ln,Fi,Oi,_a,xa]),P=new Uint32Array(4),D=new Int32Array(4),S=new H;let w=null,A=null;const F=[],v=[];let R=null;this.domElement=e,this.debug={checkShaderErrors:!0,diagnostics:{keywords:!1},onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this.toneMapping=an,this.toneMappingExposure=1,this.transmissionResolutionScale=1;const B=this;let X=!1,q=null,nt=null,G=null,J=null;this._outputColorSpace=Oe;let lt=0,K=0,Z=null,it=-1,rt=null;const ht=new fe,Dt=new fe;let Ct=null;const qt=new jt(0);let Xt=0,Zt=e.width,N=e.height,L=1,C=null,T=null;const U=new fe(0,0,Zt,N),et=new fe(0,0,Zt,N);let _t=!1;const E=new Aa;let O=!1,I=!1;const Y=new pe,$=new H,ot=new fe,mt={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0};let pt=!1;function W(){return Z===null?L:1}let x=n;function At(M,z){return e.getContext(M,z)}let Nt,b,g,k,Q,at,xt,vt,ct,ut,St,Ot,yt,Mt,Gt,Ht,Yt,V,Et,ft,bt,Pt,gt;try{const M={alpha:!0,depth:s,stencil:r,antialias:o,premultipliedAlpha:c,preserveDrawingBuffer:l,powerPreference:u,failIfMajorPerformanceCaveat:f};if("setAttribute"in e&&e.setAttribute("data-engine","three.js r186"),e.addEventListener("webglcontextlost",ce,!1),e.addEventListener("webglcontextrestored",ie,!1),e.addEventListener("webglcontextcreationerror",He,!1),x===null){const z="webgl2";if(x=At(z,M),x===null)throw At(z)?new Error("THREE.WebGLRenderer: Error creating WebGL context with your selected attributes."):new Error("THREE.WebGLRenderer: Error creating WebGL context.")}Vt()}catch(M){throw e.removeEventListener("webglcontextlost",ce,!1),e.removeEventListener("webglcontextrestored",ie,!1),e.removeEventListener("webglcontextcreationerror",He,!1),ne("WebGLRenderer: "+M.message),M}function Vt(){Nt=new mp(x),Nt.init(),bt=new ag(x,Nt),b=new rp(x,Nt,t,bt),g=new sg(x,Nt),b.reversedDepthBuffer&&h&&g.buffers.depth.setReversed(!0),nt=x.createFramebuffer(),G=x.createFramebuffer(),J=x.createFramebuffer(),k=new xp(x),Q=new Wm,at=new rg(x,Nt,g,Q,b,bt,k),xt=new pp(B),vt=new vu(x),Pt=new ip(x,vt),ct=new gp(x,vt,k,Pt),ut=new Sp(x,ct,vt,Pt,k),V=new vp(x,b,at),Gt=new ap(Q),St=new Hm(B,xt,Nt,b,Pt,Gt),Ot=new fg(B,Q),yt=new qm,Mt=new Qm(Nt),Yt=new np(B,xt,g,ut,_,c),Ht=new ig(B,ut,b),gt=new dg(x,k,b,g),Et=new sp(x,Nt,k),ft=new _p(x,Nt,k),k.programs=St.programs,B.capabilities=b,B.extensions=Nt,B.properties=Q,B.renderLists=yt,B.shadowMap=Ht,B.state=g,B.info=k}y!==Be&&(R=new yp(y,e.width,e.height,o,s,r));const Bt=new hg(B,x);this.xr=Bt,this.getContext=function(){return x},this.getContextAttributes=function(){return x.getContextAttributes()},this.forceContextLoss=function(){const M=Nt.get("WEBGL_lose_context");M&&M.loseContext()},this.forceContextRestore=function(){const M=Nt.get("WEBGL_lose_context");M&&M.restoreContext()},this.getPixelRatio=function(){return L},this.setPixelRatio=function(M){M!==void 0&&(L=M,this.setSize(Zt,N,!1))},this.getSize=function(M){return M.set(Zt,N)},this.setSize=function(M,z,st=!0){if(Bt.isPresenting){Wt("WebGLRenderer: Can't change size while VR device is presenting.");return}Zt=M,N=z,e.width=Math.floor(M*L),e.height=Math.floor(z*L),st===!0&&(e.style.width=M+"px",e.style.height=z+"px"),R!==null&&R.setSize(e.width,e.height),this.setViewport(0,0,M,z)},this.getDrawingBufferSize=function(M){return M.set(Zt*L,N*L).floor()},this.setDrawingBufferSize=function(M,z,st){Zt=M,N=z,L=st,e.width=Math.floor(M*st),e.height=Math.floor(z*st),this.setViewport(0,0,M,z)},this.setEffects=function(M){if(y===Be){ne("WebGLRenderer: setEffects() requires outputBufferType set to HalfFloatType or FloatType.");return}if(M){for(let z=0;z<M.length;z++)if(M[z].isOutputPass===!0){Wt("WebGLRenderer: OutputPass is not needed in setEffects(). Tone mapping and color space conversion are applied automatically.");break}}R.setEffects(M||[])},this.getCurrentViewport=function(M){return M.copy(ht)},this.getViewport=function(M){return M.copy(U)},this.setViewport=function(M,z,st,j){M.isVector4?U.set(M.x,M.y,M.z,M.w):U.set(M,z,st,j),g.viewport(ht.copy(U).multiplyScalar(L).round())},this.getScissor=function(M){return M.copy(et)},this.setScissor=function(M,z,st,j){M.isVector4?et.set(M.x,M.y,M.z,M.w):et.set(M,z,st,j),g.scissor(Dt.copy(et).multiplyScalar(L).round())},this.getScissorTest=function(){return _t},this.setScissorTest=function(M){g.setScissorTest(_t=M)},this.setOpaqueSort=function(M){C=M},this.setTransparentSort=function(M){T=M},this.getClearColor=function(M){return M.copy(Yt.getClearColor())},this.setClearColor=function(){Yt.setClearColor(...arguments)},this.getClearAlpha=function(){return Yt.getClearAlpha()},this.setClearAlpha=function(){Yt.setClearAlpha(...arguments)},this.clear=function(M=!0,z=!0,st=!0){let j=0;if(M){let tt=!1;if(Z!==null){const Rt=Z.texture.format;tt=m.has(Rt)}if(tt){const Rt=Z.texture.type,It=d.has(Rt),wt=Yt.getClearColor(),Ut=Yt.getClearAlpha(),zt=wt.r,Kt=wt.g,Qt=wt.b;It?(P[0]=zt,P[1]=Kt,P[2]=Qt,P[3]=Ut,x.clearBufferuiv(x.COLOR,0,P)):(D[0]=zt,D[1]=Kt,D[2]=Qt,D[3]=Ut,x.clearBufferiv(x.COLOR,0,D))}else j|=x.COLOR_BUFFER_BIT}z&&(j|=x.DEPTH_BUFFER_BIT,this.state.buffers.depth.setMask(!0)),st&&(j|=x.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),j!==0&&x.clear(j)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.setNodesHandler=function(M){M.setRenderer(this),q=M},this.dispose=function(){e.removeEventListener("webglcontextlost",ce,!1),e.removeEventListener("webglcontextrestored",ie,!1),e.removeEventListener("webglcontextcreationerror",He,!1),Yt.dispose(),yt.dispose(),Mt.dispose(),Q.dispose(),xt.dispose(),ut.dispose(),Pt.dispose(),gt.dispose(),St.dispose(),Bt.dispose(),Bt.removeEventListener("sessionstart",za),Bt.removeEventListener("sessionend",Ga),Fn.stop()};function ce(M){M.preventDefault(),to("WebGLRenderer: Context Lost."),X=!0}function ie(){to("WebGLRenderer: Context Restored."),X=!1;const M=k.autoReset,z=Ht.enabled,st=Ht.autoUpdate,j=Ht.needsUpdate,tt=Ht.type;Vt(),k.autoReset=M,Ht.enabled=z,Ht.autoUpdate=st,Ht.needsUpdate=j,Ht.type=tt}function He(M){ne("WebGLRenderer: A WebGL context could not be created. Reason: ",M.statusMessage)}function $e(M){const z=M.target;z.removeEventListener("dispose",$e),ic(z)}function ic(M){sc(M),Q.remove(M)}function sc(M){const z=Q.get(M).programs;z!==void 0&&(z.forEach(function(st){St.releaseProgram(st)}),M.isShaderMaterial&&St.releaseShaderCache(M))}this.renderBufferDirect=function(M,z,st,j,tt,Rt){z===null&&(z=mt);const It=tt.isMesh&&tt.matrixWorld.determinantAffine()<0,wt=oc(M,z,st,j,tt);g.setMaterial(j,It);let Ut=st.index,zt=1;if(j.wireframe===!0){if(Ut=ct.getWireframeAttribute(st),Ut===void 0)return;zt=2}const Kt=st.drawRange,Qt=st.attributes.position;let Ft=Kt.start*zt,se=(Kt.start+Kt.count)*zt;Rt!==null&&(Ft=Math.max(Ft,Rt.start*zt),se=Math.min(se,(Rt.start+Rt.count)*zt)),Ut!==null?(Ft=Math.max(Ft,0),se=Math.min(se,Ut.count)):Qt!=null&&(Ft=Math.max(Ft,0),se=Math.min(se,Qt.count));const ge=se-Ft;if(ge<0||ge===1/0)return;Pt.setup(tt,j,wt,st,Ut);let ue,le=Et;if(Ut!==null&&(ue=vt.get(Ut),le=ft,le.setIndex(ue)),tt.isMesh)j.wireframe===!0?(g.setLineWidth(j.wireframeLinewidth*W()),le.setMode(x.LINES)):le.setMode(x.TRIANGLES);else if(tt.isLine){let Ee=j.linewidth;Ee===void 0&&(Ee=1),g.setLineWidth(Ee*W()),tt.isLineSegments?le.setMode(x.LINES):tt.isLineLoop?le.setMode(x.LINE_LOOP):le.setMode(x.LINE_STRIP)}else tt.isPoints?le.setMode(x.POINTS):tt.isSprite&&le.setMode(x.TRIANGLES);if(tt.isBatchedMesh)if(Nt.get("WEBGL_multi_draw"))le.renderMultiDraw(tt._multiDrawStarts,tt._multiDrawCounts,tt._multiDrawCount);else{const Ee=tt._multiDrawStarts,Lt=tt._multiDrawCounts,Ce=tt._multiDrawCount,ee=Ut?vt.get(Ut).bytesPerElement:1,ze=Q.get(j).currentProgram.getUniforms();for(let Qe=0;Qe<Ce;Qe++)ze.setValue(x,"_gl_DrawID",Qe),le.render(Ee[Qe]/ee,Lt[Qe])}else if(tt.isInstancedMesh)le.renderInstances(Ft,ge,tt.count);else if(st.isInstancedBufferGeometry){const Ee=st._maxInstanceCount!==void 0?st._maxInstanceCount:1/0,Lt=Math.min(st.instanceCount,Ee);le.renderInstances(Ft,ge,Lt)}else le.render(Ft,ge)};function Ba(M,z,st,j){q!==null&&M.isNodeMaterial&&q.setObject(j,M),O===!0&&Gt.setState(M,st,!1),M.transparent===!0&&M.side===Ye&&M.forceSinglePass===!1?(M.side=Ie,M.needsUpdate=!0,Zi(M,z,j),M.side=Xn,M.needsUpdate=!0,Zi(M,z,j),M.side=Ye):Zi(M,z,j)}this.compile=function(M,z,st=null){st===null&&(st=M),q!==null&&q.renderStart(M,z,st),A=Mt.get(st),A.init(z),v.push(A),st.traverseVisible(function(tt){tt.isLight&&tt.layers.test(z.layers)&&(A.pushLight(tt),tt.castShadow&&A.pushShadow(tt))}),M!==st&&M.traverseVisible(function(tt){tt.isLight&&tt.layers.test(z.layers)&&(A.pushLight(tt),tt.castShadow&&A.pushShadow(tt))}),A.setupLights(),q!==null&&q.updateLights(A.state.lightsArray),I=this.localClippingEnabled,O=Gt.init(this.clippingPlanes,I),O===!0&&Gt.setGlobalState(this.clippingPlanes,z),q!==null&&Ht.render(A.state.shadowsArray,st,z);const j=new Set;return M.traverse(function(tt){if(!(tt.isMesh||tt.isPoints||tt.isLine||tt.isSprite))return;const Rt=tt.material;if(Rt)if(Array.isArray(Rt))for(let It=0;It<Rt.length;It++){const wt=Rt[It];Ba(wt,st,z,tt),j.add(wt)}else Ba(Rt,st,z,tt),j.add(Rt)}),A=v.pop(),q!==null&&q.renderEnd(),j},this.compileAsync=function(M,z,st=null){const j=this.compile(M,z,st);return new Promise(tt=>{function Rt(){if(j.forEach(function(It){const Ut=Q.get(It).currentProgram;(Ut===void 0||Ut.isReady())&&j.delete(It)}),j.size===0){tt(M);return}setTimeout(Rt,10)}Nt.get("KHR_parallel_shader_compile")!==null?Rt():setTimeout(Rt,10)})};let ks=null;function rc(M){ks&&ks(M)}function za(){Fn.stop()}function Ga(){Fn.start()}const Fn=new Yl;Fn.setAnimationLoop(rc),typeof self<"u"&&Fn.setContext(self),this.setAnimationLoop=function(M){ks=M,Bt.setAnimationLoop(M),M===null?Fn.stop():Fn.start()},Bt.addEventListener("sessionstart",za),Bt.addEventListener("sessionend",Ga),this.render=function(M,z){if(z!==void 0&&z.isCamera!==!0){ne("WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(X===!0)return;q!==null&&q.renderStart(M,z);const st=Bt.enabled===!0&&Bt.isPresenting===!0,j=R!==null&&(Z===null||st)&&R.begin(B,Z);if(M.matrixWorldAutoUpdate===!0&&M.updateMatrixWorld(),z.parent===null&&z.matrixWorldAutoUpdate===!0&&z.updateMatrixWorld(),Bt.enabled===!0&&Bt.isPresenting===!0&&(R===null||R.isCompositing()===!1)&&(Bt.cameraAutoUpdate===!0&&Bt.updateCamera(z),z=Bt.getCamera()),M.isScene===!0&&M.onBeforeRender(B,M,z,Z),A=Mt.get(M,v.length),A.init(z),A.state.textureUnits=at.getTextureUnits(),v.push(A),Y.multiplyMatrices(z.projectionMatrix,z.matrixWorldInverse),E.setFromProjectionMatrix(Y,rn,z.reversedDepth),I=this.localClippingEnabled,O=Gt.init(this.clippingPlanes,I),w=yt.get(M,F.length),w.init(),F.push(w),Bt.enabled===!0&&Bt.isPresenting===!0){const It=B.xr.getDepthSensingMesh();It!==null&&Hs(It,z,-1/0,B.sortObjects)}Hs(M,z,0,B.sortObjects),w.finish(),q!==null&&q.updateLights(A.state.lightsArray),B.sortObjects===!0&&w.sort(C,T),pt=Bt.enabled===!1||Bt.isPresenting===!1||Bt.hasDepthSensing()===!1,pt&&Yt.addToRenderList(w,M),this.info.render.frame++,this.info.autoReset===!0&&this.info.reset(),O===!0&&Gt.beginShadows();const tt=A.state.shadowsArray;if(Ht.render(tt,M,z),O===!0&&Gt.endShadows(),(j&&R.hasRenderPass())===!1){const It=w.opaque,wt=w.transmissive;if(A.setupLights(),z.isArrayCamera){const Ut=z.cameras;if(wt.length>0)for(let zt=0,Kt=Ut.length;zt<Kt;zt++){const Qt=Ut[zt];ka(It,wt,M,Qt)}pt&&Yt.render(M);for(let zt=0,Kt=Ut.length;zt<Kt;zt++){const Qt=Ut[zt];Va(w,M,Qt,Qt.viewport)}}else wt.length>0&&ka(It,wt,M,z),pt&&Yt.render(M),Va(w,M,z)}Z!==null&&K===0&&(at.updateMultisampleRenderTarget(Z),at.updateRenderTargetMipmap(Z)),j&&R.end(B),M.isScene===!0&&M.onAfterRender(B,M,z),Pt.resetDefaultState(),it=-1,rt=null,v.pop(),v.length>0?(A=v[v.length-1],at.setTextureUnits(A.state.textureUnits),O===!0&&Gt.setGlobalState(B.clippingPlanes,A.state.camera)):A=null,F.pop(),F.length>0?w=F[F.length-1]:w=null,q!==null&&q.renderEnd()};function Hs(M,z,st,j){if(M.visible===!1)return;if(M.layers.test(z.layers)){if(M.isGroup)st=M.renderOrder;else if(M.isLOD)M.autoUpdate===!0&&M.update(z);else if(M.isLightProbeGrid)A.pushLightProbeGrid(M);else if(M.isLight)A.pushLight(M),M.castShadow&&A.pushShadow(M);else if(M.isSprite){if(!M.frustumCulled||M.intersectsFrustum(E)){j&&ot.setFromMatrixPosition(M.matrixWorld).applyMatrix4(Y);const It=ut.update(M),wt=M.material;wt.visible&&w.push(M,It,wt,st,ot.z,null,z)}}else if((M.isMesh||M.isLine||M.isPoints)&&(!M.frustumCulled||M.intersectsFrustum(E))){const It=ut.update(M),wt=M.material;if(j&&(M.boundingSphere!==void 0?(M.boundingSphere===null&&M.computeBoundingSphere(),ot.copy(M.boundingSphere.center)):(It.boundingSphere===null&&It.computeBoundingSphere(),ot.copy(It.boundingSphere.center)),ot.applyMatrix4(M.matrixWorld).applyMatrix4(Y)),Array.isArray(wt)){const Ut=It.groups;for(let zt=0,Kt=Ut.length;zt<Kt;zt++){const Qt=Ut[zt],Ft=wt[Qt.materialIndex];Ft&&Ft.visible&&w.push(M,It,Ft,st,ot.z,Qt,z)}}else wt.visible&&w.push(M,It,wt,st,ot.z,null,z)}}const Rt=M.children;for(let It=0,wt=Rt.length;It<wt;It++)Hs(Rt[It],z,st,j)}function Va(M,z,st,j){const{opaque:tt,transmissive:Rt,transparent:It}=M;A.setupLightsView(st),O===!0&&Gt.setGlobalState(B.clippingPlanes,st),j&&g.viewport(ht.copy(j)),tt.length>0&&Yi(tt,z,st),Rt.length>0&&Yi(Rt,z,st),It.length>0&&Yi(It,z,st),g.buffers.depth.setTest(!0),g.buffers.depth.setMask(!0),g.buffers.color.setMask(!0),g.setPolygonOffset(!1)}function ka(M,z,st,j){if((st.isScene===!0?st.overrideMaterial:null)!==null)return;if(A.state.transmissionRenderTarget[j.id]===void 0){const Ft=Nt.has("EXT_color_buffer_half_float")||Nt.has("EXT_color_buffer_float");A.state.transmissionRenderTarget[j.id]=new Je(1,1,{generateMipmaps:!0,type:Ft?cn:Be,minFilter:Hn,samples:Math.max(4,b.samples),stencilBuffer:r,resolveDepthBuffer:!1,resolveStencilBuffer:!1,storeMultisampledDepthBuffer:!1,storeMultisampledStencilBuffer:!1,colorSpace:te.workingColorSpace})}const Rt=A.state.transmissionRenderTarget[j.id],It=j.viewport||ht;Rt.setSize(It.z*B.transmissionResolutionScale,It.w*B.transmissionResolutionScale);const wt=B.getRenderTarget(),Ut=B.getActiveCubeFace(),zt=B.getActiveMipmapLevel();B.setRenderTarget(Rt),B.getClearColor(qt),Xt=B.getClearAlpha(),Xt<1&&B.setClearColor(16777215,.5),B.clear(),pt&&Yt.render(st);const Kt=B.toneMapping;B.toneMapping=an;const Qt=j.viewport;if(j.viewport!==void 0&&(j.viewport=void 0),A.setupLightsView(j),O===!0&&Gt.setGlobalState(B.clippingPlanes,j),Yi(M,st,j),at.updateMultisampleRenderTarget(Rt),at.updateRenderTargetMipmap(Rt),Nt.has("WEBGL_multisampled_render_to_texture")===!1){let Ft=!1;for(let se=0,ge=z.length;se<ge;se++){const ue=z[se],{object:le,geometry:Ee,material:Lt,group:Ce}=ue;if(Lt.side===Ye&&le.layers.test(j.layers)){const ee=Lt.side;Lt.side=Ie,Lt.needsUpdate=!0,Ha(le,st,j,Ee,Lt,Ce),Lt.side=ee,Lt.needsUpdate=!0,Ft=!0}}Ft===!0&&(at.updateMultisampleRenderTarget(Rt),at.updateRenderTargetMipmap(Rt))}B.setRenderTarget(wt,Ut,zt),B.setClearColor(qt,Xt),Qt!==void 0&&(j.viewport=Qt),B.toneMapping=Kt}function Yi(M,z,st){const j=z.isScene===!0?z.overrideMaterial:null;for(let tt=0,Rt=M.length;tt<Rt;tt++){const It=M[tt],{object:wt,geometry:Ut,group:zt}=It;let Kt=It.material;Kt.allowOverride===!0&&j!==null&&(Kt=j),wt.layers.test(st.layers)&&Ha(wt,z,st,Ut,Kt,zt)}}function Ha(M,z,st,j,tt,Rt){q!==null&&tt.isNodeMaterial&&q.setObject(M,tt),M.onBeforeRender(B,z,st,j,tt,Rt),M.modelViewMatrix.multiplyMatrices(st.matrixWorldInverse,M.matrixWorld),M.normalMatrix.getNormalMatrix(M.modelViewMatrix),tt.onBeforeRender(B,z,st,j,M,Rt),tt.transparent===!0&&tt.side===Ye&&tt.forceSinglePass===!1?(tt.side=Ie,tt.needsUpdate=!0,B.renderBufferDirect(st,z,j,tt,M,Rt),tt.side=Xn,tt.needsUpdate=!0,B.renderBufferDirect(st,z,j,tt,M,Rt),tt.side=Ye):B.renderBufferDirect(st,z,j,tt,M,Rt),M.onAfterRender(B,z,st,j,tt,Rt)}function Zi(M,z,st){z.isScene!==!0&&(z=mt);const j=Q.get(M),tt=A.state.lights,Rt=A.state.shadowsArray,It=tt.state.version,wt=St.getParameters(M,tt.state,Rt,z,st,A.state.lightProbeGridArray),Ut=St.getProgramCacheKey(wt);let zt=j.programs;j.environment=M.isMeshStandardMaterial||M.isMeshLambertMaterial||M.isMeshPhongMaterial?z.environment:null,j.fog=z.fog;const Kt=M.isMeshStandardMaterial||M.isMeshLambertMaterial&&!M.envMap||M.isMeshPhongMaterial&&!M.envMap;j.envMap=xt.get(M.envMap||j.environment,Kt),j.envMapRotation=j.environment!==null&&M.envMap===null?z.environmentRotation:M.envMapRotation,zt===void 0&&(M.addEventListener("dispose",$e),zt=new Map,j.programs=zt);let Qt=zt.get(Ut);if(Qt!==void 0){if(j.currentProgram===Qt&&j.lightsStateVersion===It)return Xa(M,wt),Qt}else wt.uniforms=St.getUniforms(M),q!==null&&M.isNodeMaterial&&q.build(M,st,wt),M.onBeforeCompile(wt,B),Qt=St.acquireProgram(wt,Ut),zt.set(Ut,Qt),j.uniforms=wt.uniforms;const Ft=j.uniforms;return(!M.isShaderMaterial&&!M.isRawShaderMaterial||M.clipping===!0)&&(Ft.clippingPlanes=Gt.uniform),Xa(M,wt),j.needsLights=cc(M),j.lightsStateVersion=It,j.needsLights&&(Ft.ambientLightColor.value=tt.state.ambient,Ft.lightProbe.value=tt.state.probe,Ft.sunLights.value=tt.state.sun,Ft.sunLightShadows.value=tt.state.sunShadow,Ft.directionalLights.value=tt.state.directional,Ft.directionalLightShadows.value=tt.state.directionalShadow,Ft.spotLights.value=tt.state.spot,Ft.spotLightShadows.value=tt.state.spotShadow,Ft.rectAreaLights.value=tt.state.rectArea,Ft.ltc_1.value=tt.state.rectAreaLTC1,Ft.ltc_2.value=tt.state.rectAreaLTC2,Ft.pointLights.value=tt.state.point,Ft.pointLightShadows.value=tt.state.pointShadow,Ft.hemisphereLights.value=tt.state.hemi,Ft.sunShadowMatrix.value=tt.state.sunShadowMatrix,Ft.sunShadowCascade.value=tt.state.sunShadowCascade,Ft.directionalShadowMatrix.value=tt.state.directionalShadowMatrix,Ft.spotLightMatrix.value=tt.state.spotLightMatrix,Ft.spotLightMap.value=tt.state.spotLightMap,Ft.pointShadowMatrix.value=tt.state.pointShadowMatrix),j.lightProbeGrid=A.state.lightProbeGridArray.length>0,j.currentProgram=Qt,j.uniformsList=null,Qt}function Wa(M){if(M.uniformsList===null){const z=M.currentProgram.getUniforms();M.uniformsList=ws.seqWithValue(z.seq,M.uniforms)}return M.uniformsList}function Xa(M,z){const st=Q.get(M);st.outputColorSpace=z.outputColorSpace,st.batching=z.batching,st.batchingColor=z.batchingColor,st.instancing=z.instancing,st.instancingColor=z.instancingColor,st.instancingMorph=z.instancingMorph,st.skinning=z.skinning,st.morphTargets=z.morphTargets,st.morphNormals=z.morphNormals,st.morphColors=z.morphColors,st.morphTargetsCount=z.morphTargetsCount,st.numClippingPlanes=z.numClippingPlanes,st.numIntersection=z.numClipIntersection,st.vertexAlphas=z.vertexAlphas,st.vertexTangents=z.vertexTangents,st.toneMapping=z.toneMapping}function ac(M,z){if(M.length===0)return null;if(M.length===1)return M[0].texture!==null?M[0]:null;S.setFromMatrixPosition(z.matrixWorld);for(let st=0,j=M.length;st<j;st++){const tt=M[st];if(tt.texture!==null&&tt.boundingBox.containsPoint(S))return tt}return null}function oc(M,z,st,j,tt){z.isScene!==!0&&(z=mt),at.resetTextureUnits();const Rt=z.fog,It=j.isMeshStandardMaterial||j.isMeshLambertMaterial||j.isMeshPhongMaterial?z.environment:null,wt=Z===null?B.outputColorSpace:Z.isXRRenderTarget===!0?Z.texture.colorSpace:te.workingColorSpace,Ut=j.isMeshStandardMaterial||j.isMeshLambertMaterial&&!j.envMap||j.isMeshPhongMaterial&&!j.envMap,zt=xt.get(j.envMap||It,Ut),Kt=j.vertexColors===!0&&!!st.attributes.color&&st.attributes.color.itemSize===4,Qt=!!st.attributes.tangent&&(!!j.normalMap||j.anisotropy>0),Ft=!!st.morphAttributes.position,se=!!st.morphAttributes.normal,ge=!!st.morphAttributes.color;let ue=an;j.toneMapped&&(Z===null||Z.isXRRenderTarget===!0)&&(ue=B.toneMapping);const le=st.morphAttributes.position||st.morphAttributes.normal||st.morphAttributes.color,Ee=le!==void 0?le.length:0,Lt=Q.get(j),Ce=A.state.lights;if(O===!0&&(I===!0||M!==rt)){const he=M===rt&&j.id===it;Gt.setState(j,M,he)}let ee=!1;j.version===Lt.__version?(Lt.needsLights&&Lt.lightsStateVersion!==Ce.state.version||Lt.outputColorSpace!==wt||tt.isBatchedMesh&&Lt.batching===!1||!tt.isBatchedMesh&&Lt.batching===!0||tt.isBatchedMesh&&Lt.batchingColor===!0&&tt._colorsTexture===null||tt.isBatchedMesh&&Lt.batchingColor===!1&&tt._colorsTexture!==null||tt.isInstancedMesh&&Lt.instancing===!1||!tt.isInstancedMesh&&Lt.instancing===!0||tt.isSkinnedMesh&&Lt.skinning===!1||!tt.isSkinnedMesh&&Lt.skinning===!0||tt.isInstancedMesh&&Lt.instancingColor===!0&&tt.instanceColor===null||tt.isInstancedMesh&&Lt.instancingColor===!1&&tt.instanceColor!==null||tt.isInstancedMesh&&Lt.instancingMorph===!0&&tt.morphTexture===null||tt.isInstancedMesh&&Lt.instancingMorph===!1&&tt.morphTexture!==null||Lt.envMap!==zt||j.fog===!0&&Lt.fog!==Rt||Lt.numClippingPlanes!==void 0&&(Lt.numClippingPlanes!==Gt.numPlanes||Lt.numIntersection!==Gt.numIntersection)||Lt.vertexAlphas!==Kt||Lt.vertexTangents!==Qt||Lt.morphTargets!==Ft||Lt.morphNormals!==se||Lt.morphColors!==ge||Lt.toneMapping!==ue||Lt.morphTargetsCount!==Ee||!!Lt.lightProbeGrid!=A.state.lightProbeGridArray.length>0)&&(ee=!0):(ee=!0,Lt.__version=j.version);let ze=Lt.currentProgram;ee===!0&&(ze=Zi(j,z,tt),q&&j.isNodeMaterial&&q.onUpdateProgram(j,ze,Lt));let Qe=!1,En=!1,Kn=!1;const oe=ze.getUniforms(),me=Lt.uniforms;if(g.useProgram(ze.program)&&(Qe=!0,En=!0,Kn=!0),j.id!==it&&(it=j.id,En=!0),Lt.needsLights){const he=ac(A.state.lightProbeGridArray,tt);Lt.lightProbeGrid!==he&&(Lt.lightProbeGrid=he,En=!0)}if(Qe||rt!==M){g.buffers.depth.getReversed()&&M.reversedDepth!==!0&&(M._reversedDepth=!0,M.updateProjectionMatrix()),oe.setValue(x,"projectionMatrix",M.projectionMatrix),oe.setValue(x,"viewMatrix",M.matrixWorldInverse);const Tn=oe.map.cameraPosition;Tn!==void 0&&Tn.setValue(x,$.setFromMatrixPosition(M.matrixWorld)),b.logarithmicDepthBuffer&&oe.setValue(x,"logDepthBufFC",2/(Math.log(M.far+1)/Math.LN2)),(j.isMeshPhongMaterial||j.isMeshToonMaterial||j.isMeshLambertMaterial||j.isMeshBasicMaterial||j.isMeshStandardMaterial||j.isShaderMaterial)&&oe.setValue(x,"isOrthographic",M.isOrthographicCamera===!0),rt!==M&&(rt=M,En=!0,Kn=!0)}if(Lt.needsLights&&(Ce.state.sunShadowMap.length>0&&oe.setValue(x,"sunShadowMap",Ce.state.sunShadowMap,at),Ce.state.directionalShadowMap.length>0&&oe.setValue(x,"directionalShadowMap",Ce.state.directionalShadowMap,at),Ce.state.spotShadowMap.length>0&&oe.setValue(x,"spotShadowMap",Ce.state.spotShadowMap,at),Ce.state.pointShadowMap.length>0&&oe.setValue(x,"pointShadowMap",Ce.state.pointShadowMap,at)),tt.isSkinnedMesh){oe.setOptional(x,tt,"bindMatrix"),oe.setOptional(x,tt,"bindMatrixInverse");const he=tt.skeleton;he&&(he.boneTexture===null&&he.computeBoneTexture(),oe.setValue(x,"boneTexture",he.boneTexture,at))}tt.isBatchedMesh&&(oe.setOptional(x,tt,"batchingTexture"),oe.setValue(x,"batchingTexture",tt._matricesTexture,at),oe.setOptional(x,tt,"batchingIdTexture"),oe.setValue(x,"batchingIdTexture",tt._indirectTexture,at),oe.setOptional(x,tt,"batchingColorTexture"),tt._colorsTexture!==null&&oe.setValue(x,"batchingColorTexture",tt._colorsTexture,at));const bn=st.morphAttributes;if((bn.position!==void 0||bn.normal!==void 0||bn.color!==void 0)&&V.update(tt,st,ze),(En||Lt.receiveShadow!==tt.receiveShadow)&&(Lt.receiveShadow=tt.receiveShadow,oe.setValue(x,"receiveShadow",tt.receiveShadow)),(j.isMeshStandardMaterial||j.isMeshLambertMaterial||j.isMeshPhongMaterial)&&j.envMap===null&&z.environment!==null&&(me.envMapIntensity.value=z.environmentIntensity),me.dfgLUT!==void 0&&(me.dfgLUT.value=mg()),En){if(oe.setValue(x,"toneMappingExposure",B.toneMappingExposure),Lt.needsLights&&lc(me,Kn),Rt&&j.fog===!0&&Ot.refreshFogUniforms(me,Rt),Ot.refreshMaterialUniforms(me,j,L,N,A.state.transmissionRenderTarget[M.id]),Lt.needsLights&&Lt.lightProbeGrid){const he=Lt.lightProbeGrid;me.probesSH.value=he.texture,me.probesMin.value.copy(he.boundingBox.min),me.probesMax.value.copy(he.boundingBox.max),me.probesResolution.value.copy(he.resolution)}ws.upload(x,Wa(Lt),me,at)}if(j.isShaderMaterial&&j.uniformsNeedUpdate===!0&&(ws.upload(x,Wa(Lt),me,at),j.uniformsNeedUpdate=!1),j.isSpriteMaterial&&oe.setValue(x,"center",tt.center),oe.setValue(x,"modelViewMatrix",tt.modelViewMatrix),oe.setValue(x,"normalMatrix",tt.normalMatrix),oe.setValue(x,"modelMatrix",tt.matrixWorld),j.uniformsGroups!==void 0){const he=j.uniformsGroups;for(let Tn=0,Jn=he.length;Tn<Jn;Tn++){const Ya=he[Tn];gt.update(Ya,ze),gt.bind(Ya,ze)}}return ze}function lc(M,z){M.ambientLightColor.needsUpdate=z,M.lightProbe.needsUpdate=z,M.sunLights.needsUpdate=z,M.sunLightShadows.needsUpdate=z,M.directionalLights.needsUpdate=z,M.directionalLightShadows.needsUpdate=z,M.pointLights.needsUpdate=z,M.pointLightShadows.needsUpdate=z,M.spotLights.needsUpdate=z,M.spotLightShadows.needsUpdate=z,M.rectAreaLights.needsUpdate=z,M.hemisphereLights.needsUpdate=z}function cc(M){return M.isMeshLambertMaterial||M.isMeshToonMaterial||M.isMeshPhongMaterial||M.isMeshStandardMaterial||M.isShadowMaterial||M.isShaderMaterial&&M.lights===!0}this.getActiveCubeFace=function(){return lt},this.getActiveMipmapLevel=function(){return K},this.getRenderTarget=function(){return Z},this.setRenderTargetTextures=function(M,z,st){const j=Q.get(M);j.__autoAllocateDepthBuffer=M.resolveDepthBuffer===!1,j.__autoAllocateDepthBuffer===!1&&(j.__useRenderToTexture=!1),Q.get(M.texture).__webglTexture=z,Q.get(M.depthTexture).__webglTexture=j.__autoAllocateDepthBuffer?void 0:st,j.__hasExternalTextures=!0},this.setRenderTargetFramebuffer=function(M,z){const st=Q.get(M);st.__webglFramebuffer=z,st.__useDefaultFramebuffer=z===void 0},this.setRenderTarget=function(M,z=0,st=0){Z=M,lt=z,K=st;let j=null,tt=!1,Rt=!1;if(M){const wt=Q.get(M);if(wt.__useDefaultFramebuffer!==void 0){g.bindFramebuffer(x.FRAMEBUFFER,wt.__webglFramebuffer),ht.copy(M.viewport),Dt.copy(M.scissor),Ct=M.scissorTest,g.viewport(ht),g.scissor(Dt),g.setScissorTest(Ct),it=-1;return}else if(wt.__webglFramebuffer===void 0)at.setupRenderTarget(M);else if(wt.__hasExternalTextures)at.rebindTextures(M,Q.get(M.texture).__webglTexture,Q.get(M.depthTexture).__webglTexture);else if(M.depthBuffer){const Kt=M.depthTexture;if(wt.__boundDepthTexture!==Kt){if(Kt!==null&&Q.has(Kt)&&(M.width!==Kt.image.width||M.height!==Kt.image.height))throw new Error("THREE.WebGLRenderer: Attached DepthTexture is initialized to the incorrect size.");at.setupDepthRenderbuffer(M)}}const Ut=M.texture;(Ut.isData3DTexture||Ut.isDataArrayTexture||Ut.isCompressedArrayTexture)&&(Rt=!0);const zt=Q.get(M).__webglFramebuffer;M.isWebGLCubeRenderTarget?(Array.isArray(zt[z])?j=zt[z][st]:j=zt[z],tt=!0):M.samples>0&&at.useMultisampledRTT(M)===!1?j=Q.get(M).__webglMultisampledFramebuffer:Array.isArray(zt)?j=zt[st]:j=zt,ht.copy(M.viewport),Dt.copy(M.scissor),Ct=M.scissorTest}else ht.copy(U).multiplyScalar(L).floor(),Dt.copy(et).multiplyScalar(L).floor(),Ct=_t;if(st!==0&&(j=nt),g.bindFramebuffer(x.FRAMEBUFFER,j)&&g.drawBuffers(M,j),g.viewport(ht),g.scissor(Dt),g.setScissorTest(Ct),tt){const wt=Q.get(M.texture);x.framebufferTexture2D(x.FRAMEBUFFER,x.COLOR_ATTACHMENT0,x.TEXTURE_CUBE_MAP_POSITIVE_X+z,wt.__webglTexture,st)}else if(Rt){const wt=z;for(let Ut=0;Ut<M.textures.length;Ut++){const zt=Q.get(M.textures[Ut]);x.framebufferTextureLayer(x.FRAMEBUFFER,x.COLOR_ATTACHMENT0+Ut,zt.__webglTexture,st,wt)}}else if(M!==null&&st!==0){const wt=Q.get(M.texture);x.framebufferTexture2D(x.FRAMEBUFFER,x.COLOR_ATTACHMENT0,x.TEXTURE_2D,wt.__webglTexture,st)}it=-1};function qa(M){const z=Q.get(M);return(z.__readFormat!==M.format||z.__readType!==M.type)&&(z.__readFormat=M.format,z.__readType=M.type,z.__formatReadable=b.textureFormatReadable(M.format),z.__typeReadable=b.textureTypeReadable(M.type)),z}this.readRenderTargetPixels=function(M,z,st,j,tt,Rt,It,wt=0){if(!(M&&M.isWebGLRenderTarget)){ne("WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let Ut=Q.get(M).__webglFramebuffer;if(M.isWebGLCubeRenderTarget&&It!==void 0&&(Ut=Ut[It]),Ut){g.bindFramebuffer(x.FRAMEBUFFER,Ut);try{const zt=M.textures[wt],Kt=zt.format,Qt=zt.type;M.textures.length>1&&x.readBuffer(x.COLOR_ATTACHMENT0+wt);const Ft=qa(zt);if(Ft.__formatReadable===!1){ne("WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}if(Ft.__typeReadable===!1){ne("WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}z>=0&&z<=M.width-j&&st>=0&&st<=M.height-tt&&x.readPixels(z,st,j,tt,bt.convert(Kt),bt.convert(Qt),Rt)}finally{const zt=Z!==null?Q.get(Z).__webglFramebuffer:null;g.bindFramebuffer(x.FRAMEBUFFER,zt)}}},this.readRenderTargetPixelsAsync=async function(M,z,st,j,tt,Rt,It,wt=0){if(!(M&&M.isWebGLRenderTarget))throw new Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let Ut=Q.get(M).__webglFramebuffer;if(M.isWebGLCubeRenderTarget&&It!==void 0&&(Ut=Ut[It]),Ut)if(z>=0&&z<=M.width-j&&st>=0&&st<=M.height-tt){g.bindFramebuffer(x.FRAMEBUFFER,Ut);const zt=M.textures[wt],Kt=zt.format,Qt=zt.type;M.textures.length>1&&x.readBuffer(x.COLOR_ATTACHMENT0+wt);const Ft=qa(zt);if(Ft.__formatReadable===!1)throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");if(Ft.__typeReadable===!1)throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");const se=x.createBuffer();x.bindBuffer(x.PIXEL_PACK_BUFFER,se),x.bufferData(x.PIXEL_PACK_BUFFER,Rt.byteLength,x.STREAM_READ),x.readPixels(z,st,j,tt,bt.convert(Kt),bt.convert(Qt),0),x.bindBuffer(x.PIXEL_PACK_BUFFER,null);const ge=Z!==null?Q.get(Z).__webglFramebuffer:null;g.bindFramebuffer(x.FRAMEBUFFER,ge);const ue=x.fenceSync(x.SYNC_GPU_COMMANDS_COMPLETE,0);return x.flush(),await qc(x,ue,4),x.bindBuffer(x.PIXEL_PACK_BUFFER,se),x.getBufferSubData(x.PIXEL_PACK_BUFFER,0,Rt),x.bindBuffer(x.PIXEL_PACK_BUFFER,null),x.deleteBuffer(se),x.deleteSync(ue),Rt}else throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.")},this.copyFramebufferToTexture=function(M,z=null,st=0){const j=Math.pow(2,-st),tt=Math.floor(M.image.width*j),Rt=Math.floor(M.image.height*j),It=z!==null?z.x:0,wt=z!==null?z.y:0;at.setTexture2D(M,0),x.copyTexSubImage2D(x.TEXTURE_2D,st,0,0,It,wt,tt,Rt),g.unbindTexture()},this.copyTextureToTexture=function(M,z,st=null,j=null,tt=0,Rt=0){let It,wt,Ut,zt,Kt,Qt,Ft,se,ge;const ue=M.isCompressedTexture?M.mipmaps[Rt]:M.image;if(st!==null)It=st.max.x-st.min.x,wt=st.max.y-st.min.y,Ut=st.isBox3?st.max.z-st.min.z:1,zt=st.min.x,Kt=st.min.y,Qt=st.isBox3?st.min.z:0;else{const me=Math.pow(2,-tt);It=Math.floor(ue.width*me),wt=Math.floor(ue.height*me),M.isDataArrayTexture?Ut=ue.depth:M.isData3DTexture?Ut=Math.floor(ue.depth*me):Ut=1,zt=0,Kt=0,Qt=0}j!==null?(Ft=j.x,se=j.y,ge=j.z):(Ft=0,se=0,ge=0);const le=bt.convert(z.format),Ee=bt.convert(z.type);let Lt;z.isData3DTexture?(at.setTexture3D(z,0),Lt=x.TEXTURE_3D):z.isDataArrayTexture||z.isCompressedArrayTexture?(at.setTexture2DArray(z,0),Lt=x.TEXTURE_2D_ARRAY):(at.setTexture2D(z,0),Lt=x.TEXTURE_2D),g.activeTexture(x.TEXTURE0),g.pixelStorei(x.UNPACK_FLIP_Y_WEBGL,z.flipY),g.pixelStorei(x.UNPACK_PREMULTIPLY_ALPHA_WEBGL,z.premultiplyAlpha),g.pixelStorei(x.UNPACK_ALIGNMENT,z.unpackAlignment);const Ce=g.getParameter(x.UNPACK_ROW_LENGTH),ee=g.getParameter(x.UNPACK_IMAGE_HEIGHT),ze=g.getParameter(x.UNPACK_SKIP_PIXELS),Qe=g.getParameter(x.UNPACK_SKIP_ROWS),En=g.getParameter(x.UNPACK_SKIP_IMAGES);g.pixelStorei(x.UNPACK_ROW_LENGTH,ue.width),g.pixelStorei(x.UNPACK_IMAGE_HEIGHT,ue.height),g.pixelStorei(x.UNPACK_SKIP_PIXELS,zt),g.pixelStorei(x.UNPACK_SKIP_ROWS,Kt),g.pixelStorei(x.UNPACK_SKIP_IMAGES,Qt);const Kn=M.isDataArrayTexture||M.isData3DTexture,oe=z.isDataArrayTexture||z.isData3DTexture;if(M.isDepthTexture){const me=Q.get(M),bn=Q.get(z),he=Q.get(me.__renderTarget),Tn=Q.get(bn.__renderTarget);g.bindFramebuffer(x.READ_FRAMEBUFFER,he.__webglFramebuffer),g.bindFramebuffer(x.DRAW_FRAMEBUFFER,Tn.__webglFramebuffer);for(let Jn=0;Jn<Ut;Jn++)Kn&&(x.framebufferTextureLayer(x.READ_FRAMEBUFFER,x.COLOR_ATTACHMENT0,Q.get(M).__webglTexture,tt,Qt+Jn),x.framebufferTextureLayer(x.DRAW_FRAMEBUFFER,x.COLOR_ATTACHMENT0,Q.get(z).__webglTexture,Rt,ge+Jn)),x.blitFramebuffer(zt,Kt,It,wt,Ft,se,It,wt,x.DEPTH_BUFFER_BIT,x.NEAREST);g.bindFramebuffer(x.READ_FRAMEBUFFER,null),g.bindFramebuffer(x.DRAW_FRAMEBUFFER,null)}else if(tt!==0||M.isRenderTargetTexture||Q.has(M)){const me=Q.get(M),bn=Q.get(z);g.bindFramebuffer(x.READ_FRAMEBUFFER,G),g.bindFramebuffer(x.DRAW_FRAMEBUFFER,J);for(let he=0;he<Ut;he++)Kn?x.framebufferTextureLayer(x.READ_FRAMEBUFFER,x.COLOR_ATTACHMENT0,me.__webglTexture,tt,Qt+he):x.framebufferTexture2D(x.READ_FRAMEBUFFER,x.COLOR_ATTACHMENT0,x.TEXTURE_2D,me.__webglTexture,tt),oe?x.framebufferTextureLayer(x.DRAW_FRAMEBUFFER,x.COLOR_ATTACHMENT0,bn.__webglTexture,Rt,ge+he):x.framebufferTexture2D(x.DRAW_FRAMEBUFFER,x.COLOR_ATTACHMENT0,x.TEXTURE_2D,bn.__webglTexture,Rt),tt!==0?x.blitFramebuffer(zt,Kt,It,wt,Ft,se,It,wt,x.COLOR_BUFFER_BIT,x.NEAREST):oe?x.copyTexSubImage3D(Lt,Rt,Ft,se,ge+he,zt,Kt,It,wt):x.copyTexSubImage2D(Lt,Rt,Ft,se,zt,Kt,It,wt);g.bindFramebuffer(x.READ_FRAMEBUFFER,null),g.bindFramebuffer(x.DRAW_FRAMEBUFFER,null)}else oe?M.isDataTexture||M.isData3DTexture?x.texSubImage3D(Lt,Rt,Ft,se,ge,It,wt,Ut,le,Ee,ue.data):z.isCompressedArrayTexture?x.compressedTexSubImage3D(Lt,Rt,Ft,se,ge,It,wt,Ut,le,ue.data):x.texSubImage3D(Lt,Rt,Ft,se,ge,It,wt,Ut,le,Ee,ue):M.isDataTexture?x.texSubImage2D(x.TEXTURE_2D,Rt,Ft,se,It,wt,le,Ee,ue.data):M.isCompressedTexture?x.compressedTexSubImage2D(x.TEXTURE_2D,Rt,Ft,se,ue.width,ue.height,le,ue.data):x.texSubImage2D(x.TEXTURE_2D,Rt,Ft,se,It,wt,le,Ee,ue);g.pixelStorei(x.UNPACK_ROW_LENGTH,Ce),g.pixelStorei(x.UNPACK_IMAGE_HEIGHT,ee),g.pixelStorei(x.UNPACK_SKIP_PIXELS,ze),g.pixelStorei(x.UNPACK_SKIP_ROWS,Qe),g.pixelStorei(x.UNPACK_SKIP_IMAGES,En),Rt===0&&z.generateMipmaps&&x.generateMipmap(Lt),g.unbindTexture()},this.initRenderTarget=function(M){Q.get(M).__webglFramebuffer===void 0&&at.setupRenderTarget(M)},this.initTexture=function(M){M.isCubeTexture?at.setTextureCube(M,0):M.isData3DTexture?at.setTexture3D(M,0):M.isDataArrayTexture||M.isCompressedArrayTexture?at.setTexture2DArray(M,0):at.setTexture2D(M,0),g.unbindTexture()},this.resetState=function(){lt=0,K=0,Z=null,g.reset(),Pt.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return rn}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(t){this._outputColorSpace=t;const e=this.getContext();e.drawingBufferColorSpace=te._getDrawingBufferColorSpace(t),e.unpackColorSpace=te._getUnpackColorSpace()}}const Hi=Oe;class Fs extends Pa{constructor(t){super(t),this.defaultDPI=90,this.defaultUnit="px"}load(t,e,n,s){const r=this,a=new uu(r.manager);a.setPath(r.path),a.setRequestHeader(r.requestHeader),a.setWithCredentials(r.withCredentials),a.load(t,function(o){try{e(r.parse(o))}catch(c){s?s(c):console.error(c),r.manager.itemError(t)}},n,s)}parse(t){const e=this;function n(L,C){if(L.nodeType!==1)return;L.hasAttribute("filter")&&console.warn("THREE.SVGLoader: Filters are not supported.");const T=w(L);let U=!1,et=null;switch(L.nodeName){case"svg":C=y(L,C);break;case"style":r(L);break;case"g":C=y(L,C);break;case"path":C=y(L,C),L.hasAttribute("d")&&(et=s(L));break;case"rect":C=y(L,C),et=c(L);break;case"polygon":C=y(L,C),et=l(L);break;case"polyline":C=y(L,C),et=u(L);break;case"circle":C=y(L,C),et=f(L);break;case"ellipse":C=y(L,C),et=h(L);break;case"line":C=y(L,C),et=p(L);break;case"defs":U=!0;break;case"use":C=y(L,C);const O=(L.getAttributeNS("http://www.w3.org/1999/xlink","href")||"").substring(1),I=L.viewportElement.getElementById(O);I?n(I,C):console.warn("SVGLoader: 'use node' references non-existent node id: "+O);break}if(et){C.fill!==void 0&&C.fill!=="none"&&!C.fill.startsWith("url")&&et.color.setStyle(C.fill,Hi),v(et,Xt),J.push(et);const E=Object.assign({},C);E.strokeWidth=C.strokeWidth*nt(Xt),et.userData={node:L,style:E,transform:Xt.clone(),gradients:K}}const _t=L.childNodes;for(let E=0;E<_t.length;E++){const O=_t[E];U&&O.nodeName!=="style"&&O.nodeName!=="defs"||n(O,C)}T&&(Z.pop(),Z.length>0?Xt.copy(Z[Z.length-1]):Xt.identity())}function s(L){const C=new Vn,T=new dt,U=new dt,et=new dt;let _t=!0,E=!1;const O=L.getAttribute("d");if(O===""||O==="none")return null;const I=O.match(/[a-df-z][^a-df-z]*/ig);for(let Y=0,$=I.length;Y<$;Y++){const ot=I[Y],mt=ot.charAt(0),pt=ot.slice(1).trim();_t===!0&&(E=!0,_t=!1);let W;switch(mt){case"M":W=d(pt);for(let x=0,At=W.length;x<At;x+=2)T.x=W[x+0],T.y=W[x+1],U.x=T.x,U.y=T.y,x===0?C.moveTo(T.x,T.y):C.lineTo(T.x,T.y),x===0&&et.copy(T);break;case"H":W=d(pt);for(let x=0,At=W.length;x<At;x++)T.x=W[x],U.x=T.x,U.y=T.y,C.lineTo(T.x,T.y),x===0&&E===!0&&et.copy(T);break;case"V":W=d(pt);for(let x=0,At=W.length;x<At;x++)T.y=W[x],U.x=T.x,U.y=T.y,C.lineTo(T.x,T.y),x===0&&E===!0&&et.copy(T);break;case"L":W=d(pt);for(let x=0,At=W.length;x<At;x+=2)T.x=W[x+0],T.y=W[x+1],U.x=T.x,U.y=T.y,C.lineTo(T.x,T.y),x===0&&E===!0&&et.copy(T);break;case"C":W=d(pt);for(let x=0,At=W.length;x<At;x+=6)C.bezierCurveTo(W[x+0],W[x+1],W[x+2],W[x+3],W[x+4],W[x+5]),U.x=W[x+2],U.y=W[x+3],T.x=W[x+4],T.y=W[x+5],x===0&&E===!0&&et.copy(T);break;case"S":W=d(pt);for(let x=0,At=W.length;x<At;x+=4)C.bezierCurveTo(m(T.x,U.x),m(T.y,U.y),W[x+0],W[x+1],W[x+2],W[x+3]),U.x=W[x+0],U.y=W[x+1],T.x=W[x+2],T.y=W[x+3],x===0&&E===!0&&et.copy(T);break;case"Q":W=d(pt);for(let x=0,At=W.length;x<At;x+=4)C.quadraticCurveTo(W[x+0],W[x+1],W[x+2],W[x+3]),U.x=W[x+0],U.y=W[x+1],T.x=W[x+2],T.y=W[x+3],x===0&&E===!0&&et.copy(T);break;case"T":W=d(pt);for(let x=0,At=W.length;x<At;x+=2){const Nt=m(T.x,U.x),b=m(T.y,U.y);C.quadraticCurveTo(Nt,b,W[x+0],W[x+1]),U.x=Nt,U.y=b,T.x=W[x+0],T.y=W[x+1],x===0&&E===!0&&et.copy(T)}break;case"A":W=d(pt,[3,4],7);for(let x=0,At=W.length;x<At;x+=7){if(W[x+5]==T.x&&W[x+6]==T.y)continue;const Nt=T.clone();T.x=W[x+5],T.y=W[x+6],U.x=T.x,U.y=T.y,a(C,W[x],W[x+1],W[x+2],W[x+3],W[x+4],Nt,T),x===0&&E===!0&&et.copy(T)}break;case"m":W=d(pt);for(let x=0,At=W.length;x<At;x+=2)T.x+=W[x+0],T.y+=W[x+1],U.x=T.x,U.y=T.y,x===0?C.moveTo(T.x,T.y):C.lineTo(T.x,T.y),x===0&&et.copy(T);break;case"h":W=d(pt);for(let x=0,At=W.length;x<At;x++)T.x+=W[x],U.x=T.x,U.y=T.y,C.lineTo(T.x,T.y),x===0&&E===!0&&et.copy(T);break;case"v":W=d(pt);for(let x=0,At=W.length;x<At;x++)T.y+=W[x],U.x=T.x,U.y=T.y,C.lineTo(T.x,T.y),x===0&&E===!0&&et.copy(T);break;case"l":W=d(pt);for(let x=0,At=W.length;x<At;x+=2)T.x+=W[x+0],T.y+=W[x+1],U.x=T.x,U.y=T.y,C.lineTo(T.x,T.y),x===0&&E===!0&&et.copy(T);break;case"c":W=d(pt);for(let x=0,At=W.length;x<At;x+=6)C.bezierCurveTo(T.x+W[x+0],T.y+W[x+1],T.x+W[x+2],T.y+W[x+3],T.x+W[x+4],T.y+W[x+5]),U.x=T.x+W[x+2],U.y=T.y+W[x+3],T.x+=W[x+4],T.y+=W[x+5],x===0&&E===!0&&et.copy(T);break;case"s":W=d(pt);for(let x=0,At=W.length;x<At;x+=4)C.bezierCurveTo(m(T.x,U.x),m(T.y,U.y),T.x+W[x+0],T.y+W[x+1],T.x+W[x+2],T.y+W[x+3]),U.x=T.x+W[x+0],U.y=T.y+W[x+1],T.x+=W[x+2],T.y+=W[x+3],x===0&&E===!0&&et.copy(T);break;case"q":W=d(pt);for(let x=0,At=W.length;x<At;x+=4)C.quadraticCurveTo(T.x+W[x+0],T.y+W[x+1],T.x+W[x+2],T.y+W[x+3]),U.x=T.x+W[x+0],U.y=T.y+W[x+1],T.x+=W[x+2],T.y+=W[x+3],x===0&&E===!0&&et.copy(T);break;case"t":W=d(pt);for(let x=0,At=W.length;x<At;x+=2){const Nt=m(T.x,U.x),b=m(T.y,U.y);C.quadraticCurveTo(Nt,b,T.x+W[x+0],T.y+W[x+1]),U.x=Nt,U.y=b,T.x=T.x+W[x+0],T.y=T.y+W[x+1],x===0&&E===!0&&et.copy(T)}break;case"a":W=d(pt,[3,4],7);for(let x=0,At=W.length;x<At;x+=7){if(W[x+5]==0&&W[x+6]==0)continue;const Nt=T.clone();T.x+=W[x+5],T.y+=W[x+6],U.x=T.x,U.y=T.y,a(C,W[x],W[x+1],W[x+2],W[x+3],W[x+4],Nt,T),x===0&&E===!0&&et.copy(T)}break;case"Z":case"z":C.currentPath.autoClose=!0,C.currentPath.curves.length>0&&(T.copy(et),C.currentPath.currentPoint.copy(T),_t=!0);break;default:console.warn(ot)}E=!1}return C}function r(L){if(!(!L.sheet||!L.sheet.cssRules||!L.sheet.cssRules.length))for(let C=0;C<L.sheet.cssRules.length;C++){const T=L.sheet.cssRules[C];if(T.type!==1)continue;const U=T.selectorText.split(/,/gm).filter(Boolean).map(et=>et.trim());for(let et=0;et<U.length;et++){const _t=Object.fromEntries(Object.entries(T.style).filter(([,E])=>E!==""));lt[U[et]]=Object.assign(lt[U[et]]||{},_t)}}}function a(L,C,T,U,et,_t,E,O){if(C==0||T==0){L.lineTo(O.x,O.y);return}U=U*Math.PI/180,C=Math.abs(C),T=Math.abs(T);const I=(E.x-O.x)/2,Y=(E.y-O.y)/2,$=Math.cos(U)*I+Math.sin(U)*Y,ot=-Math.sin(U)*I+Math.cos(U)*Y;let mt=C*C,pt=T*T;const W=$*$,x=ot*ot,At=W/mt+x/pt;if(At>1){const ut=Math.sqrt(At);C=ut*C,T=ut*T,mt=C*C,pt=T*T}const Nt=mt*x+pt*W,b=(mt*pt-Nt)/Nt;let g=Math.sqrt(Math.max(0,b));et===_t&&(g=-g);const k=g*C*ot/T,Q=-g*T*$/C,at=Math.cos(U)*k-Math.sin(U)*Q+(E.x+O.x)/2,xt=Math.sin(U)*k+Math.cos(U)*Q+(E.y+O.y)/2,vt=o(1,0,($-k)/C,(ot-Q)/T),ct=o(($-k)/C,(ot-Q)/T,(-$-k)/C,(-ot-Q)/T)%(Math.PI*2);L.currentPath.absellipse(at,xt,C,T,vt,vt+ct,_t===0,U)}function o(L,C,T,U){const et=L*T+C*U,_t=Math.sqrt(L*L+C*C)*Math.sqrt(T*T+U*U);let E=Math.acos(Math.max(-1,Math.min(1,et/_t)));return L*U-C*T<0&&(E=-E),E}function c(L){const C=S(L.getAttribute("x")||0),T=S(L.getAttribute("y")||0),U=S(L.getAttribute("rx")||L.getAttribute("ry")||0),et=S(L.getAttribute("ry")||L.getAttribute("rx")||0),_t=S(L.getAttribute("width")),E=S(L.getAttribute("height")),O=1-.551915024494,I=new Vn;return I.moveTo(C+U,T),I.lineTo(C+_t-U,T),(U!==0||et!==0)&&I.bezierCurveTo(C+_t-U*O,T,C+_t,T+et*O,C+_t,T+et),I.lineTo(C+_t,T+E-et),(U!==0||et!==0)&&I.bezierCurveTo(C+_t,T+E-et*O,C+_t-U*O,T+E,C+_t-U,T+E),I.lineTo(C+U,T+E),(U!==0||et!==0)&&I.bezierCurveTo(C+U*O,T+E,C,T+E-et*O,C,T+E-et),I.lineTo(C,T+et),(U!==0||et!==0)&&I.bezierCurveTo(C,T+et*O,C+U*O,T,C+U,T),I}function l(L){function C(_t,E,O){const I=S(E),Y=S(O);et===0?U.moveTo(I,Y):U.lineTo(I,Y),et++}const T=/([+-]?\d*\.?\d+(?:e[+-]?\d+)?)(?:,|\s)([+-]?\d*\.?\d+(?:e[+-]?\d+)?)/g,U=new Vn;let et=0;return L.getAttribute("points").replace(T,C),U.currentPath.autoClose=!0,U}function u(L){function C(_t,E,O){const I=S(E),Y=S(O);et===0?U.moveTo(I,Y):U.lineTo(I,Y),et++}const T=/([+-]?\d*\.?\d+(?:e[+-]?\d+)?)(?:,|\s)([+-]?\d*\.?\d+(?:e[+-]?\d+)?)/g,U=new Vn;let et=0;return L.getAttribute("points").replace(T,C),U.currentPath.autoClose=!1,U}function f(L){const C=S(L.getAttribute("cx")||0),T=S(L.getAttribute("cy")||0),U=S(L.getAttribute("r")||0),et=new _i;et.absarc(C,T,U,0,Math.PI*2);const _t=new Vn;return _t.subPaths.push(et),_t}function h(L){const C=S(L.getAttribute("cx")||0),T=S(L.getAttribute("cy")||0),U=S(L.getAttribute("rx")||0),et=S(L.getAttribute("ry")||0),_t=new _i;_t.absellipse(C,T,U,et,0,Math.PI*2);const E=new Vn;return E.subPaths.push(_t),E}function p(L){const C=S(L.getAttribute("x1")||0),T=S(L.getAttribute("y1")||0),U=S(L.getAttribute("x2")||0),et=S(L.getAttribute("y2")||0),_t=new Vn;return _t.moveTo(C,T),_t.lineTo(U,et),_t.currentPath.autoClose=!1,_t}function _(L){const C="http://www.w3.org/1999/xlink",T=L.querySelectorAll("linearGradient, radialGradient"),U=["x1","y1","x2","y2","cx","cy","r","fx","fy","gradientUnits","gradientTransform","spreadMethod"],et={};for(const E of T){const O=E.getAttribute("id");if(!O)continue;const I={type:E.nodeName==="radialGradient"?"radialGradient":"linearGradient",attrs:{},stops:null,href:null},Y=E.getAttributeNS(C,"href")||E.getAttribute("href")||"";Y.startsWith("#")&&(I.href=Y.substring(1));for(const ot of U)E.hasAttribute(ot)&&(I.attrs[ot]=E.getAttribute(ot));const $=E.querySelectorAll("stop");if($.length>0){I.stops=[];for(const ot of $){let mt=ot.getAttribute("stop-color");!mt&&ot.style&&(mt=ot.style["stop-color"]),mt||(mt="#000");let pt=ot.getAttribute("stop-opacity");(pt===null||pt==="")&&ot.style&&(pt=ot.style["stop-opacity"]),pt=pt===null||pt===""||pt===void 0?1:Math.max(0,Math.min(1,parseFloat(pt)));const W=Math.max(0,Math.min(1,parseFloat(ot.getAttribute("offset")||"0")));I.stops.push({offset:W,color:mt,opacity:pt})}}et[O]=I}function _t(E,O){const I=et[E];if(!I||O.has(E))return I;if(O.add(E),I.href&&et[I.href]){const Y=_t(I.href,O);if(Y){I.stops||(I.stops=Y.stops);for(const $ in Y.attrs)$ in I.attrs||(I.attrs[$]=Y.attrs[$])}}return I}for(const E in et)_t(E,new Set);for(const E in et){let ot=function(mt){return typeof mt!="string"?0:mt.endsWith("%")?parseFloat(mt)/100:S(mt)};const O=et[E],I=O.attrs,Y=I.gradientUnits==="userSpaceOnUse"?"userSpaceOnUse":"objectBoundingBox",$={type:O.type,gradientUnits:Y,spreadMethod:I.spreadMethod==="reflect"||I.spreadMethod==="repeat"?I.spreadMethod:"pad",gradientTransform:null,stops:(O.stops||[]).slice().sort((mt,pt)=>mt.offset-pt.offset)};if(I.gradientTransform&&($.gradientTransform=new kt,F(I.gradientTransform,$.gradientTransform)),O.type==="linearGradient")$.x1=I.x1!==void 0?ot(I.x1):0,$.y1=I.y1!==void 0?ot(I.y1):0,$.x2=I.x2!==void 0?ot(I.x2):Y==="objectBoundingBox"?1:0,$.y2=I.y2!==void 0?ot(I.y2):0;else{const mt=Y==="objectBoundingBox"?.5:0,pt=Y==="objectBoundingBox"?.5:0;$.cx=I.cx!==void 0?ot(I.cx):mt,$.cy=I.cy!==void 0?ot(I.cy):mt,$.r=I.r!==void 0?ot(I.r):pt,$.fx=I.fx!==void 0?ot(I.fx):$.cx,$.fy=I.fy!==void 0?ot(I.fy):$.cy}K[E]=$}}function y(L,C){C=Object.assign({},C);let T={};if(L.hasAttribute("class")){const E=L.getAttribute("class").split(/\s/).filter(Boolean).map(O=>O.trim());for(let O=0;O<E.length;O++)T=Object.assign(T,lt["."+E[O]])}L.hasAttribute("id")&&(T=Object.assign(T,lt["#"+L.getAttribute("id")]));function U(E,O,I){I===void 0&&(I=function($){return $}),L.hasAttribute(E)&&(C[O]=I(L.getAttribute(E))),T[O]&&(C[O]=I(T[O])),L.style&&L.style[E]!==""&&(C[O]=I(L.style[E]))}function et(E){return Math.max(0,Math.min(1,S(E)))}function _t(E){return Math.max(0,S(E))}return U("fill","fill"),U("fill-opacity","fillOpacity",et),U("fill-rule","fillRule"),U("opacity","opacity",et),U("stroke","stroke"),U("stroke-opacity","strokeOpacity",et),U("stroke-width","strokeWidth",_t),U("stroke-linejoin","strokeLineJoin"),U("stroke-linecap","strokeLineCap"),U("stroke-miterlimit","strokeMiterLimit",_t),U("visibility","visibility"),C}function m(L,C){return L-(C-L)}function d(L,C,T){if(typeof L!="string")throw new TypeError("Invalid input: "+typeof L);const U={WHITESPACE:/[ \t\r\n]/,DIGIT:/[\d]/,SIGN:/[-+]/,POINT:/\./,COMMA:/,/,EXP:/e/i,FLAGS:/[01]/},et=0,_t=1,E=2,O=3;let I=et,Y=!0,$="",ot="";const mt=[];function pt(Nt,b,g){const k=new SyntaxError('Unexpected character "'+Nt+'" at index '+b+".");throw k.partial=g,k}function W(){$!==""&&(ot===""?mt.push(Number($)):mt.push(Number($)*Math.pow(10,Number(ot)))),$="",ot=""}let x;const At=L.length;for(let Nt=0;Nt<At;Nt++){if(x=L[Nt],Array.isArray(C)&&C.includes(mt.length%T)&&U.FLAGS.test(x)){I=_t,$=x,W();continue}if(I===et){if(U.WHITESPACE.test(x))continue;if(U.DIGIT.test(x)||U.SIGN.test(x)){I=_t,$=x;continue}if(U.POINT.test(x)){I=E,$=x;continue}U.COMMA.test(x)&&(Y&&pt(x,Nt,mt),Y=!0)}if(I===_t){if(U.DIGIT.test(x)){$+=x;continue}if(U.POINT.test(x)){$+=x,I=E;continue}if(U.EXP.test(x)){I=O;continue}U.SIGN.test(x)&&$.length===1&&U.SIGN.test($[0])&&pt(x,Nt,mt)}if(I===E){if(U.DIGIT.test(x)){$+=x;continue}if(U.EXP.test(x)){I=O;continue}U.POINT.test(x)&&$[$.length-1]==="."&&pt(x,Nt,mt)}if(I===O){if(U.DIGIT.test(x)){ot+=x;continue}if(U.SIGN.test(x)){if(ot===""){ot+=x;continue}ot.length===1&&U.SIGN.test(ot)&&pt(x,Nt,mt)}}U.WHITESPACE.test(x)?(W(),I=et,Y=!1):U.COMMA.test(x)?(W(),I=et,Y=!0):U.SIGN.test(x)?(W(),I=_t,$=x):U.POINT.test(x)?(W(),I=E,$=x):pt(x,Nt,mt)}return W(),mt}const P=["mm","cm","in","pt","pc","px"],D={mm:{mm:1,cm:.1,in:1/25.4,pt:72/25.4,pc:6/25.4,px:-1},cm:{mm:10,cm:1,in:1/2.54,pt:72/2.54,pc:6/2.54,px:-1},in:{mm:25.4,cm:2.54,in:1,pt:72,pc:6,px:-1},pt:{mm:25.4/72,cm:2.54/72,in:1/72,pt:1,pc:6/72,px:-1},pc:{mm:25.4/6,cm:2.54/6,in:1/6,pt:72/6,pc:1,px:-1},px:{px:1}};function S(L){let C="px";if(typeof L=="string"||L instanceof String)for(let U=0,et=P.length;U<et;U++){const _t=P[U];if(L.endsWith(_t)){C=_t,L=L.substring(0,L.length-_t.length);break}}let T;return C==="px"&&e.defaultUnit!=="px"?T=D.in[e.defaultUnit]/e.defaultDPI:(T=D[C][e.defaultUnit],T<0&&(T=D[C].in*e.defaultDPI)),T*parseFloat(L)}function w(L){if(!(L.hasAttribute("transform")||L.nodeName==="use"&&(L.hasAttribute("x")||L.hasAttribute("y"))))return null;const C=A(L);return Z.length>0&&C.premultiply(Z[Z.length-1]),Xt.copy(C),Z.push(C),C}function A(L){const C=new kt;if(L.nodeName==="use"&&(L.hasAttribute("x")||L.hasAttribute("y"))){const T=S(L.getAttribute("x")||0),U=S(L.getAttribute("y")||0);C.makeTranslation(T,U)}return L.hasAttribute("transform")&&F(L.getAttribute("transform"),C),C}function F(L,C){const T=it,U=L.split(")");for(let et=U.length-1;et>=0;et--){const _t=U[et].trim();if(_t==="")continue;const E=_t.indexOf("("),O=_t.length;if(E>0&&E<O){const I=_t.slice(0,E),Y=d(_t.slice(E+1));switch(T.identity(),I){case"translate":if(Y.length>=1){const $=Y[0];let ot=0;Y.length>=2&&(ot=Y[1]),T.makeTranslation($,ot)}break;case"rotate":if(Y.length>=1){let $=0,ot=0,mt=0;$=Y[0]*Math.PI/180,Y.length>=3&&(ot=Y[1],mt=Y[2]),rt.makeTranslation(-ot,-mt),ht.makeRotation($),Dt.multiplyMatrices(ht,rt),rt.makeTranslation(ot,mt),T.multiplyMatrices(rt,Dt)}break;case"scale":if(Y.length>=1){const $=Y[0];let ot=$;Y.length>=2&&(ot=Y[1]),T.makeScale($,ot)}break;case"skewX":Y.length===1&&T.set(1,Math.tan(Y[0]*Math.PI/180),0,0,1,0,0,0,1);break;case"skewY":Y.length===1&&T.set(1,0,0,Math.tan(Y[0]*Math.PI/180),1,0,0,0,1);break;case"matrix":Y.length===6&&T.set(Y[0],Y[2],Y[4],Y[1],Y[3],Y[5],0,0,1);break}C.premultiply(T)}}return C}function v(L,C){function T(E){qt.set(E.x,E.y,1).applyMatrix3(C),E.set(qt.x,qt.y)}function U(E){const O=E.xRadius,I=E.yRadius,Y=Math.cos(E.aRotation),$=Math.sin(E.aRotation),ot=new H(O*Y,O*$,0),mt=new H(-I*$,I*Y,0),pt=ot.applyMatrix3(C),W=mt.applyMatrix3(C),x=it.set(pt.x,W.x,0,pt.y,W.y,0,0,0,1),At=rt.copy(x).invert(),g=ht.copy(At).transpose().multiply(At).elements,k=G(g[0],g[1],g[4]),Q=Math.sqrt(k.rt1),at=Math.sqrt(k.rt2);if(E.xRadius=1/Q,E.yRadius=1/at,E.aRotation=Math.atan2(k.sn,k.cs),!((E.aEndAngle-E.aStartAngle)%(2*Math.PI)<Number.EPSILON)){const vt=rt.set(Q,0,0,0,at,0,0,0,1),ct=ht.set(k.cs,k.sn,0,-k.sn,k.cs,0,0,0,1),ut=vt.multiply(ct).multiply(x),St=Ot=>{const{x:yt,y:Mt}=new H(Math.cos(Ot),Math.sin(Ot),0).applyMatrix3(ut);return Math.atan2(Mt,yt)};E.aStartAngle=St(E.aStartAngle),E.aEndAngle=St(E.aEndAngle),R(C)&&(E.aClockwise=!E.aClockwise)}}function et(E){const O=X(C),I=q(C);E.xRadius*=O,E.yRadius*=I;const Y=O>Number.EPSILON?Math.atan2(C.elements[1],C.elements[0]):Math.atan2(-C.elements[3],C.elements[4]);E.aRotation+=Y,R(C)&&(E.aStartAngle*=-1,E.aEndAngle*=-1,E.aClockwise=!E.aClockwise)}const _t=L.subPaths;for(let E=0,O=_t.length;E<O;E++){const Y=_t[E].curves;for(let $=0;$<Y.length;$++){const ot=Y[$];ot.isLineCurve?(T(ot.v1),T(ot.v2)):ot.isCubicBezierCurve?(T(ot.v0),T(ot.v1),T(ot.v2),T(ot.v3)):ot.isQuadraticBezierCurve?(T(ot.v0),T(ot.v1),T(ot.v2)):ot.isEllipseCurve&&(Ct.set(ot.aX,ot.aY),T(Ct),ot.aX=Ct.x,ot.aY=Ct.y,B(C)?U(ot):et(ot))}}}function R(L){const C=L.elements;return C[0]*C[4]-C[1]*C[3]<0}function B(L){const C=L.elements,T=C[0]*C[3]+C[1]*C[4];if(T===0)return!1;const U=X(L),et=q(L);return Math.abs(T/(U*et))>Number.EPSILON}function X(L){const C=L.elements;return Math.sqrt(C[0]*C[0]+C[1]*C[1])}function q(L){const C=L.elements;return Math.sqrt(C[3]*C[3]+C[4]*C[4])}function nt(L){const C=L.elements,T=C[0]*C[4]-C[1]*C[3];return Math.sqrt(Math.abs(T))}function G(L,C,T){let U,et,_t,E,O;const I=L+T,Y=L-T,$=Math.sqrt(Y*Y+4*C*C);return I>0?(U=.5*(I+$),O=1/U,et=L*O*T-C*O*C):I<0?et=.5*(I-$):(U=.5*$,et=-.5*$),Y>0?_t=Y+$:_t=Y-$,Math.abs(_t)>2*Math.abs(C)?(O=-2*C/_t,E=1/Math.sqrt(1+O*O),_t=O*E):Math.abs(C)===0?(_t=1,E=0):(O=-.5*_t/C,_t=1/Math.sqrt(1+O*O),E=O*_t),Y>0&&(O=_t,_t=-E,E=O),{rt1:U,rt2:et,cs:_t,sn:E}}const J=[],lt={},K={},Z=[],it=new kt,rt=new kt,ht=new kt,Dt=new kt,Ct=new dt,qt=new H,Xt=new kt,Zt=new DOMParser().parseFromString(t,"image/svg+xml");return _(Zt),n(Zt.documentElement,{fill:"#000",fillOpacity:1,strokeOpacity:1,strokeWidth:1,strokeLineJoin:"miter",strokeLineCap:"butt",strokeMiterLimit:4}),{paths:J,gradients:K,xml:Zt.documentElement}}static createFillMaterial(t){const e=t.userData.style;if(e.fill===void 0||e.fill==="none")return null;const n=t.color;let s=null;const r=nl.exec(e.fill);if(r){const o=t.userData.gradients&&t.userData.gradients[r[1]];s=_g(o,t)}const a=new Us({opacity:e.fillOpacity*(e.opacity||1),transparent:!0,side:Ye,depthWrite:!1});return s!==null?a.map=s:a.color=n,a}static createStrokeMaterial(t){const e=t.userData.style;return e.stroke===void 0||e.stroke==="none"?null:(nl.test(e.stroke)&&console.warn("THREE.SVGLoader: Gradient strokes are not supported."),new Us({color:new jt().setStyle(e.stroke,Hi),opacity:e.strokeOpacity*(e.opacity||1),transparent:!0,side:Ye,depthWrite:!1}))}static createShapes(t){return console.warn("SVGLoader: createShapes() is deprecated. Use shapePath.toShapes() instead."),t.toShapes()}static getStrokeStyle(t,e,n,s,r){return t=t!==void 0?t:1,e=e!==void 0?e:"#000",n=n!==void 0?n:"miter",s=s!==void 0?s:"butt",r=r!==void 0?r:4,{strokeColor:e,strokeWidth:t,strokeLineJoin:n,strokeLineCap:s,strokeMiterLimit:r}}static pointsToStroke(t,e,n,s){const r=[],a=[],o=[];if(Fs.pointsToStrokeWithBuffers(t,e,n,s,r,a,o)===0)return null;const c=new ke;return c.setAttribute("position",new Ne(r,3)),c.setAttribute("normal",new Ne(a,3)),c.setAttribute("uv",new Ne(o,2)),c}static pointsToStrokeWithBuffers(t,e,n,s,r,a,o,c){const l=new dt,u=new dt,f=new dt,h=new dt,p=new dt,_=new dt,y=new dt,m=new dt,d=new dt,P=new dt,D=new dt,S=new dt,w=new dt,A=new dt,F=new dt,v=new dt,R=new dt;n=n!==void 0?n:12,s=s!==void 0?s:.001,c=c!==void 0?c:0,t=_t(t);const B=t.length;if(B<2)return 0;const X=t[0].equals(t[B-1]);let q,nt=t[0],G;const J=e.strokeWidth/2,lt=1/(B-1);let K=0,Z,it,rt,ht,Dt=!1,Ct=0,qt=c*3,Xt=c*2;Zt(t[0],t[1],l).multiplyScalar(J),m.copy(t[0]).sub(l),d.copy(t[0]).add(l),P.copy(m),D.copy(d);for(let E=1;E<B;E++){q=t[E],E===B-1?X?G=t[1]:G=void 0:G=t[E+1];const O=l;if(Zt(nt,q,O),f.copy(O).multiplyScalar(J),S.copy(q).sub(f),w.copy(q).add(f),Z=K+lt,it=!1,G!==void 0){Zt(q,G,u),f.copy(u).multiplyScalar(J),A.copy(q).sub(f),F.copy(q).add(f),rt=!0,f.subVectors(G,nt),O.dot(f)<0&&(rt=!1),E===1&&(Dt=rt),f.subVectors(G,q),f.normalize();const I=Math.abs(O.dot(f));if(I>Number.EPSILON){const Y=J/I;f.multiplyScalar(-Y),h.subVectors(q,nt),p.copy(h).setLength(Y).add(f),v.copy(p).negate();const $=p.length(),ot=h.length();h.divideScalar(ot),_.subVectors(G,q);const mt=_.length();if(_.divideScalar(mt),h.dot(v)<ot&&_.dot(v)<mt&&(it=!0),R.copy(p).add(q),v.add(q),it){const pt=rt?d:m,W=(R.x-pt.x)*(v.y-pt.y)-(R.y-pt.y)*(v.x-pt.x);(rt&&W<0||!rt&&W>0)&&v.copy(pt)}switch(ht=!1,it?rt?(F.copy(v),w.copy(v)):(A.copy(v),S.copy(v)):C(),e.strokeLineJoin){case"bevel":T(rt,it,Z);break;case"round":U(rt,it),rt?L(q,S,A,Z,0):L(q,F,w,Z,1);break;default:const pt=J*e.strokeMiterLimit/$;if(pt<1)if(e.strokeLineJoin!=="miter-clip"){T(rt,it,Z);break}else U(rt,it),rt?(_.subVectors(R,S).multiplyScalar(pt).add(S),y.subVectors(R,A).multiplyScalar(pt).add(A),N(S,Z,0),N(_,Z,0),N(q,Z,.5),N(q,Z,.5),N(_,Z,0),N(y,Z,0),N(q,Z,.5),N(y,Z,0),N(A,Z,0)):(_.subVectors(R,w).multiplyScalar(pt).add(w),y.subVectors(R,F).multiplyScalar(pt).add(F),N(w,Z,1),N(_,Z,1),N(q,Z,.5),N(q,Z,.5),N(_,Z,1),N(y,Z,1),N(q,Z,.5),N(y,Z,1),N(F,Z,1));else it?(rt?(N(d,K,1),N(m,K,0),N(R,Z,0),N(d,K,1),N(R,Z,0),N(v,Z,1)):(N(d,K,1),N(m,K,0),N(R,Z,1),N(m,K,0),N(v,Z,0),N(R,Z,1)),rt?A.copy(R):F.copy(R)):rt?(N(S,Z,0),N(R,Z,0),N(q,Z,.5),N(q,Z,.5),N(R,Z,0),N(A,Z,0)):(N(w,Z,1),N(R,Z,1),N(q,Z,.5),N(q,Z,.5),N(R,Z,1),N(F,Z,1)),ht=!0;break}}else C()}else C();!X&&E===B-1&&et(t[0],P,D,rt,!0,K),K=Z,nt=q,m.copy(A),d.copy(F)}if(!X)et(q,S,w,rt,!1,Z);else if(it&&r){let E=R,O=v;Dt!==rt&&(E=v,O=R),rt?(ht||Dt)&&(O.toArray(r,0),O.toArray(r,9),ht&&E.toArray(r,3)):(ht||!Dt)&&(O.toArray(r,3),O.toArray(r,9),ht&&E.toArray(r,0))}if(r){const E=[new dt,new dt,new dt],O=c*3;for(let I=O;I<qt;I+=9)E[0].set(r[I],r[I+1]),E[1].set(r[I+3],r[I+4]),E[2].set(r[I+6],r[I+7]),Dn.area(E)<0&&(r[I+3]=E[0].x,r[I+4]=E[0].y)}return Ct;function Zt(E,O,I){return I.subVectors(O,E),I.set(-I.y,I.x).normalize()}function N(E,O,I){r&&(r[qt]=E.x,r[qt+1]=E.y,r[qt+2]=0,a&&(a[qt]=0,a[qt+1]=0,a[qt+2]=1),qt+=3,o&&(o[Xt]=O,o[Xt+1]=I,Xt+=2)),Ct+=3}function L(E,O,I,Y,$){l.copy(O).sub(E).normalize(),u.copy(I).sub(E).normalize();let ot=Math.PI;const mt=l.dot(u);Math.abs(mt)<1&&(ot=Math.abs(Math.acos(mt))),ot/=n,f.copy(O);for(let pt=0,W=n-1;pt<W;pt++)h.copy(f).rotateAround(E,ot),N(f,Y,$),N(h,Y,$),N(E,Y,.5),f.copy(h);N(f,Y,$),N(I,Y,$),N(E,Y,.5)}function C(){N(d,K,1),N(m,K,0),N(S,Z,0),N(d,K,1),N(S,Z,0),N(w,Z,1)}function T(E,O,I){O?E?(N(d,K,1),N(m,K,0),N(S,Z,0),N(d,K,1),N(S,Z,0),N(v,Z,1),N(S,I,0),N(A,I,0),N(v,I,.5)):(N(d,K,1),N(m,K,0),N(w,Z,1),N(m,K,0),N(v,Z,0),N(w,Z,1),N(w,I,1),N(v,I,0),N(F,I,1)):E?(N(S,I,0),N(A,I,0),N(q,I,.5)):(N(w,I,1),N(F,I,0),N(q,I,.5))}function U(E,O){O&&(E?(N(d,K,1),N(m,K,0),N(S,Z,0),N(d,K,1),N(S,Z,0),N(v,Z,1),N(S,K,0),N(q,Z,.5),N(v,Z,1),N(q,Z,.5),N(A,K,0),N(v,Z,1)):(N(d,K,1),N(m,K,0),N(w,Z,1),N(m,K,0),N(v,Z,0),N(w,Z,1),N(w,K,1),N(v,Z,0),N(q,Z,.5),N(q,Z,.5),N(v,Z,0),N(F,K,1)))}function et(E,O,I,Y,$,ot){switch(e.strokeLineCap){case"round":$?L(E,I,O,ot,.5):L(E,O,I,ot,.5);break;case"square":if($)l.subVectors(O,E),u.set(l.y,-l.x),f.addVectors(l,u).add(E),h.subVectors(u,l).add(E),Y?(f.toArray(r,3),h.toArray(r,0),h.toArray(r,9)):(f.toArray(r,3),o[7]===1?h.toArray(r,9):f.toArray(r,9),h.toArray(r,0));else{l.subVectors(I,E),u.set(l.y,-l.x),f.addVectors(l,u).add(E),h.subVectors(u,l).add(E);const mt=r.length;Y?(f.toArray(r,mt-3),h.toArray(r,mt-6),h.toArray(r,mt-12)):(h.toArray(r,mt-6),f.toArray(r,mt-3),h.toArray(r,mt-12))}break}}function _t(E){let O=!1;for(let Y=1,$=E.length-1;Y<$;Y++)if(E[Y].distanceTo(E[Y+1])<s){O=!0;break}if(!O)return E;const I=[];I.push(E[0]);for(let Y=1,$=E.length-1;Y<$;Y++)E[Y].distanceTo(E[Y+1])>=s&&I.push(E[Y]);return I.push(E[E.length-1]),I}}}const nl=/^\s*url\(\s*(?:["']\s*)?#([^)'"\s]+)(?:\s*["'])?\s*\)\s*$/;function _g(i,t,e=256){if(!i||!Array.isArray(i.stops)||i.stops.length===0)return null;const n=t.userData.transform,s=i.gradientUnits==="objectBoundingBox";let r=null;if(s&&(r=xg(t,n),r===null))return null;function a(f,h,p){p.set(f,h,1),i.gradientTransform&&p.applyMatrix3(i.gradientTransform),s&&p.set(r.minX+p.x*r.width,r.minY+p.y*r.height,1),n&&p.applyMatrix3(n)}const o=document.createElement("canvas");let c;if(i.type==="linearGradient"){o.width=e,o.height=1;const f=o.getContext("2d"),h=f.createLinearGradient(0,0,e,0);il(h,i.stops),f.fillStyle=h,f.fillRect(0,0,e,1);const p=new H,_=new H;a(i.x1,i.y1,p),a(i.x2,i.y2,_);const y=_.x-p.x,m=_.y-p.y,d=y*y+m*m||1e-20,P=y/d,D=m/d,S=-(P*p.x+D*p.y);c=new kt().set(P,D,S,0,0,.5,0,0,1)}else{let f=i.cx,h=i.cy,p=i.fx,_=i.fy,y=i.r;if(i.gradientTransform){const v=new H;v.set(f,h,1).applyMatrix3(i.gradientTransform),f=v.x,h=v.y,v.set(p,_,1).applyMatrix3(i.gradientTransform),p=v.x,_=v.y}if(s&&(f=r.minX+f*r.width,h=r.minY+h*r.height,p=r.minX+p*r.width,_=r.minY+_*r.height,y=y*Math.sqrt((r.width*r.width+r.height*r.height)/2)),y<=0)return null;o.width=e,o.height=e;const m=o.getContext("2d"),d=f-y,P=h-y,D=2*y,S=e/D;m.setTransform(S,0,0,S,-d*S,-P*S);const w=m.createRadialGradient(p,_,0,f,h,y);il(w,i.stops),m.fillStyle=w,m.fillRect(d,P,D,D);const A=n?n.clone().invert():new kt;c=new kt().set(1/D,0,-d/D,0,1/D,-P/D,0,0,1).multiply(A)}const l=new vh(o);l.colorSpace=Hi,l.flipY=!1,l.matrixAutoUpdate=!1,l.matrix=c;const u=i.spreadMethod==="reflect"?Cs:i.spreadMethod==="repeat"?Rs:nn;return l.wrapS=u,l.wrapT=u,l}function xg(i,t){const e=t?t.clone().invert():null,n=new dt,s=new ql;for(const r of i.subPaths)for(const a of r.getPoints())n.copy(a),e&&n.applyMatrix3(e),s.expandByPoint(n);return s.isEmpty()?null:{minX:s.min.x,minY:s.min.y,width:s.max.x-s.min.x,height:s.max.y-s.min.y}}function il(i,t){const e=new jt;for(const n of t){let s=n.color;if(n.opacity<1){e.setStyle(n.color,Hi);const r=/rgb\(([^)]+)\)/.exec(e.getStyle(Hi));r&&(s=`rgba(${r[1]},${n.opacity})`)}i.addColorStop(Math.max(0,Math.min(1,n.offset)),s)}}const sl={type:"change"},Da={type:"start"},ec={type:"end"},Ss=new Ll,rl=new vn,vg=Math.cos(70*Kc.DEG2RAD),xe=new H,De=2*Math.PI,ae={NONE:-1,ROTATE:0,DOLLY:1,PAN:2,TOUCH_ROTATE:3,TOUCH_PAN:4,TOUCH_DOLLY_PAN:5,TOUCH_DOLLY_ROTATE:6},Tr=1e-6;class Sg extends _u{constructor(t,e=null){super(t,e),this.state=ae.NONE,this.target=new H,this.cursor=new H,this.minDistance=0,this.maxDistance=1/0,this.minZoom=0,this.maxZoom=1/0,this.minTargetRadius=0,this.maxTargetRadius=1/0,this.minPolarAngle=0,this.maxPolarAngle=Math.PI,this.minAzimuthAngle=-1/0,this.maxAzimuthAngle=1/0,this.enableDamping=!1,this.dampingFactor=.05,this.enableZoom=!0,this.zoomSpeed=1,this.enableRotate=!0,this.rotateSpeed=1,this.keyRotateSpeed=1,this.enablePan=!0,this.panSpeed=1,this.screenSpacePanning=!0,this.keyPanSpeed=7,this.zoomToCursor=!1,this.autoRotate=!1,this.autoRotateSpeed=2,this.keys={LEFT:"ArrowLeft",UP:"ArrowUp",RIGHT:"ArrowRight",BOTTOM:"ArrowDown"},this.mouseButtons={LEFT:di.ROTATE,MIDDLE:di.DOLLY,RIGHT:di.PAN},this.touches={ONE:ui.ROTATE,TWO:ui.DOLLY_PAN},this.target0=this.target.clone(),this.position0=this.object.position.clone(),this.zoom0=this.object.zoom,this._cursorStyle="auto",this._domElementKeyEvents=null,this._lastPosition=new H,this._lastQuaternion=new In,this._lastTargetPosition=new H,this._quat=new In().setFromUnitVectors(t.up,new H(0,1,0)),this._quatInverse=this._quat.clone().invert(),this._spherical=new Po,this._sphericalDelta=new Po,this._scale=1,this._panOffset=new H,this._rotateStart=new dt,this._rotateEnd=new dt,this._rotateDelta=new dt,this._panStart=new dt,this._panEnd=new dt,this._panDelta=new dt,this._dollyStart=new dt,this._dollyEnd=new dt,this._dollyDelta=new dt,this._dollyDirection=new H,this._mouse=new dt,this._performCursorZoom=!1,this._pointers=[],this._pointerPositions={},this._controlActive=!1,this._onPointerMove=yg.bind(this),this._onPointerDown=Mg.bind(this),this._onPointerUp=Eg.bind(this),this._onContextMenu=Pg.bind(this),this._onMouseWheel=Ag.bind(this),this._onKeyDown=wg.bind(this),this._onTouchStart=Rg.bind(this),this._onTouchMove=Cg.bind(this),this._onMouseDown=bg.bind(this),this._onMouseMove=Tg.bind(this),this._interceptControlDown=Lg.bind(this),this._interceptControlUp=Dg.bind(this),this.domElement!==null&&this.connect(this.domElement),this.update()}set cursorStyle(t){this._cursorStyle=t,t==="grab"?this.domElement.style.cursor="grab":this.domElement.style.cursor="auto"}get cursorStyle(){return this._cursorStyle}connect(t){super.connect(t),this.domElement.addEventListener("pointerdown",this._onPointerDown),this.domElement.addEventListener("pointercancel",this._onPointerUp),this.domElement.addEventListener("contextmenu",this._onContextMenu),this.domElement.addEventListener("wheel",this._onMouseWheel,{passive:!1}),this.domElement.getRootNode().addEventListener("keydown",this._interceptControlDown,{passive:!0,capture:!0}),this.domElement.style.touchAction="none"}disconnect(){this.state=ae.NONE,this.domElement.removeEventListener("pointerdown",this._onPointerDown),this.domElement.ownerDocument.removeEventListener("pointermove",this._onPointerMove),this.domElement.ownerDocument.removeEventListener("pointerup",this._onPointerUp),this.domElement.removeEventListener("pointercancel",this._onPointerUp),this.domElement.removeEventListener("wheel",this._onMouseWheel),this.domElement.removeEventListener("contextmenu",this._onContextMenu),this.stopListenToKeyEvents();const t=this.domElement.getRootNode();t.removeEventListener("keydown",this._interceptControlDown,{capture:!0}),t.removeEventListener("keyup",this._interceptControlUp,{capture:!0}),this._controlActive=!1,this._pointers.length=0,this._pointerPositions={},this.domElement.style.touchAction="",this.domElement.style.cursor="auto"}dispose(){this.disconnect()}getPolarAngle(){return this._spherical.phi}getAzimuthalAngle(){return this._spherical.theta}getDistance(){return this.object.position.distanceTo(this.target)}listenToKeyEvents(t){t.addEventListener("keydown",this._onKeyDown),this._domElementKeyEvents=t}stopListenToKeyEvents(){this._domElementKeyEvents!==null&&(this._domElementKeyEvents.removeEventListener("keydown",this._onKeyDown),this._domElementKeyEvents=null)}saveState(){this.target0.copy(this.target),this.position0.copy(this.object.position),this.zoom0=this.object.zoom}reset(){this.target.copy(this.target0),this.object.position.copy(this.position0),this.object.zoom=this.zoom0,this.object.updateProjectionMatrix(),this.dispatchEvent(sl),this.update(),this.state=ae.NONE}pan(t,e){this._pan(t,e),this.update()}dollyIn(t){this._dollyIn(t),this.update()}dollyOut(t){this._dollyOut(t),this.update()}rotateLeft(t){this._rotateLeft(t),this.update()}rotateUp(t){this._rotateUp(t),this.update()}update(t=null){const e=this.object.position;xe.copy(e).sub(this.target),xe.applyQuaternion(this._quat),this._spherical.setFromVector3(xe),this.autoRotate&&this.state===ae.NONE&&this._rotateLeft(this._getAutoRotationAngle(t)),this.enableDamping?(this._spherical.theta+=this._sphericalDelta.theta*this.dampingFactor,this._spherical.phi+=this._sphericalDelta.phi*this.dampingFactor):(this._spherical.theta+=this._sphericalDelta.theta,this._spherical.phi+=this._sphericalDelta.phi);let n=this.minAzimuthAngle,s=this.maxAzimuthAngle;isFinite(n)&&isFinite(s)&&(n<-Math.PI?n+=De:n>Math.PI&&(n-=De),s<-Math.PI?s+=De:s>Math.PI&&(s-=De),n<=s?this._spherical.theta=Math.max(n,Math.min(s,this._spherical.theta)):this._spherical.theta=this._spherical.theta>(n+s)/2?Math.max(n,this._spherical.theta):Math.min(s,this._spherical.theta)),this._spherical.phi=Math.max(this.minPolarAngle,Math.min(this.maxPolarAngle,this._spherical.phi)),this._spherical.makeSafe(),this.enableDamping===!0?this.target.addScaledVector(this._panOffset,this.dampingFactor):this.target.add(this._panOffset),this.target.sub(this.cursor),this.target.clampLength(this.minTargetRadius,this.maxTargetRadius),this.target.add(this.cursor);let r=!1;if(this.zoomToCursor&&this._performCursorZoom||this.object.isOrthographicCamera)this._spherical.radius=this._clampDistance(this._spherical.radius);else{const a=this._spherical.radius;this._spherical.radius=this._clampDistance(this._spherical.radius*this._scale),r=a!=this._spherical.radius}if(xe.setFromSpherical(this._spherical),xe.applyQuaternion(this._quatInverse),e.copy(this.target).add(xe),this.object.lookAt(this.target),this.enableDamping===!0?(this._sphericalDelta.theta*=1-this.dampingFactor,this._sphericalDelta.phi*=1-this.dampingFactor,this._panOffset.multiplyScalar(1-this.dampingFactor)):(this._sphericalDelta.set(0,0,0),this._panOffset.set(0,0,0)),this.zoomToCursor&&this._performCursorZoom){let a=null;if(this.object.isPerspectiveCamera){const o=xe.length();a=this._clampDistance(o*this._scale);const c=o-a;this.object.position.addScaledVector(this._dollyDirection,c),this.object.updateMatrixWorld(),r=!!c}else if(this.object.isOrthographicCamera){const o=new H(this._mouse.x,this._mouse.y,0);o.unproject(this.object);const c=this.object.zoom;this.object.zoom=Math.max(this.minZoom,Math.min(this.maxZoom,this.object.zoom/this._scale)),this.object.updateProjectionMatrix(),r=c!==this.object.zoom;const l=new H(this._mouse.x,this._mouse.y,0);l.unproject(this.object),this.object.position.sub(l).add(o),this.object.updateMatrixWorld(),a=xe.length()}else console.warn("WARNING: OrbitControls.js encountered an unknown camera type - zoom to cursor disabled."),this.zoomToCursor=!1;a!==null&&(this.screenSpacePanning?this.target.set(0,0,-1).transformDirection(this.object.matrix).multiplyScalar(a).add(this.object.position):(Ss.origin.copy(this.object.position),Ss.direction.set(0,0,-1).transformDirection(this.object.matrix),Math.abs(this.object.up.dot(Ss.direction))<vg?this.object.lookAt(this.target):(rl.setFromNormalAndCoplanarPoint(this.object.up,this.target),Ss.intersectPlane(rl,this.target))))}else if(this.object.isOrthographicCamera){const a=this.object.zoom;this.object.zoom=Math.max(this.minZoom,Math.min(this.maxZoom,this.object.zoom/this._scale)),a!==this.object.zoom&&(this.object.updateProjectionMatrix(),r=!0)}return this._scale=1,this._performCursorZoom=!1,r||this._lastPosition.distanceToSquared(this.object.position)>Tr||8*(1-this._lastQuaternion.dot(this.object.quaternion))>Tr||this._lastTargetPosition.distanceToSquared(this.target)>Tr?(this.dispatchEvent(sl),this._lastPosition.copy(this.object.position),this._lastQuaternion.copy(this.object.quaternion),this._lastTargetPosition.copy(this.target),!0):!1}_getAutoRotationAngle(t){return t!==null?De/60*this.autoRotateSpeed*t:De/60/60*this.autoRotateSpeed}_getZoomScale(t){const e=Math.abs(t*.01);return Math.pow(.95,this.zoomSpeed*e)}_rotateLeft(t){this._sphericalDelta.theta-=t}_rotateUp(t){this._sphericalDelta.phi-=t}_panLeft(t,e){xe.setFromMatrixColumn(e,0),xe.multiplyScalar(-t),this._panOffset.add(xe)}_panUp(t,e){this.screenSpacePanning===!0?xe.setFromMatrixColumn(e,1):(xe.setFromMatrixColumn(e,0),xe.crossVectors(this.object.up,xe)),xe.multiplyScalar(t),this._panOffset.add(xe)}_pan(t,e){const n=this.domElement;if(this.object.isPerspectiveCamera){const s=this.object.position;xe.copy(s).sub(this.target);let r=xe.length();r*=Math.tan(this.object.fov/2*Math.PI/180),this._panLeft(2*t*r/n.clientHeight,this.object.matrix),this._panUp(2*e*r/n.clientHeight,this.object.matrix)}else this.object.isOrthographicCamera?(this._panLeft(t*(this.object.right-this.object.left)/this.object.zoom/n.clientWidth,this.object.matrix),this._panUp(e*(this.object.top-this.object.bottom)/this.object.zoom/n.clientHeight,this.object.matrix)):(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - pan disabled."),this.enablePan=!1)}_dollyOut(t){this.object.isPerspectiveCamera||this.object.isOrthographicCamera?this._scale/=t:(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."),this.enableZoom=!1)}_dollyIn(t){this.object.isPerspectiveCamera||this.object.isOrthographicCamera?this._scale*=t:(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."),this.enableZoom=!1)}_updateZoomParameters(t,e){if(!this.zoomToCursor)return;this._performCursorZoom=!0;const n=this.domElement.getBoundingClientRect(),s=t-n.left,r=e-n.top,a=n.width,o=n.height;this._mouse.x=s/a*2-1,this._mouse.y=-(r/o)*2+1,this._dollyDirection.set(this._mouse.x,this._mouse.y,1).unproject(this.object).sub(this.object.position).normalize()}_clampDistance(t){return Math.max(this.minDistance,Math.min(this.maxDistance,t))}_handleMouseDownRotate(t){this._rotateStart.set(t.clientX,t.clientY)}_handleMouseDownDolly(t){this._updateZoomParameters(t.clientX,t.clientX),this._dollyStart.set(t.clientX,t.clientY)}_handleMouseDownPan(t){this._panStart.set(t.clientX,t.clientY)}_handleMouseMoveRotate(t){this._rotateEnd.set(t.clientX,t.clientY),this._rotateDelta.subVectors(this._rotateEnd,this._rotateStart).multiplyScalar(this.rotateSpeed);const e=this.domElement;this._rotateLeft(De*this._rotateDelta.x/e.clientHeight),this._rotateUp(De*this._rotateDelta.y/e.clientHeight),this._rotateStart.copy(this._rotateEnd),this.update()}_handleMouseMoveDolly(t){this._dollyEnd.set(t.clientX,t.clientY),this._dollyDelta.subVectors(this._dollyEnd,this._dollyStart),this._dollyDelta.y>0?this._dollyOut(this._getZoomScale(this._dollyDelta.y)):this._dollyDelta.y<0&&this._dollyIn(this._getZoomScale(this._dollyDelta.y)),this._dollyStart.copy(this._dollyEnd),this.update()}_handleMouseMovePan(t){this._panEnd.set(t.clientX,t.clientY),this._panDelta.subVectors(this._panEnd,this._panStart).multiplyScalar(this.panSpeed),this._pan(this._panDelta.x,this._panDelta.y),this._panStart.copy(this._panEnd),this.update()}_handleMouseWheel(t){this._updateZoomParameters(t.clientX,t.clientY),t.deltaY<0?this._dollyIn(this._getZoomScale(t.deltaY)):t.deltaY>0&&this._dollyOut(this._getZoomScale(t.deltaY)),this.update()}_handleKeyDown(t){let e=!1;switch(t.code){case this.keys.UP:t.ctrlKey||t.metaKey||t.shiftKey?this.enableRotate&&this._rotateUp(De*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(0,this.keyPanSpeed),e=!0;break;case this.keys.BOTTOM:t.ctrlKey||t.metaKey||t.shiftKey?this.enableRotate&&this._rotateUp(-De*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(0,-this.keyPanSpeed),e=!0;break;case this.keys.LEFT:t.ctrlKey||t.metaKey||t.shiftKey?this.enableRotate&&this._rotateLeft(De*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(this.keyPanSpeed,0),e=!0;break;case this.keys.RIGHT:t.ctrlKey||t.metaKey||t.shiftKey?this.enableRotate&&this._rotateLeft(-De*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(-this.keyPanSpeed,0),e=!0;break}e&&(t.preventDefault(),this.update())}_handleTouchStartRotate(t){if(this._pointers.length===1)this._rotateStart.set(t.pageX,t.pageY);else{const e=this._getSecondPointerPosition(t),n=.5*(t.pageX+e.x),s=.5*(t.pageY+e.y);this._rotateStart.set(n,s)}}_handleTouchStartPan(t){if(this._pointers.length===1)this._panStart.set(t.pageX,t.pageY);else{const e=this._getSecondPointerPosition(t),n=.5*(t.pageX+e.x),s=.5*(t.pageY+e.y);this._panStart.set(n,s)}}_handleTouchStartDolly(t){const e=this._getSecondPointerPosition(t),n=t.pageX-e.x,s=t.pageY-e.y,r=Math.sqrt(n*n+s*s);this._dollyStart.set(0,r)}_handleTouchStartDollyPan(t){this.enableZoom&&this._handleTouchStartDolly(t),this.enablePan&&this._handleTouchStartPan(t)}_handleTouchStartDollyRotate(t){this.enableZoom&&this._handleTouchStartDolly(t),this.enableRotate&&this._handleTouchStartRotate(t)}_handleTouchMoveRotate(t){if(this._pointers.length==1)this._rotateEnd.set(t.pageX,t.pageY);else{const n=this._getSecondPointerPosition(t),s=.5*(t.pageX+n.x),r=.5*(t.pageY+n.y);this._rotateEnd.set(s,r)}this._rotateDelta.subVectors(this._rotateEnd,this._rotateStart).multiplyScalar(this.rotateSpeed);const e=this.domElement;this._rotateLeft(De*this._rotateDelta.x/e.clientHeight),this._rotateUp(De*this._rotateDelta.y/e.clientHeight),this._rotateStart.copy(this._rotateEnd)}_handleTouchMovePan(t){if(this._pointers.length===1)this._panEnd.set(t.pageX,t.pageY);else{const e=this._getSecondPointerPosition(t),n=.5*(t.pageX+e.x),s=.5*(t.pageY+e.y);this._panEnd.set(n,s)}this._panDelta.subVectors(this._panEnd,this._panStart).multiplyScalar(this.panSpeed),this._pan(this._panDelta.x,this._panDelta.y),this._panStart.copy(this._panEnd)}_handleTouchMoveDolly(t){const e=this._getSecondPointerPosition(t),n=t.pageX-e.x,s=t.pageY-e.y,r=Math.sqrt(n*n+s*s);this._dollyEnd.set(0,r),this._dollyDelta.set(0,Math.pow(this._dollyEnd.y/this._dollyStart.y,this.zoomSpeed)),this._dollyOut(this._dollyDelta.y),this._dollyStart.copy(this._dollyEnd);const a=(t.pageX+e.x)*.5,o=(t.pageY+e.y)*.5;this._updateZoomParameters(a,o)}_handleTouchMoveDollyPan(t){this.enableZoom&&this._handleTouchMoveDolly(t),this.enablePan&&this._handleTouchMovePan(t)}_handleTouchMoveDollyRotate(t){this.enableZoom&&this._handleTouchMoveDolly(t),this.enableRotate&&this._handleTouchMoveRotate(t)}_addPointer(t){this._pointers.push(t.pointerId)}_removePointer(t){delete this._pointerPositions[t.pointerId];for(let e=0;e<this._pointers.length;e++)if(this._pointers[e]==t.pointerId){this._pointers.splice(e,1);return}}_isTrackingPointer(t){for(let e=0;e<this._pointers.length;e++)if(this._pointers[e]==t.pointerId)return!0;return!1}_trackPointer(t){let e=this._pointerPositions[t.pointerId];e===void 0&&(e=new dt,this._pointerPositions[t.pointerId]=e),e.set(t.pageX,t.pageY)}_getSecondPointerPosition(t){const e=t.pointerId===this._pointers[0]?this._pointers[1]:this._pointers[0];return this._pointerPositions[e]}_customWheelEvent(t){const e=t.deltaMode,n={clientX:t.clientX,clientY:t.clientY,deltaY:t.deltaY};switch(e){case 1:n.deltaY*=16;break;case 2:n.deltaY*=100;break}return t.ctrlKey&&!this._controlActive&&(n.deltaY*=10),n}}function Mg(i){this.enabled!==!1&&(this._pointers.length===0&&(this.domElement.setPointerCapture(i.pointerId),this.domElement.ownerDocument.addEventListener("pointermove",this._onPointerMove),this.domElement.ownerDocument.addEventListener("pointerup",this._onPointerUp)),!this._isTrackingPointer(i)&&(this._addPointer(i),i.pointerType==="touch"?this._onTouchStart(i):this._onMouseDown(i),this._cursorStyle==="grab"&&(this.domElement.style.cursor="grabbing")))}function yg(i){this.enabled!==!1&&(i.pointerType==="touch"?this._onTouchMove(i):this._onMouseMove(i))}function Eg(i){switch(this._removePointer(i),this._pointers.length){case 0:this.domElement.releasePointerCapture(i.pointerId),this.domElement.ownerDocument.removeEventListener("pointermove",this._onPointerMove),this.domElement.ownerDocument.removeEventListener("pointerup",this._onPointerUp),this.dispatchEvent(ec),this.state=ae.NONE,this._cursorStyle==="grab"&&(this.domElement.style.cursor="grab");break;case 1:const t=this._pointers[0],e=this._pointerPositions[t];this._onTouchStart({pointerId:t,pageX:e.x,pageY:e.y});break}}function bg(i){let t;switch(i.button){case 0:t=this.mouseButtons.LEFT;break;case 1:t=this.mouseButtons.MIDDLE;break;case 2:t=this.mouseButtons.RIGHT;break;default:t=-1}switch(t){case di.DOLLY:if(this.enableZoom===!1)return;this._handleMouseDownDolly(i),this.state=ae.DOLLY;break;case di.ROTATE:if(i.ctrlKey||i.metaKey||i.shiftKey){if(this.enablePan===!1)return;this._handleMouseDownPan(i),this.state=ae.PAN}else{if(this.enableRotate===!1)return;this._handleMouseDownRotate(i),this.state=ae.ROTATE}break;case di.PAN:if(i.ctrlKey||i.metaKey||i.shiftKey){if(this.enableRotate===!1)return;this._handleMouseDownRotate(i),this.state=ae.ROTATE}else{if(this.enablePan===!1)return;this._handleMouseDownPan(i),this.state=ae.PAN}break;default:this.state=ae.NONE}this.state!==ae.NONE&&this.dispatchEvent(Da)}function Tg(i){switch(this.state){case ae.ROTATE:if(this.enableRotate===!1)return;this._handleMouseMoveRotate(i);break;case ae.DOLLY:if(this.enableZoom===!1)return;this._handleMouseMoveDolly(i);break;case ae.PAN:if(this.enablePan===!1)return;this._handleMouseMovePan(i);break}}function Ag(i){this.enabled===!1||this.enableZoom===!1||this.state!==ae.NONE||(i.preventDefault(),this.dispatchEvent(Da),this._handleMouseWheel(this._customWheelEvent(i)),this.dispatchEvent(ec))}function wg(i){this.enabled!==!1&&this._handleKeyDown(i)}function Rg(i){switch(this._trackPointer(i),this._pointers.length){case 1:switch(this.touches.ONE){case ui.ROTATE:if(this.enableRotate===!1)return;this._handleTouchStartRotate(i),this.state=ae.TOUCH_ROTATE;break;case ui.PAN:if(this.enablePan===!1)return;this._handleTouchStartPan(i),this.state=ae.TOUCH_PAN;break;default:this.state=ae.NONE}break;case 2:switch(this.touches.TWO){case ui.DOLLY_PAN:if(this.enableZoom===!1&&this.enablePan===!1)return;this._handleTouchStartDollyPan(i),this.state=ae.TOUCH_DOLLY_PAN;break;case ui.DOLLY_ROTATE:if(this.enableZoom===!1&&this.enableRotate===!1)return;this._handleTouchStartDollyRotate(i),this.state=ae.TOUCH_DOLLY_ROTATE;break;default:this.state=ae.NONE}break;default:this.state=ae.NONE}this.state!==ae.NONE&&this.dispatchEvent(Da)}function Cg(i){switch(this._trackPointer(i),this.state){case ae.TOUCH_ROTATE:if(this.enableRotate===!1)return;this._handleTouchMoveRotate(i),this.update();break;case ae.TOUCH_PAN:if(this.enablePan===!1)return;this._handleTouchMovePan(i),this.update();break;case ae.TOUCH_DOLLY_PAN:if(this.enableZoom===!1&&this.enablePan===!1)return;this._handleTouchMoveDollyPan(i),this.update();break;case ae.TOUCH_DOLLY_ROTATE:if(this.enableZoom===!1&&this.enableRotate===!1)return;this._handleTouchMoveDollyRotate(i),this.update();break;default:this.state=ae.NONE}}function Pg(i){this.enabled!==!1&&i.preventDefault()}function Lg(i){i.key==="Control"&&(this._controlActive=!0,this.domElement.getRootNode().addEventListener("keyup",this._interceptControlUp,{passive:!0,capture:!0}))}function Dg(i){i.key==="Control"&&(this._controlActive=!1,this.domElement.getRootNode().removeEventListener("keyup",this._interceptControlUp,{passive:!0,capture:!0}))}const Ug={depth:3,base:1,width:60,curve:12,outlinesOnly:!1};function nc(i){const t=i.index?i.toNonIndexed():i,e=t.getAttribute("position"),n=[];for(let s=0;s<e.count;s++)n.push(e.getX(s),e.getY(s),e.getZ(s));return t!==i&&t.dispose(),n}function Ig(i){const t=nc(i),e=[],n=new Map,s=(r,a)=>`${r.toFixed(4)},${a.toFixed(4)}`;for(let r=0;r<t.length;r+=9){let a=[t[r],t[r+1]],o=[t[r+3],t[r+4]];const c=[t[r+6],t[r+7]],l=(o[0]-a[0])*(c[1]-a[1])-(c[0]-a[0])*(o[1]-a[1]);if(!(Math.abs(l)<1e-9)){l<0&&([a,o]=[o,a]),e.push(a[0],a[1],1,o[0],o[1],1,c[0],c[1],1),e.push(a[0],a[1],0,c[0],c[1],0,o[0],o[1],0);for(const[u,f]of[[a,o],[o,c],[c,a]]){const h=`${s(...u)}>${s(...f)}`,p=`${s(...f)}>${s(...u)}`,_=n.get(p);_?_.n++:n.set(h,{a:u,b:f,n:n.get(h)?.n??0})}}}for(const{a:r,b:a,n:o}of n.values())o||(e.push(r[0],r[1],0,a[0],a[1],0,a[0],a[1],1),e.push(r[0],r[1],0,a[0],a[1],1,r[0],r[1],1));return e}function Ng(i,t,e,n,s,r){const a=(l,u,f)=>[l,u,f],o=[a(i,t,e),a(n,t,e),a(n,s,e),a(i,s,e),a(i,t,r),a(n,t,r),a(n,s,r),a(i,s,r)];return[[0,2,1],[0,3,2],[4,5,6],[4,6,7],[0,1,5],[0,5,4],[1,2,6],[1,6,5],[2,3,7],[2,7,6],[3,0,4],[3,4,7]].flatMap(l=>l.flatMap(u=>o[u]))}const al=i=>typeof i=="string"&&i!=="none"&&i!=="transparent";function Fg(i,t){const e=new Fs().parse(i),n=[];for(const y of e.paths){const m=y.userData?.style??{};if(!t.outlinesOnly&&al(m.fill))for(const d of y.toShapes()){const P=new Ca(d,{depth:1,bevelEnabled:!1,curveSegments:Math.max(2,Math.round(t.curve))});n.push(nc(P)),P.dispose()}if(al(m.stroke)&&Number(m.strokeWidth??1)>0)for(const d of y.subPaths){const P=d.getPoints(Math.max(2,Math.round(t.curve))),D=Fs.pointsToStroke(P,m);D&&(n.push(Ig(D)),D.dispose())}}let s=1/0,r=1/0,a=-1/0,o=-1/0;for(const y of n)for(let m=0;m<y.length;m+=3)s=Math.min(s,y[m]),a=Math.max(a,y[m]),r=Math.min(r,y[m+1]),o=Math.max(o,y[m+1]);if(!n.length||!Number.isFinite(s)||a-s<=0)throw new Error("Nothing in this drawing can be made 3D. Fills and outlines are used; text and embedded images are not.");const c=t.width/(a-s),l=Math.max(.01,t.depth),u=Math.max(0,t.base),f=[];for(const y of n)for(let m=0;m<y.length;m+=9){const d=P=>[(y[m+P]-s)*c,(o-y[m+P+1])*c,u+y[m+P+2]*l];f.push(...d(0),...d(6),...d(3))}const h=(a-s)*c,p=(o-r)*c;if(u>0){const y=Math.max(1,Math.min(h,p)*.04);f.push(...Ng(-y,-y,0,h+y,p+y,u+.01))}const _=new Float32Array(f);return{triangles:_,count:_.length/9,size:{x:h,y:p,z:u+l}}}function Og(i){const t=i.triangles,e=new ArrayBuffer(84+i.count*50),n=new DataView(e),s="NinjaSVG binary STL";for(let a=0;a<s.length;a++)n.setUint8(a,s.charCodeAt(a));n.setUint32(80,i.count,!0);let r=84;for(let a=0;a<t.length;a+=9){const o=t[a+3]-t[a],c=t[a+4]-t[a+1],l=t[a+5]-t[a+2],u=t[a+6]-t[a],f=t[a+7]-t[a+1],h=t[a+8]-t[a+2];let p=c*h-l*f,_=l*u-o*h,y=o*f-c*u;const m=Math.hypot(p,_,y)||1;p/=m,_/=m,y/=m;for(const d of[p,_,y])n.setFloat32(r,d,!0),r+=4;for(let d=0;d<9;d++)n.setFloat32(r,t[a+d],!0),r+=4;n.setUint16(r,0,!0),r+=2}return new Blob([e],{type:"model/stl"})}function Bg(i,t,e){const n=new gg({antialias:!0,alpha:!0});n.setPixelRatio(Math.min(2,window.devicePixelRatio||1));const s=()=>Math.max(1,i.clientWidth),r=()=>Math.max(1,i.clientHeight);n.setSize(s(),r()),n.domElement.setAttribute("aria-label","3D model preview. Drag to rotate, scroll or pinch to zoom."),i.appendChild(n.domElement);const a=new ch,o=new ke;o.setAttribute("position",new on(t.triangles,3)),o.computeVertexNormals(),o.translate(-t.size.x/2,-t.size.y/2,-t.size.z/2);const c=new ru({color:e,roughness:.55,metalness:.05,flatShading:!0}),l=new hn(o,c);l.rotation.x=-Math.PI/3,a.add(l),a.add(new pu(16777215,.9));const u=new Co(16777215,1.6);u.position.set(1,2,3),a.add(u);const f=new Co(16777215,.5);f.position.set(-2,-1,1),a.add(f);const h=new Ve(40,s()/r(),.1,1e4),p=Math.max(t.size.x,t.size.y,t.size.z);h.position.set(0,0,p*1.9);const _=new Sg(h,n.domElement);_.enableDamping=!0;let y=0;const m=()=>{y=requestAnimationFrame(m),_.update(),n.render(a,h)};m();const d=new ResizeObserver(()=>{h.aspect=s()/r(),h.updateProjectionMatrix(),n.setSize(s(),r())});return d.observe(i),()=>{cancelAnimationFrame(y),d.disconnect(),_.dispose(),o.dispose(),c.dispose(),n.dispose(),n.domElement.remove()}}export{Ug as DEFAULT_STL,Fg as buildModel,Bg as mountViewer,Og as stlBlob};
