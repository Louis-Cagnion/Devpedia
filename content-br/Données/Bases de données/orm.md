---
order: 7
---

# O ORM: mapear objetos em tabelas relacionais

Um programa orientado a objetos manipula classes e instâncias; um banco relacional armazena tabelas e linhas. Os dois modelos não se sobrepõem naturalmente (uma relação entre dois objetos não é uma chave estrangeira, uma herança de classes não tem equivalente direto em [SQL](/?c=langages&s=domain-specific-languages-dsl&p=sql)): um **ORM** (*Object-Relational Mapping*) automatiza a tradução entre os dois, para escrever código contra objetos em vez de consultas SQL manuais.

## O que um ORM automatiza

Um ORM associa uma classe a uma tabela, uma instância a uma linha, um atributo a uma coluna, e então gera ele mesmo o SQL correspondente:

```text
Modelo objeto:                    Modelo relacional:

class Usuario {              <->  TABLE usuarios (
  id                                id INTEGER PRIMARY KEY,
  email                             email TEXT,
  pedidos: Pedido[]                 ...
}                                  )
                                   TABLE pedidos (
                                     id_usuario INTEGER REFERENCES usuarios(id),
                                     ...
                                   )
```

```javascript
// Com um ORM (exemplo Prisma): um objeto, nao uma query SQL escrita a mao
const usuario = await prisma.usuario.create({
  data: { email: "alice@exemplo.com" }
});

// O SQL gerado pelo ORM, nunca escrito diretamente:
// INSERT INTO usuarios (email) VALUES ('alice@exemplo.com');
```

O [CRUD](/?c=ia&s=production-et-gouvernance&p=gouvernance-des-donnees) básico (criar, ler, modificar, excluir) é gerado automaticamente para cada tabela declarada, sem escrever você mesmo a menor consulta para esses casos simples.

## As migrações: versionar o esquema como código

O esquema de um banco evolui com a aplicação (nova coluna, nova tabela, restrição modificada). Uma **migração** é um script que descreve essa mudança de forma incremental e reversível, acompanhado pelo [Git](/?c=git&p=git) da mesma forma que o código da aplicação:

```text
migrations/
  20260101_criar_usuarios.sql
  20260115_adicionar_coluna_email_verificado.sql
  20260201_criar_tabela_pedidos.sql
```

Cada migração é aplicada em ordem, uma única vez, em cada ambiente (máquina de desenvolvimento, pré-produção, produção): o esquema do banco se torna reprodutível a partir do histórico das migrações, em vez de depender de uma sequência de modificações manuais nunca rastreadas.

> **Armadilha:** modificar o esquema diretamente em produção (`ALTER TABLE` executado à mão), sem migração correspondente versionada. O esquema real diverge então silenciosamente do que o código descreve, até que um deploy em outro ambiente falhe ou reproduza um estado diferente.
>
> **Boa prática:** fazer todo mudança de esquema passar por uma migração versionada, inclusive para um ajuste aparentemente menor, exatamente como uma mudança de código passa por um commit.

## Type-safety: detectar um erro antes da execução

Um ORM como o Prisma gera tipos a partir do esquema do banco: um erro de digitação em um nome de coluna ou um tipo de valor errado é detectado na compilação, antes mesmo de rodar o programa, em vez de no momento em que a query SQL inválida falha em produção:

```javascript
prisma.usuario.create({ data: { emial: "alice@exemplo.com" } });
// Erro de compilacao imediato: "emial" nao existe nesse modelo
```

Uma query SQL escrita à mão em uma string de caracteres não oferece nenhuma dessas garantias: o mesmo erro de digitação só seria detectado ali na execução, se for.

## A armadilha clássica: o problema N+1

Acessar uma relação (os pedidos de um usuário, por exemplo) dentro de um loop costuma disparar uma consulta separada a **cada iteração**, em vez de uma única consulta para buscar tudo de uma vez:

```javascript
const usuarios = await prisma.usuario.findMany(); // 1 query

for (const u of usuarios) {
  const pedidos = await prisma.pedido.findMany({ where: { id_usuario: u.id } });
  // 1 query adicional POR usuario: N usuarios -> N+1 queries no total
}
```

> **Armadilha:** carregar uma relação dentro de um loop sem perceber, porque o ORM torna essa chamada tão simples sintaticamente quanto um acesso a um atributo normal. Com 1000 usuários, esse código dispara 1001 consultas separadas onde uma única, com um join, bastaria.
>
> **Boa prática:** pré-carregar as relações necessárias em uma única consulta (`include`/`with`/`eager loading` conforme o ORM), antes do loop, em vez de deixar o ORM disparar uma nova a cada iteração.

```javascript
// 1 unica query, com join, em vez de N+1
const usuarios = await prisma.usuario.findMany({ include: { pedidos: true } });
```

## Quando um ORM não é a resposta certa

Um ORM se destaca em [CRUD](/?c=ia&s=production-et-gouvernance&p=gouvernance-des-donnees) simples, mas às vezes força uma consulta de análise complexa (agregações múltiplas, janelamento, muitos joins; veja [Data warehouse contra data lake](/?c=bases-de-donnees&p=entrepot-vs-data-lake) para esse tipo de necessidade OLAP) em uma sintaxe pensada para manipular objetos, não para expressar uma consulta analítica. O SQL puro, ou um *query builder* mais próximo do SQL que um ORM completo, continua costumeiramente mais claro e mais performático para esse tipo de caso.

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | Um ORM traduz automaticamente entre o modelo objeto do código e o modelo relacional do banco (classe/tabela, instância/linha). As migrações versionam o esquema como código. A geração de tipos detecta um erro de esquema na compilação em vez de na execução. |
| **Ferramentas utilizáveis** | Um ORM (Prisma e equivalentes) para o CRUD comum; migrações versionadas para toda mudança de esquema; o pré-carregamento de relações (`include`/`with`) para evitar uma consulta por iteração. |
| **Armadilhas a evitar** | Modificar o esquema em produção sem migração versionada. Carregar uma relação dentro de um loop (problema N+1). |
| **Boas práticas** | Fazer toda mudança de esquema passar por uma migração versionada. Pré-carregar as relações necessárias em uma única consulta, antes do loop que as usa. Reservar o SQL puro para consultas analíticas complexas que a abstração do ORM tornaria menos claras. |
