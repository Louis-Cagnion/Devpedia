---
order: 7
---

# Evitar o recálculo redundante

Um princípio mais geral se esconde atrás de [esperar uma condição em vez de uma duração](/?c=performance&p=attentes-et-temps-morts): **nunca recalcular um resultado que nada pôde mudar desde seu último cálculo**. Onde o capítulo anterior tratava da espera (do tempo que passa), este trata do cálculo (do processador e da memória que trabalham): a mesma preguiça disciplinada, aplicada a outro tipo de custo.

## Memoizar o resultado de uma função

O caso mais direto: uma função custosa, chamada várias vezes com os mesmos argumentos, que refaz o mesmo trabalho a cada chamada.

```python
def nota_de_credito(cliente_id):
    # consulta pesada: agrega o historico, calcula um score
    return calcular_score(recuperar_historico(cliente_id))

# chamada 3 vezes para o mesmo cliente no mesmo processamento
for pedido in pedidos_do_cliente:
    if nota_de_credito(cliente_id) < limite:
        recusar(pedido)
```

Nada muda `cliente_id` nem seu histórico entre essas três chamadas: a segunda e a terceira recalculam exatamente o que a primeira já produziu.

```python
_cache_notas = {}

def nota_de_credito(cliente_id):
    if cliente_id not in _cache_notas:
        _cache_notas[cliente_id] = calcular_score(recuperar_historico(cliente_id))
    return _cache_notas[cliente_id]
```

A **memoização** guarda em memória o resultado para uma entrada dada e o reutiliza enquanto nada pode invalidá-lo. A condição que garante sua correção não é "é mais rápido", é "a entrada não mudou": exatamente o mesmo invariante já tratado no capítulo anterior sobre o banner de cookies, aplicado aqui a um valor em vez de a um estado de exibição.

> Uma memoização sem invalidação é um bug em suspensão: se `cliente_id` pode ter seu histórico modificado durante o processamento (um pagamento que chega entre dois pedidos), o cache retorna uma resposta vencida. Memoizar é primeiro identificar o que tornaria o resultado obsoleto, antes de decidir mantê-lo.

## Recalcular apenas o que mudou

O mesmo princípio se aplica na escala de um processamento inteiro, não apenas de uma chamada de função. Se apenas uma parte dos dados mudou desde a última passagem, reprocessar tudo equivale a refazer todo o trabalho já validado só para modificar um fragmento.

```python
# a cada execucao: reprocessa as 50.000 linhas do arquivo
for linha in todo_o_arquivo:
    resultados.append(processar(linha))
```

```python
# so reprocessa o que chegou desde a ultima passagem
ultimo_marcador = ler_marca_de_progresso()
novas_linhas = [l for l in todo_o_arquivo if l.timestamp > ultimo_marcador]

for linha in novas_linhas:
    resultados.append(processar(linha))

escrever_marca_de_progresso(novas_linhas[-1].timestamp if novas_linhas else ultimo_marcador)
```

O custo do processamento passa a ser proporcional ao que **mudou**, não ao tamanho total dos dados: um ganho que se acentua à medida que o volume já processado cresce em relação ao volume realmente novo.

## O exemplo do jogo 2D: redesenhar apenas o que se move

Um jogo 2D que gerencia ele mesmo sua memória de exibição (um array de pixels ou de tiles em memória, sem delegar a uma engine de renderização que já otimiza isso) ilustra bem o princípio na escala de uma imagem inteira.

```python
# a cada tick: redesenha toda a imagem, mesmo se so um personagem se moveu
def desenhar_frame(tela, cena):
    for x in range(tela.largura):
        for y in range(tela.altura):
            tela.definir_pixel(x, y, cena.cor_em(x, y))
```

Se um tick só move um personagem em alguns pixels, o resto do cenário é idêntico pixel a pixel ao frame anterior: recalculá-lo não muda nada no resultado, apenas no tempo gasto para obtê-lo.

```python
# so redesenha os retangulos marcados como "sujos" (modificados desde o ultimo tick)
def desenhar_frame(tela, cena, zonas_modificadas):
    for zona in zonas_modificadas:
        for x, y in zona.pixels():
            tela.definir_pixel(x, y, cena.cor_em(x, y))
```

