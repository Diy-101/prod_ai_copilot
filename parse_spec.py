import json
import os

def parse_openapi_for_llm(file_path):
    if not os.path.exists(file_path):
        print(f"File {file_path} not found")
        return

    with open(file_path, 'r') as f:
        spec = json.load(f)

    clean_data = {
        "title": spec.get("info", {}).get("title"),
        "actions": []
    }

    paths = spec.get("paths", {})
    for path, methods in paths.items():
        for method, details in methods.items():
            action = {
                "operationId": details.get("operationId"),
                "summary": details.get("summary"),
                "method": method.upper(),
                "path": path,
                "input": {
                    "parameters": [],
                    "requestBody": None
                },
                "output": None
            }

            # 1. Parse Parameters (Query, Path, Header)
            parameters = details.get("parameters", [])
            for param in parameters:
                action["input"]["parameters"].append({
                    "name": param.get("name"),
                    "in": param.get("in"),
                    "required": param.get("required", False),
                    "type": param.get("schema", {}).get("type", "any")
                })

            # 2. Parse Request Body
            if "requestBody" in details:
                content = details["requestBody"].get("content", {})
                for mime_type, body_details in content.items():
                    if "schema" in body_details:
                        action["input"]["requestBody"] = {
                            "mimeType": mime_type,
                            "schema": body_details["schema"] # Можно упростить до типов если нужно
                        }

            # 3. Parse Output (focus on 200/201)
            responses = details.get("responses", {})
            for code in ["200", "201", "203"]: # Ищем успешные коды
                if code in responses:
                    resp_content = responses[code].get("content", {})
                    for mime_type, resp_details in resp_content.items():
                        if "schema" in resp_details:
                            action["output"] = {
                                "status": code,
                                "schema": resp_details["schema"]
                            }
                        elif "examples" in resp_details:
                            # Если схем нет, но есть примеры (как в вашем файле)
                            # Мы можем попробовать вывести "тип" из примера
                            action["output"] = {
                                "status": code,
                                "note": "Type derived from example",
                                "structure": list(resp_details["examples"].values())[0].get("value")
                            }
                    break # Берем первый успешный
            
            clean_data["actions"].append(action)

    return clean_data

if __name__ == "__main__":
    # Тестовый запуск на вашем файле
    cleaned = parse_openapi_for_llm("/Users/threefours/Developer/prod-end/backend/pustbudet.json")
    
    output_file = "/Users/threefours/Developer/prod-end/backend/cleaned_api.json"
    with open(output_file, 'w') as f:
        json.dump(cleaned, f, indent=2)
    
    print(f"Парсинг завершен. Результат сохранен в {output_file}")
