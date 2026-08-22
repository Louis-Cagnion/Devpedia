---
order: 8
---

# A PWA: um site que se comporta como um aplicativo

Uma **PWA** (*Progressive Web App*) é um site clássico ao qual dois mecanismos adicionam capacidades até então reservadas aos aplicativos nativos: continuar funcionando sem conexão à internet, e se instalar no aparelho como um aplicativo de verdade, sem passar por uma loja de aplicativos.

## O service worker: um script que roda entre o site e a rede

Um **service worker** é um script JavaScript que o navegador executa em segundo plano, separadamente da própria página, capaz de interceptar cada requisição de rede que o site emite antes que ela realmente chegue à internet:

```text
Sem service worker:                Com service worker:

Pagina -> requisicao -> rede       Pagina -> requisicao -> service worker
                                                              |
                                                em cache? ----+-- sim -> resposta imediata, sem rede
                                                              |
                                                              +-- nao -> rede, depois salva em cache
```

Essa posição de intermediário permite servir um recurso já salvo em cache mesmo quando a rede está indisponível, algo que um site clássico não consegue fazer: sem uma requisição de rede bem-sucedida, ele simplesmente não tem nada para exibir.

> **Cuidado:** confundir o service worker com a thread principal da página. Um service worker roda em seu próprio contexto, sem acesso direto ao DOM; ele se comunica com a página por meio de mensagens, não manipulando seus elementos diretamente.
>
> **Boa prática:** manter o service worker focado na interceptação de rede e no cache; toda lógica que afeta a exibição fica no próprio código da página.

## Estratégias de cache: o que servir, e quando checar a rede

| Estratégia | Princípio | Adequada para |
|---|---|---|
| **Cache primeiro** (*cache-first*) | Serve a versão em cache se ela existir, só vai à rede se nada estiver em cache | Recursos que mudam raramente (logo, fonte, CSS versionado) |
| **Rede primeiro** (*network-first*) | Tenta a rede primeiro, só recorre ao cache em caso de falha | Conteúdo que precisa se manter atualizado enquanto a rede responder |
| **Expirado durante a atualização** (*stale-while-revalidate*) | Serve imediatamente a versão em cache, enquanto a atualiza em segundo plano para a próxima visita | Conteúdo que tolera uma leve desatualização, já visto em [bancos de dados de alto tráfego](/?c=donnees&s=bases-de-donnees&p=bases-de-donnees-a-fort-trafic) para o mesmo compromisso do lado do servidor |

Nenhuma dessas estratégias é universalmente a certa: a escolha depende da frequência real de mudança de cada recurso, não de uma preferência única aplicada a todo o site.

## O manifest: o que torna um site instalável

Um arquivo **manifest** (`manifest.json`), vinculado a partir da página HTML, declara as informações que um navegador ou sistema operacional usa para oferecer a instalação do site como um aplicativo: seu nome, um ícone em vários tamanhos, uma cor de tema, e um modo de exibição (`standalone` esconde a barra de endereço do navegador, para se parecer com um aplicativo nativo).

```json
{
  "name": "Meu Aplicativo",
  "short_name": "MeuApp",
  "icons": [{ "src": "icone-512.png", "sizes": "512x512", "type": "image/png" }],
  "start_url": "/",
  "display": "standalone",
  "theme_color": "#1e293b"
}
```

Sem um manifest válido (ícones presentes, `start_url` correta), o navegador nunca oferece a instalação, mesmo que um service worker já esteja funcionando.

## O que a PWA não substitui

Uma PWA continua sendo um site: ela não tem acesso a todas as APIs que um aplicativo nativo pode usar (alguns sensores, uma integração profunda com o sistema), e sua instalação depende do navegador e do sistema operacional do usuário em vez de uma loja centralizada. Ela é adequada para estender um site já existente, não para tudo que já exigiria um aplicativo nativo hoje.

---

## 📋 Recapitulação

| | |
|---|---|
| **Para lembrar** | Uma PWA adiciona a um site o funcionamento offline (service worker interceptando as requisições de rede, cache) e a instalabilidade (manifest declarando nome, ícones, modo de exibição). A escolha da estratégia de cache depende da frequência real de mudança de cada recurso. |
| **Ferramentas utilizáveis** | Um service worker para interceptar requisições e servir a partir do cache; um `manifest.json` para tornar o site instalável. |
| **Armadilhas a evitar** | Confundir o service worker com a thread principal da página (sem acesso direto ao DOM). Um manifest incompleto que impede a instalação sem erro visível. |
| **Boas práticas** | Escolher a estratégia de cache por recurso em vez de uma escolha única para todo o site. Manter o service worker focado na rede e no cache. |
