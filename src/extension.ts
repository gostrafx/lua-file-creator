import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import {fileTemplates,FileTemplate} from './templates';


export async function activate(context: vscode.ExtensionContext) {
    console.log('Lua File Creator extension is now active');
    await vscode.commands.executeCommand('setContext', 'ext.menu.enable', true);

    // Initial config fetch
    let settings = vscode.workspace.getConfiguration("Settings");
    let extension = settings.get<string>("type") ?? '.luau';
    let Knit = settings.get<boolean>("Knit") ?? true;

    // React to setting changes
    vscode.workspace.onDidChangeConfiguration(event => {
        (async () => {
            if (
                event.affectsConfiguration("Settings.type") ||
                event.affectsConfiguration("Settings.Knit")
            ) {
                // Re-fetch updated settings
                const updatedSettings = vscode.workspace.getConfiguration("Settings");
                extension = updatedSettings.get<string>("type") ?? '.luau';
                const updatedKnit = updatedSettings.get<boolean>("Knit") ?? true;
                await vscode.commands.executeCommand('setContext', 'ext.menuKnit.enable', updatedKnit);
            }
        })();
    });

    await vscode.commands.executeCommand('setContext', 'ext.menuKnit.enable', Knit);
    // Register commands for each file type
    const moduleScriptCommand = vscode.commands.registerCommand('extension.ModuleScript', async (uri: vscode.Uri) => {
        await createFileFromTemplate(fileTemplates['ModuleScript'], uri, extension);
    });

    const clientCommand = vscode.commands.registerCommand('extension.Client', async (uri: vscode.Uri) => {
        await createFileFromTemplate(fileTemplates['Client'], uri, extension);
    });

    const serverCommand = vscode.commands.registerCommand('extension.Server', async (uri: vscode.Uri) => {
        await createFileFromTemplate(fileTemplates['Server'], uri, extension);
    });

    const knitController = vscode.commands.registerCommand('extension.KnitController', async (uri: vscode.Uri) => {
        await createFileFromTemplate(fileTemplates['Knit']["Controller"], uri, extension);
    });

    const knitService = vscode.commands.registerCommand('extension.KnitService', async (uri: vscode.Uri) => {
        await createFileFromTemplate(fileTemplates['Knit']["Service"], uri, extension);
    });

    context.subscriptions.push(
        moduleScriptCommand,
        clientCommand,
        serverCommand,
        knitController,
        knitService
    );

    context.subscriptions.push({
        dispose(): void {
            (async () => {
                await vscode.commands.executeCommand('setContext', 'ext.menu.enable', false);
            })();
        }
    });
}

async function createFileFromTemplate(template: FileTemplate, uri?: vscode.Uri, extension?: string) {
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
            const suffix = template.name === 'Controller' ? 'Controller' : 'Service';
            defaultName = `Name${suffix}${extension}`;
            selectionStart = 0;
            selectionEnd = 4; // Length of "Name"
        } else {
            // For other files, select everything except the extension
            defaultName = `${template.name}${extension}`;
            selectionStart = 0;

            // @ts-ignore
            selectionEnd = defaultName.length - extension.length;
        }

        // Prompt for filename with valueSelection for easy editing
        const fileName = await vscode.window.showInputBox({
            prompt: `Enter the name for your ${template.name}`,
            value: defaultName,
            valueSelection: [selectionStart, selectionEnd],
            validateInput: (value: string) => {
                if (!value || value.trim() === '') {
                    return 'Filename cannot be empty';
                }
                if (!/^[a-zA-Z0-9._-]+$/.test(value)) {
                    return 'Filename contains invalid characters';
                }

                // Special validation for Knit files
                if (template.name === 'NameController' || template.name === 'NameService') {

                    const withoutExtension = value.replace(<string>extension, '');
                    const suffix = template.name === 'NameController' ? 'Controller' : 'Service';

                    if (!withoutExtension.endsWith(suffix)) {
                        return `Filename must end with "${suffix}"`;
                    }

                    const namepart = withoutExtension.replace(suffix, '');
                    if (!namepart || namepart.trim() === '') {
                        return `Please provide a name before "${suffix}"`;
                    }
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
