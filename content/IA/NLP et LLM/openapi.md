---
order: 10
---

# OpenAPI : décrire un contrat d'API, pour des humains et pour des machines

Le chapitre sur [les API et HTTP](/?c=infrastructure-devops&s=infrastructure&p=api-et-http) présente une API comme un serveur qui répond à des requêtes structurées. Mais rien, dans une API elle-même, ne dit à l'avance quelles routes existent, quels paramètres elles attendent, ni quel format de réponse attendre : cette information doit être décrite quelque part. **OpenAPI** est le format standard (YAML ou JSON) le plus utilisé pour cette description : un fichier unique qui documente chaque endpoint d'une API REST, lisible à la fois par un humain et par des outils.

## Un contrat, deux usages

```yaml
# openapi.yaml (extrait)
paths:
  /meteo:
    get:
      summary: Recupere la meteo d'une ville
      parameters:
        - name: ville
          in: query
          required: true
          schema:
            type: string
      responses:
        "200":
          description: Meteo trouvee
          content:
            application/json:
              schema:
                type: object
                properties:
                  temperature: { type: number }
                  conditions: { type: string }
```

| Usage | Ce que ça donne |
|---|---|
| Documentation lisible | Une interface générée automatiquement (type Swagger UI) où un développeur explore les routes disponibles sans lire le code |
| Génération d'outillage | Un client HTTP généré automatiquement dans le langage de son choix, à partir de la seule spec |
| Vérification | La spec peut être testée contre l'implémentation réelle, pour détecter un écart entre ce qui est documenté et ce qui est réellement servi |

Le même fichier sert donc à la fois de documentation et de **source de vérité vérifiable** : contrairement à un commentaire de code ou une page de wiki, un écart entre la spec et le comportement réel de l'API peut être détecté automatiquement.

## Le lien avec les agents LLM : décrire des actions, pas seulement des routes

Le [function calling](/?c=ia&s=nlp-llm&p=agents) permet à un modèle de décider d'appeler un outil, décrit par un nom, des paramètres et leur type. Un fichier OpenAPI déjà existant fournit **exactement** cette description pour une API REST : plutôt que de redécrire chaque route à la main au format attendu par le function calling, un agent peut lire directement le fichier OpenAPI d'une API et en déduire quelles actions il peut appeler.

| | OpenAPI | [MCP](/?c=ia&s=nlp-llm&p=mcp) |
|---|---|---|
| Nature | Un contrat **statique** : un fichier qui décrit une API REST déjà existante | Un **protocole d'exécution** : un client et un serveur qui communiquent en direct |
| Ce qu'il décrit | Des routes HTTP classiques, pensées à l'origine pour n'importe quel client (pas seulement un LLM) | Des outils, données et prompts pensés dès le départ pour un client qui fait tourner un LLM |
| Origine | Antérieur aux LLM, réutilisé pour eux (GPT Actions, function calling) | Conçu spécifiquement pour standardiser l'intégration d'un LLM à des outils externes |

Les deux ne s'opposent pas : une intégration peut exposer une API REST classique documentée en OpenAPI, puis un serveur MCP vient l'envelopper pour la rendre directement utilisable par un client compatible MCP, sans réécrire l'intégration.

> **Piège :** laisser un fichier OpenAPI diverger de l'implémentation réelle au fil du temps (une route ajoutée sans mise à jour de la spec, un paramètre renommé). Un agent qui s'appuie sur cette spec pour savoir quels appels sont possibles peut alors tenter un appel invalide, ou ignorer une action réellement disponible.
>
> **Bonne pratique :** générer la spec OpenAPI directement depuis le code (annotations, décorateurs selon le framework) plutôt que de la maintenir à la main en parallèle, ou la tester automatiquement contre l'implémentation réelle (test de contrat) pour détecter tout écart dès qu'il apparaît.

---

## 📋 Récapitulatif

| | |
|---|---|
| **À retenir** | OpenAPI décrit, dans un fichier unique (YAML/JSON), les routes d'une API REST : paramètres, formats de réponse. Sert à la fois de documentation lisible et de contrat vérifiable. De plus en plus réutilisé pour décrire à un agent LLM quelles actions il peut appeler. |
| **Outils utilisables** | Une interface de documentation générée (type Swagger UI), un client HTTP généré depuis la spec, un test de contrat comparant la spec à l'implémentation réelle. |
| **Pièges à éviter** | Laisser la spec diverger de l'implémentation réelle sans le détecter. |
| **Bonnes pratiques** | Générer la spec depuis le code plutôt que la maintenir manuellement en parallèle ; la tester automatiquement contre l'API réelle. |
