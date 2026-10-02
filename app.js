const nav=document.getElementById('nav');
document.getElementById('menuBtn').onclick=()=>nav.classList.toggle('open');

let selectedMethod='HesabPay';
let selectedPrice='240 AFN';
document.querySelectorAll('.pay-option').forEach(btn=>{
  btn.onclick=()=>{
    document.querySelectorAll('.pay-option').forEach(x=>x.classList.remove('active'));
    btn.classList.add('active');
    selectedMethod=btn.dataset.method;
    selectedPrice=btn.dataset.price || (selectedMethod==='HesabPay' || selectedMethod.includes('AFN') ? '240 AFN' : '4 USD');
    document.getElementById('priceValue').textContent=selectedPrice;
    document.getElementById('priceSub').textContent=selectedPrice==='240 AFN' ? 'or 4 USD' : 'or 240 AFN';
    document.getElementById('checkoutBtn').textContent='Continue with '+selectedMethod;
  };
});

const modal=document.getElementById('payModal');
document.getElementById('checkoutBtn').onclick=()=>{
  document.getElementById('modalTitle').textContent=selectedMethod;
  document.getElementById('modalPrice').textContent=selectedPrice;
  document.getElementById('paymentInstructions').textContent =
    selectedMethod==='HesabPay'
      ? 'The official HesabPay checkout will be connected here. Never send your PIN or password.'
      : 'The official merchant checkout/address will be connected here. Never share private keys or seed phrases.';
  modal.classList.remove('hidden');
};
document.getElementById('closeModal').onclick=()=>modal.classList.add('hidden');
modal.addEventListener('click',e=>{if(e.target===modal)modal.classList.add('hidden')});

const fileInput=document.getElementById('chartFile');
const uploadBox=document.getElementById('uploadBox');
const preview=document.getElementById('preview');
fileInput.onchange=()=>{
  const file=fileInput.files[0];
  if(!file)return;
  preview.src=URL.createObjectURL(file);
  uploadBox.classList.add('has-image');
};

document.getElementById('analyzeBtn').onclick=()=>{
  if(!fileInput.files[0]){
    alert('Please upload an XAUUSD chart image first.');
    return;
  }
  document.getElementById('resultTime').textContent =
    document.getElementById('timeframe').value.replace('Minutes','M').replace('Hour','H').replace('Daily','1D');
  document.getElementById('result').classList.remove('hidden');
  document.getElementById('result').scrollIntoView({behavior:'smooth',block:'center'});
};

document.getElementById('submitPayment').onclick=()=>{
  const tx=document.getElementById('txId').value.trim();
  if(!tx){alert('Enter your transaction reference.');return;}
  localStorage.setItem('goldai_payment_reference',tx);
  alert('Reference saved in this demo. Automatic payment verification will be enabled after the official merchant API is connected.');
  modal.classList.add('hidden');
};
