# **App Name**: Neon Serpent

## Core Features:

- Classic Snake Engine: Implements core snake mechanics: responsive movement with arrow/WASD keys, collision detection (walls, self), score increment on food consumption, snake growth, and intelligent food respawning within the grid.
- Canvas Rendering & Visual Effects: Utilizes HTML5 Canvas API for drawing the game world, including a subtle grid, the snake with a neon glow, animated pulsing food, and smooth background elements like particles or gradients, all optimized with `requestAnimationFrame` for consistent frame rates.
- Game State and UI Management: Manages distinct game states such as start, active gameplay, and game over. Provides intuitive UI elements including a top HUD displaying current score, persistent high score (stored locally using browser localStorage), a clear start screen, and a game over overlay with restart functionality.
- Mobile Touch Controls: Ensures playability on mobile devices by integrating simple touch controls, enabling players to direct the snake via swipe gestures or on-screen directional buttons.
- Immersive Audio Feedback: Enhances the arcade experience with sound effects for key in-game events, suchs as eating food and signaling a game over, providing clear auditory feedback to the player.

## Style Guidelines:

- Primary color: A vibrant Neon Red (#FF3366) for the snake's glow and interactive UI elements, evoking a classic arcade feel against the dark backdrop.
- Background color: Deep Charcoal (#111718). This very dark, almost black, color with a subtle cool undertone ensures that the neon elements stand out prominently, establishing the requested arcade-style theme.
- Accent color: A luminous Neon Yellow (#FFFF33). Used for pulsing food, score displays, and subtle highlights, this energetic yellow provides clear visual feedback.
- Grid color: A subtle, almost translucent Grass-Green neon (#33FF99) for the game grid, ensuring visibility without distracting from the main gameplay elements.
- Headline and body font: 'Space Grotesk' (sans-serif). Its computerized and techy aesthetic perfectly aligns with the arcade theme, suitable for scores, game titles, and all other text elements due to its versatile legibility for both short bursts and longer phrases.
- Employ minimalistic, glowing icon designs for UI elements such as play/pause buttons, maintaining visual consistency with the neon aesthetic. Icons should have crisp edges and a subtle radiance effect.
- The game canvas will be centrally aligned, occupying the primary visual focus. A compact, unobtrusive HUD for scores will be positioned at the top. Full-screen overlays will be used for start and game over screens to maximize immersion, and mobile controls will be clearly visible but not obstructive.
- Implement a continuous, subtle neon glow effect around the snake and a gentle pulse animation for the food to enhance visual engagement. UI transitions, such as opening the game over screen, will utilize smooth CSS animations to maintain a fluid, polished user experience. Background elements like particles or animated gradients will move subtly to create depth.