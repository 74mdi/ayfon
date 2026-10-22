(function () {
  'use strict';

  var input = document.getElementById('photo-input');
  var dropzone = document.getElementById('dropzone');
  var selection = document.getElementById('selection');
  var list = document.getElementById('file-list');
  var count = document.getElementById('selection-count');
  var token = document.getElementById('bot-token');
  var chat = document.getElementById('chat-id');
  var send = document.getElementById('send-button');
  var sendLabel = document.getElementById('send-label');
  var clear = document.getElementById('clear-button');
  var progress = document.getElementById('progress');
  var progressFill = document.getElementById('progress-fill');
  var progressLabel = document.getElementById('progress-label');
  var error = document.getElementById('error');
  var success = document.getElementById('success');
  var files = [];
  var busy = false;

  function formatSize(bytes) {
    if (bytes < 1024 * 1024) return Math.max(1, Math.round(bytes / 1024)) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  function updateButton() {
    send.disabled = busy || !files.length || !token.value.trim() || !chat.value.trim();
  }

  function renderFiles() {
    while (list.firstChild) list.removeChild(list.firstChild);
    selection.hidden = !files.length;
    count.textContent = files.length ? String(files.length).replace(/\B(?=(\d{3})+(?!\d))/g, ',') + (files.length === 1 ? ' photo' : ' photos') : '';
    files.forEach(function (file, index) {
      var row = document.createElement('li');
      var thumb = document.createElement('img');
      var info = document.createElement('div');
      var name = document.createElement('div');
      var size = document.createElement('div');
      var state = document.createElement('span');
      row.className = 'file-row';
      thumb.className = 'thumb';
      thumb.alt = '';
      thumb.src = file.preview;
      info.className = 'file-info';
      name.className = 'file-name';
      name.textContent = file.name;
      size.className = 'file-size';
      size.textContent = formatSize(file.size);
      state.className = 'file-state' + (file.sent ? ' done' : '');
      state.textContent = file.sent ? 'SENT' : (file.size > 50 * 1024 * 1024 ? 'OVER 50 MB' : 'READY');
      row.appendChild(thumb);
      info.appendChild(name);
      info.appendChild(size);
      row.appendChild(info);
      row.appendChild(state);
      list.appendChild(row);
    });
    updateButton();
  }

  function addFiles(fileList) {
    Array.prototype.forEach.call(fileList, function (file) {
      if (file.type && file.type.indexOf('image/') !== 0) return;
      var duplicate = files.some(function (item) { return item.name === file.name && item.size === file.size && item.lastModified === file.lastModified; });
      if (!duplicate) files.push({ file: file, name: file.name, size: file.size, lastModified: file.lastModified, preview: URL.createObjectURL(file), sent: false });
    });
    error.hidden = true;
    success.hidden = true;
    renderFiles();
  }

  input.addEventListener('change', function () { addFiles(input.files); input.value = ''; });
  dropzone.addEventListener('click', function (event) { if (event.target !== input) input.click(); });
  dropzone.addEventListener('keydown', function (event) {
    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); input.click(); }
  });
  ['dragenter', 'dragover'].forEach(function (name) {
    dropzone.addEventListener(name, function (event) { event.preventDefault(); dropzone.classList.add('is-over'); });
  });
  ['dragleave', 'drop'].forEach(function (name) {
    dropzone.addEventListener(name, function (event) { event.preventDefault(); dropzone.classList.remove('is-over'); });
  });
  dropzone.addEventListener('drop', function (event) { if (event.dataTransfer && event.dataTransfer.files) addFiles(event.dataTransfer.files); });
  clear.addEventListener('click', function () {
    files.forEach(function (item) { URL.revokeObjectURL(item.preview); });
    files = [];
    error.hidden = true;
    success.hidden = true;
    renderFiles();
  });
  token.addEventListener('input', updateButton);
  chat.addEventListener('input', updateButton);

  function wait(ms) { return new Promise(function (resolve) { window.setTimeout(resolve, ms); }); }

  function sendOne(item) {
    var data = new FormData();
    data.append('chat_id', chat.value.trim());
    data.append('document', item.file, item.name);
    return fetch('https://api.telegram.org/bot' + token.value.trim() + '/sendDocument', { method: 'POST', body: data }).then(function (response) {
      return response.json().then(function (body) {
        if (!response.ok || !body.ok) throw new Error(body.description || 'Telegram could not send ' + item.name + '.');
        item.sent = true;
      });
    });
  }

  send.addEventListener('click', function () {
    if (busy || !files.length) return;
    var oversized = files.filter(function (item) { return !item.sent && item.size > 50 * 1024 * 1024; });
    if (oversized.length) {
      error.textContent = 'Telegram accepts files up to 50 MB. Remove or reduce: ' + oversized.map(function (item) { return item.name; }).join(', ');
      error.hidden = false;
      return;
    }
    busy = true;
    error.hidden = true;
    success.hidden = true;
    progress.hidden = false;
    sendLabel.textContent = 'Sending…';
    updateButton();
    var queue = files.filter(function (item) { return !item.sent; });
    var index = 0;
    function next() {
      if (index >= queue.length) {
        busy = false;
        progress.hidden = true;
        sendLabel.textContent = 'Send originals';
        success.textContent = 'All ' + files.length + ' original' + (files.length === 1 ? ' is' : 's are') + ' in Telegram. Full quality and embedded metadata preserved.';
        success.hidden = false;
        renderFiles();
        return;
      }
      progressLabel.textContent = 'Sending ' + (index + 1) + ' of ' + queue.length + ' · ' + queue[index].name;
      sendOne(queue[index]).then(function () {
        index += 1;
        progressFill.style.width = Math.round(index / queue.length * 100) + '%';
        renderFiles();
        if (index < queue.length) return wait(1100).then(next);
        next();
      }).catch(function (err) {
        busy = false;
        progress.hidden = true;
        sendLabel.textContent = 'Retry remaining';
        error.textContent = err.message + ' Successfully sent files remain marked SENT; retry to continue.';
        error.hidden = false;
        renderFiles();
      });
    }
    progressFill.style.width = '0%';
    next();
  });
}());
