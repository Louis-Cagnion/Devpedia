---
order: 5
---

# Os processamentos longos

Passado alguns minutos de execução, um programa muda de natureza. Ele deixa de ser um comando que se roda e cujo resultado se vê: passa a ser um processamento que pode ser interrompido, que precisa poder ser monitorado, e cuja falha custa caro. Nessa escala, a robustez se torna uma questão de desempenho: retomar um trabalho de 20 minutos é um ganho bem maior do que arranhar 10% dele.

## Salvar aos poucos

Um programa que acumula seus resultados em memória e só escreve no final perde **tudo** em caso de interrupção: travamento, rede, o computador entrando em suspensão. Escrever cada resultado assim que obtido muda completamente o comportamento em caso de incidente.

O formato mais simples para isso é o [**JSON Lines**](https://jsonlines.org): um objeto JSON completo por linha. Ao contrário de um array JSON, ele não precisa ser fechado para continuar legível: um arquivo truncado no meio continua utilizável até sua última linha completa.

```python
class EstadoDeProgresso:
    def __init__(self, caminho, retomar=False):
        self.caminho = Path(f"{caminho}.parcial")
        self.resultados = []
        if retomar and self.caminho.exists():
            self.resultados = [json.loads(linha) for linha
                              in self.caminho.read_text(encoding="utf-8").splitlines() if linha.strip()]
        else:
            self.caminho.unlink(missing_ok=True)
        self.feitos = {chave(r) for r in self.resultados}

    def adicionar(self, resultado):
        self.resultados.append(resultado)
        self.feitos.add(chave(resultado))
        with self.caminho.open("a", encoding="utf-8") as f:
            f.write(json.dumps(resultado, ensure_ascii=False) + "\n")
```

O laço principal então pula o que já está feito:

```python
restante = [t for t in tarefas if not estado.esta_feito(t)]
```

Dois detalhes que fazem diferença na prática:

- **Filtrar antes de contar.** Se elementos são pulados dentro do laço, os contadores de progresso e a estimativa de conclusão ficam errados (incluem trabalho que não custou nada). Calcular primeiro a lista do que resta torna os dois exatos.
- **Separar o estado do entregável.** Esse arquivo é mecânica interna, não um resultado: dar a ele um nome explícito (`.parcial`) e removê-lo no final evita que seja confundido com a saída. Mantê-lo distinto do entregável também evita que uma ferramenta externa (uma planilha, por exemplo) o regrave em um formato que quebraria a retomada.

## Ler um arquivo grande aos poucos em vez de carregar tudo

Um arquivo de poucos kilobytes carrega inteiro na memória sem nem pensar nisso. Um arquivo de várias centenas de megabytes (uma exportação XML de catálogo de produtos, por exemplo) muda tudo: carregá-lo de uma vez pode bastar para esgotar a memória disponível.

```text
Carregamento completo (DOM):  arquivo inteiro -> arvore em memoria -> percurso
                               memoria proporcional ao tamanho do arquivo

Streaming (SAX/XMLReader):    arquivo -> lido no por no -> processado aos poucos
                               memoria quase constante, seja qual for o tamanho do arquivo
```

| | Carregamento completo (DOM, SimpleXML) | Streaming (SAX, `XMLReader`) |
|---|---|---|
| Memória usada | Proporcional ao tamanho do arquivo | Quase constante |
| Simplicidade do código | Simples: o documento inteiro é navegável de uma vez | Mais verboso: é preciso avançar manualmente no fluxo |
| Adequado para | Arquivos de tamanho razoável (até algumas dezenas de MB) | Arquivos grandes, onde carregar tudo travaria o processo |

```php
<?php
$leitor = new XMLReader();
$leitor->open('catalogo.xml');

while ($leitor->read()) {
    if ($leitor->nodeType === XMLReader::ELEMENT && $leitor->name === 'produto') {
        $produto = new SimpleXMLElement($leitor->readOuterXML());   // apenas um <produto> em memoria por vez
        processar($produto);
    }
}
$leitor->close();
?>
```

O `XMLReader` avança no arquivo um nó de cada vez, sem nunca carregar a árvore inteira: a cada `<produto>` encontrado, apenas esse fragmento é momentaneamente transformado em objeto, processado, e depois liberado na próxima volta.

O mesmo compromisso existe além do PHP: [`xml.etree.ElementTree.iterparse`](https://docs.python.org/3/library/xml.etree.elementtree.html#xml.etree.ElementTree.iterparse) em Python, ou a biblioteca [`sax`](https://www.npmjs.com/package/sax) em Node.js.

> **Armadilha:** carregar um arquivo XML grande com `SimpleXML`/DOM "porque funciona no dev" (um arquivo de teste reduzido), sem ter testado com um volume representativo de produção.
>
> **Boa prática:** assim que um arquivo puder ultrapassar algumas dezenas de megabytes em produção, preferir um parser em streaming (`XMLReader` ou equivalente) ao carregamento completo, mesmo que o código fique um pouco mais verboso.

## Dar visibilidade ao progresso

Um processamento de 20 minutos sem exibição é indistinguível de um programa travado. Exibir o progresso e uma estimativa do tempo restante custa poucas linhas:

```python
def tempo_restante(inicio, feitos, total):
    if feitos < 2:                      # ainda sem ritmo mensuravel
        return ""
    restante = (time.monotonic() - inicio) / feitos * (total - feitos)
    return f" ~{int(restante)}s restantes" if restante < 90 else f" ~{round(restante / 60)} min restantes"
```

Use `time.monotonic()` e não `time.time()`: o segundo pode retroceder (sincronização de relógio, mudança de horário) e produzir durações negativas.

## Nunca ter sucesso pela metade em silêncio

É o ponto mais importante, e o mais fácil de errar. Um processamento longo raramente falha de uma vez só: ele falha **parcialmente**. Uma página em cinquenta não carrega, um elemento falta. Se o programa simplesmente continua, ele produz um resultado incompleto que tem toda a aparência de um resultado completo.

O reflexo perigoso é o `break` ou o `except` silencioso:

```python
try:
    carregar_o_resto()
except Timeout:
    break              # sai com dados parciais, sem sinalizar nada
```

A correção não é impedir a falha (isso é impossível) mas garantir que ela seja **visível**. O método mais confiável é verificar um **invariante** no final: uma propriedade que sempre deve ser verdadeira nesse ponto do programa, qualquer que seja o caminho percorrido até ali (aqui: "o número de elementos obtidos corresponde ao número anunciado"), independentemente da razão da falha:

```python
if total_anunciado is not None and len(carregado) < total_anunciado:
    marcar_incompleto(f"{len(carregado)} elementos de {total_anunciado} anunciados")
```

Essa verificação captura todos os casos, inclusive os que não haviam sido previstos (mudança de layout do site, lentidão incomum). Ela se apoia em um princípio simples: o programa frequentemente sabe **quanto** deveria obter. Comparar o obtido com o esperado é quase sempre possível, e é isso que distingue um resultado confiável de um resultado plausível.

> Em um processamento de várias centenas de unidades, um status explícito do tipo `INCOMPLETO` é mais útil do que uma exceção: ele preserva os dados já coletados enquanto sinaliza que precisam ser retomados. O que é inaceitável é o terceiro caso: incompleto e classificado como `OK`.

## Verificar o conteúdo produzido, não o código de retorno

Os dois bugs mais sérios que encontrei nesse tipo de programa saíram ambos com um **código de retorno 0**: uma extração incompleta classificada como correta, e um relatório final inteiramente vazio depois de mesclar resultados paralelos. Nenhum teste de "isso trava?" os teria detectado.

A lição é direta: para um processamento longo e não supervisionado, teste o **conteúdo** da saída (o número de elementos, a presença das seções esperadas), não apenas o fato de o programa terminar.

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | Um processamento de vários minutos precisa poder retomar depois de uma interrupção (salvamento incremental), ler um arquivo grande aos poucos em vez de carregar tudo, exibir seu progresso, e detectar uma falha parcial em vez de mascará-la silenciosamente. |
| **Ferramentas utilizáveis** | O formato JSON Lines para um salvamento incremental resiliente, um parser em streaming (`XMLReader`, `iterparse`) para um arquivo grande, `time.monotonic()` para uma estimativa de duração confiável, uma verificação de invariante no final do processamento. |
| **Armadilhas a evitar** | Um `except`/`break` silencioso que deixa um resultado parcial sem sinalizá-lo; verificar apenas o código de retorno, não o conteúdo real produzido; carregar um arquivo grande inteiramente em memória sem testá-lo com um volume representativo. |
| **Boas práticas** | Comparar o número de elementos obtidos com o número esperado; separar o arquivo de estado interno (`.parcial`) do entregável final; preferir um parser em streaming assim que um arquivo puder ultrapassar algumas dezenas de megabytes. |
