@echo off
cd /d "%~dp0"
set "SECONDSHELF_NODE=node"
where node >nul 2>&1
if errorlevel 1 set "SECONDSHELF_NODE=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
echo.
echo SecondShelf - open http://127.0.0.1:4321 after the server starts.
echo Keep this window open. Press Ctrl+C to stop.
echo.
"%SECONDSHELF_NODE%" server.mjs
pause
