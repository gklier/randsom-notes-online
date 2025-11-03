// --- client/src/MusicPlayer.jsx ---

import { useState, useRef } from 'react'; // No useEffect needed

// A direct link to a royalty-free smooth jazz loop
const musicUrl = "https://cdn.pixabay.com/audio/2022/03/18/audio_8b28f11822.mp3";

function MusicPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);

  // This function is now the only thing we need
  const togglePlay = () => {
    if (isPlaying) {
      // If it IS playing, we want to pause it
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      // If it is NOT playing, we want to play it
      try {
        // We call .play() directly inside the click event
        audioRef.current.play();
        setIsPlaying(true);
      } catch (error) {
        console.error("Audio play failed. User may need to interact again.", error);
      }
    }
  };
  
  // The useEffect hook has been removed

  return (
    <div>
      {/* The HTML audio element */}
      <audio ref={audioRef} src={musicUrl} loop />

      {/* This button now directly controls the audio */}
      <button className="music-player-button" onClick={togglePlay}>
        {isPlaying ? 'Mute Music' : 'Play Music'}
      </button>
    </div>
  );
}

export default MusicPlayer;