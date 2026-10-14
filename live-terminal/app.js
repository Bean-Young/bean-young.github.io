'use strict';
const el = id => document.getElementById(id);
let endpoint = '', token = '', timer = null, generation = 0, canExecute = false, sending = false;
const setStatus = (text, online = false) => { el('status').textContent = text; el('status').classList.toggle('online', online); };
async function api(path, body) {
  const response = await fetch(endpoint + path, {
    method: body === undefined ? 'GET' : 'POST', cache: 'no-store', credentials: 'omit',
    headers: { ...(token ? {Authorization: 'Bearer ' + token} : {}), ...(body === undefined ? {} : {'Content-Type': 'application/json'}) },
    body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(10000)
  });
  const data = await response.json();
  if (!response.ok) { const error = new Error(data.error || '连接失败'); error.status = response.status; throw error; }
  return data;
}
function controls(enabled) { ['command','execute','interrupt'].forEach(id => el(id).disabled = !enabled); }
function reset(message = '') {
  generation++; clearTimeout(timer); token = ''; canExecute = false; sending = false;
  el('screen').textContent = ''; el('command').value = ''; el('workspace').hidden = true;
  el('login').hidden = false; el('logout').hidden = true; el('login-error').textContent = message;
  controls(false); setStatus('未连接');
}
async function poll(run) {
  if (!token || generation !== run) return;
  try {
    const data = await api('/screen');
    if (generation !== run) return;
    el('screen').textContent = data.text;
    canExecute = data.canExecute; controls(canExecute && !sending);
    setStatus('已连接', true);
    if (!canExecute) el('command-message').textContent = '执行功能尚未开放';
  } catch(error) {
    if (generation !== run) return;
    controls(false); setStatus('连接中断');
    if (error.status === 401) { reset('登录已失效，请重新连接'); return; }
  }
  if (generation === run && token) timer = setTimeout(() => poll(run), 1000);
}
el('login').addEventListener('submit', async event => {
  event.preventDefault(); el('connect').disabled = true; el('login-error').textContent = ''; setStatus('连接中');
  try {
    if (!endpoint) {
      const response = await fetch('config.json', {cache:'no-store'});
      if (!response.ok) throw new Error('连接配置暂不可用');
      const config = await response.json(); const url = new URL(config.endpoint);
      if (url.protocol !== 'https:' || !url.hostname.endsWith('.trycloudflare.com')) throw new Error('连接配置无效');
      endpoint = url.origin;
    }
    const password = el('password').value; el('password').value = '';
    const data = await api('/login', {password}); token = data.token;
    el('login').hidden = true; el('workspace').hidden = false; el('logout').hidden = false;
    el('command-message').textContent = '命令将在 SJTU 执行，不保存历史输出';
    const run = ++generation; await poll(run);
  } catch(error) { el('login-error').textContent = error.message || '网络暂不可用'; setStatus('未连接'); }
  finally { el('connect').disabled = false; }
});
el('logout').addEventListener('click', () => { api('/logout', {}).catch(() => {}); reset(); });
async function send(path, command) {
  if (!token || !canExecute || sending) return;
  sending = true; controls(false);
  try {
    await api(path, {id:crypto.randomUUID(), ...(command === undefined ? {} : {command})});
    if (path === '/command') el('command').value = '';
    el('command-message').textContent = path === '/command' ? '命令已发送' : '已发送中断信号';
  } catch(error) {
    if (error.status === 401) reset('登录已失效，请重新连接');
    else el('command-message').textContent = '发送未确认，请检查终端屏幕后再操作。' + error.message;
  } finally { sending = false; controls(Boolean(token) && canExecute); }
}
el('command-form').addEventListener('submit', event => { event.preventDefault(); const command = el('command').value; if(command.trim()) send('/command', command); });
el('interrupt').addEventListener('click', () => send('/interrupt'));
window.addEventListener('pagehide', () => { if(token && endpoint) fetch(endpoint + '/logout',{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:'{}',keepalive:true}).catch(()=>{}); reset(); });
