---
order: 8
---

# A cobertura de código

Uma suíte de testes cresce capítulo após capítulo, mas uma pergunta ficou sem resposta direta até agora: como saber se ela cobre o programa o suficiente? A **cobertura de código** (*code coverage*) tenta responder a essa pergunta com uma medida numérica, com limites importantes a conhecer antes de confiar nela.

## O que a cobertura mede

A cobertura de código mede a proporção do código-fonte realmente **executada** pelo menos uma vez durante a execução da suíte de testes, geralmente expressa em porcentagem.

```text
function calcularDesconto(preco, porcentagem) {
    if (porcentagem < 0) {
        return preco;              // linha A
    }
    return preco * (1 - porcentagem / 100);  // linha B
}

Um único teste com porcentagem=10:
  -> linha B executada, linha A nunca executada
  -> cobertura dessa função: 50% (1 linha de 2)
```

Uma ferramenta de cobertura instrumenta o código durante a execução dos testes, e então produz um relatório indicando quais linhas (ou quais ramos, quais funções) foram executadas ou não.

## Várias granularidades de medida

| Tipo de cobertura | O que verifica |
|---|---|
| **Cobertura de linhas** | Cada linha de código foi executada pelo menos uma vez? |
| **Cobertura de ramos** | Cada caminho possível de um `if`/`else` foi percorrido (ambos, não apenas um)? |
| **Cobertura de funções** | Cada função foi chamada pelo menos uma vez? |

A cobertura de ramos é mais exigente que a cobertura de linhas: um `if` sem `else` pode ter 100% de cobertura de linhas sem nunca exercitar o caso em que a condição é falsa, enquanto a cobertura de ramos exigiria isso.

## A cilada central: um número alto não garante nada

Uma linha "coberta" significa apenas que ela foi **executada** durante um teste, não que seu resultado foi **verificado**. Um teste que chama uma função sem nunca comparar seu resultado a um valor esperado faz a cobertura subir sem detectar nenhum bug.

```text
function calcularDesconto(preco, porcentagem) {
    return preco * (1 - porcentagem / 100);
}

teste "calcularDesconto não quebra":
    calcularDesconto(100, 10);   // executa a linha, mas...
    // ...nenhuma verificação do resultado obtido!

-> 100% de cobertura dessa função, mesmo que um bug que
   invertesse o cálculo (ex. preco * (1 + porcentagem / 100))
   nunca seria detectado
```

> **Cilada:** mirar em uma porcentagem de cobertura alta como objetivo em si, escrevendo testes que executam código sem realmente verificar seu comportamento. 100% de cobertura não significa 0% de bugs.
>
> **Boa prática:** tratar a cobertura como um indicador do que *certamente não* está testado (uma linha em 0% não tem nenhum teste), nunca como prova de que o que está coberto está correto.

## Para que a cobertura realmente serve

Apesar dessa limitação, a cobertura continua útil para um uso específico: localizar as áreas de código **totalmente desprovidas** de teste, em particular após uma modificação. Um relatório de cobertura que cai repentinamente em um arquivo recém-modificado sinaliza um ponto cego real, a ser preenchido antes de considerar a mudança concluída.

> **Boa prática:** usar a cobertura para localizar as lacunas evidentes (código nunca executado por nenhum teste), não para julgar a qualidade dos testes existentes sobre o código já coberto.

## Um limiar a escolher com discernimento

Algumas equipes definem um limiar mínimo de cobertura (frequentemente entre 70% e 90%) abaixo do qual uma contribuição é recusada. Esse limiar faz sentido como salvaguarda contra a ausência total de teste em código novo, mas mirar em 100% em todo lugar tem um custo crescente: os últimos percentuais costumam cobrir código de baixo risco (tratamento de erros trivial, código gerado) para um ganho de confiabilidade marginal.

---

## 📋 Recapitulação

| | |
|---|---|
| **A lembrar** | A cobertura de código mede a proporção de código executada pelos testes (linhas, ramos, funções), não a qualidade do que é verificado. Uma linha coberta não é forçosamente uma linha corretamente testada: 100% de cobertura não garante a ausência de bugs. |
| **Ferramentas utilizáveis** | Uma ferramenta de cobertura que instrumenta a execução dos testes, produzindo um relatório por linha/ramo/função. Um limiar mínimo (70-90%) como salvaguarda em código novo. |
| **Ciladas a evitar** | Mirar em uma porcentagem de cobertura alta como objetivo em si. Escrever testes que executam código sem verificar seu resultado. |
| **Boas práticas** | Usar a cobertura para localizar código totalmente não testado, não para julgar a qualidade do que já está coberto. Não mirar em 100% em todo lugar: o ganho marginal dos últimos percentuais costuma ser pequeno. |
