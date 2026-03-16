from __future__ import annotations

import asyncio

from sqlalchemy import select

from app.core.database.session import SessionLocal
from app.models import Action, Capability
from app.services.capability_service import CapabilityService


def _needs_backfill(capability: Capability) -> bool:
    llm_payload = capability.llm_payload
    if not isinstance(llm_payload, dict):
        return True
    if llm_payload.get("action_context_version") != "v2":
        return True
    if not isinstance(llm_payload.get("action_context"), dict):
        return True
    if not isinstance(llm_payload.get("action_context_brief"), dict):
        return True
    return False


async def main() -> None:
    async with SessionLocal() as session:
        result = await session.execute(
            select(Capability).where(Capability.action_id.is_not(None))
        )
        capabilities = list(result.scalars().all())
        if not capabilities:
            print("No capabilities found.")
            return

        action_ids = [cap.action_id for cap in capabilities if cap.action_id is not None]
        actions_result = await session.execute(select(Action).where(Action.id.in_(action_ids)))
        actions_by_id = {action.id: action for action in actions_result.scalars().all()}

        updated = 0
        for capability in capabilities:
            if capability.action_id is None:
                continue
            if not _needs_backfill(capability):
                continue
            action = actions_by_id.get(capability.action_id)
            if action is None:
                continue

            built = CapabilityService._build_capability_payload(action)
            built_llm = built.get("llm_payload") or {}
            existing = capability.llm_payload if isinstance(capability.llm_payload, dict) else {}

            capability.llm_payload = {
                **existing,
                "source": existing.get("source", built_llm.get("source", "deterministic")),
                "action_context_version": built_llm.get("action_context_version", "v2"),
                "action_context": built_llm.get("action_context"),
                "action_context_brief": built_llm.get("action_context_brief"),
                "openapi_hints": built_llm.get("openapi_hints"),
            }

            if capability.input_schema is None:
                capability.input_schema = built.get("input_schema")
            if capability.output_schema is None:
                capability.output_schema = built.get("output_schema")
            if capability.data_format is None:
                capability.data_format = built.get("data_format")
            updated += 1

        if not updated:
            print("No capabilities required backfill.")
            return

        await session.commit()
        print(f"Backfilled {updated} capabilities.")


if __name__ == "__main__":
    asyncio.run(main())

