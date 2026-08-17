---
order: 1
---

# Responsabilidade única e baixo acoplamento

Uma função, uma classe ou um arquivo que faz "um pouco de tudo" parece prático no momento (tudo está no mesmo lugar) mas se torna o primeiro obstáculo assim que precisa evoluir: uma mudança para uma necessidade acaba descarrilando involuntariamente outro uso do mesmo arquivo, porque os dois nunca foram realmente independentes.

## O teste de verdade: o motivo de mudar

A pergunta a se fazer não é *"esse arquivo está longo demais?"* mas *"se eu preciso modificar isto, é pelo mesmo motivo que aquilo?"*. Dois pedaços de código que mudam por motivos diferentes (um porque a lógica de negócio evolui, o outro porque o formato de exibição muda) deveriam viver em arquivos diferentes, mesmo que sejam curtos e ligados no mesmo fluxo de execução.

Um exemplo concreto: um módulo que misturava a renderização de um relatório (formatação de texto, tabelas, resumo) e o gerenciamento de um estado de retomada (salvar em que ponto um processamento foi interrompido, para retomá-lo depois). Os dois tinham cada um seu próprio motivo de mudar (um segue os pedidos de apresentação, o outro segue a lógica de recuperação de erro) e acabaram vivendo em dois arquivos separados (`report.py` para a renderização, `resume.py` para o estado de retomada), cada um testável e compreensível sem o outro.

## O sinal concreto para dividir um arquivo

Dois sinais, complementares, indicam que um arquivo ultrapassou sua responsabilidade única:

- **Responsabilidades que não compartilham o mesmo motivo de mudar**: o teste acima, o mais confiável mas também o mais subjetivo.
- **Um tamanho que ultrapassa um limite razoável** (frequentemente citado em torno de 700-800 linhas para um arquivo de código): um sinal mais mecânico, que não é uma causa em si mas se correlaciona fortemente com um arquivo que acumulou várias responsabilidades sem que se percebesse.

Um arquivo de testes com mais de 1200 linhas, cobrindo sete módulos distintos de um mesmo projeto, ilustra bem os dois sinais ao mesmo tempo: cada módulo tem seu próprio motivo de mudar (uma evolução do parsing de especificações não deve afetar os testes de gerenciamento de navegador), e o tamanho tornava o arquivo penoso de navegar. A divisão em sete arquivos, um por módulo testado, tornou cada parte independentemente legível e executável.

## O baixo acoplamento: a contrapartida

A responsabilidade única não basta se as partes, uma vez separadas, dependem fortemente dos detalhes internas umas das outras: um arquivo "separado" que precisa ser relido inteiro a cada modificação de outro só está separado na aparência. O acoplamento baixo significa que um módulo expõe uma interface clara (funções, tipos) e que seus chamadores só precisam conhecer essa interface, nunca sua implementação interna.

> **Sinal de alerta:** se modificar um detalhe de implementação em um arquivo obriga sistematicamente a modificar outro arquivo que apenas o chama, o acoplamento está forte demais, mesmo que cada arquivo, isoladamente, pareça ter uma responsabilidade clara.

## O acoplamento oculto por um dado compartilhado

O acoplamento nem sempre passa por uma chamada de função: dois mecanismos que, aparentemente, não têm nada a ver um com o outro podem estar acoplados silenciosamente porque reutilizam, por conveniência, a **mesma constante**. Caso real: duas detecções independentes (uma identificando letras isoladas legítimas em um texto, a outra um tipo de anomalia totalmente diferente) compartilhavam uma mesma lista `LETRAS_ISOLADAS_LEGITIMAS`, sem nenhuma relação real entre suas duas intenções, apenas porque a segunda tinha sido escrita reutilizando uma constante que já estava no arquivo.

O teste de verdade (o motivo de mudar, visto acima) se aplica aqui igualmente: ajustar essa lista para refinar a primeira detecção modificava silenciosamente o comportamento da segunda, sem que nenhuma chamada de função deixasse isso perceptível na leitura. Corrigido separando as duas constantes, cada uma própria de sua detecção, mesmo que seu conteúdo inicial fosse idêntico.

> **Sinal de alerta:** duas partes do código que mudam cada uma por seu próprio motivo, mas que apontam para a **mesma constante** (uma lista, um limite, um dicionário) sem que nenhuma das duas tenha um motivo real para depender do conteúdo exato da outra. Modificar essa constante para um dos dois usos modifica o outro por efeito colateral, sem que nenhum import ou chamada torne isso visível na leitura.

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | Um arquivo que mistura vários motivos de mudar se torna frágil: uma mudança para uma necessidade descarrila outra. O teste de verdade: "se eu modifico isto, é pelo mesmo motivo que aquilo?". |
| **Ferramentas utilizáveis** | O sinal de tamanho (~700-800 linhas) como indício mecânico, complementar ao teste do motivo de mudar. |
| **Armadilhas a evitar** | Separar arquivos sem reduzir o acoplamento entre eles: um arquivo "separado" que precisa ser relido inteiro a cada modificação de outro continua acoplado, mesmo que pareça independente. Dois mecanismos independentes que compartilham a mesma constante sem motivo real de depender um do outro. |
| **Boas práticas** | Dividir um arquivo assim que duas responsabilidades distintas se misturam nele, com uma interface clara entre as partes resultantes da divisão. Dar sua própria constante a cada mecanismo, mesmo que seu conteúdo inicial seja idêntico, assim que não tiverem motivo real de permanecer ligados. |
