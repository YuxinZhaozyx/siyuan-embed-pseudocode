import {
  Dialog,
  Plugin,
  getFrontend,
  fetchPost,
  fetchSyncPost,
  IWebSocketData,
} from "siyuan";
import "@/index.scss";
import PluginInfoString from '@/../plugin.json'
import { Editor } from "@/editor";
import { compilePseudocode } from "@/pseudocode";


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

    this._mutationObserver = new MutationObserver(mutations => {
      for (const mutation of mutations) {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach(node => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const blockElement = node as HTMLElement;
              if (blockElement.tagName === "DIV" &&
                blockElement.getAttribute('data-type') === 'NodeCodeBlock' &&
                blockElement.classList.contains('code-block') &&
                blockElement.getAttribute('custom-view') === 'pseudocode' &&
                blockElement.querySelector(".protyle-action__language")?.textContent === 'pseudocode'
              ) {
                const blockID = blockElement.getAttribute("data-node-id");
                const code = this.getBlockPseudocodeCode(blockElement);
                const pseudocodeConfig = this.getBlockPseudocodeConfigByElement(blockElement);
                this.setAutoAlgorithmNumber(blockElement, pseudocodeConfig);
                const compileResult = compilePseudocode(code, pseudocodeConfig);
                this.updatePseudocodeViewAttribute(blockID, pseudocodeConfig.view);
                this.updatePseudocodeElements(blockID, pseudocodeConfig, compileResult);
              }
            }
          });
        }
      }
    });

    this._mutationObserver.observe(document.body, {
      childList: true,
      subtree: true
    });

    this.protyleSlash = [{
      filter: ["pseudocode"],
      id: "pseudocode",
      html: `<div class="b3-list-item__first"><svg class="b3-list-item__graphic"><use xlink:href="#iconCode"></use></svg><span class="b3-list-item__text">pseudocode</span></div>`,
      callback: (protyle, nodeElement) => {
        const code = "";
        const blockID = nodeElement.getAttribute("data-node-id");
        const pseudocodeConfig = this.getDefaultPseudocodeConfig();
        console.log('pseudocodeConfig before', nodeElement, pseudocodeConfig);
        this.setAutoAlgorithmNumber(nodeElement, pseudocodeConfig);
        console.log('pseudocodeConfig after', pseudocodeConfig);
        console.log('code', code);
        const compileResult = compilePseudocode(code, pseudocodeConfig);
        console.log('compileResult:', compileResult);
        this.updatePseudocodeViewAttribute(blockID, pseudocodeConfig.view);
        this.updatePseudocodeBlockData(blockID, code, pseudocodeConfig, () => {
          this.updatePseudocodeElements(blockID, pseudocodeConfig, compileResult);
          const blockElement = document.querySelector(`protyle-wysiwyg [data-node-id="${blockID}"]`) as HTMLElement;
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
    console.log('openEditDialog', blockElement);
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
    const pseudocodeConfig = await this.getBlockPseudocodeConfigByID(blockID);
    (dialog.element.querySelector("[data-type=algorithm-label]") as HTMLInputElement).value = pseudocodeConfig.algorithmLabel;
    (dialog.element.querySelector("[data-type=algorithm-number]") as HTMLInputElement).value = pseudocodeConfig.algorithmNumber;
    (dialog.element.querySelector("[data-type=line-number]") as HTMLSelectElement).value = pseudocodeConfig.lineNumber;
    (dialog.element.querySelector("[data-type=block-ending]") as HTMLSelectElement).value = pseudocodeConfig.blockEnding;
    (dialog.element.querySelector("[data-type=scope-line]") as HTMLSelectElement).value = pseudocodeConfig.scopeLine;

    // 获取伪代码源码
    const code = this.getBlockPseudocodeCode(blockElement).trim();

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

      this.setAutoAlgorithmNumber(blockElement, pseudocodeConfig);
      const compileResult = compilePseudocode(code, pseudocodeConfig);
      this.updatePseudocodeBlockData(blockID, code, pseudocodeConfig, () => {
        this.updatePseudocodeElements(blockID, pseudocodeConfig, compileResult);
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

  public getPlaceholderContent(errorMessage: string): string {
    let content = `<div class="ft__error" align="center">pseudocode render error:<br>${errorMessage}</div>`;
    return content;
  }

  public updatePseudocodeBlockData(blockID: string, code: string, config: IPseudocodeConfig, callback: () => void) {
    fetchPost('/api/block/updateBlock', {
      id: blockID,
      data: `\`\`\`pseudocode\n${code}\n\`\`\``,
      dataType: "markdown",
    }, () => {
      fetchPost("/api/attr/setBlockAttrs", {
        id: blockID,
        attrs: {
          "custom-view": config.view,
          "custom-algorithm-label": config.algorithmLabel,
          "custom-algorithm-number": config.algorithmNumber,
          "custom-line-number": config.lineNumber,
          "custom-block-ending": config.blockEnding,
          "custom-scope-line": config.scopeLine,
        },
      }, () => {
        callback();
      });
    });
  }

  private updatePseudocodeElements(blockID: string, config: IPseudocodeConfig, compileResult: IResCompilePseudocode) {
    if (compileResult) {
      document.querySelectorAll(`.protyle-wysiwyg [data-node-id="${blockID}"]`).forEach((blockElement: HTMLElement) => {
        if (config.view == "pseudocode") {
          this.switchPseudocodeView("on", blockElement);
          const containerElement = blockElement.querySelector(".pseudocode-container") as HTMLElement;
          if (containerElement) {
            containerElement.innerHTML = compileResult.ok ? compileResult.html : this.getPlaceholderContent(compileResult.message);
          }
        }
      });
    }
  }

  private switchPseudocodeView(mode: "on" | "off", blockElement: HTMLElement) {
    const codeElement = blockElement.querySelector(".hljs");
    if (codeElement) {
      codeElement.classList.toggle("fn__none", mode === "on");
      blockElement.querySelector(".protyle-action__language").classList.toggle("fn__none", mode === "on");
      blockElement.setAttribute("custom-view", mode === "on" ? "pseudocode" : "");
      const containerElement = blockElement.querySelector(".pseudocode-container");
      if (mode === "on") {
        if (!containerElement) {
          codeElement.insertAdjacentHTML('afterend', '<div class="pseudocode-container"></div>');
        }
      } else {
        if (containerElement) containerElement.remove();
      }
    }
  }

  private updatePseudocodeViewAttribute(blockID: string, view: string) {
    fetchPost("/api/attr/setBlockAttrs", {
      id: blockID,
      attrs: {
        "custom-view": view,
      }
    });
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
              const pseudocodeConfig = this.getDefaultPseudocodeConfig();
              const code = response.data["custom-latex-code"] || "";
              pseudocodeConfig.algorithmLabel = response.data["custom-titile-prefix"] || pseudocodeConfig.algorithmLabel;
              pseudocodeConfig.algorithmNumber = response.data["custom-caption-count"] || pseudocodeConfig.algorithmNumber;
              pseudocodeConfig.lineNumber = response.data["custom-line-number"] || pseudocodeConfig.lineNumber;
              pseudocodeConfig.blockEnding = response.data["custom-block-ending"] || pseudocodeConfig.blockEnding;
              pseudocodeConfig.scopeLine = response.data["custom-scope-line"] || pseudocodeConfig.scopeLine;

              this.setAutoAlgorithmNumber(selectedElement, pseudocodeConfig);
              const compileResult = compilePseudocode(code, pseudocodeConfig);
              this.updatePseudocodeViewAttribute(blockID, pseudocodeConfig.view);
              this.updatePseudocodeBlockData(blockID, code, pseudocodeConfig, () => {
                this.updatePseudocodeElements(blockID, pseudocodeConfig, compileResult);
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
            this.updatePseudocodeViewAttribute(selectedElement.getAttribute("data-node-id"), "");
            this.switchPseudocodeView("off", selectedElement);
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
            const code = this.getBlockPseudocodeCode(selectedElement);
            const pseudocodeConfig = this.getBlockPseudocodeConfigByElement(selectedElement);
            this.setAutoAlgorithmNumber(selectedElement, pseudocodeConfig);
            const compileResult = compilePseudocode(code, pseudocodeConfig);
            pseudocodeConfig.view = "pseudocode";
            this.updatePseudocodeViewAttribute(blockID, pseudocodeConfig.view);
            this.updatePseudocodeElements(blockID, pseudocodeConfig, compileResult);
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

  private getDefaultPseudocodeConfig(): IPseudocodeConfig {
    return {
      view: "pseudocode",
      algorithmLabel: "Algorithm",
      algorithmNumber: "",
      lineNumber: "true",
      blockEnding: "false",
      scopeLine: "false",
      _defaultAlgorithmNumber: "1",
    }
  }

  private async getBlockPseudocodeConfigByID(blockID: string): Promise<IPseudocodeConfig> {
    const config = this.getDefaultPseudocodeConfig();
    const response = await fetchSyncPost("/api/attr/getBlockAttrs", { id: blockID })
    if (response.code != 0) {
      throw new Error("get block attrs failed");
    };
    if (response.data) {
      config.view = response.data["custom-view"] || "";
      config.algorithmLabel = response.data["custom-algorithm-label"] || config.algorithmLabel;
      config.algorithmNumber = response.data["custom-algorithm-number"] || config.algorithmNumber;
      config.lineNumber = response.data["custom-line-number"] || config.lineNumber;
      config.blockEnding = response.data["custom-block-ending"] || config.blockEnding;
      config.scopeLine = response.data["custom-scope-line"] || config.scopeLine;
    }
    return config;
  }

  private getBlockPseudocodeConfigByElement(blockElement: HTMLElement): IPseudocodeConfig {
    const config = this.getDefaultPseudocodeConfig();
    config.view = blockElement.getAttribute("custom-view") || "";
    config.algorithmLabel = blockElement.getAttribute("custom-algorithm-label") || config.algorithmLabel;
    config.algorithmNumber = blockElement.getAttribute("custom-algorithm-number") || config.algorithmNumber;
    config.lineNumber = blockElement.getAttribute("custom-line-number") || config.lineNumber;
    config.blockEnding = blockElement.getAttribute("custom-block-ending") || config.blockEnding;
    config.scopeLine = blockElement.getAttribute("custom-scope-line") || config.scopeLine;
    return config;
  }

  private getBlockPseudocodeCode(blockElement: HTMLElement): string {
    return blockElement.querySelector(".hljs")?.textContent || "";
  }

  private setAutoAlgorithmNumber(blockElement: HTMLElement, pseudocodeConfig: IPseudocodeConfig) {
    if (!pseudocodeConfig.algorithmNumber) {
      let rootElement = blockElement;
      while (rootElement.parentElement && !rootElement.classList.contains("protyle-wysiwyg")) {
        rootElement = rootElement.parentElement;
      }
      const originType = blockElement.getAttribute("data-type");
      const originView = blockElement.getAttribute("custom-view");
      blockElement.setAttribute("data-type", "NodeCodeBlock");
      blockElement.setAttribute("custom-view", "pseudocode");
      pseudocodeConfig._defaultAlgorithmNumber = (Array.from(rootElement.querySelectorAll("[data-type='NodeCodeBlock'][custom-view='pseudocode']")).indexOf(blockElement) + 1).toString();
      blockElement.setAttribute("data-type", originType);
      blockElement.setAttribute("custom-view", originView);
    }
  }

}
