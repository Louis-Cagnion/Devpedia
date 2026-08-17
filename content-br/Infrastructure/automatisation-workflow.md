---
order: 5
---

# A automação por workflow visual

Consumir uma [API](/?c=infrastructure&p=api-et-http) exige escrever código: uma requisição, uma resposta, um tratamento do resultado. As plataformas de **automação por workflow visual** (n8n, Zapier, Make) propõem outra abordagem para a mesma necessidade (conectar serviços entre si): montar blocos em uma tela em vez de escrever linhas de código.

> **Analogia:** uma linha de montagem. Um evento dispara a linha (uma peça chega), depois cada posto realiza uma ação sobre essa peça antes de passá-la ao seguinte. O workflow visual funciona da mesma forma: um evento dispara uma sequência de ações, sem que um operário (aqui, um desenvolvedor) precise escrever o código de cada posto.

## Gatilho, ações, conectores

Um workflow sempre se organiza em torno dos três mesmos elementos:

| Elemento | Papel | Exemplo |
|---|---|---|
| **Gatilho** (*trigger*) | O evento que inicia o workflow | Um novo e-mail recebido, um formulário preenchido, a cada hora (agendado) |
| **Ação** | Uma etapa realizada após o disparo | Criar uma linha em uma planilha, enviar uma mensagem, chamar uma API |
| **Conector** | O bloco pré-configurado que sabe se comunicar com um serviço específico | Um conector Gmail, um conector Slack, um conector HTTP genérico |

```text
Gatilho                     Acao 1                       Acao 2

Novo e-mail    ------->  Extrair o anexo   ------->  Criar uma tarefa
recebido com PDF            em PDF                    em uma ferramenta
                                                         de acompanhamento
```

Um conector continua sendo, internamente, uma chamada [HTTP](/?c=infrastructure&p=api-et-http) para a API do serviço em questão: a plataforma apenas esconde a requisição atrás de uma interface gráfica, com autenticação e formato de dados já pré-configurados.

> **Cuidado:** achar que um workflow visual dispensa entender o que ele realmente faz. Um conector mal configurado (campo mapeado errado, gatilho amplo demais) falha silenciosamente ou dispara uma ação em loop, exatamente como um código mal escrito.
>
> **Boa prática:** testar um workflow com um gatilho manual antes de ativá-lo em um gatilho real, e monitorar suas execuções (a maioria das plataformas mantém um histórico por execução, com o detalhe de cada etapa).

## SaaS ou self-hosted: quem hospeda o workflow

Os dois se distinguem por quem faz a plataforma rodar, a mesma questão que vale para qualquer [serviço cloud](/?c=infrastructure&p=le-cloud):

| | SaaS (Zapier, Make) | Self-hosted (n8n em modo auto-hospedado) |
|---|---|---|
| Hospedagem | No fornecedor | Em um servidor escolhido pelo usuário |
| Início | Imediato, sem instalação | Exige instalar e manter a plataforma |
| Dados que passam pelo workflow | Passam pelos servidores do fornecedor | Permanecem na infraestrutura do usuário |
| Custo | Assinatura, geralmente por número de execuções | Custo do servidor, sem limite de execuções |

[n8n](https://n8n.io) propõe os dois modos (SaaS ou self-hosted); [Zapier](https://zapier.com) e [Make](https://www.make.com) permanecem apenas em SaaS.

## O que reter

| | |
|---|---|
| **O que reter** | Um workflow visual encadeia um gatilho e uma sequência de ações conectadas por conectores, sem escrever o código das chamadas de API subjacentes. |
| **Ferramentas úteis** | n8n (SaaS ou self-hosted), Zapier, Make. |
| **Armadilhas a evitar** | Ativar um workflow em um gatilho real sem tê-lo testado manualmente antes. |
| **Boas práticas** | Testar com um gatilho manual antes de ativar. Monitorar o histórico de execução para identificar falhas silenciosas. |
