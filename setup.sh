#!/usr/bin/env bash
set -e
echo "== Dev Project Dashboard: repo setup =="
echo "1) Create the remote repo (run this yourself, gh must be authenticated):"
echo "   gh repo create dev-project-dashboard --private --source=. --remote=origin"
echo "2) Init git, commit, push:"
echo "   git init"
echo "   git add ."
echo "   git commit -m 'Initial scaffold: PRD, Next.js + Cloudflare + D1 structure'"
echo "   git branch -M main"
echo "   git push -u origin main"
