import { readFileSync, writeFileSync } from 'fs';

const content = readFileSync('prisma/schema.prisma', 'utf8');
const lines = content.split('\n');

// Parse all model blocks
const models = {};
const modelOrder = [];
let currentModel = null;
let currentFields = [];
let currentStartLine = -1;
let braceDepth = 0;
const modelPositions = {};

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const modelMatch = line.match(/^model (\w+) \{/);
  if (modelMatch) {
    currentModel = modelMatch[1];
    currentFields = [];
    currentStartLine = i;
    braceDepth = 1;
    continue;
  }
  if (currentModel) {
    if (line.includes('{')) braceDepth++;
    if (line.includes('}')) braceDepth--;
    if (braceDepth === 0) {
      models[currentModel] = currentFields;
      modelOrder.push(currentModel);
      modelPositions[currentModel] = { start: currentStartLine, end: i };
      currentModel = null;
      currentFields = [];
      continue;
    }
    currentFields.push(line);
  }
}

// Find all @relation fields
const missingBackRefs = {};
for (const [modelName, fields] of Object.entries(models)) {
  for (const line of fields) {
    const trimmed = line.trim();
    const match = trimmed.match(/^(\w+)\s+(\w+)(\?)?\s+@relation\(/);
    if (match) {
      const fieldName = match[1];
      const targetModel = match[2];
      if (targetModel === modelName) continue;
      if (!models[targetModel]) continue;
      if (!missingBackRefs[targetModel]) missingBackRefs[targetModel] = [];
      missingBackRefs[targetModel].push({ sourceModel: modelName, fieldName });
    }
  }
}

// Check if a target model already has a field of type `SourceModel[]`
function hasBackRefForType(targetFields, sourceModelName) {
  const re = new RegExp(`^\\w+\\s+${sourceModelName}(\\[\\]|\\?)?(\\s|$)`);
  for (const f of targetFields) {
    if (f.trim().match(re)) return true;
  }
  return false;
}

function pluralize(name) {
  if (name.endsWith('s') || name.endsWith('x') || name.endsWith('ch') || name.endsWith('sh')) return name + 'es';
  if (name.endsWith('y') && !'aeiou'.includes(name[name.length-2])) return name.slice(0, -1) + 'ies';
  if (name === 'status') return 'statuses';
  return name + 's';
}

// For each target, figure out what unique names to use
const insertions = [];
for (const [target, refs] of Object.entries(missingBackRefs)) {
  if (!models[target]) continue;
  
  // Map source model -> field name (unique per target model)
  const sourceToField = new Map();
  for (const r of refs) {
    if (sourceToField.has(r.sourceModel)) continue;
    
    // Skip if target already has a back-ref field for this source model
    if (hasBackRefForType(models[target], r.sourceModel)) continue;
    
    // Try using the field name first
    let fieldName = pluralize(r.fieldName);
    
    // If the field on the source model is just the target name lowercased,
    // use the source model name pluralized instead
    if (r.fieldName === target.toLowerCase() || r.fieldName === target[0].toLowerCase() + target.slice(1)) {
      fieldName = pluralize(r.sourceModel[0].toLowerCase() + r.sourceModel.slice(1));
    }
    
    // If conflicting, use source model name directly pluralized
    if (sourceToField.has(fieldName)) {
      fieldName = pluralize(r.sourceModel.toLowerCase());
    }
    // If still conflicting, append suffix
    if (sourceToField.has(fieldName)) {
      fieldName = pluralize(r.sourceModel.toLowerCase()) + '_ref';
    }
    
    sourceToField.set(r.sourceModel, fieldName);
  }
  
  if (sourceToField.size === 0) continue;
  
  const refLines = [];
  for (const [sourceModel, fieldName] of sourceToField) {
    refLines.push(`  ${fieldName} ${sourceModel}[]`);
  }
  
  insertions.push({
    target,
    afterLine: modelPositions[target].end - 1,
    lines: refLines
  });
}

// Apply in reverse order
insertions.sort((a, b) => b.afterLine - a.afterLine);

const result = [...lines];
for (const ins of insertions) {
  const insertText = '\n' + ins.lines.join('\n');
  result[ins.afterLine] = insertText + '\n' + result[ins.afterLine];
}

writeFileSync('prisma/schema.prisma', result.join('\n'), 'utf8');

console.log('Done!');
let total = 0;
for (const ins of insertions) {
  console.log(`  ${ins.target}: +${ins.lines.length} back-refs`);
  total += ins.lines.length;
}
console.log(`Total: ${total} back-reference lines added`);
