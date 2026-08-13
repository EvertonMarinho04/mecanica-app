from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from .. import models, schemas, auth
from ..database import get_db
from ..utils import produto_para_out

router = APIRouter(prefix="/api", tags=["produtos"])


@router.get("/categorias", response_model=List[schemas.CategoriaOut])
def listar_categorias(db: Session = Depends(get_db)):
    return db.query(models.Categoria).order_by(models.Categoria.nome).all()


@router.get("/produtos", response_model=List[schemas.ProdutoOut])
def listar_produtos(busca: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(models.Produto).options(joinedload(models.Produto.categoria))
    if busca:
        query = query.filter(models.Produto.nome.ilike(f"%{busca}%"))
    produtos = query.order_by(models.Produto.nome).all()
    return [produto_para_out(p) for p in produtos]


@router.post("/produtos", response_model=schemas.ProdutoOut, status_code=201)
def criar_produto(dados: schemas.ProdutoCreate, db: Session = Depends(get_db)):
    nome_categoria = dados.categoria_nome.strip()
    if not nome_categoria:
        raise HTTPException(status_code=400, detail="Categoria e obrigatoria.")

    categoria = (
        db.query(models.Categoria)
        .filter(models.Categoria.nome.ilike(nome_categoria))
        .first()
    )
    if categoria is None:
        categoria = models.Categoria(nome=nome_categoria)
        db.add(categoria)
        db.commit()
        db.refresh(categoria)

    existente = (
        db.query(models.Produto)
        .filter(models.Produto.nome.ilike(dados.nome.strip()))
        .first()
    )
    if existente:
        raise HTTPException(status_code=400, detail="Ja existe um produto com esse nome.")

    produto = models.Produto(
        nome=dados.nome.strip(),
        categoria_id=categoria.id,
        unidade=dados.unidade.strip(),
        ncm_sh=(dados.ncm_sh or "").strip() or None,
        estoque_minimo=dados.estoque_minimo,
        quantidade_atual=dados.estoque_atual,
    )
    db.add(produto)
    db.commit()
    db.refresh(produto)
    return produto_para_out(produto)


@router.delete("/produtos/{produto_id}", status_code=204, dependencies=[Depends(auth.exigir_admin)])
def excluir_produto(produto_id: int, db: Session = Depends(get_db)):
    """Exclui um produto. Somente o administrador pode excluir (rota protegida).
    Compras e movimentacoes ja registradas para esse produto sao mantidas no
    historico removendo apenas a referencia ao produto, para nao perder o
    historico financeiro."""
    produto = db.query(models.Produto).get(produto_id)
    if not produto:
        raise HTTPException(status_code=404, detail="Produto nao encontrado.")

    tem_compras = db.query(models.Compra).filter(models.Compra.produto_id == produto_id).first()
    if tem_compras:
        raise HTTPException(
            status_code=400,
            detail="Este produto ja possui compras registradas e nao pode ser excluido.",
        )

    db.delete(produto)
    db.commit()
