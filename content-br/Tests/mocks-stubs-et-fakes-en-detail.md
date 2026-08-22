---
order: 9
---

# Mocks, stubs e fakes em detalhe

O capítulo sobre a [arquitetura de testes](/?c=tests&p=architecture-de-test) apresentou os test doubles (stub, mock, fake) em uma frase cada. Este capítulo aprofunda suas diferenças práticas, e sobretudo a cilada mais comum do seu uso: o excesso de mocks.

## Três famílias, três usos

| Test double | Responde a | Verifica |
|---|---|---|
| **Stub** | "O que essa dependência deve retornar?" | Nada: apenas uma resposta fixa, imposta pelo teste |
| **Mock** | "Essa dependência foi usada corretamente?" | Se uma chamada realmente aconteceu, com quais argumentos, quantas vezes |
| **Fake** | "Como se comportaria uma versão real simplificada?" | Nada diretamente: é uma implementação que se comporta quase como a real |

```text
Função testada: enviarNotificacao(usuario, servico)

Com um stub:
  servico = { enviar: () => "ok" }
  -> o teste verifica o que enviarNotificacao() faz com essa
     resposta fixa, sem se importar como servico.enviar() foi
     chamado

Com um mock:
  servico = um mock do serviço, que registra cada chamada
  -> o teste então verifica: servico.enviar foi chamado uma
     vez, com o usuário esperado como parâmetro?

Com um fake:
  servico = uma implementação em memória que armazena de fato
  as notificações enviadas, sem nunca tocar na rede
  -> o teste pode reler a lista de notificações "enviadas"
     como o serviço real faria
```

## Teste baseado em estado vs baseado em interação

Essa distinção reflete duas formas diferentes de verificar um comportamento:

| Abordagem | O que observa |
|---|---|
| **Baseada em estado** (stub, fake) | O resultado final: o que a função produziu ou mudou? |
| **Baseada em interação** (mock) | O desenrolar: quais dependências foram chamadas, e como? |

Um teste baseado em estado continua válido mesmo que a implementação mude internamente (desde que o resultado final não mude); um teste baseado em interação, por outro lado, quebra assim que a implementação muda sua forma de chamar suas dependências, mesmo que o resultado final continue idêntico.

> **Cilada:** usar um mock para verificar um detalhe de implementação sem importância real (a ordem exata de duas chamadas independentes, por exemplo). O teste fica então acoplado a uma decisão de implementação arbitrária, e quebra com o menor refactoring que, no entanto, não muda nada do comportamento observável.
>
> **Boa prática:** preferir um teste baseado em estado sempre que o resultado final baste para verificar o comportamento; reservar o mock para os casos em que a própria interação é o comportamento a verificar (ex. "um email foi de fato enviado", onde não existe outro resultado observável além da própria chamada).

## O excesso de mocks: a cilada mais comum

Substituir por um test double **cada** dependência de uma função, incluindo as que poderiam continuar reais sem custo algum, produz um teste que já não verifica muita coisa: ele só confirma que o código chama as funções certas na ordem certa, nunca que produz um resultado correto.

```text
Função testada: calcularTotal(carrinho) que usa
  - uma função interna aplicarDesconto() (pura, sem
    dependência externa)
  - um serviço externo taxaDeCambio()

Excesso de mocks:
  também mockar aplicarDesconto() -> o teste já não verifica
  se o desconto é aplicado corretamente, apenas que foi
  "chamada"

Bom equilíbrio:
  manter aplicarDesconto() real (sem dependência externa,
  rápida, determinística), mockar apenas taxaDeCambio()
  (dependência externa, potencialmente lenta ou não
  determinística)
```

> **Cilada:** simular uma dependência apenas porque ela é chamada pela função testada, sem se perguntar se ela realmente precisa ser (rede, tempo, aleatoriedade) ou se poderia continuar sendo o código real.
>
> **Boa prática:** substituir por um test double apenas as dependências genuinamente custosas ou não determinísticas de usar tal como estão em um teste; manter o código interno, puro e determinístico, tal como está no teste.

---

## 📋 Recapitulação

| | |
|---|---|
| **A lembrar** | Um stub retorna uma resposta fixa, um mock verifica como foi chamado, um fake é uma implementação simplificada mas funcional. Um teste baseado em estado permanece estável diante do refactoring interno; um teste baseado em interação (mock) é mais sensível a ele. O excesso de mocks (simular dependências internas puras) produz testes que já não verificam o comportamento real. |
| **Ferramentas utilizáveis** | Um stub/fake para um teste baseado em estado. Um mock apenas quando a própria interação é o comportamento a verificar. |
| **Ciladas a evitar** | Usar um mock para um detalhe de implementação sem importância real. Simular uma dependência que poderia continuar real sem custo (código interno, puro, determinístico). |
| **Boas práticas** | Preferir um teste baseado em estado quando o resultado final basta. Mockar apenas as dependências genuinamente custosas ou não determinísticas. |
