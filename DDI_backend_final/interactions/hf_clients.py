# interactions/hf_clients.py
from functools import lru_cache
from typing import Dict, Any, List, Tuple
import httpx
from gradio_client import Client
from django.conf import settings

# ---- Config from settings.py ----
HF_TOKEN    = getattr(settings, "HF_TOKEN", "") or None
SPACE_FREDA = getattr(settings, "HF_SPACE_FREDA", "Fredaaaaaa/severity")
SPACE_BERN  = getattr(settings, "HF_SPACE_BERNICE", "Bernice775/t5-ddi-api")

# ---- Small helpers ----
def _wake_space(base_url: str, timeout: float = 40.0) -> None:
    """Best-effort warmup for sleeping Spaces (ignore all errors)."""
    try:
        if not base_url.startswith(("http://", "https://")):
            base_url = f"https://{base_url}"
        with httpx.Client(timeout=timeout, follow_redirects=True) as h:
            for path in ("/", "/health", "/queue/join"):
                try:
                    h.get(base_url + path)
                except Exception:
                    pass
    except Exception:
        pass

@lru_cache
def _client(space: str) -> Client:
    _wake_space(space)
    # verbose=False keeps logs clean in dev
    return Client(space, hf_token=HF_TOKEN, verbose=False)

def _as_str(x: Any) -> str:
    if isinstance(x, (list, tuple)):
        return _as_str(x[0]) if x else ""
    return "" if x is None else str(x)

# ---- Freda (severity) ----
def freda_predict_pair(drug1: str, drug2: str) -> str:
    """
    New Freda API expects ONE string "drug_names" like "Warfarin, Aspirin"
    at api_name="/predict_interaction". Returns a string label.
    """
    try:
        cl = _client(SPACE_FREDA)
        pair = f"{drug1}, {drug2}"
        out = cl.predict(drug_names=pair, api_name="/predict_interaction")
        return _as_str(out)
    except Exception as e:
        # Space may be sleeping/crashed; keep the endpoint resilient.
        return f"Unavailable (severity model error: {e})"

# ---- Bernice (description / explanation / recommendations) ----
def _bernice_parse_3(out: Any) -> Tuple[str, str, str]:
    """
    Many Bernice variants return (description, explanation, recommendation).
    Accept tuple/list or plain string.
    """
    if isinstance(out, (list, tuple)):
        d = _as_str(out[0]) if len(out) > 0 else ""
        e = _as_str(out[1]) if len(out) > 1 else ""
        r = _as_str(out[2]) if len(out) > 2 else ""
        return d, e, r
    s = _as_str(out)
    return s, "", ""

def bernice_generate_for_pair(drug1: str, drug2: str) -> Dict[str, str]:
    """
    Try several known API shapes for Bernice Spaces, in this order:

    1) Two-step:
       - /collect_drug_features(drug_names_input="a,b") -> [["a, b", ...], ...]
       - /generate_selected_pair_output(selected_pair="a, b") -> (desc, expl, recs)

    2) One-shot (older Transformer space):
       - /run_interaction_check(input_text="a, b") OR /run_interaction_check(drug_names="a, b")

    3) Generic /predict fallback with 'drug_names' or 'input_text'

    Always returns:
      { "interaction": str, "explanation": str, "recommendations": str }
    """
    d1, d2 = (drug1 or "").strip(), (drug2 or "").strip()
    label = f"{d1}, {d2}"

    try:
        cl = _client(SPACE_BERN)
    except Exception as e:
        return {
            "interaction": "",
            "explanation": "",
            "recommendations": f"Description model unavailable: {e}",
        }

    # ---- Path 1: two-step flow ----
    try:
        collected = cl.predict(drug_names_input=label, api_name="/collect_drug_features")
        # Expect something like [[ "Aspirin, Warfarin", ... ], ...]
        options: List[str] = []
        if isinstance(collected, (list, tuple)) and collected:
            first = collected[0]
            if isinstance(first, (list, tuple)):
                options = [str(x) for x in first]

        chosen = None
        t1, t2 = d1.lower().replace(" ", ""), d2.lower().replace(" ", "")
        for opt in options:
            s = opt.lower().replace(" ", "")
            if t1 in s and t2 in s:
                chosen = opt
                break
        chosen = chosen or label

        out = cl.predict(selected_pair=chosen, api_name="/generate_selected_pair_output")
        desc, expl, recs = _bernice_parse_3(out)
        return {"interaction": desc, "explanation": expl, "recommendations": recs}
    except Exception:
        pass  # fall through to other shapes

    # ---- Path 2: one-shot Transformer style ----
    for kwargs in (
        {"input_text": label},   # most common
        {"drug_names": label},   # sometimes named like the severity space
    ):
        try:
            out = cl.predict(api_name="/run_interaction_check", **kwargs)
            desc, expl, recs = _bernice_parse_3(out)
            return {"interaction": desc, "explanation": expl, "recommendations": recs}
        except Exception:
            pass

    # ---- Path 3: generic /predict fallback ----
    for api_name in ("/predict",):
        for kwargs in ({"drug_names": label}, {"input_text": label}, {"text": label}):
            try:
                out = cl.predict(api_name=api_name, **kwargs)
                desc, expl, recs = _bernice_parse_3(out)
                return {"interaction": desc, "explanation": expl, "recommendations": recs}
            except Exception:
                pass

    # If we get here, nothing matched.
    return {
        "interaction": "",
        "explanation": "",
        "recommendations": "Description generation failed: no matching endpoint found on the Space.",
    }
