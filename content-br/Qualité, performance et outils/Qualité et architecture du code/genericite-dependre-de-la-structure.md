---
order: 6
---

# Genericidade: depender da estrutura em vez de valores fixos

Um código que funciona hoje ainda pode ser frágil se depende de valores próprios de um caso específico (um identificador preciso, um nome de site, um valor que só existe no conjunto de dados atual) em vez da **forma** geral dos dados que recebe. O sintoma não aparece na hora: o código quebra silenciosamente, ou precisa ser modificado manualmente, assim que os dados mudam ou vêm de uma fonte diferente.

## O sintoma

```python
def report_groups_for(site):
    if site == "leboncoin":
        return ["leboncoin"]
    elif site == "lacentrale":
        return ["lacentrale-espacevo"]
    elif site == "espacevo":
        return ["lacentrale-espacevo"]
    elif site == "vivacar":
        return ["vivacar"]
    elif site == "zoomcar":
        return ["zoomcar"]
```

Essa função não depende de nenhuma estrutura: ela codifica, fixo, um conhecimento que já existe em outro lugar do código (qual site pertence a qual grupo de relatório). Adicionar um site supõe lembrar de vir completar essa lista, além de qualquer outra lista semelhante em outro lugar: um problema de [fonte única de verdade](/?c=qualite-et-architecture-du-code&p=source-unique-de-verite) que se resolve aqui na raiz, derivando o comportamento da estrutura dos dados em vez de valores citados um a um.

## A versão genérica

Se a informação "qual grupo de relatório para qual site" já está presente em um registro centralizado (veja o capítulo sobre [fonte única de verdade](/?c=qualite-et-architecture-du-code&p=source-unique-de-verite)), a função não precisa mais conhecer nenhum site pelo nome:

```python
def report_groups_for(site):
    return [SITE_REGISTRY[site]["report_group"]]
```

Um novo site não exige mais nenhuma modificação em `report_groups_for`: basta adicionar sua entrada ao registro, porque a função lê a **estrutura** do registro em vez de reagir a valores que já conhece de antemão.

## Reconhecer o sinal

O sinal de alerta é um `if`/`elif`/`switch` cujo cada branch testa um valor preciso (um identificador, um nome) que já existe, de uma forma ou de outra, em um dado ou uma estrutura acessível em outro lugar do programa. Se essa estrutura já existe, duplicá-la em forma de branches condicionais é um sinal de que ela deveria ser consultada diretamente. Se ela ainda não existe, geralmente é sinal de que é preciso criá-la.

## O limite: não generalizar um caso que permanecerá único

Esse princípio não justifica construir uma estrutura genérica para um caso que, por natureza, nunca terá mais que um único valor: um processamento realmente específico de um único site não precisa de um mecanismo de configuração generalizado, isso seria super-engenharia ([YAGNI](https://martinfowler.com/bliki/Yagni.html)). A genericidade se justifica quando o número de casos tende a variar; ela se torna um custo desnecessário quando ele estruturalmente não varia.

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | Um código que testa valores precisos (`if site == "leboncoin"`) em vez de ler a estrutura dos dados já disponíveis quebra silenciosamente assim que os dados mudam ou vêm de outro lugar. |
| **Ferramentas utilizáveis** | Derivar um comportamento a partir de um registro já centralizado, em vez de duplicar seu conhecimento em forma de branches condicionais. |
| **Armadilhas a evitar** | Um `if`/`elif` cujo cada branch testa um valor já presente em uma estrutura acessível em outro lugar: sinal de que deveria ser consultada diretamente. |
| **Boas práticas** | Fazer o código depender da forma dos dados em vez de valores particulares, assim que o número de casos tende a variar. |
