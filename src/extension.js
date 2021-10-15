// vscode api
import vscode from 'vscode'
// node
import fs from 'fs'
import os from 'os'
import childProcess from 'child_process'
import path from 'path'
import archiver from 'archiver'

import Lang from './util/language'

/**
 * 拓展激活
 * @param {vscode.ExtensionContext} ctx
 */
const activate = ctx => {
  const localize = new Lang(ctx)

  const extension = vscode.commands.registerCommand('vszip.compress', async uri => {
    const start = Date.now()
    let targetPath = ''
    if (uri && uri.fsPath) {
      targetPath = uri.fsPath
    } else {
      const workspaceFolders = vscode.workspace.workspaceFolders || []
      if (workspaceFolders && workspaceFolders.length > 1) {
        const checkWorkspace = await vscode.window.showQuickPick(workspaceFolders.map(v => v.name), {
          title: localize.t('ext.message.warn_more')
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
        vscode.window.showErrorMessage(localize.t('ext.message.unknow'))
        return
      }
    }

    // 压缩进程
    const pathParse = path.parse(targetPath)
    const isDirectory = fs.statSync(targetPath).isDirectory()

    const name = await vscode.window.showInputBox({
      value: pathParse.name,
      prompt: localize.t('ext.message.input_name')
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
        const ask = await vscode.window.showWarningMessage(localize.t('ext.message.exist'), {
          modal: true,
          detail: localize.t('ext.message.todo')
        }, localize.t('ext.message.replace'))
        if (ask !== localize.t('ext.message.replace')) {
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
          vscode.window.showInformationMessage(`${localize.t('ext.message.success')}，time ${Date.now() - start}ms，size ${archive.pointer()} total bytes`);
          const platform = os.platform();
          const command = (platform === 'win32' && 'explorer') ||
            (platform === 'linux' && 'xdg-open') ||
            (platform === 'darwin' && 'open'); // 是否支持打开
          if (command) {
            const ask = await vscode.window.showWarningMessage(localize.t('ext.message.open'), {}, localize.t('ext.message.confirm'), localize.t('ext.message.cancel'))
            if (ask === localize.t('ext.message.confirm')) {
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
