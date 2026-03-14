from fastapi import APIRouter

from app.api.pipelines.generate import router as generate_router


router = APIRouter(prefix="/v1/pipelines", tags=["Pipelines"])
router.include_router(generate_router)
