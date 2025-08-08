import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { FileTemplate, fileTemplates } from './templates';

export async function activate(context: vscode.ExtensionContext) {
    console.log('Lua File Creator extension is now active');
    await vscode.commands.executeCommand('setContext', 'ext.menu.enable', true);

    // Initial config fetch
    let settings = vscode.workspace.getConfiguration("luafilecreator.Settings");
    let extension = settings.get<string>("type") ?? '.luau';
    let Knit = settings.get<boolean>("Knit") ?? true;

    // React to setting changes
    vscode.workspace.onDidChangeConfiguration(e => {
        (async () => {
            if (
                e.affectsConfiguration("luafilecreator.Settings.type") ||
                e.affectsConfiguration("luafilecreator.Settings.Knit")
            ) {
                // Re-fetch updated settings
                const updatedSettings = vscode.workspace.getConfiguration("luafilecreator.Settings");
                extension = updatedSettings.get<string>("type") ?? '.luau';
                const updatedKnit = updatedSettings.get<boolean>("Knit") ?? true;
                await vscode.commands.executeCommand('setContext', 'ext.menuKnit.enable', updatedKnit);
            }
        })();
    });

    await vscode.commands.executeCommand('setContext', 'ext.menuKnit.enable', Knit);
    // Register commands for each file type
    const moduleScriptCommand = vscode.commands.registerCommand('extension.ModuleScript', async (uri: vscode.Uri) => {
        await createFileFromTemplate(fileTemplates['ModuleScript'], extension, uri);
    });

    const clientCommand = vscode.commands.registerCommand('extension.Client', async (uri: vscode.Uri) => {
        await createFileFromTemplate(fileTemplates['Client'], extension, uri);
    });

    const serverCommand = vscode.commands.registerCommand('extension.Server', async (uri: vscode.Uri) => {
        await createFileFromTemplate(fileTemplates['Server'], extension, uri);
    });

    const knitControllerCommand = vscode.commands.registerCommand('extension.KnitController', async (uri: vscode.Uri) => {
        await createFileFromTemplate(fileTemplates['Knit']["Controller"], extension, uri);
    });

    const knitServiceCommand = vscode.commands.registerCommand('extension.KnitService', async (uri: vscode.Uri) => {
        await createFileFromTemplate(fileTemplates['Knit']["Service"], extension, uri);
    });

    context.subscriptions.push(
        moduleScriptCommand,
        clientCommand,
        serverCommand,
        knitControllerCommand,
        knitServiceCommand
    );

    context.subscriptions.push({
        dispose(): void {
            (async () => {
                await vscode.commands.executeCommand('setContext', 'ext.menu.enable', false);
            })();
        }
    });
}

async function createFileFromTemplate(template: FileTemplate, extension: string, uri?: vscode.Uri) {
    try {
        // Determine the target directory
        let targetDir: string;

        if (uri && uri.fsPath) {
            const stat = fs.statSync(uri.fsPath);
            targetDir = stat.isDirectory() ? uri.fsPath : path.dirname(uri.fsPath);
        } else if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
            targetDir = vscode.workspace.workspaceFolders[0].uri.fsPath;
        } else {
            vscode.window.showErrorMessage('No workspace folder found');
            return;
        }

        // Create default name based on template type
        let defaultName: string;
        let selectionStart: number;
        let selectionEnd: number;

        if (template.name === 'Controller' || template.name === 'Service') {
            // For Knit files, select only the "Name" part
            defaultName = `Name${template.name}${extension}`.trim();
            selectionStart = 0;
            selectionEnd = 4; // Length of "Name"
        } else if (template.name === 'LocalScript' || template.name === 'Script') {
            const suffix = template.name === 'LocalScript' ? '.client' : '.server';
            defaultName = `${template.name}${suffix}${extension}`.trim();
            selectionStart = 0;
            selectionEnd = defaultName.split(".")[0].length; // Length of "Name"

        } else {
            // For other files, select everything except the extension
            defaultName = `${template.name}${extension}`.trim();
            selectionStart = 0;

            selectionEnd = defaultName.length - extension.length;
        }

        // Prompt for filename with valueSelection for easy editing
        const fileName = await vscode.window.showInputBox({
            prompt: `Enter the name for your ${template.name}`,
            value: defaultName.trim(),
            valueSelection: [selectionStart, selectionEnd],
            validateInput: (value: string) => {
                if (!value || value.trim() === '') {
                    return 'Filename cannot be empty';
                }
                if (!/^[a-zA-Z0-9._\- ]+$/.test(value)) {
                    return 'Filename contains invalid characters';
                }

                return null;
            }
        });

        if (!fileName) {
            return; // User cancelled
        }

        // Ensure the filename has the correct extension
        let finalFileName = fileName;
        if (!fileName.endsWith(<string>extension)) {
            // Remove any existing extension and add the template extension
            const baseName = path.parse(fileName).name;
            finalFileName = baseName + extension;
        }

        // Check if file already exists and increment if needed
        let finalFilePath = path.join(targetDir, finalFileName);
        let finalFileNameToUse = finalFileName;

        if (fs.existsSync(finalFilePath)) {
            const parsed = path.parse(finalFileName);
            const extension = parsed.ext;
            let baseName = parsed.name;
            let counter = 1;

            // Special handling for Knit files to increment the name part only
            if (template.name === 'Controller' || template.name === 'Service') {
                const suffix = template.name === 'Controller' ? 'Controller' : 'Service';
                const nameplate = baseName.replace(suffix, '');

                do {
                    const incrementedName = `${nameplate}${counter}${suffix}`;
                    finalFileNameToUse = `${incrementedName}${extension}`;
                    finalFilePath = path.join(targetDir, finalFileNameToUse);
                    counter++;
                } while (fs.existsSync(finalFilePath));
            } else if (template.name === 'LocalScript' || template.name === 'Script') {
                const suffix = template.name === 'LocalScript' ? '.client' : '.server';
                const nameplate = baseName.replace(suffix, '');

                do {
                    const incrementedName = `${nameplate}${counter}${suffix}`;
                    finalFileNameToUse = `${incrementedName}${extension}`;
                    finalFilePath = path.join(targetDir, finalFileNameToUse);
                    counter++;
                } while (fs.existsSync(finalFilePath));
            } else {
                // Standard increment for other file types
                do {
                    finalFileNameToUse = `${baseName}${counter}${extension}`;
                    finalFilePath = path.join(targetDir, finalFileNameToUse);
                    counter++;
                } while (fs.existsSync(finalFilePath));
            }

            finalFileName = finalFileNameToUse;
        }

        // Create the file with basic content based on template type
        let content: string;

        // Add basic content based on template type
        switch (template.name) {
            case 'ModuleScript':
                content = 'local module = {}\n\nreturn module\n';
                break;
            case 'LocalScript':
                content = '-- Client script\n\n';
                break;
            case 'Script':
                content = '-- Server script\n\n';
                break;
            case 'Controller':
                content = '';
                break;
            case 'Service':
                content = '';
                break;
            default:
                content = '-- Lua script\n\n';
        }

        // Write the file
        fs.writeFileSync(finalFilePath, content, 'utf8');

        // Open the file
        const document = await vscode.workspace.openTextDocument(finalFilePath);
        await vscode.window.showTextDocument(document);

        vscode.window.showInformationMessage(`Created ${template.name}: ${finalFileName}`);

    } catch (error) {
        vscode.window.showErrorMessage(`Error creating file: ${error}`);
    }
}

export async function deactivate() {
    console.log('Lua File Creator extension is now deactivated');
    await vscode.commands.executeCommand('setContext', 'ext.menu.enable', false);
}
