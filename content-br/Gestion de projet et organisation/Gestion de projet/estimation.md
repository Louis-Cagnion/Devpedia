---
order: 3
---

# A estimativa

Uma vez preenchido o [backlog](/?c=gestion-de-projet-et-organisation&s=gestion-de-projet&p=backlog-et-user-stories) com user stories priorizadas, resta uma pergunta em aberto: quanto tempo cada uma vai levar? A **estimativa** responde a essa pergunta, com métodos diferentes conforme o que realmente se busca medir.

## Duas formas de estimar, dois problemas diferentes

| Abordagem | O que mede | Problema que traz |
|---|---|---|
| **Estimativa em tempo** | Uma duração precisa ("3 dias") | Uma estimativa em tempo costuma ser tomada como um compromisso firme, quando é apenas uma previsão |
| **Estimativa em pontos de complexidade** | Um tamanho relativo em comparação a outras tarefas já estimadas | Não se converte diretamente em uma data, exige uma etapa adicional (a velocidade, ver mais abaixo) |

A estimativa em tempo esbarra em um viés humano bem documentado: subestimar sistematicamente a duração de uma tarefa, em particular para um trabalho novo ou pouco conhecido (a [falácia do planejamento](https://pt.wikipedia.org/wiki/Fal%C3%A1cia_do_planejamento)). Os pontos de complexidade contornam em parte esse viés ao evitar pedir uma data precisa.

## Os pontos de complexidade: comparar em vez de medir

Um **ponto de complexidade** (*story point*) não tem uma unidade de tempo fixa: representa um tamanho relativo, obtido comparando uma user story com outras já estimadas no passado.

```text
Story já estimada em 3 pontos: "adicionar um campo de busca simples"

Nova story a estimar: "adicionar um filtro por categoria com
vários critérios combináveis"

-> mais complexa que a story de referência (3 pontos), mas não
   muito mais -> estimada em 5 pontos
```

A escala mais usada segue a sequência de Fibonacci (1, 2, 3, 5, 8, 13...), com saltos deliberadamente crescentes: forçar uma escolha entre 5 e 8 em vez de entre 5 e 6 evita perder tempo em uma precisão ilusória que a equipe não consegue garantir de qualquer forma.

> **Cilada:** converter mentalmente os pontos de complexidade em dias assim que atribuídos ("3 pontos = 1 dia"). Essa conversão informal reintroduz exatamente o problema que os pontos buscavam evitar: um compromisso de duração disfarçado.
>
> **Boa prática:** manter os pontos de complexidade como uma medida puramente relativa, e convertê-los em duração apenas por meio da velocidade da equipe (ver mais abaixo), nunca por uma regra de conversão fixa decidida de antemão.

## O planning poker: estimar coletivamente

O **planning poker** é um método de estimativa coletiva, pensado para evitar que uma única pessoa (frequentemente a mais experiente, ou a mais à vontade para se expressar) influencie todo o grupo:

```text
1. A story a estimar é apresentada à equipe
2. Cada pessoa escolhe em segredo uma carta (1, 2, 3, 5, 8...)
   representando sua estimativa
3. Todas as cartas são reveladas ao mesmo tempo
4. Se as estimativas divergirem fortemente, as pessoas nos
   extremos explicam seu raciocínio, e então ocorre uma nova rodada
5. Repetir até convergir para uma estimativa compartilhada
```

> **Cilada:** revelar as estimativas uma a uma em vez de simultaneamente. A primeira pessoa a anunciar um número ancora inconscientemente as estimativas seguintes em torno do seu valor, o que anula o sentido do voto secreto.
>
> **Boa prática:** sempre revelar as cartas ao mesmo tempo, e tratar um desacordo marcante como um sinal útil (a story talvez esconda uma complexidade ou ambiguidade que nem todos identificaram), não como um problema a resolver o mais rápido possível.

## A velocidade: converter os pontos em calendário

A **velocidade** de uma equipe é o número de pontos de complexidade que ela consegue processar em média por sprint (ou por período fixo), medida a posteriori ao longo de várias iterações passadas.

```text
Sprint 1: 18 pontos processados
Sprint 2: 22 pontos processados
Sprint 3: 20 pontos processados

-> velocidade média ≈ 20 pontos por sprint

Backlog restante: 100 pontos
-> previsão: cerca de 5 sprints para esgotá-lo
```

É essa velocidade, própria de cada equipe e medida ao longo do tempo, que permite traduzir pontos de complexidade em previsão de calendário, sem nunca ter precisado pedir uma duração precisa sobre uma story individual.

> **Cilada:** comparar a velocidade de duas equipes diferentes, ou usá-la como medida de desempenho individual. Duas equipes não atribuem os pontos da mesma forma; comparar suas velocidades equivale a comparar unidades diferentes apesar de uma aparência numérica idêntica.
>
> **Boa prática:** usar a velocidade apenas para prever o ritmo de uma mesma equipe ao longo do tempo, nunca para comparar equipes entre si.

---

## 📋 Recapitulação

| | |
|---|---|
| **A lembrar** | A estimativa em tempo esbarra no viés de subestimação sistemática; os pontos de complexidade medem um tamanho relativo em vez de uma duração. O planning poker faz cada pessoa estimar em segredo antes de revelar simultaneamente, para evitar o viés de ancoragem. A velocidade (medida a posteriori) converte os pontos em previsão de calendário. |
| **Ferramentas utilizáveis** | Uma escala tipo Fibonacci (1, 2, 3, 5, 8, 13...) para os pontos de complexidade. O planning poker para uma estimativa coletiva. A velocidade média dos últimos sprints para prever um calendário. |
| **Ciladas a evitar** | Converter mentalmente os pontos em dias assim que atribuídos. Revelar as cartas do planning poker uma a uma. Comparar a velocidade de duas equipes diferentes. |
| **Boas práticas** | Manter os pontos como medida puramente relativa. Revelar as cartas simultaneamente e tratar um desacordo marcante como um sinal útil. Usar a velocidade apenas para prever o ritmo de uma mesma equipe ao longo do tempo. |
