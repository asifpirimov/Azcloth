import os
import glob

files_to_update = {
    "frontend/src/pages/Cart.tsx": "Səbət",
    "frontend/src/pages/Profile.tsx": "Profil",
    "frontend/src/pages/auth/Login.tsx": "Giriş",
    "frontend/src/pages/auth/Register.tsx": "Qeydiyyat"
}

for filepath, title in files_to_update.items():
    if not os.path.exists(filepath):
        continue
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    if 'usePageTitle' in content:
        continue
        
    # Inject import
    lines = content.split('\n')
    import_index = 0
    for i, line in enumerate(lines):
        if line.startswith('import '):
            import_index = i
    
    # Calculate depth to hooks
    depth = filepath.count('/') - 2
    hook_path = "../" * depth + "hooks/usePageTitle"
    lines.insert(import_index + 1, f"import {{ usePageTitle }} from '{hook_path}';")
    
    # Rejoin
    content = '\n'.join(lines)
    
    # Find export const Name = () => {
    func_def = f"export const {filepath.split('/')[-1].replace('.tsx', '')} = () => {{"
    if func_def in content:
        content = content.replace(func_def, f"{func_def}\n  usePageTitle('{title}');")
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

print("Updated simple pages")
