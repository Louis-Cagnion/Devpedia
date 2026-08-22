---
order: 1
---

# Virtualização e escolha de SO

Administrar um servidor Linux começa antes mesmo de digitar um comando nele: primeiro é preciso ter uma máquina para instalá-lo, e uma distribuição para rodar nela. Este capítulo cobre essas duas decisões prévias; os seguintes pressupõem que um sistema já está instalado e acessível.

## Criar a máquina: um hipervisor de tipo 2

Sem um servidor físico dedicado, uma [máquina virtual](/?c=docker&p=concepts-de-base) (VM) simula um computador completo dentro do próprio computador de trabalho, via um **hipervisor**. Dois softwares comuns para esse caso de uso local:

| Software | Plataforma hospedeira | Particularidade |
|---|---|---|
| [VirtualBox](https://www.virtualbox.org/) | Windows, macOS, Linux | Gratuito, código aberto, muito difundido, suporta muitos sistemas convidados |
| [UTM](https://mac.getutm.app/) | macOS (Apple Silicon e Intel) | Se apoia no hipervisor nativo da Apple, mais eficiente em Macs recentes do que o VirtualBox |

> **Nota:** os dois são hipervisores de **tipo 2** (instalados como um aplicativo comum sobre um sistema operacional já presente), diferentes de um hipervisor de tipo 1 (instalado diretamente no hardware, sem sistema hospedeiro, usado mais em ambiente de produção).

## Escolher uma distribuição: Debian ou Rocky Linux

A escolha da distribuição instalada na VM condiciona as ferramentas disponíveis para o restante do percurso (gerenciador de pacotes, controle de acesso obrigatório, veja [SELinux vs AppArmor](/?c=administration-systeme&p=selinux-vs-apparmor)):

| | Debian | Rocky Linux |
|---|---|---|
| Origem | Distribuição comunitária independente | Reconstrução comunitária do Red Hat Enterprise Linux (RHEL) |
| Gerenciador de pacotes | `apt` (`.deb`) | `dnf` (`.rpm`) |
| Controle de acesso obrigatório | [AppArmor](/?c=administration-systeme&p=selinux-vs-apparmor) | [SELinux](/?c=administration-systeme&p=selinux-vs-apparmor) |
| Firewall padrão | [UFW](/?c=administration-systeme&p=pare-feu-ufw-firewalld) | [firewalld](/?c=administration-systeme&p=pare-feu-ufw-firewalld) |
| Pontos fortes | Grande comunidade, atualizações frequentes, muito bem documentada | Compatível com o ecossistema RHEL (usado em empresas), ciclo de suporte longo |
| Compromisso | Menos voltada para "empresas" que RHEL/Rocky | Curva de aprendizado um pouco mais acentuada (SELinux mais rígido que o AppArmor por padrão) |

Nenhuma das duas é objetivamente "melhor": a Debian prioriza a simplicidade e uma comunidade muito ampla, a Rocky Linux prioriza a proximidade com um ambiente empresarial real (a RHEL é amplamente usada em produção). A escolha depende sobretudo do objetivo: aprender administração de sistemas "genérica" (Debian) ou se aproximar das práticas de uma empresa que usa RHEL (Rocky).

> **Armadilha:** instalar uma distribuição e depois misturar instruções encontradas online para a outra (ex.: usar `apt` na Rocky Linux): as duas famílias de distribuições têm ferramentas e caminhos de configuração diferentes, raramente intercambiáveis.
>
> **Boa prática:** uma vez escolhida a distribuição, manter a coerência com seu ecossistema (gerenciador de pacotes, documentação oficial dessa distribuição) em vez de misturar fontes de informação pensadas para a outra família.

---

## 📋 Recapitulação

| | |
|---|---|
| **Para lembrar** | Um hipervisor de tipo 2 (VirtualBox, UTM) permite criar uma VM em um computador de trabalho existente; Debian e Rocky Linux são duas famílias de distribuições com ferramentas diferentes (`apt`/AppArmor/UFW vs `dnf`/SELinux/firewalld). |
| **Ferramentas utilizáveis** | VirtualBox (multiplataforma) ou UTM (macOS) para criar a VM; `apt` ou `dnf` conforme a distribuição escolhida. |
| **Armadilhas a evitar** | Misturar comandos ou documentação pensados para a outra família de distribuição. |
| **Boas práticas** | Escolher a distribuição de acordo com o objetivo (aprendizado genérico vs proximidade com um ambiente empresarial RHEL), e depois manter a coerência com seu ecossistema. |
