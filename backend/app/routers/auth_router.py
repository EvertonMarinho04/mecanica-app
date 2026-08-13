from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .. import schemas, auth
from ..database import get_db

router = APIRouter(prefix="/api/admin", tags=["autenticacao"])


@router.post("/login", response_model=schemas.TokenResponse)
def login(dados: schemas.LoginRequest, db: Session = Depends(get_db)):
    if not auth.verificar_senha(dados.senha, db):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Senha incorreta.",
        )
    token = auth.criar_token()
    return schemas.TokenResponse(access_token=token)
