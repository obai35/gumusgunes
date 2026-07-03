import { exec } from 'child_process'
import { readFile, readdir, writeFile } from 'fs/promises'
import path from 'path'

const PROJECT_ROOT = process.cwd()
const MAX_OUTPUT = 10 * 1024 * 1024

function safePath(p: string): string {
  const resolved = path.resolve(PROJECT_ROOT, p)
  if (!resolved.startsWith(PROJECT_ROOT)) throw new Error('Path outside project directory')
  return resolved
}

export async function executeTool(name: string, args: Record<string, any>): Promise<any> {
  switch (name) {
    case 'readFile': {
      const content = await readFile(safePath(args.path), 'utf-8')
      return { content }
    }
    case 'searchCode': {
      const { execSync } = require('child_process')
      try {
        const result = execSync(`rg -n "${args.query}"${args.path ? ` ${args.path}` : ' --type ts --type tsx --type css'}`, {
          cwd: PROJECT_ROOT,
          maxBuffer: MAX_OUTPUT,
          encoding: 'utf-8',
          timeout: 10000,
        })
        return { results: result.split('\n').filter(Boolean).slice(0, 100) }
      } catch {
        return { results: [] }
      }
    }
    case 'readDir': {
      const entries = await readdir(safePath(args.path), { withFileTypes: true })
      return { entries: entries.map(e => ({ name: e.name, isDirectory: e.isDirectory() })) }
    }
    case 'readLog': {
      const { execSync } = require('child_process')
      const lines = args.lines || 50
      try {
        const result = execSync(`tail -n ${lines} server.log`, { cwd: PROJECT_ROOT, encoding: 'utf-8', timeout: 5000 })
        return { content: result }
      } catch {
        return { content: 'Could not read server.log' }
      }
    }
    case 'listApiRoutes': {
      const { readdirSync } = require('fs')
      const pathMod = require('path')
      function findRouteFiles(dir: string): string[] {
        const results: string[] = []
        let entries: string[]
        try { entries = readdirSync(dir) } catch { return results }
        for (const entry of entries) {
          const full = pathMod.join(dir, entry)
          try {
            const stat = require('fs').statSync(full)
            if (stat.isDirectory()) results.push(...findRouteFiles(full))
            else if (entry === 'route.ts' && full.includes(`${pathMod.sep}api${pathMod.sep}`)) {
              results.push(full)
            }
          } catch {}
        }
        return results
      }
      const routes = findRouteFiles(pathMod.join(PROJECT_ROOT, 'src', 'app', 'api'))
      return { routes: routes.map(r => {
        const relative = pathMod.relative(pathMod.join(PROJECT_ROOT, 'src', 'app', 'api'), r)
        return '/api/' + relative.replace(/\\/g, '/').replace(/\/route\.ts$/, '')
      }) }
    }
    case 'getSystemInfo': {
      return {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        node: process.version,
        platform: process.platform,
        cwd: PROJECT_ROOT,
      }
    }
    case 'gitStatus': {
      const { execSync } = require('child_process')
      return { output: execSync('git status', { cwd: PROJECT_ROOT, encoding: 'utf-8', timeout: 10000 }) }
    }
    case 'gitDiff': {
      const { execSync } = require('child_process')
      return { output: execSync('git diff', { cwd: PROJECT_ROOT, encoding: 'utf-8', timeout: 10000 }) }
    }
    case 'writeFile': {
      // TODO: add audit logging (see Task 16)
      await writeFile(safePath(args.path), args.content, 'utf-8')
      return { status: 'written', path: args.path }
    }
    case 'editFile': {
      // TODO: add audit logging (see Task 16)
      const current = await readFile(safePath(args.path), 'utf-8')
      if (!current.includes(args.oldString)) throw new Error('oldString not found in file')
      const updated = current.replace(args.oldString, args.newString)
      await writeFile(safePath(args.path), updated, 'utf-8')
      return { status: 'edited', path: args.path }
    }
    case 'runCommand': {
      // TODO: add audit logging (see Task 16)
      return new Promise((resolve) => {
        exec(args.command, { cwd: PROJECT_ROOT, timeout: 15000, maxBuffer: MAX_OUTPUT }, (err, stdout, stderr) => {
          resolve({ stdout: stdout?.slice(0, 100_000) || '', stderr: stderr?.slice(0, 100_000) || '', exitCode: err?.code || 0 })
        })
      })
    }
    case 'gitCommit': {
      // TODO: add audit logging (see Task 16)
      const { execSync } = require('child_process')
      execSync('git add -A', { cwd: PROJECT_ROOT, encoding: 'utf-8', timeout: 10000 })
      const result = execSync(`git commit -m "${args.message.replace(/"/g, '\\"')}"`, { cwd: PROJECT_ROOT, encoding: 'utf-8', timeout: 10000 })
      return { output: result }
    }
    case 'gitPush': {
      // TODO: add audit logging (see Task 16)
      const { execSync } = require('child_process')
      const result = execSync('git push', { cwd: PROJECT_ROOT, encoding: 'utf-8', timeout: 30000 })
      return { output: result }
    }
    case 'restartServer': {
      // TODO: add audit logging (see Task 16)
      setTimeout(() => process.exit(0), 1000)
      return { status: 'restarting' }
    }
    case 'runTests': {
      return new Promise((resolve) => {
        exec(`npm test ${args.pattern || ''}`, { cwd: PROJECT_ROOT, timeout: 60000, maxBuffer: MAX_OUTPUT }, (err, stdout, stderr) => {
          resolve({ stdout: stdout?.slice(0, 100_000) || '', stderr: stderr?.slice(0, 100_000) || '', exitCode: err?.code || 0 })
        })
      })
    }
    case 'runLint': {
      return new Promise((resolve) => {
        exec('npm run lint', { cwd: PROJECT_ROOT, timeout: 60000, maxBuffer: MAX_OUTPUT }, (err, stdout, stderr) => {
          resolve({ stdout: stdout?.slice(0, 100_000) || '', stderr: stderr?.slice(0, 100_000) || '', exitCode: err?.code || 0 })
        })
      })
    }
    default:
      throw new Error(`Unknown tool: ${name}`)
  }
}

const PENDING_APPROVALS = new Map<string, { timestamp: number }>()
const APPROVAL_TIMEOUT = 5 * 60 * 1000 // 5 minutes

export function grantApproval(tool: string): void {
  PENDING_APPROVALS.set(tool, { timestamp: Date.now() })
}

const SAFE_TOOLS = new Set(['readFile', 'searchCode', 'readDir', 'readLog', 'listApiRoutes', 'getSystemInfo', 'gitStatus', 'gitDiff'])

export function isToolSafe(name: string): boolean {
  return SAFE_TOOLS.has(name)
}
