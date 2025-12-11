#!/usr/bin/env python3
"""
Video Publishing Script
Publishes videos to Facebook Page and YouTube Channel
"""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv
import json

# Load environment variables
load_dotenv()

def upload_to_youtube(video_path, title, description, tags=None, category_id="27", privacy="public"):
    """
    Upload video to YouTube using YouTube Data API v3
    
    Args:
        video_path: Path to the video file
        title: Video title
        description: Video description
        tags: List of tags (optional)
        category_id: YouTube category ID (27 = Education, 24 = Entertainment)
        privacy: Privacy status (public, private, unlisted)
    """
    try:
        from google.oauth2.credentials import Credentials
        from google_auth_oauthlib.flow import InstalledAppFlow
        from google.auth.transport.requests import Request
        from googleapiclient.discovery import build
        from googleapiclient.http import MediaFileUpload
        import pickle
        
        print("\n📹 Uploading to YouTube...")
        print(f"  Title: {title}")
        print(f"  Privacy: {privacy}")
        
        # YouTube API scopes
        SCOPES = ['https://www.googleapis.com/auth/youtube.upload']
        
        creds = None
        token_file = 'youtube_token.pickle'
        
        # Load saved credentials
        if os.path.exists(token_file):
            with open(token_file, 'rb') as token:
                creds = pickle.load(token)
        
        # If credentials are invalid or don't exist, get new ones
        if not creds or not creds.valid:
            if creds and creds.expired and creds.refresh_token:
                print("  Refreshing YouTube credentials...")
                creds.refresh(Request())
            else:
                # Get credentials from environment or OAuth flow
                client_secrets_file = os.getenv('YOUTUBE_CLIENT_SECRETS', 'youtube_client_secrets.json')
                
                if not os.path.exists(client_secrets_file):
                    print(f"\n❌ YouTube OAuth not configured")
                    print(f"  Please create {client_secrets_file} with your OAuth credentials")
                    print("  Get credentials from: https://console.cloud.google.com/apis/credentials")
                    return None
                
                flow = InstalledAppFlow.from_client_secrets_file(client_secrets_file, SCOPES)
                print("\n⚠️  Opening browser for authentication...")
                print("If browser doesn't open, copy the URL from the terminal and paste in browser.")
                print("\nIMPORTANT: Make sure http://localhost:8080/ is added to")
                print("Authorized redirect URIs in Google Cloud Console.\n")
                creds = flow.run_local_server(port=8080, prompt='consent')
            
            # Save credentials for next time
            with open(token_file, 'wb') as token:
                pickle.dump(creds, token)
        
        # Build YouTube API client
        youtube = build('youtube', 'v3', credentials=creds)
        
        # Prepare video metadata
        body = {
            'snippet': {
                'title': title,
                'description': description,
                'tags': tags or [],
                'categoryId': category_id
            },
            'status': {
                'privacyStatus': privacy,
                'selfDeclaredMadeForKids': False
            }
        }
        
        # Create media upload
        media = MediaFileUpload(video_path, chunksize=-1, resumable=True)
        
        # Execute upload
        print("  Uploading... (this may take a while)")
        request = youtube.videos().insert(
            part='snippet,status',
            body=body,
            media_body=media
        )
        
        response = None
        while response is None:
            status, response = request.next_chunk()
            if status:
                progress = int(status.progress() * 100)
                print(f"  Progress: {progress}%", end='\r')
        
        video_id = response['id']
        video_url = f"https://www.youtube.com/watch?v={video_id}"
        
        print(f"\n✅ YouTube upload complete!")
        print(f"  Video ID: {video_id}")
        print(f"  URL: {video_url}")
        
        return {
            'platform': 'youtube',
            'video_id': video_id,
            'url': video_url
        }
        
    except ImportError:
        print("\n❌ YouTube upload requires additional packages:")
        print("  pip install google-auth google-auth-oauthlib google-auth-httplib2 google-api-python-client")
        return None
    except Exception as e:
        print(f"\n❌ YouTube upload failed: {str(e)}")
        return None


