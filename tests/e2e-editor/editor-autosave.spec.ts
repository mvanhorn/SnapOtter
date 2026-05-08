import { createNewDocument, drawOnCanvas, expect, selectTool, test } from "./helpers";

test.describe("Editor Autosave", () => {
  test("editor saves state periodically (check localStorage has autosave data)", async ({
    editorPage: page,
  }) => {
    test.slow();

    await createNewDocument(page);

    // Draw something to mark the canvas dirty
    await selectTool(page, "brush");
    await drawOnCanvas(page, 100, 100, 300, 300);
    await page.waitForTimeout(300);

    // Manually trigger autosave by calling saveEditorState from the page context.
    // The autosave interval is 60s which is too long for E2E, so invoke directly.
    await page.evaluate(async () => {
      // The saveEditorState function writes to localStorage under this key
      const { saveEditorState } = await import("/src/components/editor/common/export-dialog.tsx");
      await saveEditorState();
    });
    await page.waitForTimeout(500);

    // Verify localStorage contains the autosave key
    const autosaveData = await page.evaluate(() => {
      return localStorage.getItem("snapotter-editor-autosave");
    });

    expect(autosaveData).not.toBeNull();

    // Parse and verify the structure
    const parsed = JSON.parse(autosaveData!);
    expect(parsed.version).toBe(1);
    expect(parsed.timestamp).toBeGreaterThan(0);
    expect(parsed.state).toBeDefined();
    expect(parsed.state.canvasSize).toBeDefined();
    expect(parsed.state.canvasSize.width).toBeGreaterThan(0);
    expect(parsed.state.canvasSize.height).toBeGreaterThan(0);
    expect(parsed.state.layers).toBeDefined();
    expect(Array.isArray(parsed.state.layers)).toBe(true);
  });

  test("modified content persists across page reload", async ({ editorPage: page }) => {
    test.slow();

    await createNewDocument(page);

    // Draw something to create content
    await selectTool(page, "brush");
    await drawOnCanvas(page, 100, 100, 300, 300);
    await page.waitForTimeout(300);

    // Trigger autosave manually
    await page.evaluate(async () => {
      const { saveEditorState } = await import("/src/components/editor/common/export-dialog.tsx");
      await saveEditorState();
    });
    await page.waitForTimeout(500);

    // Verify autosave data exists before reload
    const dataBefore = await page.evaluate(() => {
      return localStorage.getItem("snapotter-editor-autosave");
    });
    expect(dataBefore).not.toBeNull();

    // Reload the page
    await page.reload();
    await page.waitForTimeout(3000);

    // After reload, localStorage should still have the autosave data
    const dataAfter = await page.evaluate(() => {
      return localStorage.getItem("snapotter-editor-autosave");
    });
    expect(dataAfter).not.toBeNull();

    // The data should contain the same canvas dimensions
    const parsedBefore = JSON.parse(dataBefore!);
    const parsedAfter = JSON.parse(dataAfter!);
    expect(parsedAfter.state.canvasSize.width).toBe(parsedBefore.state.canvasSize.width);
    expect(parsedAfter.state.canvasSize.height).toBe(parsedBefore.state.canvasSize.height);
  });
});
