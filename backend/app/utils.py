from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy import desc

from . import models


def calcular_preco_medio_historico(db: Session, produto_id: int, excluir_compra_id: Optional[int] = None) -> Optional[float]:
    """Media dos precos das compras aprovadas anteriores desse produto."""
    query = (
        db.query(models.HistoricoPreco)
        .filter(models.HistoricoPreco.produto_id == produto_id)
        .order_by(desc(models.HistoricoPreco.data))
    )
    registros = query.all()
    if excluir_compra_id is not None:
        registros = [r for r in registros if r.compra_id != excluir_compra_id]
    if not registros:
        return None
    return sum(r.preco_unitario for r in registros) / len(registros)


def calcular_variacao_percentual(preco_atual: float, preco_referencia: Optional[float]) -> Optional[float]:
    if not preco_referencia:
        return None
    return round(((preco_atual - preco_referencia) / preco_referencia) * 100, 1)


def calcular_status_exibicao(compra: "models.Compra") -> str:
    """O banco so guarda pendente/aprovada/recusada (ver models.StatusCompra).
    'Parcialmente recebida' e 'recebida' sao calculados aqui, comparando o
    que foi recebido com o que foi aprovado - assim nao precisamos alterar
    o tipo enum nativo do banco em producao."""
    if compra.status == models.StatusCompra.RECUSADA:
        return models.StatusCompra.RECUSADA.value
    if compra.status == models.StatusCompra.PENDENTE:
        return models.StatusCompra.PENDENTE.value

    # APROVADA
    aprovada = compra.quantidade_aprovada or 0
    recebida = compra.quantidade_recebida or 0
    if recebida <= 0:
        return models.StatusCompra.APROVADA.value
    if recebida >= aprovada:
        return models.StatusCompra.RECEBIDA.value
    return models.StatusCompra.PARCIALMENTE_RECEBIDA.value


def produto_para_out(produto: models.Produto) -> dict:
    return {
        "id": produto.id,
        "nome": produto.nome,
        "unidade": produto.unidade,
        "ncm_sh": produto.ncm_sh,
        "estoque_minimo": produto.estoque_minimo,
        "quantidade_atual": produto.quantidade_atual,
        "categoria": produto.categoria,
        "estoque_baixo": produto.quantidade_atual < produto.estoque_minimo,
    }
