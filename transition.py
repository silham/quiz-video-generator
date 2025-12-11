from moviepy import VideoFileClip, CompositeVideoClip, ColorClip, concatenate_videoclips, AudioFileClip, CompositeAudioClip, concatenate_audioclips
import os
import re
import numpy as np

def normalize_audio_volume(audio_clip, target_level=-40.0):
    """Normalize audio volume to a target dB level"""
    # Get audio array
    audio_array = audio_clip.to_soundarray()
    
    # Calculate RMS (root mean square) volume
    rms = np.sqrt(np.mean(audio_array**2))
    
    if rms > 0:
        # Convert to dB
        current_db = 20 * np.log10(rms)
        # Calculate gain needed
        gain_db = target_level - current_db
        gain_linear = 10 ** (gain_db / 20)
        
        # Apply gain (cap at reasonable levels)
        gain_linear = min(gain_linear, 10.0)  # Max 10x amplification
        
        # Use multiply_volume effect directly
        from moviepy.audio.fx.MultiplyVolume import MultiplyVolume
        return audio_clip.with_effects([MultiplyVolume(gain_linear)])
    
    return audio_clip

def join_two_clips_with_matte(clip1, clip2, matte_path, transition_duration=2.5, cover_time=1.0, transition_audio_path=None):
    """Join two video clips with a liquid matte transition"""
    # Load the matte video
    matte_clip = VideoFileClip(matte_path)
    
    # Use actual matte duration if shorter than requested
    TRANSITION_DURATION = min(transition_duration, matte_clip.duration)
    COVER_TIME = min(cover_time, TRANSITION_DURATION / 2)
    
    # Resize to match Video 1
    w, h = clip1.size
    clip2 = clip2.resized((w, h))
    matte_clip = matte_clip.resized((w, h))
    
    # Convert to grayscale mask (luminance-based transparency)
    matte = matte_clip.to_mask()

    # 2. Create the White Liquid Overlay
    # We create a solid white block and apply the matte as its transparency mask.
    # Result: A white blob that grows, holds, and shrinks.
    white_screen = ColorClip(size=(w, h), color=(255, 255, 255), duration=TRANSITION_DURATION)
    liquid_overlay = white_screen.with_mask(matte)

    # 3. Calculate Timings
    # We want the transition to start 1 second before Video 1 ends.
    # This ensures Video 1 ends exactly when the screen becomes fully white.
    transition_start_time = clip1.duration - COVER_TIME
    
    # Video 2 should start exactly when the screen is full white.
    # (We could delay it slightly into the hold, but starting at the full-cover point is safest)
    clip2_start_time = transition_start_time + COVER_TIME
    
    # 4. Position the Clips
    liquid_overlay = liquid_overlay.with_start(transition_start_time)
    clip2 = clip2.with_start(clip2_start_time)
    
    # 5. Composite
    # Layer Order is crucial:
    # - Bottom: Clip 1 (Plays first)
    # - Middle: Clip 2 (Starts playing when screen is white, covering Clip 1)
    # - Top: Liquid Overlay (Hides the cut between Clip 1 and Clip 2)
    final_video = CompositeVideoClip([clip1, clip2, liquid_overlay])
    
    # Set final duration - The total length is where Clip 2 ends
    final_video = final_video.with_duration(clip2_start_time + clip2.duration)
    
    # Add transition audio if provided
    if transition_audio_path and os.path.exists(transition_audio_path):
        transition_audio = AudioFileClip(transition_audio_path)
        # Trim or loop audio to match transition duration
        if transition_audio.duration > TRANSITION_DURATION:
            transition_audio = transition_audio.subclipped(0, TRANSITION_DURATION)
        elif transition_audio.duration < TRANSITION_DURATION:
            # Loop the audio if it's shorter
            loops_needed = int(TRANSITION_DURATION / transition_audio.duration) + 1
            transition_audio = concatenate_audioclips([transition_audio] * loops_needed).subclipped(0, TRANSITION_DURATION)
        
        # Position the transition audio at the transition start time
        transition_audio = transition_audio.with_start(transition_start_time)
        
        # Combine with existing audio
        if final_video.audio:
            final_audio = CompositeAudioClip([final_video.audio, transition_audio])
            final_video = final_video.with_audio(final_audio)
        else:
            final_video = final_video.with_audio(transition_audio)
    
    return final_video

