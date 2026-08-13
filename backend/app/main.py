import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from .database import Base, engine, SessionLocal
from . import models
from .routers import (
    auth_router,
    produtos_router,
    responsaveis_router,
    compras_router,
    dashboard_router,
    ferramentas_router,
)

load_dotenv()

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Controle de Compras e Estoque - Mecanica")

origins = [o.strip() for o in os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router.router)
app.include_router(produtos_router.router)
app.include_router(responsaveis_router.router)
app.include_router(compras_router.router)
app.include_router(dashboard_router.router)
app.include_router(ferramentas_router.router)


def seed_dados_iniciais():
    """Cria alguns dados de exemplo somente se o banco estiver vazio, para
    facilitar o primeiro uso. Nao roda novamente depois que ja existirem dados."""
    db = SessionLocal()
    try:
        if db.query(models.Categoria).count() > 0:
            return

        categorias = {
            nome: models.Categoria(nome=nome)
            for nome in ["Oleo", "Filtro", "Peca", "Ferramenta", "Outros"]
        }
        db.add_all(categorias.values())
        db.commit()

        produtos = [
            models.Produto(nome="Oleo 15W40", categoria_id=categorias["Oleo"].id, unidade="L", estoque_minimo=20, quantidade_atual=45),
            models.Produto(nome="Filtro de oleo", categoria_id=categorias["Filtro"].id, unidade="un.", estoque_minimo=10, quantidade_atual=12),
            models.Produto(nome="Fluido de freio", categoria_id=categorias["Outros"].id, unidade="L", estoque_minimo=10, quantidade_atual=8),
            models.Produto(nome="Graxa", categoria_id=categorias["Outros"].id, unidade="kg", estoque_minimo=10, quantidade_atual=15),
        ]
        db.add_all(produtos)

        responsaveis = [models.Responsavel(nome=n) for n in ["Joao", "Carlos"]]
        db.add_all(responsaveis)

        ferramentas = [
            models.Ferramenta(nome="Chave de roda", quantidade=6),
            models.Ferramenta(nome="Macaco hidraulico", quantidade=4),
            models.Ferramenta(nome="Torquimetro", quantidade=2),
            models.Ferramenta(nome="Furadeira", quantidade=2),
        ]
        db.add_all(ferramentas)

        db.commit()
    finally:
        db.close()


seed_dados_iniciais()


@app.get("/api/saude")
def saude():
    return {"status": "ok"}
