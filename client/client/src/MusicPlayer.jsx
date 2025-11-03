// --- client/src/MusicPlayer.jsx ---

import { useState, useRef } from 'react';

// THIS IS THE NEW, WORKING LINK
const musicUrl = "https://pixabay.com/music/vintage-smooth-instrumental-jazz-music-349777/";

function MusicPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);

  const togglePlay = () => {
    // F12 Console Debug: Check that the click is firing
    console.log("Toggle play clicked. Current state:", isPlaying);

    if (isPlaying) {
      // If it IS playing, we want to pause it
      audioRef.current.pause();
      setIsPlaying(false);
      console.log("Music paused.");
    } else {
      // If it is NOT playing, we want to play it
      
      // 1. Force the audio element to load the media.
      audioRef.current.load();
      
      // 2. Call play(), which returns a promise.
      const playPromise = audioRef.current.play();

      if (playPromise !== undefined) {
        playPromise.then(() => {
          // Playback started successfully!
          console.log("Playback started successfully.");
          setIsPlaying(true);
        }).catch(error => {
          // Playback failed (e.g., browser block or other error)
          console.error("Audio playback failed:", error);
          
          // Show an alert so the user knows there's an issue
          alert("Could not play audio. Please check your browser's permissions or try clicking again.");
          
          setIsPlaying(false); // Ensure state is correct
        });
      }
    }
  };

  return (
    <div>
      <audio 
        ref={audioRef} 
        src={musicUrl} 
        loop 
      />

      <button className="music-player-button" onClick={togglePlay}>
        {isPlaying ? 'Mute Music' : 'Play Music'}
      </button>
    </div>
  );
}

export default MusicPlayer;