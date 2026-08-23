---
order: 8
---

# O WAF: filtrar o tráfego antes que ele alcance a aplicação

Um **WAF** (*Web Application Firewall*, firewall de aplicação web) inspeciona cada requisição HTTP antes que ela alcance a aplicação, e bloqueia as que correspondem a um padrão de ataque conhecido (uma tentativa de [injeção SQL](/?c=cybersecurite&p=types-de-failles), um script XSS inserido em um parâmetro). Ele não inspeciona o conteúdo bruto de rede como um firewall de rede clássico, mas especificamente a estrutura de uma requisição [HTTP](/?c=infrastructure&p=api-et-http): método, cabeçalhos, corpo, parâmetros.

## Uma camada a mais, não um substituto do código seguro

```text
Cliente -> [ WAF ] -> Aplicacao

Requisicao normal:        deixada passar
Requisicao com injecao:  bloqueada antes mesmo de alcancar a aplicacao
```

Um WAF se intercala entre o cliente e a aplicação, quase sempre como um reverse proxy dedicado ou um módulo integrado ao servidor web. Ele filtra **antes** que a requisição alcance o código da aplicação, o que o torna útil mesmo contra uma vulnerabilidade ainda não corrigida nesse código.

> **Armadilha:** considerar um WAF como um substituto de um código de aplicação seguro (ver [Princípios de desenvolvimento seguro](/?c=cybersecurite&p=principes-de-developpement-securise)). Um WAF filtra por **padrão**: uma variante de ataque suficientemente diferente de suas regras conhecidas (codificação incomum, técnica recente) pode passar sem acioná-lo, enquanto uma validação de entrada correta do lado da aplicação bloquearia a falha em si, qualquer que seja a forma do ataque.
>
> **Boa prática:** tratar o WAF como uma camada de defesa adicional (*defense in depth*), que reduz a superfície de ataque explorável na prática, nunca como a única proteção contra as falhas listadas no [OWASP Top 10](/?c=cybersecurite&p=owasp-top-10).

## ModSecurity e os conjuntos de regras

**ModSecurity** é o WAF de código aberto mais difundido, implantável como módulo de servidor web (Apache, Nginx) ou como reverse proxy independente. Ele não vem com nenhuma regra por padrão: suas regras costumam vir do **Core Rule Set** (CRS) da OWASP, um conjunto de padrões já escritos e mantidos para as famílias de falhas mais comuns.

```text
# Regra simplificada, no espirito do CRS: bloquear um padrao de injecao SQL classico
SecRule ARGS "@detectSQLi" \
    "id:942100,deny,status:403,msg:'Tentativa de injecao SQL detectada'"
```

| Elemento da regra | Papel |
|---|---|
| `ARGS` | Alvo: todos os parâmetros da requisição (query string, corpo do formulário) |
| `@detectSQLi` | Operador: detecção de padrão de injeção [SQL](/?c=langages&s=domain-specific-languages-dsl&p=sql), fornecida pelo motor do CRS |
| `deny,status:403` | Ação: bloquear a requisição com um código `403 Forbidden` |

## O compromisso: falsos positivos contra falsos negativos

Um conjunto de regras excessivamente rígido às vezes bloqueia requisições legítimas (um comentário de usuário que contém, por coincidência, uma string parecida com código SQL); um conjunto excessivamente permissivo deixa passar ataques reais. A maioria das implantações de WAF passa por um **modo de aprendizado** (*detection only*, que registra sem bloquear) antes de ativar o bloqueio, para ajustar as regras ao tráfego real da aplicação sem quebrar um uso legítimo logo ao entrar em produção.

> **Armadilha:** ativar o bloqueio imediatamente em produção, sem uma fase de observação prévia. Uma regra excessivamente agressiva pode bloquear parte do tráfego legítimo sem que ninguém perceba até que os usuários afetados reclamem.
>
> **Boa prática:** começar em modo apenas registro, analisar os falsos positivos sobre tráfego real, e ativar o bloqueio somente depois de ajustar as regras à aplicação em questão.

## O que o WAF não cobre

O WAF filtra o tráfego HTTP de entrada; ele não protege nem os segredos da aplicação (chave de API, senha de banco de dados — ver [Gestão de segredos](/?c=cybersecurite&p=gestion-des-secrets) para esse aspecto, distinto da filtragem de rede), nem uma dependência vulnerável já instalada (ver [Segurança das dependências](/?c=cybersecurite&p=securite-des-dependances)), nem uma configuração incorreta do lado do servidor. Cada uma dessas camadas de segurança responde a uma ameaça diferente; nenhuma substitui as outras.

---

## 📋 Recapitulação

| | |
|---|---|
| **Para lembrar** | Um WAF inspeciona cada requisição HTTP e bloqueia as que correspondem a um padrão de ataque conhecido, antes que alcancem a aplicação. ModSecurity, combinado ao Core Rule Set da OWASP, é a implantação de código aberto mais comum. É uma camada de defesa adicional, não um substituto do código de aplicação seguro. |
| **Ferramentas utilizáveis** | ModSecurity com o OWASP Core Rule Set, um modo apenas registro para ajustar as regras antes de ativar o bloqueio. |
| **Armadilhas a evitar** | Considerar um WAF como suficiente por si só contra as falhas da aplicação. Ativar o bloqueio em produção sem uma fase de observação prévia. |
| **Boas práticas** | Tratar o WAF como uma camada de defesa em profundidade, complementar a um código seguro. Começar em modo apenas detecção antes de ativar o bloqueio. |
