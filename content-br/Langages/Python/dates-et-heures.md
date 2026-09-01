---
order: 16
---

# O módulo `datetime`

Um computador mede o tempo internamente como um simples número de segundos decorridos (veja mais abaixo `time.time()`); o módulo padrão **`datetime`** o veste como um objeto legível (ano, mês, dia, hora...), prático para exibi-lo, compará-lo ou formatá-lo como string.

## `datetime.now()`: a data e hora atuais

```python
from datetime import datetime

agora = datetime.now()
print(agora)  # 2026-09-01 14:32:07.123456 -> um objeto datetime, nao uma simples string

agora.year, agora.month, agora.day      # (2026, 9, 1)
agora.hour, agora.minute, agora.second  # (14, 32, 7)

datetime(2026, 1, 1)  # constroi uma data precisa em vez de "agora"
```

## Formatar como string: `.strftime()`

```python
agora.strftime("%Y-%m-%d_%H%M%S")  # "2026-09-01_143207" -> formato compacto, usavel em um nome de arquivo
agora.strftime("%d/%m/%Y")         # "01/09/2026"        -> formato europeu comum
```

| Código | Significa |
|---|---|
| `%Y` | Ano em 4 dígitos |
| `%m` | Mês (01-12) |
| `%d` | Dia do mês (01-31) |
| `%H` | Hora (00-23) |
| `%M` | Minuto (00-59) |
| `%S` | Segundo (00-59) |

## Analisar uma string como data: `.strptime()`

```python
datetime.strptime("2026-09-01_143207", "%Y-%m-%d_%H%M%S")  # operacao INVERSA de strftime, mesma tabela de codigos
```

> **Armadilha:** o formato passado a `strptime()` deve corresponder EXATAMENTE à string recebida (mesmos separadores, mesma ordem); um formato que não corresponde levanta um `ValueError`, não um resultado aproximado.

## `datetime.now()` vs `time.time()`

```python
import time

time.time()      # 1798819927.123456 -> numero BRUTO de segundos desde 1 de janeiro de 1970 (epoch Unix)
datetime.now()   # 2026-09-01 14:32:07.123456 -> objeto com ano/mes/dia... ja decompostos
```

`time.time()` serve para medir uma DURAÇÃO (diferença entre duas chamadas); `datetime` serve assim que é preciso exibir, comparar ou decompor uma data/hora legível. Veja também [`sorted()` em strings](/?c=langages-de-programmation&s=python&p=listes-et-tuples) para ordenar timestamps escritos no formato `%Y-%m-%d...` sem passar por `datetime` de forma alguma.

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | `datetime.now()` dá a data/hora atual como um objeto decomposto (ano, mês, dia...). `.strftime()` a formata como string a partir de códigos (`%Y`, `%m`...), `.strptime()` faz o inverso. |
| **Ferramentas utilizáveis** | `datetime.now()`, `datetime(ano, mes, dia)`, `.strftime(formato)`, `.strptime(string, formato)`, `time.time()` para uma simples duração. |
| **Armadilhas a evitar** | Um formato `strptime()` que não corresponde exatamente à string recebida levanta um `ValueError`, sem resultado aproximado. |
| **Boas práticas** | Usar `datetime` para tudo que deva ser exibido/comparado como uma data; reservar `time.time()` para uma medição de duração bruta. |
