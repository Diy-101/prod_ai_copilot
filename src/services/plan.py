def generate_plan(task: str, top_k: int = 5) -> dict:
    pipelines = [
        {
            "id": "pipeline_1",
            "title": "Stub pipeline 1",
            "steps": [
                "Parse task",
                "Retrieve relevant capabilities",
                "Build executable plan",
            ],
        },
        {
            "id": "pipeline_2",
            "title": "Stub pipeline 2",
            "steps": [
                "Parse task",
                "Select entities",
                "Construct alternative plan",
            ],
        },
        {
            "id": "pipeline_3",
            "title": "Stub pipeline 3",
            "steps": [
                "Normalize task",
                "Rank candidate operations",
                "Assemble execution graph",
            ],
        },
    ]

    return {
        "status": "ok",
        "task": task,
        "candidate_pipelines": pipelines[:top_k],
        "best_pipeline_id": "pipeline_1",
    }


def generate_compose_plan(
    task: str,
    source_names: list[str],
    top_k: int = 5,
    max_steps: int = 5,
) -> dict:
    from src.services.llm import call_local_model
    from src.services.registry import get_compressed_for_sources

    compressed_specs = get_compressed_for_sources(source_names)
    capabilities = _collect_capabilities(compressed_specs)
    if not capabilities:
        return {"status": "ok", "task": task, "steps": []}

    model_steps = _rank_with_model(task, capabilities, call_local_model)
    if model_steps:
        steps = model_steps[:max_steps]
    else:
        steps = _rank_with_heuristics(task, capabilities, top_k)[:max_steps]

    return {"status": "ok", "task": task, "steps": steps}


def _collect_capabilities(compressed_specs: list[dict]) -> list[dict]:
    collected: list[dict] = []
    for spec in compressed_specs:
        source_name = spec.get("source_name") or spec.get("source") or "unknown"
        items = spec.get("capabilities", [])
        if not isinstance(items, list):
            continue
        for item in items:
            if isinstance(item, dict):
                capability = item.get("capability") or item.get("operation_id")
                if capability:
                    collected.append(
                        {
                            "capability": capability,
                            "source_name": source_name,
                            "intent": item.get("intent", ""),
                            "inputs": item.get("inputs", []),
                            "outputs": item.get("outputs", []),
                        }
                    )
    return collected


def _rank_with_model(task: str, capabilities: list[dict], model_call) -> list[dict] | None:
    prompt = _build_rank_prompt(task, capabilities)
    response = model_call(prompt)
    if not response:
        return None
    parsed = _parse_model_steps(response)
    if not parsed:
        return None
    return parsed


def _build_rank_prompt(task: str, capabilities: list[dict]) -> str:
    lines = ["Task:", task, "", "Capabilities:"]
    for idx, item in enumerate(capabilities, start=1):
        lines.append(
            f"{idx}. {item['capability']} ({item['source_name']}) "
            f"intent={item.get('intent','')} inputs={item.get('inputs',[])} "
            f"outputs={item.get('outputs',[])}"
        )
    lines.append(
        "Return strict JSON array of steps with keys: capability, source_name, reason."
    )
    return "\n".join(lines)


def _parse_model_steps(payload: str) -> list[dict] | None:
    import json

    try:
        data = json.loads(payload)
    except json.JSONDecodeError:
        return None
    if not isinstance(data, list):
        return None
    steps: list[dict] = []
    for item in data:
        if not isinstance(item, dict):
            continue
        if {"capability", "source_name", "reason"} <= set(item.keys()):
            steps.append(
                {
                    "capability": str(item["capability"]),
                    "source_name": str(item["source_name"]),
                    "reason": str(item["reason"]),
                }
            )
    return steps or None


def _rank_with_heuristics(task: str, capabilities: list[dict], top_k: int) -> list[dict]:
    task_tokens = _tokenize(task)
    scored: list[tuple[int, dict]] = []
    for item in capabilities:
        text = " ".join(
            [
                str(item.get("capability", "")),
                str(item.get("intent", "")),
                " ".join(item.get("inputs", []) if isinstance(item.get("inputs"), list) else []),
                " ".join(item.get("outputs", []) if isinstance(item.get("outputs"), list) else []),
            ]
        )
        score = _overlap_score(task_tokens, _tokenize(text))
        scored.append((score, item))
    scored.sort(key=lambda pair: pair[0], reverse=True)
    steps: list[dict] = []
    for score, item in scored[:top_k]:
        steps.append(
            {
                "capability": item["capability"],
                "source_name": item["source_name"],
                "reason": f"heuristic overlap score={score}",
            }
        )
    return steps


def _tokenize(text: str) -> list[str]:
    import re

    return re.findall(r"[a-z0-9_]+", text.lower())


def _overlap_score(tokens_a: list[str], tokens_b: list[str]) -> int:
    set_a = set(tokens_a)
    set_b = set(tokens_b)
    return len(set_a.intersection(set_b))
