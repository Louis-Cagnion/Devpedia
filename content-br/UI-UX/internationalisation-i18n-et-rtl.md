---
order: 7
---

# Internacionalização (i18n) e RTL: projetar além de um único idioma

**i18n** (*internationalization*, 18 letras entre o i e o n) designa o fato de projetar um produto para que ele **possa** ser adaptado a outros idiomas e regiões sem ser repensado; **l10n** (*localization*) designa o trabalho concreto de adaptação a um idioma e uma região específicos (tradução, formato de data, sentido de leitura). A i18n é um pré-requisito de projeto, a l10n é seu resultado para cada idioma adicionado.

## i18n vs l10n: tornar possível, depois fazer de fato

| | i18n | l10n |
|---|---|---|
| Momento | Decidido já na concepção e na arquitetura do produto | Realizado para cada idioma/região alvo, possivelmente depois |
| Natureza | Estrutural: nenhum texto fixo no código, formatos adaptáveis, layout que tolera um texto mais longo | Concreto: tradução real, formato de data local, moeda local |
| Custo se esquecido | Custoso de corrigir depois (reestruturação do código e dos protótipos) | Custoso mas isolado (adicionar mais um idioma) |

Um produto pensado com i18n desde o início pode adicionar um idioma em l10n quase sem tocar no código; um produto que não foi pensado assim precisa primeiro ser reestruturado antes que uma única tradução adicional seja possível.

## A armadilha do texto que muda de comprimento

Uma tradução quase nunca ocupa o mesmo espaço que o texto original: uma palavra inglesa curta pode virar uma expressão alemã duas vezes mais longa, um espaço suficiente em português pode não ser suficiente em outro idioma.

> **Armadilha:** projetar um protótipo com contêineres de tamanho fixo, calibrados pelo comprimento do texto em um único idioma (geralmente o inglês, o idioma de projeto original). Um texto traduzido mais longo transborda, é truncado, ou quebra o layout, descoberto somente depois que a tradução é adicionada.
>
> **Boa prática:** testar o layout com um texto artificialmente alongado já na concepção (uma técnica chamada *pseudo-localização*), em vez de esperar uma tradução real para descobrir o problema; prever contêineres que se adaptam ao conteúdo em vez de uma largura fixa.

## RTL: muito mais do que um sentido de leitura invertido

Um idioma **RTL** (*right-to-left*, como o árabe ou o hebraico) não se limita a inverter o sentido de leitura do texto: ele **inverte o layout inteiro**, como se toda a interface fosse refletida em um espelho.

| Elemento | Em LTR (esquerda para direita) | Em RTL (direita para esquerda) |
|---|---|---|
| Alinhamento do texto | À esquerda | À direita |
| Ícone "voltar" | Seta para a esquerda | Seta para a direita |
| Ordem da navegação principal | Da esquerda para a direita | Da direita para a esquerda |
| Barra de progresso | Preenche para a direita | Preenche para a esquerda |

> **Armadilha:** traduzir apenas o texto e deixar o layout idêntico (ícones de navegação, alinhamento, ordem dos elementos). O resultado mistura um texto que se lê da direita para a esquerda com uma interface sempre pensada da esquerda para a direita, incoerente e confuso para um usuário RTL.
>
> **Boa prática:** usar propriedades [CSS](/?c=langages&s=css&p=css) "lógicas" (`margin-inline-start` em vez de `margin-left`, por exemplo) que se invertem automaticamente conforme o sentido da página, em vez de propriedades físicas fixas que precisariam ser duplicadas manualmente para cada sentido.

Alguns ícones deliberadamente **nunca** se invertem, mesmo em RTL: os que representam um objeto do mundo real cuja orientação tem um sentido universal (um relógio, um símbolo de reprodução ▶ em muitas convenções) permanecem idênticos, enquanto os ícones puramente direcionais (setas, chevrons de navegação) se invertem.

## Nunca fixar um texto no código

Um texto escrito diretamente no código (`<button>Confirmar</button>`) só pode ser traduzido modificando o próprio código, idioma por idioma. A técnica padrão em i18n externaliza cada texto em um arquivo de tradução, referenciado por uma **chave** em vez de por seu valor:

```json
// pt.json
{ "botao_confirmar": "Confirmar" }

// en.json
{ "botao_confirmar": "Confirm" }
```

```javascript
<button>{traduzir("botao_confirmar")}</button>
```

Adicionar um idioma se torna então adicionar um arquivo de chaves traduzidas, sem tocar no código que as exibe.

## Formatos sensíveis à localidade: datas, números, moedas

Além do texto, vários formatos mudam conforme a região, independentemente do idioma em si:

| Dado | Exemplo Brasil (pt-BR) | Exemplo Estados Unidos (en-US) |
|---|---|---|
| Data | 20/08/2026 | 08/20/2026 |
| Número decimal | 1.234,56 | 1,234.56 |
| Moeda | R$ 1.234,56 | $1,234.56 |

> **Armadilha:** formatar você mesmo uma data ou um número com uma lógica escrita à mão (concatenação de strings), válida apenas para o formato de uma única região. Um usuário de outra região lê então uma data ambígua ou mal formada (`08/20/2026` lido como o dia 8 do mês 20 por um leitor acostumado ao formato dia/mês).
>
> **Boa prática:** usar as funções de formatação sensíveis à localidade já fornecidas pela linguagem ou pela plataforma em vez de uma formatação escrita à mão, para que a data, o número ou a moeda apareçam automaticamente na convenção esperada por cada região.

---

## 📋 Recapitulação

| | |
|---|---|
| **Para lembrar** | A i18n (tornar um produto adaptável) precede a l10n (adaptá-lo concretamente a um idioma). Um texto traduzido muda de comprimento, o que quebra um layout de tamanho fixo. O RTL inverte o layout inteiro, não só o sentido do texto. Todo texto deve ser externalizado em um arquivo de tradução, nunca fixado no código. |
| **Ferramentas utilizáveis** | A pseudo-localização para testar um layout com um texto alongado. As propriedades CSS lógicas (`margin-inline-start`...) para um layout que se inverte automaticamente em RTL. As funções de formatação sensíveis à localidade para datas, números e moedas. |
| **Armadilhas a evitar** | Um layout de tamanho fixo calibrado para um único idioma. Traduzir apenas o texto sem inverter o layout em RTL. Fixar um texto no código em vez de em um arquivo de tradução. Formatar uma data ou um número à mão em vez de com as funções sensíveis à localidade. |
| **Boas práticas** | Testar com um texto artificialmente alongado já na concepção. Usar propriedades CSS lógicas para o layout. Externalizar todo texto em um arquivo de tradução referenciado por chave. Usar as funções de formatação nativas sensíveis à localidade. |
