(function(){
'use strict';

function activeStatus(modal){
  var b=Array.from(modal.querySelectorAll('[data-rec-status]')).find(function(x){return x.classList.contains('primary')});
  return b?b.dataset.recStatus:'nao_visitado';
}

function addStyles(){
  if(document.getElementById('rec-comodos-r7-style'))return;
  var s=document.createElement('style');
  s.id='rec-comodos-r7-style';
  s.textContent='\n.rec-comodos-required{border:1px solid #f0d27a;background:#fffaf0;border-radius:15px;padding:10px;margin-top:4px}\n.rec-comodos-required label{margin-top:0;color:#725400}\n.rec-comodos-required .rec-required-badge{display:inline-block;margin-left:6px;padding:3px 7px;border-radius:999px;background:#ffe7a0;color:#684e00;font-size:10px;font-weight:900;vertical-align:middle}\n.rec-comodos-help{margin-top:7px;color:#725f29;font-size:12px;font-weight:750;line-height:1.4}\n.rec-comodos-required.rec-missing{border-color:#d85d62;background:#fff4f4}\n.rec-comodos-required.rec-missing input{border-color:#cf3f45!important;box-shadow:0 0 0 2px rgba(207,63,69,.08)}\n.rec-comodos-required.rec-missing .rec-comodos-help{color:#9d3030}\n';
  document.head.appendChild(s);
}

function clearError(modal,input){
  input.setCustomValidity('');
  var wrap=input.parentElement;
  if(wrap)wrap.classList.remove('rec-missing');
  var e=modal.querySelector('#rec-comodos-r7-error');
  if(e)e.remove();
}

function decorate(modal){
  var input=modal.querySelector('#rec-com');
  if(!input||input.dataset.r7Comodos)return;
  input.dataset.r7Comodos='1';
  input.required=true;
  input.min='1';
  input.step='1';
  input.inputMode='numeric';
  input.placeholder='Ex.: 6';
  input.setAttribute('aria-required','true');
  var wrap=input.parentElement;
  if(wrap){
    wrap.classList.add('rec-comodos-required');
    var label=wrap.querySelector('label');
    if(label&&!label.querySelector('.rec-required-badge')){
      label.appendChild(document.createTextNode(' '));
      var badge=document.createElement('span');
      badge.className='rec-required-badge';
      badge.textContent='OBRIGATÓRIO';
      label.appendChild(badge);
    }
    if(!wrap.querySelector('.rec-comodos-help')){
      var help=document.createElement('div');
      help.className='rec-comodos-help';
      help.textContent='Informe o total real de cômodos utilizados pela família no domicílio. Este dado participa da classificação de risco.';
      input.insertAdjacentElement('afterend',help);
    }
  }
  input.addEventListener('input',function(){clearError(modal,input)});
}

function validate(modal){
  if(activeStatus(modal)!=='mesma_familia')return true;
  var input=modal.querySelector('#rec-com');
  if(!input)return true;
  var raw=String(input.value||'').trim();
  var n=Number(raw);
  if(raw!==''&&Number.isInteger(n)&&n>=1){clearError(modal,input);return true;}
  input.setCustomValidity('Informe o número real de cômodos da residência.');
  var wrap=input.parentElement;
  if(wrap)wrap.classList.add('rec-missing');
  var old=modal.querySelector('#rec-comodos-r7-error');
  if(old)old.remove();
  var box=document.createElement('div');
  box.id='rec-comodos-r7-error';
  box.className='notice warn';
  box.style.marginTop='9px';
  box.innerHTML='<b>Falta o número de cômodos.</b><br>Para concluir “Mesma família”, informe quantos cômodos a residência possui. O Gestão não usa 6 automaticamente no recadastramento real.';
  if(wrap)wrap.insertAdjacentElement('afterend',box);
  input.scrollIntoView({behavior:'smooth',block:'center'});
  setTimeout(function(){try{input.focus();input.reportValidity()}catch(_e){}},150);
  return false;
}

function scan(){
  addStyles();
  document.querySelectorAll('.modal').forEach(function(modal){if(modal.querySelector('#rec-com'))decorate(modal)});
}

document.addEventListener('click',function(e){
  var btn=e.target&&e.target.closest?e.target.closest('#rec-save'):null;
  if(!btn)return;
  var modal=btn.closest('.modal');
  if(!modal)return;
  if(!validate(modal)){
    e.preventDefault();
    e.stopImmediatePropagation();
  }
},true);

new MutationObserver(scan).observe(document.documentElement,{childList:true,subtree:true});
scan();
})();

(function(){
  if(document.getElementById('visit-notes-r8-script'))return;
  var s=document.createElement('script');
  s.id='visit-notes-r8-script';
  s.src='./visit-notes-r8.js?rev=20260904-1135-r8';
  s.async=true;
  document.head.appendChild(s);
})();
