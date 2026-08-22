---
order: 3
---

# Limitar as idas e vindas

Quando dois componentes se comunicam (seu código e um banco de dados, seu código e um navegador, um cliente e um servidor), cada troca tem um **custo fixo** independente da quantidade de dados transportada: serialização, atravessar processos, latência de rede. Esse custo é pequeno (alguns milissegundos), e é justamente isso que o torna perigoso: ele se torna enorme por multiplicação.

## O padrão a reconhecer

O sintoma é sempre o mesmo: um laço que, a cada volta, pede algo de novo ao outro componente.

```python
# 3 idas-e-vindas por anuncio
for i in range(numero_de_cartoes):
    cartao = pagina.elemento(i)       # 1
    link = cartao.atributo("href")    # 2
    texto = cartao.texto()            # 3
```

Sobre 100 elementos, isso dá 300 trocas. A 30 ms por ida-e-volta, chega-se a 9 segundos, para um trabalho que não exige nenhum cálculo.

## Trazer tudo de uma vez

A correção consiste em mover o laço **para o lado onde estão os dados**, e fazer apenas uma única troca:

```python
# 1 ida-e-volta, seja qual for o numero de anuncios
cartoes = pagina.avaliar("""() => Array.from(document.querySelectorAll('article')).map(cartao => ({
    href: cartao.querySelector('a')?.getAttribute('href'),
    texto: cartao.innerText,
}))""")

for cartao in cartoes:                      # processamento local, gratuito
    analisar(cartao["href"], cartao["texto"])
```

O ganho é **proporcional ao volume**: insignificante em 10 elementos, decisivo em 1000. É uma otimização que frequentemente se justifica menos pelo ganho imediato do que pelo fato de eliminar uma inclinação: o programa deixa de ficar mais lento linearmente à medida que os dados crescem.

## É o mesmo problema que o N+1 em banco de dados

Esse padrão tem um nome no mundo dos bancos de dados: o **problema N+1**. Uma consulta para buscar uma lista, depois uma consulta por elemento:

```php
$clientes = $bd->query("SELECT id, nome FROM clientes")->fetchAll();
foreach ($clientes as $cliente) {
    // 1 consulta SQL por cliente: eis o "+N"
    $pedidos = $bd->query("SELECT * FROM pedidos WHERE cliente_id = {$cliente['id']}");
}
```

A correção é estruturalmente idêntica: uma única troca que traz tudo:

```sql
SELECT c.id, c.nome, p.*
FROM clientes c
LEFT JOIN pedidos p ON p.cliente_id = c.id;
```

Veja a seção [SQL](/?c=domain-specific-languages-dsl&p=sql) para os joins, e o capítulo [Conexões](/?c=langages-de-programmation&s=php&p=connexions) de PHP para `PDO`.

> De passagem, escrever uma consulta por elemento concatenando uma variável na string SQL acumula dois problemas: a lentidão **e** a injeção SQL. As consultas preparadas resolvem o segundo, o join resolve o primeiro.

## O mesmo raciocínio em outros lugares

O padrão aparece em toda fronteira a ser atravessada:

- **API HTTP**: privilegiar um endpoint que aceita uma lista de identificadores em vez de chamar *n* vezes o endpoint unitário;
- **Sistema de arquivos**: ler um arquivo de uma vez em vez de caractere por caractere (é o papel dos buffers, veja [Chamadas de sistema e descritores](/?c=langages-de-programmation&s=c&p=appels-systeme-et-descripteurs) em C);
- **DOM**: acumular as modificações e depois aplicá-las, em vez de modificar o documento em um laço: cada escrita pode disparar um recálculo de layout.

## Saber quando não fazer isso

Trazer tudo de uma vez tem um limite: a **memória**. Uma consulta que traz um milhão de linhas de uma vez pode saturar a memória do processo, enquanto o laço ingênuo, esse, aguentava. Entre os dois extremos está o processamento **em lotes**: mil elementos por troca em vez de um único ou um milhão.

```python
for lote in dividir_em_lotes(identificadores, tamanho=1000):
    resultados = servico.recuperar_varios(lote)
```

A pergunta certa não é então "uma única troca ou *n*?" mas "qual o maior lote que posso processar sem risco?".

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | Cada troca entre dois componentes (rede, banco de dados, DOM) tem um custo fixo independente do volume: um laço que pede algo de novo a cada volta ("N+1") multiplica esse custo fixo pelo número de elementos. |
| **Ferramentas utilizáveis** | Trazer todos os dados em uma única troca (join SQL, avaliação agrupada do lado da página), processamento em lotes para volumes muito grandes. |
| **Armadilhas a evitar** | Uma consulta por elemento em um laço (problema N+1); trazer um volume tão grande que satura a memória do processo. |
| **Boas práticas** | Mover o laço para o lado onde estão os dados em vez de fazer idas e vindas repetidas; dividir em lotes de tamanho razoável entre "uma única troca" e "um por elemento". |
