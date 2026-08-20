from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict

from .models import StatusCompra, StatusPneu


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


class ProdutoUpdate(BaseModel):
    """Edicao de produto - somente administrador. Nao inclui quantidade_atual
    de proposito: alteracoes de estoque devem sempre passar por uma
    movimentacao rastreavel (baixa, recebimento de compra), nunca por uma
    edicao direta que apagaria esse rastro."""
    nome: str
    categoria_nome: str
    unidade: str
    ncm_sh: Optional[str] = None
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
    marca: Optional[str] = None
    quantidade: int = 0


class FerramentaCreate(FerramentaBase):
    pass


class FerramentaUpdate(BaseModel):
    quantidade: int


class FerramentaOut(FerramentaBase):
    model_config = ConfigDict(from_attributes=True)
    id: int


class FerramentaMovimentoRequest(BaseModel):
    quantidade: int


class MovimentacaoFerramentaOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    quantidade: int
    tipo: str
    saldo_apos: Optional[int] = None
    data: datetime


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
    quantidade: float  # quantidade solicitada
    quantidade_solicitada: float
    quantidade_aprovada: Optional[float] = None
    quantidade_recebida: float = 0
    quantidade_restante: float = 0
    preco_unitario: float
    valor_total: float
    fornecedor: str
    numero_nf: Optional[str] = None
    observacao: Optional[str] = None
    status: StatusCompra
    motivo_recusa: Optional[str] = None
    justificativa: Optional[str] = None
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


class AprovacaoRequest(BaseModel):
    justificativa: Optional[str] = None
    quantidade_aprovada: Optional[float] = None


class RecebimentoRequest(BaseModel):
    quantidade: float


# ---------- Estoque ----------
class BaixaEstoqueRequest(BaseModel):
    quantidade: float


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


# ---------- Abastecimento ----------
class AbastecimentoCreate(BaseModel):
    placa: str
    km_anterior: float
    km_atual: float
    litros: float


class AbastecimentoOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    placa: str
    km_anterior: float
    km_atual: float
    km_rodado: float
    litros: float
    media: float
    data: datetime


class AbastecimentoRespostaOut(BaseModel):
    """Resposta do registro de abastecimento, incluindo o alerta de desvio
    de consumo (nao bloqueante) quando aplicavel."""
    abastecimento: AbastecimentoOut
    media_historica_placa: Optional[float] = None
    alerta_consumo: Optional[str] = None


class ResumoFrotaCaminhao(BaseModel):
    placa: str
    media: float
    km_rodado: float
    litros: float


class ResumoFrota(BaseModel):
    media_frota: Optional[float] = None
    melhor_media: Optional[ResumoFrotaCaminhao] = None
    pior_media: Optional[ResumoFrotaCaminhao] = None
    km_rodado_total: float = 0
    litros_total: float = 0
    por_caminhao: List[ResumoFrotaCaminhao] = []
    abaixo_da_media: List[ResumoFrotaCaminhao] = []


# ---------- Pneus ----------
class PneuCreate(BaseModel):
    numero: str
    marca: Optional[str] = None
    modelo: Optional[str] = None
    medida: Optional[str] = None
    km_entrada: Optional[float] = None
    placa: Optional[str] = None
    posicao: Optional[str] = None


class MovimentacaoPneuOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    placa_anterior: Optional[str] = None
    posicao_anterior: Optional[str] = None
    placa_nova: Optional[str] = None
    posicao_nova: Optional[str] = None
    data: datetime


class PneuOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    numero: str
    marca: Optional[str] = None
    modelo: Optional[str] = None
    medida: Optional[str] = None
    km_entrada: Optional[float] = None
    status: StatusPneu
    placa_atual: Optional[str] = None
    posicao_atual: Optional[str] = None
    criado_em: datetime


class PneuDetalheOut(PneuOut):
    historico: List[MovimentacaoPneuOut] = []


class RodizioRequest(BaseModel):
    placa_nova: Optional[str] = None
    posicao_nova: str


class PneuStatusUpdate(BaseModel):
    status: StatusPneu
