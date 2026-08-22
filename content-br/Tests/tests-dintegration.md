---
order: 5
---

# Os testes de integração

O capítulo sobre os [testes unitários](/?c=tests&p=tests-unitaires) isola uma função de tudo ao seu redor. Mas um programa que funciona corretamente função por função ainda pode falhar depois que essas funções são montadas juntas: é exatamente isso que os testes de integração cobrem, o nível intermediário da [pirâmide de testes](/?c=tests&p=pyramide-de-test).

## O que um teste de integração verifica a mais

Um teste de integração verifica se vários componentes **funcionam corretamente juntos**, geralmente envolvendo pelo menos uma dependência real (um banco de dados real, uma chamada de rede real a um serviço, um sistema de arquivos real) em vez de um test double.

```text
Teste unitário:
  a função registrarUsuario() chama corretamente
  bancoDeDados.inserir() com os argumentos certos
  -> bancoDeDados é um test double (mock), nada é realmente escrito

Teste de integração:
  registrarUsuario() escreve de fato uma linha em um
  banco de dados de teste real, que é então relido para
  verificar se corresponde aos dados esperados
  -> verifica se o código e o banco de dados realmente concordam
```

Um teste unitário pode passar enquanto um teste de integração falha no mesmo código: por exemplo, se a função chama corretamente o banco de dados, mas com uma consulta SQL sintaticamente inválida que o mock nunca detecta.

## Onde traçar o limite: quais componentes incluir

Não existe uma definição universal e estrita do que conta como "integração": o limite depende do que se escolhe realmente testar em vez de simular.

| Componentes envolvidos | Tipo de teste |
|---|---|
| Uma única função, todo o resto simulado | Unitário |
| A função + um banco de dados de teste real | Integração (banco de dados) |
| A função + uma chamada real a uma API externa | Integração (serviço externo) |
| Toda a aplicação, do clique do usuário até a resposta final | End-to-end (próximo capítulo) |

> **Cilada:** chamar de "teste de integração" um teste que na realidade simula todas as suas dependências com mocks muito detalhados. Sem nenhuma dependência real envolvida, esse teste continua sendo um teste unitário disfarçado, com a lentidão de um teste de integração mas sem seu benefício real.
>
> **Boa prática:** um teste de integração deve envolver pelo menos uma dependência externa real (banco de dados, serviço, sistema de arquivos); caso contrário, é um teste unitário, mesmo que pareça outra coisa.

## Um banco de dados de teste, nunca o de produção

Os testes de integração que envolvem um banco de dados precisam de sua própria instância, separada da produção, geralmente recriada antes de cada execução para partir de um estado conhecido (ver as [fixtures](/?c=tests&p=architecture-de-test) já vistas no capítulo de arquitetura de testes).

```text
Antes de cada teste:
  1. Recriar o banco de dados de teste (vazio ou com dados
     iniciais conhecidos)
  2. Executar o teste (que escreve/lê nesse banco de dados)
  3. Verificar o resultado

-> Nenhum dado de um teste deve sobreviver para contaminar o seguinte
```

> **Cilada:** rodar os testes de integração contra o banco de dados de produção, por simplicidade ou falta de tempo para montar um dedicado. Um teste que escreve dados de verdade pode então corromper ou contaminar dados reais.
>
> **Boa prática:** sempre usar um banco de dados (ou serviço) de teste inteiramente separado da produção, mesmo que sua criação exija um esforço inicial.

## Um nível mais lento, a usar com discernimento

Um teste de integração custa mais caro que um teste unitário: iniciar um banco de dados real, esperar uma resposta de rede real, leva tempo. É esse custo que justifica, na pirâmide de testes, ter menos deles do que testes unitários: reservados aos pontos de junção entre componentes, onde um teste unitário sozinho não consegue dar confiança.

---

## 📋 Recapitulação

| | |
|---|---|
| **A lembrar** | Um teste de integração verifica se vários componentes funcionam corretamente juntos, envolvendo pelo menos uma dependência externa real (banco de dados, serviço, arquivo), ao contrário de um teste unitário que simula tudo. Usa um banco de dados de teste separado, nunca o de produção. |
| **Ferramentas utilizáveis** | Um banco de dados de teste recriado antes de cada execução. Uma tabela dos componentes envolvidos para distinguir um teste unitário de um teste de integração. |
| **Ciladas a evitar** | Chamar de "integração" um teste que na realidade simula todas as suas dependências. Rodar testes contra o banco de dados de produção. |
| **Boas práticas** | Envolver pelo menos uma dependência externa real em um teste de integração. Usar um banco de dados de teste inteiramente separado da produção. |
