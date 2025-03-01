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

# Получаем текущую версию и обновляем package.json с помощью Node.js
node -e '
const fs = require("fs");
const package = require("./package.json");
const [major, minor, patch] = package.version.split(".").map(Number);
package.version = `${major}.${minor}.${patch + 1}`;
fs.writeFileSync("package.json", JSON.stringify(package, null, 2) + "\n");
'

# Получаем новую версию
new_version=$(node -p "require('./package.json').version")

# Коммитим изменение версии
git add package.json
git commit -m "chore: bump version to $new_version"

# Создаем новый тег
git tag "v$new_version"

# Пушим изменения и тег в репозиторий
git push origin main
git push origin "v$new_version"

echo "Deployed version v$new_version"
echo "GitHub Actions will handle the deployment to Vercel"