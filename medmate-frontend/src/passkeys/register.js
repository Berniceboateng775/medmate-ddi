// src/passkeys/register.js
import API from '../services/api';
import { b64uToBuf, bufToB64u } from '../utils/base64url';

export async function registerPasskey(label = '') {
  // 1) Begin
  const begin = await API.post('/passkeys/begin-register/', {});
  const { options, challenge_id } = begin.data;

  // options came as stringified JSON (from model_dump_json)
  const opts = JSON.parse(options);

  // Convert challenge & user.id & excludeCredentials[].id to ArrayBuffers
  opts.challenge = b64uToBuf(opts.challenge);
  opts.user.id = b64uToBuf(opts.user.id);
  if (Array.isArray(opts.excludeCredentials)) {
    opts.excludeCredentials = opts.excludeCredentials.map((d) => ({
      ...d,
      id: b64uToBuf(d.id),
    }));
  }

  // 2) Browser call
  const cred = await navigator.credentials.create({ publicKey: opts });

  // 3) Send to server
  const credential = {
    id: cred.id,
    type: cred.type,
    rawId: bufToB64u(cred.rawId),
    response: {
      clientDataJSON: bufToB64u(cred.response.clientDataJSON),
      attestationObject: bufToB64u(cred.response.attestationObject),
      // transports hint (optional)
      transports: cred.response.getTransports ? cred.response.getTransports() : [],
    },
    clientExtensionResults: cred.getClientExtensionResults ? cred.getClientExtensionResults() : {},
  };

  const finish = await API.post('/passkeys/finish-register/', {
    challenge_id,
    credential: JSON.stringify(credential),
    label,
  });

  return finish.data; // { ok, credential_id, label }
}
