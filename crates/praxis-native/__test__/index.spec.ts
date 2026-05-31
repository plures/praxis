import test from 'ava'
import { parse, compile, lint, execute } from '../index.js'

test('parse returns JSON', (t) => {
  const result = parse('constraint test: require: true')
  t.truthy(result)
})

test('compile returns JSON', (t) => {
  const result = compile('constraint test: require: true')
  t.truthy(result)
})
