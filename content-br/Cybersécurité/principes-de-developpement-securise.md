---
order: 3
---

# Princípios de desenvolvimento seguro

O capítulo [As grandes famílias de falhas de segurança](/?c=cybersecurite&p=types-de-failles) mostra que a maioria das vulnerabilidades compartilha uma raiz comum: um dado ou uma situação tratados erroneamente como confiáveis. Este capítulo detalha quatro princípios que, aplicados sistematicamente, eliminam boa parte desse risco antes mesmo de a lógica de negócio ser escrita.

## Secure by design: pensar a segurança desde a concepção

Adicionar segurança *depois*, quando uma funcionalidade já está escrita, quase sempre equivale a tapar buracos um por um, sem garantia de tê-los encontrado todos. **Secure by design** consiste em incorporar as questões de segurança já na concepção de uma funcionalidade, no mesmo nível que seus requisitos funcionais: *quem pode fazer o quê? o que acontece se esse dado for adulterado? o que acontece se esse serviço cair?*

```text
Abordagem "remendo"                      Abordagem secure by design

Funcionalidade escrita                   Funcionalidade projetada
        |                                        |
        v                                        v
  Colocada em producao                   Quem acessa? Quais dados
        |                                sao sensiveis? O que fazer
        v                                em caso de falha?
  Falha descoberta                               |
        |                                        v
        v                                Funcionalidade escrita, com
    Correcao                             falhas obvias ja evitadas
  (o ciclo se repete
   a cada falha)
```

## Validar as entradas: nunca confiar por padrão

Todo dado que entra em um sistema vindo de fora (campo de formulário, parâmetro de URL, cabeçalho HTTP, arquivo importado, resposta de uma API de terceiros) deve ser validado antes de ser usado. Existem duas estratégias:

| Estratégia | Princípio | Confiabilidade |
|---|---|---|
| **Lista branca** (*allowlist*) | Permitir explicitamente apenas os valores/formatos conhecidos como válidos | Alta: tudo o que não for explicitamente permitido é rejeitado |
| **Lista negra** (*denylist*) | Rejeitar explicitamente os valores/formatos conhecidos como perigosos | Baixa: sempre deixa escapar algum caso não previsto |

```text
// Lista negra (fragil): bloqueia o que ja se conhece
se entrada contem "<script>" entao rejeitar
// Um atacante contorna com uma variante nao prevista: "<ScRiPt>", "<img onerror=...>"...

// Lista branca (robusta): so permite o que e esperado
se entrada corresponde exatamente ao formato "email valido" entao aceitar
// Tudo o mais e rejeitado, inclusive uma variante nao antecipada
```

A lista branca é, portanto, a estratégia padrão a ser preferida. Um exemplo concreto de validação por lista branca, com `filter_input()`, já é detalhado em [Protegendo seus dados](/?c=langages-de-programmation&s=php&p=securite).

> **Armadilha:** validar um dado apenas no lado do cliente (no navegador) e depois confiar nele no servidor. A validação do lado do cliente é apenas uma conveniência de uso (retorno imediato): nada impede um atacante de enviar uma requisição diretamente ao servidor, contornando totalmente o navegador.
>
> **Boa prática:** revalidar sempre no servidor, independentemente da validação já feita no cliente.

## O princípio do menor privilégio

Um componente (usuário, serviço, processo) deve ter apenas os direitos estritamente necessários para sua tarefa, nunca mais "por precaução":

| Contexto | Excesso de privilégio | Aplicação do princípio |
|---|---|---|
| Banco de dados | Uma conta da aplicação com direitos `DROP TABLE`/`ALTER` | Uma conta limitada a `SELECT`/`INSERT`/`UPDATE` apenas nas tabelas necessárias |
| Sistema de arquivos | Um processo web rodando como administrador | Um usuário dedicado, sem permissão de escrita fora de sua própria pasta |
| API de terceiros | Uma chave de API que dá acesso a todas as operações da conta | Uma chave restrita apenas às operações realmente usadas (somente leitura se nenhuma escrita for necessária) |
| Equipe humana | Todo mundo tem acesso à produção | Apenas as pessoas que realmente precisam, com revisão regular dos acessos |

O benefício vai além da prevenção: se um componente for comprometido mesmo assim, o dano fica limitado ao que seus direitos restritos permitem, em vez de se espalhar por todo o sistema.

## Defesa em profundidade (*defense in depth*)

Nenhuma proteção é infalível: a defesa em profundidade consiste em empilhar várias camadas de proteção independentes, para que uma única falha nunca seja suficiente para comprometer todo o sistema.

```text
Atacante
   |
   v
[ Firewall / infraestrutura de rede ]   <- 1a camada
   |
   v
[ Validacao das entradas ]              <- 2a camada
   |
   v
[ Consultas preparadas (anti-injecao) ] <- 3a camada
   |
   v
[ Menor privilegio da conta do BD ]     <- 4a camada
   |
   v
Dados protegidos, mesmo se UMA camada falhar
```

Se uma camada for contornada (uma falha ainda não corrigida, por exemplo), as camadas seguintes ainda limitam o impacto, em vez de deixar um acesso total já na primeira brecha.

## Falhar de forma segura (*fail securely*)

Quando uma verificação de segurança falha ou quebra de forma inesperada (erro de rede, exceção não prevista), o comportamento padrão deve ser **negar** o acesso, nunca concedê-lo por padrão:

```text
// Perigoso: um erro inesperado concede acesso (fail open)
tentar:
    se usuarioEstaAutorizado(usuario) entao conceder acesso
capturar erro:
    conceder acesso   // "por precaucao, deixamos passar"

// Seguro: um erro inesperado nega acesso (fail closed)
tentar:
    se usuarioEstaAutorizado(usuario) entao conceder acesso
    senao negar acesso
capturar erro:
    negar acesso   // por padrao, sem autorizacao confirmada, nenhum acesso
```

Esse reflexo se alinha com a robustez geral esperada de qualquer código: um erro deve falhar de forma explícita, nunca ser mascarado silenciosamente por um comportamento permissivo padrão.

---

## 📋 Recapitulação

| | |
|---|---|
| **Para lembrar** | Quatro princípios reduzem a maioria das falhas: pensar a segurança desde a concepção, validar toda entrada externa com uma lista branca, aplicar o menor privilégio, empilhar várias camadas de defesa independentes. |
| **Ferramentas utilizáveis** | `filter_input()` (PHP) e equivalentes em outras linguagens para validação por lista branca; contas de aplicação dedicadas com direitos restritos para o banco de dados. |
| **Armadilhas a evitar** | Validar um dado apenas no lado do cliente; usar uma lista negra em vez de uma lista branca; conceder acesso por padrão diante de um erro inesperado (*fail open*). |
| **Boas práticas** | Revalidar sempre no servidor; restringir cada componente ao estritamente necessário; negar o acesso por padrão em caso de dúvida (*fail closed*). |
