---
order: 8
---

# Convenções de documentação do código por linguagem

Documentar uma função (o que ela faz, seus parâmetros, o que ela retorna) é um princípio universal, mas a **sintaxe exata** para fazer isso não é a mesma de uma linguagem para outra. Cada ecossistema tem sua própria convenção, reconhecida por suas próprias ferramentas: uma IDE a usa para exibir uma dica ao passar o mouse sobre uma chamada, um gerador de documentação a transforma em um site consultável. Escrever uma documentação que não segue nenhuma dessas convenções (um simples parágrafo livre, por exemplo) priva o projeto desses dois benefícios, mesmo que o conteúdo em si esteja correto.

## [Python](/?c=langages&s=python&p=python): Google style e NumPy style

Python não tem sintaxe imposta pela própria linguagem, mas duas convenções dominam na prática, ambas reconhecidas pelos geradores de documentação ([Sphinx](https://www.sphinx-doc.org)):

```python
def convertir_devise(montant, taux):
    """Converte um valor de uma moeda para outra.

    Args:
        montant (float): O valor a converter, na moeda de origem.
        taux (float): A taxa de câmbio (1 unidade de origem = taux unidades de destino).

    Returns:
        float: O valor convertido, na moeda de destino.
    """
    return montant * taux
```

| | Google style | NumPy style |
|---|---|---|
| Seções | `Args:`, `Returns:` (palavras-chave simples) | `Parameters`/`Returns` sob linhas de traços `----------` |
| Densidade | Mais compacta | Mais verbosa, cada parâmetro em várias linhas |
| Contexto de uso típico | Projetos aplicativos generalistas | Bibliotecas científicas (numpy, pandas, scikit-learn) |

## [JavaScript](/?c=langages&s=javascript&p=javascript) / TypeScript: JSDoc

[JSDoc](https://jsdoc.app) precede a função com um comentário `/** ... */`, com tags `@param`/`@returns`:

```javascript
/**
 * Converte um valor de uma moeda para outra.
 * @param {number} montant - O valor a converter, na moeda de origem.
 * @param {number} taux - A taxa de câmbio (1 unidade de origem = taux unidades de destino).
 * @returns {number} O valor convertido, na moeda de destino.
 */
function convertirDevise(montant, taux) {
    return montant * taux;
}
```

Em TypeScript, os tipos já declarados na assinatura (`montant: number`) tornam o tipo JSDoc `{number}` redundante: a maioria dos projetos TypeScript então omite as anotações de tipo no comentário, mantendo `@param`/`@returns` apenas para a descrição em linguagem natural.

## Java: Javadoc

[Javadoc](https://docs.oracle.com/javase/8/docs/technotes/tools/windows/javadoc.html) usa a mesma sintaxe `/** ... */` do JSDoc, com suas próprias tags (`@param`, `@return`, `@throws`):

```java
/**
 * Converte um valor de uma moeda para outra.
 *
 * @param montant O valor a converter, na moeda de origem.
 * @param taux A taxa de câmbio (1 unidade de origem = taux unidades de destino).
 * @return O valor convertido, na moeda de destino.
 */
double convertirDevise(double montant, double taux) {
    return montant * taux;
}
```

A ferramenta `javadoc`, fornecida com o JDK, gera diretamente um site [HTML](/?c=langages&s=html&p=html) consultável a partir desses comentários: é assim que a própria documentação oficial da biblioteca padrão Java é produzida.

## [C](/?c=langages&s=c&p=c) / [C++](/?c=langages&s=cpp&p=cpp): Doxygen

[Doxygen](https://www.doxygen.nl) retoma uma sintaxe muito próxima do Javadoc, mas também cobre o C, que não tem equivalente nativo:

```cpp
/**
 * @brief Converte um valor de uma moeda para outra.
 * @param montant O valor a converter, na moeda de origem.
 * @param taux A taxa de câmbio (1 unidade de origem = taux unidades de destino).
 * @return O valor convertido, na moeda de destino.
 */
double convertir_devise(double montant, double taux) {
    return montant * taux;
}
```

Doxygen também aceita a sintaxe `///` (três barras) linha por linha como alternativa ao bloco `/** */`, uma diferença puramente estilística sem efeito sobre o que a ferramenta extrai.

## Comparativo

| Linguagem | Convenção | Bloco de comentário | Tags principais | Gerador associado |
|---|---|---|---|---|
| Python | Google / NumPy style | `""" ... """` | `Args:`, `Returns:` | Sphinx |
| JavaScript / TypeScript | JSDoc | `/** ... */` | `@param`, `@returns` | JSDoc, TypeDoc |
| Java | Javadoc | `/** ... */` | `@param`, `@return`, `@throws` | javadoc (JDK) |
| C / C++ | Doxygen | `/** ... */` ou `///` | `@brief`, `@param`, `@return` | Doxygen |

> **Sinal de alerta:** um formato de documentação personalizado (um parágrafo livre, uma estrutura ad hoc) em vez da convenção já padrão para a linguagem utilizada. Nenhuma ferramenta reconhece esse formato: nenhuma dica no editor, nenhum site de documentação gerado, mesmo que o conteúdo escrito esteja correto. É melhor seguir a convenção já estabelecida para o ecossistema da linguagem utilizada (veja a tabela acima), e permanecer coerente com ela em todo o projeto em vez de misturar vários estilos conforme o arquivo.

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | Cada linguagem tem sua própria convenção de documentação reconhecida por suas ferramentas (Google/NumPy style em Python, JSDoc em JavaScript/TypeScript, Javadoc em Java, Doxygen em C/C++), com tags como `@param`/`@returns` próprias de cada sintaxe. |
| **Ferramentas utilizáveis** | Sphinx (Python), JSDoc/TypeDoc (JS/TS), javadoc (Java), Doxygen (C/C++) para gerar uma documentação consultável a partir desses comentários. |
| **Armadilhas a evitar** | Inventar um formato de documentação personalizado em vez de seguir a convenção padrão da linguagem, o que priva o projeto das ferramentas associadas. |
| **Boas práticas** | Seguir a convenção já estabelecida para o ecossistema da linguagem utilizada, e permanecer coerente com ela em todo o projeto. |
