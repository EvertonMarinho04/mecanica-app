import os
from datetime import datetime, timedelta

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import bcrypt
from jose import jwt, JWTError
from sqlalchemy.orm import Session
from dotenv import load_dotenv

from .database import get_db
from .models import AdminConfig

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY", "chave-insegura-troque-no-env")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "480"))
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "admin123")

bearer_scheme = HTTPBearer(auto_error=False)


def _hash_senha(senha: str) -> str:
    return bcrypt.hashpw(senha.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def _verificar_hash(senha: str, hash_armazenado: str) -> bool:
    try:
        return bcrypt.checkpw(senha.encode("utf-8"), hash_armazenado.encode("utf-8"))
    except ValueError:
        return False


def ensure_admin_config(db: Session) -> AdminConfig:
    """Garante que exista uma linha de configuracao do admin com a senha do .env
    transformada em hash."""
    config = db.query(AdminConfig).first()
    if config is None:
        config = AdminConfig(senha_hash=_hash_senha(ADMIN_PASSWORD))
        db.add(config)
        db.commit()
        db.refresh(config)
    return config


def verificar_senha(senha_texto: str, db: Session) -> bool:
    config = ensure_admin_config(db)
    return _verificar_hash(senha_texto, config.senha_hash)


def criar_token() -> str:
    expira = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {"sub": "admin", "exp": expira}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def exigir_admin(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
):
    """Dependency que protege rotas administrativas. Lanca 401 se o token
    for invalido, ausente ou expirado."""
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Acesso restrito ao administrador.",
        )
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("sub") != "admin":
            raise JWTError()
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Sessao invalida ou expirada. Faca login novamente.",
        )
