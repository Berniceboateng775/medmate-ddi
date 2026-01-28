// src/components/PasskeysPanel.jsx
import { useEffect, useState } from 'react';
import API from '../services/api';

// ---- base64url helpers -------------------------------------------------
const b64uToBuf = (s) => {
  // convert base64url -> base64
  const base64 = s.replace(/-/g, '+').replace(/_/g, '/')
                  + '='.repeat((4 - (s.length % 4)) % 4);
  const bin = atob(base64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes.buffer;
};

const bufToB64u = (buf) => {
  const bytes = new Uint8Array(buf);
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
};

// -----------------------------------------------------------------------

export default function PasskeysPanel() {
  const [loading, setLoading] = useState(false);
  const [list, setList] = useState([]);
  const [label, setLabel] = useState('');

  const load = async () => {
    const { data } = await API.get('/passkeys/');
    setList(data);
  };

  useEffect(() => { load(); }, []);

  const addPasskey = async () => {
    if (!('credentials' in navigator)) {
      alert('WebAuthn not supported in this browser.');
      return;
    }

    const chosenLabel = (label || '').trim() || `Device ${new Date().toLocaleString()}`;

    try {
      setLoading(true);

      // 1) Begin register → get { options: { publicKey: ... }, challenge_id }
      const beginRes = await API.post('/passkeys/begin-register/', { label: chosenLabel });
      const { options, challenge_id } = beginRes.data;

      // Support shape { publicKey: {...} } (our backend returns this)
      const pk = options.publicKey || options;

      // 2) Decode base64url fields into ArrayBuffers for navigator.credentials
      const publicKey = {
        ...pk,
        challenge: b64uToBuf(pk.challenge),
        user: {
          ...pk.user,
          id: b64uToBuf(pk.user.id),
        },
        excludeCredentials: (pk.excludeCredentials || []).map((c) => ({
          ...c,
          id: b64uToBuf(c.id),
        })),
      };

      // 3) Ask authenticator to create a credential
      const cred = await navigator.credentials.create({ publicKey });
      if (!cred) throw new Error('Credential creation was cancelled');

      // 4) Prepare attestation “PublicKeyCredential” for backend
      const payloadForServer = {
        id: cred.id,
        rawId: bufToB64u(cred.rawId),
        type: cred.type,
        response: {
          clientDataJSON: bufToB64u(cred.response.clientDataJSON),
          attestationObject: bufToB64u(cred.response.attestationObject),
        },
        clientExtensionResults: cred.getClientExtensionResults?.() || {},
      };

      // 5) Finish register (BACKEND EXPECTS challenge_id + credential JSON)
      await API.post('/passkeys/finish-register/', {
        challenge_id,
        label: chosenLabel,
        credential: JSON.stringify(payloadForServer),
      });

      setLabel('');
      await load();
      alert('Passkey added.');
    } catch (e) {
      console.error(e);
      const msg =
        e?.response?.data?.detail ||
        e?.message ||
        'Failed to add passkey';
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  const rename = async (id) => {
    const newLabel = prompt('New label?');
    if (!newLabel) return;
    await API.patch(`/passkeys/${id}/rename/`, { label: newLabel });
    await load();
  };

  const removePk = async (id) => {
    if (!confirm('Delete this passkey?')) return;
    await API.delete(`/passkeys/${id}/`);
    await load();
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold mb-4">Passkeys</h2>

      <div className="flex items-center gap-2 mb-4">
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Label (e.g. Windows 11)"
          className="border rounded px-3 py-2 flex-1"
        />
        <button
          onClick={addPasskey}
          disabled={loading}
          className={`px-4 py-2 rounded text-white ${loading ? 'bg-green-400' : 'bg-green-600 hover:bg-green-700'}`}
        >
          {loading ? 'Adding…' : 'Add Passkey'}
        </button>
      </div>

      <ul className="divide-y">
        {list.map((pk) => (
          <li key={pk.id} className="py-3 flex items-center justify-between">
            <div>
              <div className="font-medium">{pk.label || 'Unnamed device'}</div>
              <div className="text-sm text-gray-500">
                {new Date(pk.created_at).toLocaleString()}
                {pk.backup_state ? ' • backup' : ''}
              </div>
            </div>
            <div className="flex gap-2">
              <button className="px-3 py-1 rounded border" onClick={() => rename(pk.id)}>Rename</button>
              <button className="px-3 py-1 rounded bg-red-600 text-white" onClick={() => removePk(pk.id)}>Delete</button>
            </div>
          </li>
        ))}

        {list.length === 0 && (
          <li className="py-3 text-gray-500">No passkeys yet.</li>
        )}
      </ul>

      <p className="text-xs text-gray-500 mt-3">
        Tip: Passkeys require HTTPS or <code>http://localhost</code>. Make sure your dev frontend runs on <code>http://localhost</code> (not raw IP).
      </p>
    </div>
  );
}
