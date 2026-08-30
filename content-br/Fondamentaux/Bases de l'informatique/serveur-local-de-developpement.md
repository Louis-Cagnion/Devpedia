---
order: 8
---

# O servidor local: testar uma página web sem publicá-la

Abrir um arquivo `index.html` diretamente no navegador (duplo clique, ou um endereço que começa com `file://`) funciona para uma página bem simples. Assim que ela carrega outros arquivos (`fetch`, módulos JavaScript, algumas fontes), o navegador bloqueia silenciosamente esses carregamentos: falta um **servidor local**, um programa que serve os arquivos do projeto como faria um site real, mas a partir da própria máquina.

## Por que o `file://` não é suficiente

Um navegador aplica regras de segurança diferentes conforme a página venha de um endereço `http://`/`https://` (um servidor real) ou de `file://` (um arquivo local). Vários recursos comuns ficam limitados ou desativados em `file://`:

| Necessidade da página | Em `file://` | Com um servidor local |
|---|---|---|
| Carregar outro arquivo com `fetch` | Bloqueado (erro de CORS) | Funciona |
| Carregar um módulo JavaScript (`<script type="module">`) | Bloqueado na maioria dos navegadores | Funciona |
| Recarregar a página a cada modificação (live reload) | Impossível | Possível (depende da ferramenta) |

> **Cuidado:** ver um erro `CORS` ou `Failed to fetch` no console e procurar o problema no próprio código. A causa mais frequente é simplesmente a ausência de um servidor local: a página está aberta em `file://`.
>
> **Boa prática:** assim que uma página carrega outro arquivo (JSON, módulo JS...), testá-la a partir de um servidor local em vez de abri-la diretamente com um duplo clique.

## Servidor local, servidor de produção: mesmo papel, alcance diferente

Um servidor local responde aos mesmos tipos de requisição que um servidor de produção (veja [API e HTTP](/?c=infrastructure-devops&s=infrastructure&p=api-et-http) para o detalhe do diálogo requisição/resposta): receber um endereço, devolver o arquivo pedido. A diferença está em quem pode acessá-lo.

```text
Servidor local (localhost)         Servidor de producao
      │                                    │
Responde apenas a esta             Responde a qualquer um na
maquina (127.0.0.1)                Internet, com um dominio real
      │                                    │
Serve de rascunho durante   →      Recebe o resultado final,
o desenvolvimento                  uma vez pronto
```

> **Cuidado:** achar que um site já "está no ar" assim que é executado localmente, e negligenciar a etapa de deploy. O `localhost` só pode ser acessado pela máquina que o executa: mais ninguém tem acesso a ele até o site ser publicado em um servidor real.

## Executar um servidor local

Várias ferramentas prestam o mesmo serviço; a escolha depende principalmente do que já está instalado.

| Ferramenta | Comando | Pré-requisito |
|---|---|---|
| Python (já vem instalado no macOS/Linux) | `python3 -m http.server 8000` | Python instalado |
| Node.js | `npx serve` | Node.js instalado |
| PHP | `php -S localhost:8000` | PHP instalado |
| Live Server (extensão do VS Code) | Clique com o botão direito em `index.html` → "Open with Live Server" | VS Code |

Uma vez iniciado, o terminal exibe um endereço (geralmente `http://localhost:8000` ou `http://127.0.0.1:5500`) para abrir no navegador.

> **Aprofundar:** `localhost` e `127.0.0.1` designam ambos "esta própria máquina"; o número depois de `:` (a **porta**) distingue vários servidores que estivessem rodando ao mesmo tempo na mesma máquina.

## Recarregamento automático ou manual

Algumas ferramentas (Live Server) recarregam a página automaticamente a cada arquivo modificado e salvo; outras (`http.server`, `php -S`) nunca fazem isso, é preciso recarregar manualmente (`F5`).

> **Cuidado:** um recarregamento automático bem no meio de um teste que depende do tempo (uma animação, uma reprodução de áudio, uma conexão em andamento) o interrompe sem aviso, invalidando o teste.
>
> **Boa prática:** para um teste sensível ao tempo, preferir uma ferramenta sem recarregamento automático (`http.server`, `php -S`): a página só muda quando você mesmo a recarrega, no momento escolhido.

> **Cuidado:** achar que um simples F5, ou até um recarregamento completo (`Ctrl+Shift+R`, ou `Cmd+Shift+R` no macOS), sempre esvazia o **cache** do navegador (sua cópia de alguns arquivos, guardada para evitar pedi-los de novo a cada vez). Com `python3 -m http.server` ou `php -S`, que não indicam por quanto tempo guardar essas cópias, ele pode continuar servindo uma versão antiga de um arquivo carregado por `fetch` ou por um módulo JS mesmo depois de um recarregamento completo, ou mesmo depois de "limpar os dados do site" pelo cadeado da barra de endereços (que nem sempre esvazia esse cache, dependendo do navegador).
>
> **Boa prática:** o jeito mais simples e confiável é trocar a porta do servidor local (`python3 -m http.server 8001` em vez de `8000`): uma porta diferente é um endereço diferente para o navegador, então o cache já nasce vazio, sem nada para limpar. Senão, limpar o cache pelas configurações do navegador em vez do cadeado (no Chrome: `chrome://settings/clearBrowserData`, período "Todo o período", marcar "Imagens e arquivos armazenados em cache").

---

## 📋 Recapitulando

| | |
|---|---|
| **O que reter** | Um arquivo aberto em `file://` não tem acesso a `fetch`, a módulos JS, nem a recarregamento automático: um **servidor local** remove essas restrições servindo os arquivos como faria um servidor real, mas acessível apenas a partir da própria máquina (`localhost`). |
| **Ferramentas úteis** | `python3 -m http.server`, `npx serve`, `php -S`, a extensão Live Server do VS Code. |
| **Armadilhas a evitar** | Procurar um bug no código diante de um erro de CORS/`Failed to fetch` quando a página está rodando em `file://`. Usar uma ferramenta com recarregamento automático para um teste sensível ao tempo (áudio, animação): o recarregamento pode interrompê-lo bem no meio. Achar que um F5, ou até um recarregamento completo, sempre esvazia o cache do navegador. |
| **Boas práticas** | Sempre testar a partir de um servidor local assim que a página carregar outro arquivo. Escolher uma ferramenta sem recarregamento automático para um teste sensível ao tempo. Se a modificação continuar sem aparecer, trocar a porta do servidor local (cache já vazio) em vez de insistir em limpar o existente. |
