def build_registry(compressed_spec: dict) -> dict:
    return {
        "registry_built": True,
        "registry_id": "stub_registry",
        "capabilities": [
            "customers.search",
            "audiences.create",
            "campaigns.create_draft",
        ],
    }
