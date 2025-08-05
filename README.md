# Lua File Creator

**Lua File Creator** is a Visual Studio Code extension that helps you quickly scaffold Lua and Luau files, including support for the Roblox Knit framework. With configurable file types and naming conventions, this tool boosts productivity when working with Roblox Lua projects.

---

## 🚀 Features

- Quickly create common Lua file types:
    - `ModuleScript`
    - `Script` (Server)
    - `LocalScript` (Client)
- Optional support for [Knit](https://github.com/Sleitnick/Knit) framework:
    - `Controller`
    - `Service`
- Intelligent filename suggestions and validation
- Automatic incrementing if file already exists
- Simple templates included for quick file creation
- Works with `.lua`, `.luau`, or any custom extension

![Demo](images/feature-x.png) <!-- Replace with actual GIF or image if available -->

---

## ⚙️ Requirements

- VS Code 1.60.0 or newer
- A workspace folder must be open in VS Code to create files

---

## 🛠 Extension Settings

This extension contributes the following settings under `Settings` in your `settings.json`:

| Setting             | Type     | Description                                    |
|---------------------|----------|------------------------------------------------|
| `Settings.type`     | `string` | File extension to use (e.g., `.lua`, `.luau`) |
| `Settings.Knit`     | `boolean`| Enable/disable Knit-specific file types       |

Example:
```json
{
  "Settings": {
    "type": ".luau",
    "Knit": true
  }
}
```

---

## 📂 Commands

You can trigger these commands via the Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`):

- `Lua File Creator: Create ModuleScript`
- `Lua File Creator: Create Client Script`
- `Lua File Creator: Create Server Script`
- `Lua File Creator: Create Knit Controller`
- `Lua File Creator: Create Knit Service`

> Context menus for file creation are also available in the Explorer pane when enabled.

---

## 🧠 Known Issues

- Template contents are currently minimal; customizable templates are not yet supported
- Filename validation is strict and may block some edge cases

---

## 📦 Release Notes

### 1.0.0

- Initial release with basic Lua file creation
- Fixed bug with file extension handling
- Improved validation for Knit file names
- Added intelligent file naming and incrementing
- Enabled setting changes to take effect live
---

## 📚 Resources

- [VS Code Extension Guidelines](https://code.visualstudio.com/api/references/extension-guidelines)
- [Roblox Knit Framework](https://github.com/Sleitnick/Knit)
- [Markdown Reference](https://www.markdownguide.org/basic-syntax/)

---

## ✨ Enjoy Using Lua File Creator?

Leave a ⭐ on the [GitHub repo](https://github.com/your-repo-url) (if public) or share it with fellow Lua developers!
