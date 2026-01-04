# VillageCraft
Village Craft is a game developed in the form of a web app, specifically addressing problem statement 1704 of the Smart India Hackathon 2024. Me and my team and JavaChip qualified for the Grand Finale and presented this project on the big stage. Our main aim was the gamification of rural development. The goal was to educate the village youth on the development of their lands, so they can understand and openly give their suggestions to the Gram Panchayat. While this project is not in its finished and polished form, this repository consists of the front end and the main logic of the game. The user data is stored on our college servers.

Many droneland image survey maps were provided by the Ministry of Panchayti Raj. We extracted one of the maps and hosted it in our game. We used the Three.js JavaScript library for game logic like placing objects and hosting the map. 

The game is hosted as a website/webapp on Vercel. We decided to create a web app so it can be easily supported across platforms. The webapp is installable on Windows, Linux, and Android OS.

[Click](https://village-craft.vercel.app/) to go to the game.

## Project Structure
The project has been organized into the following structure:
- **css/**: Stylesheets
- **js/**: JavaScript files
- **assets/**: Images and textures
- **models/**: 3D GLB models
- **Root**: HTML files (`index.html`, `login.html`, etc.)

## How to Run Locally

Since this project uses ES Modules (importing Three.js maps), you must serve it via a local web server. You cannot simply open the `index.html` file in a browser.

### Option 1: Using Python (Recommended)
If you have Python installed:
1. Open a terminal in the project directory.
2. Run one of the following commands:
   ```bash
   # Python 3
   python -m http.server 8000
   
   # Python 2
   python -m SimpleHTTPServer 8000
   ```
3. Open your browser and go to `http://localhost:8000`.

### Option 2: Using Node.js (serve)
If you have Node.js installed:
1. Install `serve` globally (optional) or use `npx`:
   ```bash
   npx serve .
   ```
2. Open the URL shown in the terminal (usually `http://localhost:3000`).

### Option 3: VS Code Live Server
If you use Visual Studio Code:
1. Install the "Live Server" extension.
2. Right-click `index.html`.
3. Select "Open with Live Server".
