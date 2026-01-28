// src/utils/base64url.js
export const b64uToBuf = (b64u) => {
  const pad = '='.repeat((4 - (b64u.length % 4)) % 4);
  const b64 = (b64u + pad).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(b64);
  const buf = new ArrayBuffer(raw.length);
  const arr = new Uint8Array(buf);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return buf;
};

export const bufToB64u = (buf) => {
  const arr = new Uint8Array(buf);
  let s = '';
  for (let i = 0; i < arr.byteLength; i++) s += String.fromCharCode(arr[i]);
  const b64 = btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
  return b64;
};
