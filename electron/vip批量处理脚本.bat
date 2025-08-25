@echo off
chcp 65001 > nul
setlocal enabledelayedexpansion

:: 配置参数
set "source_file=E:\TB\更多软件.url"
set "password=3y@Ef!YzJNmY"
set "after_fix=installguider.com"  :: 新增后缀变量

:: 用户输入处理路径
set /p "target_path=请输入根目录路径（如 F:\BaiduNetdiskDownload\c4d）: "
if not exist "!target_path!\" (
    echo 路径不存在，请重新运行
    pause
    exit
)

:: 压缩包收集选项
set /p "collect_zips=是否需要收集子文件夹中的压缩包? (y/n): "
if /i "!collect_zips!"=="y" (
    echo 正在创建压缩包收集区...
    set "collection_dir=!target_path!\ZIP_COLLECTION_%random%"
    mkdir "!collection_dir!" > nul 2>&1
    
    echo 扫描并移动所有ZIP文件...
    for /f "delims=" %%F in ('dir /b /s "!target_path!\*.zip"') do (
        move /y "%%F" "!collection_dir!\" > nul
        echo ✓ 已移动: %%~nxF
    )
    set "process_dir=!collection_dir!"
) else (
    set "process_dir=!target_path!"
)

:: 创建内存工作区
echo 正在创建内存虚拟盘...
diskpart /s "!temp!\ramdisk.txt" > nul 2>&1
(
    echo select disk=0
    echo create partition primary size=30720
    echo format fs=NTFS quick label=RAMDISK
    echo assign letter=R
) > "!temp!\ramdisk.txt"
if exist R:\ (
    set "workspace=R:\ZIP_WORKSPACE"
) else (
    set "workspace=%temp%\ZIP_HIGHSPEED_%random%"
)
mkdir "%workspace%" > nul 2>&1

:: 核心处理引擎
pushd "!process_dir!"
echo 启动极速处理模式...
for /f "delims=" %%F in ('dir /b *.zip') do (
    echo [闪电处理] %%F
    
    :: 内存解压 (32线程+无压缩)
    set "unpack_dir=%workspace%\%%~nF"
    mkdir "!unpack_dir!" > nul 2>&1
    7z x "%%F" -p%password% -o"!unpack_dir!" -mmt=32 -mx=0 -y > nul
    
    :: 文件注入
    if exist "%source_file%" (
        copy /y "%source_file%" "!unpack_dir!\" > nul
    )
    
    :: 内存压缩 (32线程+存储模式)
    set "new_zip=%%~nF_!after_fix!.zip"  :: 使用新后缀变量
    7z a "!new_zip!" "!unpack_dir!\*" -mmt=32 -mx=0 -y > nul
    
    :: 清理工作区
    rd /s /q "!unpack_dir!" > nul 2>&1
    echo ✓ 生成: !new_zip!
)

:: 释放内存资源
if exist R:\ (
    diskpart /s "!temp!\unmount.txt" > nul 2>&1
    (
        echo select volume R
        echo remove dismount
        echo delete partition
    ) > "!temp!\unmount.txt"
)

:: 还原文件到原始位置
if defined collection_dir (
    echo 正在还原文件到原始位置...
    @REM for /f "delims=" %%F in ('dir /b *.zip') do (
    @REM     if exist "%%F" move /y "%%F" "!target_path!\" > nul
    @REM )
    for /f "delims=" %%F in ('dir /b *!after_fix!*.zip') do (  :: 匹配新后缀文件
        move /y "%%F" "!target_path!\" > nul
    )
    rd /s /q "!collection_dir!" > nul 2>&1
)

popd
echo.
echo 所有操作已完成！
echo 解锁文件保存在: !target_path!
echo 新文件后缀: !after_fix!
timeout /t 10
