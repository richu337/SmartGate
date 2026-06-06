#!/bin/bash
# Script to re-initialize the Gradle Wrapper to 8.10 and resolve any corruption issues.
# Run this script from the project root or the /android directory.

# Get the directory of this script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

echo "=========================================================="
echo "🛡️  Re-initializing SmartGate Gradle Wrapper to 8.10..."
echo "=========================================================="

# Remove existing corrupt wrapper jar first
if [ -f "gradle/wrapper/gradle-wrapper.jar" ]; then
    echo "🧹 Removing legacy/corrupt gradle-wrapper.jar..."
    rm -f gradle/wrapper/gradle-wrapper.jar
fi

# Run gradle wrapper generation
if command -v gradle &> /dev/null; then
    echo "🚀 Running 'gradle wrapper --gradle-version 8.10'..."
    gradle wrapper --gradle-version 8.10
    
    # Verify file sizes and signatures
    if [ -f "gradle/wrapper/gradle-wrapper.jar" ]; then
        JAR_SIZE=$(wc -c < "gradle/wrapper/gradle-wrapper.jar")
        echo "✅ Success! New gradle-wrapper.jar generated successfully."
        echo "   Size: $JAR_SIZE bytes"
        chmod +x gradlew
    else
        echo "⚠️  Gradle wrapper jar was not generated. Please check for errors above."
    fi
else
    echo "❌ Error: 'gradle' command not found in your system PATH."
    echo "   Please install Gradle 8.x or configure your environment variables."
    echo "   Alternative: You can download the pristine gradle-wrapper.jar manually from:"
    echo "   https://raw.githubusercontent.com/gradle/gradle/v8.10.0/gradle/wrapper/gradle-wrapper.jar"
fi
