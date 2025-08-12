#!/usr/bin/env python3
"""
Script to run comprehensive UI tests for IBKR Tax Calculator.
"""
import subprocess
import sys
import os


def install_playwright():
    """Install Playwright and browsers if not already installed."""
    try:
        import playwright
        print("✓ Playwright already installed")
    except ImportError:
        print("📦 Installing Playwright...")
        subprocess.run([sys.executable, "-m", "pip", "install", "playwright", "pytest-playwright"], check=True)
    
    # Install browsers
    print("🌐 Installing Playwright browsers...")
    subprocess.run([sys.executable, "-m", "playwright", "install", "chromium"], check=True)


def run_tests():
    """Run the UI tests."""
    print("🧪 Running comprehensive UI tests...")
    
    # Change to project root directory
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    # Run tests with detailed output
    cmd = [
        sys.executable, "-m", "pytest",
        "tests/e2e/test_ui_comprehensive.py",
        "-v",  # Verbose output
        "--tb=short",  # Short traceback format
        "-s",  # Don't capture output
    ]
    
    try:
        result = subprocess.run(cmd, check=False)
        return result.returncode
    except KeyboardInterrupt:
        print("\n⚠️ Tests interrupted by user")
        return 1


def main():
    """Main function."""
    print("🚀 IBKR Tax Calculator - Comprehensive UI Testing")
    print("=" * 50)
    
    # Install dependencies
    install_playwright()
    
    # Run tests
    exit_code = run_tests()
    
    if exit_code == 0:
        print("\n✅ All tests passed!")
    else:
        print(f"\n❌ Tests failed with exit code: {exit_code}")
        print("\nCheck the output above for details on which tests failed.")
        print("Common issues to check:")
        print("- Is the application deployed and accessible?")
        print("- Are the data files present in the data/ folder?")
        print("- Are there any UI/template issues causing errors?")
    
    return exit_code


if __name__ == "__main__":
    sys.exit(main())
