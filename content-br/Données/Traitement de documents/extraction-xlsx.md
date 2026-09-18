---
order: 5
---

# Ler uma planilha Excel (.xlsx) por script

Um arquivo **.xlsx** (planilha Excel) não é uma simples grade de valores: cada célula que contém uma fórmula (`=A1+B1`) armazena ao mesmo tempo essa **fórmula** e seu **último valor calculado**, guardado em cache pelo Excel no último salvamento. Uma biblioteca que lê esse arquivo precisa escolher qual dos dois ela retorna.

## [`openpyxl`](https://openpyxl.readthedocs.io): fórmula por padrão, valor em cache com `data_only`

```python
import openpyxl

pasta = openpyxl.load_workbook("relatorio.xlsx")
planilha = pasta.active   # a planilha ativa por padrao, a ultima aberta no Excel

for linha in planilha.iter_rows(min_row=2, values_only=True):
    print(linha)   # retorna a STRING DA FORMULA ("=A1+B1"), nao o resultado calculado
```

```python
pasta = openpyxl.load_workbook("relatorio.xlsx", data_only=True)
planilha = pasta.active

for linha in planilha.iter_rows(min_row=2, values_only=True):
    print(linha)   # agora retorna o VALOR EM CACHE, nao a formula
```

| | Sem `data_only` (padrão) | Com `data_only=True` |
|---|---|---|
| Célula sem fórmula | O próprio valor | O próprio valor (idêntico) |
| Célula com fórmula | A string da fórmula (`"=A1+B1"`) | O último valor calculado, guardado em cache pelo Excel |

> **Cuidado:** `data_only=True` NUNCA recalcula uma fórmula por si só: `openpyxl` é um simples leitor do arquivo tal como está armazenado em disco, nunca um motor de cálculo. Se o arquivo nunca foi reaberto/salvo novamente no Excel após uma alteração que afeta uma fórmula, o valor em cache pode estar ausente (`None`, fórmula nunca avaliada) ou desatualizado (refletindo um cálculo antigo).
>
> **Boa prática:** se a atualidade do resultado calculado for crítica, garantir que o arquivo tenha sido realmente recalculado/salvo novamente no Excel (ou uma ferramenta equivalente) antes de lê-lo com `data_only=True`; caso contrário, recalcular você mesmo o valor no script a partir dos dados brutos em vez de confiar no cache.

## Acessar uma planilha específica entre várias

```python
pasta = openpyxl.load_workbook("relatorio.xlsx", data_only=True)
print(pasta.sheetnames)              # lista dos nomes de planilha da pasta de trabalho
planilha = pasta["Vendas 2025"]      # acessar uma planilha especifica pelo nome
```

Uma pasta de trabalho pode conter várias planilhas (tantas abas quanto no Excel); `pasta.active` retorna apenas a que estava aberta por último no salvamento, não necessariamente a primeira nem a desejada.

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | Um `.xlsx` armazena ao mesmo tempo a fórmula de uma célula e seu último valor calculado em cache. `openpyxl` retorna a fórmula por padrão, o valor em cache com `data_only=True`; ele nunca recalcula nada por si só. |
| **Ferramentas utilizáveis** | `openpyxl.load_workbook(caminho, data_only=True)`, `pasta.sheetnames`, `pasta["Nome da planilha"]`, `planilha.iter_rows(min_row=..., values_only=True)`. |
| **Armadilhas a evitar** | Supor que `data_only=True` recalcula uma fórmula modificada desde o último salvamento no Excel. Acessar `pasta.active` supondo que é a primeira planilha. |
| **Boas práticas** | Verificar se o arquivo foi salvo novamente no Excel após qualquer alteração de fórmula, antes de ler seu valor em cache. Acessar uma planilha pelo nome explícito em vez de por `active` assim que a pasta contiver várias. |
