#!/usr/bin/env python3
"""
Main Quiz Video Generation Workflow
Orchestrates the entire pipeline: render → transition → publish
"""

import os
import sys
import subprocess
import json
import argparse
from pathlib import Path
from dotenv import load_dotenv
import readline  # For better input experience

# Load environment variables
load_dotenv()

def prompt_input(question, default=None):
    """Prompt user for input with optional default value"""
    if default:
        prompt = f"{question} [{default}]: "
    else:
        prompt = f"{question}: "
    
    response = input(prompt).strip()
    return response if response else default

def yes_no_prompt(question, default=True):
    """Prompt for yes/no answer"""
    default_str = "Y/n" if default else "y/N"
    response = input(f"{question} [{default_str}]: ").strip().lower()
    
    if not response:
        return default
    return response in ['y', 'yes']

def run_command(cmd, description, cwd=None):
    """Run a shell command and handle errors"""
    print(f"\n{'='*60}")
    print(f"📍 {description}")
    print(f"{'='*60}")
    print(f"Command: {' '.join(cmd)}\n")
    
    try:
        result = subprocess.run(cmd, cwd=cwd, check=True, text=True, capture_output=False)
        print(f"\n✅ {description} - Complete!")
        return True
    except subprocess.CalledProcessError as e:
        print(f"\n❌ {description} - Failed!")
        print(f"Error code: {e.returncode}")
        return False
    except FileNotFoundError:
        print(f"\n❌ Command not found: {cmd[0]}")
        return False

def get_latest_quiz_folder():
    """Find the most recently created quiz folder"""
    out_dir = Path("out")
    if not out_dir.exists():
        return None
    
    quiz_folders = [f for f in out_dir.iterdir() if f.is_dir()]
    if not quiz_folders:
        return None
    
    # Sort by modification time, get the latest
    latest = max(quiz_folders, key=lambda f: f.stat().st_mtime)
    return str(latest)

