---
order: 3
---

# SELinux vs AppArmor

As permissões Unix clássicas (veja [Permissões e manipulação de arquivos](/?c=shells&s=bash&p=permissions-et-fichiers)) seguem um modelo **discricionário** (*DAC*, *Discretionary Access Control*): o próprio dono de um arquivo decide quem acessa. Um **controle de acesso obrigatório** (*MAC*, *Mandatory Access Control*) adiciona uma camada de regras impostas pelo sistema, que nem mesmo o dono de um arquivo pode contornar: útil para limitar os danos caso um programa seja comprometido, impedindo-o de acessar arquivos fora de seu perímetro normal, mesmo que rode com permissões Unix suficientes para isso.

## Duas implementações, duas distribuições

SELinux e AppArmor atendem à mesma necessidade (o MAC) com abordagens diferentes; cada distribuição integra uma por padrão, coerente com [a escolha vista anteriormente](/?c=administration-systeme&p=virtualisation-et-choix-dos):

| | SELinux | AppArmor |
|---|---|---|
| Distribuição padrão | Rocky Linux (RHEL) | Debian, Ubuntu |
| Modelo | Baseado em **rótulos** (*labels*) aplicados a cada arquivo/processo | Baseado em **caminhos de arquivo** |
| Onde ficam as regras | Uma política central, que associa rótulos autorizados entre si | Um perfil por programa, listando caminhos e permissões autorizadas |
| Curva de aprendizado | Mais acentuada, mas mais precisa | Mais simples de ler e escrever |

## SELinux: um sistema de rótulos

Cada arquivo e cada processo recebe um **rótulo** (*label*, ex.: `httpd_sys_content_t` para os arquivos servidos por um servidor web). A política do SELinux define quais rótulos têm o direito de interagir com quais outros: um processo rotulado `httpd_t` pode ler arquivos rotulados `httpd_sys_content_t`, mas tem o acesso negado a arquivos com outro rótulo, mesmo que as permissões Unix clássicas permitissem.

```bash
getenforce          # exibe o modo atual
setenforce 1         # ativa o modo "enforcing" (bloqueia as violacoes)
```

| Modo | Efeito |
|---|---|
| `Enforcing` | Bloqueia e registra qualquer violação da política |
| `Permissive` | Registra as violações sem bloqueá-las (útil para testar uma política) |
| `Disabled` | SELinux totalmente desativado |

## AppArmor: perfis por caminho

O AppArmor associa diretamente um **perfil** a cada programa, listando os caminhos de arquivo aos quais ele pode acessar (e com quais permissões), em vez de passar por um sistema de rótulos separado:

```text
/usr/sbin/nginx {
    /var/www/html/** r,      # leitura apenas nos arquivos do site
    /var/log/nginx/*.log w,  # escrita apenas em seus proprios logs
}
```

| Modo | Efeito |
|---|---|
| `enforce` | Bloqueia e registra qualquer violação do perfil |
| `complain` | Registra as violações sem bloqueá-las |

> **Nota:** nos dois sistemas, um modo "registra sem bloquear" (`permissive`/`complain`) serve para validar uma nova política ou um novo perfil antes de ativá-lo de fato, observando nos logs do sistema o que teria sido bloqueado.

> **Armadilha:** desativar pura e simplesmente o SELinux ou o AppArmor para "fazer desaparecer" um erro de acesso sem entender por que ele ocorre: isso remove toda a proteção MAC em vez de corrigir o rótulo ou o perfil realmente responsável.
>
> **Boa prática:** usar o modo somente de registro (`Permissive`/`complain`) para identificar precisamente a regra faltante, adicioná-la à política/ao perfil, e só então voltar ao modo estrito (`Enforcing`/`enforce`).

---

## 📋 Recapitulação

| | |
|---|---|
| **Para lembrar** | O controle de acesso obrigatório (MAC) adiciona regras de sistema impostas, além das permissões Unix clássicas. O SELinux (Rocky) rotula arquivos e processos; o AppArmor (Debian) define perfis por caminho. |
| **Ferramentas utilizáveis** | `getenforce`/`setenforce` para o SELinux; os perfis em `/etc/apparmor.d/` para o AppArmor. |
| **Armadilhas a evitar** | Desativar completamente a proteção MAC para contornar um erro de acesso mal compreendido. |
| **Boas práticas** | Diagnosticar em modo somente de registro (`Permissive`/`complain`) antes de corrigir e só então voltar ao modo estrito. |
