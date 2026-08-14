---
order: 6
---

# OCaml

Todas as linguagens vistas até agora neste tópico ([C](/?c=langages-de-programmation&s=c&p=c), [C++](/?c=langages-de-programmation&s=cpp&p=cpp), [PHP](/?c=langages-de-programmation&s=php&p=php), [Python](/?c=langages-de-programmation&s=python&p=python), [JavaScript](/?c=langages-de-programmation&s=javascript&p=javascript)) compartilham o mesmo estilo de fundo: **instruções** executadas em ordem, uma mutação direta de variáveis, laços para repetir um processamento. É o estilo **imperativo**, e é tão difundido que se torna invisível.

O **OCaml** é a ocasião de observar um estilo diferente, o estilo **funcional**: os programas ali se constroem combinando funções e avaliando expressões, em vez de encadear instruções que modificam um estado. Não é uma linguagem exótica de laboratório; o OCaml compila código nativo tão rápido quanto C, e é usado em produção em áreas que valorizam particularmente a confiabilidade: finanças ([Jane Street](https://www.janestreet.com) fez dela sua linguagem principal), verificação formal (o assistente de prova [Coq](https://coq.inria.fr) é escrito em OCaml), e análise estática de código.

Entre os conceitos essenciais abordados neste tópico:

- A comparação direta entre estilo funcional e estilo imperativo: expressões contra instruções, imutabilidade contra mutação
- As funções puras e suas vantagens concretas (código mais fácil de testar, de raciocinar, de paralelizar)
- O filtro por padrão (*pattern matching*) e os tipos algébricos, uma alternativa estruturada aos `if`/`switch` clássicos
- A recursão como substituta dos laços, e as funções de ordem superior (`map`, `filter`, `fold`)
- A inferência de tipos: uma tipagem estrita, verificada na compilação, sem precisar escrever a menor anotação de tipo

> **Nota:** o OCaml não impõe um estilo 100% puro: ao contrário do [Haskell](https://www.haskell.org), ele permite tranquilamente laços `for`/`while`, referências mutáveis (`ref`), e programação orientada a objetos. O estilo funcional é ali a cultura dominante e a ferramenta mais natural, não uma restrição absoluta da linguagem. É precisamente isso que permite comparar os dois estilos *dentro* de uma única e mesma linguagem em vez de opor duas linguagens diferentes.
