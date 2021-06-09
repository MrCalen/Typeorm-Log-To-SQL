import * as vscode from "vscode";

export function activate(context: vscode.ExtensionContext) {
  let disposable = vscode.commands.registerCommand(
    "typeorm-query-to-sql.transformToSQL",
    () => {
      const editor = vscode.window.activeTextEditor;

      if (editor) {
        let document = editor.document;
        const selection = editor.selection;

        const text = document.getText(selection);

        let [query, rawParams] = text
          .replace("query: ", "")
          .split(" -- PARAMETERS: ")
          .map((e) => e.trim());

        let params;
        try {
          params = JSON.parse(rawParams);
        } catch (err) {
          return;
        }

        if (!Array.isArray(params)) {
          vscode.window.showInformationMessage("Params is not an array");
          return;
        }

        query = query.replace(/(\$[0-9]+)/g, "<#$1#>");

        console.log(params);

        for (let i = 0; i < params.length; i++) {
          const [formatedValue, withEscape] = formater(params[i]);
          query = query.replace(
            RegExp(`<#\\\$(${i + 1})#>`, "g"),
            ` ${withEscape ? "'" + formatedValue + "'" : formatedValue}`
          );
        }

        editor.edit((builder) => {
          builder.replace(selection, query);
        });

        vscode.languages.setTextDocumentLanguage(editor.document, "sql");
        vscode.commands.executeCommand("editor.action.formatDocument");
      }
    }
  );

  context.subscriptions.push(disposable);
}

const formater = (value: unknown) => {
  if (Array.isArray(value)) {
    return [JSON.stringify(value), true];
  }

  if (typeof value === "object") {
    return [JSON.stringify(value), true];
  }

  if (
    typeof value === "string" &&
    !isNaN(value as any) &&
    !isNaN(parseFloat(value as any))
  ) {
    return [parseFloat(value as any), false];
  }

  if (typeof value === "number") {
    return [value, false];
  }

  return [value, true];
};

export function deactivate() {}
