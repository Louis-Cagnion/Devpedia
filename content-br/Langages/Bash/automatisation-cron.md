---
order: 14
---

# Automatizar tarefas com cron

`cron` é um serviço que roda permanentemente em segundo plano (um **daemon**) e executa comandos em intervalos regulares, definidos antecipadamente: backups noturnos, limpeza de arquivos temporários, envio de relatórios periódicos.

## O arquivo crontab

Cada usuário tem seu próprio **crontab**, uma lista de tarefas agendadas, editada com:

```bash
crontab -e  # abre o crontab no editor padrao
crontab -l  # exibe o crontab atual sem abri-lo
crontab -r  # remove todo o crontab do usuario atual
```

Cada linha segue um formato de 5 campos de tempo, seguidos do comando a executar:

```text
┌───────────── minuto (0-59)
│ ┌─────────── hora (0-23)
│ │ ┌───────── dia do mes (1-31)
│ │ │ ┌─────── mes (1-12)
│ │ │ │ ┌───── dia da semana (0-6, 0 = domingo)
│ │ │ │ │
* * * * *  comando_a_executar
```

```bash
0 3 * * *        /home/usuario/scripts/backup.sh          # todos os dias as 3h00
*/15 * * * *      /home/usuario/scripts/verificar-espaco.sh  # a cada 15 minutos
0 9 * * 1          /home/usuario/scripts/relatorio-semanal.sh  # toda segunda as 9h00
0 0 1 * *          /home/usuario/scripts/limpar-logs.sh    # todo dia 1 do mes, a meia-noite
```

Um `*` significa "para todo valor possível desse campo"; `*/15` no campo dos minutos significa "a cada 15 minutos" (0, 15, 30, 45).

## Strings especiais

Para agendas comuns, atalhos evitam contar os campos:

| String | Equivalente |
|---|---|
| `@reboot` | Executada uma vez, na inicialização do sistema |
| `@hourly` | `0 * * * *` |
| `@daily` | `0 0 * * *` |
| `@weekly` | `0 0 * * 0` |
| `@monthly` | `0 0 1 * *` |
| `@yearly` | `0 0 1 1 *` |

```bash
@reboot   /home/usuario/scripts/inicializar-cache.sh
@daily     /home/usuario/scripts/backup.sh
```

## A armadilha do ambiente mínimo

Um comando lançado pelo cron não executa no mesmo contexto que um terminal aberto manualmente: o cron inicia um shell **não interativo**, que não carrega `.bashrc` nem `.bash_profile`, e seu [`PATH`](/?c=shells&s=bash&p=variables-denvironnement) fica reduzido a alguns diretórios básicos do sistema, frequentemente sem `/usr/local/bin`, onde muitas ferramentas instaladas manualmente se encontram.

Um script que funciona perfeitamente quando lançado manualmente pode então falhar silenciosamente sob o cron, com um erro `command not found` invisível já que nada exibe essa saída por padrão (cf. seção seguinte). Duas precauções sistemáticas:

```bash
# Evitar: supoe que "python3" esta no PATH do cron
0 3 * * *   python3 backup.py

# Mais seguro: caminho absoluto para o executavel E o script
0 3 * * *   /usr/bin/python3 /home/usuario/scripts/backup.py
```

Se uma variável de ambiente precisa é necessária (uma chave de API, por exemplo), ela precisa ser definida explicitamente no início do crontab ou no próprio script: o ambiente do shell interativo habitual não existe aqui.

## Nunca deixar uma tarefa cron falhar em silêncio

Por padrão, a saída de um comando cron (se ele produzir alguma) é enviada por email ao usuário local (raramente configurado, portanto geralmente perdida). Redirecionar explicitamente para um arquivo de log (veja [Redirecionamentos e pipes](/?c=shells&s=bash&p=redirections-et-pipes)) torna a execução rastreável:

```bash
0 3 * * *   /home/usuario/scripts/backup.sh >> /var/log/backup.log 2>&1
```

Uma tarefa cron que falha sem que ninguém perceba é uma falha silenciosa: uma das armadilhas mais custosas em automação, já que o problema só é descoberto quando sua ausência de resultado se torna ela mesma um incidente (um backup que na verdade nunca rodou por meses). Um comando de reserva depois de um `||` (veja [Redirecionamentos e pipes](/?c=shells&s=bash&p=redirections-et-pipes) para o encadeamento de comandos), ou um serviço de monitoramento externo notificado em caso de falha, transforma esse silêncio em sinal explícito.

## Evitar execuções concorrentes com `flock`

Se uma tarefa pode durar mais tempo que o intervalo que a relança (ex. a cada 5 minutos, mas uma execução que às vezes leva 8 minutos), duas instâncias podem se sobrepor. `flock` garante que apenas uma instância roda por vez, se apoiando em um lock (arquivo) em vez de em uma suposição de duração:

```bash
*/5 * * * *   flock -n /tmp/backup.lock /home/usuario/scripts/backup.sh
```

`-n` (*non-blocking*) faz uma nova tentativa falhar imediatamente se o lock já está ocupado, em vez de empilhar execuções em espera.

## `systemd timers`, uma alternativa em sistemas baseados em systemd

Nas distribuições que usam `systemd`, os **timers** cobrem a mesma necessidade com, além disso, dependências explícitas entre serviços, um log melhor (integrado ao `journalctl`), e uma execução garantida mesmo se a máquina estava desligada no momento previsto. Mais verbosos de configurar do que uma simples linha de crontab, eles são preferidos em ambientes de servidor modernos por essa razão; o `cron` continua amplamente suficiente para um uso pessoal ou pontual.

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | `cron` executa comandos em intervalos regulares definidos em um crontab (5 campos de tempo). Ele roda em um ambiente mínimo (sem `.bashrc`, `PATH` reduzido): bem diferente de um terminal aberto manualmente. |
| **Ferramentas utilizáveis** | `crontab -e`/`-l`, strings especiais (`@daily`, `@reboot`...), `flock` para evitar execuções concorrentes. |
| **Armadilhas a evitar** | Supor que o `PATH`/o ambiente do cron é idêntico ao de um terminal interativo; deixar uma tarefa falhar silenciosamente sem redirecionamento de saída. |
| **Boas práticas** | Usar caminhos absolutos em um comando cron; redirecionar sistematicamente a saída para um arquivo de log. |
