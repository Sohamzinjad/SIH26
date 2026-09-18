import json
import logging
import httpx
from typing import Optional, Dict, Any
from backend.config import settings
from backend.ai.prompts import SYSTEM_PROMPT_UNKNOWN_VENDOR, generate_mapping_prompt
from backend.ai.structural_fallback import extract_structural_mapping

logger = logging.getLogger(__name__)

class OllamaClient:
    def __init__(self):
        self.base_url = settings.OLLAMA_URL.rstrip("/")
        self.model = settings.OLLAMA_MODEL
        self.timeout = settings.OLLAMA_TIMEOUT_SECONDS

    def is_available(self) -> bool:
        """Checks whether the local Ollama instance is accessible."""
        try:
            with httpx.Client(timeout=2.0) as client:
                resp = client.get(f"{self.base_url}/api/tags")
                return resp.status_code == 200
        except Exception:
            return False

    def propose_mapping(self, config_text: str) -> Dict[str, Any]:
        """
        Sends config to local Ollama.
        If Ollama is not installed or offline, falls back to a deterministic
        structural parser (extract_structural_mapping) that reads the actual
        config text so the offline demo flow still yields genuine values.
        """
        if self.is_available():
            try:
                prompt = generate_mapping_prompt(config_text)
                payload = {
                    "model": self.model,
                    "prompt": prompt,
                    "system": SYSTEM_PROMPT_UNKNOWN_VENDOR,
                    "stream": False,
                    "format": "json"
                }
                with httpx.Client(timeout=self.timeout) as client:
                    resp = client.post(f"{self.base_url}/api/generate", json=payload)
                    if resp.status_code == 200:
                        data = resp.json()
                        response_str = data.get("response", "{}")
                        return json.loads(response_str)
            except Exception as e:
                logger.warning(f"Ollama inference error: {e}. Falling back to structural analysis.")

        return extract_structural_mapping(config_text)

ollama_client = OllamaClient()
