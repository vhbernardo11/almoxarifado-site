(function(){
'use strict';
var ESF_LAT=-22.5279977,ESF_LON=-52.1702453;
var GEO_API='https://pvwqxpqetdxtmqqypqjk.supabase.co/functions/v1/acs-geo-capture-v1';
function fmtM(m){m=Number(m);return m<1000?Math.round(m)+' m':(m/1000).toFixed(2).replace('.',',')+' km'}
function fmtMin(s){if(!s)return '';return ' · ~'+Math.max(1,Math.round(Number(s)/60))+' min a pé'}
function key(){return new URL(location.href).searchParams.get('k')||localStorage.getItem('esf06_visit_key')||''}
function mapsUrl(p){return 'https://www.google.com/maps/dir/?api=1&origin='+p.latitude+','+p.longitude+'&destination='+ESF_LAT+','+ESF_LON+'&travelmode=walking'}
function compassStart(setHeading,setText){
  try{
    if(typeof DeviceOrientationEvent==='undefined'){setText('Bússola não disponível neste aparelho');return}
    var handler=function(e){var h=null;if(typeof e.webkitCompassHeading==='number')h=e.webkitCompassHeading;else if(e.alpha!=null&&(e.absolute===true||e.type==='deviceorientationabsolute'))h=(360-Number(e.alpha)+360)%360;if(h!=null&&isFinite(h)){setHeading(h);setText('Rumo '+Math.round(h)+'°')}};
    var listen=function(){window.addEventListener('deviceorientationabsolute',handler,true);window.addEventListener('deviceorientation',handler,true)};
    if(typeof DeviceOrientationEvent.requestPermission==='function'){
      DeviceOrientationEvent.requestPermission().then(function(p){if(p==='granted')listen();else setText('Permissão da bússola não concedida')}).catch(function(){setText('Bússola sem permissão')});
    }else listen();
  }catch(e){setText('Bússola indisponível')}
}
window.esf06GeoCapture=function(familyId){
  if(!navigator.geolocation){alert('Este navegador não oferece geolocalização.');return}
  var back=document.createElement('div');back.className='gps-back';
  back.innerHTML='<div class="gps-modal"><h2>📍 Confirmar localização da casa</h2><p>Fique próximo à entrada do imóvel. O Gestão vai buscar o melhor ponto GPS por alguns segundos e usar a ESF 6 Pontal como destino.</p><div id="gps-state" class="gps-state">Ativando GPS de alta precisão…</div><div class="gps-grid"><div class="gps-kpi"><b id="gps-acc">—</b><span>Precisão do GPS</span></div><div class="gps-kpi"><b id="gps-compass">—</b><span>Bússola / rumo</span></div></div><div class="gps-kpi"><b id="gps-route">Aguardando GPS</b><span>Rota até ESF 6 Pontal · Rua José Morais, 1432</span></div><div class="gps-actions"><button type="button" class="gps-confirm" id="gps-confirm" disabled>Confirmar e salvar ponto</button><button type="button" class="gps-map" id="gps-map" disabled>Abrir rota no Maps</button><button type="button" class="gps-retry" id="gps-retry">Tentar GPS novamente</button><button type="button" class="gps-close" id="gps-close">Fechar</button></div></div>';
  document.body.appendChild(back);
  var stateEl=back.querySelector('#gps-state'),accEl=back.querySelector('#gps-acc'),compassEl=back.querySelector('#gps-compass'),routeEl=back.querySelector('#gps-route'),confirmBtn=back.querySelector('#gps-confirm'),mapBtn=back.querySelector('#gps-map'),retryBtn=back.querySelector('#gps-retry'),closeBtn=back.querySelector('#gps-close');
  var best=null,watch=null,timer=null,heading=null,savedMaps=null;
  function setHeading(h){heading=h}
  function setCompass(t){compassEl.textContent=t}
  compassStart(setHeading,setCompass);
  function stop(){if(watch!=null){navigator.geolocation.clearWatch(watch);watch=null}if(timer){clearTimeout(timer);timer=null}}
  function finish(){stop();if(!best)return;confirmBtn.disabled=false;mapBtn.disabled=false;stateEl.className='gps-state '+(best.accuracy<=50?'good':'warn');stateEl.textContent=best.accuracy<=50?'Ponto GPS pronto para confirmar.':'GPS encontrado, mas a precisão está acima de 50 m. Se puder, toque em “Tentar GPS novamente” do lado de fora.'}
  function start(){
    stop();best=null;confirmBtn.disabled=true;mapBtn.disabled=true;routeEl.textContent='Aguardando GPS';accEl.textContent='—';stateEl.className='gps-state';stateEl.textContent='Buscando sinal GPS de alta precisão…';
    watch=navigator.geolocation.watchPosition(function(pos){var p={latitude:pos.coords.latitude,longitude:pos.coords.longitude,accuracy:Number(pos.coords.accuracy||9999)};if(!best||p.accuracy<best.accuracy)best=p;accEl.textContent='± '+Math.round(best.accuracy)+' m';routeEl.textContent='Ponto capturado · pronto para calcular rota';if(best.accuracy<=15)finish();},function(err){stop();stateEl.className='gps-state warn';stateEl.textContent=err.code===1?'Permissão de localização negada. Libere o GPS para este site nas configurações do navegador.':'Não consegui fixar sua posição. Ative o GPS e tente novamente.';},{enableHighAccuracy:true,maximumAge:0,timeout:20000});
    timer=setTimeout(finish,12000);
  }
  retryBtn.onclick=start;
  closeBtn.onclick=function(){stop();back.remove()};
  back.onclick=function(e){if(e.target===back){stop();back.remove()}};
  mapBtn.onclick=function(){if(savedMaps)window.open(savedMaps,'_blank');else if(best)window.open(mapsUrl(best),'_blank')};
  confirmBtn.onclick=async function(){
    if(!best)return;confirmBtn.disabled=true;retryBtn.disabled=true;stateEl.className='gps-state';stateEl.textContent='Salvando GPS e calculando a rota a pé…';
    try{
      var u=GEO_API+'?api=capture&k='+encodeURIComponent(key());
      var r=await fetch(u,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({family_id:familyId,latitude:best.latitude,longitude:best.longitude,accuracy_m:best.accuracy,heading_deg:heading}),cache:'no-store'});
      var j=await r.json().catch(function(){return {error:'Resposta inválida'}});if(!r.ok)throw new Error(j.error||'Falha ao salvar GPS');
      savedMaps=j.maps_url||mapsUrl(best);stateEl.className='gps-state good';stateEl.textContent=j.verified?'GPS confirmado e salvo no Supabase.':'GPS salvo como aproximado. Tente novamente depois para melhorar a precisão.';accEl.textContent='± '+Math.round(Number(j.accuracy_m||best.accuracy))+' m';
      if(j.walk_distance_m!=null)routeEl.textContent='🚶 '+fmtM(j.walk_distance_m)+fmtMin(j.walk_duration_s);else routeEl.textContent='GPS salvo · toque em “Abrir rota no Maps” para a distância caminhando';
      mapBtn.disabled=false;retryBtn.disabled=false;confirmBtn.textContent='Salvo ✓';closeBtn.textContent='Fechar e atualizar';closeBtn.onclick=function(){stop();location.reload()};
    }catch(e){stateEl.className='gps-state warn';stateEl.textContent=e.message||'Falha ao salvar geolocalização';confirmBtn.disabled=false;retryBtn.disabled=false;}
  };
  start();
};
document.addEventListener('click',function(e){var b=e.target&&e.target.closest?e.target.closest('[data-geo-capture-id]'):null;if(!b)return;e.preventDefault();e.stopPropagation();window.esf06GeoCapture(b.getAttribute('data-geo-capture-id'));},true);
})();