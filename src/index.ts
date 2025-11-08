import {
  Dialog,
  Plugin,
  getFrontend,
  fetchPost,
  IWebSocketData,
} from "siyuan";
import "@/index.scss";
import PluginInfoString from '@/../plugin.json'
import { Editor } from "@/editor";
import { initPseudocode, compilePseudocode } from "@/pseudocode";
import {
  getBlockPseudocodeCode,
  getDefaultPseudocodeConfig,
  getBlockPseudocodeConfigByElement,
  getBlockPseudocodeConfigByID,
  setAutoAlgorithmNumber,
  updatePseudocodeBlockData,
  updatePseudocodeElements,
  updatePseudocodeViewAttribute,
  switchPseudocodeView,
  setAutoCompileMuatationObserver,
  turnOnAllPseudocodeView,
  turnOffAllPseudocodeView,
} from "@/main";

let PluginInfo = {
  version: '',
}
try {
  PluginInfo = PluginInfoString
} catch (err) {
  console.log('Plugin info parse error: ', err)
}
const {
  version,
} = PluginInfo

export default class PseudocodePlugin extends Plugin {
  // Run as mobile
  public isMobile: boolean
  // Run in browser
  public isBrowser: boolean
  // Run as local
  public isLocal: boolean
  // Run in Electron
  public isElectron: boolean
  // Run in window
  public isInWindow: boolean
  public platform: SyFrontendTypes
  public readonly version = version

  private _mutationObserver: MutationObserver;
  private _clickBlockIconHandler;
  private _globalKeyDownHandler;

  async onload() {
    this.initMetaInfo();

    this.setPdfScript();

    initPseudocode(() => {
      turnOnAllPseudocodeView();
    });

    this._mutationObserver = setAutoCompileMuatationObserver(document.body);

    this.protyleSlash = [{
      filter: ["pseudocode"],
      id: "pseudocode",
      html: `<div class="b3-list-item__first"><svg class="b3-list-item__graphic"><use xlink:href="#iconCode"></use></svg><span class="b3-list-item__text">pseudocode</span></div>`,
      callback: (protyle, nodeElement) => {
        const code = "";
        const blockID = nodeElement.getAttribute("data-node-id");
        const pseudocodeConfig = getDefaultPseudocodeConfig();
        setAutoAlgorithmNumber(nodeElement, pseudocodeConfig);
        const compileResult = compilePseudocode(code, pseudocodeConfig);
        updatePseudocodeViewAttribute(blockID, pseudocodeConfig.view);
        updatePseudocodeBlockData(blockID, code, pseudocodeConfig, () => {
          updatePseudocodeElements(blockID, pseudocodeConfig, compileResult);
          const blockElement = document.querySelector(`.protyle-wysiwyg [data-node-id="${blockID}"]`) as HTMLElement;
          if (blockElement) {
            this.openEditDialog(blockElement, false, false);
          }
        });
      },
    }];

    if (!window.siyuan.config.readonly) {
      this._clickBlockIconHandler = this.clickBlockIconHandler.bind(this);
      this.eventBus.on("click-blockicon", this._clickBlockIconHandler);
    }

    this._globalKeyDownHandler = this.globalKeyDownHandler.bind(this);
    document.documentElement.addEventListener("keydown", this._globalKeyDownHandler);
  }

  onunload() {
    turnOffAllPseudocodeView();
    if (this._mutationObserver) this._mutationObserver.disconnect();
    if (this._clickBlockIconHandler) this.eventBus.off("click-blockicon", this._clickBlockIconHandler);
    if (this._globalKeyDownHandler) document.documentElement.removeEventListener("keydown", this._globalKeyDownHandler);
  }

  // openSetting() {
  // }

  private initMetaInfo() {
    const frontEnd = getFrontend();
    this.platform = frontEnd as SyFrontendTypes
    this.isMobile = frontEnd === "mobile" || frontEnd === "browser-mobile";
    this.isBrowser = frontEnd.includes('browser');
    this.isLocal = location.href.includes('127.0.0.1') || location.href.includes('localhost');
    this.isInWindow = location.href.includes('window.html');

    try {
      require("@electron/remote")
        .require("@electron/remote/main");
      this.isElectron = true;
    } catch (err) {
      this.isElectron = false;
    }
  }

