---
order: 3
---

# ConfigMaps and Secrets: Taking Config out of the Image

## The problem: an image shouldn't contain its own configuration

A [Docker image](/?c=infrastructure-devops&s=docker&p=concepts-de-base) is supposed to stay identical across environments (development, staging, production). If a database URL or an external service's password were hardcoded inside it, a different image would need to be rebuilt for each environment, and a secret would end up versioned along with the rest of the code.

## ConfigMap: non-sensitive configuration

A **ConfigMap** stores configuration key/value pairs (an API URL, a log level, an environment name) outside the image, injected into the pod at startup as environment variables or mounted files:

```text
ConfigMap (key: value)  -->  injected into the pod at startup
API_URL: https://api.example.com
LOG_LEVEL: info
```

Changing a ConfigMap value never requires rebuilding the image: only the pod restarts with the new configuration.

## Secret: the same idea, for sensitive data

A **Secret** follows the same principle as a ConfigMap, reserved for sensitive data (a password, an API key, a certificate). Kubernetes stores and transmits them separately from the rest of the configuration, to allow stricter access control than on an ordinary ConfigMap.

> **Pitfall:** a basic Kubernetes Secret is only Base64-encoded, not encrypted by default: it isn't a vault, just a mechanism kept separate from ConfigMaps to apply distinct permissions. Real encryption at rest, or a dedicated secrets manager, are still needed for genuinely critical data.

---

## 📋 Summary

| | |
|---|---|
| **Key takeaways** | A ConfigMap externalizes an image's non-sensitive configuration, a Secret does the same for sensitive data; both get injected into the pod at startup, never requiring the image to be rebuilt. |
| **Tools you can use** | `kubectl get configmaps`/`kubectl get secrets` to list a cluster's externalized configuration. |
| **Pitfalls to avoid** | Hardcoding configuration or a secret into the image instead of a ConfigMap/Secret. Treating a basic Kubernetes Secret as encrypted storage. |
| **Best practices** | Systematically externalize any configuration that varies between environments. Reserve genuinely critical data for a dedicated secrets manager rather than a basic Kubernetes Secret. |
