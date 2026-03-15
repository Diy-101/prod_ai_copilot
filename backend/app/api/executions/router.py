from fastapi import APIRouter

from app.api.executions.get_execution import router as get_execution_router
from app.api.executions.list_executions import router as list_executions_router


router = APIRouter(prefix="/v1/executions", tags=["Executions"])
router.include_router(list_executions_router)
router.include_router(get_execution_router)
