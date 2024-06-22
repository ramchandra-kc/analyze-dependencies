const fs = require('fs');
const path = require('path');
const { Command } = require('commander');
const program = new Command();

program
  .option('-s, --projectPath', 'source folder path. Defaults to ./')
  .option('-p, --packageFile', 'package file location. Defaults to "<projectPath>/package.json"')
  .option('-o, --outputToFile', 'Output the response to a file. Default: ./dependencies_info.json')
  .option('-i, --ignoreFilePath', 'file path containing the folders to ignore separated by space or new line. Defaults to "<projectPath>/.gitignore". Set it to false to ignore no folders.')
  .option('-h, --help', 'Help')
  .addHelpText('after', `
Example call:
  $ node checkDependencies.js -s ./projectPath -p ./package.json -i ./ignore.txt`);

program.parse(process.argv);

const options = program.opts();
const projectPath = options.projectPath || './';
const packageFileLocation = options.packageFile || path.join(projectPath, 'package.json');
const ignoreFilePath = options.ignoreFilePath || path.join(projectPath, '.gitignore');
const outputFile = options.outputToFile || './dependencies_info.json';

if (options.help) {
  program.help();
  process.exit(0);
}

Array.prototype.pushUnique = function (element) {
  return this.indexOf(element) == -1 ? this.push(element) : null;
}

function findFilesUsingDependencies(sourceCodeFolder, excludeFolders, dependencies) {
  const dependencyRegex = new RegExp(`['"](${Object.keys(dependencies).join('|')})['"]`, 'g');
  // const excludeFoldersRegex =  new RegExp(`(${excludeFolders.join('|')})`, 'g');
  const filesWithDependencies = {};
  const unusedDependencies = new Set(Object.keys(dependencies));

  function searchDirectory(directory) {
    const filesAndFolders = fs.readdirSync(directory);

    for (const item of filesAndFolders) {
      const fullPath = path.join(directory, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        if (!item.startsWith('.') && excludeFolders.indexOf(item) === -1) {
          searchDirectory(fullPath);
        }
      } else if (['.js', '.ts'].includes(path.extname(fullPath))) {

        const content = fs.readFileSync(fullPath, 'utf8');
        const matches = content.match(dependencyRegex);

        if (matches) {
          matches.forEach(match => {
            match = match.replace(/'|"/g, '');
            unusedDependencies.delete(match);
            if (!filesWithDependencies[match]) {
              filesWithDependencies[match] = [];
            }
            filesWithDependencies[match].pushUnique(fullPath);
          });
        }
      }
    }
  }

  searchDirectory(sourceCodeFolder);

  return { filesWithDependencies, unusedDependencies: Array.from(unusedDependencies) };
}

try {
  const packageJson = JSON.parse(fs.readFileSync(packageFileLocation, {
    encoding: "utf-8"
  }));
  let foldersToExclude = ['node_modules'];
  try {
    if (ignoreFilePath === false || ignoreFilePath === "false" || ignoreFilePath === 0) {
      foldersToExclude = [""];
    } else {
      const data = fs.readFileSync(ignoreFilePath, 'utf8');
      // Splitting the file content by new line or space
      const array = data.split(/\r?\n|\s+/);
      foldersToExclude = foldersToExclude.concat(array);
    }
  } catch (err) {
  }
  const { dependencies, devDependencies } = packageJson;
  const allDependencies = {...dependencies, ...devDependencies};
  const { filesWithDependencies, unusedDependencies } = findFilesUsingDependencies(projectPath, foldersToExclude, allDependencies);
  fs.writeFileSync(outputFile, JSON.stringify([ {
    usedDependencies : filesWithDependencies,
    unusedDependencies : unusedDependencies
  }], null, 2), "utf-8");
  console.log('Open ' + outputFile);
  // console.log('Files with dependencies:', filesWithDependencies);
  // console.log('Unused dependencies:', unusedDependencies);
} catch (err) {
  console.error('Error:', err);
}