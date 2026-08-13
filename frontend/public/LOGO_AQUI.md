# Como adicionar a logo da empresa

Quando a logo oficial estiver disponível, salve o arquivo de imagem nesta mesma
pasta (`frontend/public/`) com o nome:

```
logo.png
```

O cabeçalho do sistema (componente `src/components/Cabecalho.jsx`) já está
preparado para exibi-la automaticamente assim que o arquivo existir — não é
necessário alterar nenhum código. Enquanto o arquivo `logo.png` não existir,
o cabeçalho continua mostrando o ícone 🔧 no lugar da logo.

Recomendações para a imagem:
- Formato PNG com fundo transparente (fica melhor no cabeçalho branco).
- Altura em torno de 80–120px é suficiente (o sistema redimensiona para caber).

Depois de adicionar o arquivo, você pode apagar este `LOGO_AQUI.md`.
