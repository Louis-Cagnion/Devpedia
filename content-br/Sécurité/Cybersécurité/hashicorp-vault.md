---
order: 9
---

# HashiCorp Vault: além do arquivo .env

[Gestão de segredos](/?c=cybersecurite&p=gestion-des-secrets) apresenta o cofre de segredos como a solução mais robusta, com o **HashiCorp Vault** como exemplo. Este capítulo entra no funcionamento concreto dessa ferramenta: o que um cofre de segredos sabe fazer que um simples arquivo `.env` não consegue.

## Segredo estático vs segredo dinâmico

Um segredo **estático** (uma senha fixa de uma vez por todas, como em um arquivo `.env`) permanece válido indefinidamente até que alguém o altere manualmente. O Vault também pode gerar segredos **dinâmicos**: uma credencial criada sob demanda, válida apenas por um tempo limitado, e depois revogada automaticamente.

```text
Aplicacao pede uma credencial de banco de dados ao Vault
        |
        v
Vault cria uma conta temporaria (login/senha unicos)
        |
        v
Aplicacao usa essa conta por 1h (duracao = "lease")
        |
        v
Apos 1h: Vault revoga automaticamente essa conta
```

| | Segredo estático | Segredo dinâmico |
|---|---|---|
| Origem | Criado uma vez por um humano, armazenado tal como está | Gerado sob demanda pelo Vault, a cada novo uso |
| Duração de vida | Indefinida, até uma rotação manual | Limitada (*lease*), revogado automaticamente ao expirar |
| Janela de exploração se roubado | Ilimitada enquanto ninguém o altera | Limitada ao tempo restante do lease |

> **Cuidado:** tratar um segredo dinâmico como um segredo comum que pode ser mantido em cache indefinidamente do lado da aplicação. Um segredo dinâmico expira de verdade: uma aplicação que nunca renova seu lease perde o acesso sem aviso assim que o prazo acaba.
>
> **Boa prática:** renovar o lease antes que ele expire para um uso contínuo (a maioria das bibliotecas cliente do Vault faz isso automaticamente), em vez de tratar um segredo dinâmico como algo adquirido de uma vez por todas.

## Autenticar-se junto ao Vault: os auth methods

Antes de poder ler um segredo, um cliente (uma aplicação, um humano) precisa primeiro provar sua identidade ao Vault por meio de um **auth method**:

| Auth method | Princípio | Caso de uso típico |
|---|---|---|
| Token | Uma string opaca, gerada com antecedência e entregue ao cliente | Teste manual, script pontual |
| AppRole | Um identificador + segredo próprios de uma aplicação, pensados para uma autenticação automatizada sem intervenção humana | Um serviço que inicia sozinho (servidor, contêiner) |
| Identidade cloud (AWS IAM, Azure AD...) | O Vault confia na identidade já comprovada pelo provedor cloud sobre o qual o cliente roda | Uma aplicação hospedada nesse mesmo cloud |

Uma vez autenticado, o cliente recebe um **token do Vault** temporário, que anexa a cada requisição seguinte.

## Controlar o acesso: as policies

Uma **policy** do Vault define, em texto, quais caminhos de segredos um token pode ler, escrever ou listar: o mesmo princípio do [controle de acesso (IDOR)](/?c=cybersecurite&p=owasp-top-10) visto em outro lugar, aplicado aqui aos próprios segredos em vez de aos dados de uma aplicação:

```text
# Policy simplificada: somente leitura sobre os segredos da aplicacao "faturamento"
path "secret/data/faturamento/*" {
  capabilities = ["read"]
}
```

> **Cuidado:** conceder uma policy ampla demais "para não travar o desenvolvimento" (ex: acesso a `secret/*` em vez de apenas ao caminho necessário). Um token comprometido expõe então todos os segredos da organização, não só os da aplicação em questão.
>
> **Boa prática:** aplicar o princípio do menor privilégio (já visto em [Princípios de desenvolvimento seguro](/?c=cybersecurite&p=principes-de-developpement-securise)) a cada policy: autorizar apenas os caminhos e capacidades realmente necessários para esse cliente específico.

## Sealing e unsealing: o Vault protege os próprios dados

Todos os dados armazenados pelo Vault são criptografados em repouso com uma chave de criptografia, ela mesma protegida por um mecanismo de divisão de chave (*Shamir's Secret Sharing*): a chave nunca existe inteira nas mãos de uma única pessoa, é dividida em várias partes.

| Estado | Descrição |
|---|---|
| **Sealed** (selado) | O Vault recusa qualquer operação: a chave de criptografia não está montada, os dados permanecem ilegíveis mesmo com acesso direto ao disco |
| **Unsealed** (desselado) | Detentores suficientes de partes forneceram a sua: a chave é reconstruída em memória, o Vault pode atender requisições |

Reiniciar o Vault o leva de volta ao estado selado: alguém precisa fornecer novamente partes suficientes da chave para desselá-lo, uma proteção deliberada contra um servidor que reiniciasse de forma inesperada (ex: após um comprometimento) sem que ninguém percebesse.

## Vault Agent: automatizar a autenticação e a obtenção de segredos

Em vez de cada aplicação reimplementar sua própria lógica de autenticação e renovação de lease, o **Vault Agent** roda como um processo ao lado da aplicação e cuida disso em seu lugar: ele se autentica, obtém os segredos solicitados, os escreve em um arquivo local (ou os injeta diretamente), e renova automaticamente os leases que se aproximam do vencimento.

---

## 📋 Recapitulação

| | |
|---|---|
| **Para lembrar** | O Vault vai além de um arquivo `.env`: segredos dinâmicos com duração limitada, autenticação por auth method, controle de acesso fino por policies, dados criptografados e protegidos por sealing/unsealing, Vault Agent para automatizar autenticação e renovação. |
| **Ferramentas utilizáveis** | AppRole para a autenticação automatizada de um serviço, Vault Agent para delegar a gestão de leases a um processo dedicado. |
| **Armadilhas a evitar** | Manter um segredo dinâmico em cache sem nunca renovar seu lease. Conceder uma policy ampla demais por simplicidade. |
| **Boas práticas** | Renovar os leases antes que expirem. Aplicar o menor privilégio a cada policy, um caminho de segredos por vez. |
