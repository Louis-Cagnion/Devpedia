---
order: 7
---

# Evitar o recálculo redundante

Um princípio mais geral se esconde atrás de [esperar uma condição em vez de uma duração](/?c=performance&p=attentes-et-temps-morts): **nunca recalcular um resultado que nada pôde mudar desde seu último cálculo**. Onde o capítulo anterior tratava da espera (do tempo que passa), este trata do cálculo (do processador e da memória que trabalham): a mesma preguiça disciplinada, aplicada a outro tipo de custo.

## Memoizar o resultado de uma função

O caso mais direto: uma função custosa, chamada várias vezes com os mesmos argumentos, que refaz o mesmo trabalho a cada chamada.

```python
def nota_de_credito(cliente_id):
    # consulta pesada: agrega o histórico, calcula um score
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
# a cada execução: reprocessa as 50.000 linhas do arquivo
for linha in todo_o_arquivo:
    resultados.append(processar(linha))
```

```python
# só reprocessa o que chegou desde a última passagem
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
# a cada tick: redesenha toda a imagem, mesmo se só um personagem se moveu
def desenhar_frame(tela, cena):
    for x in range(tela.largura):
        for y in range(tela.altura):
            tela.definir_pixel(x, y, cena.cor_em(x, y))
```

Se um tick só move um personagem em alguns pixels, o resto do cenário é idêntico pixel a pixel ao frame anterior: recalculá-lo não muda nada no resultado, apenas no tempo gasto para obtê-lo.

```python
# só redesenha os retangulos marcados como "sujos" (modificados desde o último tick)
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
    # tudo já está disponível nos cartões da página de resultados
    return (
        anuncio_a.marca == anuncio_b.marca
        and anuncio_a.modelo == anuncio_b.modelo
        and abs(anuncio_a.preco - anuncio_b.preco) < 200
    )

def sao_duplicados(anuncio_a, anuncio_b):
    if not sao_potencialmente_duplicados(anuncio_a, anuncio_b):
        return False    # já decidido: marca ou modelo diferente, ou preco muito distante
    detalhe_a = abrir_pagina_anuncio(anuncio_a)
    detalhe_b = abrir_pagina_anuncio(anuncio_b)
    return comparar_especificacoes(detalhe_a, detalhe_b)
```

Assim que a comparação "leve" (os campos já presentes no cartão de resultados) estabelece que dois anúncios são diferentes, a questão **já está resolvida**: abrir as duas páginas detalhadas para confirmar isso só recalcularia, a preço alto, um resultado que o dado barato já produziu. A verificação custosa só roda no caso ambíguo, aquele em que o dado leve não basta para decidir.

> Não confundir com uma otimização da **latência de rede**. Aqui, o que se evita é um trabalho redundante do lado CPU/lógica (recalcular uma resposta já conhecida), não um atraso de E/S. As pausas voluntárias entre requisições (limite de taxa, cortesia com um servidor remoto) ou a espera de uma animação de interface não fazem parte desse princípio: continuam necessárias mesmo quando nenhum recálculo está em jogo, e removê-las expõe a um bloqueio, não a uma simples lentidão. É exatamente a distinção colocada no final de [Esperar sem perder tempo](/?c=performance&p=attentes-et-temps-morts): um atraso de proteção não é um desperdício a eliminar.

## Escrita atômica: nunca uma leitura pela metade

Um cache memoizado em memória (seção anterior) desaparece quando o processo para; um **cache de arquivo** sobrevive a uma reinicialização, mas introduz um risco novo: um leitor concorrente pode abrir o arquivo de cache **enquanto ele ainda está sendo escrito**.

```python
# Risco: um leitor concorrente pode ler este arquivo pela metade
with open("cache.json", "w") as f:
    json.dump(resultado, f)   # se o processo for interrompido aqui, o arquivo fica corrompido
```

```python
# Escrita atômica: escrever em um arquivo temporário, depois renomea-lo
import os

caminho_tmp = "cache.json.tmp"
with open(caminho_tmp, "w") as f:
    json.dump(resultado, f)
os.replace(caminho_tmp, "cache.json")   # rename(): atômico no nível do sistema de arquivos
```

`os.replace()` (como `rename()` na maioria das linguagens) é **atômico** no nível do sistema de arquivos: a qualquer momento, `cache.json` aponta para a versão antiga completa ou para a nova versão completa, nunca para um estado intermediário. Nenhum leitor concorrente pode então jamais ver um arquivo pela metade, ao contrário de uma escrita direta interrompida no meio do caminho.

> **Armadilha:** escrever diretamente no arquivo de cache final, assumindo que uma interrupção (travamento, queda de energia) é rara o suficiente para ignorar. Um arquivo de cache corrompido pode então derrubar todos os leitores seguintes, muito depois do incidente inicial.
>
> **Boa prática:** sempre escrever em um arquivo temporário e depois renomeá-lo para o nome final, para qualquer arquivo lido por outro processo enquanto ele puder ser reescrito.

## Stale-while-revalidate: responder na hora, recalcular por trás

