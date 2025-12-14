<!-- PROJECT TITLE -->
# Tailwind Breakpoint Resizer {#top}

A Chrome extension to resize viewport to Tailwind v4 breakpoints +
show overlay on the page with current breakpoint.

<!--toc:start-->
- [Tailwind Breakpoint Resizer {#top}](#tailwind-breakpoint-resizer-top)
  - [About](#about)
    - [Features](#features)
  - [Installation](#installation)
  - [Usage](#usage)
  - [Contact](#contact)
<!--toc:end-->

<!-- ABOUT -->
## About

A Chrome extension that simulates Tailwind CSS breakpoints directly inside
DevTools’ responsive layout.  
It provides a popup with breakpoint buttons (sm, md, lg, xl, 2xl).
It also includes aspect ratio presets.
A live widget overlay shows the current viewport size and
the active breakpoint.

([back to top](#top))

### Features

- Quick breakpoint emulation using Chrome DevTools Protocol
- Aspect ratio presets (16:9, 16:10, 3:2, 4:3)
- Overlay widget displaying viewport dimensions and active Tailwind breakpoint
- Popup UI for selecting breakpoints and custom heights

([back to top](#top))

<!-- INSTALLATION -->
## Installation

1. Clone the repo

   ```sh
   git clone https://github.com/hayderhassan/TailwindBreakpointResizer.git
   ```

2. Install NPM packages

   ```sh
   npm install
   ```

3. Build the extension

   ```sh
   npm run build
   ```

4. Load the `dist/` folder as an unpacked extension in Chrome

([back to top](#top))

<!-- USAGE -->
## Usage

- Open DevTools and enable responsive mode.
- Use the popup or widget to apply Tailwind breakpoints.
- The overlay updates live with viewport size and breakpoint.

([back to top](#top))

<!-- CONTACT -->
## Contact

Hayder Hassan - [hayderh@gmail.com](hayderh@gmail.com)

Project Link: [https://github.com/hayderhassan/TailwindBreakpointResizer](https://github.com/hayderhassan/TailwindBreakpointResizer)

([back to top](#top))
