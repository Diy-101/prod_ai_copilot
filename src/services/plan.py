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
