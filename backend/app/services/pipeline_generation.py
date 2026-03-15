import json
import os
import re
from typing import Any
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Pipeline, PipelineNode, PipelineStatus
from app.services.dialog_memory import DialogMemoryService
from app.services.pipeline_prompt_builder import build_pipeline_generation_prompt
from app.services.semantic_selection import SelectedCapability, SemanticSelectionService


class PipelineGenerationError(Exception):
    pass


class PipelineGenerationService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.host = os.getenv("OLLAMA_HOST", "http://localhost:11434")
        self.model = os.getenv("OLLAMA_MODEL", "qwen2.5:7b")
        self.semantic_selector = SemanticSelectionService()
        self.dialog_memory = DialogMemoryService()

    async def generate(
        self,
        *,
        dialog_id: UUID,
        message: str,
        user_id: UUID | None = None,
        capability_ids: list[UUID] | None = None,
    ) -> dict[str, Any]:
        """
        Основной метод оркестрации:
        1. Получает контекст диалога.
        2. Отбирает подходящие Capabilities (семантически или по списку).
        3. Генерирует граф через LLM.
        4. Сохраняет Pipeline и PipelineNode в БД.
        5. Обновляет историю диалога.
        """
        # 1. Получаем контекст
        history, summary = await self.dialog_memory.get_context(str(dialog_id))

        # 2. Отбираем Capabilities
        if capability_ids:
            # Если переданы конкретные ID, можно было бы загрузить их, 
            # но для простоты объединения используем семантический поиск, если IDs не переданы.
            # В данном контексте объединения мы сфокусируемся на семантике запроса.
            pass
        
        selected: list[SelectedCapability] = await self.semantic_selector.select_capabilities(
            self.session,
            user_query=message,
            limit=10,
        )

        if not selected:
            msg = "Не удалось найти подходящих инструментов (Capabilities) для вашей задачи."
            return self._build_error_response(msg, status="needs_input")

        # 3. Генерируем граф
        try:
            raw_graph = self.generate_raw_graph(
                user_query=message,
                selected_capabilities=selected,
            )
        except PipelineGenerationError as exc:
            return self._build_error_response(str(exc), status="cannot_build")

        # 4. Сохраняем в БД
        pipeline = await self._save_to_db(
            user_prompt=message,
            user_id=user_id,
            graph_payload=raw_graph,
        )

        # 5. Обновляем память диалога
        updated_summary = await self.dialog_memory.append_and_summarize(str(dialog_id), "user", message)
        await self.dialog_memory.append_and_summarize(str(dialog_id), "assistant", "Пайплайн успешно сгенерирован.")

        return {
            "status": "ready",
            "message_ru": "Пайплайн успешно собран.",
            "chat_reply_ru": self._format_chat_reply(raw_graph),
            "pipeline_id": pipeline.id,
            "nodes": raw_graph.get("nodes", []),
            "edges": raw_graph.get("edges", []),
            "missing_requirements": [],
            "context_summary": updated_summary or summary,
        }

    def generate_raw_graph(
        self,
        *,
        user_query: str,
        selected_capabilities: list[SelectedCapability],
    ) -> dict[str, Any]:
        prompt = build_pipeline_generation_prompt(
            user_query=user_query,
            selected_capabilities=selected_capabilities,
        )

        payload = self._call_model(prompt)
        if not isinstance(payload, dict):
            raise PipelineGenerationError("LLM returned non-JSON payload")

        self._validate_graph_payload(payload)
        return payload

    async def _save_to_db(
        self,
        user_prompt: str,
        user_id: UUID | None,
        graph_payload: dict[str, Any],
    ) -> Pipeline:
        # Создаем сам Pipeline
        pipeline = Pipeline(
            name=f"Generated: {user_prompt[:50]}...",
            user_prompt=user_prompt,
            nodes=graph_payload.get("nodes", []),
            edges=graph_payload.get("edges", []),
            status=PipelineStatus.DRAFT,
            created_by=user_id,
        )
        self.session.add(pipeline)
        await self.session.flush()

        # Создаем отдельные записи для нод (коды шагов)
        for node_data in graph_payload.get("nodes", []):
            p_node = PipelineNode(
                pipeline_id=pipeline.id,
                step=node_data.get("step", 0),
                name=node_data.get("name", "Unnamed Step"),
                description=node_data.get("description"),
                input_config={
                    "connected_from": node_data.get("input_connected_from", []),
                    "data_types": node_data.get("input_data_type_from_previous", []),
                },
                output_config={
                    "connected_to": node_data.get("output_connected_to", []),
                },
                endpoints=node_data.get("endpoints", []),
                external_inputs=node_data.get("external_inputs", []),
            )
            self.session.add(p_node)

        await self.session.commit()
        await self.session.refresh(pipeline)
        return pipeline

    def _call_model(self, prompt: str) -> dict[str, Any] | None:
        try:
            from ollama import Client
        except Exception as exc:
            raise PipelineGenerationError("Ollama client is unavailable") from exc

        try:
            client = Client(host=self.host)
            response = client.chat(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": (
                            "You are a pipeline graph generator. "
                            "Return ONLY valid JSON object with keys: nodes, edges, variable_injections."
                        ),
                    },
                    {
                        "role": "user",
                        "content": prompt,
                    },
                ],
                options={"temperature": 0},
            )
        except Exception as exc:
            raise PipelineGenerationError("Failed to call Ollama") from exc

        content = self._extract_message_content(response)
        if not content:
            raise PipelineGenerationError("LLM returned empty response")
        return self._parse_json_payload(content)

    def _format_chat_reply(self, graph: dict[str, Any]) -> str:
        nodes = graph.get("nodes", [])
        if not nodes:
            return "Я собрал пустой граф. Попробуйте уточнить запрос."
        
        steps = sorted(nodes, key=lambda x: x.get("step", 0))
        names = [s.get("name") for s in steps if s.get("name")]
        chain = " -> ".join(names)
        return f"Пайплайн готов. Основные этапы: {chain}"

    def _build_error_response(self, message: str, status: str = "cannot_build") -> dict[str, Any]:
        return {
            "status": status,
            "message_ru": message,
            "chat_reply_ru": message,
            "pipeline_id": None,
            "nodes": [],
            "edges": [],
            "missing_requirements": [],
            "context_summary": None,
        }

    @staticmethod
    def _extract_message_content(response: Any) -> str | None:
        if isinstance(response, dict):
            message = response.get("message")
            if isinstance(message, dict):
                content = message.get("content")
                if isinstance(content, str):
                    return content
            content = response.get("content")
            if isinstance(content, str):
                return content
            return None

        message = getattr(response, "message", None)
        if message is not None:
            content = getattr(message, "content", None)
            if isinstance(content, str):
                return content

        content = getattr(response, "content", None)
        if isinstance(content, str):
            return content
        return None

    @staticmethod
    def _parse_json_payload(content: str) -> dict[str, Any] | None:
        try:
            return json.loads(content)
        except json.JSONDecodeError:
            match = re.search(r"\{.*\}", content, re.DOTALL)
            if not match:
                return None
            try:
                # model_dump(mode='json') equivalent for manual strings
                return json.loads(match.group(0))
            except json.JSONDecodeError:
                return None

    @staticmethod
    def _validate_graph_payload(payload: dict[str, Any]) -> None:
        required_keys = ("nodes", "edges", "variable_injections")
        missing = [key for key in required_keys if key not in payload]
        if missing:
            raise PipelineGenerationError(f"LLM JSON missing required keys: {', '.join(missing)}")
