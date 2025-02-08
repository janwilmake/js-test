# Vanilla JS with Types

Problem: If you make a project in VSCode now with HTML, JS, and CSS files, the traditional way, we don't get all the cool typescript features we would like. I've tried reading https://code.visualstudio.com/docs/nodejs/working-with-javascript and https://code.visualstudio.com/docs/languages/jsconfig but with no avail. Unfortunately the only way seems to be to make a global .d.ts file with the types. We can generate this automatically by analysing our HTML and JS files, and run a watcher for every project, but an even better way would be to do this automatically via the VSCode extension.

Imagine a world where we get all the typescript benefits in standard HTML and JS! Imagine we could even create typesafe functions interacting with apis. That would be INSANELY USEFUL.

Goal:

- get perfect type annotation in JS and HTML files
- maybe even overwrite `document.getElementById` to match the available HTML ids, and other stuff like that, by parsing the HTML and making these types available as well.
- use oapis.org to also get typesafe apis and put those in scope too.

# VSCode Extension Idea

An interesting answer from Claude: https://claude.ai/chat/135abfe8-b4d8-4443-9633-f4a121b7df5b

Yes, absolutely! We could create a VS Code extension that automatically generates type definitions for classic JavaScript files. Here's how it could work:

```js
// extension.ts
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export function activate(context: vscode.ExtensionContext) {
    let typeGenerator = new TypeDefinitionGenerator();

    // Watch for changes in JavaScript files
    let fileWatcher = vscode.workspace.createFileSystemWatcher('**/*.js');

    fileWatcher.onDidChange((uri) => {
        typeGenerator.generateTypesForWorkspace();
    });

    fileWatcher.onDidCreate((uri) => {
        typeGenerator.generateTypesForWorkspace();
    });

    fileWatcher.onDidDelete((uri) => {
        typeGenerator.generateTypesForWorkspace();
    });

    // Register command to manually regenerate types
    let disposable = vscode.commands.registerCommand('classicjs.regenerateTypes', () => {
        typeGenerator.generateTypesForWorkspace();
    });

    context.subscriptions.push(disposable, fileWatcher);
}

class TypeDefinitionGenerator {
    private async getJsFiles(): Promise<vscode.Uri[]> {
        const files = await vscode.workspace.findFiles(
            '**/*.js',
            '**/node_modules/**'
        );
        return files;
    }

    private async findHtmlFiles(): Promise<vscode.Uri[]> {
        const files = await vscode.workspace.findFiles(
            '**/*.html',
            '**/node_modules/**'
        );
        return files;
    }

    private async analyzeScriptOrder(): Promise<string[]> {
        const htmlFiles = await this.findHtmlFiles();
        const orderedScripts: string[] = [];
        const seenScripts = new Set<string>();

        for (const htmlFile of htmlFiles) {
            const content = await fs.promises.readFile(htmlFile.fsPath, 'utf8');
            const scriptRegex = /<script\s+src=["']([^"']+)["']/g;
            let match;

            while ((match = scriptRegex.exec(content)) !== null) {
                const scriptSrc = match[1];
                if (!seenScripts.has(scriptSrc)) {
                    orderedScripts.push(scriptSrc);
                    seenScripts.add(scriptSrc);
                }
            }
        }

        return orderedScripts;
    }

    private extractFunctionDeclarations(content: string): any {
        const functionDeclarations: any[] = [];
        const functionRegex = /function\s+(\w+)\s*\(([\s\S]*?)\)/g;
        let match;

        while ((match = functionRegex.exec(content)) !== null) {
            const name = match[1];
            const params = match[2].split(',').map(param => param.trim());

            // Look for JSDoc comments
            const beforeFunction = content.slice(0, match.index);
            const jsdocMatch = beforeFunction.match(/\/\*\*\s*([\s\S]*?)\s*\*\/\s*$/);

            let typeInfo = {
                params: params.map(p => ({ name: p, type: 'any' })),
                returnType: 'any'
            };

            if (jsdocMatch) {
                // Parse JSDoc for types
                const jsdoc = jsdocMatch[1];

                // Extract param types
                const paramMatches = jsdoc.match(/@param\s+{([^}]+)}\s+(\w+)/g);
                if (paramMatches) {
                    paramMatches.forEach((paramMatch, index) => {
                        const [_, type, name] = paramMatch.match(/@param\s+{([^}]+)}\s+(\w+)/)!;
                        if (index < typeInfo.params.length) {
                            typeInfo.params[index].type = type;
                        }
                    });
                }

                // Extract return type
                const returnMatch = jsdoc.match(/@returns?\s+{([^}]+)}/);
                if (returnMatch) {
                    typeInfo.returnType = returnMatch[1];
                }
            }

            functionDeclarations.push({ name, typeInfo });
        }

        return functionDeclarations;
    }

    private async generateTypeDefinitions(files: Map<string, string>): Promise<string> {
        let output = '// Auto-generated type definitions\n\n';

        for (const [filename, content] of files) {
            const declarations = this.extractFunctionDeclarations(content);

            declarations.forEach((func: any) => {
                const params = func.typeInfo.params
                    .map((p: any) => `${p.name}: ${p.type}`)
                    .join(', ');

                output += `declare function ${func.name}(${params}): ${func.typeInfo.returnType};\n`;
            });

            output += '\n';
        }

        return output;
    }

    public async generateTypesForWorkspace() {
        try {
            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (!workspaceFolders) return;

            const files = await this.getJsFiles();
            const scriptOrder = await this.analyzeScriptOrder();

            // Read files in order of script tags
            const orderedFiles = new Map<string, string>();

            for (const scriptSrc of scriptOrder) {
                const matchingFile = files.find(f => f.fsPath.endsWith(scriptSrc));
                if (matchingFile) {
                    const content = await fs.promises.readFile(matchingFile.fsPath, 'utf8');
                    orderedFiles.set(scriptSrc, content);
                }
            }

            // Generate type definitions
            const typeDefinitions = await this.generateTypeDefinitions(orderedFiles);

            // Write to js.d.ts in workspace root
            const rootPath = workspaceFolders[0].uri.fsPath;
            const typesPath = path.join(rootPath, 'js.d.ts');
            await fs.promises.writeFile(typesPath, typeDefinitions);

            vscode.window.showInformationMessage('Type definitions generated successfully!');
        } catch (error) {
            vscode.window.showErrorMessage('Error generating type definitions: ' + error);
        }
    }
}

export function deactivate() {}
```

