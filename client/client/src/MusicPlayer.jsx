// --- client/src/MusicPlayer.jsx ---

import { useState, useRef, useEffect } from 'react';

// A direct link to a royalty-free smooth jazz loop
const musicUrl = "https://cdn.pixabay.com/audio/2022/03/18/audio_8b28f11822.mp3";

function MusicPlayer() {
  // We use useState to track if music is playing
  const [isPlaying, setIsPlaying] = useState(false);

  // We use a ref to hold a reference to the <audio> element
  const audioRef = useRef(null);

  // This effect runs when the 'isPlaying' state changes
  useEffect(() => {
    if (isPlaying) {
      // If we want to play, start the audio
      audioRef.current.play();
    } else {
      // If we want to pause, pause the audio
      audioRef.current.pause();
    }
  }, [isPlaying]); // This effect depends on the 'isPlaying' state

  const togglePlay = () => {
    // This flips the state from true to false or false to true
    setIsPlaying(!isPlaying);
  };

  return (
    <div>
      {/* The HTML audio element
        - 'ref' connects it to our audioRef
        - 'loop' makes it play continuously
        - 'src' is the link to the music
      */}
      <audio ref={audioRef} src={musicUrl} loop />

      {/* This is our button
        - 'onClick' calls our toggle function
        - 'className' is for styling
        - The text changes based on the 'isPlaying' state
      */}
      <button className="music-player-button" onClick={togglePlay}>
        {isPlaying ? 'Mute Music' : 'Play Music'}
      </button>
    </div>
  );
}

export default MusicPlayer;