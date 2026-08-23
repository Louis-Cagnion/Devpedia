---
order: 6
---

# Segurança das dependências e da cadeia de suprimentos

Um projeto moderno se apoia em dezenas, às vezes milhares, de bibliotecas escritas por outras pessoas (ver por exemplo o `pip` em Python, ou o equivalente em outras linguagens, descrito em [Módulos, pip e ambientes virtuais](/?c=langages-de-programmation&s=python&p=modules-et-environnements)). Cada uma dessas bibliotecas, e cada uma de suas próprias dependências, é um elo da **cadeia de suprimentos de software** (*supply chain*): uma falha ou um código malicioso em qualquer um desses elos afeta todos os projetos que dependem dele, direta ou indiretamente, sem que nenhum erro tenha sido cometido no código do próprio projeto. Essa é uma das categorias de falhas já apresentadas em [As grandes famílias de falhas de segurança](/?c=cybersecurite&p=types-de-failles) sob o nome de "componentes vulneráveis".

```text
Seu projeto
   |
   +-- depende de --> Biblioteca A
   |                     |
   |                     +-- depende de --> Biblioteca C (falha aqui)
   |
   +-- depende de --> Biblioteca B

Uma falha em C afeta seu projeto, mesmo que voce nunca tenha
ouvido falar de C nem a tenha instalado voce mesmo.
```

## O lockfile: fixar o que está realmente instalado

Um arquivo de dependências comum (`package.json`, `composer.json`...) declara faixas de versão flexíveis ("pelo menos a 2.1", "qualquer versão 3.x"): duas instalações em momentos diferentes podem, assim, obter versões diferentes, inclusive de dependências indiretas nunca listadas explicitamente. Um **lockfile** (`package-lock.json`, `composer.lock`, ou um `requirements.txt` gerado com `pip freeze`, ver [Módulos, pip e ambientes virtuais](/?c=langages-de-programmation&s=python&p=modules-et-environnements)) fixa a versão **exata** de cada dependência, direta e indireta, geralmente junto com uma impressão criptográfica do conteúdo baixado:

| Sem lockfile | Com lockfile |
|---|---|
| Versão instalada potencialmente diferente a cada execução do instalador | Versão instalada idêntica e reproduzível, para toda a equipe e em produção |
| Uma dependência indireta comprometida pode se instalar silenciosamente | A impressão do lockfile detecta conteúdo modificado desde a última instalação validada |

> **Boa prática:** sempre commitar o lockfile junto com o resto do código, nunca ignorá-lo como apenas mais um arquivo gerado: isso é justamente o que garante que todos instalem as mesmas versões, com as mesmas impressões.

## O typosquatting de pacotes

O [typosquatting](/?c=cybersecurite&p=ingenierie-sociale-et-phishing) não visa apenas nomes de domínio: um atacante pode publicar um pacote com um nome deliberadamente parecido a um popular (`reqeusts` em vez de `requests`, `lodahs` em vez de `lodash`), na esperança de que um erro de digitação na instalação (`pip install reqeusts`) instale sua versão maliciosa no lugar da legítima.

```text
pip install requests    # o pacote legitimo, muito usado
pip install reqeusts    # erro de digitacao -> pacote diferente, potencialmente malicioso
```

> **Boa prática:** copiar e colar o nome exato de um pacote a partir de sua documentação oficial em vez de digitá-lo de memória, e verificar o número de downloads/o tempo de existência de um pacote pouco conhecido antes de adicioná-lo a um projeto.

## Auditando suas dependências

Um pacote instalado hoje sem falhas conhecidas pode revelar uma mais tarde: por isso a auditoria de dependências é uma verificação recorrente, não uma checagem única no momento da instalação.

| Ferramenta | Ecossistema | Papel |
|---|---|---|
| `npm audit` | [JavaScript](/?c=langages&s=javascript&p=javascript)/Node.js | Compara as dependências instaladas com um banco de falhas conhecidas |
| `pip-audit` | Python | O equivalente para pacotes Python |
| [Dependabot](https://docs.github.com/en/code-security/dependabot) | Multi-ecossistema (integrado ao GitHub) | Abre automaticamente uma pull request quando uma dependência tem uma falha conhecida e uma correção disponível |

Essas ferramentas se integram naturalmente a um [pipeline de CI/CD](/?c=ci-cd&p=pipeline-cicd): a auditoria roda automaticamente a cada mudança, em vez de depender de uma verificação manual que alguém esquece de refazer.

---

## 📋 Recapitulação

| | |
|---|---|
| **Para lembrar** | Uma dependência (direta ou indireta) é um elo da cadeia de suprimentos de software: sua falha se torna a falha do projeto. Um lockfile fixa as versões exatas realmente instaladas, para toda a equipe. |
| **Ferramentas utilizáveis** | `npm audit`, `pip-audit`, Dependabot, um lockfile (`package-lock.json`, `composer.lock`, `requirements.txt`). |
| **Armadilhas a evitar** | Ignorar o lockfile em vez de commitá-lo; digitar de memória o nome de um pacote pouco familiar (risco de typosquatting); auditar as dependências apenas uma vez, na instalação, sem nunca refazer. |
| **Boas práticas** | Sempre commitar o lockfile; copiar e colar o nome de um pacote a partir de sua documentação oficial; integrar a auditoria de dependências ao pipeline de CI/CD, executada a cada mudança. |