This VS Code extension:

1. Watches for changes in JavaScript files
2. Analyzes HTML files to determine script loading order
3. Generates type definitions based on JSDoc comments and function declarations
4. Creates/updates a `js.d.ts` file automatically

Key features:

- Maintains correct order of declarations based on script tag order in HTML
- Automatic type generation on file changes
- Manual regeneration command
- Excludes node_modules
- Parses JSDoc comments for type information

To complete the extension, you'd need:

1. A package.json for the extension:

```json
{
  "name": "vscode-classic-js-types",
  "displayName": "Classic JS Types",
  "description": "Type definitions generator for classic JavaScript files",
  "version": "0.0.1",
  "engines": {
    "vscode": "^1.85.0"
  },
  "categories": ["Other"],
  "activationEvents": ["workspaceContains:**/*.js"],
  "main": "./out/extension.js",
  "contributes": {
    "commands": [
      {
        "command": "classicjs.regenerateTypes",
        "title": "Regenerate Classic JS Types"
      }
    ]
  }
}
```

2. Install & build scripts:

```json
{
  "scripts": {
    "vscode:prepublish": "npm run compile",
    "compile": "tsc -p ./",
    "watch": "tsc -watch -p ./",
    "lint": "eslint src --ext ts"
  }
}
```

Would you like me to:

1. Add more advanced type inference features?
2. Add support for global window object properties?
3. Show how to publish this as a VS Code extension?
