---
order: 4
---

# Endurecimento de SSH, sudo e senhas

Um sistema instalado com suas configurações padrão continua vulnerável a ataques automatizados, que varrem a Internet testando portas e credenciais padrão. **Endurecer** um sistema consiste em reduzir essa superfície de ataque: este capítulo cobre três pontos de entrada frequentemente visados.

## Endurecer o acesso remoto: SSH

O [SSH](/?c=shells&s=bash&p=bash) (*Secure Shell*) é o protocolo padrão para administrar um servidor remotamente; seu arquivo de configuração, `/etc/ssh/sshd_config`, controla seu comportamento:

| Configuração | Efeito | Por quê |
|---|---|---|
| `Port 2222` (em vez de `22`) | Muda a porta de escuta padrão | Reduz o ruído das varreduras automatizadas que visam a porta 22 por padrão (não substitui uma segurança real, mas filtra as tentativas mais básicas) |
| `PermitRootLogin no` | Proíbe a conexão SSH direta com a conta `root` | Obriga a se conectar com uma conta de usuário nominal, e depois elevar os privilégios via `sudo` (veja mais abaixo): cada ação permanece rastreável a uma pessoa específica |

> **Nota:** mudar a porta do SSH não substitui as outras medidas (senha forte, `PermitRootLogin no`): um atacante visando especificamente o servidor ainda pode varrer todas as portas. É uma redução de ruído, não uma proteção sozinha.

## Impor uma política de senhas (PAM / `login.defs`)

O **PAM** (*Pluggable Authentication Modules*) é o sistema Linux que gerencia a autenticação (incluindo senhas) de forma modular; `/etc/login.defs` e os módulos PAM associados permitem impor regras:

| Regra | Onde | Exemplo de valor |
|---|---|---|
| Expiração da senha | `login.defs` (`PASS_MAX_DAYS`) | 30 dias |
| Intervalo mínimo entre duas trocas | `login.defs` (`PASS_MIN_DAYS`) | 2 dias (impede trocar 2 vezes seguidas para voltar à senha anterior) |
| Alerta antes da expiração | `login.defs` (`PASS_WARN_AGE`) | 7 dias antes |
| Complexidade mínima | Módulo PAM (`pam_pwquality`) | Maiúscula + minúscula + número, no máximo 3 caracteres idênticos consecutivos, diferente do nome de usuário, ao menos 7 caracteres diferentes da senha anterior |

## Endurecer o `sudo`

O `sudo` permite que um usuário autorizado execute um comando com os privilégios de `root`, sem compartilhar a senha do `root` propriamente dita. Seu arquivo de configuração (`/etc/sudoers`, a ser editado via `visudo`) aceita várias configurações de endurecimento:

```text
Defaults passwd_tries=3                          # 3 tentativas de senha no maximo
Defaults badpass_message="Senha incorreta, tentativa recusada."
Defaults logfile="/var/log/sudo/sudo.log"        # registra cada comando sudo
Defaults log_input, log_output                    # registra tambem o que e digitado/exibido
Defaults use_pty                                  # executa o comando em um pseudo-terminal dedicado
Defaults secure_path="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
```

| Configuração | Papel |
|---|---|
| `passwd_tries` | Limita o número de tentativas antes de bloquear o comando |
| `badpass_message` | Personaliza a mensagem exibida em caso de falha |
| `logfile` / `log_input` / `log_output` | Registra integralmente cada comando executado via `sudo`, com o que foi digitado e exibido |
| `use_pty` | Impede certas técnicas de burlar o registro, forçando um pseudo-terminal real |
| `secure_path` | Restringe as pastas onde o `sudo` procura os comandos executáveis, para impedir que uma pasta adicionada ao `PATH` pessoal do usuário (veja [Variáveis de ambiente](/?c=shells&s=bash&p=variables-denvironnement)) faça executar um programa malicioso no lugar do verdadeiro |

> **Armadilha:** registrar os comandos `sudo` (`logfile`) sem ativar `use_pty`: certos comandos interativos podem então escapar parcialmente da captura de entradas/saídas.
>
> **Boa prática:** combinar os três eixos deste capítulo em vez de apenas um isoladamente: um SSH endurecido mas uma senha fraca, ou o contrário, sempre deixa uma porta aberta.

---

## 📋 Recapitulação

| | |
|---|---|
| **Para lembrar** | Endurecer um sistema combina três eixos: SSH (porta não padrão, `root` proibido de forma direta), uma política de senha estrita (PAM/`login.defs`), e um `sudo` registrado e restrito. |
| **Ferramentas utilizáveis** | `/etc/ssh/sshd_config`, `/etc/login.defs` + `pam_pwquality`, `visudo`/`/etc/sudoers`. |
| **Armadilhas a evitar** | Registrar o `sudo` sem `use_pty`; endurecer apenas um dos três eixos deixando os outros no padrão. |
| **Boas práticas** | Restringir `secure_path`, forçar uma conta nominal antes do `sudo`, e combinar sistematicamente os três eixos do capítulo. |
