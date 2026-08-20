---
order: 4
---

# Fonte única de verdade

Quando uma mesma família de informações existe em dois lugares diferentes, as duas cópias acabam (não se um dia, mas quando) divergindo. Não é uma questão de rigor: assim que uma atualização atinge uma cópia sem que seu autor saiba que a outra existe, a inconsistência já está lá, silenciosamente.

## O caso mais visível: várias estruturas paralelas

```python
SITE_LABELS = {
    "leboncoin": "Leboncoin",
    "lacentrale": "La Centrale Pro",
    "vivacar": "Vivacar",
}
SITE_SCRAPERS = {
    "leboncoin": scrape_leboncoin,
    "lacentrale": scrape_lacentrale,
    "vivacar": scrape_vivacar,
}
SITE_AD_SPEC_FETCHERS = {
    "leboncoin": fetch_leboncoin_specs,
    "lacentrale": fetch_lacentrale_specs,
    "vivacar": fetch_vivacar_specs,
}
```

Três dicionários, mantidos sincronizados manualmente por convenção em vez de por construção: adicionar um site supõe lembrar de atualizar os três. Esquecer um nem sempre produz um erro imediato: às vezes apenas um comportamento silenciosamente incompleto para esse site, descoberto bem mais tarde.

A consolidação em uma única fonte resolve o problema por construção:

```python
SITE_REGISTRY = {
    "leboncoin": {
        "label": "Leboncoin",
        "scraper": scrape_leboncoin,
        "ad_spec_fetcher": fetch_leboncoin_specs,
    },
    "lacentrale": {
        "label": "La Centrale Pro",
        "scraper": scrape_lacentrale,
        "ad_spec_fetcher": fetch_lacentrale_specs,
    },
    # ...
}
```

Adicionar um site agora é **uma única** entrada a adicionar, com tudo que o diz respeito no mesmo lugar: impossível sincronizar apenas metade.

## O caso menos visível: a duplicação entre arquivos que não se referenciam

A mesma família de informações duplicada em vários arquivos independentes é mais difícil de perceber, porque nada no código sinaliza visualmente a ligação entre os dois: um arquivo de dados (`lojas.csv`) que registra identificadores, e um relatório gerado separadamente que, por sua vez, descobriu que alguns desses identificadores na verdade redirecionam para outras entradas já presentes. O arquivo de dados não "sabe" o que o relatório descobriu: os dois divergem, até que uma auditoria manual aproxime os dois e remova as entradas redundantes.

Esse caso nem sempre se corrige por uma fusão de estruturas como o exemplo anterior: às vezes, a verdadeira fonte única precisa se tornar um processo (um script que regenera o arquivo de dados a partir do relatório, ou o inverso) em vez de uma simples estrutura em memória: o essencial é que uma das duas representações derive explicitamente da outra, em vez de as duas evoluírem lado a lado sem ligação.

## O princípio geral

Antes de duplicar uma informação (uma constante, uma lista de identificadores, uma configuração), a pergunta a se fazer: *se essa informação mudar, quantos lugares precisam ser atualizados, e existe um mecanismo que garante que todos serão?* Se a resposta for "é preciso lembrar", a duplicação é um risco, mesmo que pareça inofensiva no momento em que é introduzida.

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | Uma mesma família de informações duplicada em dois lugares sempre acaba divergindo: não por falta de rigor, mas assim que uma atualização atinge uma cópia sem que seu autor saiba que a outra existe. |
| **Ferramentas utilizáveis** | Consolidar várias estruturas paralelas (sincronizadas por convenção) em uma única estrutura aninhada (sincronizada por construção). |
| **Armadilhas a evitar** | Duplicar uma informação entre vários arquivos que nunca se referenciam entre si: a ligação não é visível em lugar nenhum do código. |
| **Boas práticas** | Perguntar-se, antes de qualquer duplicação, quantos lugares precisariam ser atualizados se a informação mudasse, e se um mecanismo garante que todos serão. |
