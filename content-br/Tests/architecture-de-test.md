---
order: 3
---

# Arquitetura de uma suíte de testes

Escrever um teste isolado é simples; manter centenas deles legíveis, confiáveis e fáceis de evoluir é muito mais difícil. Este capítulo cobre como organizar uma **suíte de testes** (o conjunto de testes de um projeto) para que ela permaneça sustentável ao longo do tempo, qualquer que seja o nível da pirâmide de testes em questão.

## Onde colocar os testes: espelho do código-fonte

A convenção mais comum é fazer a estrutura de pastas dos testes refletir a do código-fonte, um arquivo de teste por arquivo de código, em uma pasta separada (geralmente chamada `tests/` ou `__tests__/`):

```text
source/
  users/
    autenticacao.js
    perfil.js
tests/
  users/
    autenticacao.test.js
    perfil.test.js
```

Essa organização permite localizar imediatamente os testes de um arquivo específico, e torna visível de relance o código que não tem nenhum teste associado (um arquivo-fonte sem seu arquivo de teste espelho).

## Fixtures: preparar um estado inicial comum

Uma **fixture** é um estado preparado com antecedência (dados, uma configuração, uma conexão) que vários testes reutilizam, para evitar recriar esse contexto toda vez.

```text
Sem fixture (repetido em cada teste):
  teste "consegue editar o próprio perfil":
    criar um usuário "alice@exemplo.com"
    fazer login com esse usuário
    editar seu perfil
    verificar a mudança

Com fixture (preparada uma vez, reutilizada):
  fixture "usuario_logado":
    criar um usuário "alice@exemplo.com"
    fazer login com esse usuário

  teste "consegue editar o próprio perfil" (usa fixture "usuario_logado"):
    editar seu perfil
    verificar a mudança
```

> **Cilada:** fixtures que se contaminam entre testes, por exemplo um banco de dados de teste que mantém dados deixados por um teste anterior. Um teste que depende da ordem de execução dos outros se torna imprevisível.
>
> **Boa prática:** cada teste deve partir de um estado limpo e previsível, geralmente recriando a fixture antes de cada teste em vez de reutilizá-la tal como está entre eles.

## Test doubles: mocks, stubs e fakes

Um **test double** é um substituto fictício de uma dependência real (um banco de dados, uma API externa, o relógio do sistema), usado para isolar o que de fato está sendo testado. O termo agrupa várias variantes, frequentemente confundidas entre si:

| Termo | Papel |
|---|---|
| **Stub** | Retorna uma resposta fixa e predefinida, sem lógica ("quando chamado, sempre retorna este resultado") |
| **Mock** | Como um stub, mas também verifica *como* foi usado (se foi chamado, com quais argumentos, quantas vezes) |
| **Fake** | Uma implementação simplificada mas funcional (ex. um banco de dados em memória no lugar de um real) |

```text
Stub: "getUsuario(id) sempre retorna {nome: 'Alice'}"
Mock: "getUsuario foi de fato chamado uma vez, com id=42"
Fake: um pequeno banco de dados real em memória, que se comporta
      como o real mas sem arquivo nem servidor para instalar
```

> **Cilada:** usar mocks em excesso a ponto de um teste só verificar "o código chamou as funções certas", sem nunca verificar um resultado de negócio real.
>
> **Boa prática:** reservar os test doubles para dependências genuinamente custosas ou pouco confiáveis de usar tal como estão em um teste (rede, tempo, aleatoriedade); manter a lógica real do programa testado, nunca simulá-la a ela mesma.

## Ambientes de teste

Um projeto geralmente executa seus testes em um **ambiente** separado do de produção: um banco de dados de teste, credenciais fictícias, às vezes serviços externos também simulados. Separar esses ambientes evita que um teste falho ou mal escrito toque dados reais, e torna os resultados reproduzíveis independentemente do estado sempre mutável da produção.

---

## 📋 Recapitulação

| | |
|---|---|
| **A lembrar** | Uma suíte de testes sustentável reflete a estrutura de pastas do código-fonte, usa fixtures para preparar um estado inicial limpo e reproduzível, e test doubles (stub, mock, fake) para isolar dependências custosas ou pouco confiáveis. |
| **Ferramentas utilizáveis** | Nenhuma ferramenta concreta nesta etapa: os capítulos seguintes sobre cada nível de teste (unitário, integração, E2E) cobrirão ferramentas específicas. |
| **Ciladas a evitar** | Fixtures que se contaminam entre testes. Usar mocks em excesso a ponto de deixar de testar a lógica real. |
| **Boas práticas** | Partir de um estado limpo a cada teste. Reservar os test doubles para dependências genuinamente custosas (rede, tempo, aleatoriedade). |