  public async openEditDialog(blockElement: HTMLElement, autoCompile?: boolean, autoClose?: boolean) {
    const editDialogHTML = `
<div class="pseudocode-edit-dialog">
    <div class="edit-dialog-header resize__move"></div>
    <div class="edit-dialog-container">
        <div class="edit-dialog-toolbar">
          <input class="b3-text-field" data-type="algorithm-label" type="text" placeholder="${this.i18n.algorithmLabelPlaceholder}">
          <input class="b3-text-field" data-type="algorithm-number" type="number" placeholder="${this.i18n.algorithmNumberPlaceholder}">
          <select class="b3-select" data-type="line-number"><option value="false">${this.i18n.withoutLineNumber}</option><option value="true">${this.i18n.withLineNumber}</option></select>
          <select class="b3-select" data-type="block-ending"><option value="false">${this.i18n.withoutBlockEnding}</option><option value="true">${this.i18n.withBlockEnding}</option></select>
          <select class="b3-select" data-type="scope-line"><option value="false">${this.i18n.withoutScopeLine}</option><option value="true">${this.i18n.withScopeLine}</option></select>
        </div>
        <div class="fn__hr--b"></div>
        <div class="edit-dialog-editor"></div>
        <div class="fn__hr--b"></div>
        <textarea readonly class="edit-dialog-message fn__none" placeholder="${this.i18n.noMessage}"></textarea>
    </div>
    <div class="b3-dialog__action">
        <div data-action="main">
            <button data-action="success" class="b3-button b3-button--success fn__none">${this.i18n.compileSuccessButton}</button>
            <button data-action="error" class="b3-button b3-button--error fn__none">${this.i18n.compileErrorButton}</button>
            <div class="fn__space"></div>
            <button data-action="compile" class="b3-button b3-button--text">${this.i18n.compile}</button>
        </div>
        <div data-action="compiling" class="status__backgroundtask fn__none">${this.i18n.compiling}<div><div></div></div></div>
    </div>
</div>
    `;

    const dialog = new Dialog({
      content: editDialogHTML,
      width: this.isMobile ? "92vw" : "70vw",
      height: "80vh",
      hideCloseIcon: this.isMobile,
    });

    const blockID = blockElement.getAttribute("data-node-id");
    const pseudocodeConfig = await getBlockPseudocodeConfigByID(blockID);
    (dialog.element.querySelector("[data-type=algorithm-label]") as HTMLInputElement).value = pseudocodeConfig.algorithmLabel;
    (dialog.element.querySelector("[data-type=algorithm-number]") as HTMLInputElement).value = pseudocodeConfig.algorithmNumber;
    (dialog.element.querySelector("[data-type=line-number]") as HTMLSelectElement).value = pseudocodeConfig.lineNumber;
    (dialog.element.querySelector("[data-type=block-ending]") as HTMLSelectElement).value = pseudocodeConfig.blockEnding;
    (dialog.element.querySelector("[data-type=scope-line]") as HTMLSelectElement).value = pseudocodeConfig.scopeLine;

    // 获取伪代码源码
    const code = getBlockPseudocodeCode(blockElement).trim();

    // 创建编辑器
    const editorContainer = dialog.element.querySelector(".edit-dialog-editor") as HTMLElement;
    const editor = new Editor(editorContainer, code);
    editor.focus();

    const compileHandler = async () => {
      editor.setEditable(false);
      dialog.element.querySelector("[data-action=main]").classList.toggle("fn__none", true);
      dialog.element.querySelector("[data-action=compiling]").classList.toggle("fn__none", false);
      dialog.element.querySelector(".edit-dialog-message").classList.toggle("fn__none", true);

      pseudocodeConfig.algorithmLabel = (dialog.element.querySelector("[data-type=algorithm-label]") as HTMLInputElement).value;
      pseudocodeConfig.algorithmNumber = (dialog.element.querySelector("[data-type=algorithm-number]") as HTMLInputElement).value;
      pseudocodeConfig.lineNumber = (dialog.element.querySelector("[data-type=line-number]") as HTMLSelectElement).value;
      pseudocodeConfig.blockEnding = (dialog.element.querySelector("[data-type=block-ending]") as HTMLSelectElement).value;
      pseudocodeConfig.scopeLine = (dialog.element.querySelector("[data-type=scope-line]") as HTMLSelectElement).value;
      const code = editor.getContent().trim();

      setAutoAlgorithmNumber(blockElement, pseudocodeConfig);
      const compileResult = compilePseudocode(code, pseudocodeConfig);
      updatePseudocodeBlockData(blockID, code, pseudocodeConfig, () => {
        updatePseudocodeElements(blockID, pseudocodeConfig, compileResult);
      });

      dialog.element.querySelector("[data-action=success]").classList.toggle("fn__none", !compileResult.ok);
      dialog.element.querySelector("[data-action=error]").classList.toggle("fn__none", compileResult.ok);
      dialog.element.querySelector(".edit-dialog-message").classList.toggle("fn__none", compileResult.ok);
      (dialog.element.querySelector(".edit-dialog-message") as HTMLTextAreaElement).value = compileResult.message;
      if (autoClose && compileResult.ok) dialog.destroy();

      editor.setEditable(true);
      dialog.element.querySelector("[data-action=main]").classList.toggle("fn__none", false);
      dialog.element.querySelector("[data-action=compiling]").classList.toggle("fn__none", true);
    }
    dialog.element.querySelector("[data-action=compile]").addEventListener("click", compileHandler);

    const compileSuccessHandler = () => {
      dialog.destroy();
    }
    dialog.element.querySelector("[data-action=success]").addEventListener("click", compileSuccessHandler);

    const compileErrorHandler = () => {
      dialog.element.querySelector(".edit-dialog-message").classList.toggle("fn__none");
    }
    dialog.element.querySelector("[data-action=error]").addEventListener("click", compileErrorHandler);

    if (autoCompile) compileHandler();
  }

