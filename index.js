const esprima = require('esprima')
const readline = require('readline')
const escodegen = require('escodegen')

function iterate(obj, key, callback) {
  var current = obj
  if (typeof key !== 'undefined') {
    current = current[key]
  }
  if (current === null) return

  if (Array.isArray(current)) {
    return current.forEach((_, i) => {
      iterate(current, i, callback)
    })
  }
  if (typeof obj === 'object') {
    callback(obj, key)
    return Object.keys(current).forEach((key) => {
      iterate(current, key, callback)
    })
  }
}

function isArrayExpressionDeclarator(node) {
  return node &&
    node.type === 'VariableDeclarator' &&
    node.init && node.init.type === 'ArrayExpression'
}

function handleMappings(raw) {
  const parsed = esprima.parse(raw)
  const arrays = {}

  // find all ArrayExpressionDeclarators
  iterate(parsed, undefined, function(parent, key) {
    var node = parent[key]
    if (isArrayExpressionDeclarator(node)) {
      arrays[node.id.name] = node.init.elements.map(({value}) => value)
    }
  })

  if (Object.keys(arrays).length === 0) {
    return console.error('no string arrays found')
  }

  // do the literal replacement
  iterate(parsed, undefined, function(parent, key) {
    var node = parent[key]
    if (node &&
        node.type === 'MemberExpression' &&
        node.object && node.object.type === 'Identifier' &&
        node.property && node.property.type === 'Literal') {
      const {name} = node.object
      if (arrays.hasOwnProperty(name)) {
        parent[key] = esprima.parse(JSON.stringify(arrays[name][node.property.value])).body[0].expression
      }
    }
  })

  // remove all ArrayExpressionDeclarators
  iterate(parsed, undefined, function(parent, key) {
    var node = parent[key]
    if (node && node.type === 'VariableDeclaration' &&
      node.declarations && node.declarations.length === 1 && isArrayExpressionDeclarator(node.declarations[0])) {
      if (Array.isArray(parent)) {
        parent.splice(key, 1)
      }
    }
  })

  // replace object["key"] with object.key
  iterate(parsed, undefined, function(parent, key) {
    var node = parent[key]
    if (node &&
      node.computed === true && node.type === 'MemberExpression' &&
        node.object &&
        node.property && node.property.type === 'Literal' && typeof node.property.value === 'string') {

      if (node.object.type === 'Identifier') {
        parent[key] = esprima.parse(`${node.object.name}.${node.property.value}`).body[0].expression
      } else if (node.object.type === 'MemberExpression' &&
          node.object.object.type === 'Identifier' &&
          node.object.property.type === 'Literal') {
        parent[key] = esprima.parse(`${node.object.object.name}.${node.object.property.value}.${node.property.value}`).body[0].expression
      }
    }
  })

  return escodegen.generate(parsed)
}

let raw = ''
readline.createInterface({
  input: process.stdin,
  terminal: false
})
  .on('line', (line) => { raw += line + '\n' })
  .on('close', () => {
    console.info(handleMappings(raw))
  })
