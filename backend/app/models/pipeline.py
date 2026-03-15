import enum
import uuid
from typing import Any

from sqlalchemy import Enum, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import JSON, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin


class PipelineStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    READY = "READY"
    ARCHIVED = "ARCHIVED"


class Pipeline(TimestampMixin, Base):
    """
    Сценарный слой.
    Коллекция нод и связей между ними — полная структура графа,
    сгенерированного SynthesisService и отображаемого на канвасе (React Flow).
    """
    __tablename__ = "pipelines"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    name: Mapped[str] = mapped_column(
        String(512),
        nullable=False,
        comment="Человекочитаемое название пайплайна",
    )
    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
        comment="Подробное описание того, что делает этот сценарий",
    )

    user_prompt: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
        comment="Оригинальный текстовый запрос PM из чата, породивший этот граф",
    )

    nodes: Mapped[list[dict[str, Any]]] = mapped_column(
        JSON,
        nullable=False,
        default=list,
        comment="Список нод графа. Каждая нода ссылается на Capability и хранит индивидуальные параметры",
    )

    edges: Mapped[list[dict[str, Any]]] = mapped_column(
        JSON,
        nullable=False,
        default=list,
        comment="Список рёбер графа. Определяет порядок выполнения нод (DAG)",
    )

    status: Mapped[PipelineStatus] = mapped_column(
        Enum(PipelineStatus, name="pipeline_status"),
        nullable=False,
        default=PipelineStatus.DRAFT,
        server_default=PipelineStatus.DRAFT.value,
        comment="Статус пайплайна: DRAFT → READY → ARCHIVED",
    )

    created_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
        comment="UUID пользователя (PM), создавшего или запустившего генерацию",
    )

    creator = relationship("User", lazy="select")
    all_nodes = relationship("PipelineNode", back_populates="pipeline", cascade="all, delete-orphan", lazy="selectin")


class PipelineNode(TimestampMixin, Base):
    """
    Технический слой ноды пайплайна.
    Хранит информацию об одном шаге (Capability) внутри конкретного Pipeline.
    """
    __tablename__ = "pipeline_nodes"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    pipeline_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("pipelines.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    step: Mapped[int] = mapped_column(
        nullable=False,
        comment="Порядковый номер шага в графе",
    )

    name: Mapped[str] = mapped_column(
        String(512),
        nullable=False,
        comment="Название ноды",
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    # Храним технические детали (связи, эндпоинты) в JSON, чтобы не раздувать схему
    input_config: Mapped[dict[str, Any]] = mapped_column(
        JSON,
        nullable=False,
        default=dict,
        comment="Входящие связи и типы данных",
    )

    output_config: Mapped[dict[str, Any]] = mapped_column(
        JSON,
        nullable=False,
        default=dict,
        comment="Исходящие связи",
    )

    endpoints: Mapped[list[dict[str, Any]]] = mapped_column(
        JSON,
        nullable=False,
        default=list,
        comment="Список эндпоинтов (Capability), входящих в эту ноду",
    )

    external_inputs: Mapped[list[str]] = mapped_column(
        JSON,
        nullable=False,
        default=list,
        comment="Параметры, которые нужно запросить у пользователя",
    )

    pipeline = relationship("Pipeline", back_populates="all_nodes")