def join_multiple_videos(folder_path, matte_path, output_path="output_combined.mp4", bg_music_paths=None, transition_audio_path=None, is_short=False):
    """Join all question videos in a folder with liquid transitions (Optimized)"""
    print(f"\n🚀 Starting Optimized Transition Script (Flattened Composition)...")
    if is_short:
        print("📱 Mode: Vertical Shorts/Reels (9:16)")
    
    # Find all question videos in the folder
    video_files = []
    if not os.path.exists(folder_path):
        print(f"Error: Folder '{folder_path}' not found.")
        return
    
    # Check for intro and outro
    intro_path = os.path.join(folder_path, 'intro.mp4')
    outro_path = os.path.join(folder_path, 'outro.mp4')
    has_intro = os.path.exists(intro_path)
    has_outro = os.path.exists(outro_path)
    
    # Get all files matching question-N.mp4 pattern
    for filename in os.listdir(folder_path):
        match = re.match(r'question-(\d+)\.mp4', filename)
        if match:
            video_files.append((int(match.group(1)), os.path.join(folder_path, filename)))
    
    # Sort by question number
    video_files.sort(key=lambda x: x[0])
    
    if len(video_files) == 0:
        print(f"No question videos found in '{folder_path}'")
        return
    
    print(f"Found {len(video_files)} question videos:")
    for num, path in video_files:
        print(f"  - Question {num}: {os.path.basename(path)}")
    
    if has_intro:
        print(f"  ✓ Intro: intro.mp4")
    if has_outro:
        print(f"  ✓ Outro: outro.mp4")
    print()
    
    # Load all clips
    clips = []
    
    # Add intro if exists
    if has_intro:
        print("Loading intro...")
        clips.append(VideoFileClip(intro_path))
    
    # Add question clips
    clips.extend([VideoFileClip(path) for num, path in video_files])
    
    # Add outro if exists
    if has_outro:
        print("Loading outro...")
        clips.append(VideoFileClip(outro_path))
    
    if len(clips) == 1:
        print("Only one video found, no transitions needed.")
        clips[0].write_videofile(
            output_path, 
            codec="libx264", 
            audio_codec="aac",
            threads=8,
            preset='ultrafast'
        )
        return

    # --- OPTIMIZED FLATTENED COMPOSITION ---
    print("Preparing composition...")
    
    # Master properties from first clip
    w, h = clips[0].size
    
    # Prepare Matte Overlay Master
    # We create one overlay and reuse it (by copying/time-shifting)
    matte_clip_orig = VideoFileClip(matte_path)
    
    if is_short:
        # Resize logic for Shorts (9:16)
        # If matte is 16:9 (e.g. 1920x1080), we need to cover 1080x1920
        # We resize height to match target height (1920), then center crop width to 1080
        target_h = h
        target_w = w
        
        # Resize maintaining aspect ratio to cover height
        if matte_clip_orig.h < target_h:
             matte_clip_orig = matte_clip_orig.resized(height=target_h)
        
        # If width is still too small (unlikely if 16:9 source), resize by width
        if matte_clip_orig.w < target_w:
             matte_clip_orig = matte_clip_orig.resized(width=target_w)
             
        # Center crop to target dimensions
        # Note: MoviePy v1 uses crop(x1=..., width=...), v2 might differ but we stick to basic resize for safety if crop is complex
        # Simple resize (stretch) is safer if we don't want to debug crop syntax across versions
        # But let's try to be smart: just resize to fill
        matte_clip_orig = matte_clip_orig.resized((w, h)) 
    else:
        matte_clip_orig = matte_clip_orig.resized((w, h))

    TRANSITION_DURATION = min(2.5, matte_clip_orig.duration)
    COVER_TIME = min(1.0, TRANSITION_DURATION / 2)
    
    # Create the mask and color clip once
    matte_mask = matte_clip_orig.to_mask()
    white_screen = ColorClip(size=(w, h), color=(255, 255, 255), duration=TRANSITION_DURATION)
    overlay_master = white_screen.with_mask(matte_mask)
    
    # Prepare Transition Audio Master
    transition_audio_master = None
    if transition_audio_path and os.path.exists(transition_audio_path):
        ta = AudioFileClip(transition_audio_path)
        # Loop/Trim logic
        if ta.duration > TRANSITION_DURATION:
            ta = ta.subclipped(0, TRANSITION_DURATION)
        elif ta.duration < TRANSITION_DURATION:
            loops = int(TRANSITION_DURATION / ta.duration) + 1
            ta = concatenate_audioclips([ta] * loops).subclipped(0, TRANSITION_DURATION)
        transition_audio_master = ta

    final_clips = []
    final_audio_clips = []
    current_time = 0.0
    
    print(f"Stitching {len(clips)} clips...")
    
    for i, clip in enumerate(clips):
        # Resize if needed
        if clip.size != (w, h):
            clip = clip.resized((w, h))
        
        # Add clip to timeline
        final_clips.append(clip.with_start(current_time))
        if clip.audio:
            final_audio_clips.append(clip.audio.with_start(current_time))
            
        # If not the last clip, add transition overlay
        if i < len(clips) - 1:
            # Overlay starts before current clip ends to cover the cut
            overlay_start = current_time + clip.duration - COVER_TIME
            final_clips.append(overlay_master.with_start(overlay_start))
            
            if transition_audio_master:
                final_audio_clips.append(transition_audio_master.with_start(overlay_start))
        
        current_time += clip.duration

    # Create final composite
    # We use a flat list of clips instead of recursive nesting
    final_video = CompositeVideoClip(final_clips, size=(w, h))
    final_video = final_video.with_duration(current_time)
    
    # Handle Audio
    if final_audio_clips:
        video_audio = CompositeAudioClip(final_audio_clips)
    else:
        video_audio = None
    
    # Add Background Music
    if bg_music_paths:
        print("\nAdding background music...")
        bg_tracks = []
        
        # Load all background music tracks
        for music_path in bg_music_paths:
            if os.path.exists(music_path):
                print(f"  Loading: {os.path.basename(music_path)}")
                audio_clip = AudioFileClip(music_path)
                
                # Normalize volume
                print(f"    Normalizing volume...")
                audio_clip = normalize_audio_volume(audio_clip, target_level=-40.0)
                
                bg_tracks.append(audio_clip)
        
        if bg_tracks:
            # Concatenate all music tracks
            print(f"  Combining {len(bg_tracks)} track(s)...")
            bg_music = concatenate_audioclips(bg_tracks)
            
            # Loop the music if video is longer
            if bg_music.duration < final_video.duration:
                loops_needed = int(final_video.duration / bg_music.duration) + 1
                print(f"  Looping music {loops_needed} time(s) to match video duration...")
                bg_music = concatenate_audioclips([bg_music] * loops_needed)
            
            # Trim to match video duration
            bg_music = bg_music.subclipped(0, final_video.duration)
            
            # Mix with existing audio
            if video_audio:
                print("  Mixing background music with video audio...")
                final_audio = CompositeAudioClip([video_audio, bg_music])
            else:
                final_audio = bg_music
            final_video = final_video.with_audio(final_audio)
    elif video_audio:
        final_video = final_video.with_audio(video_audio)
    
    # Render final video
    print("\nRendering final video (Optimized)...")
    
    # Try to use hardware acceleration if available (VideoToolbox for Mac)
    # Note: MoviePy uses libx264 by default. We can try to pass codec='h264_videotoolbox'
    # but it might require specific ffmpeg build. Safe bet is libx264 with ultrafast.
    
    final_video.write_videofile(
        output_path, 
        codec="libx264",
        audio_codec="aac",
        threads=16,  # Maximize threads for M4
        preset='ultrafast',  # Fastest encoding
        ffmpeg_params=[
            '-movflags', '+faststart',
            '-pix_fmt', 'yuv420p'
        ]
    )
    print(f"\n✅ Video saved to: {output_path}")

