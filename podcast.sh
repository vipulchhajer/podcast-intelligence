#!/bin/bash
# Wrapper script that automatically activates virtual environment

# Get the directory where this script lives
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Activate virtual environment
source "$SCRIPT_DIR/.venv/bin/activate"

# Run the Python CLI with all arguments
python "$SCRIPT_DIR/podcast" "$@"