A memoização vista acima tem um defeito em grande escala: se o cache está vazio ou vencido, a requisição que dispara o recálculo **espera** por esse recálculo antes de responder. O padrão **stale-while-revalidate** (emprestado do cabeçalho HTTP [`Cache-Control: stale-while-revalidate`](https://developer.mozilla.org/docs/Web/HTTP/Headers/Cache-Control#stale-while-revalidate)) muda essa regra: responder **imediatamente** com o valor em cache, mesmo vencido, e só recalcular em segundo plano.

```text
Cache classico (bloqueante):        Stale-while-revalidate:

requisicao -> cache vencido?        requisicao -> cache vencido?
              |  sim                               |  sim
              v                                    v
        recalcula (espera)                  responde com o valor vencido
              |                              E dispara um recalculo em segundo plano
              v                                    |
          responde                           (a proxima chamada recebe o
                                              valor atualizado)
```

```python
trava_recalculo = threading.Lock()

def valor_com_cache(chave):
    entrada = cache.get(chave)
    if entrada is None:
        # primeira chamada: não há escolha a não ser esperar
        return recalcular_e_guardar(chave)

    if entrada.esta_vencida() and trava_recalculo.acquire(blocking=False):
        threading.Thread(target=lambda: recalcular_e_guardar(chave, trava_recalculo)).start()

    return entrada.valor   # responde imediatamente, vencido ou não
```

A trava anti-concorrência (`trava_recalculo`) evita que um recálculo custoso seja disparado N vezes em paralelo enquanto já está em andamento para a mesma chave: só a primeira thread a adquiri-la dispara de fato o recálculo, as outras continuam servindo o valor vencido enquanto isso.

> **Armadilha:** aplicar stale-while-revalidate sem trava anti-concorrência, em uma chave sujeita a muitas requisições simultâneas: cada requisição que detecta o cache vencido dispara seu próprio recálculo custoso, o que pode anular todo o benefício (ou até agravar a carga em relação a um cache bloqueante clássico).
>
> **Boa prática:** nunca deixar um cache vencido fazer o usuário esperar por uma simples atualização; reservar a espera apenas para a primeira chamada, sem nenhum valor em cache.

## Streaming HTTP progressivo: quando o cálculo é inevitável

Todas as técnicas anteriores evitam um recálculo evitável. Esta se aplica ao caso contrário: um cálculo realmente **inevitável** (importar um arquivo grande, chamar um serviço externo lento) que nenhum cache pode encurtar. A única alavanca que resta é como o usuário percebe a espera.

Por padrão, um servidor PHP mantém na memória tudo o que um script produz com `echo`, e só envia ao navegador quando o script termina (ou seu buffer enche): o usuário vê uma página branca até o fim, mesmo que o script já tenha produzido um resultado útil há bastante tempo.

```php
<?php
ini_set('output_buffering', 'off');   // desativa o armazenamento em buffer da saída
ini_set('implicit_flush', true);      // força o envio imediato após cada echo
while (ob_get_level() > 0) {
    // também esvazia qualquer buffer já aberto pelo próprio PHP
    ob_end_flush();
}

foreach ($linhasAImportar as $linha) {
    importarLinha($linha);
    echo "Linha importada: {$linha->id}<br>\n";
    flush();                          // envia esse echo ao navegador imediatamente
}
```

Cada `echo` seguido de `flush()` vai para o navegador imediatamente, sem esperar o script terminar: o usuário vê uma console se enchendo em tempo real, como os logs de um terminal, em vez de uma página branca seguida de um resultado final de uma vez só.

> **Nota:** esse mecanismo é o inverso de [`fastcgi_finish_request()`](/?c=langages&s=php&p=php-fpm): lá, a conexão fecha imediatamente e o trabalho continua escondido por trás; aqui, a conexão fica aberta durante todo o cálculo, o que é justamente o que permite enviar cada pedaço do resultado conforme fica disponível.

> **Armadilha:** esse streaming quebra assim que um servidor intermediário (proxy, load balancer, Nginx em modo `fastcgi_buffering`) coloca seu próprio buffer de volta: verificar a configuração de toda a cadeia de rede, não só a do PHP.

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
| **Para lembrar** | Nunca recalcular um resultado que nada pôde mudar desde seu último cálculo: memoização, reprocessamento incremental, ou dirty rectangle aplicam todos a mesma ideia em escalas diferentes. Um cache de arquivo acrescenta duas técnicas: a escrita atômica (nunca uma leitura pela metade) e o stale-while-revalidate (responder rápido, recalcular por trás). Quando o cálculo é inevitável (nada para colocar em cache), o streaming HTTP progressivo é a única alavanca que resta para melhorar a espera percebida. |
| **Ferramentas utilizáveis** | Um cache em memória por entrada (memoização), uma marca de progresso para só reprocessar o novo, uma comparação "leve" antes de uma verificação custosa, `rename()`/`os.replace()` para uma escrita atômica, uma trava anti-concorrência para um recálculo em segundo plano, `flush()`/`ob_end_flush()` para um streaming HTTP progressivo. |
| **Armadilhas a evitar** | Memoizar sem identificar o que invalidaria o resultado: um cache nunca invalidado se torna uma fonte de dados vencidos. Escrever diretamente em um arquivo de cache lido por outros processos. Aplicar stale-while-revalidate sem trava anti-concorrência. Fazer streaming de uma resposta HTTP sem checar que nenhum proxy intermediário coloca seu próprio buffer de volta. |
| **Boas práticas** | Sempre definir a condição de invalidação antes de memoizar; distinguir um recálculo evitável (este princípio) de uma pausa voluntária de proteção (a manter); escrever um arquivo de cache por meio de um arquivo temporário renomeado; só fazer o usuário esperar na primeira chamada sem cache; fazer streaming da resposta HTTP assim que um cálculo longo e inevitável produzir resultados progressivamente. |
