// Word Bites core logic (no DOM). Works in browser (window.WB) and node (module.exports).
(function(G){
var COLS=8,ROWS=9;
var PTS={3:100,4:400,5:800,6:1400,7:1800,8:2200,9:2600};
function pts(n){return PTS[n]||(n>9?2600+400*(n-9):0)}
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;var t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
// Seed codes: 6 chars of base32-ish letters/digits, easy to type
var SA='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function newSeedCode(r){var s='';for(var i=0;i<6;i++)s+=SA[Math.floor((r||Math.random)()*SA.length)];return s}
function seedNum(code){code=String(code).toUpperCase().replace(/[^A-Z0-9]/g,'');var h=2166136261;for(var i=0;i<code.length;i++){h^=code.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
// Front-coded dictionary: each entry = digit (shared prefix length with previous) + suffix letters
function decodeCompact(s){var out=[],prev='',i=0,n=s.length;while(i<n){var p=s.charCodeAt(i)-48;i++;var j=i;while(j<n){var c=s.charCodeAt(j);if(c>=48&&c<=57)break;j++}var w=prev.slice(0,p)+s.slice(i,j);out.push(w);prev=w;i=j}return out}
function makeDict(words){var set=new Set(),byLen={};for(var i=0;i<words.length;i++){var w=words[i];if(w.length<3||w.length>9)continue;set.add(w);(byLen[w.length]=byLen[w.length]||[]).push(w)}return{set:set,byLen:byLen,size:set.size}}
// Grid of letters from pieces. piece: {id,t:'s'|'h'|'v',l:'A'|'EX',x,y}
function cellsOf(p){if(p.t==='h')return[[p.x,p.y,p.l[0]],[p.x+1,p.y,p.l[1]]];if(p.t==='v')return[[p.x,p.y,p.l[0]],[p.x,p.y+1,p.l[1]]];return[[p.x,p.y,p.l]]}
function size(p){return p.t==='h'?[2,1]:p.t==='v'?[1,2]:[1,1]}
function buildGrid(pieces){var g=[];for(var y=0;y<ROWS;y++){g.push(new Array(COLS).fill(null))}pieces.forEach(function(p){cellsOf(p).forEach(function(c){if(c[1]>=0&&c[1]<ROWS&&c[0]>=0&&c[0]<COLS)g[c[1]][c[0]]=c[2]})});return g}
function fits(pieces,p,x,y){var s=size(p);if(x<0||y<0||x+s[0]>COLS||y+s[1]>ROWS)return false;var g=buildGrid(pieces.filter(function(q){return q!==p&&q.id!==p.id}));for(var dx=0;dx<s[0];dx++)for(var dy=0;dy<s[1];dy++)if(g[y+dy][x+dx])return false;return true}
// Scan every maximal horizontal/vertical run; score every valid substring (len>=3) not already found.
function scan(grid,dict,found){var res=[];function run(cells){if(cells.length<3)return;var s=cells.map(function(c){return c[2]}).join('').toLowerCase();for(var len=Math.min(9,s.length);len>=3;len--)for(var i=0;i+len<=s.length;i++){var w=s.substr(i,len);if(dict.set.has(w)&&!found.has(w)){found.add(w);res.push({w:w,pts:pts(len),cells:cells.slice(i,i+len).map(function(c){return[c[0],c[1]]})})}}}
for(var y=0;y<ROWS;y++){var cur=[];for(var x=0;x<=COLS;x++){var L=x<COLS?grid[y][x]:null;if(L)cur.push([x,y,L]);else{run(cur);cur=[]}}}
for(var x2=0;x2<COLS;x2++){var cur2=[];for(var y2=0;y2<=ROWS;y2++){var L2=y2<ROWS?grid[y2][x2]:null;if(L2)cur2.push([x2,y2,L2]);else{run(cur2);cur2=[]}}}
return res}
// Solver: can a word be built from pieces in a direction? Inline blocks contribute both letters in order;
// cross blocks contribute one letter (other half hangs off, allowed); singles contribute one.
function canBuild(word,pieces,dir){if(word.length>(dir==='h'?COLS:ROWS))return null;var W=word.toUpperCase(),used=new Array(pieces.length).fill(false),path=[];
function rec(i){if(i===W.length)return true;for(var k=0;k<pieces.length;k++){if(used[k])continue;var p=pieces[k];
if(p.t==='s'){if(p.l===W[i]){used[k]=true;path.push(k);if(rec(i+1))return true;path.pop();used[k]=false}}
else if(p.t===dir){if(p.l[0]===W[i]&&p.l[1]===W[i+1]){used[k]=true;path.push(k);if(rec(i+2))return true;path.pop();used[k]=false}}
else{if(p.l[0]===W[i]||p.l[1]===W[i]){used[k]=true;path.push(k);if(rec(i+1))return true;path.pop();used[k]=false}}}
return false}
// quick letter-count prefilter
return rec(0)?path.slice():null}
function letterPool(pieces){var c={};pieces.forEach(function(p){for(var i=0;i<p.l.length;i++)c[p.l[i]]=(c[p.l[i]]||0)+1});return c}
function poolOk(word,pool){var c={};for(var i=0;i<word.length;i++){var L=word[i].toUpperCase();c[L]=(c[L]||0)+1;if(c[L]>(pool[L]||0))return false}return true}
function solve(pieces,dict,opt){opt=opt||{};var minLen=opt.minLen||3,limit=opt.limit||1e9,out=[],pool=letterPool(pieces);
for(var len=9;len>=minLen;len--){var L=dict.byLen[len]||[];for(var i=0;i<L.length;i++){var w=L[i];if(!poolOk(w,pool))continue;var d=null;if(canBuild(w,pieces,'v'))d='v';else if(canBuild(w,pieces,'h'))d='h';if(d){out.push({w:w,dir:d,pts:pts(len)});if(out.length>=limit)return out}}}return out}
// Board generation (GamePigeon's real algorithm is undocumented; this is an approximation)
var FREQ={E:12,A:9,I:9,O:8,N:6,R:6,T:6,L:4,S:5,U:4,D:4,G:3,B:2,C:2,M:2,P:2,F:2,H:2,V:1,W:2,Y:2,K:1,J:1,X:1,Q:1,Z:1};
var VOW='AEIOU';
var BLOCKS=['TH','CH','SH','ER','IN','ED','ON','RE','ES','AN','EX','QU','ST','EN','AT','OR','AR','ING'.slice(0,2),'LE','OU','EA','AL','IT','IS','UN','LY','OW','PU','TB','CK','GH','PH','TR','DE','RA','TE','TI','OL','IC','EL'];
function pickW(r,map){var tot=0,k;for(k in map)tot+=map[k];var x=r()*tot;for(k in map){x-=map[k];if(x<0)return k}return 'E'}
function makePieces(r){var nS=8,nH=3+Math.floor(r()*2),nV=Math.floor(r()*3),ps=[],id=0,i;
var singles=[];for(i=0;i<nS;i++)singles.push(pickW(r,FREQ));var vc=singles.filter(function(c){return VOW.indexOf(c)>=0}).length;
while(vc<3){var j=Math.floor(r()*nS);if(VOW.indexOf(singles[j])<0){singles[j]=pickW(r,{A:9,E:12,I:8,O:8,U:3});vc++}}
// limit hard letters
singles.forEach(function(c){ps.push({id:id++,t:'s',l:c})});
function blk(){if(r()<0.7)return BLOCKS[Math.floor(r()*BLOCKS.length)];var a=pickW(r,FREQ),b=pickW(r,FREQ);if(VOW.indexOf(a)<0&&VOW.indexOf(b)<0)b=pickW(r,{A:9,E:12,I:8,O:8,U:3});return a+b}
for(i=0;i<nH;i++)ps.push({id:id++,t:'h',l:blk()});for(i=0;i<nV;i++)ps.push({id:id++,t:'v',l:blk()});
var q=ps.filter(function(p){return p.l.indexOf('Q')>=0&&p.l!=='QU'});q.forEach(function(p){p.l=p.l.replace('Q','K')});
return ps}
function scatter(pieces,r){for(var tries=0;tries<400;tries++){var ok=true,placed=[];for(var i=0;i<pieces.length&&ok;i++){var p=pieces[i],s=size(p),done=false;for(var t=0;t<200&&!done;t++){var x=Math.floor(r()*(COLS-s[0]+1)),y=Math.floor(r()*(ROWS-s[1]+1));if(isolated(placed,p,x,y)){p.x=x;p.y=y;placed.push(p);done=true}}if(!done)ok=false}if(ok)return true}
// fallback: allow touching but no overlap
var placed2=[];pieces.forEach(function(p){var s=size(p);for(var t=0;t<2000;t++){var x=Math.floor(r()*(COLS-s[0]+1)),y=Math.floor(r()*(ROWS-s[1]+1));if(fits(placed2,p,x,y)){p.x=x;p.y=y;placed2.push(p);return}}});return false}
function isolated(placed,p,x,y){var s=size(p),g=buildGrid(placed);for(var dx=-1;dx<=s[0];dx++)for(var dy=-1;dy<=s[1];dy++){var X=x+dx,Y=y+dy;if(X<0||Y<0||X>=COLS||Y>=ROWS)continue;if(g[Y][X])return false}return true}
function generate(code,dict){var r=mulberry32(seedNum(code)),ps=null;for(var a=0;a<60;a++){ps=makePieces(r);if(!dict||solve(ps,dict,{minLen:6,limit:1}).length)break}scatter(ps,r);return ps}
var STEMS=['aters','angers','ances','artels','aster','ating','ailers','eaters','ashes','owing','ines','ears','ales','ates','ight'];
function stemBoard(code,dict){var r=mulberry32(seedNum(code)^0x5bd1e995),cands=[];STEMS.forEach(function(st){var pre='abcdefghijklmnopqrstuvwxyz'.split('').filter(function(c){return dict.set.has(c+st)});if(pre.length>=4)cands.push({st:st,pre:pre})});
var c=cands[Math.floor(r()*cands.length)]||{st:'ates',pre:['d','g','h','l','m','r']};var st=c.st.toUpperCase(),ps=[],id=0,i=0;
// stem: vertical blocks + singles
while(i<st.length){if(st.length-i>=2&&r()<0.6){ps.push({id:id++,t:'v',l:st.substr(i,2)});i+=2}else{ps.push({id:id++,t:'s',l:st[i]});i++}}
var stemN=ps.length,pre=c.pre.slice().sort(function(){return r()-0.5}).slice(0,6);pre.forEach(function(L){ps.push({id:id++,t:'s',l:L.toUpperCase()})});
['S','R','E'].forEach(function(L){if(ps.length<14)ps.push({id:id++,t:'s',l:L})});
ps.push({id:id++,t:'h',l:BLOCKS[Math.floor(r()*12)]});
// place stem in column 3 with one-row gaps so the player assembles it, others scattered
var y=0;for(var k=0;k<stemN;k++){ps[k].x=3;ps[k].y=y;y+=size(ps[k])[1]+1}y--;
// shift stem down to start at row 1 if room
var stemH=y;var off=Math.max(0,Math.floor((ROWS-stemH)/2));for(k=0;k<stemN;k++)ps[k].y+=off;
var rest=ps.slice(stemN),placed=ps.slice(0,stemN);rest.forEach(function(p){var s=size(p);for(var t=0;t<3000;t++){var x=Math.floor(r()*(COLS-s[0]+1)),yy=Math.floor(r()*(ROWS-s[1]+1));if(Math.abs(x-3)<=1&&t<2000)continue;if(fits(placed,p,x,yy)&&(t>1500||isolated(placed,p,x,yy))){p.x=x;p.y=yy;placed.push(p);return}}});
return{pieces:ps,stem:c.st,prefixes:c.pre}}
var API={COLS:COLS,ROWS:ROWS,pts:pts,mulberry32:mulberry32,newSeedCode:newSeedCode,seedNum:seedNum,decodeCompact:decodeCompact,makeDict:makeDict,cellsOf:cellsOf,size:size,buildGrid:buildGrid,fits:fits,scan:scan,canBuild:canBuild,solve:solve,generate:generate,stemBoard:stemBoard,STEMS:STEMS};
if(typeof module!=='undefined'&&module.exports)module.exports=API;else G.WB=API;
})(typeof window!=='undefined'?window:this);
