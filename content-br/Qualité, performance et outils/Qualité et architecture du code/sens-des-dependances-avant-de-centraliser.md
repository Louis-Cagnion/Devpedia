---
order: 5
---

# Verificar o sentido das dependências antes de centralizar

Centralizar uma configuração compartilhada em um único lugar geralmente é uma boa ideia (veja [Fonte única de verdade](/?c=qualite-et-architecture-du-code&p=source-unique-de-verite)), mas o local escolhido não é neutro: se esse novo local está "mais acima" no grafo de dependências do que alguns de seus futuros usuários, a centralização cria uma **importação circular** em vez de simplificar qualquer coisa.

## Um exemplo concreto

Um projeto de scraping organizado em camadas: um módulo `browser.py` de baixo nível (abrir uma página, clicar, esperar) sem conhecimento dos sites específicos, e uma pasta `sites/` de nível mais alto que importa `browser.py` para implementar o scraping de cada site:

```text
sites/leboncoin.py  --importa-->  browser.py
sites/lacentrale.py --importa-->  browser.py
```

Algumas configurações (atrasos específicos de um site, faixas de variação aleatória para parecer menos robótico) pareciam, à primeira vista, pertencer logicamente a um registro centralizado dos sites (`SITE_REGISTRY`, localizado em `sites/__init__.py`). Mas o próprio `browser.py` precisa ler essas configurações para funcionar, e `browser.py` é importado POR `sites/`, não o inverso. Movê-las criaria:

```text
browser.py  --importaria-->  sites/__init__.py  --importa-->  browser.py
```

Um ciclo: `browser.py` importaria um módulo que, transitivamente, já o importa. Dependendo da linguagem, isso produz um erro no carregamento, ou uma importação parcialmente inicializada (frequentemente pior: o bug só aparece em certas ordens de execução). A solução adotada: manter essas configurações específicas no próprio `browser.py`, ao custo de uma pequena exceção à regra "tudo que diz respeito a um site vai no registro", documentada em comentário para que a próxima pessoa não tente "corrigir" o que na verdade é uma restrição estrutural.

## A pergunta a se fazer antes de centralizar

*Quem importa quem, hoje?* Se o novo local centralizado precisa ser importado por um módulo que está **abaixo**, no grafo de dependências, do módulo onde a informação a centralizar vive atualmente, a mudança inverte o sentido de uma dependência existente, e um ciclo aparece assim que um módulo de baixo nível precisa, mesmo indiretamente, de uma informação que vive em um módulo de nível mais alto que depende dele.

> **Referência prática:** em uma arquitetura em camadas (baixo nível ↔ alto nível), a informação só deveria circular em um sentido: das camadas baixas para as camadas altas que as usam. Uma centralização que parece "lógica" do ponto de vista do domínio (agrupar tudo que diz respeito a um site) ainda pode violar esse sentido se a informação for usada por uma camada mais baixa que o local pretendido.

## Isso não é motivo para nunca centralizar

Esse princípio não diz para evitar a centralização; a [fonte única de verdade](/?c=qualite-et-architecture-du-code&p=source-unique-de-verite) continua desejável. Ele diz para verificar o grafo de dependências **antes** de mover qualquer coisa, e aceitar que uma informação permaneça em um módulo aparentemente "menos lógico" quando a única alternativa é um ciclo: a clareza da organização pesa menos do que a ausência de ciclo.

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | Centralizar uma informação em um módulo mais "acima" do que alguns de seus usuários atuais cria uma importação circular, não uma simplificação: o sentido das dependências existentes prevalece sobre a organização lógica do domínio. |
| **Ferramentas utilizáveis** | Perguntar "quem importa quem, hoje?" antes de qualquer movimentação de configuração compartilhada. |
| **Armadilhas a evitar** | Mover uma informação para um local "lógico" sem verificar se seus usuários atuais não estão mais abaixo no grafo de dependências. |
| **Boas práticas** | Aceitar que uma informação permaneça em um módulo aparentemente "menos lógico" quando a única alternativa é um ciclo, documentado em comentário para evitar uma futura "correção" indevida. |
