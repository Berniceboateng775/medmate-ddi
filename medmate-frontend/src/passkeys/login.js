// src/passkeys/login.js
import API from '../services/api';
import { b64uToBuf, bufToB64u } from '../utils/base64url';

export async function loginWithPasskey(email /* optional */) {
  // 1) Begin
  const begin = await API.post('/passkeys/begin-login/', { email });
  const { options, challenge_id } = begin.data;
  const opts = JSON.parse(options);

  // Convert challenge & allowCredentials[].id
  opts.challenge = b64uToBuf(opts.challenge);
  if (Array.isArray(opts.allowCredentials)) {
    opts.allowCredentials = opts.allowCredentials.map((d) => ({
      ...d,
      id: b64uToBuf(d.id),
    }));
  }

  // 2) Browser call
  const assertion = await navigator.credentials.get({ publicKey: opts });

  // 3) Send to server
  const credential = {
    id: assertion.id,
    type: assertion.type,
    rawId: bufToB64u(assertion.rawId),
    response: {
      clientDataJSON: bufToB64u(assertion.response.clientDataJSON),
      authenticatorData: bufToB64u(assertion.response.authenticatorData),
      signature: bufToB64u(assertion.response.signature),
      userHandle: assertion.response.userHandle ? bufToB64u(assertion.response.userHandle) : null,
    },
    clientExtensionResults: assertion.getClientExtensionResults ? assertion.getClientExtensionResults() : {},
  };

  const finish = await API.post('/passkeys/finish-login/', {
    challenge_id,
    credential: JSON.stringify(credential),
  });

  // Save tokens like the password login flow
  const { access, refresh, user } = finish.data;
  localStorage.setItem('access', access);
  localStorage.setItem('refresh', refresh);
  localStorage.setItem('user', JSON.stringify(user));
  API.defaults.headers.common['Authorization'] = `Bearer ${access}`;
  return finish.data;
}
