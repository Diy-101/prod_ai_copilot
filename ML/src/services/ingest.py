def ingest_openapi(source_name: str, openapi_spec: dict) -> dict:
    paths = openapi_spec.get("paths", {}) if isinstance(openapi_spec, dict) else {}
    components = openapi_spec.get("components", {}) if isinstance(openapi_spec, dict) else {}
    schemas = components.get("schemas", {}) if isinstance(components, dict) else {}

    return {
        "source_name": source_name,
        "parsed": True,
        "endpoint_count": len(paths) if isinstance(paths, dict) else 0,
        "schema_count": len(schemas) if isinstance(schemas, dict) else 0,
    }
