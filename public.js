const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const mapsLink=q=>'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(q);
const link=(q,label)=>`<a href="${esc(mapsLink(q))}" target="_blank" rel="noopener noreferrer">${esc(label)} ↗</a>`;
const dateLabel=d=>d.slice(5).replace('-','/');
let current=0,maps=[];
const visible=()=>DAYS.map((d,i)=>({d,i})).filter(x=>!$('city').value||x.d.city.includes($('city').value));
for(const city of [...new Set(DAYS.flatMap(d=>d.city.split(' · ')))]){const o=document.createElement('option');o.textContent=city;$('city').append(o)}
const symbols={restaurant:'餐',coffee:'咖',boat:'⛴',bar:'酒',snack:'食',viewpoint:'景'};
function render(){
 maps.forEach(m=>m.remove());maps=[];const d=DAYS[current],days=visible();
 $('dates').innerHTML=days.map(({d,i})=>`<button data-day="${i}" aria-current="${i===current}"><small>${new Intl.DateTimeFormat('zh-CN',{weekday:'short',timeZone:'UTC'}).format(new Date(d.date+'T12:00:00Z'))}</small><span>${dateLabel(d.date)}</span></button>`).join('');
 $('title').textContent=dateLabel(d.date)+' · '+d.city;
 $('prev').disabled=current===days[0].i;$('next').disabled=current===days.at(-1).i;
 $('content').innerHTML=`<article><h3>当天行程</h3>${d.hotel?`<p class="hotel">住宿 · ${esc(d.hotel)}</p>`:''}<ol class="timeline">${d.events.map(e=>`<li><time>${esc(e.time)}</time><p>${esc(e.title)}</p></li>`).join('')}</ol></article>
 ${d.routes.map((g,k)=>`<article><h3>${esc(g.title)}</h3><div class="map" id="map-${k}"></div><p class="small">数字为游览顺序，虚线仅连接地点，不代表实际道路。餐饮与船点不接入路线。</p><button data-base="${k}">加载街道底图（需联网）</button><p class="map-note" id="map-note-${k}" role="status">当前为位置示意，可拖动、缩放并点击标记。</p><ol class="stops">${g.stops.map(s=>`<li>${link(s.query,s.name)}</li>`).join('')}</ol></article>`).join('')}
 ${d.choices.length?`<details open><summary>餐饮与可选去处 · ${d.choices.length}</summary><p class="small">旅行收藏，按时间与营业情况选择。</p><div class="places">${d.choices.map(x=>`<div class="place">${link(x.query,(symbols[x.type]||'·')+' '+x.title)}</div>`).join('')}</div></details>`:''}`;
 d.routes.forEach((g,k)=>{const map=L.map('map-'+k,{scrollWheelZoom:false});maps.push(map);let points=g.stops.map(s=>s.point).filter(Boolean);if(points.length>1)L.polyline(points,{color:'#196d63',weight:3,dashArray:'7 9'}).addTo(map);
 const marker=(p,title,text,kind='')=>L.marker(p,{title,icon:L.divIcon({className:'',html:`<span class="pin ${kind}">${esc(text)}</span>`,iconSize:[32,32],iconAnchor:[16,16]})}).addTo(map).bindTooltip(title).bindPopup(esc(title));
 g.stops.forEach((s,i)=>s.point&&marker(s.point,s.name,i+1));
 for(const x of d.choices){if(!x.point)continue;const near=points.some(p=>Math.abs(p[0]-x.point[0])+Math.abs(p[1]-x.point[1])<.6);if(!near)continue;marker(x.point,x.title,symbols[x.type]||'·',x.type==='boat'?'boat-pin':x.type==='coffee'?'coffee-pin':'food-pin');points.push(x.point)}
 if(points.length)map.fitBounds(L.latLngBounds(points),{padding:[36,36],maxZoom:15});else map.setView([41.9,12.49],5);
 });
}
$('dates').onclick=e=>{const b=e.target.closest('[data-day]');if(b){current=+b.dataset.day;render()}};
$('city').onchange=()=>{current=visible()[0].i;render()};
for(const [id,delta]of [['prev',-1],['next',1]])$(id).onclick=()=>{const ids=visible().map(x=>x.i);const i=ids[ids.indexOf(current)+delta];if(i!==undefined){current=i;render()}};
$('content').onclick=e=>{const b=e.target.closest('[data-base]');if(!b)return;const k=+b.dataset.base;b.disabled=true;$('map-note-'+k).textContent='正在加载街道底图…';let failed=false;const statusNode=$('map-note-'+k);setTimeout(()=>{if(statusNode.textContent.includes('正在加载'))statusNode.textContent='当前网络无法加载底图，地点与路线示意仍可使用。'},4000);L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'}).addTo(maps[k]).on('tileerror',()=>{failed=true;$('map-note-'+k).textContent='当前网络无法加载底图，地点与路线示意仍可使用。'}).on('load',()=>{if(!failed)$('map-note-'+k).textContent='街道底图已加载，虚线仍为顺序示意。'})};
render();
