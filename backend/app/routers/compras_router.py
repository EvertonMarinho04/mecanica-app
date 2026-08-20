from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from .. import models, schemas, auth
from ..database import get_db
from ..models import StatusCompra
from ..utils import (
    calcular_preco_medio_historico,
    calcular_variacao_percentual,
    calcular_status_exibicao,
    produto_para_out,
)

router = APIRouter(prefix="/api/compras", tags=["compras"])


def _compra_para_out(compra: models.Compra) -> dict:
    if compra.status == StatusCompra.APROVADA:
        justificativa = compra.justificativa_aprovacao
    elif compra.status == StatusCompra.RECUSADA:
        justificativa = compra.motivo_recusa
    else:
        justificativa = None

    aprovada = compra.quantidade_aprovada or 0
    recebida = compra.quantidade_recebida or 0
    restante = max(aprovada - recebida, 0) if compra.quantidade_aprovada is not None else 0

    return {
        "id": compra.id,
        "quantidade": compra.quantidade,
        "quantidade_solicitada": compra.quantidade,
        "quantidade_aprovada": compra.quantidade_aprovada,
        "quantidade_recebida": recebida,
        "quantidade_restante": restante,
        "preco_unitario": compra.preco_unitario,
        "valor_total": compra.valor_total,
        "fornecedor": compra.fornecedor,
        "numero_nf": compra.numero_nf,
        "observacao": compra.observacao,
        "status": calcular_status_exibicao(compra),
        "motivo_recusa": compra.motivo_recusa,
        "justificativa": justificativa,
        "data_registro": compra.data_registro,
        "data_decisao": compra.data_decisao,
        "produto": produto_para_out(compra.produto),
        "responsavel": compra.responsavel,
    }


# ---------- Registro de compra (funcionario, sem login) ----------
@router.post("", response_model=schemas.CompraOut, status_code=201)
def registrar_compra(dados: schemas.CompraCreate, db: Session = Depends(get_db)):
    nome_produto = dados.produto_nome.strip()
    if not nome_produto:
        raise HTTPException(status_code=400, detail="Informe o nome do produto.")

    produto = (
        db.query(models.Produto)
        .filter(models.Produto.nome.ilike(nome_produto))
        .first()
    )
    if not produto:
        raise HTTPException(
            status_code=404,
            detail=(
                f'Nao encontramos "{nome_produto}" no cadastro de peças. '
                "Cadastre a peça em \"Cadastrar peça\" antes de registrar a compra."
            ),
        )

    nome_responsavel = dados.responsavel_nome.strip()
    if not nome_responsavel:
        raise HTTPException(status_code=400, detail="Informe o nome do responsavel pela compra.")

    responsavel = (
        db.query(models.Responsavel)
        .filter(models.Responsavel.nome.ilike(nome_responsavel))
        .first()
    )
    if not responsavel:
        responsavel = models.Responsavel(nome=nome_responsavel, ativo=True)
        db.add(responsavel)
        db.commit()
        db.refresh(responsavel)

    if dados.quantidade <= 0:
        raise HTTPException(status_code=400, detail="Quantidade deve ser maior que zero.")
    if dados.preco_unitario <= 0:
        raise HTTPException(status_code=400, detail="Preco unitario deve ser maior que zero.")

    valor_total = round(dados.quantidade * dados.preco_unitario, 2)

    compra = models.Compra(
        produto_id=produto.id,
        quantidade=dados.quantidade,
        preco_unitario=dados.preco_unitario,
        valor_total=valor_total,
        fornecedor=dados.fornecedor.strip(),
        numero_nf=(dados.numero_nf or "").strip() or None,
        responsavel_id=responsavel.id,
        observacao=(dados.observacao or "").strip() or None,
        caminhao_id=dados.caminhao_id,
        status=StatusCompra.PENDENTE,
        data_registro=datetime.utcnow(),
    )
    db.add(compra)
    db.commit()
    db.refresh(compra)
    return _compra_para_out(compra)


