---
order: 5
---

# Criptografía aplicada para desarrolladores

La criptografía reúne las técnicas que protegen un dato frente a la lectura o modificación por parte de quien no debería tener acceso a él. Este capítulo cubre el vocabulario y los errores más frecuentes; el hashing específico de contraseñas, ya detallado en profundidad, se trata en [Contraseñas y hashing seguro](/?c=authentification&s=fondamentaux&p=mots-de-passe-et-hachage).

## Hashing frente a cifrado: una confusión frecuente

Ambos transforman un dato, pero con objetivos opuestos:

| | Hashing | Cifrado |
|---|---|---|
| Sentido de la operación | Unidireccional: es imposible recuperar la entrada | Reversible: el dato original se recupera con la clave correcta |
| Objetivo | Comprobar que un dato no ha cambiado, o compararlo sin almacenarlo en claro | Hacer que un dato sea ilegible sin la clave, pudiendo leerlo de nuevo más tarde |
| Ejemplo de uso | Almacenar una contraseña, comprobar la integridad de un archivo descargado | Proteger un archivo confidencial, asegurar una conexión de red (TLS) |

> **Error común:** hablar de "desencriptar" una contraseña hasheada para recuperarla. Un hash no tiene ninguna clave asociada que permita revertirlo: precisamente eso es lo que lo hace adecuado para contraseñas (ver [Contraseñas y hashing seguro](/?c=authentification&s=fondamentaux&p=mots-de-passe-et-hachage)), e inadecuado para cualquier dato que algún día haya que volver a leer (en cuyo caso el cifrado es la herramienta correcta).

## Cifrado simétrico y asimétrico

| | Simétrico | Asimétrico |
|---|---|---|
| Clave(s) | Una sola clave, usada para cifrar **y** descifrar | Un par: una clave pública (cifrar, o verificar una firma) y una clave privada (descifrar, o firmar) |
| Velocidad | Rápido | Mucho más lento |
| Problema principal | Hacer llegar la clave secreta a la otra parte sin que sea interceptada | Ningún secreto que transmitir: la clave pública puede circular libremente |
| Ejemplo de algoritmo | [AES](https://en.wikipedia.org/wiki/Advanced_Encryption_Standard) | [RSA](https://en.wikipedia.org/wiki/RSA_cryptosystem), curvas elípticas (ECC) |

```text
Simetrico                               Asimetrico

  Emisor             Destinatario         Emisor                Destinatario
  clave secreta K    clave secreta K      clave publica del     clave privada del
       |                   |              destinatario          destinatario
       v                   v                   |                     |
  cifra con K        descifra con K             v                     v
                                          cifra con la clave     descifra con
                                          publica                la clave privada
                                          (cualquiera puede        (solo el
                                           cifrar)                  destinatario puede leer)
```

En la práctica, ambos se combinan a menudo: TLS (ver el panorama de ataques de red en [Asegurar tus datos](/?c=langages-de-programmation&s=php&p=securite)) usa cifrado asimétrico para intercambiar una clave de sesión, y luego pasa a cifrado simétrico (más rápido) para el resto de la conexión.

## La firma digital: lo inverso del cifrado asimétrico

Una **firma digital** demuestra que un dato realmente proviene del emisor esperado, y que no ha sido modificado desde entonces: el emisor firma con su clave **privada**, y cualquiera puede verificarla con la clave **pública** (lo inverso del cifrado, donde se cifra con la clave pública del destinatario). El principio es el mismo que la firma de un [JWT](/?c=authentification&s=sessions-et-tokens&p=jwt-et-tokens): garantizar la integridad, nunca la confidencialidad por sí sola.

## Errores comunes a evitar

| Error | Por qué es peligroso | Buena práctica |
|---|---|---|
| Implementar tu propio algoritmo de cifrado | Un algoritmo casero nunca ha pasado el análisis exhaustivo que los algoritmos estándar, publicados y probados por toda la comunidad criptográfica durante años, sí han pasado | Usar siempre una biblioteca criptográfica reconocida, nunca una implementación artesanal |
| Generar una clave o sal con un generador aleatorio ordinario | Un generador no criptográfico es predecible (ver [Aleatoriedad y generadores](/?c=representation-des-donnees&p=aleatoire-et-generateurs)) | Usar siempre un CSPRNG para todo lo que deba permanecer secreto |
| Reutilizar la misma clave para todo | Una clave comprometida en un contexto compromete entonces todos los usos que la comparten | Una clave dedicada por uso, con rotación regular (ver [Gestión de secretos](/?c=cybersecurite&p=gestion-des-secrets)) |
| Almacenar la clave de cifrado junto al dato cifrado | Equivale a dejar la llave de casa bajo el felpudo: quien accede a los datos también accede a la clave | Almacenar la clave por separado (ver [Gestión de secretos](/?c=cybersecurite&p=gestion-des-secrets)) |
| Usar un algoritmo obsoleto (DES, RC4) | Se puede romper con capacidad de cómputo moderna, a veces en horas | Usar los estándares actuales (AES, curvas elípticas modernas) |

---

## 📋 Resumen

| | |
|---|---|
| **Para recordar** | El hashing es unidireccional (verificar/comparar); el cifrado es reversible (proteger y luego leer de nuevo). El cifrado simétrico usa una sola clave compartida; el asimétrico, un par de claves pública/privada. Una firma digital garantiza la integridad, no la confidencialidad. |
| **Herramientas utilizables** | AES (simétrico), RSA/ECC (asimétrico), una biblioteca criptográfica estándar del lenguaje usado en lugar de una implementación casera. |
| **Errores a evitar** | Confundir hashing y cifrado; implementar tu propio algoritmo; reutilizar la misma clave en todas partes; usar un generador aleatorio no criptográfico para una clave o sal. |
| **Buenas prácticas** | Una clave dedicada por uso; un CSPRNG para todo secreto; algoritmos estándar, nunca artesanales; una clave almacenada separadamente de los datos que protege. |
