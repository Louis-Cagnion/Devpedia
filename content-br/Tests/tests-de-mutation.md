---
order: 11
---

# Os testes de mutação

O capítulo sobre a [cobertura de código](/?c=tests&p=couverture-de-code) estabeleceu uma cilada central: uma linha executada por um teste não é forçosamente uma linha realmente verificada. Os **testes de mutação** (*mutation testing*) respondem diretamente a esse problema, medindo não se o código foi executado, mas se os testes são capazes de detectar um bug quando existe um.

## O princípio: introduzir bugs de propósito

Uma ferramenta de mutation testing modifica automaticamente o código-fonte, uma mudança minúscula de cada vez (um **mutante**), e então executa novamente a suíte de testes contra essa versão levemente quebrada:

```text
Código original:
  if (idade >= 18) { return "maior"; }

Mutantes gerados automaticamente:
  if (idade > 18)   { return "maior"; }   // >= vira >
  if (idade <= 18)  { return "maior"; }   // >= vira <=
  if (idade >= 18)  { return "menor"; }   // valor de retorno invertido
  if (true)         { return "maior"; }   // condição removida
```

Cada mutante representa um bug plausível, introduzido automaticamente. A pergunta feita à suíte de testes para cada um: ela faz o teste falhar?

## Mutante morto ou mutante sobrevivente

| Resultado | Significado |
|---|---|
| **Mutante morto** (*killed*) | Pelo menos um teste falhou diante desse mutante: a suíte de testes teria detectado esse bug se ele realmente existisse |
| **Mutante sobrevivente** (*survived*) | Todos os testes passam apesar da mudança: a suíte de testes não detectaria esse bug se ele realmente existisse |

O **score de mutação** é a proporção de mutantes mortos sobre o total gerado: um score alto indica testes realmente capazes de detectar bugs, não apenas de executar código.

```text
10 mutantes gerados, 8 mortos, 2 sobreviventes
-> score de mutação: 80%

Os 2 mutantes sobreviventes apontam para pontos precisos do
código onde os testes existentes não detectariam um bug real
```

## O que isso revela, que a cobertura não revela

É precisamente o ponto cego da cobertura de código: um teste que executa uma linha sem verificar seu resultado obtém 100% de cobertura nessa linha, mas deixa sobreviver todos os mutantes que a modificam, revelando que a linha na realidade não está verificada.

```text
function calcularDesconto(preco, porcentagem) {
    return preco * (1 - porcentagem / 100);
}

teste "calcularDesconto não quebra":
    calcularDesconto(100, 10);   // 100% de cobertura...
    // ...mas nenhuma verificação do resultado!

Mutante: preco * (1 + porcentagem / 100)  (sinal invertido)
-> o teste não detecta -> mutante sobrevivente
-> revela o que a cobertura sozinha não mostrava
```

## Um custo de cálculo real, a reservar para o código crítico

Gerar e testar cada mutante multiplica o tempo de execução da suíte de testes pelo número de mutantes criados, o que torna o mutation testing nitidamente mais lento que a cobertura clássica.

> **Cilada:** rodar o mutation testing sobre a totalidade de um projeto grande a cada execução da suíte de testes, a ponto de torná-la lenta demais para uso diário.
>
> **Boa prática:** reservar o mutation testing para o código mais crítico (lógica de negócio sensível, cálculos financeiros) ou executá-lo pontualmente (antes de um release, como tarefa em segundo plano), em vez de sobre todo o projeto a cada execução.

---

## 📋 Recapitulação

| | |
|---|---|
| **A lembrar** | O mutation testing modifica automaticamente o código (um mutante de cada vez) e verifica se a suíte de testes detecta cada mudança. Um mutante morto significa que os testes teriam detectado aquele bug; um mutante sobrevivente revela um ponto cego que a cobertura de código sozinha não mostra. |
| **Ferramentas utilizáveis** | Uma ferramenta de mutation testing para gerar mutantes e calcular o score de mutação. |
| **Ciladas a evitar** | Rodar o mutation testing sobre todo o projeto a cada execução, à custa da velocidade da suíte de testes. |
| **Boas práticas** | Reservar o mutation testing para o código mais crítico, ou executá-lo pontualmente em vez de a cada execução da suíte de testes. |