def upload_to_facebook(video_path, message, page_id=None, access_token=None):
    """
    Upload video to Facebook Page using Graph API
    
    Args:
        video_path: Path to the video file
        message: Post caption/description
        page_id: Facebook Page ID (from env if not provided)
        access_token: Facebook Page Access Token (from env if not provided)
    """
    try:
        import requests
        
        print("\n📘 Uploading to Facebook...")
        
        # Get credentials from environment if not provided
        page_id = page_id or os.getenv('FACEBOOK_PAGE_ID')
        access_token = access_token or os.getenv('FACEBOOK_ACCESS_TOKEN')
        
        if not page_id or not access_token:
            print("❌ Facebook credentials not configured")
            print("  Set FACEBOOK_PAGE_ID and FACEBOOK_ACCESS_TOKEN in .env")
            print("\n  Setup Instructions:")
            print("  1. Go to: https://developers.facebook.com/tools/explorer/")
            print("  2. Select your app")
            print("  3. Get Token → Get Page Access Token")
            print("  4. Select your page and grant these permissions:")
            print("     - pages_manage_posts")
            print("     - pages_read_engagement")
            print("     - publish_video")
            print("  5. Copy the token to .env as FACEBOOK_ACCESS_TOKEN")
            return None
        
        print(f"  Page ID: {page_id}")
        print(f"  Message: {message[:50]}...")
        
        # Use /me/videos endpoint which works with page access token
        url = f"https://graph.facebook.com/v18.0/me/videos"
        
        # Get file size
        file_size = os.path.getsize(video_path)
        print(f"  File size: {file_size / (1024*1024):.2f} MB")
        
        # Upload video
        print("  Uploading... (this may take a while)")
        
        with open(video_path, 'rb') as video_file:
            files = {
                'file': video_file
            }
            data = {
                'access_token': access_token,
                'description': message
            }
            
            response = requests.post(url, data=data, files=files)
        
        if response.status_code == 200:
            result = response.json()
            video_id = result.get('id')
            post_url = f"https://www.facebook.com/{page_id}/videos/{video_id}"
            
            print(f"\n✅ Facebook upload complete!")
            print(f"  Video ID: {video_id}")
            print(f"  URL: {post_url}")
            
            return {
                'platform': 'facebook',
                'video_id': video_id,
                'url': post_url
            }
        else:
            print(f"\n❌ Facebook upload failed: {response.status_code}")
            print(f"  Error: {response.text}")
            return None
            
    except ImportError:
        print("\n❌ Facebook upload requires additional packages:")
        print("  pip install requests")
        return None
    except Exception as e:
        print(f"\n❌ Facebook upload failed: {str(e)}")
        return None


def save_publish_log(video_path, results):
    """Save publishing results to a JSON log file"""
    log_file = video_path.replace('.mp4', '_publish_log.json')
    
    log_data = {
        'video_file': video_path,
        'publish_date': str(Path(video_path).stat().st_mtime),
        'platforms': results
    }
    
    with open(log_file, 'w') as f:
        json.dump(log_data, f, indent=2)
    
    print(f"\n📄 Publish log saved to: {log_file}")


def main():
    if len(sys.argv) < 2:
        print("Usage: python publish.py <video_path> [--youtube] [--facebook] [--title 'Title'] [--description 'Desc']")
        print("\nExample:")
        print("  python publish.py output.mp4 --youtube --facebook --title 'Quiz Video' --description 'Test your knowledge!'")
        print("\nEnvironment Variables Required:")
        print("  YouTube: YOUTUBE_CLIENT_SECRETS (path to OAuth client secrets JSON)")
        print("  Facebook: FACEBOOK_PAGE_ID, FACEBOOK_ACCESS_TOKEN")
        sys.exit(1)
    
    video_path = sys.argv[1]
    
    if not os.path.exists(video_path):
        print(f"❌ Video file not found: {video_path}")
        sys.exit(1)
    
    # Parse arguments
    args = sys.argv[2:]
    upload_youtube = '--youtube' in args
    upload_facebook = '--facebook' in args
    
    # Get title and description
    title = "Quiz Video"
    description = "Test your knowledge with this quiz!"
    
    if '--title' in args:
        title_index = args.index('--title')
        if title_index + 1 < len(args):
            title = args[title_index + 1]
    
    if '--description' in args:
        desc_index = args.index('--description')
        if desc_index + 1 < len(args):
            description = args[desc_index + 1]
    
    # If no platform specified, upload to both
    if not upload_youtube and not upload_facebook:
        upload_youtube = True
        upload_facebook = True
    
    print(f"\n🎬 Publishing Video")
    print(f"  File: {video_path}")
    print(f"  Size: {os.path.getsize(video_path) / (1024*1024):.2f} MB")
    print(f"  Platforms: {'YouTube' if upload_youtube else ''}{' & ' if upload_youtube and upload_facebook else ''}{'Facebook' if upload_facebook else ''}")
    
    results = []
    
    # Upload to YouTube
    if upload_youtube:
        youtube_result = upload_to_youtube(
            video_path,
            title=title,
            description=description,
            tags=['quiz', 'trivia', 'knowledge', 'education'],
            category_id='27',  # Education
            privacy='public'
        )
        if youtube_result:
            results.append(youtube_result)
    
    # Upload to Facebook
    if upload_facebook:
        facebook_result = upload_to_facebook(
            video_path,
            message=f"{title}\n\n{description}\n\n#quiz #trivia #knowledge"
        )
        if facebook_result:
            results.append(facebook_result)
    
    # Save results
    if results:
        save_publish_log(video_path, results)
        print("\n✅ Publishing complete!")
    else:
        print("\n⚠️  No videos were published successfully")


if __name__ == "__main__":
    main()
