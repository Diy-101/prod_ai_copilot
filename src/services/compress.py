from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from src.services.llm import call_local_model

HTTP_METHODS = {"get", "post", "put", "patch", "delete", "head", "options"}


def compress_openapi(source_name: str, openapi_spec: dict) -> dict:
    operations = extract_operations(openapi_spec)
    compressed_ops = [compress_operation(op) for op in operations]
    entity_count = count_entities(openapi_spec)

    return {
        "compressed": True,
        "source_name": source_name,
        "service_summary": build_service_summary(openapi_spec, operations),
        "capability_count": len(compressed_ops),
        "entity_count": entity_count,
        "capabilities": compressed_ops,
        "compressed_at": datetime.now(timezone.utc).isoformat(),
    }


def extract_operations(openapi_spec: dict) -> list[dict[str, Any]]:
    if not isinstance(openapi_spec, dict):
        return []

    paths = openapi_spec.get("paths", {})
    if not isinstance(paths, dict):
        return []

    operations: list[dict[str, Any]] = []
    for path, methods in paths.items():
        if not isinstance(methods, dict):
            continue
        common_parameters = methods.get("parameters", []) if isinstance(methods.get("parameters"), list) else []
        for method, operation in methods.items():
            method_lower = str(method).lower()
            if method_lower not in HTTP_METHODS:
                continue
            if not isinstance(operation, dict):
                continue
            parameters = list(common_parameters)
            op_params = operation.get("parameters", [])
            if isinstance(op_params, list):
                parameters.extend(op_params)
            operations.append(
                {
                    "path": path,
                    "method": method_lower,
                    "operation_id": operation.get("operationId"),
                    "summary": operation.get("summary"),
                    "description": operation.get("description"),
                    "tags": operation.get("tags", []),
                    "parameters": parameters,
                    "requestBody": operation.get("requestBody"),
                    "responses": operation.get("responses", {}),
                    "security": operation.get("security"),
                }
            )

    return operations


def compress_operation(operation: dict[str, Any]) -> dict[str, Any]:
    capability = operation.get("operation_id") or build_capability_name(operation)
    prompt = build_compress_prompt(operation, capability)
    model_response = call_local_model(prompt)
    if model_response:
        parsed = parse_model_response(model_response)
        if parsed:
            parsed["capability"] = capability
            parsed["method"] = operation.get("method")
            parsed["path"] = operation.get("path")
            return parsed

    return heuristic_compress(operation, capability)


def build_capability_name(operation: dict[str, Any]) -> str:
    method = operation.get("method") or "get"
    path = operation.get("path") or "/"
    normalized = path.strip("/").replace("/", ".").replace("{", "").replace("}", "")
    normalized = normalized or "root"
    return f"{normalized}.{method}"


def build_compress_prompt(operation: dict[str, Any], capability: str) -> str:
    summary = operation.get("summary") or ""
    description = operation.get("description") or ""
    inputs = describe_inputs(operation)
    outputs = describe_outputs(operation)
    return (
        "Compress the OpenAPI operation into the template fields below.\n"
        "Return strict JSON with keys: intent, inputs, outputs, side_effects, constraints.\n"
        f"Capability: {capability}\n"
        f"Summary: {summary}\n"
        f"Description: {description}\n"
        f"Inputs: {inputs}\n"
        f"Outputs: {outputs}\n"
    )


def parse_model_response(payload: str) -> dict[str, Any] | None:
    import json

    try:
        data = json.loads(payload)
    except json.JSONDecodeError:
        return None
    if not isinstance(data, dict):
        return None
    expected = {"intent", "inputs", "outputs", "side_effects", "constraints"}
    if not expected.issubset(data.keys()):
        return None
    return data


def heuristic_compress(operation: dict[str, Any], capability: str) -> dict[str, Any]:
    summary = operation.get("summary") or operation.get("description") or capability
    return {
        "capability": capability,
        "intent": summary,
        "inputs": describe_inputs(operation),
        "outputs": describe_outputs(operation),
        "side_effects": describe_side_effects(operation),
        "constraints": describe_constraints(operation),
        "method": operation.get("method"),
        "path": operation.get("path"),
    }


def describe_inputs(operation: dict[str, Any]) -> list[str]:
    items: list[str] = []
    for param in operation.get("parameters", []) or []:
        if not isinstance(param, dict):
            continue
        name = param.get("name")
        location = param.get("in")
        if name and location:
            items.append(f"{name} ({location})")
        elif name:
            items.append(str(name))
    request_body = operation.get("requestBody")
    if isinstance(request_body, dict):
        content = request_body.get("content", {})
        if isinstance(content, dict):
            for content_type, details in content.items():
                schema = details.get("schema") if isinstance(details, dict) else None
                schema_desc = describe_schema(schema)
                if schema_desc:
                    items.append(f"body[{content_type}]: {schema_desc}")
                else:
                    items.append(f"body[{content_type}]")
    return items


def describe_outputs(operation: dict[str, Any]) -> list[str]:
    responses = operation.get("responses", {})
    if not isinstance(responses, dict):
        return []
    outputs: list[str] = []
    for status, details in responses.items():
        if not isinstance(details, dict):
            outputs.append(str(status))
            continue
        description = details.get("description")
        content = details.get("content", {})
        schema_desc = None
        if isinstance(content, dict):
            for content_type, content_details in content.items():
                schema = content_details.get("schema") if isinstance(content_details, dict) else None
                schema_desc = describe_schema(schema)
                if schema_desc:
                    outputs.append(f"{status} {content_type}: {schema_desc}")
                else:
                    outputs.append(f"{status} {content_type}")
        if not content and description:
            outputs.append(f"{status}: {description}")
        elif not content and not description:
            outputs.append(str(status))
    return outputs


def describe_schema(schema: Any) -> str | None:
    if not isinstance(schema, dict):
        return None
    ref = schema.get("$ref")
    if isinstance(ref, str):
        return ref.split("/")[-1]
    schema_type = schema.get("type")
    if schema_type:
        return str(schema_type)
    return None


def describe_side_effects(operation: dict[str, Any]) -> str:
    method = (operation.get("method") or "").lower()
    if method in {"post", "put", "patch"}:
        return "modifies state"
    if method == "delete":
        return "deletes state"
    return "reads state"


def describe_constraints(operation: dict[str, Any]) -> str:
    security = operation.get("security")
    if security:
        return "requires auth"
    return "none"


def build_service_summary(openapi_spec: dict, operations: list[dict[str, Any]]) -> str:
    info = openapi_spec.get("info", {}) if isinstance(openapi_spec, dict) else {}
    title = info.get("title") or "Service"
    description = info.get("description") or ""
    op_count = len(operations)
    summary = f"{title} with {op_count} operations"
    if description:
        summary = f"{summary}. {description}"
    return summary


def count_entities(openapi_spec: dict) -> int:
    components = openapi_spec.get("components", {}) if isinstance(openapi_spec, dict) else {}
    schemas = components.get("schemas", {}) if isinstance(components, dict) else {}
    return len(schemas) if isinstance(schemas, dict) else 0
