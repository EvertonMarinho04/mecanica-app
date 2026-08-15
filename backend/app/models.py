import enum
from datetime import datetime

from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    ForeignKey,
    DateTime,
    Text,
    Boolean,
    Enum,
)
from sqlalchemy.orm import relationship

from .database import Base


class StatusCompra(str, enum.Enum):
    PENDENTE = "pendente"
    APROVADA = "aprovada"
    RECUSADA = "recusada"


class Categoria(Base):
    __tablename__ = "categorias"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String, unique=True, nullable=False)

    produtos = relationship("Produto", back_populates="categoria")


class Produto(Base):
    __tablename__ = "produtos"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String, nullable=False, index=True)
    categoria_id = Column(Integer, ForeignKey("categorias.id"), nullable=False)
    unidade = Column(String, nullable=False)  # ex: L, un., kg
    ncm_sh = Column(String, nullable=True)
    estoque_minimo = Column(Float, nullable=False, default=0)
    quantidade_atual = Column(Float, nullable=False, default=0)
    criado_em = Column(DateTime, default=datetime.utcnow)

    categoria = relationship("Categoria", back_populates="produtos")
    compras = relationship("Compra", back_populates="produto")
    movimentacoes = relationship("MovimentacaoEstoque", back_populates="produto")
    historico_precos = relationship("HistoricoPreco", back_populates="produto")


class Responsavel(Base):
    __tablename__ = "responsaveis"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String, unique=True, nullable=False)
    ativo = Column(Boolean, default=True)

    compras = relationship("Compra", back_populates="responsavel")


class Caminhao(Base):
    """Cadastro minimo, preparado para uso futuro (associar compras a caminhoes)."""

    __tablename__ = "caminhoes"

    id = Column(Integer, primary_key=True, index=True)
    identificacao = Column(String, unique=True, nullable=False)  # placa ou numero da frota

    compras = relationship("Compra", back_populates="caminhao")


class Compra(Base):
    __tablename__ = "compras"

    id = Column(Integer, primary_key=True, index=True)
    produto_id = Column(Integer, ForeignKey("produtos.id"), nullable=False)
    quantidade = Column(Float, nullable=False)
    preco_unitario = Column(Float, nullable=False)
    valor_total = Column(Float, nullable=False)
    fornecedor = Column(String, nullable=False)
    numero_nf = Column(String, nullable=True)
    responsavel_id = Column(Integer, ForeignKey("responsaveis.id"), nullable=False)
    caminhao_id = Column(Integer, ForeignKey("caminhoes.id"), nullable=True)
    observacao = Column(Text, nullable=True)

    status = Column(Enum(StatusCompra), default=StatusCompra.PENDENTE, nullable=False)
    motivo_recusa = Column(Text, nullable=True)
    justificativa_aprovacao = Column(Text, nullable=True)

    data_registro = Column(DateTime, default=datetime.utcnow)
    data_decisao = Column(DateTime, nullable=True)

    produto = relationship("Produto", back_populates="compras")
    responsavel = relationship("Responsavel", back_populates="compras")
    caminhao = relationship("Caminhao", back_populates="compras")
    movimentacao = relationship("MovimentacaoEstoque", back_populates="compra", uselist=False)
    historico_preco = relationship("HistoricoPreco", back_populates="compra", uselist=False)


class MovimentacaoEstoque(Base):
    """Toda movimentacao de estoque gerada por uma compra aprovada."""

    __tablename__ = "movimentacoes_estoque"

    id = Column(Integer, primary_key=True, index=True)
    produto_id = Column(Integer, ForeignKey("produtos.id"), nullable=False)
    compra_id = Column(Integer, ForeignKey("compras.id"), nullable=True)
    quantidade = Column(Float, nullable=False)  # positivo = entrada
    tipo = Column(String, default="entrada")
    data = Column(DateTime, default=datetime.utcnow)

    produto = relationship("Produto", back_populates="movimentacoes")
    compra = relationship("Compra", back_populates="movimentacao")


class HistoricoPreco(Base):
    __tablename__ = "historico_precos"

    id = Column(Integer, primary_key=True, index=True)
    produto_id = Column(Integer, ForeignKey("produtos.id"), nullable=False)
    compra_id = Column(Integer, ForeignKey("compras.id"), nullable=True)
    preco_unitario = Column(Float, nullable=False)
    data = Column(DateTime, default=datetime.utcnow)

    produto = relationship("Produto", back_populates="historico_precos")
    compra = relationship("Compra", back_populates="historico_preco")


class Ferramenta(Base):
    __tablename__ = "ferramentas"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String, unique=True, nullable=False)
    quantidade = Column(Integer, nullable=False, default=0)


class AdminConfig(Base):
    """Guarda o hash da senha do administrador (linha unica)."""

    __tablename__ = "admin_config"

    id = Column(Integer, primary_key=True, index=True)
    senha_hash = Column(String, nullable=False)
    atualizado_em = Column(DateTime, default=datetime.utcnow)
