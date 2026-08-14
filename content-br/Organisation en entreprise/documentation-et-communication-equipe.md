---
order: 4
---

# Documentação e comunicação em equipe

Uma equipe que cresce não consegue mais combinar tudo em voz alta: o trabalho passa então a ser coordenado por escrito, em tickets e uma documentação compartilhada. Mal escritos, esses dois suportes atrasam a equipe em vez de ajudá-la.

## Escrever um ticket ou uma user story utilizável

Uma **user story** formaliza uma necessidade segundo um formato simples:

```text
Como [papel],
eu quero [acao],
para [beneficio].

Criterios de aceitacao:
- [condicao verificavel que indica que esta concluido]
```

```text
Como cliente,
eu quero receber um email de confirmacao depois do meu pedido,
para saber que ele foi registrado corretamente.

Criterios de aceitacao:
- O email e enviado ate 2 minutos apos o pedido.
- Ele contem o numero do pedido e o valor total.
```

> **Armadilha:** escrever um ticket vago ("corrigir o bug de login"), sem passos de reprodução nem critério de conclusão. Ninguém sabe precisamente o que precisa ser verdade para considerar o ticket terminado, o que leva a idas e vindas para esclarecer o que poderia ter sido detalhado desde o início.
>
> **Boa prática:** escrever um ticket que outra pessoa poderia assumir sem precisar perguntar nada (contexto, passos de reprodução se for um bug, critérios de aceitação explícitos).

## Sinalizar um bloqueio

> **Armadilha:** sinalizar um bloqueio com "não está funcionando", sem detalhes. A pessoa acionada precisa então reconstruir o contexto sozinha antes de poder ajudar, o que atrasa a própria resolução do bloqueio.
>
> **Boa prática:** especificar precisamente o que está bloqueado, desde quando, e o que já foi tentado (veja o [processo de depuração](/?c=bases-de-l-informatique&p=le-bug) para estruturar esse diagnóstico): a pessoa acionada pode então retomar diretamente de onde o bloqueio está.

## As ferramentas comuns

| Necessidade | Ferramentas típicas |
|---|---|
| Acompanhamento de tickets e do trabalho | [Jira](https://www.atlassian.com/software/jira), [Azure Boards](/?c=ci-cd&p=azure-devops-plateforme) |
| Documentação compartilhada | [Confluence](https://www.atlassian.com/software/confluence), [Notion](https://www.notion.so) |
| Comunicação informal, perguntas rápidas | [Slack](https://slack.com), [Microsoft Teams](https://www.microsoft.com/microsoft-teams) |

> **Armadilha:** fazer circular uma informação importante apenas em uma mensagem de chat instantâneo (Slack, Teams), que logo se perde no fluxo e se torna impossível de encontrar algumas semanas depois.
>
> **Boa prática:** reservar o chat instantâneo para a troca rápida, e registrar toda informação destinada a durar (uma decisão de arquitetura, um procedimento) na documentação compartilhada, onde ela continua fácil de encontrar.

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | Um ticket ou user story utilizável especifica o papel, a ação, o benefício esperado e critérios de aceitação verificáveis. Um bloqueio se sinaliza com o que está bloqueado, desde quando, e o que já foi tentado. |
| **Ferramentas utilizáveis** | Jira/[Azure Boards](/?c=ci-cd&p=azure-devops-plateforme) para os tickets, Confluence/Notion para a documentação duradoura, Slack/Teams para a troca rápida. |
| **Armadilhas a evitar** | Escrever um ticket vago sem critério de conclusão. Sinalizar um bloqueio sem detalhes utilizáveis. Manter uma informação duradoura apenas em uma mensagem de chat instantâneo. |
| **Boas práticas** | Escrever um ticket que um terceiro possa assumir sem precisar perguntar. Detalhar um bloqueio para permitir uma ajuda direta. Registrar toda informação duradoura na documentação compartilhada. |
