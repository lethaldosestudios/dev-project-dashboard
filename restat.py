import pathlib

docs = [
    'AGENTS.md',
    'AI-DEV-WORKFLOW.md',
    'CHANGELOG.md',
    'DESIGN.md',
    'README.md',
    'TODO.md',
]
for f in docs:
    p = pathlib.Path(f)
    original = p.read_text()
    updated = original.replace(
        'verified-against: 35dfe26', 'verified-against: e733c29'
    )
    if updated != original:
        p.write_text(updated)
        print('updated ' + f)
    else:
        print('unchanged ' + f)
print('done')