# ---------- A partir daqui, rotas administrativas ----------
@router.get("/pendentes", response_model=List[schemas.CompraOut], dependencies=[Depends(auth.exigir_admin)])
def listar_pendentes(db: Session = Depends(get_db)):
    compras = (
        db.query(models.Compra)
        .options(joinedload(models.Compra.produto).joinedload(models.Produto.categoria), joinedload(models.Compra.responsavel))
        .filter(models.Compra.status == StatusCompra.PENDENTE)
        .order_by(models.Compra.data_registro.desc())
        .all()
    )
    return [_compra_para_out(c) for c in compras]


# ---------- Minhas solicitacoes (funcionario, sem login) ----------
# Este sistema nao tem autenticacao individual para funcionarios (por
# desenho, para manter simples - o funcionario so digita o proprio nome ao
# registrar uma compra). Por isso, aqui usamos esse mesmo nome como forma de
# identificacao: o funcionario informa seu nome e ve so as solicitacoes
# registradas com esse nome exato. Nao e uma autenticacao com senha - e a
# mesma logica de identidade que ja existia no resto do sistema.
@router.get("/minhas", response_model=List[schemas.CompraOut])
def minhas_solicitacoes(responsavel_nome: str, db: Session = Depends(get_db)):
    nome = responsavel_nome.strip()
    if not nome:
        raise HTTPException(status_code=400, detail="Informe seu nome para ver suas solicitacoes.")

    compras = (
        db.query(models.Compra)
        .join(models.Responsavel)
        .options(joinedload(models.Compra.produto).joinedload(models.Produto.categoria), joinedload(models.Compra.responsavel))
        .filter(models.Responsavel.nome.ilike(nome))
        .order_by(models.Compra.data_registro.desc())
        .all()
    )
    return [_compra_para_out(c) for c in compras]


@router.get("/{compra_id}", response_model=schemas.CompraDetalheOut, dependencies=[Depends(auth.exigir_admin)])
def detalhe_compra(compra_id: int, db: Session = Depends(get_db)):
    compra = db.query(models.Compra).get(compra_id)
    if not compra:
        raise HTTPException(status_code=404, detail="Compra nao encontrada.")
    preco_medio = calcular_preco_medio_historico(db, compra.produto_id, excluir_compra_id=compra.id)
    variacao = calcular_variacao_percentual(compra.preco_unitario, preco_medio)
    base = _compra_para_out(compra)
    base["preco_medio_historico"] = preco_medio
    base["variacao_percentual"] = variacao
    base["estoque_atual_produto"] = compra.produto.quantidade_atual
    return base


@router.post("/{compra_id}/aprovar", response_model=schemas.CompraOut, dependencies=[Depends(auth.exigir_admin)])
def aprovar_compra(compra_id: int, dados: schemas.AprovacaoRequest = schemas.AprovacaoRequest(), db: Session = Depends(get_db)):
    compra = db.query(models.Compra).get(compra_id)
    if not compra:
        raise HTTPException(status_code=404, detail="Compra nao encontrada.")
    if compra.status != StatusCompra.PENDENTE:
        raise HTTPException(status_code=400, detail="Esta compra ja foi analisada.")

    quantidade_aprovada = dados.quantidade_aprovada if dados.quantidade_aprovada is not None else compra.quantidade
    if quantidade_aprovada <= 0:
        raise HTTPException(status_code=400, detail="A quantidade aprovada deve ser maior que zero.")
    if quantidade_aprovada > compra.quantidade:
        raise HTTPException(
            status_code=400,
            detail="A quantidade aprovada nao pode ser maior que a quantidade solicitada.",
        )

    compra.status = StatusCompra.APROVADA
    compra.data_decisao = datetime.utcnow()
    compra.justificativa_aprovacao = (dados.justificativa or "").strip() or None
    compra.quantidade_aprovada = quantidade_aprovada
    compra.quantidade_recebida = 0

    # O estoque NAO e alterado aqui. So aumenta quando o funcionario
    # registrar o recebimento de fato (rota /receber), com a quantidade
    # realmente recebida - que pode ser menor que a aprovada e pode ser
    # recebida em mais de uma vez (recebimento parcial).
    historico = models.HistoricoPreco(
        produto_id=compra.produto_id,
        compra_id=compra.id,
        preco_unitario=compra.preco_unitario,
        data=datetime.utcnow(),
    )
    db.add(historico)
    db.commit()
    db.refresh(compra)
    return _compra_para_out(compra)


