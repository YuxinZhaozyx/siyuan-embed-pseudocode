<p align="center">
<img alt="Pseudocode" src="./icon.png" width="160px">
<br>

<p align="center">
    <strong>SiYuan Plugin「Embed Series」</strong>
    <br>
    Elegantly Writing and Displaying Pseudocode in SiYuan using LaTeX algorithm syntax.
    <br>
    No external dependencies · Full editability · Free to share
</p>

<p align="center">
    <a href="https://github.com/YuxinZhaozyx/siyuan-embed-pseudocode/blob/main/README_zh_CN.md">中文</a> | <a href="https://github.com/YuxinZhaozyx/siyuan-embed-pseudocode/blob/main/README.md">English</a>
</p>

---

## Embed Series

This plugin is an upgraded version of the Pseudocode Widget (`siyuan-pseudocode`), and serves as the second plugin in the **Embed Series**, aiming to provide a more complete and flexible Pseudocode experience within SiYuan.

**The principle of Embed Series plugins**: They are designed solely as auxiliary editing tools for SiYuan, embedding all information directly into formats supported by SiYuan and Markdown. This ensures that all content created by the plugin remains fully visible and functional even after being separated from the plugin — or even from SiYuan itself — such as when exporting to Markdown or sharing on third-party platforms.

For users of the original Pseudocode Widget, this plugin provides a one-click migration feature to help you quickly transition. For detailed steps, please refer to the Usage Guide section below.

## Effects

<details>
<summary> Pseudocode Source Code </summary>

```
\begin{algorithm}
\caption{Quicksort}
\begin{algorithmic}
\PROCEDURE{Quicksort}{$A, p, r$}
    \IF{$p < r$} 
        \STATE $q = $ \CALL{Partition}{$A, p, r$}
        \STATE \CALL{Quicksort}{$A, p, q - 1$}
        \STATE \CALL{Quicksort}{$A, q + 1, r$}
    \ENDIF
\ENDPROCEDURE
\PROCEDURE{Partition}{$A, p, r$}
    \STATE $x = A[r]$
    \STATE $i = p - 1$
    \FOR{$j = p$ \TO $r - 1$}
        \IF{$A[j] < x$}
            \STATE $i = i + 1$
            \STATE exchange
            $A[i]$ with $A[j]$
        \ENDIF
        \STATE exchange $A[i]$ with $A[r]$
    \ENDFOR
\ENDPROCEDURE
\end{algorithmic}
\end{algorithm}
```

</details>

![image.png](https://b3logfile.com/file/2025/11/image-L8Mdwbk.png)

## Features

- [x] Offline usage (no internet required)
- [x] CodeMirror editor (syntax highlighting, auto-completion, error hints)
- [x] Configure rendering style
- [x] Store pseudocode in markdown native code blocks
+ [x] PDF export support

> If you have additional feature requests or suggestions, feel free to [open an issue on GitHub](https://github.com/YuxinZhaozyx/siyuan-embed-pseudocode/issues) or [post in the SiYuan community](https://ld246.com/article/1762459066676).

## Usage Guide

**Create Pseudocode:**  
Type `/pseudoode` in the editor to create a pseudocode block.

**Edit Pseudocode:**  
Click the menu button in the left side / top-right corner of the code block. If the block is recognized as a valid pseudocode block, an `Edit Pseudocode` option will appear. Click it to open the editor.

**Switch Pseudocode View:**
Click the menu button in the left side / top-right corner of the code block. If the block is recognized as a valid pseudocode block, an `Enable Pseudocode View` / `Disable Pseudocode View` option will appear. Click it to switch between pseudocode view and normal code block.

**Migrate from Pseudocode Widget:**  
Click the menu button on the left side of a Pseudocode Widget block. An option labeled `Convert to Embed Pseudocode` will appear. Click it to convert the old widget block into a new Embed Series pseudocode block.

## Changelog

+ v0.5.2
    + Fix: need manual refresh when load and unload plugin
    + Fix: pseudocode block view is editable
+ v0.5.1
    + Fix: compile always fails
    + Feature: PDF export support
+ v0.5.0
    + Inherits all core features from the original Pseudocode Widget (`siyuan-pseudocode`)
    + Added ability to edit and show pseudocode via the top-right menu button
    + One-click migration from the original Pseudocode Widget
    + Dark mode support