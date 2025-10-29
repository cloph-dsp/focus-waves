import fs from "fs";
import path from "path";
import ts from "typescript";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const audioSourcePath = path.join(rootDir, "src", "utils", "audioGenerator.ts");
const audioTargetDir = path.join(rootDir, "src", "utils", "audio");
const algorithmsDir = path.join(audioTargetDir, "algorithms");

if (!fs.existsSync(audioSourcePath)) {
  console.error(`Could not find audioGenerator.ts at ${audioSourcePath}`);
  process.exit(1);
}

fs.mkdirSync(algorithmsDir, { recursive: true });

const sourceText = fs.readFileSync(audioSourcePath, "utf8");
const sourceFile = ts.createSourceFile(
  "audioGenerator.ts",
  sourceText,
  ts.ScriptTarget.ESNext,
  true,
  ts.ScriptKind.TS
);

const generatorInfos = new Map();

for (const statement of sourceFile.statements) {
  if (!ts.isVariableStatement(statement)) continue;

  for (const declaration of statement.declarationList.declarations) {
    if (!ts.isIdentifier(declaration.name)) continue;
    const name = declaration.name.text;
    if (!name.startsWith("generate")) continue;

    const text = statement.getFullText(sourceFile).trimStart();
    generatorInfos.set(name, {
      name,
      statement,
      text,
      dependencies: new Set(),
    });
  }
}

const generatorNames = new Set(generatorInfos.keys());

const visitDependencies = (node, info) => {
  ts.forEachChild(node, child => {
    if (ts.isIdentifier(child) && generatorNames.has(child.text) && child.text !== info.name) {
      info.dependencies.add(child.text);
    }
    visitDependencies(child, info);
  });
};

for (const info of generatorInfos.values()) {
  const declaration = info.statement.declarationList.declarations.find(dec => ts.isIdentifier(dec.name) && dec.name.text === info.name);
  if (!declaration) continue;
  if (!declaration.initializer) continue;
  visitDependencies(declaration.initializer, info);
}

// Extract sortingFunctions mapping
const idToFunction = new Map();
for (const statement of sourceFile.statements) {
  if (!ts.isVariableStatement(statement)) continue;
  const declaration = statement.declarationList.declarations[0];
  if (!declaration || !ts.isIdentifier(declaration.name)) continue;
  if (declaration.name.text !== "sortingFunctions") continue;
  const initializer = declaration.initializer;
  if (!initializer || !ts.isObjectLiteralExpression(initializer)) continue;
  for (const prop of initializer.properties) {
    if (!ts.isPropertyAssignment(prop)) continue;
    const key = prop.name;
    let id;
    if (ts.isStringLiteralLike(key)) {
      id = key.text;
    } else if (ts.isIdentifier(key)) {
      id = key.text;
    } else {
      continue;
    }
    if (!ts.isIdentifier(prop.initializer)) continue;
    const fnName = prop.initializer.text;
    idToFunction.set(id, fnName);
  }
}

if (idToFunction.size === 0) {
  console.error("Could not extract sortingFunctions mapping.");
  process.exit(1);
}

const distinctFunctionNames = Array.from(new Set(idToFunction.values()));

const toModuleBase = name => {
  const withoutPrefix = name.replace(/^generate/, "");
  const kebab = withoutPrefix
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/([A-Z])([A-Z][a-z])/g, "$1-$2")
    .replace(/\s+/g, "-")
    .toLowerCase();
  return kebab.replace(/-sort$/, "");
};

const functionToModuleBase = new Map();
for (const fnName of distinctFunctionNames) {
  functionToModuleBase.set(fnName, toModuleBase(fnName));
}

const engineImports = [
  "activeLoop",
  "createNonBlockingVisualCallback",
  "delay",
  "generateUniqueRandomArray",
  "getAdaptiveDelay",
  "getAdaptiveNoteDuration",
  "getAudioContext",
  "playSortedArray",
  "playTone",
  "resetLoop",
  "valueToFrequency",
];

const baseHeaderLines = [];
baseHeaderLines.push(`import { ${engineImports.join(", ")} } from "../engine";`);
baseHeaderLines.push('import type { VisualCallback } from "../types";');

for (const fnName of distinctFunctionNames) {
  const info = generatorInfos.get(fnName);
  if (!info) {
    console.warn(`No generator definition found for ${fnName}.`);
    continue;
  }
  const moduleBase = functionToModuleBase.get(fnName);
  const filePath = path.join(algorithmsDir, `${moduleBase}.ts`);

  const dependencyImports = [];
  for (const dep of info.dependencies) {
    if (!functionToModuleBase.has(dep)) continue;
    const depBase = functionToModuleBase.get(dep);
    dependencyImports.push(`import { ${dep} } from "./${depBase}";`);
  }

  const content = [
    ...baseHeaderLines,
    ...dependencyImports,
    "",
    info.text.trimEnd(),
    "",
  ].join("\n");

  fs.writeFileSync(filePath, content, "utf8");
}

// Generate registry.ts
const registryPath = path.join(audioTargetDir, "registry.ts");
const loaderEntries = [];
for (const [id, fnName] of idToFunction) {
  const moduleBase = functionToModuleBase.get(fnName);
  if (!moduleBase) {
    console.warn(`Missing module base for function ${fnName}`);
    continue;
  }
  loaderEntries.push(
    `  "${id}": async () => (await import("./algorithms/${moduleBase}")).${fnName}`
  );
}

const registryContent = `import type { SortingGenerator } from "./types";

const cache = new Map<string, SortingGenerator>();

const loaders: Record<string, () => Promise<SortingGenerator>> = {
${loaderEntries.join(",\n")}
};

export const loadSortingGenerator = async (id: string): Promise<SortingGenerator> => {
  const cached = cache.get(id);
  if (cached) return cached;
  const loader = loaders[id];
  if (!loader) {
    throw new Error('Unknown sorting algorithm: ' + id);
  }
  const generator = await loader();
  cache.set(id, generator);
  return generator;
};

export const getAvailableSortingIds = () => Object.keys(loaders);
`;

fs.writeFileSync(registryPath, registryContent, "utf8");

console.log(`Generated ${distinctFunctionNames.length} algorithm modules and registry.`);
