from datetime import datetime, timedelta
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from .. import models, schemas, auth
from ..database import get_db

router = APIRouter(prefix="/api/abastecimentos", tags=["abastecimento"])

LIMITE_DESVIO_PERCENTUAL = 30  # acima/abaixo disso do historico do caminhao, mostra alerta


def _get_ou_criar_caminhao(db: Session, placa: str) -> models.Caminhao:
    placa = placa.strip().upper()
    caminhao = db.query(models.Caminhao).filter(models.Caminhao.identificacao.ilike(placa)).first()
    if caminhao is None:
        caminhao = models.Caminhao(identificacao=placa)
        db.add(caminhao)
        db.commit()
        db.refresh(caminhao)
    return caminhao


def _abastecimento_para_out(abastecimento: models.Abastecimento) -> dict:
    return {
        "id": abastecimento.id,
        "placa": abastecimento.caminhao.identificacao,
        "km_anterior": abastecimento.km_anterior,
        "km_atual": abastecimento.km_atual,
        "km_rodado": abastecimento.km_rodado,
        "litros": abastecimento.litros,
        "media": abastecimento.media,
        "data": abastecimento.data,
    }


# ---------- Registrar abastecimento (funcionario, sem login - identifica pela placa) ----------
@router.post("", response_model=schemas.AbastecimentoRespostaOut, status_code=201)
def registrar_abastecimento(dados: schemas.AbastecimentoCreate, db: Session = Depends(get_db)):
    if not dados.placa.strip():
        raise HTTPException(status_code=400, detail="Informe a placa do caminhao.")
    if dados.km_atual < dados.km_anterior:
        raise HTTPException(status_code=400, detail="KM atual nao pode ser menor que KM anterior.")
    if dados.litros <= 0:
        raise HTTPException(status_code=400, detail="Litros abastecidos deve ser maior que zero.")

    caminhao = _get_ou_criar_caminhao(db, dados.placa)

    km_rodado = dados.km_atual - dados.km_anterior
    media = round(km_rodado / dados.litros, 2)

    # Media historica desse caminhao ANTES desse abastecimento, para o alerta
    abastecimentos_anteriores = (
        db.query(models.Abastecimento)
        .filter(models.Abastecimento.caminhao_id == caminhao.id)
        .all()
    )
    media_historica = None
    if abastecimentos_anteriores:
        media_historica = round(
            sum(a.media for a in abastecimentos_anteriores) / len(abastecimentos_anteriores), 2
        )

    alerta = None
    if media_historica and media_historica > 0:
        desvio_percentual = abs(media - media_historica) / media_historica * 100
        if desvio_percentual > LIMITE_DESVIO_PERCENTUAL:
            direcao = "acima" if media > media_historica else "abaixo"
            alerta = (
                f"A media calculada deste abastecimento ({media} km/L) esta muito {direcao} "
                f"da media historica deste caminhao ({media_historica} km/L). Verifique os dados."
            )

    abastecimento = models.Abastecimento(
        caminhao_id=caminhao.id,
        km_anterior=dados.km_anterior,
        km_atual=dados.km_atual,
        litros=dados.litros,
        km_rodado=km_rodado,
        media=media,
        data=datetime.utcnow(),
    )
    db.add(abastecimento)
    db.commit()
    db.refresh(abastecimento)

    return {
        "abastecimento": _abastecimento_para_out(abastecimento),
        "media_historica_placa": media_historica,
        "alerta_consumo": alerta,
    }


# ---------- Historico (consulta aberta) ----------
@router.get("", response_model=List[schemas.AbastecimentoOut])
def listar_abastecimentos(placa: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(models.Abastecimento).options(joinedload(models.Abastecimento.caminhao))
    if placa:
        query = query.join(models.Caminhao).filter(models.Caminhao.identificacao.ilike(placa.strip()))
    abastecimentos = query.order_by(models.Abastecimento.data.desc()).all()
    return [_abastecimento_para_out(a) for a in abastecimentos]


# ---------- Dashboard de consumo da frota (somente administrador) ----------
@router.get("/dashboard", response_model=schemas.ResumoFrota, dependencies=[Depends(auth.exigir_admin)])
def dashboard_frota(
    periodo: Optional[str] = None,  # "semana" | "mes" | None
    data_inicio: Optional[datetime] = None,
    data_fim: Optional[datetime] = None,
    db: Session = Depends(get_db),
):
    query = db.query(models.Abastecimento).options(joinedload(models.Abastecimento.caminhao))

    agora = datetime.utcnow()
    if periodo == "semana":
        query = query.filter(models.Abastecimento.data >= agora - timedelta(days=7))
    elif periodo == "mes":
        query = query.filter(models.Abastecimento.data >= agora - timedelta(days=30))
    if data_inicio:
        query = query.filter(models.Abastecimento.data >= data_inicio)
    if data_fim:
        query = query.filter(models.Abastecimento.data <= data_fim)

    abastecimentos = query.all()

    if not abastecimentos:
        return schemas.ResumoFrota()

    km_rodado_total = sum(a.km_rodado for a in abastecimentos)
    litros_total = sum(a.litros for a in abastecimentos)
    media_frota = round(km_rodado_total / litros_total, 2) if litros_total > 0 else None

    por_placa = {}
    for a in abastecimentos:
        placa = a.caminhao.identificacao
        if placa not in por_placa:
            por_placa[placa] = {"km_rodado": 0.0, "litros": 0.0}
        por_placa[placa]["km_rodado"] += a.km_rodado
        por_placa[placa]["litros"] += a.litros

    resumo_por_caminhao = []
    for placa, dados in por_placa.items():
        media = round(dados["km_rodado"] / dados["litros"], 2) if dados["litros"] > 0 else 0
        resumo_por_caminhao.append(
            schemas.ResumoFrotaCaminhao(
                placa=placa, media=media, km_rodado=dados["km_rodado"], litros=dados["litros"]
            )
        )
    resumo_por_caminhao.sort(key=lambda r: r.media, reverse=True)

    melhor_media = resumo_por_caminhao[0] if resumo_por_caminhao else None
    pior_media = resumo_por_caminhao[-1] if resumo_por_caminhao else None
    abaixo_da_media = (
        [r for r in resumo_por_caminhao if media_frota is not None and r.media < media_frota]
        if media_frota is not None
        else []
    )

    return schemas.ResumoFrota(
        media_frota=media_frota,
        melhor_media=melhor_media,
        pior_media=pior_media,
        km_rodado_total=km_rodado_total,
        litros_total=litros_total,
        por_caminhao=resumo_por_caminhao,
        abaixo_da_media=abaixo_da_media,
    )
