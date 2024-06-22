# Introduction

This is a simple script to check if the dependencies in your package json are being used in the code.

## Usage
checkDependencies [options]

Options:
  -s, --projectPath     source folder path. Defaults to ./
  -p, --packageFile     package file location. Defaults to "<projectPath>/package.json"
  -o, --outputToFile    Output the response to a file. Default: ./dependencies_info.json
  -i, --ignoreFilePath  file path containing the folders to ignore separated by space or new line. Defaults to "<projectPath>/.gitignore". Set it to false to ignore no folders.
  -h, --help            Help

Example call:
  $ node checkDependencies.js -s ./projectPath -p ./package.json -i ./ignore.txt