# Descripción

Esta sección cubre la extracción de información desde documentos existentes (PDF, imágenes escaneadas): extraer el texto, reconstruir tablas, elegir dónde ejecutar los modelos de visión que hacen todo esto posible. Se apoya en [Python](/?c=langages-de-programmation&s=python) para la implementación y en las [redes neuronales](/?c=ia&s=fondamentaux-du-deep-learning&p=reseaux-de-neurones)/[arquitecturas de visión](/?c=ia&s=fondamentaux-du-deep-learning&p=architectures-cnn-rnn-transformers) de la sección [IA](/?c=ia) para el funcionamiento de los modelos subyacentes.

El hilo conductor es que un documento nunca es una sola cosa: una página de PDF mezcla texto realmente almacenado como tal (nativo, fiable de extraer) y contenido que solo existe en forma de imagen (escaneo, tabla compleja), que debe interpretarse visualmente antes de volverse explotable. Distinguir ambos, y saber cuándo pasar de uno a otro, es la pregunta que reaparece en cada capítulo de esta sección.

A continuación encontrarás las distintas nociones:
