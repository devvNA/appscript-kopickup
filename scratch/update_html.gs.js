/**
 * Validates that shared UI components exist in index.html
 * and no native alert()/confirm() calls remain.
 * Run this from Apps Script editor: validateHtmlMigration()
 */
function validateHtmlMigration() {
  var content = HtmlService.createHtmlOutputFromFile("index").getContent();

  var hasSharedDialog = content.indexOf('id="app-confirm-dialog"') !== -1;
  var hasSharedSnackbar = content.indexOf('id="app-snackbar"') !== -1;
  var hasNativeDialogCalls = /\b(?:alert|confirm)\(/.test(content);

  if (!hasSharedDialog || !hasSharedSnackbar) {
    throw new Error(
      "Shared confirmation/snackbar UI is missing from index.html. Add the reusable modal markup before running this migration helper."
    );
  }

  if (hasNativeDialogCalls) {
    throw new Error(
      "Native alert()/confirm() calls still exist. Replace them with showSnackbar() or await showConfirm()."
    );
  }

  Logger.log("✅ Shared confirmation/snackbar UI is implemented and no native dialogs remain.");
}
