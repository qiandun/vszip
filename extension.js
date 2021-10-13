// vscode api
const vscode = require('vscode');
// node
const fs = require('fs')
const os = require('os')
const childProcess = require('child_process')
const path = require('path')
const archiver = require('archiver')

/**
 * 拓展激活
 * @param {vscode.ExtensionContext} ctx
 */
const activate = ctx => {
  const extension = vscode.commands.registerCommand('vszip.compress', async uri => {
    const start = Date.now()
    let targetPath = ''
    if (uri && uri.fsPath) {
      targetPath = uri.fsPath
    } else {
      const workspaceFolders = vscode.workspace.workspaceFolders || []
      if (workspaceFolders && workspaceFolders.length > 1) {
        const checkWorkspace = await vscode.window.showQuickPick(workspaceFolders.map(v => v.name), {
          title: '当前存在多个目标，请选择需要压缩的项目'
        })
        if (checkWorkspace) {
          for (const folder of workspaceFolders) {
            if (folder.name === checkWorkspace) {
              targetPath = folder.uri.fsPath
              break
            }
          }
        }
      } else if (workspaceFolders && workspaceFolders.length) {
        targetPath = workspaceFolders[0].uri.fsPath
      } else {
        vscode.window.showErrorMessage('没用发现可以压缩的目标')
        return
      }
    }

    // 压缩进程
    const pathParse = path.parse(targetPath)
    const isDirectory = fs.statSync(targetPath).isDirectory()

    const name = await vscode.window.showInputBox({
      value: pathParse.name,
      prompt: '请输入压缩包名称(默认自动添加后缀：.zip)'
    })

    if (name) {
      const savePath = path.join(targetPath, `../${name}.zip`)
      let isExist = true
      try {
        fs.accessSync(savePath)
      } catch (error) {
        isExist = false
      }

      let isGenerate = true

      if (isExist) {
        const ask = await vscode.window.showWarningMessage('文件已存在', {
          modal: true,
          detail: '请选择操作'
        }, '覆盖')
        if (ask !== '覆盖') {
          isGenerate = false
        }
      }

      if (isExist && isGenerate) {
        fs.unlinkSync(savePath)
      }

      if (isGenerate) {
        const output = fs.createWriteStream(savePath)
        // 压缩实例
        const archive = archiver("zip", {
          forceLocalTime: true,
          zlib: {
            level: 9
          }, // 压缩等级
        })

        output.on('close', async _ => {
          vscode.window.showInformationMessage(`压缩完成，time ${Date.now() - start}ms，size ${archive.pointer()} total bytes`);
          const platform = os.platform();
          const command = (platform === 'win32' && 'explorer') ||
            (platform === 'linux' && 'xdg-open') ||
            (platform === 'darwin' && 'open'); // 是否支持打开
          if (command) {
            const ask = await vscode.window.showWarningMessage('是否打开所在目录？', {}, '确定', '取消')
            if (ask === '确定') {
              childProcess.execSync(`${command} "${path.join(targetPath, '../')}"`);
            }
          }
        })

        archive.on('error', err => {
          vscode.window.showErrorMessage(JSON.stringify(err))
        })

        archive.pipe(output)

        if (isDirectory) {
          archive.directory(targetPath, false)
        } else {
          archive.file(targetPath, {
            name: pathParse.base
          })
        }

        archive.finalize()
      }
    }
  });

  ctx.subscriptions.push(extension);
}

// 拓展卸载
const deactivate = () => {}

module.exports = {
  activate,
  deactivate
}
