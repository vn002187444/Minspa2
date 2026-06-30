window.__earlyErrors = [];
var origOnError = window.onerror;
window.onerror = function(_msg, _src, _line, _col, _err) {
  if (origOnError) return origOnError.apply(window, arguments);
  return false;
};
window.addEventListener('unhandledrejection', function() {
  // Silent catch for unhandled rejections in production
});

// --- Storage Override (Critical for iOS Private Browsing) ---
try { window.localStorage.setItem('__test','1'); window.localStorage.removeItem('__test'); } catch {
  if (typeof Storage !== 'undefined') {
    Storage.prototype.getItem = function(){return null};
    Storage.prototype.setItem = function(){};
    Storage.prototype.removeItem = function(){};
    Storage.prototype.clear = function(){};
    Storage.prototype.key = function(){return null};
    Object.defineProperty(Storage.prototype, 'length', {get: function(){return 0}, configurable: true});
  }
}

try { window.indexedDB.open('__test'); } catch {
  var _safeReq = function(){this.result=null;this.error=null;this.onupgradeneeded=null;this.onsuccess=null;this.onerror=null;};
  var _safeIDB = { open: function(){return new _safeReq()}, deleteDatabase: function(){return new _safeReq()} };
  try { window.indexedDB = _safeIDB; } catch {}
}