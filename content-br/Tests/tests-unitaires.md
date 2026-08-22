---
order: 4
---

# Os testes unitários

A [pirâmide de testes](/?c=tests&p=pyramide-de-test) coloca os testes unitários em sua base: os mais numerosos, os mais rápidos, os mais baratos de manter. Este capítulo detalha concretamente o que esse nível verifica, e como escrever um teste unitário que continue útil ao longo do tempo.

## Uma unidade, uma responsabilidade

Um teste unitário verifica uma **unidade** de código isolada do resto do programa, quase sempre uma única função ou método. "Isolada" significa que nenhuma dependência externa real (banco de dados, rede, sistema de arquivos) está envolvida: essas dependências são substituídas por [test doubles](/?c=tests&p=architecture-de-test) quando a função precisa delas.

```text
Função testada: calcularDesconto(preco, porcentagem)

Teste unitário:
  entrada: preco=100, porcentagem=10
  resultado esperado: 90
  -> nenhum banco de dados, nenhuma rede, nenhum arquivo envolvido
```

## O trio Arrange / Act / Assert

A grande maioria dos testes unitários segue a mesma estrutura em três tempos, seja qual for a linguagem ou a ferramenta de teste usada:

| Etapa | Papel |
|---|---|
| **Arrange** (preparar) | Montar os dados e o estado necessários para o teste |
| **Act** (agir) | Chamar a função ou o método testado |
| **Assert** (verificar) | Comparar o resultado obtido com o resultado esperado |

```text
teste "calcularDesconto aplica corretamente uma porcentagem":
  // Arrange
  preco = 100
  porcentagem = 10

  // Act
  resultado = calcularDesconto(preco, porcentagem)

  // Assert
  verificar que resultado == 90
```

Essa estrutura torna um teste legível em um relance, mesmo para quem não o escreveu: onde estão os dados de partida, qual ação está sendo testada, qual resultado é esperado.

> **Cilada:** misturar vários "Act" em um único teste (chamar várias funções diferentes antes de verificar). Se o teste falhar, é impossível saber qual das ações é a culpada sem depurar.
>
> **Boa prática:** um teste unitário verifica um único comportamento preciso; se for preciso testar vários comportamentos de uma mesma função, escrever vários testes distintos em vez de um único teste que faz tudo.

## Um nome de teste que documenta o comportamento

O nome de um teste unitário serve como documentação viva: deve descrever o comportamento esperado, não apenas a função chamada.

```text
Nome pouco util :  test_calcularDesconto()

Nome util        :  test_calcularDesconto_aplica_corretamente_uma_porcentagem()
                     test_calcularDesconto_retorna_zero_para_um_desconto_de_100
                     test_calcularDesconto_lanca_um_erro_para_uma_porcentagem_negativa
```

Um relatório de execução que lista os testes com falha se torna então legível diretamente pelo seu nome, sem precisar abrir o código do teste para entender o que quebrou.

## Cobrir os casos limite, não apenas o caso nominal

Um teste unitário que só verifica o caso normal (o *happy path*) deixa passar os comportamentos nos limites: um valor zero, uma lista vazia, um valor negativo onde só se esperava um positivo.

```text
Função testada: calcularDesconto(preco, porcentagem)

Casos a cobrir:
  - caso nominal      : porcentagem=10  -> desconto aplicado normalmente
  - limite inferior     : porcentagem=0   -> nenhum desconto, preço inalterado
  - limite superior      : porcentagem=100 -> resultado igual a zero
  - caso invalido        : porcentagem=-5  -> comportamento esperado a definir
                                               (erro? valor padrão?)
```

> **Cilada:** contentar-se com um único teste sobre o caso nominal e considerar a função "testada". A maioria dos bugs reais se esconde nos casos limite, nunca exercitados por um único teste de caminho feliz.
>
> **Boa prática:** para cada função testada, listar explicitamente seus casos limite (valores zero, vazios, negativos, máximos) antes de escrever os testes, em vez de descobri-los depois em produção.

## Um teste que falha por um único motivo

Um teste unitário bem projetado falha por uma única causa possível: o comportamento que ele verifica deixou de estar correto. Um teste que depende da ordem de execução de outros testes, de um estado global compartilhado, ou do relógio do sistema, pode falhar sem relação com um bug real: é um teste **instável** (*flaky*), que corrói a confiança da equipe em toda a suíte de testes.

> **Cilada:** um teste que passa ou falha de forma inconsistente de uma execução para outra, sem mudança de código. Uma equipe que encontra isso regularmente acaba ignorando falhas de teste por reflexo, o que anula o próprio sentido de ter testes.
>
> **Boa prática:** tratar um teste instável como um bug a corrigir com prioridade, não como um incômodo a contornar (executar o teste novamente até passar, por exemplo), pois um teste em que não se confia mais não serve para nada.

---

## 📋 Recapitulação

| | |
|---|---|
| **A lembrar** | Um teste unitário verifica uma única unidade de código isolada, geralmente seguindo a estrutura Arrange/Act/Assert. Seu nome documenta o comportamento esperado. Deve cobrir os casos limite, não apenas o caso nominal, e falhar por uma única causa possível. |
| **Ferramentas utilizáveis** | A estrutura Arrange/Act/Assert para organizar um teste. Uma lista explícita de casos limite (zero, vazio, negativo, máximo) antes de escrever os testes. |
| **Ciladas a evitar** | Misturar várias ações em um único teste. Cobrir apenas o caso nominal. Deixar um teste instável (flaky) sem corrigir. |
| **Boas práticas** | Um teste = um comportamento verificado. Nomear um teste de acordo com o comportamento que ele verifica. Listar os casos limite antes de escrever os testes. Corrigir um teste instável com prioridade em vez de contorná-lo. |
