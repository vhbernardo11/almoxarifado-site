(()=>{
'use strict';

const CONFIG=Object.freeze({
  moduleVersion:'R2',
  pecOrigin:'https://esus.teodorosampaio.sp.gov.br',
  loginPath:'/api/recebimento/login',
  fichaPath:'/api/v1/recebimento/ficha',
  observedFrontendVersion:'5.5.24',
  transmissionEnabled:false,
  storageKey:'acs360_esus_diagnostic_v1'
});

const loginUrl=CONFIG.pecOrigin+CONFIG.loginPath;
const fichaUrl=CONFIG.pecOrigin+CONFIG.fichaPath;

function esc(value){
  return String(value??'').replace(/[&<>"']/g,char=>({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[char]));
}

function readLastTest(){
  try{
    const value=JSON.parse(localStorage.getItem(CONFIG.storageKey)||'null');
    return value&&typeof value==='object'?value:null;
  }catch(_error){
    return null;
  }
}

function saveLastTest(value){
  try{localStorage.setItem(CONFIG.storageKey,JSON.stringify(value))}catch(_error){}
}

function formatDate(value){
  if(!value)return 'Ainda não executado neste aparelho';
  try{return new Intl.DateTimeFormat('pt-BR',{dateStyle:'short',timeStyle:'medium'}).format(new Date(value))}
  catch(_error){return String(value)}
}

function mount(){
  if(document.getElementById('esus-v41-btn'))return;

  const style=document.createElement('style');
  style.id='esus-v41-style';
  style.textContent=`
#esus-v41-btn{position:fixed;right:14px;bottom:78px;z-index:430;border:0;border-radius:999px;background:#071a31;color:#fff;padding:11px 14px;font:800 12px system-ui;box-shadow:0 8px 24px #0015;cursor:pointer}
#esus-v41-btn b{color:#66e0ca}.esus41-back{position:fixed;inset:0;z-index:700;background:#071a31cc;display:grid;place-items:end center;padding:12px}.esus41-card{width:min(100%,680px);max-height:92vh;overflow:auto;background:#fff;border-radius:24px;padding:18px;box-sizing:border-box}.esus41-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}.esus41-head h2{margin:0}.esus41-x{border:0;background:#eef2f6;border-radius:50%;width:40px;height:40px;font-size:22px;cursor:pointer}.esus41-state{margin:15px 0;padding:14px;border-radius:16px;font-weight:800;line-height:1.42}.esus41-state.ready{background:#eaf9f2;color:#216c4e}.esus41-state.testing{background:#eef5ff;color:#365d8c}.esus41-state.good{background:#eaf9f2;color:#216c4e}.esus41-state.warn{background:#fff7df;color:#705600}.esus41-state.bad{background:#fff0f0;color:#9b3037}.esus41-state small{display:block;margin-top:4px;font-weight:650}.esus41-grid{display:grid;grid-template-columns:1fr 1fr;gap:9px}.esus41-kpi{border:1px solid #dfe6ed;border-radius:15px;padding:12px;min-width:0}.esus41-kpi b{display:block;font-size:15px;overflow-wrap:anywhere}.esus41-kpi span{font-size:12px;color:#708096}.esus41-ok{color:#087866!important}.esus41-pending{color:#8a6500!important}.esus41-lock{color:#9b3037!important}.esus41-endpoints{margin-top:12px;border:1px solid #dfe6ed;border-radius:16px;padding:12px;background:#f8fafc}.esus41-endpoints strong{display:block;margin-bottom:8px}.esus41-url{font:700 12px ui-monospace,SFMono-Regular,Consolas,monospace;overflow-wrap:anywhere;color:#315779;padding:7px 0}.esus41-checks{margin:13px 0 0;padding:0;list-style:none;display:grid;gap:7px}.esus41-checks li{display:flex;gap:8px;align-items:flex-start;color:#526176;font-size:13px}.esus41-actions{display:grid;grid-template-columns:1.4fr 1fr;gap:8px;margin-top:14px}.esus41-actions button{border:0;border-radius:13px;padding:12px;min-height:48px;font-weight:900;cursor:pointer}.esus41-test{background:#079b88;color:#fff}.esus41-copy{background:#eef2f6;color:#314158}.esus41-actions button:disabled{opacity:.55;cursor:wait}.esus41-note{margin:14px 0 0;color:#526176;line-height:1.48;font-size:13px}.esus41-foot{margin-top:10px;color:#708096;font-size:12px}.esus41-live{font-weight:800}
@media(min-width:720px){.esus41-back{place-items:center}}
@media(max-width:520px){.esus41-grid,.esus41-actions{grid-template-columns:1fr}}
`;
  document.head.appendChild(style);

  const button=document.createElement('button');
  button.id='esus-v41-btn';
  button.type='button';
  button.innerHTML='e-SUS <b>MAPEADO</b>';
  button.setAttribute('aria-haspopup','dialog');
  button.onclick=openPanel;
  document.body.appendChild(button);
}

function panelMarkup(){
  const last=readLastTest();
  const lastClass=last?.ok?'good':'ready';
  const lastTitle=last?.ok?'Último teste: servidor alcançável':'Servidor PEC identificado';
  const lastDetail=last?.ok
    ?`${formatDate(last.at)} · ${Number.isFinite(last.elapsedMs)?last.elapsedMs+' ms · ':''}sem autenticação`
    :'Clique em “Testar servidor” para verificar somente o alcance HTTPS.';

  return `<section class="esus41-card" role="dialog" aria-modal="true" aria-labelledby="esus41-title">
    <div class="esus41-head">
      <div><h2 id="esus41-title">Integração e-SUS APS</h2><div style="color:#708096;font-size:12px;margin-top:4px">Gestão ACS 360 · diagnóstico seguro ${esc(CONFIG.moduleVersion)}</div></div>
      <button class="esus41-x" type="button" aria-label="Fechar">×</button>
    </div>
    <div class="esus41-state ${lastClass}" data-esus-state role="status" aria-live="polite">
      <span data-esus-state-title>${esc(lastTitle)}</span>
      <small data-esus-state-detail>${esc(lastDetail)}</small>
    </div>
    <div class="esus41-grid">
      <div class="esus41-kpi"><span>Instalação municipal provável</span><b class="esus41-ok">PEC localizado</b></div>
      <div class="esus41-kpi"><span>Servidor</span><b>${esc(new URL(CONFIG.pecOrigin).hostname)}</b></div>
      <div class="esus41-kpi"><span>Frontend PEC observado</span><b>${esc(CONFIG.observedFrontendVersion)}</b></div>
      <div class="esus41-kpi"><span>Versão LEDI aceita</span><b class="esus41-pending">Confirmar com a TI</b></div>
      <div class="esus41-kpi"><span>Credencial dedicada</span><b class="esus41-pending">Pendente</b></div>
      <div class="esus41-kpi"><span>Envio de fichas</span><b class="esus41-lock">Bloqueado</b></div>
    </div>
    <div class="esus41-endpoints">
      <strong>Rotas oficiais identificadas</strong>
      <div class="esus41-url">LOGIN · ${esc(loginUrl)}</div>
      <div class="esus41-url">FICHA · ${esc(fichaUrl)}</div>
    </div>
    <ul class="esus41-checks">
      <li>✅ Domínio, HTTPS e aplicação PEC identificados publicamente.</li>
      <li>✅ Rotas oficiais de login e recebimento localizadas.</li>
      <li>⏳ Credencial exclusiva, versão LEDI e homologação aguardam a TI.</li>
      <li>🔒 O teste não envia CPF, CNS, dados clínicos, senha ou ficha.</li>
    </ul>
    <div class="esus41-actions">
      <button type="button" class="esus41-test" data-esus-test>Testar servidor com segurança</button>
      <button type="button" class="esus41-copy" data-esus-copy>Copiar diagnóstico</button>
    </div>
    <p class="esus41-note">Este site público nunca deve armazenar a senha do PEC. A transmissão real será feita por um serviço intermediário protegido, depois da autorização da Prefeitura.</p>
    <div class="esus41-foot">Teste disponível: alcance de rede e HTTPS. Autenticação e recebimento de LEDI permanecem desativados.</div>
  </section>`;
}

function openPanel(){
  const backdrop=document.createElement('div');
  backdrop.className='esus41-back';
  backdrop.innerHTML=panelMarkup();

  const close=()=>{
    document.removeEventListener('keydown',onKeydown);
    backdrop.remove();
  };
  const onKeydown=event=>{if(event.key==='Escape')close()};

  backdrop.querySelector('.esus41-x').onclick=close;
  backdrop.querySelector('[data-esus-test]').onclick=()=>runSafeTest(backdrop);
  backdrop.querySelector('[data-esus-copy]').onclick=()=>copyDiagnostic(backdrop);
  backdrop.onclick=event=>{if(event.target===backdrop)close()};
  document.addEventListener('keydown',onKeydown);
  document.body.appendChild(backdrop);
  backdrop.querySelector('.esus41-x').focus();
}

function setState(root,kind,title,detail){
  const state=root.querySelector('[data-esus-state]');
  state.className='esus41-state '+kind;
  state.querySelector('[data-esus-state-title]').textContent=title;
  state.querySelector('[data-esus-state-detail]').textContent=detail;
}

async function runSafeTest(root){
  const button=root.querySelector('[data-esus-test]');
  button.disabled=true;
  button.textContent='Testando…';
  setState(root,'testing','Verificando o servidor PEC…','Uma única requisição HEAD, sem credenciais e sem dados de cidadãos.');

  const controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(),10000);
  const started=performance.now();

  try{
    await fetch(loginUrl,{
      method:'HEAD',
      mode:'no-cors',
      credentials:'omit',
      cache:'no-store',
      redirect:'follow',
      referrerPolicy:'no-referrer',
      signal:controller.signal
    });
    const result={ok:true,at:new Date().toISOString(),elapsedMs:Math.max(1,Math.round(performance.now()-started))};
    saveLastTest(result);
    setState(root,'good','Servidor alcançável por HTTPS',`${formatDate(result.at)} · ${result.elapsedMs} ms · autenticação não testada`);
  }catch(error){
    const detail=error?.name==='AbortError'
      ?'Tempo limite atingido. A rede ou o servidor pode estar indisponível.'
      :'Não foi possível alcançar o servidor neste aparelho. Tente outra rede ou confirme com a TI.';
    const result={ok:false,at:new Date().toISOString(),reason:error?.name||'NetworkError'};
    saveLastTest(result);
    setState(root,'bad','Teste de alcance não concluído',detail);
  }finally{
    clearTimeout(timeout);
    button.disabled=false;
    button.textContent='Testar novamente';
  }
}

async function copyDiagnostic(root){
  const last=readLastTest();
  const report=[
    'Gestão ACS 360 — Diagnóstico e-SUS APS',
    `Servidor: ${CONFIG.pecOrigin}`,
    `Login: ${loginUrl}`,
    `Recebimento: ${fichaUrl}`,
    `Frontend PEC observado: ${CONFIG.observedFrontendVersion}`,
    'Versão LEDI: pendente de confirmação pela TI',
    'Credencial: não configurada',
    'Envio de fichas: bloqueado',
    `Último teste neste aparelho: ${last?formatDate(last.at):'não executado'}`,
    `Resultado: ${last?.ok?'servidor alcançável; autenticação não testada':'sem confirmação local'}`
  ].join('\n');

  const button=root.querySelector('[data-esus-copy]');
  try{
    await navigator.clipboard.writeText(report);
    button.textContent='Diagnóstico copiado';
  }catch(_error){
    const area=document.createElement('textarea');
    area.value=report;area.style.position='fixed';area.style.opacity='0';
    document.body.appendChild(area);area.select();document.execCommand('copy');area.remove();
    button.textContent='Diagnóstico copiado';
  }
  setTimeout(()=>{button.textContent='Copiar diagnóstico'},1800);
}

window.GestaoACS360ESUS=Object.freeze({
  config:CONFIG,
  test:()=>{
    const panel=document.querySelector('.esus41-back');
    return panel?runSafeTest(panel):Promise.reject(new Error('Abra o painel e-SUS primeiro.'));
  }
});

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})();
