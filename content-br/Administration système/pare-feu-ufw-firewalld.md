---
order: 5
---

# Firewall: UFW e firewalld

Mesmo com [SSH endurecido](/?c=administration-systeme&p=durcissement-ssh-sudo-mots-de-passe) e um [controle de acesso obrigatório](/?c=administration-systeme&p=selinux-vs-apparmor) ativo, um serviço que escuta em uma porta continua acessível por qualquer pessoa, em qualquer porta aberta. Um **firewall** filtra o tráfego de rede de entrada (e às vezes de saída) segundo regras explícitas: por padrão, tudo o que não é explicitamente permitido é recusado.

## O princípio: lista branca em vez de lista negra

A configuração mais segura de um firewall começa **recusando tudo**, e depois permite explicitamente apenas o que é realmente necessário (tipicamente, uma única porta aberta: SSH):

```text
Trafego de entrada
      |
      v
+-----------------+     porta 22 (SSH) permitida -----> aceita
|   Firewall       |
|  (nega por       |     qualquer outra porta ---------> recusa
|   padrao)         |
+-----------------+
```

Essa é uma aplicação direta do princípio do menor privilégio (já visto aplicado aos dados em [Segurança de APIs web](/?c=cybersecurite&p=securite-api-web)): quanto mais curta a lista de portas abertas, menor a superfície de ataque disponível.

## UFW (Debian): uma interface simplificada

O **UFW** (*Uncomplicated Firewall*) é a ferramenta padrão no Debian/Ubuntu; ele simplifica a configuração do firewall do kernel Linux sem exigir manipular diretamente as regras de baixo nível:

```bash
ufw default deny incoming   # recusa todo o trafego de entrada por padrao
ufw allow 2222/tcp          # permite apenas a porta SSH (aqui redefinida, veja o capitulo anterior)
ufw enable                  # ativa o firewall com essas regras
ufw status                  # lista as regras ativas
```

## firewalld (Rocky/RHEL): um sistema de zonas

O **firewalld** é a ferramenta padrão no Rocky Linux/RHEL; ele organiza suas regras por **zonas**, cada uma representando um nível de confiança de rede (ex.: `public`, `internal`, `trusted`), em vez de uma simples lista de regras globais:

```bash
firewall-cmd --set-default-zone=public
firewall-cmd --zone=public --add-port=2222/tcp --permanent  # permite SSH na zona "public"
firewall-cmd --reload                                        # aplica as regras permanentes
firewall-cmd --list-all                                       # lista as regras da zona ativa
```

## Comparando os dois

| | UFW | firewalld |
|---|---|---|
| Distribuição padrão | Debian, Ubuntu | Rocky Linux, RHEL |
| Modelo | Lista de regras globais | Zonas, cada uma com seu próprio conjunto de regras |
| Aplicação imediata | Sim, desde o comando | Exige `--permanent` e depois `--reload` para persistir após reiniciar |

> **Armadilha:** abrir uma porta para testar uma configuração, e depois esquecer de fechá-la ao terminar o teste: a lista de portas abertas deve permanecer o reflexo exato dos serviços realmente necessários, não um histórico de tudo o que já foi tentado.
>
> **Boa prática:** partir de uma recusa total por padrão e abrir apenas uma única porta (SSH) em um servidor que não hospeda outro serviço exposto, conforme o princípio do menor privilégio.

---

## 📋 Recapitulação

| | |
|---|---|
| **Para lembrar** | Um firewall filtra o tráfego de rede; a configuração mais segura recusa tudo por padrão e só permite explicitamente as portas realmente necessárias. O UFW (Debian) usa uma lista de regras, o firewalld (Rocky) usa zonas. |
| **Ferramentas utilizáveis** | `ufw allow`/`ufw enable` (Debian); `firewall-cmd --add-port`/`--reload` (Rocky). |
| **Armadilhas a evitar** | Deixar aberta uma porta que era destinada apenas a um teste pontual. |
| **Boas práticas** | Recusar tudo por padrão e abrir apenas o estritamente necessário (SSH sozinho, em um servidor sem outro serviço exposto). |
