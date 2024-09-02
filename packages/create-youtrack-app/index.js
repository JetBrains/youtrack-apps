#!/usr/bin/env node

const { runner } = require('hygen')
const Logger = require('hygen/dist/logger')
const path = require('node:path')
const defaultTemplates = path.join(__dirname, '_templates')
const args = require('minimist')(process.argv.slice(2));
const cwd = path.resolve(process.cwd(), args.cwd || '.');

console.log('Working directory:', cwd);

runner(process.argv.slice(2), {
  templates: defaultTemplates,
  cwd,
  logger: new Logger.default(console.log.bind(console)),
  createPrompter: () => require('enquirer'),
  exec: (action, body) => {
    const opts = body && body.length > 0 ? { input: body } : {}
    return require('execa').shell(action, opts)
  },
  debug: true
})
