@echo off
start /B node "node_modules\next\dist\bin\next" dev -p 3000 --webpack > ".superpowers\dev-server.log" 2>&1
