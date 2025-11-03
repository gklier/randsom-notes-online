// --- client/src/MusicPlayer.jsx ---

import { useState, useRef, useEffect } from 'react';
import { Howl } from 'howler'; // <-- Import Howler

// The working music URL
const musicUrl = "https://pixabay.com/music/vintage-smooth-instrumental-jazz-music-349777/";

// Create the Howl object.
// We use a ref to make sure it's only created once.
let sound = null;

function MusicPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);

  // Initialize the sound ref only if it's null
  if (!sound) {
    sound = new Howl({
      src: [musicUrl],
      html5: true,  // Forces HTML5 Audio, helps with browser policies
      loop: true,   // We want it to loop
      volume: 0.2,  // Start at a reasonable volume
    });
  }

  const togglePlay = () => {
    // F12 Console Debug
    console.log("Toggle play clicked. Current state:", isPlaying);

    if (isPlaying) {
      sound.pause();
      setIsPlaying(false);
      console.log("Howler: Music paused.");
    } else {
      // Howler handles all the complex promise/error logic internally
      sound.play();
      setIsPlaying(true);
      console.log("Howler: Music playing.");
    }
  };

  return (
    <div>
      {/* We no longer need the <audio> tag at all! */}
      <button className="music-player-button" onClick={togglePlay}>
        {isPlaying ? 'Mute Music' : 'Play Music'}
      </button>
    </div>
  );
}

export default MusicPlayer;