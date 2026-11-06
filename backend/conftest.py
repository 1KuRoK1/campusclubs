import sys
import os

# Добавляем корневую папку backend в sys.path, чтобы Pytest видел модуль 'app'
sys.path.insert(0, os.path.dirname(__file__))