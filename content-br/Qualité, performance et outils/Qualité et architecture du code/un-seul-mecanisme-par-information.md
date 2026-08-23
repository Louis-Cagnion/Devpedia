---
order: 7
---

# Um único mecanismo por informação

Quando uma mesma informação pode ser representada por dois mecanismos diferentes que se sobrepõem, o código responsável por interpretá-la precisa lidar com os dois, e raramente lida bem com o caso em que eles se contradizem. Não é apenas uma questão de estilo: é uma fonte direta de inconsistência silenciosa.

## Um exemplo concreto

Um arquivo [Markdown](https://commonmark.org) poderia, em teoria, declarar seu título de duas formas ao mesmo tempo:

```markdown
---
title: Os ponteiros
order: 5
---

# Os ponteiros em C
```

O frontmatter diz "Os ponteiros", o corpo do arquivo diz "Os ponteiros em [C](/?c=langages-de-programmation&s=c&p=c)". Qual é o título verdadeiro? O gerador do site precisa escolher uma regra de prioridade (o frontmatter vence? o heading vence? o último escrito?), e essa regra se torna ela mesma uma fonte de bugs: alguém modifica o heading pensando estar mudando o título exibido, sem saber que o frontmatter (invisível na leitura rápida do arquivo) prevalece.

Este site evita deliberadamente o problema: o frontmatter de um capítulo **nunca** carrega um campo `title`, apenas metadados de construção (`order`, para a ordenação pedagógica). O título exibido vem unicamente do primeiro `# Heading` do corpo: uma única fonte, um único lugar a modificar, nenhuma regra de prioridade para documentar ou lembrar.

## Por que isso sempre complica o código, não só o dado

O custo não se limita ao risco de inconsistência nos dados: o código que **lê** esses dois mecanismos precisa carregar ele mesmo a lógica de prioridade, o que o sobrecarrega para um caso que nunca deveria ter existido. Um parser que precisa verificar "há um frontmatter com um título? senão, procurar um heading" é mais complexo, mais difícil de testar, e mais suscetível a tratar um caso limite de forma diferente do outro mecanismo, do que se uma única regra, sem exceção, sempre se aplicasse.

## Como identificar

O sinal aparece toda vez que dois mecanismos independentes podem, um tanto quanto o outro, produzir ou representar a mesma informação: um identificador derivado de um nome de arquivo E armazenado separadamente em banco; uma configuração lida de um arquivo E redefinida por uma variável de ambiente, sem que um dos dois seja claramente prioritário por construção; um status calculado na hora E armazenado em cache, sem invalidação garantida entre os dois.

Em cada caso, a pergunta a resolver é a mesma: **qual dos dois mecanismos é a fonte, e qual pode ser removido ou reduzido a uma simples derivação do primeiro?** Manter os dois "por precaução" nunca elimina o risco: apenas o adia para o momento, inevitável, em que eles acabarão divergindo.

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | Dois mecanismos capazes de representar a mesma informação (frontmatter + heading, arquivo + variável de ambiente...) obrigam o código a escolher uma regra de prioridade: uma fonte de bugs por si só, não apenas um estilo. |
| **Ferramentas utilizáveis** | Uma única regra simples sem exceção (ex.: o título sempre vem do `# Heading`, nunca de um campo `title` separado). |
| **Armadilhas a evitar** | Manter dois mecanismos "por precaução" pensando eliminar o risco de inconsistência: isso só o adia para o momento em que eles divergirem. |
| **Boas práticas** | Identificar qual dos dois mecanismos é a verdadeira fonte, e reduzir o outro a uma simples derivação do primeiro, ou removê-lo. |
