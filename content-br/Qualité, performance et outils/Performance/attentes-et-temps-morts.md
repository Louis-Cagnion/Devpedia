---
order: 2
---

# Esperar sem perder tempo

Em um programa que dialoga com o exterior (rede, navegador, disco), a maior parte do tempo não é cálculo: é espera. E uma espera mal escrita custa tempo até quando não há nada para esperar.

## O problema do atraso fixo

O reflexo mais comum é colocar uma pausa "longa o suficiente para funcionar":

```python
pagina.clicar("Proxima pagina")
time.sleep(2)              # esperamos que 2s bastem
ler_os_resultados()
```

Esse código tem dois defeitos opostos, e é isso que o torna traiçoeiro:

- se a página responde em 300 ms, **desperdiça-se 1,7s** a cada chamada;
- se ela demora 2,5s (rede carregada, página volumosa), lê-se **cedo demais** e o resultado fica incompleto: um bug intermitente, muito penoso de diagnosticar.

Um atraso fixo é uma aposta em uma duração que não se controla. Ele é ou longo demais, ou curto demais, e geralmente os dois dependendo do dia.

## Esperar uma condição, não uma duração

A formulação correta é: *esperar que o resultado esteja lá*, com um teto de segurança para não bloquear indefinidamente.

```python
def esperar_ate(condicao, timeout_s=5, intervalo_ms=150):
    """Espera que condicao() seja verdadeira. Retorna False se o prazo for excedido."""
    for _ in range(int(timeout_s * 1000 / intervalo_ms)):
        if condicao():
            return True
        dormir(intervalo_ms)
    return False
```

No uso:

```python
numero_antes = contar_resultados()
pagina.clicar("Proxima pagina")

if not esperar_ate(lambda: contar_resultados() > numero_antes):
    raise RuntimeError("A proxima pagina nunca carregou")
```

Retoma-se assim que o conteúdo está pronto (portanto em 300 ms quando a página é rápida) enquanto se permanece correto quando ela é lenta. O teto deixa de servir como tempo de espera, e passa a servir como detecção de falha.

> Note que a condição é sobre uma **mudança** (`> numero_antes`) e não sobre uma presença. Se simplesmente se esperasse "há resultados?", a condição já seria verdadeira com os resultados da página anterior, e se leriam os dados antigos acreditando ler os novos.

## Não vigiar o que não vai vir

O caso mais custoso é a espera de um evento **opcional**. Procurar um banner de cookies por 2 segundos custa 2 segundos inteiros toda vez que ele não existe: ou seja, quase sempre, uma vez o consentimento registrado.

Duas defesas se combinam:

**Memoizar o que não pode mais mudar.** A **memoização** consiste em manter em memória o resultado de uma verificação custosa para nunca mais refazê-la a partir do momento em que a resposta não pode mais mudar. Uma vez o consentimento resolvido para um site, nenhum banner reaparecerá em suas outras páginas: inútil verificar a cada navegação.

```python
def fechar_banner(pagina, sites_ja_tratados):
    site = dominio_de(pagina.url)
    if site in sites_ja_tratados:
        return                      # ja resolvido: nao se perde 2s reverificando
    sites_ja_tratados.add(site)
    ...
```

**Consultar uma fonte autoritativa em vez de sondar.** Em vez de vigiar o surgimento de um banner, pode-se perguntar diretamente se o consentimento já existe: aqui, a presença de um cookie:

```python
def consentimento_ja_dado(pagina):
    return any("consent" in c["name"].lower() for c in pagina.cookies())
```

Se sim, uma única verificação imediata basta; se não, mantém-se a vigilância completa. O comportamento continua correto nos dois casos, sem aposta no tempo de aparição.

Essas duas mudanças eliminaram 12,8 dos 25 segundos do programa citado como exemplo, sem modificar uma única requisição enviada: era espera puramente local.

## Manter uma pausa quando ela tem um papel

Cuidado para não remover as pausas **úteis**. Diante de um serviço remoto, um espaçamento voluntário entre as requisições protege contra uma limitação de taxa ou um bloqueio. A distinção a fazer:

| Tipo de pausa | Remover? |
|---|---|
| Esperar uma duração arbitrária "por precaução" | Sim, substituir por uma condição |
| Reverificar uma informação que não pode mudar | Sim, memoizar |
| Espaçar voluntariamente requisições para um mesmo serviço | **Não**, é uma proteção |

Uma pausa de cortesia não é uma ineficiência: é uma restrição de projeto. Removê-la não torna o programa melhor, apenas desloca o problema para uma falha mais difícil de diagnosticar.

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | Um atraso fixo ("`sleep(2)`") é sempre longo demais (tempo desperdiçado) ou curto demais (bug intermitente): esperar uma condição com um teto de segurança resolve os dois problemas ao mesmo tempo. |
| **Ferramentas utilizáveis** | Uma função genérica "esperar até" (condição + timeout), a memoização para não reverificar mais o que não pode mudar. |
| **Armadilhas a evitar** | Vigiar um evento opcional a cada iteração (um banner de cookies) sem memorizar que ele não vai mais reaparecer. |
| **Boas práticas** | Consultar uma fonte autoritativa (um cookie) em vez de sondar uma exibição; manter as pausas voluntárias que protegem contra uma limitação de taxa. |
