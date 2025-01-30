# Image Converter

[
    <img src="public/assets/icon.svg" width="100px" alt="App icon showing an image icon overlaying another."/>
](
   https://fauxsaurus.github.io/image-converter/
)

A simple, privacy-focused [image converter](https://fauxsaurus.github.io/image-converter/) that uses client-side JavaScript[^1] to convert images locally without ever sending them to a server.

## Features

-   Simultaneous Image Conversions/Downloads. (Note: a `.zip` file will be downloaded if multiple files are opened, but a single image file will be downloaded if only one image is provided.)
-   Transparent Background Replacement. (Note: This will not transform solid color backgrounds into a different color. Rather, all completely transparent pixels will be replaced with the selected background color.)
-   Adjustable Compression Quality. JPEGs and WEBPs use [Lossy Compression](https://en.wikipedia.org/wiki/Lossy_compression) to drastically decrease file sizes at the cost of quality. _Typically_ there is no perceptible drop from the 70%-80% range, but that will vary from image to image--thus, said option is provided for relevant output formats.

## Output Format Support

Support is based on open web standards. Thus, the following are currently[^2] available:

-   JPEG
-   PNG
-   WEBP (for all [_non_-Safari browsers](https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toBlob#browser_compatibility), circa January 30th, 2025. Come on, Apple...)

## Input Format Support

If a browser can open it, this app can convert it[^3]. Thus, _all_ of the following can be converted to _any_ of the supported output formats above.

Note: The app's background is dynamically generated based on input format support. Thus, if a given file format does not appear in the background, said browser cannot open it.

-   AVIF
-   BMP
-   GIF
-   ICO[^4]
-   JPEG
-   PNG
-   SVG
-   WEBP

[^1]: Via the `canvas.toBlob()` API (see [docs](https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toBlob)).
[^2]: _Technically_ Firefox also supports ICO outputs, but those are a can of worms (i.e., a single `.ico` file can contain _multiple_ images (at varying resolutions)), but that is non-standard and this is an 80:20 project that should already satisfy 99.99% of use cases. _But_, ICO support could [definitely be added](https://github.com/fauxsaurus/image-converter/issues/3).
[^3]: _Technically_ Safari browsers support the HEIC format, but due to [licensing issues](https://caniuse.com/heif), said format is not widely adopted and is largely redundant with the advent of AVIF and JPEG XL. Thus, this app does not currently test for/allow that format, but that could [change in the future](https://github.com/fauxsaurus/image-converter/issues/4).
[^4]: Note: As stated previously, ICO files can contain multiple images. Presumably, browsers select the largest one (or the one closest to the specified resolution), but I have not tested that and am uncertain of how the underlying process works, so your mileage may vary when generating `.ico` files.
