---
title: PyInstaller 打包 Python 为 Windows EXE 完整指南
tags:
  - python
  - tools
  - experience
  - cross-platform
status: ✅ 已验证
description: PyInstaller 打包 Python 为 Windows EXE 完整指南
source: 实践总结 - 2026-03-05
recordDate: '2026-03-05'
sourceDate: '2026-03-05'
credibility: ⭐⭐⭐⭐
version: PyInstaller 6.0+
---
# PyInstaller 打包 Python 为 Windows EXE 完整指南


<div class="record-meta-block">
<div class="meta-item meta-item--tags"><span class="meta-label">标签</span><span class="meta-value"><a href="/records/?tags=python" class="meta-tag">Python</a> <a href="/records/?tags=tools" class="meta-tag">工具</a> <a href="/records/?tags=experience" class="meta-tag">经验</a> <a href="/records/?tags=cross-platform" class="meta-tag">cross-platform</a></span></div>
<div class="meta-item"><span class="meta-label">来源</span><span class="meta-value">实践总结 - 2026-03-05</span></div>
<div class="meta-item"><span class="meta-label">收录日期</span><span class="meta-value">2026-03-05</span></div>
<div class="meta-item"><span class="meta-label">来源日期</span><span class="meta-value">2026-03-05</span></div>
<div class="meta-item"><span class="meta-label">状态</span><span class="meta-value meta-value--status meta-value--success"><img class="inline-icon inline-icon--status" src="/icons/status-verified.svg" alt="已验证" /> 已验证</span></div>
<div class="meta-item"><span class="meta-label">可信度</span><span class="meta-value"><span class="star-rating"><img class="inline-icon inline-icon--star" src="/icons/star-filled.svg" alt="★" /><img class="inline-icon inline-icon--star" src="/icons/star-filled.svg" alt="★" /><img class="inline-icon inline-icon--star" src="/icons/star-filled.svg" alt="★" /><img class="inline-icon inline-icon--star" src="/icons/star-filled.svg" alt="★" /><img class="inline-icon inline-icon--star" src="/icons/star-empty.svg" alt="☆" /></span></span></div>
<div class="meta-item"><span class="meta-label">适用版本</span><span class="meta-value">PyInstaller 6.0+</span></div>
</div>


### 概要

在 Linux 环境下为 Windows 打包 Python 程序的踩坑记录，包含 bat 脚本生成、资源文件打包、路径兼容等关键问题。

### 内容

#### 问题 1：Windows bat 脚本换行符

**现象**：在 Linux 写的 bat 文件在 Windows 运行报错，显示乱码命令

**原因**：Linux 用 LF 换行，Windows bat 必须 CRLF

**解决方案**：用 Python 生成 bat 文件
```python
content = '''@echo off
echo Hello World
pause
'''
with open('build_win.bat', 'w', newline='\r\n', encoding='utf-8') as f:
    f.write(content)
```

#### 问题 2：资源文件未打包

**现象**：运行 EXE 报错「故事文件不存在」

**原因**：PyInstaller 默认只打包 Python 代码，不包含 JSON/图片等资源

**解决方案**：使用 `--add-data` 参数
```bash
pyinstaller --onefile --console --name "myapp" --add-data "data;data" main.py
```

#### 问题 3：打包后资源路径错误

**现象**：`Path(__file__).parent / "data" / "file.json"` 找不到文件

**原因**：PyInstaller 打包后程序在临时目录运行，`__file__` 指向临时目录

**解决方案**：兼容打包和源码运行的路径获取函数
```python
import sys
from pathlib import Path

def get_base_path() -> Path:
    """获取基础路径，兼容 PyInstaller 打包"""
    if getattr(sys, 'frozen', False):
        return Path(sys._MEIPASS)  # 打包后的临时目录
    return Path(__file__).parent  # 源码运行
```

#### 问题 4：存档目录消失

**现象**：程序退出后存档丢失

**原因**：`sys._MEIPASS` 是临时目录，程序退出后会被删除

**解决方案**：存档等需要持久化的文件用 `Path.cwd()`（当前工作目录）
```python
save_dir = Path.cwd() / "saves"  # 不用临时目录
```

#### 问题 5：给 Windows 用户发文件格式

**现象**：tar.gz 在 Windows 解压后出现嵌套目录或乱码

**原因**：Windows 处理 tar.gz 的方式不同，可能需要多次解压

**解决方案**：用 ZIP 格式，Windows 原生支持
```python
import zipfile
with zipfile.ZipFile('myapp.zip', 'w', zipfile.ZIP_DEFLATED) as zf:
    zf.write('main.py', 'main.py')
```

### 关键代码

完整的打包 bat 脚本模板：
```batch
@echo off
echo ========================================
echo   My App - Windows Build Script
echo ========================================
echo.

python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python not found. Please install Python 3.8+
    pause
    exit /b 1
)

echo [1/3] Installing PyInstaller...
pip install pyinstaller -q

echo [2/3] Building...
pyinstaller --onefile --console --name "myapp" --add-data "data;data" --clean main.py

echo [3/3] Done!
echo.
echo Executable: dist\myapp.exe
echo.
pause
```

Python 路径兼容代码：
```python
def get_base_path() -> Path:
    """获取基础路径，兼容 PyInstaller 打包"""
    if getattr(sys, 'frozen', False):
        return Path(sys._MEIPASS)
    return Path(__file__).parent

# 资源文件路径（只读，可放临时目录）
resource_path = get_base_path() / "data" / "config.json"

# 存档路径（需要持久化，放当前目录）
save_path = Path.cwd() / "saves" / "game.sav"
```

### 参考链接

- [PyInstaller 官方文档](https://pyinstaller.org/en/stable/)
- [PyInstaller --add-data 参数说明](https://pyinstaller.org/en/stable/spec-files.html#adding-data-files)
- [sys._MEIPASS 说明](https://pyinstaller.org/en/stable/runtime-information.html)

### 验证记录

- [2026-03-05] 初次记录，来源：璃的故事游戏打包实践
- [2026-03-05] KT 确认 EXE 可正常运行

---
