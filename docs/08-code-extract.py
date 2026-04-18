import os

def create_code_extracts():
    # Set directories relative to the location of this script
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.abspath(os.path.join(script_dir, '..'))
    
    backend_dir = os.path.join(project_root, 'backend')
    frontend_dir = os.path.join(project_root, 'frontend')
    
    backend_output = os.path.join(script_dir, 'backend-code.txt')
    frontend_output = os.path.join(script_dir, 'frontend-code.txt')
    
    # Common directories and file extensions to ignore
    ignore_dirs = {
        'venv', '.venv', 'env', 'node_modules', '__pycache__', 
        '.git', 'dist', 'build', '.pytest_cache', 't81-backend', 'public', 'assets', '.next'
    }
    
    ignore_extensions = {
        '.pyc', '.pyo', '.pyd', '.jpg', '.jpeg', '.png', '.gif',
        '.ico', '.svg', '.mp4', '.webm', '.glb', '.gltf', '.pdf',
        '.docx', '.zip', '.tar', '.gz', '.db', '.sqlite3', '.log'
    }

    def collect_code(base_directory: str, header: str, output_file: str):
        if not os.path.exists(base_directory):
            print(f"Warning: Directory {base_directory} does not exist.")
            return

        with open(output_file, 'w', encoding='utf-8') as outfile:
            outfile.write(f"{header}\n\n")
            
            for root, dirs, files in os.walk(base_directory):
                # Filter out ignored directories structurally
                dirs[:] = [d for d in dirs if d not in ignore_dirs and not d.startswith('.')]
                
                for file in files:
                    # Ignore specified extensions and standalone dotfiles 
                    _, ext = os.path.splitext(file)
                    if ext.lower() in ignore_extensions or file.startswith('.'):
                        continue
                        
                    file_path = os.path.join(root, file)
                    # Use relative path for cleaner output block headers
                    rel_path = os.path.relpath(file_path, project_root)
                    
                    try:
                        with open(file_path, 'r', encoding='utf-8') as f:
                            content = f.read()
                            
                        # Format the output block
                        outfile.write("-" * 80 + "\n")
                        outfile.write(f"FILE: {rel_path}\n")
                        outfile.write("-" * 80 + "\n")
                        outfile.write(content)
                        outfile.write("\n\n")
                    except Exception as e:
                        print(f"Skipping binary/unreadable file: {file_path} - Error: {e}")
                        
        print(f"Successfully generated: {output_file}")

    # Run for backend
    collect_code(
        base_directory=backend_dir,
        header="SIGNFUSION BACKEND ARCHITECTURE AND CODE",
        output_file=backend_output
    )
    
    # Run for frontend
    collect_code(
        base_directory=frontend_dir,
        header="SIGNFUSION FRONTEND ARCHITECTURE AND CODE",
        output_file=frontend_output
    )

if __name__ == '__main__':
    print("Starting source code extraction...")
    create_code_extracts()
    print("Extraction complete!")
