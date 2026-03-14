from __future__ import annotations

from typing import Optional
import json
import os
import urllib.request


def call_local_model(prompt: str) -> Optional[str]:
    """Call local Ollama model via HTTP.

    Returns the response string or None to trigger fallback logic.
    """
    if os.getenv("OLLAMA_DISABLE", "").lower() in {"1", "true", "yes"}:
        return None

    base_url = os.getenv("OLLAMA_URL")
    if not base_url:
        return None
    base_url = base_url.rstrip("/")

    model = os.getenv("OLLAMA_MODEL", "qwen2.5:7b")

    timeout = float(os.getenv("OLLAMA_TIMEOUT", "15"))

    try:
        import ollama  # type: ignore

        try:
            client = ollama.Client(host=base_url)
            response = client.generate(model=model, prompt=prompt)
        except Exception:
            response = ollama.generate(model=model, prompt=prompt)

        if isinstance(response, dict):
            result = response.get("response")
            if isinstance(result, str):
                return result.strip()
    except Exception:
        pass

    endpoint = f"{base_url}/api/generate"
    payload = {"model": model, "prompt": prompt, "stream": False}

    try:
        data = json.dumps(payload).encode("utf-8")
        request = urllib.request.Request(
            endpoint,
            data=data,
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urllib.request.urlopen(request, timeout=timeout) as response:
            body = response.read().decode("utf-8")
        parsed = json.loads(body)
        result = parsed.get("response")
        if isinstance(result, str):
            return result.strip()
    except Exception:
        return None

    return None
