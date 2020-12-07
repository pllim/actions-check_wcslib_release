#!/bin/bash -l

PYTHON=$(which python3.8)
echo "PYTHON=${PYTHON}"

$PYTHON /check_wcslib_release.py
