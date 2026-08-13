from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import models, schemas
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
    ferramenta = models.Ferramenta(nome=dados.nome.strip(), quantidade=dados.quantidade)
    db.add(ferramenta)
    db.commit()
    db.refresh(ferramenta)
    return ferramenta


@router.put("/{ferramenta_id}", response_model=schemas.FerramentaOut)
def atualizar_ferramenta(ferramenta_id: int, dados: schemas.FerramentaUpdate, db: Session = Depends(get_db)):
    ferramenta = db.query(models.Ferramenta).get(ferramenta_id)
    if not ferramenta:
        raise HTTPException(status_code=404, detail="Ferramenta nao encontrada.")
    if dados.quantidade < 0:
        raise HTTPException(status_code=400, detail="Quantidade nao pode ser negativa.")
    ferramenta.quantidade = dados.quantidade
    db.commit()
    db.refresh(ferramenta)
    return ferramenta


@router.delete("/{ferramenta_id}", status_code=204)
def excluir_ferramenta(ferramenta_id: int, db: Session = Depends(get_db)):
    ferramenta = db.query(models.Ferramenta).get(ferramenta_id)
    if not ferramenta:
        raise HTTPException(status_code=404, detail="Ferramenta nao encontrada.")
    db.delete(ferramenta)
    db.commit()
