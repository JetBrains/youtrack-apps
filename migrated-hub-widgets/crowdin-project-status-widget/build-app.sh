#!/bin/bash

# Packs the app content into zip archive that can be imported to YouTrack
CURRENT_DIR=${PWD##*/}
[ -f "$CURRENT_DIR".zip ] && rm "$CURRENT_DIR".zip
zip -r "$CURRENT_DIR".zip . -x "*.zip" "*.iml" "*.sh" ".gitignore" "*.md" "*.idea*" ".idea"