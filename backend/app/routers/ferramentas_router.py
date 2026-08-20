from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import models, schemas, auth
from ..database import get_db

router = APIRouter(prefix="/api/ferramentas", tags=["ferramentas"])


@router.get("", response_model=List[schemas.FerramentaOut])
def listar_ferramentas(db: Session = Depends(get_db)):
    return db.query(models.Ferramenta).order_by(models.Ferramenta.nome).all()


@router.post("", response_model=schemas.FerramentaOut, status_code=201)
def criar_ferramenta(dados: schemas.FerramentaCreate, db: Session = Depends(get_db)):
    existente = db.query(models.Ferramenta).filter(models.Ferramenta.nome.ilike(dados.nome.strip())).first()
    if existente:
        raise HTTPException(status_code=400, detail="Ja existe uma ferramenta com esse nome.")
    ferramenta = models.Ferramenta(
        nome=dados.nome.strip(),
        marca=(dados.marca or "").strip() or None,
        quantidade=dados.quantidade,
    )
    db.add(ferramenta)
    db.commit()
    db.refresh(ferramenta)
    return ferramenta


@router.delete("/{ferramenta_id}", status_code=204, dependencies=[Depends(auth.exigir_admin)])
def excluir_ferramenta(ferramenta_id: int, db: Session = Depends(get_db)):
    ferramenta = db.query(models.Ferramenta).get(ferramenta_id)
    if not ferramenta:
        raise HTTPException(status_code=404, detail="Ferramenta nao encontrada.")
    db.delete(ferramenta)
    db.commit()


def _registrar_movimento(db: Session, ferramenta: models.Ferramenta, quantidade_assinada: int, tipo: str):
    movimento = models.MovimentacaoFerramenta(
        ferramenta_id=ferramenta.id,
        quantidade=quantidade_assinada,
        tipo=tipo,
        saldo_apos=ferramenta.quantidade,
        data=datetime.utcnow(),
    )
    db.add(movimento)


# ---------- Entrada de ferramenta no estoque (qualquer funcionario) ----------
@router.patch("/{ferramenta_id}/entrada", response_model=schemas.FerramentaOut)
def registrar_entrada(ferramenta_id: int, dados: schemas.FerramentaMovimentoRequest, db: Session = Depends(get_db)):
    ferramenta = db.query(models.Ferramenta).get(ferramenta_id)
    if not ferramenta:
        raise HTTPException(status_code=404, detail="Ferramenta nao encontrada.")
    if dados.quantidade <= 0:
        raise HTTPException(status_code=400, detail="A quantidade deve ser maior que zero.")

    ferramenta.quantidade += dados.quantidade
    _registrar_movimento(db, ferramenta, dados.quantidade, "entrada")
    db.commit()
    db.refresh(ferramenta)
    return ferramenta


# ---------- Saida de ferramenta do estoque (somente administrador) ----------
@router.patch("/{ferramenta_id}/saida", response_model=schemas.FerramentaOut, dependencies=[Depends(auth.exigir_admin)])
def registrar_saida(ferramenta_id: int, dados: schemas.FerramentaMovimentoRequest, db: Session = Depends(get_db)):
    """So o administrador pode dar baixa em ferramentas - a ideia e evitar
    que alguem retire uma ferramenta e altere o estoque sem rastreabilidade
    (toda saida fica registrada em MovimentacaoFerramenta)."""
    ferramenta = db.query(models.Ferramenta).get(ferramenta_id)
    if not ferramenta:
        raise HTTPException(status_code=404, detail="Ferramenta nao encontrada.")
    if dados.quantidade <= 0:
        raise HTTPException(status_code=400, detail="A quantidade deve ser maior que zero.")
    if dados.quantidade > ferramenta.quantidade:
        raise HTTPException(status_code=400, detail="Quantidade maior do que a disponivel em estoque.")

    ferramenta.quantidade -= dados.quantidade
    _registrar_movimento(db, ferramenta, -dados.quantidade, "saida")
    db.commit()
    db.refresh(ferramenta)
    return ferramenta


@router.get("/{ferramenta_id}/movimentacoes", response_model=List[schemas.MovimentacaoFerramentaOut], dependencies=[Depends(auth.exigir_admin)])
def historico_movimentacoes(ferramenta_id: int, db: Session = Depends(get_db)):
    ferramenta = db.query(models.Ferramenta).get(ferramenta_id)
    if not ferramenta:
        raise HTTPException(status_code=404, detail="Ferramenta nao encontrada.")
    return (
        db.query(models.MovimentacaoFerramenta)
        .filter(models.MovimentacaoFerramenta.ferramenta_id == ferramenta_id)
        .order_by(models.MovimentacaoFerramenta.data.desc())
        .all()
    )
