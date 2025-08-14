@echo off
chcp 65001 >nul
echo Clearing proxy settings and initializing database...
set HTTPS_PROXY=
set HTTP_PROXY=
wrangler d1 execute destiny-db --file=./d1-schema.sql --remote
