---
name: CocinaOS
description: Inventario de cocina profesional, claro y a la vista.
colors:
  primary: "oklch(0.26 0.09 250)"
  surface: "oklch(0.99 0.005 240)"
  text: "oklch(0.18 0.04 250)"
  border: "oklch(0.90 0.015 245)"
  landing-navy: "#112747"
  landing-paper: "#f7f8f7"
  landing-capsule: "#eff4f8"
typography:
  display:
    fontFamily: "Figtree, sans-serif"
    fontSize: "clamp(46px, 3.8vw, 62px)"
    fontWeight: 660
    lineHeight: 1.05
    letterSpacing: "-0.035em"
  body:
    fontFamily: "Figtree, sans-serif"
    fontSize: "16px"
    lineHeight: 1.62
rounded:
  control: "999px"
  card: "20px"
  inner: "12px"
components:
  landing-button:
    backgroundColor: "{colors.landing-navy}"
    textColor: "#fff"
    padding: "0 22px"
    height: "46px"
    borderRadius: "999px"
---

# Design System: CocinaOS

## Overview

**Creative North Star: "El registro a la vista"**

CocinaOS combina un área operativa clara con una portada minimalista y utilitaria alineada con su barra de navegación en isla flotante. Las cantidades, unidades y estados son el contenido visual; la decoración no compite con ellos. La interfaz permanece íntegramente en español.

**Key Characteristics:**
- Lienzo claro continuo (`#f7f8f7`), contenedores isla blancos (`#ffffff`) con bordes estructurales de `1px solid #dce3e9` y cápsulas internas (`#eff4f8`).
- Tipografía Figtree con números tabulares fáciles de comparar en columna.
- Estados de existencias y disponibilidad mediante píldoras en tonos pastel desaturados, siempre acompañados de texto explícito.

## Colors

El azul profundo (`#112747`) estructura la navegación activa y las acciones principales; el lienzo claro (`#f7f8f7`) y las superficies blancas dejan aire al registro de inventario.

**Semantic Muted Pastels:**
- **Disponible / Correcto:** Verde pálido (`#edf3ec` con texto `#26592b`).
- **Stock bajo / Atención:** Ámbar pálido (`#fbf3db` con texto `#8a5700`).
- **Próximamente / Conceptual:** Azul pálido (`#e1f3fe` con texto `#1c608f`).
- **Fricción / Alerta:** Rojo pálido (`#fdebec` con texto `#962b29`).

**The Stock First Rule.** El estado de una fila o módulo debe leerse sin depender solo del color: siempre lleva texto claro dentro de su píldora semántica.

## Typography

Figtree sirve tanto los titulares expresivos de la portada como los controles compactos del producto. Los títulos mantienen un tracking cerrado (`-0.035em`); las filas, cantidades y precios emplean `font-variant-numeric: tabular-nums`.

## Layout & Theme Lock

La portada mantiene un único tema claro continuo (`Page Theme Lock`), sin bandas oscuras que inviertan el modo a mitad o final de página. Alterna una presentación asimétrica con ventana de producto estilo OS, un Bento comparativo, un flujo de 4 etapas, tabla documento de inventario, escandallo editorial y Bento operativo; bajo `900px` y `640px`, las composiciones colapsan limpiamente a una sola columna.

## Elevation & Shapes (`Shape Consistency Lock`)

La portada sigue la geometría de su barra de navegación flotante:
- **Controles interactivos, botones CTA y badges:** Píldora completa (`border-radius: 999px`).
- **Tarjetas e islas principales:** Esquinas redondeadas suaves (`border-radius: 20px`) con borde de `1px solid #dce3e9` y sombra difusa de baja opacidad.
- **Sub-paneles y celdas internas:** `border-radius: 12px` sobre superficie `#eff4f8`.

## Do's and Don'ts

### Do:
- **Do** mostrar cantidades con su unidad y estado escrito en píldoras pastel.
- **Do** mantener un único texto por intención de CTA (`Solicitar demo` y `Abrir aplicación`).

### Don't:
- **Don't** presentar datos ilustrativos como datos reales del cliente.
- **Don't** superponer etiquetas sobre fotografías ni usar rayas (`—`) o puntos medios decorativos (`·`).

## Carta de clientes

La carta combina tarjetas con fotografías disponibles y estados de stock explícitos en un único catálogo continuo donde platos y productos conviven en la misma cuadrícula (hasta 4 columnas en pantallas amplias). En escritorio, la cabecera superior aloja el isotipo y logotipo `CocinaOS` a la izquierda, el buscador centrado (`Limpiar búsqueda` interno al escribir) y las acciones de carrito y menú desplegable de perfil (con datos del cliente y cierre de sesión) a la derecha. En móvil (`< 640px`), la cabecera se compacta en una sola fila con `CocinaOS` a la izquierda y los botones de búsqueda (`Abrir buscador`), carrito compacto (`({count})`) y perfil a la derecha; al pulsar la lupa, la cabecera pasa a un modo de búsqueda enfocado a ancho completo con botón de borrado (`Limpiar búsqueda`) y acción `Cancelar`. Sobre la cuadrícula, una barra horizontal de filtros en píldoras (`Todo`, `Platos`, `Productos`, categorías y disponibilidad) —deslizable en una línea en móvil— permite acotar el catálogo en vivo. El carrito funciona bajo demanda: en escritorio se despliega en una isla flotante (`rounded-[20px]`, borde `#dce3e9`) anclada directamente bajo el botón de cabecera sin oscurecer ni difuminar el fondo (`Page Theme Lock`), permitiendo continuar añadiendo o ajustando artículos de la carta en tiempo real; en móvil (`< 640px`) se presenta como una hoja inferior (*Bottom Sheet*, `rounded-t-[20px]`) anclada al borde inferior con fondo atenuado tocable para cerrar, ocultando temporalmente la barra flotante de selección mientras permanece abierta.
