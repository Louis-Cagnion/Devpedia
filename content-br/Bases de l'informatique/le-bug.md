---
order: 6
---

# O bug

O [primeiro capítulo](/?c=bases-de-l-informatique&p=code-programmes-et-fichiers) já avisava: um computador executa as instruções ao pé da letra, sem nunca adivinhar uma intenção. Um **bug** é a consequência direta dessa regra: um defeito no código que o impede de produzir o resultado esperado, não porque o computador "erra", mas porque as próprias instruções eram imprecisas, incompletas ou incorretas.

> **Analogia:** uma receita que diz "colocar leite" sem especificar a quantidade. Quem a segue ao pé da letra precisa escolher uma quantidade, não necessariamente a que o autor tinha em mente.

## Um exemplo concreto

```text
saldo = 100
retirada = 150
saldo = saldo - retirada  → saldo se torna -50: nada verificou se havia dinheiro suficiente
exibir saldo              → exibe -50
```

O código é executado sem travar, e faz exatamente o que está escrito; esse é justamente o problema: ninguém escreveu a instrução "recusar a retirada se o saldo for insuficiente".

> **Boa prática:** validar as condições críticas antes de agir (aqui: `retirada <= saldo`), em vez de executar a operação e descobrir o problema no resultado final.

## Três famílias de bugs

| Tipo de bug | O que acontece | Exemplo |
|---|---|---|
| Erro de sintaxe | O código não respeita a gramática da linguagem: ele não pode nem ser executado | Um parêntese nunca fechado |
| Erro de execução (*crash*) | O código é válido, mas encontra uma situação que não sabe tratar, e para abruptamente | Dividir um número por zero |
| Erro lógico | O código é executado sem travar, mas produz um resultado errado | O exemplo do saldo negativo acima |

O erro lógico é o mais difícil dos três de identificar: nada avisa que um problema ocorreu, já que o programa termina normalmente; só o resultado está errado.

> **Cuidado:** achar que um programa que roda sem travar está necessariamente correto. A ausência de crash não diz nada sobre um erro lógico: só uma verificação do resultado obtido (contra o resultado esperado) o revela.
>
> **Boa prática:** para qualquer tarefa em que o resultado correto seja conhecível de antemão (mesmo que aproximadamente), compará-lo sistematicamente com o resultado obtido, em vez de confiar apenas no fato de que "está rodando".

## Ler uma mensagem de erro

Diante de um crash, a maioria das linguagens exibe uma mensagem que indica onde e por que falhou:

```text
Erro: divisao por zero
  na linha 4, na funcao "calcular_media"
```

Aprender a ler esse tipo de mensagem (qual linha, qual causa) economiza um tempo considerável.

> **Cuidado:** parar na linha indicada supondo que é ali que necessariamente está o erro. O crash acontece onde o problema se torna visível (ex.: um valor ausente sendo usado), não necessariamente onde ele foi **criado** (ex.: o valor ausente pode ter sido definido bem mais acima).
>
> **Boa prática:** usar a linha indicada como ponto de partida da busca, não como veredito final; voltar mais para trás se a causa não estiver diretamente visível ali.

## Como eles são detectados

Uma [IDE](/?c=bases-de-l-informatique&p=editeur-de-code-et-ide) ajuda nas três famílias, cada uma à sua maneira: detecção de erro de sintaxe antes mesmo de executar o código, mensagem exibida no momento de um crash, e um depurador para observar o estado das variáveis passo a passo, útil principalmente para um erro lógico, invisível de outra forma.

> **Cuidado:** concluir que a ausência de aviso da IDE ("nenhum sublinhado vermelho") garante a ausência de bug. A detecção de erro de uma IDE cobre apenas a sintaxe (e às vezes alguns erros de execução óbvios), nunca os erros lógicos, que só se revelam no resultado produzido.
>
> **Boa prática:** nunca confundir "a IDE não sinaliza nada" com "o programa está correto": só testes contra um resultado esperado cobrem os erros lógicos.

---

## 📋 Recapitulando

| | |
|---|---|
| **O que reter** | Um bug sempre vem de uma instrução imprecisa ou incompleta, nunca de um "erro de compreensão" do computador. Três famílias: erro de sintaxe (não executa), erro de execução (trava no meio do caminho), erro lógico (executa, mas dá um resultado errado). |
| **Ferramentas úteis** | A detecção de erro e o depurador de uma IDE; a mensagem de erro exibida em um crash. |
| **Armadilhas a evitar** | Ignorar uma mensagem de erro sem lê-la por completo: a linha e a causa indicadas quase sempre são o ponto de partida mais rápido, mesmo que nem sempre bastem por si só. |
| **Boas práticas** | Diante de um erro lógico (sem mensagem, só um resultado errado), verificar passo a passo o que cada instrução realmente faz, em vez de supor que ela faz o que se queria. |
