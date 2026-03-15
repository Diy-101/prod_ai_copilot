import json
from typing import List
from app.services.semantic_selection import SelectedCapability

def build_pipeline_generation_prompt(
    user_query: str,
    selected_capabilities: List[SelectedCapability]
) -> str:
    """
    Строит промпт для LLM на основе запроса пользователя и доступных инструментов.
    """
    tools_desc = []
    for sc in selected_capabilities:
        cap = sc.capability
        tools_desc.append({
            "id": str(cap.id),
            "name": cap.name,
            "description": cap.description,
            "input_schema": cap.input_schema,
            "output_schema": cap.output_schema
        })

    prompt = f"""
Generate a pipeline graph for the following user request: "{user_query}"

AVAILABLE TOOLS:
{json.dumps(tools_desc, indent=2, ensure_ascii=False)}

TASK:
1. Select the necessary tools to fulfill the request.
2. Define a sequence of steps (nodes).
3. Connect them with edges (data flow).
4. For each node, specify which tool (capability_id) to use.

RESPONSE FORMAT:
Return ONLY a valid JSON object with the following structure:
{{
  "nodes": [
    {{
      "step": 1,
      "name": "Step name",
      "description": "What this step does",
      "capability_id": "UUID from the tools list",
      "input_connected_from": [],
      "output_connected_to": [2],
      "endpoints": [],
      "external_inputs": []
    }}
  ],
  "edges": [
    {{
      "from_step": 1,
      "to_step": 2,
      "type": "data_field_name"
    }}
  ],
  "variable_injections": []
}}
"""
    return prompt