É a lógica do **dirty rectangle** (retângulo sujo): a própria cena sinaliza quais zonas mudaram desde a última renderização, e só essas são redesenhadas. Em um cenário 90% estático, isso reduz o custo de cada frame a uma fração do de uma renderização completa, para um resultado visualmente idêntico.

## Um exemplo tirado de um scraper: não confirmar o que já está provado

Um scraper de anúncios classificados comparava dois anúncios para saber se descreviam o mesmo veículo (duplicata) ou dois veículos diferentes. A verificação completa abria a página detalhada de cada anúncio para comparar cerca de dez características (quilometragem, opcionais, histórico de manutenção): uma chamada de rede e um tempo de renderização não desprezíveis.

```python
def sao_potencialmente_duplicados(anuncio_a, anuncio_b):
    # tudo ja esta disponivel nos cartoes da pagina de resultados
    return (
        anuncio_a.marca == anuncio_b.marca
        and anuncio_a.modelo == anuncio_b.modelo
        and abs(anuncio_a.preco - anuncio_b.preco) < 200
    )

def sao_duplicados(anuncio_a, anuncio_b):
    if not sao_potencialmente_duplicados(anuncio_a, anuncio_b):
        return False    # ja decidido: marca ou modelo diferente, ou preco muito distante
    detalhe_a = abrir_pagina_anuncio(anuncio_a)
    detalhe_b = abrir_pagina_anuncio(anuncio_b)
    return comparar_especificacoes(detalhe_a, detalhe_b)
```

Assim que a comparação "leve" (os campos já presentes no cartão de resultados) estabelece que dois anúncios são diferentes, a questão **já está resolvida**: abrir as duas páginas detalhadas para confirmar isso só recalcularia, a preço alto, um resultado que o dado barato já produziu. A verificação custosa só roda no caso ambíguo, aquele em que o dado leve não basta para decidir.

> Não confundir com uma otimização da **latência de rede**. Aqui, o que se evita é um trabalho redundante do lado CPU/lógica (recalcular uma resposta já conhecida), não um atraso de E/S. As pausas voluntárias entre requisições (limite de taxa, cortesia com um servidor remoto) ou a espera de uma animação de interface não fazem parte desse princípio: continuam necessárias mesmo quando nenhum recálculo está em jogo, e removê-las expõe a um bloqueio, não a uma simples lentidão. É exatamente a distinção colocada no final de [Esperar sem perder tempo](/?c=performance&p=attentes-et-temps-morts): um atraso de proteção não é um desperdício a eliminar.

## Recapitulando

| Situação | Sem o princípio | Com o princípio |
|---|---|---|
| Função pura chamada várias vezes com a mesma entrada | Recalcula a cada chamada | Memoiza o resultado, invalida se a entrada mudar |
| Processamento periódico sobre dados majoritariamente estáveis | Reprocessa tudo a cada passagem | Só reprocessa o que mudou desde a marca de progresso |
| Renderização de um frame de jogo | Redesenha toda a tela a cada tick | Só redesenha as zonas marcadas como modificadas |
| Comparação de dois registros | Abre sistematicamente o detalhe custoso | Para assim que um dado leve já decidiu |

Nos quatro casos, o ganho não vem de um cálculo tornado mais rápido, mas de um cálculo **que não aconteceu** porque nada podia mudar seu resultado.

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | Nunca recalcular um resultado que nada pôde mudar desde seu último cálculo: memoização, reprocessamento incremental, ou dirty rectangle aplicam todos a mesma ideia em escalas diferentes. |
| **Ferramentas utilizáveis** | Um cache em memória por entrada (memoização), uma marca de progresso para só reprocessar o novo, uma comparação "leve" antes de uma verificação custosa. |
| **Armadilhas a evitar** | Memoizar sem identificar o que invalidaria o resultado: um cache nunca invalidado se torna uma fonte de dados vencidos. |
| **Boas práticas** | Sempre definir a condição de invalidação antes de memoizar; distinguir um recálculo evitável (este princípio) de uma pausa voluntária de proteção (a manter). |
