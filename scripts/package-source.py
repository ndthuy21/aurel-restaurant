"""Create a CodeCommit-ready ZIP with package.json at its root, without runtime secrets."""
import argparse
import os
import zipfile
from pathlib import Path

parser = argparse.ArgumentParser()
parser.add_argument('--output', required=True)
args = parser.parse_args()
root = Path(__file__).resolve().parent.parent
output = Path(args.output).resolve()
output.parent.mkdir(parents=True, exist_ok=True)
excluded = {'node_modules', '.next', '.data', 'dist', '.aws-sam', '.git', '.aws', 'coverage', 'work', 'artifacts', '.pnpm-store'}
count = 0
with zipfile.ZipFile(output, 'w', zipfile.ZIP_DEFLATED) as archive:
    for directory, dirs, files in os.walk(root):
        dirs[:] = sorted(d for d in dirs if d not in excluded)
        for name in sorted(files):
            path = Path(directory) / name
            if path.resolve() == output or name.endswith(('.zip', '.tsbuildinfo')):
                continue
            if name.startswith('.env') and name != '.env.example':
                continue
            if name in {'admin-password.json', 'app-admin.json', 'credentials'}:
                continue
            archive.write(path, path.relative_to(root))
            count += 1
print(f'Packaged {count} source files. ZIP root contains package.json. Review contents before uploading.')
