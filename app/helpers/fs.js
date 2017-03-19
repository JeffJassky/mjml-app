import fs from 'fs'
import path from 'path'
import promisify from 'es6-promisify'
import { remote } from 'electron'

import { mjml2html } from 'helpers/mjml'

const { dialog } = remote

export const fsReadDir = promisify(fs.readdir)
export const fsReadFile = promisify(fs.readFile)
export const fsWriteFile = promisify(fs.writeFile)
const stat = promisify(fs.stat)

function getFileInfoFactory (p) {
  return async name => {
    try {
      const stats = await stat(path.resolve(p, name))
      return {
        name,
        isFolder: stats.isDirectory(),
      }
    } catch (err) {
      return {
        name,
        isFolder: false,
      }
    }
  }
}

export function sortFiles (files) {
  files.sort((a, b) => {
    if (a.isFolder && !b.isFolder) { return -1 }
    if (!a.isFolder && b.isFolder) { return 1 }
    const aName = a.name.toLowerCase()
    const bName = b.name.toLowerCase()
    if (aName < bName) { return -1 }
    if (aName > bName) { return 1 }
    return 0
  })
}

export async function readDir (p) {
  const filesList = await fsReadDir(p)
  const filtered = filesList.filter(f => !f.startsWith('.'))
  const getFileInfo = getFileInfoFactory(p)
  const enriched = await Promise.all(filtered.map(getFileInfo))
  return enriched
}

export function fileDialog (options) {
  const res = dialog.showOpenDialog(options)
  if (!res || !res.length) { return null }
  const p = res[0]
  return p || null
}

export function readMJMLFile (path) {
  return fsReadFile(path, { encoding: 'utf8' })
    .then(mjml2html)
}
