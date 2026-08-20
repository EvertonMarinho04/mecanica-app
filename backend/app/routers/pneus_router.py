from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from .. import models, schemas, auth
from ..database import get_db

# Modulo de gestao de frota (pneus) - tratado como area administrativa,
# junto com o dashboard de abastecimento. Se no futuro for necessario abrir
# alguma consulta para os funcionarios, essa restricao pode ser revista.
router = APIRouter(prefix="/api/pneus", tags=["pneus"], dependencies=[Depends(auth.exigir_admin)])


def _get_ou_criar_caminhao(db: Session, placa: str) -> models.Caminhao:
    placa = placa.strip().upper()
    caminhao = db.query(models.Caminhao).filter(models.Caminhao.identificacao.ilike(placa)).first()
    if caminhao is None:
        caminhao = models.Caminhao(identificacao=placa)
        db.add(caminhao)
        db.commit()
        db.refresh(caminhao)
    return caminhao


def _pneu_para_out(pneu: models.Pneu) -> dict:
    return {
        "id": pneu.id,
        "numero": pneu.numero,
        "marca": pneu.marca,
        "modelo": pneu.modelo,
        "medida": pneu.medida,
        "km_entrada": pneu.km_entrada,
        "status": pneu.status,
        "placa_atual": pneu.caminhao.identificacao if pneu.caminhao else None,
        "posicao_atual": pneu.posicao_atual,
        "criado_em": pneu.criado_em,
    }


@router.get("", response_model=List[schemas.PneuOut])
def listar_pneus(placa: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(models.Pneu).options(joinedload(models.Pneu.caminhao))
    if placa:
        query = query.join(models.Caminhao, isouter=True).filter(models.Caminhao.identificacao.ilike(placa.strip()))
    pneus = query.order_by(models.Pneu.numero).all()
    return [_pneu_para_out(p) for p in pneus]


@router.post("", response_model=schemas.PneuOut, status_code=201)
def cadastrar_pneu(dados: schemas.PneuCreate, db: Session = Depends(get_db)):
    numero = dados.numero.strip()
    if not numero:
        raise HTTPException(status_code=400, detail="Informe o numero/ID do pneu.")

    existente = db.query(models.Pneu).filter(models.Pneu.numero.ilike(numero)).first()
    if existente:
        raise HTTPException(status_code=400, detail="Ja existe um pneu com esse numero/ID.")

    caminhao = None
    if dados.placa and dados.placa.strip():
        caminhao = _get_ou_criar_caminhao(db, dados.placa)

    pneu = models.Pneu(
        numero=numero,
        marca=(dados.marca or "").strip() or None,
        modelo=(dados.modelo or "").strip() or None,
        medida=(dados.medida or "").strip() or None,
        km_entrada=dados.km_entrada,
        status=models.StatusPneu.EM_USO.value,
        caminhao_id=caminhao.id if caminhao else None,
        posicao_atual=(dados.posicao or "").strip() or None,
        criado_em=datetime.utcnow(),
    )
    db.add(pneu)
    db.commit()
    db.refresh(pneu)
    return _pneu_para_out(pneu)


@router.get("/{pneu_id}", response_model=schemas.PneuDetalheOut)
def detalhe_pneu(pneu_id: int, db: Session = Depends(get_db)):
    pneu = db.query(models.Pneu).options(joinedload(models.Pneu.caminhao)).get(pneu_id)
    if not pneu:
        raise HTTPException(status_code=404, detail="Pneu nao encontrado.")
    base = _pneu_para_out(pneu)
    base["historico"] = pneu.movimentacoes
    return base


@router.post("/{pneu_id}/rodizio", response_model=schemas.PneuDetalheOut)
def registrar_rodizio(pneu_id: int, dados: schemas.RodizioRequest, db: Session = Depends(get_db)):
    """Registra troca de posicao e/ou de caminhao (transferencia) de um
    pneu, guardando o histórico de onde ele estava antes."""
    pneu = db.query(models.Pneu).get(pneu_id)
    if not pneu:
        raise HTTPException(status_code=404, detail="Pneu nao encontrado.")

    posicao_nova = dados.posicao_nova.strip()
    if not posicao_nova:
        raise HTTPException(status_code=400, detail="Informe a nova posicao do pneu.")

    placa_anterior = pneu.caminhao.identificacao if pneu.caminhao else None
    posicao_anterior = pneu.posicao_atual

    if dados.placa_nova and dados.placa_nova.strip():
        novo_caminhao = _get_ou_criar_caminhao(db, dados.placa_nova)
        pneu.caminhao_id = novo_caminhao.id
        placa_nova_registrada = novo_caminhao.identificacao
    else:
        placa_nova_registrada = placa_anterior

    pneu.posicao_atual = posicao_nova

    movimento = models.MovimentacaoPneu(
        pneu_id=pneu.id,
        placa_anterior=placa_anterior,
        posicao_anterior=posicao_anterior,
        placa_nova=placa_nova_registrada,
        posicao_nova=posicao_nova,
        data=datetime.utcnow(),
    )
    db.add(movimento)
    db.commit()
    db.refresh(pneu)

    base = _pneu_para_out(pneu)
    base["historico"] = pneu.movimentacoes
    return base


@router.patch("/{pneu_id}/status", response_model=schemas.PneuOut)
def atualizar_status(pneu_id: int, dados: schemas.PneuStatusUpdate, db: Session = Depends(get_db)):
    pneu = db.query(models.Pneu).get(pneu_id)
    if not pneu:
        raise HTTPException(status_code=404, detail="Pneu nao encontrado.")
    pneu.status = dados.status.value
    db.commit()
    db.refresh(pneu)
    return _pneu_para_out(pneu)
