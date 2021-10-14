import vscode from "vscode"
import fs from 'fs'
import path from "path"

export default class Lang {
  ctx = null
  languageJson = null

  constructor(ctx) {
    this.ctx = ctx
    this.init()
  }

  t(key) {
    return this.languageJson[key]
  }

  init() {
    const extensionPath = this.ctx.extensionPath
    const currLang = vscode.env.language
    let currLangPath = path.join(extensionPath, `package.nls.${currLang}.json`)
    try {
      fs.accessSync(currLangPath)
    } catch (error) {
      currLangPath = path.join(extensionPath, `package.nls.json`)
    }
    const file = fs.readFileSync(currLangPath, {
      encoding: "utf-8"
    })
    this.languageJson = JSON.parse(file)
  }
}
