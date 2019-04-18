const fs = require('fs')
const readline = require('readline')
const escodegen = require('escodegen')
const esprima = require('esprima')

async function readFile(path)
{
  return new Promise(resolve => {
    let content = ''
    const lineReader = readline.createInterface({
      input: fs.createReadStream(path)
    })

    lineReader.on('line', function (line) {
      content += `${line}\n`
    })

    lineReader.on('close', function () {
      resolve(content)
    })
  })
}

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

function handleMappings(src) {
  const parsed = esprima.parse(src)
  const arrays = {}

  // find all ArrayExpressionDeclarators
  // TODO handle duplicates
  // TODO stop using iterate?
  iterate(parsed, undefined, function (parent, key) {
    var node = parent[key]
    if (isArrayExpressionDeclarator(node)) {
      arrays[node.id.name] = node.init.elements.map(({value}) => value)
    }
  })

  if (Object.keys(arrays).length === 0) {
    return src
  }

  let replacements = []
  esprima.parse(src, {
    range: true
  }, function (node, {start, end}) {
    const {type, property} = node

    if (type === 'BinaryExpression' || type === 'LogicalExpression') {
      checkNode(node.left)
      checkNode(node.right)
    } else if (type === 'CallExpression' || type === 'NewExpression') {
      node.arguments.forEach(checkNode)
    } else if (type === 'MemberExpression') {
      checkNode(property)
    } else if (type === 'Property') {
      checkNode(node.value)
    }

    function checkNode(node) {
      const {type, object, property, range} = node
      if (type === 'MemberExpression' &&
          object && object.type === 'Identifier' &&
          property && property.type === 'Literal' &&
          arrays.hasOwnProperty(object.name) &&
          arrays[object.name].hasOwnProperty(property.value)) {
        replacements.push({
          start: range[0],
          end: range[1],
          value: JSON.stringify(arrays[object.name][property.value]),
        })
      }
    }
  })

  //console.info('hits', replacements.length)
  return handleReplacements(src, replacements)
}

function dotNotation(src) {
  let replacements = []

  esprima.parse(src, {
    range: true
  }, function (node, {start, end}) {
    if (node &&
        node.computed === true &&
        node.type === 'MemberExpression' &&
        node.object &&
        node.property && node.property.type === 'Literal' && typeof node.property.value === 'string') {
      if (node.object.type === 'Identifier') {
        replacements.push({
          start: start.offset,
          end: end.offset,
          value: `${node.object.name}.${node.property.value}`,
        })
      } else if (node.object.type === 'Literal') {
        replacements.push({
          start: start.offset,
          end: end.offset,
          value: `${node.object.value}.${node.property.value}`,
        })
      }
      else if (node.object.type === 'MemberExpression' &&
          node.object.object.type === 'Identifier' &&
          node.object.property.type === 'Literal') {
        replacements.push({
          start: start.offset,
          end: end.offset,
          value: `${node.object.object.name}.${node.object.property.value}.${node.property.value}`,
        })
      }
      else if ((node.object.type === 'CallExpression' || node.object.type === 'MemberExpression' || node.object.type === 'NewExpression') &&
          node.property.type === 'Literal') {
        replacements.push({
          start: node.property.range[0] - 1,
          end: node.property.range[1] + 1,
          value: `.${node.property.value}`,
        })
      }
    }
  })

  return handleReplacements(src, replacements, true)
}

function removeHexStrings(src) {
  if (src.indexOf('\\x') === -1) {
    return src
  }

  let replacements = []
  esprima.parse(src, undefined, function({type, value, raw}, {start, end}) {
    if (type === 'Literal' &&
        raw !== value &&
        raw.indexOf('\\x') > -1) {
      const quote = raw.charAt(0)
      replacements.push({
        start: start.offset,
        end: end.offset,
        value: `${quote}${value.replace(/'/g, "\\'")}${quote}`,
      })
    }
  })

  return handleReplacements(src, replacements)
}

function prettyPrint(src) {
  const parsed = esprima.parse(src)
  return escodegen.generate(parsed)
}

function handleReplacements(src, replacements, debug) {
  if (replacements.length) {
    // sort descending on `end`
    replacements
        .sort((a, b) => {
          return b.end - a.end
        })
        .forEach(({start, end, value}, i) => {
          if (i > 0 && start === replacements[i - 1].start) {
            // skip overlapping replacements
            if (debug === true) {
              //console.info('skip overlapping replacements', start, end)
            }
            return
          }

          if (value.indexOf(String.fromCharCode(10)) > -1) {
            if (debug === true) {
              //console.info('skip newline', start, end)
            }
            return
          }

          src = `${src.slice(0, start)}${value}${src.slice(end)}`;
          if (debug === true) {
            //console.info('replace', src.substring(start, end), 'with', value)
          }
        })
  }

  return src
}

// do the work
(async function(){
  const src = await readFile(process.argv[2])
  let _next = src
  //console.info('cav', 'read', src)
  _next = removeHexStrings(src)
  //console.info('cav', 'hex', _next)
  _next = handleMappings(_next)
  //console.info('cav', 'handleMappings', _next)
  _next = dotNotation(_next)
  //console.info('cav', 'dotNotation', _next)
  _next = prettyPrint(_next)
  //console.info('cav', 'prettyPrint', _next)
  console.info(_next)
})()
