from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from .. import models, schemas, auth
from ..database import get_db
from ..models import StatusCompra
from ..utils import calcular_preco_medio_historico, calcular_variacao_percentual, produto_para_out

router = APIRouter(prefix="/api/compras", tags=["compras"])


def _compra_para_out(compra: models.Compra) -> dict:
    return {
        "id": compra.id,
        "quantidade": compra.quantidade,
        "preco_unitario": compra.preco_unitario,
        "valor_total": compra.valor_total,
        "fornecedor": compra.fornecedor,
        "numero_nf": compra.numero_nf,
        "observacao": compra.observacao,
        "status": compra.status,
        "motivo_recusa": compra.motivo_recusa,
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
def aprovar_compra(compra_id: int, db: Session = Depends(get_db)):
    compra = db.query(models.Compra).get(compra_id)
    if not compra:
        raise HTTPException(status_code=404, detail="Compra nao encontrada.")
    if compra.status != StatusCompra.PENDENTE:
        raise HTTPException(status_code=400, detail="Esta compra ja foi analisada.")

    compra.status = StatusCompra.APROVADA
    compra.data_decisao = datetime.utcnow()

    produto = compra.produto
    produto.quantidade_atual = (produto.quantidade_atual or 0) + compra.quantidade

    movimentacao = models.MovimentacaoEstoque(
        produto_id=produto.id,
        compra_id=compra.id,
        quantidade=compra.quantidade,
        tipo="entrada",
        data=datetime.utcnow(),
    )
    historico = models.HistoricoPreco(
        produto_id=produto.id,
        compra_id=compra.id,
        preco_unitario=compra.preco_unitario,
        data=datetime.utcnow(),
    )
    db.add(movimentacao)
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


@router.get("", response_model=List[schemas.CompraOut], dependencies=[Depends(auth.exigir_admin)])
def historico_compras(
    status_filtro: Optional[StatusCompra] = None,
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
    if status_filtro:
        query = query.filter(models.Compra.status == status_filtro)
    if produto_id:
        query = query.filter(models.Compra.produto_id == produto_id)
    if responsavel_id:
        query = query.filter(models.Compra.responsavel_id == responsavel_id)
    if data_inicio:
        query = query.filter(models.Compra.data_registro >= data_inicio)
    if data_fim:
        query = query.filter(models.Compra.data_registro <= data_fim)

    compras = query.order_by(models.Compra.data_registro.desc()).all()
    return [_compra_para_out(c) for c in compras]
