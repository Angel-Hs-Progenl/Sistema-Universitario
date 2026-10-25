from alembic import context
from app.core.database import Base, engine
from app.core import models  # noqa: F401 - register shared tables for autogenerate
from app.modules.titulacion import models as title_models  # noqa: F401 - register module tables
from app.modules.becas import models as scholarship_models  # noqa: F401
from app.modules.evaluacion_docente import models as evaluation_models  # noqa: F401

target_metadata = Base.metadata
if context.is_offline_mode():
    context.configure(
        url=str(engine.url), target_metadata=target_metadata, literal_binds=True
    )
    with context.begin_transaction():
        context.run_migrations()
else:
    with engine.connect() as connection:
        context.configure(
            connection=connection, target_metadata=target_metadata, compare_type=True
        )
        with context.begin_transaction():
            context.run_migrations()
