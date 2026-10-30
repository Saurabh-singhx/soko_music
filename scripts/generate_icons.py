#!/usr/bin/env python3
import os
import sys

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(SCRIPT_DIR, ".."))
TOOL_SCRIPT = os.path.join(PROJECT_ROOT, "tools", "generate_icons.py")

if os.path.exists(TOOL_SCRIPT):
    os.execv(sys.executable, [sys.executable, TOOL_SCRIPT] + sys.argv[1:])
else:
    print(f"Error: {TOOL_SCRIPT} not found")
    sys.exit(1)
