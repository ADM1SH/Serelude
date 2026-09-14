# Serelude: Harmonic Canvas Art & Motion Experience

[![Type: Creative Coding](https://img.shields.io/badge/Type-Creative_Coding-FF69B4.svg)](https://github.com/ADM1SH/serelude)
[![Stack: Canvas/JS](https://img.shields.io/badge/Stack-Canvas_%7C_JavaScript-yellow.svg)](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

An interactive visual poem and canvas animation project where blooming lilies of the valley transform into a harmonic heart as light and motion dance together.

## Description
*Serelude* is the artistic successor to *Prelude*. It combines mathematical parametric curve rendering, organic particle physics, and ambient audio into an interactive digital celebration of love and art.

### Artistic & Technical Mechanics
* **Parametric Curve Morphing**: Computes mathematical heart geometries using parametric equations:
  $$x = 16 \sin^3(t)$$
  $$y = 13 \cos(t) - 5 \cos(2t) - 2 \cos(3t) - \cos(4t)$$
  interpolating points dynamically into blooming floral geometries.
* **Organic Particle Physics**: Hundreds of light particles with independent velocity vectors, damping factors, and gravitational attraction fields that respond to user interaction.
* **Ambient Lighting & Bloom**: Layered radial gradients and blend modes creating a glowing aesthetic without external WebGL libraries.

## Repository Structure
```text
Serelude/
├── css/            # Ambient dark aesthetic and typography styling
├── js/             # Parametric math, particle emitter, and canvas loop
├── index.html      # Main canvas presentation page
└── README.md       # Project documentation
```

## Requirements
* Any modern web browser with HTML5 Canvas and ES6 JavaScript support.

## Installation & Running
Clone the repository:
```bash
git clone https://github.com/ADM1SH/serelude.git
cd Serelude
```

Launch a local server:
```bash
python3 -m http.server 8000
```
Open `http://localhost:8000` in your web browser.

## Support
File issues or notes on the repository tracker:
https://github.com/ADM1SH/serelude/issues

## Roadmap
* [x] Parametric curve calculation and particle attraction.
* [x] Responsive canvas resizing across mobile and desktop.
* [x] Harmonic color palette transitions.
* [ ] Add Web Audio API procedural chime generation on click.

## Contributing
1. Fork the repository.
2. Create a branch: `git checkout -b feature/audio-chimes`.
3. Submit a Pull Request.

## Authors and Acknowledgment
* **Adam Anwar** (ADM1SH) - Creative author and programmer.

## License
MIT License. See `LICENSE` for details.

## Project Status
Completed artistic project. Preserved for interactive aesthetics and creative mathematics.
