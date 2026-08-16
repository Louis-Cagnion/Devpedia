---
order: 8
---

# Testes e auditoria de segurança

Um teste funcional comum verifica se um programa faz o que deveria fazer; um teste de segurança verifica, além disso, que ele **não faz mais nada** além do previsto, mesmo diante de uma entrada deliberadamente maliciosa. Várias famílias de ferramentas e métodos cobrem esse objetivo, em momentos diferentes do ciclo de desenvolvimento.

## SAST: analisar o código sem executá-lo

O **SAST** (*Static Application Security Testing*) analisa o próprio código-fonte, sem executá-lo, procurando padrões conhecidos como perigosos: uma consulta [SQL](/?c=domain-specific-languages-dsl&p=sql) construída por concatenação em vez de uma consulta preparada, um segredo fixo no código (ver [Gestão de segredos](/?c=cybersecurite&p=gestion-des-secrets)), uma função de hashing inadequada para uma senha (ver [Senhas e hashing seguro](/?c=authentification&s=fondamentaux&p=mots-de-passe-et-hachage)).

```text
Codigo-fonte  -->  Analisador SAST  -->  Lista de padroes de risco detectados,
(nunca executado)                        com o arquivo e a linha envolvidos
```

Como nunca executa o código, uma ferramenta SAST se integra cedo e automaticamente, por exemplo a cada `git push` em um [pipeline de CI/CD](/?c=ci-cd&p=pipeline-cicd), antes mesmo de um teste funcional rodar.

## DAST: atacar a aplicação em funcionamento

O **DAST** (*Dynamic Application Security Testing*) faz o oposto: ele realmente inicia a aplicação (tipicamente uma API ou um site implantado em um ambiente de teste) e envia a ela requisições feitas para revelar uma falha, exatamente como faria um atacante, mas de forma automatizada e sistemática.

| | SAST | DAST |
|---|---|---|
| O que examina | O código-fonte | A aplicação em execução |
| Momento típico | Cedo, a cada mudança de código | Em um ambiente implantado (teste, pré-produção) |
| Detecta | Padrões de código de risco | Um comportamento realmente explorável, incluindo falhas de configuração invisíveis apenas no código |
| Limitação | Pode sinalizar um padrão de risco que na verdade não é explorável (falso positivo) | Cobre apenas os caminhos da aplicação realmente exercitados durante o teste |

## O fuzzing: bombardear um programa com entradas inesperadas

O **fuzzing** consiste em enviar a um programa um grande número de entradas aleatórias, malformadas ou extremas (strings extremamente longas, caracteres especiais, valores fora do intervalo), na esperança de provocar uma queda, uma exceção não tratada, ou um comportamento revelador de uma falha:

```text
Programa alvo: analisador de arquivos CSV

Entradas testadas automaticamente pelo fuzzer:
  ""                          (vazia)
  "a,b,c\n" * 1000000         (arquivo enorme)
  "\x00\xFF\x00\xFF"          (bytes nao textuais)
  "a,\"b\nc\",d"               (aspas e quebra de linha aninhadas)

-> Se uma dessas entradas derrubar o analisador, o fuzzer isola
   a entrada exata responsavel, a ser corrigida antes que um
   arquivo malicioso real produza o mesmo efeito em producao.
```

Uma queda provocada por uma entrada não prevista costuma ser o sintoma de uma falha mais ampla (estouro de buffer, negação de serviço) que uma simples releitura do código deixaria passar.

## O pentest: um ataque simulado por um profissional

Um **teste de intrusão** (*pentest*, *penetration testing*) consiste em contratar uma pessoa ou equipe para atacar de verdade um sistema, com as mesmas técnicas que um atacante real usaria, mas dentro de um marco legal definido previamente:

| Elemento do marco | Papel |
|---|---|
| Escopo (*scope*) | Define com precisão o que pode ser testado (quais sistemas, quais técnicas), para nunca impactar um sistema fora do escopo |
| Regras de engajamento | Fixa os limites (horários permitidos, técnicas proibidas como uma negação de serviço real) |
| Relatório final | Lista as falhas encontradas, sua gravidade, e recomendações de correção |

> **Armadilha:** confundir um pentest autorizado com uma invasão real. Sem um mandato por escrito e um escopo definido previamente, a mesma ação é ilegal, mesmo com boas intenções.

### O bug bounty: uma variante aberta e contínua

Um **programa de bug bounty** convida qualquer pesquisador de segurança externo a reportar uma falha encontrada dentro de um escopo definido, em troca de uma recompensa proporcional à sua gravidade. Diferente de um pentest pontual realizado por uma equipe contratada, ele permanece aberto continuamente, o que multiplica o número e a diversidade de pessoas buscando ativamente uma falha.

## Onde entram a auditoria de dependências e o acompanhamento de CVEs

A auditoria de bibliotecas de terceiros (`npm audit`, `pip-audit`, já detalhada em [Segurança das dependências](/?c=cybersecurite&p=securite-des-dependances)) e o acompanhamento de identificadores [CVE](/?c=cybersecurite&p=types-de-failles) complementam esses métodos: SAST/DAST/fuzzing/pentest buscam falhas **no código escrito pelo próprio projeto**, enquanto a auditoria de dependências busca falhas **já conhecidas em código escrito por outros**, reutilizado pelo projeto.

---

## 📋 Recapitulação

| | |
|---|---|
| **Para lembrar** | O SAST analisa o código sem executá-lo; o DAST ataca a aplicação em funcionamento; o fuzzing bombardeia um programa com entradas inesperadas para provocar uma queda reveladora; um pentest é um ataque simulado por um profissional contratado, dentro de um escopo definido. |
| **Ferramentas utilizáveis** | Um analisador SAST/DAST integrado ao pipeline de CI/CD, um fuzzer, um programa de bug bounty para monitoramento contínuo. |
| **Armadilhas a evitar** | Confundir um pentest autorizado com uma invasão real; testar a segurança apenas uma vez, em vez de um controle contínuo a cada mudança. |
| **Boas práticas** | Integrar o SAST ao pipeline de CI/CD, desde o primeiro commit; definir um escopo e regras de engajamento por escrito antes de qualquer pentest. |
