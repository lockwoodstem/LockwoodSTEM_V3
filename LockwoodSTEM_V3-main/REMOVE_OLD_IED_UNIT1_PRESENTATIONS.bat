@echo off
setlocal
cd /d "%~dp0"
echo Removing legacy IED Unit 1 presentation files...
if exist "downloads\presentations" del /q "downloads\presentations\IED_Unit1_Lesson_*.pptx" 2>nul
if exist "LockwoodSTEM_V3-main\downloads\presentations" del /q "LockwoodSTEM_V3-main\downloads\presentations\IED_Unit1_Lesson_*.pptx" 2>nul
echo Done. Unit 1 lesson presentation files have been removed.
pause
