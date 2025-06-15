from setuptools im    entry_points={
        "console_scripts": [
            "cgt=src.main.python.capital_gains_calculator:main",
        ],
    },setup, find_packages

setup(
    name="uk-capital-gains-calculator",
    version="0.1.0",
    description="UK Capital Gains Tax Calculator for Stocks and Shares",
    author="Your Name",
    author_email="your.email@example.com",
    packages=find_packages(where="src/main/python"),
    package_dir={"": "src/main/python"},
    install_requires=[
        "ofxparse>=0.21",
        "python-dateutil>=2.8.2",
        "pydantic>=2.0.0",
        "typer>=0.9.0",
        "rich>=13.0.0",
    ],
    python_requires=">=3.8",
    entry_points={
        "console_scripts": [
            "capital-gains-calculator=src.main.python.capital_gains_calculator:main",
        ],
    },
)
