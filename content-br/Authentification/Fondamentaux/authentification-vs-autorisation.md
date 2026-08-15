---
order: 1
---

# Autenticação vs autorização

> **Analogia:** um crachá de empresa. Na entrada, o segurança verifica se a foto do crachá corresponde ao seu rosto: isso é a **autenticação**, provar quem você é. Uma vez dentro, esse mesmo crachá determina quais portas se abrem à sua passagem (escritório, sala de servidores, terraço): isso é a **autorização**, o que você tem o direito de fazer uma vez identificado. Os dois mecanismos trabalham juntos, mas são duas verificações distintas, feitas em momentos diferentes.

Essa confusão é tão frequente que merece ser esclarecida antes de tudo o mais: este capítulo estabelece as definições sobre as quais se apoiam todos os outros capítulos desta categoria.

## Autenticação: provar quem você é

A **autenticação** é o processo que verifica que uma pessoa (ou um programa) é realmente quem afirma ser. Provar a própria identidade sempre se apoia em pelo menos um destes três tipos de prova, chamados **fatores de autenticação**:

| Fator | O que é | Exemplo |
|---|---|---|
| Algo que você sabe | Uma informação secreta memorizada | Uma senha, um código PIN |
| Algo que você tem | Um objeto físico ou digital em sua posse | Um telefone que recebe um código, uma chave USB de segurança |
| Algo que você é | Uma característica biológica própria sua | Uma impressão digital, o reconhecimento facial |

```text
Usuario                               Servidor
-------                                --------
informa usuario + senha          ->   verifica a correspondencia
                                       com o que esta registrado
                                  <-   autentica (ou recusa)
```

A maioria dos sistemas hoje depende de um único fator (a senha): uma escolha prática, mas frágil, já que um único segredo comprometido basta para usurpar a identidade inteira. Outros capítulos desta categoria detalham como armazenar corretamente esse segredo, e como combinar vários fatores para reduzir esse risco.

## Autorização: o que você tem o direito de fazer

Uma vez a identidade verificada, a **autorização** determina a quais recursos ou ações essa identidade tem acesso. Dois funcionários da mesma empresa podem se autenticar com o mesmo sucesso no mesmo sistema, sem por isso ter os mesmos direitos uma vez conectados:

```text
Funcionario A (autenticado) -> papel "contabilidade"  -> pode ver os salarios
Funcionario B (autenticado) -> papel "desenvolvimento" -> NAO pode ver os salarios
```

A autenticação responde à pergunta *"quem é você?"*, uma única vez por conexão. A autorização responde a *"você tem o direito de fazer exatamente isto?"*, potencialmente a cada ação, e pode mudar sem que a pessoa precise se reautenticar (uma mudança de papel, por exemplo).

## Uma ilustração concreta: os códigos HTTP 401 e 403

O capítulo sobre [APIs e HTTP](/?c=infrastructure&p=api-et-http) apresenta o código de status como o número que indica se uma requisição teve sucesso, e se não, por quê. Dois códigos precisos ilustram exatamente a distinção colocada acima:

| Código | Nome oficial | Significa na realidade |
|---|---|---|
| `401` | *Unauthorized* | Autenticação ausente ou inválida: o servidor não sabe quem você é |
| `403` | *Forbidden* | Autenticação bem-sucedida, mas autorização negada: o servidor sabe quem você é, e recusa |

> **Cuidado:** confiar no nome oficial `Unauthorized` do código `401` e pensar que ele indica um problema de autorização. Historicamente mal nomeado, ele na verdade indica uma autenticação ausente ou inválida: é o `403` que cobre a verdadeira recusa de autorização, com a identidade já estabelecida.
>
> **Boa prática:** diante de um erro de acesso, verificar primeiro de qual código se trata antes de buscar a causa: um `401` se corrige fornecendo ou renovando credenciais válidas, um `403` nunca se corrige dessa forma já que a identidade já foi aceita, só o papel ou as permissões precisam mudar.

## Por que distinguir bem os dois importa na prática

Confundir os dois mecanismos leva a corrigir o problema errado: redefinir a senha de um usuário que recebe um `403` não muda nada, já que sua identidade já era válida, o problema vem de seus direitos. Ao contrário, modificar as permissões de uma conta que recebe um `401` não adianta nada enquanto a própria autenticação falhar.

> **Cuidado:** tratar todo erro de acesso como um problema de credenciais por reflexo, sem verificar se a autenticação realmente falhou ou se é a autorização que está recusando.
>
> **Boa prática:** sempre identificar qual dos dois mecanismos está em causa antes de agir, apoiando-se no código de status retornado (`401` vs `403`) quando a verificação é feita via uma API.

---

## O que reter

| | |
|---|---|
| **O que reter** | A autenticação prova quem você é (por meio de um ou vários fatores: saber, ter, ser); a autorização determina o que você tem o direito de fazer uma vez identificado. Dois mecanismos distintos, frequentemente confundidos. |
| **Ferramentas úteis** | Os códigos HTTP `401` (autenticação) e `403` (autorização) para diagnosticar com precisão qual dos dois mecanismos está falhando. |
| **Armadilhas a evitar** | Confiar no nome `Unauthorized` do código `401`, que na realidade indica um problema de autenticação, não de autorização. Corrigir o mecanismo errado (redefinir uma senha diante de um `403`, por exemplo). |
| **Boas práticas** | Sempre identificar qual dos dois mecanismos está em causa antes de agir. Apoiar-se no código de status retornado por uma API para decidir rapidamente. |
