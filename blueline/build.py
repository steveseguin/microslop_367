#!/usr/bin/env python3
"""Compatibility entry point. Builds the editor and stages it in OfficeNinja."""
import pathlib
import subprocess

script = pathlib.Path(__file__).resolve().parent.parent / 'suite/scripts/build-blueline.mjs'
subprocess.run(['node', str(script)], check=True)
