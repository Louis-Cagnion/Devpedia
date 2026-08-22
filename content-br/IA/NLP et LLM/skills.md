---
order: 9
---

# Os skills: empacotar uma capacidade reutilizável para um agente

O capítulo sobre os [agentes](/?c=ia&s=nlp-llm&p=agents) mostrou como dar a um modelo ferramentas que ele pode chamar. No entanto, essas ferramentas continuam sendo ações pontuais (chamar uma API, ler um arquivo): elas não dizem nada sobre *como* conduzir uma tarefa complexa e recorrente (depurar metodicamente, fazer uma revisão de código, enquadrar um projeto antes de programar). Um **skill** responde a essa necessidade: um pacote reutilizável de instruções, e eventualmente de scripts ou documentos associados, que o agente carrega sob demanda em vez de precisar ser reexplicado a cada vez.

## O problema: repetir as mesmas instruções em cada conversa

Sem um skill, conseguir que um agente siga um método preciso (um ciclo de desenvolvimento guiado por testes, por exemplo, ver o capítulo [TDD](/?c=tests&p=tdd)) exige reexplicar esse método em cada nova conversa, ou colá-lo em um longo prompt de sistema. Um skill empacotado de uma vez por todas evita essa repetição, e continua disponível de uma sessão para outra sem precisar ser reenviado.

## A estrutura: uma pasta, um arquivo SKILL.md

A convenção mais difundida (padronizada pela Anthropic sob o nome **Agent Skills**, e implementada por vários agentes) organiza um skill como uma pasta contendo um arquivo `SKILL.md` obrigatório, além de recursos associados opcionais:

```text
meu-skill/
├── SKILL.md          <- obrigatório: metadados + instruções
├── scripts/            <- opcional: código executável
├── references/          <- opcional: documentação detalhada
└── assets/               <- opcional: modelos, arquivos de referência
```

O próprio `SKILL.md` combina um cabeçalho estruturado com instruções em linguagem natural:

```markdown
---
name: revisao-de-seguranca
description: Revisão de segurança metódica de uma mudança de
  código, a usar antes de mesclar um pull request que toque
  na autenticação ou em dados sensíveis.
---

# Revisão de segurança

1. Identificar todos os pontos de entrada de dados do usuário
   modificados por essa mudança.
2. Para cada um, verificar: validação, escaping, autorização.
3. ...
```

## O carregamento progressivo: não carregar tudo de uma vez

Um agente com acesso a dezenas de skills não pode se dar ao luxo de ler cada um por completo a cada turno, sob pena de saturar sua [janela de contexto](/?c=ia&s=nlp-llm&p=llm-en-production) à toa. O mecanismo usado, a **divulgação progressiva** (*progressive disclosure*), só carrega cada nível se o nível anterior o justificar:

```text
Nível 1: o nome e a descrição de cada skill disponível
         (algumas linhas cada) -> sempre presentes

Nível 2: se uma tarefa corresponde à descrição de um skill,
         carregar o corpo completo do seu SKILL.md

Nível 3: se as instruções do skill pedirem, carregar um
         arquivo de referência ou executar um script associado
```

Esse mecanismo explica por que a **descrição** de um skill importa tanto quanto seu conteúdo: é a única coisa que o agente vê antes de decidir se o skill se aplica à tarefa em curso.

> **Cilada:** escrever uma descrição vaga ou genérica demais ("ajuda com código"). Uma descrição que não indica precisamente a qual situação o skill responde não permite ao agente saber quando carregá-lo, nem a quem o escreveu verificar que ele não dispara em casos indesejados.
>
> **Boa prática:** redigir a descrição como uma resposta a "em que situação precisa esse skill deve disparar?", com palavras-chave concretas em vez de formulações genéricas.

## Onde encontrar skills já existentes

Em vez de escrever cada skill do zero, já existem coleções públicas. O [skills.sh](https://skills.sh), um diretório de skills classificados por popularidade de uso, referencia milhares deles. O repositório [mattpocock/skills](https://github.com/mattpocock/skills) é um exemplo concreto e muito usado: uma coleção pensada para engenharia de software real, não para prototipagem superficial, com skills como `tdd` (um ciclo automatizado vermelho/verde/refactor), `diagnosing-bugs` (um método de depuração disciplinado), ou `grill-me` (uma entrevista aprofundada para esclarecer um plano antes de executá-lo).

> **Cilada:** instalar um skill de terceiros sem ter lido seu conteúdo, especialmente se ele embutir scripts executáveis (uma pasta `scripts/`). Um skill malicioso ou mal escrito pode fazer o agente executar código arbitrário, exatamente como qualquer outro código baixado de uma fonte não verificada.
>
> **Boa prática:** ler o conteúdo de um skill (instruções e scripts associados) antes de instalá-lo, especialmente se vier de uma fonte que você não controla, aplicando o mesmo nível de cautela que se aplicaria à execução de qualquer código de terceiros.

---

## 📋 Recapitulação

| | |
|---|---|
| **A lembrar** | Um skill empacotado de uma vez por todas (uma pasta + `SKILL.md`, eventualmente scripts/references/assets) evita reexplicar um método recorrente em cada conversa. A divulgação progressiva só carrega o conteúdo completo de um skill quando sua descrição corresponde à tarefa em curso, mantendo baixo o custo em contexto mesmo com muitos skills disponíveis. |
| **Ferramentas utilizáveis** | O formato `SKILL.md` (cabeçalho `name`/`description` + instruções). skills.sh para descobrir skills existentes; mattpocock/skills como coleção concreta voltada à engenharia real. |
| **Ciladas a evitar** | Uma descrição de skill vaga demais para o agente saber quando dispará-lo. Instalar um skill de terceiros, especialmente com scripts executáveis, sem ter lido seu conteúdo. |
| **Boas práticas** | Redigir a descrição como uma resposta precisa a "quando esse skill deve disparar?". Ler um skill antes de instalá-lo, como com qualquer código de terceiros. |
