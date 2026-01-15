import os
from google.cloud import texttospeech
from google.oauth2 import service_account

# ================= CONFIGURATION =================
# 1. Path to your downloaded JSON key file
SERVICE_ACCOUNT_FILE = 'service-account.json'

# 2. Output filename
OUTPUT_FILE = 'smartify_output.mp3'

# 3. The SSML text with phonetic pronunciation
# Note: We use "ssml" to ensure the tags are processed.
SSML_INPUT = """
<speak>
  <prosody rate="medium" pitch="+4st" volume="loud">
    Welcome to <phoneme alphabet="ipa" ph="ˈsmɑɹt.ɪ.faɪ">smartify</phoneme>!
  </prosody>
</speak>
"""
# =================================================

def synthesize_speech():
    # Verify the JSON file exists
    if not os.path.exists(SERVICE_ACCOUNT_FILE):
        print(f"Error: Could not find {SERVICE_ACCOUNT_FILE}. Make sure the path is correct.")
        return

    # Authenticate using the service account file
    credentials = service_account.Credentials.from_service_account_file(SERVICE_ACCOUNT_FILE)
    client = texttospeech.TextToSpeechClient(credentials=credentials)

    # Set the text input to be synthesized (using SSML)
    synthesis_input = texttospeech.SynthesisInput(ssml=SSML_INPUT)

    # Build the voice request, select the specific Chirp 3 Achernar voice
    voice = texttospeech.VoiceSelectionParams(
        language_code="en-US",
        name="en-US-Chirp3-HD-Achernar" 
    )

    # Select the type of audio file you want returned
    audio_config = texttospeech.AudioConfig(
        audio_encoding=texttospeech.AudioEncoding.MP3
    )

    print("Sending request to Google Cloud...")
    
    try:
        response = client.synthesize_speech(
            input=synthesis_input, voice=voice, audio_config=audio_config
        )

        # The response's audio_content is binary.
        with open(OUTPUT_FILE, "wb") as out:
            out.write(response.audio_content)
            print(f"✅ Success! Audio content written to '{OUTPUT_FILE}'")
            
    except Exception as e:
        print(f"❌ Error occurred: {e}")

if __name__ == "__main__":
    synthesize_speech()