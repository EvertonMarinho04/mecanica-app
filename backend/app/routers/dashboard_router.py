from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy import func, extract
from sqlalchemy.orm import Session

from .. import models, schemas, auth
from ..database import get_db
from ..models import StatusCompra
from ..utils import calcular_preco_medio_historico, calcular_variacao_percentual

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"], dependencies=[Depends(auth.exigir_admin)])

NOMES_MESES = {
    1: "Janeiro", 2: "Fevereiro", 3: "Marco", 4: "Abril", 5: "Maio", 6: "Junho",
    7: "Julho", 8: "Agosto", 9: "Setembro", 10: "Outubro", 11: "Novembro", 12: "Dezembro",
}


@router.get("/resumo", response_model=schemas.ResumoDashboard)
def resumo(db: Session = Depends(get_db)):
    agora = datetime.utcnow()

    total_gasto_mes = (
        db.query(func.coalesce(func.sum(models.Compra.valor_total), 0.0))
        .filter(
            models.Compra.status == StatusCompra.APROVADA,
            extract("year", models.Compra.data_decisao) == agora.year,
            extract("month", models.Compra.data_decisao) == agora.month,
        )
        .scalar()
    )
    numero_compras_mes = (
        db.query(func.count(models.Compra.id))
        .filter(
            models.Compra.status == StatusCompra.APROVADA,
            extract("year", models.Compra.data_decisao) == agora.year,
            extract("month", models.Compra.data_decisao) == agora.month,
        )
        .scalar()
    )
    itens_em_estoque = db.query(func.count(models.Produto.id)).scalar()
    compras_pendentes = (
        db.query(func.count(models.Compra.id))
        .filter(models.Compra.status == StatusCompra.PENDENTE)
        .scalar()
    )

    return schemas.ResumoDashboard(
        total_gasto_mes=round(total_gasto_mes or 0, 2),
        numero_compras_mes=numero_compras_mes or 0,
        itens_em_estoque=itens_em_estoque or 0,
        compras_pendentes=compras_pendentes or 0,
    )


@router.get("/gastos-mensais", response_model=List[schemas.GastoMensal])
def gastos_mensais(db: Session = Depends(get_db)):
    """Retorna o total gasto (compras aprovadas) nos ultimos 6 meses, mais recente por ultimo."""
    agora = datetime.utcnow()
    resultado = []
    ano, mes = agora.year, agora.month
    meses_alvo = []
    for _ in range(6):
        meses_alvo.append((ano, mes))
        mes -= 1
        if mes == 0:
            mes = 12
            ano -= 1
    meses_alvo.reverse()

    for ano_ref, mes_ref in meses_alvo:
        total = (
            db.query(func.coalesce(func.sum(models.Compra.valor_total), 0.0))
            .filter(
                models.Compra.status == StatusCompra.APROVADA,
                extract("year", models.Compra.data_decisao) == ano_ref,
                extract("month", models.Compra.data_decisao) == mes_ref,
            )
            .scalar()
        )
        resultado.append(schemas.GastoMensal(mes=f"{NOMES_MESES[mes_ref]}/{ano_ref}", total=round(total or 0, 2)))
    return resultado


@router.get("/gastos-por-categoria", response_model=List[schemas.GastoCategoria])
def gastos_por_categoria(db: Session = Depends(get_db)):
    agora = datetime.utcnow()
    linhas = (
        db.query(models.Categoria.nome, func.coalesce(func.sum(models.Compra.valor_total), 0.0))
        .join(models.Produto, models.Produto.categoria_id == models.Categoria.id)
        .join(models.Compra, models.Compra.produto_id == models.Produto.id)
        .filter(
            models.Compra.status == StatusCompra.APROVADA,
            extract("year", models.Compra.data_decisao) == agora.year,
            extract("month", models.Compra.data_decisao) == agora.month,
        )
        .group_by(models.Categoria.nome)
        .order_by(func.sum(models.Compra.valor_total).desc())
        .all()
    )
    return [schemas.GastoCategoria(categoria=nome, total=round(total, 2)) for nome, total in linhas]


@router.get("/maiores-aumentos", response_model=List[schemas.ProdutoMaiorAumento])
def maiores_aumentos(db: Session = Depends(get_db)):
    """Para cada produto com pelo menos 2 compras aprovadas, compara o preco mais
    recente com a media das compras anteriores e retorna os maiores aumentos."""
    produtos = db.query(models.Produto).all()
    resultados = []
    for produto in produtos:
        historico = (
            db.query(models.HistoricoPreco)
            .filter(models.HistoricoPreco.produto_id == produto.id)
            .order_by(models.HistoricoPreco.data.desc())
            .all()
        )
        if len(historico) < 2:
            continue
        preco_atual = historico[0].preco_unitario
        preco_anterior = sum(h.preco_unitario for h in historico[1:]) / len(historico[1:])
        variacao = calcular_variacao_percentual(preco_atual, preco_anterior)
        if variacao is not None and variacao > 0:
            resultados.append(
                schemas.ProdutoMaiorAumento(
                    produto=produto.nome,
                    variacao_percentual=variacao,
                    preco_anterior=round(preco_anterior, 2),
                    preco_atual=round(preco_atual, 2),
                )
            )
    resultados.sort(key=lambda r: r.variacao_percentual, reverse=True)
    return resultados[:5]


@router.get("/mais-comprados", response_model=List[schemas.ProdutoMaisComprado])
def mais_comprados(db: Session = Depends(get_db)):
    agora = datetime.utcnow()
    linhas = (
        db.query(models.Produto.nome, models.Produto.unidade, func.coalesce(func.sum(models.Compra.quantidade), 0.0))
        .join(models.Compra, models.Compra.produto_id == models.Produto.id)
        .filter(
            models.Compra.status == StatusCompra.APROVADA,
            extract("year", models.Compra.data_decisao) == agora.year,
            extract("month", models.Compra.data_decisao) == agora.month,
        )
        .group_by(models.Produto.nome, models.Produto.unidade)
        .order_by(func.sum(models.Compra.quantidade).desc())
        .limit(5)
        .all()
    )
    return [
        schemas.ProdutoMaisComprado(produto=nome, quantidade_total=qtd, unidade=unidade)
        for nome, unidade, qtd in linhas
    ]
