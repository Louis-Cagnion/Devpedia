---
order: 6
---

# Ler o estado do sistema

Administrar um servidor supõe poder responder a qualquer momento a perguntas simples: quanta memória ainda está livre? O disco está perto da saturação? Quem está conectado agora? Este capítulo mostra onde encontrar essas informações; a difusão automática delas (por exemplo, uma mensagem enviada a cada 10 minutos) é responsabilidade da [automatização com cron](/?c=shells&s=bash&p=automatisation-cron), já tratada separadamente.

## `/proc`: o sistema de arquivos que não existe de verdade

No Linux, `/proc` é um **sistema de arquivos virtual**: seus arquivos não existem em nenhum disco, o kernel os gera na hora, a cada leitura, para expor seu estado interno (processos, memória, hardware detectado). Lê-lo funciona exatamente como ler um arquivo comum (`cat`, `grep`, redirecionamentos), mas seu conteúdo reflete o estado do sistema **no instante exato** da leitura, nunca um valor guardado em cache.

```bash
cat /proc/loadavg
# 0.15 0.10 0.05 1/523 12345
```

## Onde encontrar cada informação

| Informação | Comando dedicado | Arquivo `/proc` equivalente |
|---|---|---|
| Arquitetura e kernel | `uname -a` | `/proc/version` |
| Número de CPUs físicas | `lscpu` | `/proc/cpuinfo` (contar os `physical id` distintos) |
| Número de CPUs virtuais (vCPU) | `nproc` | `/proc/cpuinfo` (contar as entradas `processor`) |
| Memória utilizada (%) | `free -m` | `/proc/meminfo` (`MemTotal` / `MemAvailable`) |
| Espaço em disco utilizado (%) | `df -h` | - (informação gerenciada pelo sistema de arquivos montado, não por `/proc`) |
| Carga da CPU | `uptime` | `/proc/loadavg` |
| Data da última reinicialização | `who -b` ou `uptime -s` | `/proc/uptime` (segundos decorridos desde a inicialização) |
| Estado do LVM | `lvs` / `vgs` / `pvs` (ver [Particionamento e LVM](/?c=administration-systeme&p=partitionnement-et-lvm)) | - |
| Conexões ativas | `ss -t` | `/proc/net/tcp` |
| Usuários conectados | `who` ou `w` | - |
| Endereço IPv4 e MAC | `ip addr` | `/proc/net/dev` (lista as interfaces, sem seus endereços) |

> **Nota:** existem duas maneiras de obter a mesma informação: um comando dedicado (`free`, `df`, `uptime`...), pensado para ser lido diretamente, ou o arquivo `/proc` correspondente, a ser interpretado manualmente. Um comando dedicado continua sendo preferível sempre que existe; `/proc` serve sobretudo quando nenhum comando adequado está disponível, ou para um script que precisa de um valor bruto preciso em vez de um texto já formatado.

## Exemplo: extrair uma métrica precisa

```bash
# porcentagem de memoria utilizada, calculada a partir de /proc/meminfo
total=$(awk '/MemTotal/ {print $2}' /proc/meminfo)
disponivel=$(awk '/MemAvailable/ {print $2}' /proc/meminfo)
echo "$(( (total - disponivel) * 100 / total ))% de memoria utilizada"
```

Esse tipo de extração (via `awk`, ver [Processamento de texto](/?c=shells&s=bash&p=traitement-de-texte)) é a base de um script de supervisão do sistema: cada métrica da tabela acima é lida, formatada e depois reunida em uma única mensagem, que o [`cron`](/?c=shells&s=bash&p=automatisation-cron) pode em seguida difundir periodicamente (por exemplo via `wall`, que exibe uma mensagem para todos os usuários conectados).

> **Armadilha:** interpretar diretamente o formato de um arquivo `/proc` (número de colunas, ordem dos campos) sem verificar se ele permanece estável: esse formato não tem garantia de ser idêntico entre todas as versões do kernel. Um script que funciona em uma máquina pode falhar silenciosamente em outra.
>
> **Boa prática:** preferir um comando dedicado quando ele existe (ele mesmo encapsula as variações de formato), e ler `/proc` diretamente apenas como último recurso, testando o script na distribuição realmente visada.

---

## 📋 Recapitulação

| | |
|---|---|
| **Para lembrar** | `/proc` é um sistema de arquivos virtual gerado pelo kernel, que reflete o estado do sistema em tempo real; cada métrica comum do sistema (CPU, memória, rede, usuários) é acessível por um comando dedicado ou por um arquivo `/proc` correspondente. |
| **Ferramentas utilizáveis** | `uname`, `lscpu`, `nproc`, `free`, `df`, `uptime`, `who`/`w`, `ss`, `ip addr`, `lvs`/`vgs`/`pvs`. |
| **Armadilhas a evitar** | Interpretar um arquivo `/proc` sem verificar a estabilidade do seu formato entre distribuições/versões do kernel. |
| **Boas práticas** | Preferir um comando dedicado a `/proc` quando ele existe; testar todo script de supervisão na distribuição realmente visada. |
