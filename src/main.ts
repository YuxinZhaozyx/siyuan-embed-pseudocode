import { fetchPost, fetchSyncPost } from "@/utils/fetch";
import { compilePseudocode } from "@/pseudocode";

export function turnOnAllPseudocodeView() {
  document.querySelectorAll(".code-block[data-type='NodeCodeBlock'][custom-view='pseudocode']").forEach((blockElement: HTMLElement) => {
    const blockID = blockElement.getAttribute("data-node-id");
    const code = getBlockPseudocodeCode(blockElement);
    const pseudocodeConfig = getBlockPseudocodeConfigByElement(blockElement);
    setAutoAlgorithmNumber(blockElement, pseudocodeConfig);
    const compileResult = compilePseudocode(code, pseudocodeConfig);
    updatePseudocodeViewAttribute(blockID, pseudocodeConfig.view);
    updatePseudocodeElements(blockID, pseudocodeConfig, compileResult);
  }); 
}

export function turnOffAllPseudocodeView() {
  document.querySelectorAll(".code-block[data-type='NodeCodeBlock'][custom-view='pseudocode']").forEach((blockElement: HTMLElement) => {
    switchPseudocodeView("off", blockElement);
  }); 
}

export function setAutoCompileMuatationObserver(element: HTMLElement): MutationObserver {
  const mutationObserver = new MutationObserver(mutations => {
    for (const mutation of mutations) {
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const addedElement = node as HTMLElement;
            if (addedElement.matches(".code-block[data-type='NodeCodeBlock'][custom-view='pseudocode']")) {
              const blockElement = addedElement as HTMLElement;
              const blockID = blockElement.getAttribute("data-node-id");
              const code = getBlockPseudocodeCode(blockElement);
              const pseudocodeConfig = getBlockPseudocodeConfigByElement(blockElement);
              setAutoAlgorithmNumber(blockElement, pseudocodeConfig);
              const compileResult = compilePseudocode(code, pseudocodeConfig);
              updatePseudocodeViewAttribute(blockID, pseudocodeConfig.view);
              updatePseudocodeElements(blockID, pseudocodeConfig, compileResult);
            } else {
              addedElement.querySelectorAll(".code-block[data-type='NodeCodeBlock'][custom-view='pseudocode']").forEach((blockElement: HTMLElement) => {
                const blockID = blockElement.getAttribute("data-node-id");
                const code = getBlockPseudocodeCode(blockElement);
                const pseudocodeConfig = getBlockPseudocodeConfigByElement(blockElement);
                setAutoAlgorithmNumber(blockElement, pseudocodeConfig);
                const compileResult = compilePseudocode(code, pseudocodeConfig);
                updatePseudocodeViewAttribute(blockID, pseudocodeConfig.view);
                updatePseudocodeElements(blockID, pseudocodeConfig, compileResult);
              })
            }
          }
        });
      }
    }
  });

  mutationObserver.observe(element, {
    childList: true,
    subtree: true
  });

  return mutationObserver;
}

export function getPlaceholderContent(errorMessage: string): string {
  let content = `<div class="ft__error" align="center">pseudocode render error:<br>${errorMessage}</div>`;
  return content;
}

export function updatePseudocodeBlockData(blockID: string, code: string, config: IPseudocodeConfig, callback: () => void) {
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

export function updatePseudocodeElements(blockID: string, config: IPseudocodeConfig, compileResult: IResCompilePseudocode) {
  if (compileResult) {
    document.querySelectorAll(`.protyle-wysiwyg [data-node-id="${blockID}"]`).forEach((blockElement: HTMLElement) => {
      if (config.view == "pseudocode") {
        switchPseudocodeView("on", blockElement);
        const containerElement = blockElement.querySelector(".pseudocode-container") as HTMLElement;
        if (containerElement) {
          containerElement.innerHTML = compileResult.ok ? compileResult.html : getPlaceholderContent(compileResult.message);
        }
      }
    });
  }
}

export function switchPseudocodeView(mode: "on" | "off", blockElement: HTMLElement) {
  const codeElement = blockElement.querySelector(".hljs");
  if (codeElement) {
    codeElement.classList.toggle("fn__none", mode === "on");
    blockElement.querySelector(".protyle-action__language").classList.toggle("fn__none", mode === "on");
    const containerElement = blockElement.querySelector(".pseudocode-container");
    if (mode === "on") {
      if (!containerElement) {
        codeElement.insertAdjacentHTML('afterend', '<div spin="1" class="pseudocode-container" contenteditable="false"></div>');
      }
    } else {
      if (containerElement) containerElement.remove();
    }
  }
}

export function updatePseudocodeViewAttribute(blockID: string, view: string) {
  document.querySelectorAll(`.code-block[data-node-id="${blockID}"]`).forEach((blockElement: HTMLElement) => {
    blockElement.setAttribute("custom-view", view);
  });
  fetchPost("/api/attr/setBlockAttrs", {
    id: blockID,
    attrs: {
      "custom-view": view,
    }
  });
}

export function getDefaultPseudocodeConfig(): IPseudocodeConfig {
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

export async function getBlockPseudocodeConfigByID(blockID: string): Promise<IPseudocodeConfig> {
  const config = getDefaultPseudocodeConfig();
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

export function getBlockPseudocodeConfigByElement(blockElement: HTMLElement): IPseudocodeConfig {
  const config = getDefaultPseudocodeConfig();
  config.view = blockElement.getAttribute("custom-view") || "";
  config.algorithmLabel = blockElement.getAttribute("custom-algorithm-label") || config.algorithmLabel;
  config.algorithmNumber = blockElement.getAttribute("custom-algorithm-number") || config.algorithmNumber;
  config.lineNumber = blockElement.getAttribute("custom-line-number") || config.lineNumber;
  config.blockEnding = blockElement.getAttribute("custom-block-ending") || config.blockEnding;
  config.scopeLine = blockElement.getAttribute("custom-scope-line") || config.scopeLine;
  return config;
}

export function getBlockPseudocodeCode(blockElement: HTMLElement): string {
  return blockElement.querySelector(".hljs [contenteditable]")?.textContent || "";
}

export function setAutoAlgorithmNumber(blockElement: HTMLElement, pseudocodeConfig: IPseudocodeConfig) {
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