def parse_arguments():
    """Parse command line arguments"""
    parser = argparse.ArgumentParser(
        description='Quiz Video Generation Pipeline',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Interactive mode (default)
  python main.py
  
  # Render only
  python main.py --render-only
  
  # Skip render, join existing quiz
  python main.py --skip-render --quiz-name quiz3 --output final.mp4
  
  # Complete automated workflow
  python main.py --all --youtube --facebook \\
                 --title "Amazing Quiz" --description "Test yourself!"
  
  # Render with specific API endpoint
  python main.py --render --api-url https://quiz-db-one.vercel.app/api/quiz/gk50
  
  # Join and publish only (use existing quiz folder)
  python main.py --skip-render --join --publish --youtube \\
                 --quiz-name quiz5 --output final_quiz5.mp4
        """
    )
    
    # Workflow control
    parser.add_argument('--render', action='store_true', help='Render question videos')
    parser.add_argument('--join', action='store_true', help='Join videos with transitions')
    parser.add_argument('--publish', action='store_true', help='Publish to platforms')
    parser.add_argument('--all', action='store_true', help='Run all steps (render + join + publish)')
    
    # Skip flags
    parser.add_argument('--skip-render', action='store_true', help='Skip rendering step')
    parser.add_argument('--skip-join', action='store_true', help='Skip joining step')
    parser.add_argument('--skip-publish', action='store_true', help='Skip publishing step')
    parser.add_argument('--render-only', action='store_true', help='Only render, skip other steps')
    parser.add_argument('--join-only', action='store_true', help='Only join, skip other steps')
    
    # Quiz configuration
    parser.add_argument('--quiz-name', type=str, help='Quiz name (folder in out/)')
    parser.add_argument('--api-url', type=str, help='API endpoint URL for fetching questions (e.g., https://quiz-db-one.vercel.app/api/quiz/gk50)')
    parser.add_argument('--output', type=str, help='Output video filename')
    parser.add_argument('--video-path', type=str, help='Path to existing final video for publishing')
    parser.add_argument('--short', action='store_true', help='Generate vertical Shorts/Reels videos (9:16)')
    parser.add_argument('--long', action='store_true', help='Generate horizontal videos (16:9)')
    parser.add_argument('--comp', type=str, help='Remotion composition ID to render')
    parser.add_argument('--intro', type=str, help='Path to intro video file')
    parser.add_argument('--outro', type=str, help='Path to outro video file')
    
    # Publishing configuration
    parser.add_argument('--youtube', action='store_true', help='Publish to YouTube')
    parser.add_argument('--facebook', action='store_true', help='Publish to Facebook')
    parser.add_argument('--title', type=str, help='Video title')
    parser.add_argument('--description', type=str, help='Video description')
    
    # Utility
    parser.add_argument('--interactive', action='store_true', help='Force interactive mode (default if no flags)')
    parser.add_argument('--yes', '-y', action='store_true', help='Answer yes to all prompts')
    
    return parser.parse_args()

def main():
    args = parse_arguments()
    
    # Determine if running in interactive mode
    has_workflow_flags = args.render or args.join or args.publish or args.all or \
                         args.skip_render or args.skip_join or args.skip_publish or \
                         args.render_only or args.join_only
    
    interactive = args.interactive or not has_workflow_flags
    
    # Handle --all flag
    if args.all:
        args.render = True
        args.join = True
        args.publish = True
    
    # Handle only flags
    if args.render_only:
        args.render = True
        args.skip_join = True
        args.skip_publish = True
    
    if args.join_only:
        args.skip_render = True
        args.join = True
        args.skip_publish = True
    
    print("""
╔══════════════════════════════════════════════════════════╗
║         Quiz Video Generation Pipeline                   ║
║  1. Render individual question videos (render.mjs)      ║
║  2. Join videos with transitions (transition.py)        ║
║  3. Publish to YouTube & Facebook (publish.py)          ║
╚══════════════════════════════════════════════════════════╝
""")
    
    # ==================== STEP 1: RENDER ====================
    print("\n🎬 STEP 1: Render Question Videos")
    print("-" * 60)
    
    # Determine if we should render
    if interactive and not args.skip_render:
        should_render = yes_no_prompt("Do you want to render new videos?", default=True)
    else:
        should_render = args.render and not args.skip_render
        if args.skip_render:
            print("⏭️  Skipping render (--skip-render)")
        elif not should_render:
            print("⏭️  Skipping render (not requested)")
    
    quiz_name = None
    quiz_folder = None
    
    if should_render:
        # Check if render.mjs exists
        if not os.path.exists("render.mjs"):
            print("❌ render.mjs not found!")
            sys.exit(1)
        
        # Run render.mjs
        cmd = ["node", "render.mjs"]
        if args.short:
            cmd.append("--short")
        if args.long:
            cmd.append("--long")
        if args.comp:
            cmd.extend(["--comp", args.comp])
        if args.api_url:
            cmd.append(args.api_url)
            print(f"✓ Using API URL: {args.api_url}")
        
        success = run_command(
            cmd,
            "Rendering question videos"
        )
        
        if not success:
            print("\n⚠️  Rendering failed. Exiting...")
            sys.exit(1)
        
        # Get the quiz name from user or find latest folder
        quiz_folder = get_latest_quiz_folder()
        if quiz_folder:
            quiz_name = Path(quiz_folder).name
            print(f"\n✓ Using quiz folder: {quiz_folder}")
    else:
        # Use provided quiz name or ask for it
        if args.quiz_name:
            quiz_name = args.quiz_name
            print(f"✓ Using quiz name: {quiz_name}")
        elif interactive:
            # Ask for existing quiz folder
            default_folder = get_latest_quiz_folder()
            if default_folder:
                default_name = Path(default_folder).name
                quiz_name = prompt_input("Enter quiz name (folder in 'out/')", default=default_name)
            else:
                quiz_name = prompt_input("Enter quiz name (folder in 'out/')")
        else:
            # Auto-detect latest folder
            quiz_folder = get_latest_quiz_folder()
            if quiz_folder:
                quiz_name = Path(quiz_folder).name
                print(f"✓ Auto-detected quiz: {quiz_name}")
            else:
                print("❌ No quiz folder found. Use --quiz-name or render first.")
                sys.exit(1)
        
        quiz_folder = f"out/{quiz_name}"
        
        if not os.path.exists(quiz_folder):
            print(f"❌ Quiz folder not found: {quiz_folder}")
            sys.exit(1)
    
    # ==================== STEP 2: TRANSITIONS ====================
    print("\n\n🎞️  STEP 2: Join Videos with Transitions")
    print("-" * 60)
    
    # Determine if we should join
    if interactive and not args.skip_join:
        should_join = yes_no_prompt("Do you want to join videos with transitions?", default=True)
    else:
        should_join = args.join and not args.skip_join
        if args.skip_join:
            print("⏭️  Skipping join (--skip-join)")
        elif not should_join:
            print("⏭️  Skipping join (not requested)")
    
    final_video_path = None
    
    if should_join:
        # Check if transition.py exists
        if not os.path.exists("transition.py"):
            print("❌ transition.py not found!")
            sys.exit(1)
        
        # Check for required files
        if not os.path.exists("luma.mp4"):
            print("⚠️  Warning: luma.mp4 (transition matte) not found!")
            if interactive and not args.yes:
                if not yes_no_prompt("Continue anyway?", default=False):
                    sys.exit(1)
            elif not args.yes:
                print("❌ Cannot continue without luma.mp4 in non-interactive mode")
                sys.exit(1)
        
        # Output video name
        if args.output:
            output_name = args.output
            print(f"✓ Output file: {output_name}")
        elif interactive:
            output_name = prompt_input("Enter output video name", default=f"final_{quiz_name}.mp4")
        else:
            output_name = f"final_{quiz_name}.mp4"
            print(f"✓ Output file: {output_name}")
        
        final_video_path = output_name
        
        # Check for Python virtual environment
        python_cmd = ".venv/bin/python" if os.path.exists(".venv/bin/python") else "python3"
        
        # Run transition.py
        transition_cmd = [python_cmd, "transition.py", quiz_folder, output_name]
        if args.short:
            transition_cmd.append("--short")
        if args.long:
            transition_cmd.append("--long")
        if args.intro:
            transition_cmd.extend(["--intro", args.intro])
        if args.outro:
            transition_cmd.extend(["--outro", args.outro])
            
        success = run_command(
            transition_cmd,
            "Joining videos with transitions"
        )
        
        if not success:
            print("\n⚠️  Video joining failed. Exiting...")
            sys.exit(1)
        
        print(f"\n✓ Final video created: {output_name}")
    else:
        # Use provided video path or ask for it
        if args.video_path:
            final_video_path = args.video_path
            print(f"✓ Using video: {final_video_path}")
        elif interactive:
            final_video_path = prompt_input("Enter path to existing final video", default=f"final_{quiz_name}.mp4")
        else:
            final_video_path = f"final_{quiz_name}.mp4"
            print(f"✓ Assumed video: {final_video_path}")
        
        if not os.path.exists(final_video_path):
            print(f"❌ Video file not found: {final_video_path}")
            sys.exit(1)
    
    # ==================== STEP 3: PUBLISH ====================
    print("\n\n📤 STEP 3: Publish Video")
    print("-" * 60)
    
    # Determine if we should publish
    if interactive and not args.skip_publish:
        should_publish = yes_no_prompt("Do you want to publish the video?", default=False)
    else:
        should_publish = args.publish and not args.skip_publish
        if args.skip_publish:
            print("⏭️  Skipping publish (--skip-publish)")
        elif not should_publish:
            print("⏭️  Skipping publish (not requested)")
    
    if should_publish:
        # Check if publish.py exists
        if not os.path.exists("publish.py"):
            print("❌ publish.py not found!")
            sys.exit(1)
        
        # Determine platforms
        if args.youtube or args.facebook:
            publish_youtube = args.youtube
            publish_facebook = args.facebook
            print(f"✓ Publishing to: {', '.join([p for p, v in [('YouTube', publish_youtube), ('Facebook', publish_facebook)] if v])}")
        elif interactive:
            print("\nSelect platforms to publish:")
            publish_youtube = yes_no_prompt("  Publish to YouTube?", default=True)
            publish_facebook = yes_no_prompt("  Publish to Facebook?", default=True)
        else:
            # Default to both in non-interactive mode
            publish_youtube = True
            publish_facebook = True
            print("✓ Publishing to: YouTube, Facebook")
        
        if not publish_youtube and not publish_facebook:
            print("⚠️  No platforms selected. Skipping publish...")
        else:
            # Get video metadata
            if args.title:
                title = args.title
                print(f"✓ Title: {title}")
            elif interactive:
                title = prompt_input("Enter video title", default=f"{quiz_name.replace('-', ' ').title()} Quiz")
            else:
                title = f"{quiz_name.replace('-', ' ').title()} Quiz"
                print(f"✓ Title: {title}")
            
            if args.description:
                description = args.description
                print(f"✓ Description: {description}")
            elif interactive:
                description = prompt_input("Enter video description", default="Test your knowledge with this quiz!")
            else:
                description = "Test your knowledge with this quiz!"
                print(f"✓ Description: {description}")
            
            # Build command
            python_cmd = ".venv/bin/python" if os.path.exists(".venv/bin/python") else "python3"
            cmd = [python_cmd, "publish.py", final_video_path]
            
            if publish_youtube:
                cmd.append("--youtube")
            if publish_facebook:
                cmd.append("--facebook")
            if args.short:
                cmd.append("--short")
            if args.long:
                cmd.append("--long")
            
            cmd.extend(["--title", title, "--description", description])
            
            # Run publish.py
            success = run_command(
                cmd,
                "Publishing video to platforms"
            )
            
            if success:
                print("\n✅ Video published successfully!")
            else:
                print("\n⚠️  Publishing failed. Check credentials and try again.")
    
    # ==================== COMPLETE ====================
    print("\n\n" + "="*60)
    print("🎉 WORKFLOW COMPLETE!")
    print("="*60)
    
    if quiz_folder:
        print(f"\n📁 Quiz folder: {quiz_folder}")
    if final_video_path and os.path.exists(final_video_path):
        file_size = os.path.getsize(final_video_path) / (1024 * 1024)
        print(f"🎬 Final video: {final_video_path} ({file_size:.2f} MB)")
    
    print("\n✓ All done! Your quiz video is ready.")
    print()

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⚠️  Workflow interrupted by user.")
        sys.exit(130)
    except Exception as e:
        print(f"\n\n❌ Unexpected error: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
