---
order: 1
---

# As grandes famílias de falhas de segurança

Uma **falha** (ou *vulnerabilidade*) é um defeito em um sistema (código, configuração, infraestrutura) que permite a alguém fazê-lo agir de forma diferente da prevista. Um **ataque** é a tentativa de explorar essa falha; um **exploit** é o código ou método concreto usado para isso.

```text
Falha (o defeito) --explorada por--> Exploit (o metodo) --produz--> Ataque bem-sucedido
```

## Quem ataca, e por quê

Nem todo ataque vem do mesmo tipo de agente, nem com o mesmo objetivo:

| Agente | Motivação | Nível de recursos |
|---|---|---|
| *Script kiddie* | Curiosidade, reputação, sem alvo específico | Baixo: usa ferramentas prontas sem entendê-las a fundo |
| Cibercriminoso | Ganho financeiro (resgate, revenda de dados) | Variável, muitas vezes organizado |
| Hacktivista | Mensagem política ou ideológica | Variável |
| Funcionário mal-intencionado (ameaça interna) | Vingança, ganho pessoal | Acesso legítimo já existente, muitas vezes o mais perigoso |
| Agente estatal / APT (*Advanced Persistent Threat*) | Espionagem ou sabotagem de longo prazo | Muito alto: busca discrição e paciência |

## O zero-day: uma falha desconhecida do fabricante

Uma falha geralmente segue este ciclo de vida:

```text
Falha introduzida --> Descoberta --> Reportada ao fabricante --> Corrigida (patch) --> Distribuida aos usuarios
                          |
                          v
          Se explorada ANTES de ser reportada/corrigida: e um "zero-day"
          (o fabricante teve "zero dias" para se proteger)
```

Um **zero-day** é, portanto, uma falha explorada antes mesmo de o fabricante do software tomar conhecimento dela, e por isso antes de existir uma correção (*patch*). É a situação mais perigosa para os usuários: nenhuma atualização ainda pode protegê-los. Uma vez que a falha é conhecida e corrigida, qualquer sistema que não aplique o patch continua exposto, dessa vez sem desculpa: a informação é pública, geralmente sob um identificador **CVE** (*Common Vulnerabilities and Exposures*), um catálogo público de falhas conhecidas, consultável na [base de dados oficial de CVE](https://www.cve.org).

## As grandes categorias de falhas em aplicações

| Categoria | O que abrange | Exemplo concreto |
|---|---|---|
| **Injeção** | Um dado não confiável é interpretado como uma instrução em vez de um simples valor | Injeção de [SQL](/?c=domain-specific-languages-dsl&p=sql), já detalhada com sua correção em [Protegendo seus dados](/?c=langages-de-programmation&s=php&p=securite) |
| **Autenticação falha** | Um mecanismo de login mal projetado permite se passar por outra identidade | Senha armazenada em texto puro (ver [Senhas e hashing seguro](/?c=authentification&s=fondamentaux&p=mots-de-passe-et-hachage)) |
| **Controle de acesso falho** | Um usuário acessa um recurso ou ação que deveria estar fora de seu alcance | Editar o id em uma URL (`/pedido/42` → `/pedido/43`) para ver o pedido de outro cliente, sem que o servidor confira novamente as permissões |
| **Configuração de segurança incorreta** | Uma configuração padrão, permissiva demais ou esquecida, abre um acesso indevido | Painel de administração acessível sem autenticação, mensagem de erro detalhada exposta em produção |
| **Falha criptográfica** | Um segredo ou dado sensível é mal protegido pela criptografia/hashing usado, ou não tem proteção alguma | Ver [Criptografia aplicada](/?c=cybersecurite&p=cryptographie-appliquee) |
| **Componentes vulneráveis** | Uma biblioteca ou ferramenta de terceiros usada carrega, ela mesma, uma falha conhecida | Ver [Segurança das dependências](/?c=cybersecurite&p=securite-des-dependances) |
| **Registro e monitoramento insuficientes** | Um ataque em andamento, ou já ocorrido, passa despercebido por falta de rastros utilizáveis | Nenhum alerta após centenas de tentativas de login malsucedidas na mesma conta |

Essa classificação coincide em grande parte com o [OWASP Top 10](/?c=cybersecurite&p=owasp-top-10), a referência padrão da indústria detalhada ao final desta categoria.

## Como evitar deixá-las no próprio código

Essas categorias compartilham uma raiz comum: um dado ou uma situação tratados erroneamente como confiáveis. Três hábitos reduzem a maior parte desse risco, aprofundados em [Princípios de desenvolvimento seguro](/?c=cybersecurite&p=principes-de-developpement-securise):

```text
// Pseudocodigo -- a mesma armadilha existe em qualquer linguagem
consulta = "SELECT * FROM users WHERE nome = '" + nomeInformadoPeloUsuario + "'"
// Se nomeInformadoPeloUsuario for:  x'; DROP TABLE users; --
// a consulta realmente executada ja nao e a que o desenvolvedor previa

consultaPreparada = "SELECT * FROM users WHERE nome = ?"
executar(consultaPreparada, [nomeInformadoPeloUsuario])
// O dado continua sendo um dado, nunca interpretado como uma instrucao
```

- Nunca confiar em um dado vindo de fora (usuário, API de terceiros, arquivo importado) sem validá-lo.
- Aplicar o **princípio do menor privilégio**: um componente deve ter acesso apenas ao que estritamente precisa.
- Manter as dependências atualizadas, para não herdar uma falha já corrigida em outro lugar.

---

## 📋 Recapitulação

| | |
|---|---|
| **Para lembrar** | Uma falha é um defeito explorável; um zero-day é uma falha explorada antes de ser conhecida pelo fabricante. As falhas de aplicação se agrupam em algumas famílias recorrentes (injeção, autenticação, controle de acesso, configuração, criptografia, dependências, registro). |
| **Ferramentas utilizáveis** | A [base de dados CVE](https://www.cve.org) para acompanhar as falhas públicas conhecidas. |
| **Armadilhas a evitar** | Tratar um dado externo como confiável por padrão; deixar uma dependência ou configuração padrão sem revisão. |
| **Boas práticas** | Validar sistematicamente qualquer dado externo; aplicar o princípio do menor privilégio; manter as dependências atualizadas. |
