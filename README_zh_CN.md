<p align="center">
<img alt="Pseudocode" src="./icon.png" width="160px">
<br>

<p align="center">
    <strong>思源插件「嵌入式系列」</strong>
    <br>
    使用 LaTeX algorithm语法，在思源笔记中优雅地书写和展示伪代码。
    <br>
    无需外部依赖 · 自由编辑 · 自由分享
</p>

<p align="center">
    <a href="https://github.com/YuxinZhaozyx/siyuan-embed-pseudocode/blob/main/README_zh_CN.md">中文</a> | <a href="https://github.com/YuxinZhaozyx/siyuan-embed-pseudocode/blob/main/README.md">English</a>
</p>

---

## 嵌入式系列

本插件为Pseudocode挂件(siyuan-pseudocode)的升级版，作为第二个「嵌入式系列」插件，旨在为思源笔记提供更加完善且自由的伪代码编写体验。

**嵌入式系列插件的宗旨**：仅作为思源笔记的辅助编辑插件，将所有信息嵌入思源笔记和markdown所支持的数据格式中，使得插件所创造的所有内容在脱离插件甚至脱离思源笔记（导出为markdown/分享到第三方平台）后仍然可以正常显示。

对于原伪代码挂件用户，本插件也提供了一键转换功能，以帮助原伪代码挂件用户快速迁移到本插件，详细步骤请阅读本文使用指南小节。


## 使用效果


<details>
<summary> 伪代码源码 </summary>

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

## 功能

- [x] 无网络离线使用
- [x] CodeMirror编辑器（语法高亮、代码自动补全、错误提示）
- [x] 设置伪代码块的显示风格
- [x] 以markdown原生代码块存储伪代码
+ [x] PDF导出支持

> 如有更多需求/建议欢迎[在GitHub仓库中提issue](https://github.com/YuxinZhaozyx/siyuan-embed-pseudocode/issues)或[在思源笔记社区中发帖](https://ld246.com/article/1762459066676)

## 使用指南

**创建伪代码：** 在编辑器中输入 `/pseudocode` 命令即可创建新的伪代码。

**编辑伪代码：** 点击代码块左侧/右上角的菜单按钮，如果代码块被识别为伪代码块（语言为`pseudocode`的代码块），则会出现 `编辑伪代码` 的选项，点击即可编辑。

**切换伪代码视图：** 点击代码块左侧/右上角的菜单按钮，如果代码块被识别为伪代码块（语言为`pseudocode`的代码块），则会出现 `开启伪代码视图` / `关闭伪代码视图` 的选项，点击切换。

**从伪代码挂件迁移：** 点击伪代码挂件块左侧的菜单按钮，会显示 `转换为嵌入式伪代码` 的选项，点击即可将伪代码挂件块转换为伪代码块。


## 更新日志

+ v0.5.5
    + 修复缺陷：复制时会复制到html
    + 功能优化：输入 `/伪代码` 也可创建伪代码块
+ v0.5.4
    + 更新插件名
+ v0.5.3
    + 修复缺陷：启动插件时已有伪代码块渲染失败
    + 功能优化：优化编辑器提示信息
+ v0.5.2
    + 修复缺陷：启动和关闭插件时需刷新文档才生效
    + 修复缺陷：渲染出的代码块可被编辑导致再次编译时出错
+ v0.5.1
    + 修复缺陷：伪代码总是编译错误的问题
    + 功能特征：增加PDF导出支持
+ v0.5.0
    + 继承伪代码挂件(siyuan-pseudocode)的所有功能，点击代码块右上角按钮可切换为伪代码视图与编辑伪代码
    + 提供原伪代码挂件转换为新版本插件代码块的功能
    + 暗黑模式支持