  private clickBlockIconHandler({ detail }) {
    if (detail.blockElements.length != 1) return;
    const selectedElement = detail.blockElements[0];
    // 挂件块的转换
    const iframeElement = selectedElement.querySelector("iframe[src='/widgets/siyuan-pseudocode/']");
    if (iframeElement) {
      window.siyuan.menus.menu.addItem({
        id: "transform-pseudocode",
        icon: 'iconRefresh',
        label: `${this.i18n.transformPseudocode}`,
        index: 0,
        click: () => {
          const blockID = selectedElement.getAttribute("data-node-id");
          fetchPost('/api/attr/getBlockAttrs', { id: blockID }, (response: IWebSocketData) => {
            if (response.code != 0) {
              throw new Error("get block attrs failed");
            };
            if (response.data) {
              const pseudocodeConfig = getDefaultPseudocodeConfig();
              const code = response.data["custom-latex-code"] || "";
              pseudocodeConfig.algorithmLabel = response.data["custom-titile-prefix"] || pseudocodeConfig.algorithmLabel;
              pseudocodeConfig.algorithmNumber = response.data["custom-caption-count"] || pseudocodeConfig.algorithmNumber;
              pseudocodeConfig.lineNumber = response.data["custom-line-number"] || pseudocodeConfig.lineNumber;
              pseudocodeConfig.blockEnding = response.data["custom-block-ending"] || pseudocodeConfig.blockEnding;
              pseudocodeConfig.scopeLine = response.data["custom-scope-line"] || pseudocodeConfig.scopeLine;

              setAutoAlgorithmNumber(selectedElement, pseudocodeConfig);
              const compileResult = compilePseudocode(code, pseudocodeConfig);
              updatePseudocodeViewAttribute(blockID, pseudocodeConfig.view);
              updatePseudocodeBlockData(blockID, code, pseudocodeConfig, () => {
                updatePseudocodeElements(blockID, pseudocodeConfig, compileResult);
              });

            }
          })
        }
      });
    }
    // 对伪代码代码块的处理
    if (selectedElement.querySelector("[data-type='NodeCodeBlock'] .protyle-action__language")?.textContent == "pseudocode") {
      if (selectedElement.getAttribute("custom-view") == "pseudocode") {
        // 伪代码视图
        window.siyuan.menus.menu.addItem({
          id: "turn-off-pseudocode-view",
          icon: 'iconCode',
          label: `${this.i18n.turnOffPseudocodeView}`,
          index: 1,
          click: () => {
            updatePseudocodeViewAttribute(selectedElement.getAttribute("data-node-id"), "");
            switchPseudocodeView("off", selectedElement);
          }
        });
      } else {
        // 代码块视图
        window.siyuan.menus.menu.addItem({
          id: "turn-on-pseudocode-view",
          icon: 'iconCode',
          label: `${this.i18n.turnOnPseudocodeView}`,
          index: 1,
          click: () => {
            const blockID = selectedElement.getAttribute("data-node-id");
            const code = getBlockPseudocodeCode(selectedElement);
            const pseudocodeConfig = getBlockPseudocodeConfigByElement(selectedElement);
            setAutoAlgorithmNumber(selectedElement, pseudocodeConfig);
            const compileResult = compilePseudocode(code, pseudocodeConfig);
            pseudocodeConfig.view = "pseudocode";
            updatePseudocodeViewAttribute(blockID, pseudocodeConfig.view);
            updatePseudocodeElements(blockID, pseudocodeConfig, compileResult);
          }
        });
      }
      // 编辑伪代码
      window.siyuan.menus.menu.addItem({
        id: "edit-pseudocode",
        icon: 'iconEdit',
        label: `${this.i18n.editPseudocode}`,
        index: 1,
        click: () => {
          this.openEditDialog(selectedElement);
        }
      });
    }
  }

  private globalKeyDownHandler = (event: KeyboardEvent) => {
    // 如果是在代码编辑器里使用快捷键，则阻止冒泡 https://github.com/YuxinZhaozyx/siyuan-embed-tikz/issues/1
    if (document.activeElement.closest(".b3-dialog--open .pseudocode-edit-dialog")) {
      event.stopPropagation();
    }
  };

  private setPdfScript() {
    const injectStyle = document.createElement('style');
    injectStyle.id = `snippetCSS-pdf-pseudocode`;
    injectStyle.textContent = `</style><script src="/plugins/siyuan-embed-pseudocode/daemon.js"></script><style>`;
    document.head.appendChild(injectStyle);
  }

}
