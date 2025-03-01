#!/bin/bash

# Проверяем, что находимся в чистой main ветке
if [[ $(git branch --show-current) != "main" ]]; then
    echo "Error: Please checkout to main branch first"
    exit 1
fi

if [[ -n $(git status -s) ]]; then
    echo "Error: Working directory is not clean. Please commit or stash changes first"
    exit 1
fi

# Получаем текущую версию из package.json
current_version=$(node -p "require('./package.json').version")

# Создаем новый тег
git tag "v$current_version"

# Пушим тег в репозиторий
git push origin "v$current_version"

echo "Deployed version v$current_version"
echo "GitHub Actions will handle the deployment to Vercel"