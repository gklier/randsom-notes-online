// --- client/src/MusicPlayer.jsx ---

import { useState, useRef } from 'react';

const musicUrl = "https://cdn.pixabay.com/audio/2022/03/18/audio_8b28f11822.mp3";

function MusicPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);

  const togglePlay = () => {
    // This is a crucial debug step.
    // Press F12 in your browser to open the console and see this message.
    console.log("Toggle play clicked. Current state:", isPlaying);

    if (isPlaying) {
      // If it IS playing, we want to pause it
      audioRef.current.pause();
      setIsPlaying(false);
      console.log("Music paused.");
    } else {
      // If it is NOT playing, we want to play it
      // .play() returns a Promise. We must handle it.
      const playPromise = audioRef.current.play();

      if (playPromise !== undefined) {
        playPromise.then(() => {
          // Playback started successfully!
          console.log("Music is playing.");
          setIsPlaying(true);
        }).catch(error => {
          // Playback failed (e.g., browser block or other error)
          console.error("Audio playback failed:", error);
          setIsPlaying(false); // Ensure state is correct
        });
      }
    }
  };

  return (
    <div>
      {/* We add preload="auto" to hint the browser 
        to load the file as soon as possible.
      */}
      <audio 
        ref={audioRef} 
        src={musicUrl} 
        loop 
        preload="auto" 
      />

      <button className="music-player-button" onClick={togglePlay}>
        {isPlaying ? 'Mute Music' : 'Play Music'}
      </button>
    </div>
  );
}

export default MusicPlayer;