---
order: 4
---

# A escalada de privilégios

A **escalada de privilégios** consiste, para um atacante já presente em um sistema com acesso limitado, em obter direitos mais elevados do que os inicialmente concedidos (tipicamente: passar de uma conta de usuário comum para `root` no Linux, ou administrador no Windows). É uma etapa quase sistemática após uma primeira intrusão: um acesso inicial raramente passa por uma conta já toda-poderosa.

## Vertical ou horizontal

| Tipo | O que muda |
|---|---|
| **Vertical** | Um acesso limitado se torna um acesso de nível superior (usuário comum → root) |
| **Horizontal** | Um acesso permanece no mesmo nível de direitos, mas muda de conta (conta de usuário A → conta de usuário B) |

Esse mesmo vocabulário se aplica no lado web ao [controle de acesso falho](/?c=cybersecurite&p=types-de-failles): acessar o pedido de outro cliente (horizontal) é diferente de acessar o painel de administração a partir de uma conta de cliente (vertical).

## Causas frequentes

| Causa | Exemplo |
|---|---|
| **Permissões de arquivo amplas demais** | Um arquivo de configuração contendo uma senha, legível por todos os usuários do sistema |
| **Binário SUID mal configurado** | No Linux, um programa marcado como SUID (*Set User ID*) é executado com os direitos de seu dono em vez dos de quem o iniciou; se ele permite executar um comando arbitrário (ex: um editor de texto executável em SUID root), ele se torna um atalho para acesso root |
| **Serviço vulnerável não corrigido** | Um serviço já rodando com direitos elevados (ex: um serviço do sistema) contém uma falha (ver [Corrupção de memória](/?c=securite&s=securite-offensive&p=corruption-memoire)) explorável para executar código com seus próprios direitos |
| **Tarefa agendada mal protegida** | Uma tarefa automática executada periodicamente pelo `root`, que roda um script modificável por um usuário sem privilégios |

```text
Acesso inicial (usuario comum, direitos limitados)
        |
        v
Busca por configuracoes ruins, binarios SUID, servicos vulneraveis...
        |
        v
Exploracao de uma das causas acima
        |
        v
Acesso com direitos mais elevados (ideal para o atacante : root/administrador)
```

## A ligação com o controle de acesso já visto

Este capítulo olha para o mesmo problema que [RBAC e ABAC](/?c=securite&s=fondamentaux&p=rbac-et-abac) e [Autenticação vs autorização](/?c=securite&s=fondamentaux&p=authentification-vs-autorisation), mas do ponto de vista do atacante em vez do design defensivo: esses dois capítulos explicam como modelar corretamente os direitos de um sistema; a escalada de privilégios é o que acontece quando esse modelo é mal aplicado na prática (um binário SUID esquecido, uma permissão de arquivo permissiva demais) em vez de mal projetado no papel.

---

## 📋 Recapitulação

| | |
|---|---|
| **Para lembrar** | A escalada de privilégios transforma um acesso limitado em um acesso mais elevado (vertical) ou em acesso a outra conta do mesmo nível (horizontal), tipicamente via uma permissão ampla demais, um binário SUID mal configurado, um serviço vulnerável, ou uma tarefa agendada mal protegida. |
| **Ferramentas utilizáveis** | Um script de auditoria automática de configurações ruins conhecidas (permissões, binários SUID) em um sistema de laboratório. |
| **Armadilhas a evitar** | Considerar o acesso inicial como o fim do ataque: geralmente é o ponto de partida da escalada. |
| **Boas práticas** | Aplicar o princípio do menor privilégio (já colocado em [As grandes famílias de falhas de segurança](/?c=cybersecurite&p=types-de-failles)) a cada conta e cada binário, não apenas às contas de usuário em si. |
