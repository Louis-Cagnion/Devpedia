---
order: 11
---

# O OWASP Top 10: a referência padrão da indústria

A **[OWASP](https://owasp.org)** (*Open Worldwide Application Security Project*) é uma organização sem fins lucrativos dedicada à segurança de aplicações web, conhecida sobretudo por seu **Top 10**: uma classificação, atualizada a cada poucos anos, das dez categorias de falhas mais críticas observadas em aplicações reais. Este capítulo percorre essa classificação (edição 2021, a mais recente até o momento) como uma síntese de toda a categoria [Cibersegurança](/?c=cybersecurite), com cada linha remetendo ao capítulo que já a detalha em profundidade.

## A classificação

| # | Categoria | O que abrange | Detalhado em |
|---|---|---|---|
| A01 | Controle de acesso falho | Um usuário acessa um recurso ou ação que deveria estar fora de seu alcance | [As grandes famílias de falhas de segurança](/?c=cybersecurite&p=types-de-failles) |
| A02 | Falhas criptográficas | Um segredo ou dado sensível mal protegido pela criptografia/hashing, ou sem proteção alguma | [Criptografia aplicada](/?c=cybersecurite&p=cryptographie-appliquee) |
| A03 | Injeção | Um dado não confiável interpretado como uma instrução | [As grandes famílias de falhas de segurança](/?c=cybersecurite&p=types-de-failles), [Protegendo seus dados](/?c=langages-de-programmation&s=php&p=securite) |
| A04 | Design inseguro (*insecure design*) | A segurança pensada depois, em vez de incorporada desde a concepção de uma funcionalidade | [Princípios de desenvolvimento seguro](/?c=cybersecurite&p=principes-de-developpement-securise) |
| A05 | Configuração de segurança incorreta | Uma configuração padrão, permissiva demais ou esquecida, abre um acesso indevido | [As grandes famílias de falhas de segurança](/?c=cybersecurite&p=types-de-failles) |
| A06 | Componentes vulneráveis e desatualizados | Uma biblioteca ou ferramenta de terceiros usada carrega uma falha conhecida | [Segurança das dependências](/?c=cybersecurite&p=securite-des-dependances) |
| A07 | Falhas de identificação e autenticação | Um mecanismo de login mal projetado permite se passar por outra identidade | Categoria [Autenticação](/?c=authentification) |
| A08 | Falhas de integridade de software e dados | Um dado ou componente alterado sem que nada detecte isso (assinatura ausente ou não verificada, dependência comprometida) | [Criptografia aplicada](/?c=cybersecurite&p=cryptographie-appliquee) (assinatura), [Segurança das dependências](/?c=cybersecurite&p=securite-des-dependances) |
| A09 | Falhas de registro e monitoramento de segurança | Um ataque em andamento, ou já ocorrido, passa despercebido por falta de rastros utilizáveis | [As grandes famílias de falhas de segurança](/?c=cybersecurite&p=types-de-failles), [Testes e auditoria de segurança](/?c=cybersecurite&p=tests-et-audit-de-securite) |
| A10 | SSRF (*Server-Side Request Forgery*) | Um servidor forçado a fazer, em nome de um atacante, uma requisição a um destino que não deveria alcançar | [Protegendo seus dados](/?c=langages-de-programmation&s=php&p=securite) |

## Por que uma classificação em vez de uma simples lista

A ordem não é arbitrária: reflete a frequência e a gravidade observadas em um grande número de aplicações reais auditadas, não um julgamento teórico. Uma categoria que sobe de uma edição para outra (o controle de acesso falho, por exemplo, no topo desde 2021) sinaliza um problema que continua difícil de eliminar na prática, apesar de proteções já bem documentadas.

```text
OWASP Top 10                    Capitulos desta categoria
(o "o que" padronizado)         (o "como" concreto)

     A01-A10        <-------->   types-de-failles, principes-de-
                                  developpement-securise, gestion-
                                  des-secrets, cryptographie-
                                  appliquee, securite-des-
                                  dependances, securite-api-web,
                                  tests-et-audit-de-securite,
                                  ingenierie-sociale-et-phishing
```

O Top 10 dá o vocabulário e as prioridades geralmente aceitos na indústria; os demais capítulos desta categoria dão os meios concretos para agir sobre cada uma dessas prioridades.

## Usando o Top 10 na prática

- Como **checklist de revisão de código**: verificar se nenhuma das dez categorias foi ignorada antes de colocar em produção.
- Como **vocabulário comum** entre desenvolvedores, testadores de segurança e auditores externos, para nomear o mesmo tipo de falha sem ambiguidade.
- Como **guia de priorização**: com recursos limitados, tratar primeiro as categorias mais altas na classificação, estatisticamente as mais frequentes.

> **Armadilha:** tratar o Top 10 como uma lista exaustiva de tudo o que deve ser verificado. É uma classificação das dez categorias **mais frequentes**, não a totalidade das falhas possíveis: uma revisão de segurança que para estritamente nesses dez pontos deixa deliberadamente todo o resto descoberto.

---

## 📋 Recapitulação

| | |
|---|---|
| **Para lembrar** | O OWASP Top 10 classifica as dez categorias de falhas mais frequentes e graves observadas em aplicações reais, atualizado periodicamente. Serve como referência transversal que conecta todos os capítulos da categoria Cibersegurança. |
| **Ferramentas utilizáveis** | O Top 10 como checklist de revisão antes de colocar em produção, e como vocabulário comum entre equipes. |
| **Armadilhas a evitar** | Considerar o Top 10 como uma lista exaustiva em vez de uma classificação das categorias mais frequentes. |
| **Boas práticas** | Usar a classificação para priorizar o esforço de segurança com recursos limitados, sem nunca limitar a ela a revisão de segurança como um todo. |
