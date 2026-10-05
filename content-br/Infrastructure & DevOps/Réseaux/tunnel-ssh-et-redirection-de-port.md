---
order: 4
---

# Túnel SSH e redirecionamento de portas

Alguns serviços são propositalmente acessíveis apenas a partir da máquina em que rodam: um banco de dados, uma interface de administração, a porta de depuração de um navegador. Um **túnel SSH** permite alcançá-los de outro computador sem expô-los à rede, fazendo a conexão passar por dentro de uma conexão [SSH](/?c=shells&s=bash&p=bash) (*Secure Shell*, o protocolo padrão para se conectar com segurança a uma máquina remota) já criptografada.

## Porta, `localhost`: duas noções a conhecer

Uma máquina recebe as conexões em **portas**, números de 1 a 65535 que designam cada um um programa à escuta (veja [os sockets](/?c=infrastructure-devops&s=reseaux&p=sockets-et-io-non-bloquante) para a mecânica do lado do programa). Um serviço escolhe em qual endereço escuta:

| Endereço de escuta | Quem pode se conectar | Exemplo |
|---|---|---|
| `0.0.0.0` | Qualquer máquina que alcance esta pela rede | Um site público |
| `127.0.0.1` (chamado `localhost`) | Apenas os programas da **mesma máquina** | Um banco de dados de desenvolvimento, uma porta de depuração |

`127.0.0.1` é o endereço de **loopback**: um pacote enviado a esse endereço nunca sai da máquina. Um serviço que só escuta em `127.0.0.1` é, portanto, invisível pela rede, mesmo sem firewall (veja [o firewall](/?c=infrastructure-devops&s=administration-systeme&p=pare-feu-ufw-firewalld)).

## O princípio: um redirecionamento de porta local

O comando `ssh -L` abre uma porta na **sua** máquina e redireciona tudo o que chega nela, pela conexão SSH, para uma porta alcançável a partir do **servidor**:

```text
Seu PC                                  Servidor remoto
┌─────────────────┐                     ┌──────────────────────────────┐
│ navegador       │ túnel criptografado │ sshd (porta 22, aberta)      │
│ → localhost:9222│  ================>  │   │                          │
└─────────────────┘                     │   ▼                          │
                                        │ serviço em 127.0.0.1:9222    │
                                        │ (invisível pela rede)        │
                                        └──────────────────────────────┘
```

```powershell
ssh -N -L 9222:localhost:9222 usuario@servidor.exemplo.com.br
```

| Trecho | Significado |
|---|---|
| `-L 9222:localhost:9222` | Escutar na porta 9222 da **minha** máquina e redirecionar para `localhost:9222` **visto do servidor** |
| `-N` | Não executar nenhum comando no servidor: a sessão serve apenas ao túnel |
| `usuario@servidor.exemplo.com.br` | Conta e máquina às quais se conecta por SSH (autenticação habitual, por chave ou senha) |

Enquanto esse comando roda, um programa local que se conecta a `localhost:9222` está, na verdade, falando com o serviço do servidor. O cliente `ssh` já vem com o Windows 10 e 11, o Linux e o macOS ([manual do ssh](https://man.openbsd.org/ssh)).

> **Armadilha:** em `-L 9222:localhost:9222`, o `localhost` do meio designa o **servidor**, não a sua máquina: o destino é resolvido do outro lado do túnel. Para alcançar um terceiro computador a partir do servidor, coloca-se ali o endereço dele (`-L 5433:banco-interno:5432`).
>
> **Boa prática:** escolher para a porta local um número livre (o mesmo do serviço é o mais fácil de lembrar) e verificar o túnel com uma requisição real (por exemplo `curl http://localhost:9222/json/version` para a depuração do Chrome), em vez de supor que ele funciona.

## As três formas de redirecionamento

| Opção | Sentido | Uso típico |
|---|---|---|
| `-L` (*local*) | Uma porta da **minha** máquina leva a uma porta do lado do servidor | Alcançar um banco de dados ou uma interface de administração do servidor |
| `-R` (*remote*) | Uma porta do **servidor** leva a uma porta da minha máquina | Deixar um servidor alcançar um serviço que roda na minha casa, atrás de um roteador |
| `-D` (*dynamic*) | Uma porta local vira um proxy SOCKS, que redireciona para qualquer destino | Fazer todo o tráfego de um navegador passar pelo servidor |

## Armadilhas e limites

Um túnel contorna de propósito o firewall: o acesso é permitido porque o SSH é, não porque o serviço é.

> **Armadilha:** expor o túnel à rede. Por padrão, `-L` só escuta em `127.0.0.1`; escrever `-L 0.0.0.0:9222:localhost:9222` torna a porta local acessível por toda a rede do seu computador e, portanto, o acesso ao serviço remoto por qualquer um que a alcance, muitas vezes sem autenticação (a porta de depuração do Chrome não tem nenhuma).
>
> **Boa prática:** manter a escuta local padrão (`127.0.0.1`) e nunca acrescentar um endereço de escuta sem um motivo preciso.

> **Armadilha:** um túnel cai em silêncio quando a conexão SSH é cortada (computador em suspensão, rede instável); o programa que o usa recebe então erros de conexão recusada, sem ligação aparente com o SSH.
>
> **Boa prática:** acrescentar `-o ServerAliveInterval=30` (uma mensagem de controle a cada 30 segundos, que detecta um corte); para um túnel permanente, deixar uma ferramenta relançá-lo (`autossh`, ou um serviço do sistema).

> **Armadilha:** um erro `bind: Address already in use` ao iniciar significa que a porta local já está ocupada (muitas vezes por um túnel antigo que ficou aberto).
>
> **Boa prática:** listar as portas em escuta (`netstat -ano` no Windows, `ss -ltn` no Linux), fechar o túnel antigo ou escolher outra porta.

Do lado do servidor, o administrador pode proibir ou limitar os redirecionamentos com `AllowTcpForwarding` e `PermitOpen` em `/etc/ssh/sshd_config` (veja [o endurecimento do SSH](/?c=infrastructure-devops&s=administration-systeme&p=durcissement-ssh-sudo-mots-de-passe)).

---

## 📋 Resumo

| | |
|---|---|
| **O que lembrar** | Um serviço que só escuta em `127.0.0.1` só é acessível a partir da própria máquina. `ssh -L porta_local:destino:porta_destino usuario@servidor` abre uma porta na sua máquina e a liga, por SSH, a um destino visto do servidor; `-R` faz o inverso, `-D` cria um proxy SOCKS. Apenas a porta 22 do servidor permanece aberta. |
| **Ferramentas utilizáveis** | `ssh -N -L …` (túnel sem sessão), `-o ServerAliveInterval=30` (detecção de cortes), `autossh` (relançamento automático), `curl`, `netstat -ano` / `ss -ltn` (verificar um túnel e as portas ocupadas). |
| **Armadilhas a evitar** | Achar que o `localhost` do meio designa a própria máquina. Escutar em `0.0.0.0` e expor um serviço sem autenticação a uma rede inteira. Esquecer que um túnel cai em silêncio. Uma porta local já ocupada. |
| **Boas práticas** | Manter a escuta local padrão (`127.0.0.1`). Testar o túnel com uma requisição real. Vigiar a conexão (`ServerAliveInterval`). Restringir os redirecionamentos no servidor (`AllowTcpForwarding`, `PermitOpen`). |
