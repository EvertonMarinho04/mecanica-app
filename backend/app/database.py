import os
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./mecanica.db")

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def aplicar_migracoes_leves():
    """Este projeto nao usa uma ferramenta de migracao (Alembic) de proposito,
    para manter tudo simples. Quando uma coluna nova e adicionada a um model
    depois que o banco ja existe em producao, o create_all() do SQLAlchemy
    NAO adiciona colunas em tabelas ja existentes - so cria tabelas que
    faltam. Por isso, colunas novas sao adicionadas aqui manualmente, de
    forma segura (so adiciona se ainda nao existir). Funciona tanto em
    SQLite (desenvolvimento local) quanto em PostgreSQL (producao)."""
    inspector = inspect(engine)
    if "compras" not in inspector.get_table_names():
        # Tabela ainda nem existe (banco novo) - o create_all() ja cuida disso.
        return

    colunas_existentes = {c["name"] for c in inspector.get_columns("compras")}

    colunas_novas = {
        "justificativa_aprovacao": "TEXT",
        "quantidade_aprovada": "FLOAT",
        "quantidade_recebida": "FLOAT DEFAULT 0",
    }

    with engine.begin() as conn:
        for nome_coluna, tipo_sql in colunas_novas.items():
            if nome_coluna not in colunas_existentes:
                conn.execute(text(f"ALTER TABLE compras ADD COLUMN {nome_coluna} {tipo_sql}"))
        if "quantidade_recebida" not in colunas_existentes:
            conn.execute(text("UPDATE compras SET quantidade_recebida = 0 WHERE quantidade_recebida IS NULL"))

    if "ferramentas" in inspector.get_table_names():
        colunas_ferramentas = {c["name"] for c in inspector.get_columns("ferramentas")}
        if "marca" not in colunas_ferramentas:
            with engine.begin() as conn:
                conn.execute(text("ALTER TABLE ferramentas ADD COLUMN marca VARCHAR"))
