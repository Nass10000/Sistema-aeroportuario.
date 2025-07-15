# La Caffettiera (Cafeteria.py)

## Descripción

**La Caffettiera** es un sitio web de ejemplo para una cafetería, desarrollado con el framework Django. El proyecto muestra cómo construir una página corporativa multi-sección que incluye inicio, secciones de servicios, blog, páginas informativas y formulario de contacto. Su propósito principal es educativo, sirviendo como práctica para aprender Django y buenas prácticas de desarrollo web. *Nota:* Este proyecto es de carácter didáctico y no está destinado para entornos de producción.

## Tecnologías usadas

* **Python 3** y **Django** (framework web de Python) para el desarrollo del backend.
* **Base de datos SQLite** utilizada por defecto durante el desarrollo.
* **HTML5**, **CSS3** y **Bootstrap 4** para el diseño responsivo de la interfaz (tema "Business Casual").
* **JavaScript** (incluyendo **jQuery**) para funcionalidad interactiva en el frontend.
* **Django CKEditor** para campos de texto enriquecido en el panel de administración (gestión de contenido).
* **Font Awesome** para el uso de iconos vectoriales escalables en la interfaz.
* **SMTP (correo electrónico)** configurado para el envío de mensajes desde el formulario de contacto.

## Instalación y ejecución

1. **Clonar el repositorio:** Descarga o clona este repositorio en tu máquina local usando `git clone`.
2. **Entorno virtual:** (Opcional) Crea un entorno virtual de Python e instálalo/actívalo para aislar las dependencias.
3. **Instalar dependencias:** En el entorno, instala Django y las demás dependencias requeridas. Por ejemplo:

   ```bash
   pip install django django-ckeditor Pillow
   ```

   *(Pillow es necesaria para el manejo de imágenes en Django.)*
   Si cuentas con un archivo de requerimientos, también puedes usar `pip install -r requirements.txt`.
4. **Configuración del correo (opcional):** Para habilitar el envío de emails desde el formulario de contacto, crea un archivo **`email_settings.json`** en la raíz del proyecto con las credenciales SMTP apropiadas (host, usuario, contraseña, puerto, etc.) según lo esperado en `webempresa/settings.py`. Alternativamente, ajusta la configuración de email directamente en dicho archivo de settings.
5. **Migraciones de base de datos:** Ejecuta las migraciones para crear la base de datos y las tablas necesarias:

   ```bash
   python manage.py migrate
   ```
6. **Usuario administrador:** (Opcional) Crea un superusuario para acceder al panel de administración de Django:

   ```bash
   python manage.py createsuperuser
   ```

   Sigue las instrucciones para definir usuario y contraseña.
7. **Ejecutar el servidor de desarrollo:** Inicia el servidor local de Django:

   ```bash
   python manage.py runserver
   ```

   Luego abre tu navegador en **[http://127.0.0.1:8000/](http://127.0.0.1:8000/)** para ver el sitio en funcionamiento. Si creaste un superusuario, puedes acceder al panel de administración en **[http://127.0.0.1:8000/admin/](http://127.0.0.1:8000/admin/)**.

## Funcionalidades principales

* **Página de inicio e información general:** Página de **Inicio** destacando la marca *La Caffettiera* con un diseño atractivo, incluyendo un eslogan, imágenes y llamada a la acción. Además cuenta con secciones estáticas como **Historia** (página "Acerca de nosotros") y **Visítanos** (información de ubicación/tienda), que presentan contenido informativo estático sobre la cafetería.
* **Gestión de servicios:** Sección **Servicios** que muestra una lista de servicios o productos ofrecidos por la cafetería (por ejemplo, tipos de café, postres, etc.). Estos contenidos se cargan desde la base de datos mediante el modelo `Service` y pueden administrarse desde el panel de admin.
* **Blog con categorías:** Módulo de **Blog** donde se pueden publicar entradas de blog con título, contenido, imagen y fecha de publicación. Cada **entrada** (modelo `Post`) puede asociarse a una o varias categorías temáticas para organizar el contenido. Los visitantes pueden navegar todas las entradas del blog en la página principal del blog o filtrarlas por categoría (ej. noticias, recetas, novedades).
* **Páginas dinámicas personalizadas:** Incluye un gestor de **páginas informativas** genéricas. A través del modelo `Page` en la aplicación *pages*, los administradores pueden crear nuevas páginas de contenido (con texto enriquecido gracias a CKEditor) desde el panel de administración. Estas páginas adicionales se listan automáticamente en el pie de página del sitio y son accesibles públicamente vía URLs del estilo **`/page/<id>/`**, permitiendo añadir contenido estático (como términos y condiciones, políticas, etc.) sin necesidad de código.
* **Formulario de contacto:** Sección **Contacto** con un formulario donde los usuarios pueden enviar un mensaje (nombre, email y contenido del mensaje). Al enviarse, la aplicación utiliza la configuración SMTP para mandar un correo electrónico real con los datos proporcionados. El sitio muestra mensajes de confirmación (éxito o error) tras intentar enviar el formulario. Esto permite a la cafetería recibir consultas o comentarios de los visitantes.
* **Integración de redes sociales:** El proyecto está preparado para gestionar enlaces a redes sociales de la cafetería mediante el modelo `Link` en la aplicación *social*. Estos enlaces (por ejemplo, Facebook, Twitter, Instagram) se pueden definir desde el admin y podrían mostrarse en la página (por ejemplo, en el pie de página o sección de contacto) para que los usuarios puedan seguir a la cafetería en distintas plataformas.
* **Panel de administración:** Gracias a Django Admin, un administrador del sitio puede gestionar todo el contenido dinámico mencionado (servicios, posts del blog, categorías, páginas adicionales y enlaces de redes sociales) de forma gráfica. Esto facilita la edición y actualización del contenido de la web sin modificar el código.

## Créditos

* Proyecto desarrollado por **Nassim Wessin** como parte de un ejercicio práctico para aprender Django.
* Inspirado en un ejemplo educativo; la interfaz está basada en la plantilla gratuita **"Business Casual"** de Start Bootstrap (© 2013-2018 Blackrock Digital), adaptada para este proyecto. Se agradece a sus creadores por el diseño disponible bajo licencia MIT.
* Iconos proporcionados por **Font Awesome**.
