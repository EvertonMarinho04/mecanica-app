from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict

from .models import StatusCompra


# ---------- Categoria ----------
class CategoriaBase(BaseModel):
    nome: str


class CategoriaOut(CategoriaBase):
    model_config = ConfigDict(from_attributes=True)
    id: int


# ---------- Produto ----------
class ProdutoCreate(BaseModel):
    nome: str
    categoria_nome: str
    unidade: str
    ncm_sh: Optional[str] = None
    estoque_atual: float = 0
    estoque_minimo: float = 0


class ProdutoOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    nome: str
    unidade: str
    ncm_sh: Optional[str] = None
    estoque_minimo: float
    quantidade_atual: float
    categoria: CategoriaOut
    estoque_baixo: bool = False


# ---------- Responsavel ----------
class ResponsavelBase(BaseModel):
    nome: str


class ResponsavelCreate(ResponsavelBase):
    pass


class ResponsavelOut(ResponsavelBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    ativo: bool


# ---------- Ferramenta ----------
class FerramentaBase(BaseModel):
    nome: str
    quantidade: int = 0


class FerramentaCreate(FerramentaBase):
    pass


class FerramentaUpdate(BaseModel):
    quantidade: int


class FerramentaOut(FerramentaBase):
    model_config = ConfigDict(from_attributes=True)
    id: int


# ---------- Compra ----------
class CompraCreate(BaseModel):
    produto_nome: str
    quantidade: float
    preco_unitario: float
    fornecedor: str
    numero_nf: Optional[str] = None
    responsavel_nome: str
    observacao: Optional[str] = None
    caminhao_id: Optional[int] = None


class CompraOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    quantidade: float
    preco_unitario: float
    valor_total: float
    fornecedor: str
    numero_nf: Optional[str] = None
    observacao: Optional[str] = None
    status: StatusCompra
    motivo_recusa: Optional[str] = None
    data_registro: datetime
    data_decisao: Optional[datetime] = None
    produto: ProdutoOut
    responsavel: ResponsavelOut


class CompraDetalheOut(CompraOut):
    preco_medio_historico: Optional[float] = None
    variacao_percentual: Optional[float] = None
    estoque_atual_produto: float


class RecusaRequest(BaseModel):
    motivo: Optional[str] = None


# ---------- Admin auth ----------
class LoginRequest(BaseModel):
    senha: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


# ---------- Dashboard ----------
class ResumoDashboard(BaseModel):
    total_gasto_mes: float
    numero_compras_mes: int
    itens_em_estoque: int
    compras_pendentes: int


class GastoMensal(BaseModel):
    mes: str
    total: float


class GastoCategoria(BaseModel):
    categoria: str
    total: float


class ProdutoMaiorAumento(BaseModel):
    produto: str
    variacao_percentual: float
    preco_anterior: float
    preco_atual: float


class ProdutoMaisComprado(BaseModel):
    produto: str
    quantidade_total: float
    unidade: str
