import * as ts from 'typescript';
import * as fs from 'fs';

export interface RuleAnalysis {
  ruleId: string;
  guards: string[];
  mutations: string[];
  events: string[];
}

export function analyzeRuleFile(filePath: string): RuleAnalysis[] {
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const sourceFile = ts.createSourceFile(
    filePath,
    fileContent,
    ts.ScriptTarget.Latest,
    true
  );

  const results: RuleAnalysis[] = [];

  function visit(node: ts.Node) {
    // Look for variable declarations: export const myRule = defineRule(...)
    if (ts.isVariableDeclaration(node)) {
      const initializer = node.initializer;
      if (initializer && ts.isCallExpression(initializer)) {
        const expression = initializer.expression;
        // Check if it's defineRule call
        if (ts.isIdentifier(expression) && expression.text === 'defineRule') {
          if (initializer.arguments.length > 0) {
            const arg = initializer.arguments[0];
            if (ts.isObjectLiteralExpression(arg)) {
              analyzeRuleObject(arg);
            }
          }
        }
      }
    }
    ts.forEachChild(node, visit);
  }

  function analyzeRuleObject(obj: ts.ObjectLiteralExpression) {
    let ruleId = '';
    let implMethod: ts.ArrowFunction | ts.FunctionExpression | undefined;

    // Extract ID and impl
    obj.properties.forEach(prop => {
      if (ts.isPropertyAssignment(prop) && ts.isIdentifier(prop.name)) {
        if (prop.name.text === 'id') {
          if (ts.isStringLiteral(prop.initializer)) {
            ruleId = prop.initializer.text;
          }
        } else if (prop.name.text === 'impl') {
          if (ts.isArrowFunction(prop.initializer) || ts.isFunctionExpression(prop.initializer)) {
            implMethod = prop.initializer;
          }
        }
      }
    });

    if (ruleId && implMethod) {
      const analysis = analyzeImpl(implMethod, fileContent);
      results.push({
        ruleId,
        ...analysis
      });
    }
  }

  function analyzeImpl(func: ts.ArrowFunction | ts.FunctionExpression, _fullText: string) {
    const guards: string[] = [];
    const mutations: string[] = [];
    const events: string[] = [];

    const body = func.body;
    if (ts.isBlock(body)) {
      body.statements.forEach(stmt => {
        // 1. Detect Guards: if (...) return [];
        if (ts.isIfStatement(stmt)) {
          const thenStmt = stmt.thenStatement;
          let isGuard = false;
          
          // Check if 'then' block returns empty array
          if (ts.isReturnStatement(thenStmt)) {
             isGuard = isReturnEmptyArray(thenStmt);
          } else if (ts.isBlock(thenStmt)) {
             // Check if block contains just return []
             if (thenStmt.statements.length === 1 && ts.isReturnStatement(thenStmt.statements[0])) {
               isGuard = isReturnEmptyArray(thenStmt.statements[0]);
             }
          }

          if (isGuard) {
            guards.push(stmt.expression.getText(sourceFile));
          }
        }

        // 2. Detect Mutations: state.context.x = y
        // We need to traverse the statement to find assignments
        findMutations(stmt, mutations, sourceFile);

        // 3. Detect Events: findEvent(events, EventType)
        findEvents(stmt, events, sourceFile);
      });
    }

    return { guards, mutations, events };
  }

  function isReturnEmptyArray(stmt: ts.ReturnStatement): boolean {
    if (stmt.expression && ts.isArrayLiteralExpression(stmt.expression)) {
      return stmt.expression.elements.length === 0;
    }
    return false;
  }

  function findMutations(node: ts.Node, mutations: string[], sourceFile: ts.SourceFile) {
    if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.EqualsToken) {
      const left = node.left;
      // Check for state.context.*
      if (ts.isPropertyAccessExpression(left)) {
        const text = left.getText(sourceFile);
        if (text.startsWith('state.context.')) {
          mutations.push(`${text} = ${node.right.getText(sourceFile)}`);
        }
      }
    }
    ts.forEachChild(node, n => findMutations(n, mutations, sourceFile));
  }

  function findEvents(node: ts.Node, events: string[], sourceFile: ts.SourceFile) {
    if (ts.isCallExpression(node)) {
      if (ts.isIdentifier(node.expression) && node.expression.text === 'findEvent') {
        if (node.arguments.length >= 2) {
          const eventType = node.arguments[1].getText(sourceFile);
          events.push(eventType);
        }
      }
    }
    ts.forEachChild(node, n => findEvents(n, events, sourceFile));
  }

  visit(sourceFile);
  return results;
}
