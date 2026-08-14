---
order: 8
---

# O heap de um runtime gerenciado

O capítulo C sobre [o gerenciamento de memória](/?c=langages-de-programmation&s=c&p=memoire) distingue a stack (automática) do heap (manual, `malloc`/`free`). Um runtime gerenciado (a [JVM](https://docs.oracle.com/en/java/) para Java/[Elasticsearch](https://www.elastic.co/elasticsearch)/[Kafka](https://kafka.apache.org)..., o [CLR](https://learn.microsoft.com/en-us/dotnet/standard/clr) .NET, a engine [V8](https://v8.dev) do Node.js) também tem um heap, mas com um sentido diferente: é **toda a área de memória reservada aos objetos alocados dinamicamente**, gerenciada automaticamente por um coletor de lixo (*garbage collector*) em vez de por chamadas explícitas. O desenvolvedor não o aloca nem o libera ele mesmo; ele só define seu tamanho.

## Um tamanho frequentemente autodetectado, nem sempre adequado

Na falta de indicação explícita, a maioria dos runtimes gerenciados escolhe um tamanho de heap padrão em função da RAM disponível na máquina: uma heurística pensada para um servidor dedicado rodando a plena carga, não para um uso local pontual. A JVM do Elasticsearch, por exemplo, visa por padrão até 50% da RAM do sistema: em uma máquina de 32 GB, isso reserva 16 GB na inicialização, algo que o uso real (uma instância local, poucos dados) não justifica.

Dois efeitos concretos de um heap superdimensionado em relação à necessidade real:

- **Menos RAM para o cache de disco do SO.** Uma engine como o Elasticsearch (baseada no [Lucene](https://lucene.apache.org)) depende enormemente do cache de arquivos do sistema para seu desempenho de leitura: um heap que monopoliza metade da RAM deixa proporcionalmente menos espaço para esse cache, e pode empurrar o sistema para o swap.
- **Um coletor de lixo mais lento para aquecer.** Quanto maior o heap, mais trabalho os primeiros ciclos de coleta de lixo têm para estabelecer suas estatísticas internas: um efeito sentido principalmente na inicialização, antes que o regime de cruzeiro se estabeleça.

## Fixar o tamanho explicitamente

A maioria dos runtimes gerenciados expõe um ajuste explícito para o tamanho do heap (`-Xmx`/`-Xms` para a JVM, por exemplo): limitar esse tamanho ao que o uso real demanda, em vez de deixar a heurística padrão reservar uma fração de toda a RAM disponível, evita os dois efeitos acima. É o que faz um script como `start-elasticsearch.ps1` ao impor 1 GB por padrão (`-HeapSize` para ajustar) em vez dos 16 GB autodetectados: amplamente suficiente para um uso local, e uma inicialização bem mais rápida.

> **Nota:** ao contrário do heap em C, onde um tamanho pequeno demais causa uma falha de alocação imediata e visível (`malloc` retorna `NULL`), um heap gerenciado pequeno demais se traduz mais em ciclos de coleta de lixo mais frequentes, ou até um erro `OutOfMemoryError` se nem a memória liberável for suficiente: uma degradação progressiva em vez de uma falha nítida.

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | Um runtime gerenciado (JVM, CLR, V8) reserva um heap dimensionado automaticamente conforme a RAM disponível, não conforme a necessidade real: frequentemente superdimensionado para um uso local. |
| **Ferramentas utilizáveis** | Ajustes explícitos de tamanho de heap (`-Xmx`/`-Xms` para a JVM). |
| **Armadilhas a evitar** | Deixar a heurística padrão reservar uma grande fração da RAM em uma máquina de desenvolvimento: menos cache de disco, coletor de lixo mais lento para aquecer. |
| **Boas práticas** | Limitar explicitamente o tamanho do heap ao que o uso real demanda, em vez de manter o valor autodetectado. |
