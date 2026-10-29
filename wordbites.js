
(function(G){
var COLS=8,ROWS=9;
var PTS={3:100,4:400,5:800,6:1400,7:1800,8:2200,9:2600};
function pts(n){return PTS[n]||(n>9?2600+400*(n-9):0)}
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;var t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
var SA='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function newSeedCode(r){var s='';for(var i=0;i<6;i++)s+=SA[Math.floor((r||Math.random)()*SA.length)];return s}
function seedNum(code){code=String(code).toUpperCase().replace(/[^A-Z0-9]/g,'');var h=2166136261;for(var i=0;i<code.length;i++){h^=code.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
function decodeCompact(s){var out=[],prev='',i=0,n=s.length;while(i<n){var p=s.charCodeAt(i)-48;i++;var j=i;while(j<n){var c=s.charCodeAt(j);if(c>=48&&c<=57)break;j++}var w=prev.slice(0,p)+s.slice(i,j);out.push(w);prev=w;i=j}return out}
function makeDict(words){var set=new Set(),byLen={};for(var i=0;i<words.length;i++){var w=words[i];if(w.length<3||w.length>9)continue;set.add(w);(byLen[w.length]=byLen[w.length]||[]).push(w)}return{set:set,byLen:byLen,size:set.size}}
function cellsOf(p){if(p.t==='h')return[[p.x,p.y,p.l[0]],[p.x+1,p.y,p.l[1]]];if(p.t==='v')return[[p.x,p.y,p.l[0]],[p.x,p.y+1,p.l[1]]];return[[p.x,p.y,p.l]]}
function size(p){return p.t==='h'?[2,1]:p.t==='v'?[1,2]:[1,1]}
function buildGrid(pieces){var g=[];for(var y=0;y<ROWS;y++){g.push(new Array(COLS).fill(null))}pieces.forEach(function(p){cellsOf(p).forEach(function(c){if(c[1]>=0&&c[1]<ROWS&&c[0]>=0&&c[0]<COLS)g[c[1]][c[0]]=c[2]})});return g}
function fits(pieces,p,x,y){var s=size(p);if(x<0||y<0||x+s[0]>COLS||y+s[1]>ROWS)return false;var g=buildGrid(pieces.filter(function(q){return q!==p&&q.id!==p.id}));for(var dx=0;dx<s[0];dx++)for(var dy=0;dy<s[1];dy++)if(g[y+dy][x+dx])return false;return true}
function scan(grid,dict,found){var res=[];function run(cells){if(cells.length<3)return;var s=cells.map(function(c){return c[2]}).join('').toLowerCase();for(var len=Math.min(9,s.length);len>=3;len--)for(var i=0;i+len<=s.length;i++){var w=s.substr(i,len);if(dict.set.has(w)&&!found.has(w)){found.add(w);res.push({w:w,pts:pts(len),cells:cells.slice(i,i+len).map(function(c){return[c[0],c[1]]})})}}}
for(var y=0;y<ROWS;y++){var cur=[];for(var x=0;x<=COLS;x++){var L=x<COLS?grid[y][x]:null;if(L)cur.push([x,y,L]);else{run(cur);cur=[]}}}
for(var x2=0;x2<COLS;x2++){var cur2=[];for(var y2=0;y2<=ROWS;y2++){var L2=y2<ROWS?grid[y2][x2]:null;if(L2)cur2.push([x2,y2,L2]);else{run(cur2);cur2=[]}}}
return res}
function canBuild(word,pieces,dir){if(word.length>(dir==='h'?COLS:ROWS))return null;var W=word.toUpperCase(),used=new Array(pieces.length).fill(false),path=[];
function rec(i){if(i===W.length)return true;for(var k=0;k<pieces.length;k++){if(used[k])continue;var p=pieces[k];
if(p.t==='s'){if(p.l===W[i]){used[k]=true;path.push(k);if(rec(i+1))return true;path.pop();used[k]=false}}
else if(p.t===dir){if(p.l[0]===W[i]&&p.l[1]===W[i+1]){used[k]=true;path.push(k);if(rec(i+2))return true;path.pop();used[k]=false}}
else{if(p.l[0]===W[i]||p.l[1]===W[i]){used[k]=true;path.push(k);if(rec(i+1))return true;path.pop();used[k]=false}}}
return false}
return rec(0)?path.slice():null}
function letterPool(pieces){var c={};pieces.forEach(function(p){for(var i=0;i<p.l.length;i++)c[p.l[i]]=(c[p.l[i]]||0)+1});return c}
function poolOk(word,pool){var c={};for(var i=0;i<word.length;i++){var L=word[i].toUpperCase();c[L]=(c[L]||0)+1;if(c[L]>(pool[L]||0))return false}return true}
function solve(pieces,dict,opt){opt=opt||{};var minLen=opt.minLen||3,limit=opt.limit||1e9,out=[],pool=letterPool(pieces);
for(var len=9;len>=minLen;len--){var L=dict.byLen[len]||[];for(var i=0;i<L.length;i++){var w=L[i];if(!poolOk(w,pool))continue;var d=null;if(canBuild(w,pieces,'v'))d='v';else if(canBuild(w,pieces,'h'))d='h';if(d){out.push({w:w,dir:d,pts:pts(len)});if(out.length>=limit)return out}}}return out}
var FREQ={E:12,A:9,I:9,O:8,N:6,R:6,T:6,L:4,S:5,U:4,D:4,G:3,B:2,C:2,M:2,P:2,F:2,H:2,V:1,W:2,Y:2,K:1,J:1,X:1,Q:1,Z:1};
var VOW='AEIOU';
var BLOCKS=['TH','CH','SH','ER','IN','ED','ON','RE','ES','AN','EX','QU','ST','EN','AT','OR','AR','IN','LE','OU','EA','AL','IT','IS','UN','LY','OW','PU','TB','CK','GH','PH','TR','DE','RA','TE','TI','OL','IC','EL'];
function pickW(r,map){var tot=0,k;for(k in map)tot+=map[k];var x=r()*tot;for(k in map){x-=map[k];if(x<0)return k}return 'E'}
function makePieces(r){var nS=8,nH=3+Math.floor(r()*2),nV=Math.floor(r()*3),ps=[],id=0,i;
var singles=[];for(i=0;i<nS;i++)singles.push(pickW(r,FREQ));var vc=singles.filter(function(c){return VOW.indexOf(c)>=0}).length;
while(vc<3){var j=Math.floor(r()*nS);if(VOW.indexOf(singles[j])<0){singles[j]=pickW(r,{A:9,E:12,I:8,O:8,U:3});vc++}}
singles.forEach(function(c){ps.push({id:id++,t:'s',l:c})});
function blk(){if(r()<0.7)return BLOCKS[Math.floor(r()*BLOCKS.length)];var a=pickW(r,FREQ),b=pickW(r,FREQ);if(VOW.indexOf(a)<0&&VOW.indexOf(b)<0)b=pickW(r,{A:9,E:12,I:8,O:8,U:3});return a+b}
for(i=0;i<nH;i++)ps.push({id:id++,t:'h',l:blk()});for(i=0;i<nV;i++)ps.push({id:id++,t:'v',l:blk()});
var q=ps.filter(function(p){return p.l.indexOf('Q')>=0&&p.l!=='QU'});q.forEach(function(p){p.l=p.l.replace('Q','K')});
return ps}
function scatter(pieces,r){for(var tries=0;tries<400;tries++){var ok=true,placed=[];for(var i=0;i<pieces.length&&ok;i++){var p=pieces[i],s=size(p),done=false;for(var t=0;t<200&&!done;t++){var x=Math.floor(r()*(COLS-s[0]+1)),y=Math.floor(r()*(ROWS-s[1]+1));if(isolated(placed,p,x,y)){p.x=x;p.y=y;placed.push(p);done=true}}if(!done)ok=false}if(ok)return true}
var placed2=[];pieces.forEach(function(p){var s=size(p);for(var t=0;t<2000;t++){var x=Math.floor(r()*(COLS-s[0]+1)),y=Math.floor(r()*(ROWS-s[1]+1));if(fits(placed2,p,x,y)){p.x=x;p.y=y;placed2.push(p);return}}});return false}
function isolated(placed,p,x,y){var s=size(p),g=buildGrid(placed);for(var dx=-1;dx<=s[0];dx++)for(var dy=-1;dy<=s[1];dy++){var X=x+dx,Y=y+dy;if(X<0||Y<0||X>=COLS||Y>=ROWS)continue;if(g[Y][X])return false}return true}
function generate(code,dict){var r=mulberry32(seedNum(code)),ps=null;for(var a=0;a<60;a++){ps=makePieces(r);if(!dict||solve(ps,dict,{minLen:6,limit:1}).length)break}scatter(ps,r);return ps}
var STEMS=['aters','angers','ances','artels','aster','ating','ailers','eaters','ashes','owing','ines','ears','ales','ates','ight'];
function stemBoard(code,dict){var r=mulberry32(seedNum(code)^0x5bd1e995),cands=[];STEMS.forEach(function(st){var pre='abcdefghijklmnopqrstuvwxyz'.split('').filter(function(c){return dict.set.has(c+st)});if(pre.length>=4)cands.push({st:st,pre:pre})});
var c=cands[Math.floor(r()*cands.length)]||{st:'ates',pre:['d','g','h','l','m','r']};var st=c.st.toUpperCase(),ps=[],id=0,i=0;
while(i<st.length){if(st.length-i>=2&&r()<0.6){ps.push({id:id++,t:'v',l:st.substr(i,2)});i+=2}else{ps.push({id:id++,t:'s',l:st[i]});i++}}
var stemN=ps.length,pre=c.pre.slice().sort(function(){return r()-0.5}).slice(0,6);pre.forEach(function(L){ps.push({id:id++,t:'s',l:L.toUpperCase()})});
['S','R','E'].forEach(function(L){if(ps.length<14)ps.push({id:id++,t:'s',l:L})});
ps.push({id:id++,t:'h',l:BLOCKS[Math.floor(r()*12)]});
var y=0;for(var k=0;k<stemN;k++){ps[k].x=3;ps[k].y=y;y+=size(ps[k])[1]+1}y--;
var stemH=y;var off=Math.max(0,Math.floor((ROWS-stemH)/2));for(k=0;k<stemN;k++)ps[k].y+=off;
var rest=ps.slice(stemN),placed=ps.slice(0,stemN);rest.forEach(function(p){var s=size(p);for(var t=0;t<3000;t++){var x=Math.floor(r()*(COLS-s[0]+1)),yy=Math.floor(r()*(ROWS-s[1]+1));if(Math.abs(x-3)<=1&&t<2000)continue;if(fits(placed,p,x,yy)&&(t>1500||isolated(placed,p,x,yy))){p.x=x;p.y=yy;placed.push(p);return}}});
return{pieces:ps,stem:c.st,prefixes:c.pre}}
G.WB={COLS:COLS,ROWS:ROWS,pts:pts,mulberry32:mulberry32,newSeedCode:newSeedCode,seedNum:seedNum,decodeCompact:decodeCompact,makeDict:makeDict,cellsOf:cellsOf,size:size,buildGrid:buildGrid,fits:fits,scan:scan,canBuild:canBuild,solve:solve,generate:generate,stemBoard:stemBoard,STEMS:STEMS};
})(window);

function initWordBites(root,DICT_SRC,OPT){OPT=OPT||{};var WB=window.WB,COLS=WB.COLS,ROWS=WB.ROWS;
var CSS="*{box-sizing:border-box;-webkit-tap-highlight-color:transparent;-webkit-user-select:none;user-select:none;-webkit-touch-callout:none}"+
"#wb{position:fixed;inset:0;z-index:1;background:#0d2747;color:#fff;font-family:-apple-system,system-ui,'Helvetica Neue',sans-serif;overflow:hidden;touch-action:none;overscroll-behavior:none}"+
"#wb canvas{position:absolute;inset:0;width:100%;height:100%;display:block}"+
"#hud{position:absolute;left:0;right:0;top:calc(env(safe-area-inset-top) + 8px);padding:0 14px;display:flex;justify-content:space-between;align-items:flex-start;pointer-events:none}"+
"#hud .l small{display:block;font-size:13px;font-weight:800;letter-spacing:1px;opacity:.85}#sc{font-size:40px;font-weight:900;line-height:1}#wc{font-size:14px;font-weight:800;opacity:.9;margin-top:2px}"+
"#tm{background:#fff;color:#0d2747;font-weight:900;font-size:20px;border-radius:999px;padding:6px 16px;min-width:76px;text-align:center}#tm.low{background:#ff5a5a;color:#fff}"+
"#bar{position:absolute;left:0;right:0;bottom:calc(env(safe-area-inset-bottom) + 10px);display:flex;flex-wrap:wrap;justify-content:center;gap:8px;padding:0 10px}"+
"#bar button,.ov button{border:0;border-radius:12px;font-weight:800;font-size:15px;padding:10px 14px;background:rgba(255,255,255,.14);color:#fff}"+
"#info{position:absolute;left:10px;right:10px;text-align:center;font-size:13px;font-weight:700;opacity:.9;pointer-events:none}"+
".ov{position:absolute;inset:0;background:rgba(8,24,46,.96);display:flex;flex-direction:column;align-items:center;padding:calc(env(safe-area-inset-top) + 18px) 18px calc(env(safe-area-inset-bottom) + 18px);overflow-y:auto;touch-action:pan-y;-webkit-overflow-scrolling:touch}"+
".ov h1{margin:4px 0;font-size:30px}.ov h2{margin:14px 0 4px;font-size:18px}.ov p{margin:4px 0 10px;opacity:.8;text-align:center;max-width:460px;font-size:14px;line-height:1.4}"+
".ov .mb{display:block;width:100%;max-width:400px;margin:5px 0;padding:13px;font-size:17px;background:#e9c58f;color:#1d1206;text-align:left}.ov .mb em{display:block;font-style:normal;font-weight:600;font-size:12px;opacity:.75}"+
".row{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;width:100%;max-width:400px;margin:5px 0}"+
".ov input{flex:1;min-width:120px;font-size:18px;padding:10px;border-radius:12px;border:0;text-transform:uppercase;font-weight:800;-webkit-user-select:text;user-select:text}"+
".grid{display:grid;grid-template-columns:repeat(2,1fr);gap:8px;width:100%;max-width:400px;margin:8px 0}.grid div{background:rgba(255,255,255,.08);border-radius:12px;padding:8px;text-align:center}.grid b{display:block;font-size:22px}.grid small{opacity:.7;font-size:12px}"+
".ov ul{max-width:420px;padding-left:20px;margin:4px 0;font-size:14px;line-height:1.45}.wl{max-width:420px;font-size:13px;line-height:1.6;opacity:.9;text-align:center;word-spacing:4px}"+
".hide{display:none!important}";
function el(t,a,k){var e=document.createElement(t);if(a)for(var n in a){if(n==='text')e.textContent=a[n];else if(n==='class')e.className=a[n];else if(n==='data-m')e.dataset.m=a[n];else if(n==='maxlength')e.maxLength=+a[n];else e[n]=a[n]}(k||[]).forEach(function(c){e.appendChild(typeof c==='string'?document.createTextNode(c):c)});return e}
function mb(m,t,s){return el('button',{'class':'mb','data-m':m},[t,el('em',{text:s})])}
root.appendChild(el('style',{text:CSS}));
root.appendChild(el('div',{id:'wb'},[el('canvas',{id:'cv'}),el('div',{id:'hud'},[el('div',{'class':'l'},[el('small',{text:'SCORE'}),el('div',{id:'sc',text:'0'}),el('div',{id:'wc',text:'WORDS: 0'})]),el('div',{id:'tm',text:'1:20'})]),el('div',{id:'info'}),
el('div',{id:'bar'},[el('button',{id:'bHint',text:'Hint'}),el('button',{id:'bEnd',text:'End'}),el('button',{id:'bMenu',text:'Menu'}),el('button',{id:'bMute',text:'Sound: on'})]),
el('div',{id:'menu','class':'ov'},[el('h1',{text:'Word Bites Practice'}),el('p',{text:'Drag tiles to build words across or down. Words of 3+ letters score automatically. Two-letter blocks never rotate.'}),
mb('classic','Classic \u00b7 80s','Random board, same rules and scoring as the real game'),
el('div',{'class':'row'},[el('input',{id:'seedIn',placeholder:'Board # e.g. K7QM2X',maxlength:'8'}),el('button',{id:'bSeed',text:'Replay board'})]),
mb('stem','Stem Drill \u00b7 80s','A high-yield stem (like -ATERS) sits in the middle. Swap single tiles on top to cycle prefixes fast'),
mb('practice','Practice \u00b7 no timer','Hint button shows the best word you can make from these pieces'),
el('div',{id:'bests','class':'wl'}),el('p',{id:'dnote'})]),el('div',{id:'sum','class':'ov hide'})]));
var $=function(id){return root.querySelector('#'+id)};var cv=$('cv'),X=cv.getContext('2d');
var LS;try{LS=window.localStorage;LS.setItem('wb_t','1')}catch(e){LS=null}
function lsGet(k){try{return LS?LS.getItem(k):null}catch(e){return null}}function lsSet(k,v){try{if(LS)LS.setItem(k,v)}catch(e){}}
$('dnote').textContent=(OPT.dictNote||'')+' GamePigeon checks words against a bigger Collins-based list, so a few real-game words may not count here. The real board algorithm is not public; boards here come from a weighted letter bag with vowel and common-block rules, checked to always allow a 6+ letter word.';
var D=null;function dict(){if(!D)D=WB.makeDict(WB.decodeCompact(DICT_SRC));return D}
var muted=lsGet('wb_mute')==='1',AC=null;function upMute(){$('bMute').textContent='Sound: '+(muted?'off':'on')}upMute();
$('bMute').onclick=function(){muted=!muted;lsSet('wb_mute',muted?'1':'0');upMute()};
function tone(f,d,v){if(muted)return;try{AC=AC||new(window.AudioContext||window.webkitAudioContext)();var o=AC.createOscillator(),g=AC.createGain();o.frequency.value=f;g.gain.value=v||.08;g.gain.exponentialRampToValueAtTime(.001,AC.currentTime+d);o.connect(g);g.connect(AC.destination);o.start();o.stop(AC.currentTime+d)}catch(e){}}
var W=0,H=0,DPR=1,cell=40,ox=0,oy=0;
function resize(){var r=root.getBoundingClientRect();W=r.width||innerWidth;H=r.height||innerHeight;DPR=Math.min(3,devicePixelRatio||1);cv.width=W*DPR;cv.height=H*DPR;X.setTransform(DPR,0,0,DPR,0,0);
var top=110,bot=110;cell=Math.floor(Math.min((W-16)/COLS,(H-top-bot)/ROWS));ox=Math.floor((W-cell*COLS)/2);oy=Math.floor(top+Math.max(0,(H-top-bot-cell*ROWS)/2));$('info').style.top=(oy+cell*ROWS+6)+'px'}
addEventListener('resize',resize);resize();
var stop=function(e){var t=e.target;if(t&&t.closest&&t.closest('.ov'))return;e.preventDefault()};['touchmove','gesturestart','gesturechange','dblclick'].forEach(function(n){root.addEventListener(n,stop,{passive:false})});
var S=null,mode='classic';
var NAMES={classic:'Classic',stem:'Stem Drill',practice:'Practice',replay:'Replay'};
function showBests(){$('bests').textContent='Best: '+['classic','stem','replay'].map(function(m){return NAMES[m]+' '+(+(lsGet('wb_best_'+m)||0)).toLocaleString()}).join(' \u00b7 ')}showBests();
function start(m,code){mode=m;var d=dict();code=(code||WB.newSeedCode()).toUpperCase();var pieces,extra='';
if(m==='stem'){var sb=WB.stemBoard(code,d);pieces=sb.pieces;extra='Stem -'+sb.stem.toUpperCase()+': close the gaps, then swap letters on top';}else pieces=WB.generate(code,d);
S={m:m,code:code,pieces:pieces,found:new Set(),words:[],score:0,shown:0,t:m==='practice'?Infinity:80,run:true,fx:[],tips:[],hint:'',extra:extra,last:performance.now(),t0:performance.now()};
$('menu').classList.add('hide');$('sum').classList.add('hide');$('bHint').classList.toggle('hide',m!=='practice');
WB.scan(WB.buildGrid(pieces),d,S.found);setInfo();tone(660,.12)}
function setInfo(){$('info').textContent='Board #'+S.code+(S.extra?' \u00b7 '+S.extra:'')+(S.hint?' \u00b7 Hint: '+S.hint:'')}
root.querySelectorAll('[data-m]').forEach(function(b){b.onclick=function(){start(b.getAttribute('data-m'))}});
$('bSeed').onclick=function(){var v=$('seedIn').value.trim();if(v)start('replay',v)};
$('seedIn').addEventListener('keydown',function(e){if(e.key==='Enter')$('bSeed').onclick()});
$('bMenu').onclick=function(){if(S)S.run=false;showBests();$('sum').classList.add('hide');$('menu').classList.remove('hide')};
$('bEnd').onclick=function(){if(S&&S.run)finish()};
$('bHint').onclick=function(){if(!S)return;var sol=WB.solve(S.pieces,dict(),{limit:400}).filter(function(s){return!S.found.has(s.w)});S.hint=sol.length?sol[0].w.toUpperCase()+' ('+(sol[0].dir==='v'?'down':'across')+', +'+sol[0].pts+')':'none left';setInfo()};
var drag=null;function cellAt(px,py){return[Math.floor((px-ox)/cell),Math.floor((py-oy)/cell)]}
function pieceAt(px,py){var c=cellAt(px,py);for(var i=S.pieces.length-1;i>=0;i--){var p=S.pieces[i],s=WB.size(p);if(c[0]>=p.x&&c[0]<p.x+s[0]&&c[1]>=p.y&&c[1]<p.y+s[1])return p}return null}
function pos(e){var r=cv.getBoundingClientRect();return[e.clientX-r.left,e.clientY-r.top]}
cv.addEventListener('pointerdown',function(e){if(!S||!S.run||drag)return;var q=pos(e),p=pieceAt(q[0],q[1]);if(!p)return;e.preventDefault();try{cv.setPointerCapture(e.pointerId)}catch(_){}
drag={p:p,id:e.pointerId,dx:q[0]-(ox+p.x*cell),dy:q[1]-(oy+p.y*cell),x:q[0],y:q[1]};S.pieces.splice(S.pieces.indexOf(p),1);S.pieces.push(p);tone(440,.04,.04)});
cv.addEventListener('pointermove',function(e){if(!drag||e.pointerId!==drag.id)return;e.preventDefault();var q=pos(e);drag.x=q[0];drag.y=q[1]});
function drop(e){if(!drag||e.pointerId!==drag.id)return;var p=drag.p,nx=Math.round((drag.x-drag.dx-ox)/cell),ny=Math.round((drag.y-drag.dy-oy)/cell);drag=null;
if((nx!==p.x||ny!==p.y)&&WB.fits(S.pieces,p,nx,ny)){p.x=nx;p.y=ny;tone(520,.05,.05);check()}}
cv.addEventListener('pointerup',drop);cv.addEventListener('pointercancel',drop);
function check(){var res=WB.scan(WB.buildGrid(S.pieces),dict(),S.found);if(!res.length)return;var now=performance.now();
res.forEach(function(r,i){S.score+=r.pts;S.words.push({w:r.w,pts:r.pts,t:(now-S.t0)/1000});var minY=99,sx=0;r.cells.forEach(function(c){minY=Math.min(minY,c[1]);sx+=c[0]});S.fx.push({cells:r.cells,t0:now});
S.tips.push({txt:r.w.toUpperCase()+' (+'+r.pts+')',x:ox+(sx/r.cells.length+.5)*cell,y:oy+minY*cell-6-i*30,t0:now+i*120})});
tone(880,.12,.07);setTimeout(function(){tone(1175,.1,.05)},70);$('wc').textContent='WORDS: '+S.words.length;S.hint='';setInfo()}
function finish(){S.run=false;var el=(S.m==='practice'?(performance.now()-S.t0)/1000:80-Math.max(0,S.t));el=Math.max(1,el);
var key='wb_best_'+S.m,best=+(lsGet(key)||0),nb=S.m!=='practice'&&S.score>best;if(nb)lsSet(key,String(S.score));
var lw=S.words.reduce(function(a,w){return w.w.length>a.length?w.w:a},''),n3=S.words.filter(function(w){return w.w.length===3}).length,n6=S.words.filter(function(w){return w.w.length>=6}).length,pts3=n3*100,wps=S.words.length/el;
var tips=[];if(wps<1)tips.push('You found '+wps.toFixed(2)+' words/sec. The pro run in the video hit about 2.1/sec (169 words in 80s). Speed comes from swapping one tile, not rebuilding.');
if(n6<3)tips.push('Only '+n6+' words of 6+ letters. One 6-letter word = 1,400 pts, 14 times a 3-letter word. Hunt for a long stem first.');
if(S.words.length&&pts3/S.score>0.25)tips.push(Math.round(pts3/S.score*100)+'% of your points came from 3-letter words. Spend that time extending words instead.');
tips.push('Build a vertical stem in the middle (like -ATERS or -INGS), then keep swapping the top tile: CATERS, DATERS, OATERS. Every swap also re-scores the shorter words inside.');
tips.push('Blocks are prefixes and suffixes: put ER, ED, IN, ES at word ends and TH, CH, RE at the start.');
var kids=[el('h1',{text:S.m==='practice'?'Practice summary':'Time!'}),el('p',{text:'Board #'+S.code+' \u00b7 '+NAMES[S.m]+(nb?' \u00b7 New best!':'')}),
el('div',{'class':'grid'},[[S.score.toLocaleString(),'score'],[String(S.words.length),'words'],[wps.toFixed(2),'words / sec'],[lw?lw.toUpperCase():'-','longest word']].map(function(a){return el('div',null,[el('b',{text:a[0]}),el('small',{text:a[1]})])})),
el('h2',{text:'Tips'}),el('ul',null,tips.map(function(t){return el('li',{text:t})})),
el('div',{'class':'row'},[el('button',{id:'sAgain',text:'Same board again'}),el('button',{id:'sNew',text:'New board'}),el('button',{id:'sBest',text:'Show best possible words'}),el('button',{id:'sMenu',text:'Menu'})]),el('div',{id:'bestW','class':'wl'})];
if(S.words.length){kids.push(el('h2',{text:'Your words'}));kids.push(el('div',{'class':'wl',text:S.words.slice().sort(function(a,b){return b.w.length-a.w.length}).map(function(w){return w.w.toUpperCase()}).join(' ')}))}
var sm=$('sum');while(sm.firstChild)sm.removeChild(sm.firstChild);kids.forEach(function(k){sm.appendChild(k)});sm.classList.remove('hide');tone(330,.3,.08);
var code=S.code,m=S.m,pc=S.pieces.map(function(p){return{id:p.id,t:p.t,l:p.l}});
sm.querySelector('#sAgain').onclick=function(){start(m==='classic'?'replay':m,code)};sm.querySelector('#sNew').onclick=function(){start(m==='replay'?'classic':m)};sm.querySelector('#sMenu').onclick=$('bMenu').onclick;
sm.querySelector('#sBest').onclick=function(){var sol=WB.solve(pc,dict(),{limit:2000});var tot=0;sol.forEach(function(s){tot+=s.pts});
var bw=sm.querySelector('#bestW');while(bw.firstChild)bw.removeChild(bw.firstChild);bw.appendChild(el('h2',{text:'Best possible words'}));bw.appendChild(el('p',{text:'Solver estimate: every word that these pieces can spell in one line ('+sol.length+' words, '+tot.toLocaleString()+' pts if you found them all). It does not check whether all of them fit on the board at once.'}));bw.appendChild(document.createTextNode(sol.slice(0,150).map(function(s){return s.w.toUpperCase()}).join(' ')))}}
function rr(x,y,w,h,r){X.beginPath();X.moveTo(x+r,y);X.arcTo(x+w,y,x+w,y+h,r);X.arcTo(x+w,y+h,x,y+h,r);X.arcTo(x,y+h,x,y,r);X.arcTo(x,y,x+w,y,r);X.closePath()}
function tile(p,px,py,lift){var s=WB.size(p),w=s[0]*cell,h=s[1]*cell,m=Math.max(2,cell*.05);
X.save();X.shadowColor='rgba(0,0,0,'+(lift?.45:.3)+')';X.shadowBlur=lift?14:4;X.shadowOffsetY=lift?8:2;X.fillStyle='#d9ae73';rr(px+m,py+m,w-2*m,h-2*m,cell*.14);X.fill();X.restore();
var g=X.createLinearGradient(0,py,0,py+h);g.addColorStop(0,'#f1d3a1');g.addColorStop(1,'#d8ac70');X.fillStyle=g;rr(px+m,py+m,w-2*m,h-2*m,cell*.14);X.fill();
X.strokeStyle='rgba(120,80,30,.35)';X.lineWidth=1;X.stroke();X.fillStyle='#111';X.font='800 '+Math.round(cell*.56)+'px -apple-system,system-ui,Helvetica,Arial,sans-serif';X.textAlign='center';X.textBaseline='middle';
WB.cellsOf({t:p.t,l:p.l,x:0,y:0}).forEach(function(c){X.fillText(c[2],px+(c[0]+.5)*cell,py+(c[1]+.53)*cell)});
if(p.t!=='s'){X.strokeStyle='rgba(120,80,30,.25)';X.beginPath();if(p.t==='h'){X.moveTo(px+cell,py+cell*.2);X.lineTo(px+cell,py+cell*.8)}else{X.moveTo(px+cell*.2,py+cell);X.lineTo(px+cell*.8,py+cell)}X.stroke()}}
function frame(now){if(dead)return;requestAnimationFrame(frame);X.clearRect(0,0,W,H);X.fillStyle='#0d2747';X.fillRect(0,0,W,H);
for(var y=0;y<ROWS;y++)for(var x=0;x<COLS;x++){X.fillStyle=(x+y)%2?'#1d4a7f':'#245a96';X.fillRect(ox+x*cell,oy+y*cell,cell,cell)}
if(!S)return;var dt=Math.max(0,Math.min(.1,(now-S.last)/1000));S.last=now;
if(S.run&&S.t!==Infinity){S.t-=dt;if(S.t<=0){S.t=0;finish()}}
var tm=$('tm');if(S.t===Infinity)tm.textContent='\u221e';else{var sec=Math.ceil(S.t);tm.textContent=Math.floor(sec/60)+':'+('0'+sec%60).slice(-2);tm.classList.toggle('low',sec<=10)}
S.shown+=(S.score-S.shown)*Math.min(1,dt*8);if(Math.abs(S.score-S.shown)<1)S.shown=S.score;$('sc').textContent=Math.round(S.shown).toLocaleString();
S.fx=S.fx.filter(function(f){var a=1-(now-f.t0)/700;if(a<=0)return false;X.save();X.shadowColor='rgba(255,255,255,'+a+')';X.shadowBlur=cell*.6;X.fillStyle='rgba(255,255,255,'+(a*.85)+')';
var xs=f.cells.map(function(c){return c[0]}),ys=f.cells.map(function(c){return c[1]}),x0=Math.min.apply(0,xs),y0=Math.min.apply(0,ys),x1=Math.max.apply(0,xs)+1,y1=Math.max.apply(0,ys)+1,pad=cell*.08;
rr(ox+x0*cell-pad,oy+y0*cell-pad,(x1-x0)*cell+2*pad,(y1-y0)*cell+2*pad,cell*.25);X.fill();X.restore();return true});
S.pieces.forEach(function(p){if(drag&&drag.p===p)return;tile(p,ox+p.x*cell,oy+p.y*cell,false)});
if(drag){var s=WB.size(drag.p),nx=Math.round((drag.x-drag.dx-ox)/cell),ny=Math.round((drag.y-drag.dy-oy)/cell),ok=WB.fits(S.pieces,drag.p,nx,ny);
if(ok){X.fillStyle='rgba(255,255,255,.18)';X.fillRect(ox+nx*cell,oy+ny*cell,s[0]*cell,s[1]*cell)}tile(drag.p,drag.x-drag.dx,drag.y-drag.dy-cell*.12,true)}
S.tips=S.tips.filter(function(t){var k=(now-t.t0)/1100;if(k>1)return false;if(k<0)return true;var a=k<.7?1:1-(k-.7)/.3,yy=t.y-k*cell*1.2;
X.save();X.globalAlpha=a;X.font='800 '+Math.max(12,Math.round(cell*.34))+'px -apple-system,system-ui,Helvetica,Arial,sans-serif';var tw=X.measureText(t.txt).width+20,th=Math.max(22,cell*.55),tx=Math.max(4,Math.min(W-tw-4,t.x-tw/2));
X.shadowColor='rgba(0,0,0,.3)';X.shadowBlur=6;X.fillStyle='#fff';rr(tx,yy-th,tw,th,th/2);X.fill();X.shadowBlur=0;X.fillStyle='#000';X.textAlign='center';X.textBaseline='middle';X.fillText(t.txt,tx+tw/2,yy-th/2+1);X.restore();return true})}
var dead=false;requestAnimationFrame(frame);
return function(){dead=true;removeEventListener('resize',resize)}}
