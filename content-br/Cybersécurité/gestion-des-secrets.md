---
order: 4
---

# Gestão de segredos

Um **segredo** é uma informação que concede acesso se for conhecida: senha, chave de API, token de autenticação, chave privada de criptografia, string de conexão com um banco de dados. Um segredo comprometido equivale a entregar diretamente a um atacante o acesso que ele protege, não importa quão sólido seja o resto do sistema.

## A armadilha mais comum: o segredo fixo no código

```text
// Perigoso: o segredo esta escrito diretamente no codigo-fonte
chave_api = "sk_live_51H8xJ2eZvKYlo2C..."

// Uma vez que esse codigo e commitado no Git, esse segredo fica exposto:
// - a qualquer um com acesso ao repositorio (mesmo privado, se esse acesso vazar algum dia)
// - permanentemente no historico, mesmo que a linha seja removida depois
//   (ver Desfazendo alteracoes e navegando pelo historico)
```

Uma vez que um segredo foi commitado, apenas removê-lo do arquivo não basta: ele continua consultável no histórico do Git até ser reescrito (uma operação pesada e arriscada em um repositório compartilhado, ver [Desfazendo alterações e navegando pelo histórico](/?c=git&p=annuler-et-historique)), e mesmo após uma reescrita, um clone que já existisse em outro lugar pode ter mantido a versão comprometida. A única proteção confiável depois que um segredo é exposto é **revogá-lo e substituí-lo imediatamente**, nunca contar apenas com sua remoção do repositório.

## Onde armazenar um segredo: três abordagens, da mais simples à mais robusta

| Abordagem | Princípio | Caso de uso típico |
|---|---|---|
| **Variável de ambiente** | O segredo é fornecido ao programa pelo sistema operacional na inicialização, nunca escrito em um arquivo rastreado pelo Git | Desenvolvimento local, projetos pequenos |
| **Arquivo `.env` ignorado pelo Git** | Um arquivo separado do código, listado no [`.gitignore`](/?c=git&p=gitignore), que define as variáveis de ambiente do projeto | Desenvolvimento local com vários segredos, equipe pequena |
| **Cofre de segredos** (*secrets vault*) | Um serviço dedicado que armazena, criptografa e distribui os segredos sob demanda, com rastreabilidade de quem acessa | Produção, equipes maiores, conformidade regulatória |

```bash
# Arquivo .env (nunca commitado, ver .gitignore)
DATABASE_URL=postgres://usuario:senha@localhost/meubanco
API_KEY=sk_live_51H8xJ2eZvKYlo2C...
```

```text
// O codigo le a variavel de ambiente, nunca um valor escrito de forma fixa
chave_api = lerVariavelDeAmbiente("API_KEY")
```

## Os cofres de segredos (*vaults*)

Além de um simples arquivo `.env`, um cofre de segredos é um serviço dedicado (por exemplo, [HashiCorp Vault](https://www.vaultproject.io) ou um gerenciador de segredos integrado a um provedor de nuvem como o AWS Secrets Manager) que oferece o que um arquivo `.env` não consegue:

| Necessidade | Arquivo `.env` | Cofre de segredos |
|---|---|---|
| Armazenamento criptografado em repouso | Não (texto puro no disco) | Sim |
| Quem consultou qual segredo, e quando | Nenhum rastro | Registrado (auditoria) |
| Rotação automática de segredos | Manual | Frequentemente automatizável |
| Acesso revogável individualmente | Difícil (o arquivo inteiro é compartilhado) | Um acesso específico pode ser retirado sem afetar os demais |

## A rotação de segredos

**Rotacionar** um segredo significa substituí-lo periodicamente por um novo valor, mesmo sem nenhum comprometimento conhecido: isso reduz a janela de tempo durante a qual um segredo roubado, mas ainda não detectado, permanece utilizável. Um segredo nunca renovado continua válido indefinidamente, inclusive para um atacante que o tenha obtido meses antes sem que ninguém soubesse.

## Segredos e integração contínua

Um pipeline de [CI/CD](/?c=ci-cd&p=pipeline-cicd) também precisa de segredos (fazer deploy em um servidor, publicar um pacote, chamar uma API de terceiros), sem nunca escrevê-los no próprio arquivo de configuração do pipeline (rastreado pelo Git, e portanto visível para qualquer um com acesso ao repositório): a plataforma de CI oferece em vez disso um espaço dedicado e criptografado para declarar esses segredos uma vez, e então injetá-los como variáveis de ambiente durante a execução do pipeline.

---

## 📋 Recapitulação

| | |
|---|---|
| **Para lembrar** | Um segredo (senha, chave de API, token) concede acesso direto se for conhecido. Nunca fixá-lo no código; uma vez commitado, ele continua exposto no histórico mesmo depois de removido. |
| **Ferramentas utilizáveis** | Variáveis de ambiente, arquivo `.env` [ignorado pelo Git](/?c=git&p=gitignore), cofre de segredos (Vault, gerenciador de segredos em nuvem) para produção. |
| **Armadilhas a evitar** | Fixar um segredo no código; achar que removê-lo do arquivo basta para protegê-lo após uma exposição; nunca rotacionar um segredo. |
| **Boas práticas** | Revogar e substituir imediatamente qualquer segredo exposto; rotacionar os segredos periodicamente; usar o espaço de segredos dedicado de uma plataforma de CI em vez do arquivo de configuração do pipeline. |
