from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import models, schemas, auth
from ..database import get_db

router = APIRouter(prefix="/api/responsaveis", tags=["responsaveis"])


@router.get("", response_model=List[schemas.ResponsavelOut])
def listar_responsaveis(db: Session = Depends(get_db)):
    return (
        db.query(models.Responsavel)
        .filter(models.Responsavel.ativo == True)  # noqa: E712
        .order_by(models.Responsavel.nome)
        .all()
    )


@router.post("", response_model=schemas.ResponsavelOut, status_code=201, dependencies=[Depends(auth.exigir_admin)])
def criar_responsavel(dados: schemas.ResponsavelCreate, db: Session = Depends(get_db)):
    existente = db.query(models.Responsavel).filter(models.Responsavel.nome.ilike(dados.nome.strip())).first()
    if existente:
        raise HTTPException(status_code=400, detail="Ja existe um responsavel com esse nome.")
    responsavel = models.Responsavel(nome=dados.nome.strip(), ativo=True)
    db.add(responsavel)
    db.commit()
    db.refresh(responsavel)
    return responsavel


@router.delete("/{responsavel_id}", status_code=204, dependencies=[Depends(auth.exigir_admin)])
def desativar_responsavel(responsavel_id: int, db: Session = Depends(get_db)):
    responsavel = db.query(models.Responsavel).get(responsavel_id)
    if not responsavel:
        raise HTTPException(status_code=404, detail="Responsavel nao encontrado.")
    responsavel.ativo = False
    db.commit()
