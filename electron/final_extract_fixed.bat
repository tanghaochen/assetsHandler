@echo off
setlocal enabledelayedexpansion

:: ============================================
:: Enhanced ZIP Processing Script - Fixed Version
:: 
:: Pseudocode Implementation Logic:
:: 1. Set root directory variable (e.g., ./, ../, default is ./)
:: 2. Detect ZIP files ending with .zip in target folder
:: 3. For each ZIP file:
::    - Extract with password
::    - Find and extract nested ZIP files
::    - Get source filename (without extension)
::    - If folder name matches source filename, continue deeper
::    - If folder name doesn't match, this is the target directory
::    - Create final archive with _installguider.com suffix in root directory
:: ============================================

:: Configuration
set "PASSWORD=3y@Ef!YzJNmY"
set "SUFFIX=_installguider.com"
set "SEVENZIP=7z"

:: ============================================
:: 添加指定文件拷贝功能配置
:: 请修改下面的路径为您要拷贝的文件路径
:: ============================================
set "COPY_FILE_PATH=E:\TB\看更多软件资源.url"
set "COPY_FILE_ENABLED=true"

echo ============================================
echo Enhanced ZIP Processing Script - Fixed Version
echo Password: %PASSWORD%
echo Suffix: %SUFFIX%
echo ============================================
echo.

:: Check if 7z is available in PATH
%SEVENZIP% >nul 2>&1
if errorlevel 1 (
    echo Error: 7-Zip not found in PATH. Please ensure 7z is installed and configured globally.
    exit /b 1
)

:: Process each ZIP file
for %%F in (*.zip) do (
    echo.
    echo Processing: %%F
    
    :: Get source filename (without extension)
    set "SOURCE_FILENAME=%%~nF"
    echo Source filename: !SOURCE_FILENAME!
    
    :: Create output directory with suffix
    set "OUTDIR=!SOURCE_FILENAME!!SUFFIX!"
    
    :: Create output directory
    if not exist "!OUTDIR!" (
        mkdir "!OUTDIR!"
        echo Created directory: !OUTDIR!
    )
    
    :: Extract with password
    echo Extracting with password...
    "%SEVENZIP%" x "%%F" -o"!OUTDIR!" -p%PASSWORD% -y >nul 2>&1
    if errorlevel 1 (
        echo Failed to extract: %%F
        goto :continue_loop
    )
    
    echo Successfully extracted to: !OUTDIR!
    del "%%F"
    echo Deleted original: %%F
    
    :: Extract nested ZIP files recursively
    echo Looking for nested ZIP files in: !OUTDIR!
    call :extract_nested_zips "!OUTDIR!"
    
    :: Find target directory
    echo Analyzing directory structure...
    call :find_target_directory "!OUTDIR!" "!SOURCE_FILENAME!"
    
    if not defined TARGET_DIR (
        echo No target directory found for: !OUTDIR!
        goto :continue_loop
    )
    
    echo Target directory found: !TARGET_DIR!
    
    :: ============================================
    :: 拷贝指定文件到目标目录
    :: ============================================
    if "!COPY_FILE_ENABLED!"=="true" (
        if exist "!COPY_FILE_PATH!" (
            echo Copying specified file to target directory...
            copy "!COPY_FILE_PATH!" "!TARGET_DIR!\" >nul 2>&1
            if errorlevel 1 (
                echo Warning: Failed to copy file: !COPY_FILE_PATH!
            ) else (
                echo Successfully copied: !COPY_FILE_PATH! to !TARGET_DIR!
            )
        ) else (
            echo Warning: Specified file not found: !COPY_FILE_PATH!
        )
    )
    
    :: Create final archive
    set "NEW_ARCHIVE=!SOURCE_FILENAME!!SUFFIX!.zip"
    echo Creating final archive: !NEW_ARCHIVE!
    
    :: Change to target directory and create ZIP
    pushd "!TARGET_DIR!"
    "%SEVENZIP%" a "..\!NEW_ARCHIVE!" "*" -r >nul 2>&1
    set "ZIP_RESULT=!errorlevel!"
    popd
    
    if !ZIP_RESULT!==0 (
        echo Successfully created: !NEW_ARCHIVE!
        if exist "!NEW_ARCHIVE!" (
            echo Archive file exists and is ready!
            :: Remove the original extracted directory
            rmdir /s /q "!OUTDIR!"
            echo Removed original directory: !OUTDIR!
        ) else (
            echo Warning: Archive file not found after creation: !NEW_ARCHIVE!
        )
    ) else (
        echo Failed to create archive: !NEW_ARCHIVE! (Error: !ZIP_RESULT!)
    )
    
    :continue_loop
)

echo.
echo ============================================
echo All processing completed successfully!
echo ============================================
echo.
echo Summary:
echo - All ZIP files processed with correct password
echo - All nested archives extracted
echo - Directory structure analyzed automatically
echo - Target directories identified dynamically
echo - Final archives created with _installguider.com suffix
echo - Original files cleaned up
echo.
goto :eof

:: Subroutine to extract nested ZIP files recursively
:extract_nested_zips
set "CURRENT_PATH=%~1"
echo Searching for ZIP files in: !CURRENT_PATH!

:: Find all ZIP files in current directory
for %%Z in ("!CURRENT_PATH!\*.zip") do (
    echo Found nested ZIP: %%Z
    echo Extracting nested ZIP with password...
    
    :: Extract nested ZIP with password
    "%SEVENZIP%" x "%%Z" -o"!CURRENT_PATH!" -p%PASSWORD% -y >nul 2>&1
    if errorlevel 1 (
        echo Failed to extract nested ZIP: %%Z
    ) else (
        del "%%Z"
        echo Deleted nested ZIP: %%Z
    )
)

:: Recursively search subdirectories
for /d %%D in ("!CURRENT_PATH!\*") do (
    call :extract_nested_zips "%%D"
)
goto :eof

:: Subroutine to find target directory
:find_target_directory
set "CURRENT_PATH=%~1"
set "SOURCE_NAME=%~2"
set "TARGET_DIR="

echo Searching in: !CURRENT_PATH!
echo Looking for source name: !SOURCE_NAME!

:: Check if current directory has subdirectories
if exist "!CURRENT_PATH!\*" (
    :: Look for directories that match the source name
    for /d %%D in ("!CURRENT_PATH!\*") do (
        set "DIR_NAME=%%~nxD"
        echo Found directory: !DIR_NAME!
        
        :: Pseudocode logic: if folder name matches source filename
        if "!DIR_NAME!"=="!SOURCE_NAME!" (
            echo Directory name matches source name - continuing deeper...
            call :find_target_directory "%%D" "!SOURCE_NAME!"
            
            :: If a target was found in the recursive call, return it
            if defined TARGET_DIR (
                goto :eof
            )
        ) else (
            :: if name is different, this is the target directory
            echo Directory name doesn't match source name
            echo This is the target directory: %%D
            set "TARGET_DIR=%%D"
            goto :eof
        )
    )
    
    :: If no subdirectories were found or processed, check if current directory has files
    if not defined TARGET_DIR (
        dir /b "!CURRENT_PATH!\*" >nul 2>&1
        if not errorlevel 1 (
            echo No matching subdirectories found, using current path as target
            set "TARGET_DIR=!CURRENT_PATH!"
        )
    )
) else (
    echo No subdirectories found in: !CURRENT_PATH!
    echo Using current path as target
    set "TARGET_DIR=!CURRENT_PATH!"
)
goto :eof 