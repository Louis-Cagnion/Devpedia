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

O [`systemd`](https://www.freedesktop.org/software/systemd/man/systemd.html) é o sistema de inicialização usado pela maioria das distribuições Linux modernas (Ubuntu, Debian, Fedora...): é ele quem inicia e supervisiona todos os serviços em segundo plano da máquina; o próprio `cron` faz parte desses serviços nessas distribuições. Em um sistema baseado em `systemd`, os **timers** cobrem a mesma necessidade que uma linha de crontab, com uma configuração mais verbosa, porém mais explícita.

### Dois arquivos em vez de uma linha

O `systemd` configura cada comportamento em uma **unit** (unidade), um arquivo de texto que descreve *o que fazer* ou *quando fazer*. Uma tarefa agendada precisa de duas, ligadas pelo nome do arquivo:

```text
backup.service   ┐
                 ├─ mesmo nome, extensao diferente
backup.timer     ┘
```

O arquivo `.service` descreve o comando a executar:

```ini
[Unit]
Description=Backup noturno dos documentos           # texto exibido nos logs/no status

[Service]
Type=oneshot                                        # executa uma vez e para (nao um servico que fica rodando)
WorkingDirectory=/home/usuario/scripts              # diretorio de trabalho antes de lancar o comando
ExecStart=/usr/bin/python3 backup.py                # caminho absoluto, mesma armadilha do ambiente minimo que o cron
```

O arquivo `.timer` descreve quando disparar o serviço de mesmo nome:

```ini
[Unit]
Description=Agenda backup.service todos os dias

[Timer]
OnCalendar=daily                                    # equivalente a @daily no cron
Persistent=true                                     # recupera a execucao perdida se a maquina estava desligada (ver abaixo)

[Install]
WantedBy=timers.target                              # necessario para que "enable" ative de fato o timer
```

Os dois arquivos vão em `/etc/systemd/system/` (escopo do sistema, exige permissão de root) ou em `~/.config/systemd/user/` (escopo do usuário, ver abaixo). Uma vez colocados:

```bash
systemctl daemon-reload              # rele os arquivos de unidade apos criar/editar um
systemctl enable --now backup.timer  # ativa o timer no boot E o inicia imediatamente
systemctl list-timers                # lista os timers ativos e sua proxima execucao
journalctl -u backup.service         # consulta os logs desse servico (substitui o redirecionamento manual para um arquivo de log)
```

### `Persistent=true`: a recuperação não é automática

Esse é o detalhe mais importante a lembrar: sem `Persistent=true`, um timer se comporta exatamente como o `cron`: se a máquina está desligada no momento previsto (ex. `OnCalendar=daily` à meia-noite em um notebook desligado durante a noite), a execução é simplesmente perdida, não recuperada. `Persistent=true` muda isso: o `systemd` registra em disco a data da última execução, e se o timer descobre, na próxima inicialização, que um prazo foi perdido, ele dispara a execução imediatamente em vez de esperar o próximo horário planejado.

| | Apenas `OnCalendar` | `OnCalendar` + `Persistent=true` |
|---|---|---|
| Máquina ligada na hora prevista | Executa na hora prevista | Executa na hora prevista |
| Máquina desligada na hora prevista | Execução perdida (como o `cron`) | Executa na próxima inicialização do timer |

### Escopo de sistema ou de usuário (`--user`)

Um timer colocado em `/etc/systemd/system/` roda independentemente de qualquer sessão aberta, mas exige root para ser criado. Um timer colocado em `~/.config/systemd/user/` não exige permissões especiais, mas depende de uma instância do `systemd` própria do usuário (comandos com o prefixo `--user`: `systemctl --user enable --now ...`): instância que, por padrão, só inicia quando esse usuário abre uma sessão, e para quando ela termina.

Esse último ponto importa para a recuperação: um timer `--user` com `Persistent=true` só consegue recuperar uma execução perdida no próximo login, não na simples inicialização da máquina, se ninguém fizer login logo em seguida. O [`loginctl`](https://www.freedesktop.org/software/systemd/man/loginctl.html) permite remover esse limite para um usuário específico:

```bash
loginctl enable-linger usuario   # a instancia systemd --user de "usuario" inicia no boot, com sessao aberta ou nao
```

### `cron` ou `systemd timer`?

| | `cron` | `systemd timer` |
|---|---|---|
| Recuperação se a máquina estava desligada | Não | Sim, com `Persistent=true` |
| Log | Email (raramente configurado) ou redirecionamento manual | Integrado (`journalctl`) |
| Dependências entre tarefas | Não gerenciadas nativamente | Sim (uma unit pode depender de outra) |
| Configuração | Uma linha no crontab | Dois arquivos por tarefa |
| Escopo de usuário sem root | Sim, nativamente | Sim, via `--user` (+ `loginctl enable-linger` para rodar fora de sessão) |

O `cron` continua amplamente suficiente para um uso pessoal ou pontual sem necessidade de recuperação; os timers do `systemd` se tornam preferíveis assim que uma execução perdida precisa ser recuperada automaticamente, ou em ambientes de servidor modernos que já se apoiam no `systemd` para tudo o mais.

---

## 📋 Recapitulando

| | |
|---|---|
| **Para lembrar** | `cron` executa comandos em intervalos regulares definidos em um crontab (5 campos de tempo). Ele roda em um ambiente mínimo (sem `.bashrc`, `PATH` reduzido): bem diferente de um terminal aberto manualmente. Os timers do `systemd` cobrem a mesma necessidade com a capacidade de recuperar execuções perdidas. |
| **Ferramentas utilizáveis** | `crontab -e`/`-l`, strings especiais (`@daily`, `@reboot`...), `flock` para evitar execuções concorrentes; `.service`/`.timer` + `systemctl (--user) enable --now` + `journalctl` do lado do `systemd`. |
| **Armadilhas a evitar** | Supor que o `PATH`/o ambiente do cron é idêntico ao de um terminal interativo; deixar uma tarefa falhar silenciosamente sem redirecionamento de saída; achar que um `.timer` recupera automaticamente uma execução perdida sem `Persistent=true`; esquecer que um timer `--user` só roda durante uma sessão aberta, a menos que `loginctl enable-linger` esteja ativo. |
| **Boas práticas** | Usar caminhos absolutos em um comando cron; redirecionar sistematicamente a saída para um arquivo de log; adicionar `Persistent=true` a todo `.timer` onde a recuperação for necessária. |
