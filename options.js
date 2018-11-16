// Saves options to chrome.storage
function save_options() {
  var status = document.getElementById('status');
  status.textContent = '';

  var hotelierId = document.getElementById('hotelierId').value;
  if(hotelierId === ''){
    status.textContent = 'Debes introducir un valor para Hotelier ID.';
  }

  chrome.storage.sync.set({
    hotelierId: hotelierId,
  }, function() {
    // Update status to let user know options were saved.
    
    status.textContent = 'Opciones guardadas correctamente.';
    setTimeout(function() {
      status.textContent = '';
    }, 1000);
  });
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restore_options() {
  // Use default value color = 'red' and likesColor = true.
  chrome.storage.sync.get({
    hotelierId: '',
  }, function(items) {
    document.getElementById('hotelierId').value = items.hotelierId;
    
  });
}
document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click',
    save_options);