@router.post("/{compra_id}/recusar", response_model=schemas.CompraOut, dependencies=[Depends(auth.exigir_admin)])
def recusar_compra(compra_id: int, dados: schemas.RecusaRequest, db: Session = Depends(get_db)):
    compra = db.query(models.Compra).get(compra_id)
    if not compra:
        raise HTTPException(status_code=404, detail="Compra nao encontrada.")
    if compra.status != StatusCompra.PENDENTE:
        raise HTTPException(status_code=400, detail="Esta compra ja foi analisada.")

    compra.status = StatusCompra.RECUSADA
    compra.data_decisao = datetime.utcnow()
    compra.motivo_recusa = (dados.motivo or "").strip() or None
    db.commit()
    db.refresh(compra)
    return _compra_para_out(compra)


# ---------- Registrar recebimento (funcionario, sem login) ----------
@router.post("/{compra_id}/receber", response_model=schemas.CompraOut)
def registrar_recebimento(compra_id: int, dados: schemas.RecebimentoRequest, db: Session = Depends(get_db)):
    """So aqui o estoque e efetivamente aumentado - com a quantidade
    realmente recebida, nunca com a solicitada ou a aprovada
    automaticamente. Permite recebimento parcial (varias chamadas ate
    completar a quantidade aprovada) e impede receber mais do que foi
    aprovado, inclusive somando recebimentos anteriores."""
    compra = db.query(models.Compra).get(compra_id)
    if not compra:
        raise HTTPException(status_code=404, detail="Compra nao encontrada.")
    if compra.status != StatusCompra.APROVADA:
        raise HTTPException(status_code=400, detail="Esta compra nao esta aprovada para receber material.")
    if dados.quantidade <= 0:
        raise HTTPException(status_code=400, detail="A quantidade recebida deve ser maior que zero.")

    aprovada = compra.quantidade_aprovada or 0
    ja_recebida = compra.quantidade_recebida or 0
    restante = aprovada - ja_recebida

    if dados.quantidade > restante:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Quantidade maior do que o pendente de recebimento "
                f"(restam {restante} {compra.produto.unidade})."
            ),
        )

    compra.quantidade_recebida = ja_recebida + dados.quantidade

    produto = compra.produto
    produto.quantidade_atual = (produto.quantidade_atual or 0) + dados.quantidade

    movimentacao = models.MovimentacaoEstoque(
        produto_id=produto.id,
        compra_id=compra.id,
        quantidade=dados.quantidade,
        tipo="recebimento_compra",
        data=datetime.utcnow(),
    )
    db.add(movimentacao)
    db.commit()
    db.refresh(compra)
    return _compra_para_out(compra)


@router.get("", response_model=List[schemas.CompraOut], dependencies=[Depends(auth.exigir_admin)])
def historico_compras(
    status_filtro: Optional[str] = None,
    produto_id: Optional[int] = None,
    responsavel_id: Optional[int] = None,
    data_inicio: Optional[datetime] = None,
    data_fim: Optional[datetime] = None,
    db: Session = Depends(get_db),
):
    query = db.query(models.Compra).options(
        joinedload(models.Compra.produto).joinedload(models.Produto.categoria),
        joinedload(models.Compra.responsavel),
    )
    if produto_id:
        query = query.filter(models.Compra.produto_id == produto_id)
    if responsavel_id:
        query = query.filter(models.Compra.responsavel_id == responsavel_id)
    if data_inicio:
        query = query.filter(models.Compra.data_registro >= data_inicio)
    if data_fim:
        query = query.filter(models.Compra.data_registro <= data_fim)

    compras = query.order_by(models.Compra.data_registro.desc()).all()

    # O filtro por status e feito aqui (em Python) e nao na consulta ao
    # banco, porque "parcialmente_recebida" e "recebida" sao status
    # calculados (ver calcular_status_exibicao) e nao existem como valor
    # de fato na coluna do banco.
    if status_filtro:
        compras = [c for c in compras if calcular_status_exibicao(c) == status_filtro]

    return [_compra_para_out(c) for c in compras]