if __name__ == "__main__":
    import sys
    
    # Check command line arguments
    # We handle args later
    pass
    
    # Matte file path
    transition_blob = "luma.mp4"
    
    if not os.path.exists(transition_blob):
        print(f"Error: Matte file '{transition_blob}' not found.")
        sys.exit(1)
    
    # Check for transition audio
    transition_audio = "transition-audio.m4a"
    has_transition_audio = os.path.exists(transition_audio)
    
    if has_transition_audio:
        print(f"✓ Transition SFX found: {transition_audio}")
    else:
        print(f"ℹ No transition SFX found (looking for {transition_audio})")
        transition_audio = None
    
    # Look for background music files or folder
    bg_music_files = []
    bg_music_folder = "bg-music"
    
    # Check for bg-music folder first
    if os.path.exists(bg_music_folder) and os.path.isdir(bg_music_folder):
        print(f"✓ Background music folder found: {bg_music_folder}")
        # Get all audio files from folder
        audio_extensions = ['.mp3', '.m4a', '.wav', '.aac', '.flac']
        for filename in sorted(os.listdir(bg_music_folder)):
            if any(filename.lower().endswith(ext) for ext in audio_extensions):
                full_path = os.path.join(bg_music_folder, filename)
                bg_music_files.append(full_path)
                print(f"  - {filename}")
    else:
        # Fall back to looking for individual files
        bg_music_patterns = ['bg-music.mp3', 'bg-music.m4a', 'background-music.mp3', 'background-music.m4a']
        for pattern in bg_music_patterns:
            if os.path.exists(pattern):
                bg_music_files.append(pattern)
                print(f"✓ Background music found: {pattern}")
    
    if not bg_music_files:
        print("ℹ No background music found (create 'bg-music' folder with audio files or place bg-music.mp3)")
    
    # Check for --short flag
    is_short = "--short" in sys.argv
    
    # Clean args for path parsing (remove flags)
    args = [arg for arg in sys.argv[1:] if not arg.startswith("--")]
    
    if len(args) < 1:
        print("Usage: python transition.py <folder_path> [output_path] [--short]")
        sys.exit(1)
        
    folder_path = args[0]
    output_path = args[1] if len(args) > 1 else "output_combined.mp4"
    
    print()
    join_multiple_videos(
        folder_path, 
        transition_blob, 
        output_path, 
        bg_music_paths=bg_music_files if bg_music_files else None,
        transition_audio_path=transition_audio,
        is_short=is_short
    )