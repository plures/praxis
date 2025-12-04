/**
 * Terminal Node Example
 *
 * Demonstrates the usage of TerminalNode in Praxis
 */

import { createTerminalAdapter, runTerminalCommand, loadSchemaFromFile } from '../../dist/index.js';

async function main() {
  console.log('=== Praxis Terminal Node Example ===\n');

  // Example 1: Create a terminal adapter
  console.log('1. Creating terminal adapter...');
  const terminal = createTerminalAdapter({
    nodeId: 'example-terminal',
    props: {
      inputMode: 'text',
      history: [],
      lastOutput: null,
    },
    inputPath: '/terminal/input',
    outputPath: '/terminal/output',
  });

  // Example 2: Execute commands
  console.log('\n2. Executing commands...');
  const result1 = await terminal.executeCommand('echo "Hello, Praxis!"');
  console.log(`Command: ${result1.command}`);
  console.log(`Output: ${result1.output}`);
  console.log(`Exit Code: ${result1.exitCode}`);

  const result2 = await terminal.executeCommand('ls -la');
  console.log(`\nCommand: ${result2.command}`);
  console.log(`Output: ${result2.output}`);

  // Example 3: Check command history
  console.log('\n3. Command history:');
  const history = terminal.getHistory();
  history.forEach((cmd, index) => {
    console.log(`  ${index + 1}. ${cmd}`);
  });

  // Example 4: Update terminal props
  console.log('\n4. Updating terminal props...');
  terminal.updateProps({
    inputMode: 'widget',
  });
  const state = terminal.getState();
  console.log(`Input Mode: ${state.inputMode}`);

  // Example 5: Use convenience function
  console.log('\n5. Using convenience function...');
  const quickResult = await runTerminalCommand('quick-terminal', 'pwd');
  console.log(`Quick command output: ${quickResult.output}`);

  // Example 6: Load terminal schema from YAML
  console.log('\n6. Loading terminal schema from YAML...');
  const schemaPath = new URL('./terminal-schema.yaml', import.meta.url).pathname;
  const schemaResult = await loadSchemaFromFile(schemaPath);

  if (schemaResult.schema) {
    console.log(`Schema loaded: ${schemaResult.schema.name}`);
    console.log(`Description: ${schemaResult.schema.description}`);

    const nodes = schemaResult.schema.orchestration?.nodes || [];
    console.log(`\nTerminal nodes defined: ${nodes.length}`);

    nodes.forEach((node, index) => {
      console.log(`\nNode ${index + 1}:`);
      console.log(`  ID: ${node.id}`);
      console.log(`  Type: ${node.type}`);
      console.log(`  Position: (${node.x}, ${node.y})`);
      if (node.props) {
        const props = node.props;
        console.log(`  Input Mode: ${props.inputMode}`);
        console.log(`  History Length: ${props.history?.length || 0}`);
      }
      if (node.bindings) {
        console.log(`  Input Binding: ${node.bindings.input}`);
        console.log(`  Output Binding: ${node.bindings.output}`);
      }
    });
  }

  console.log('\n=== Example Complete ===');
}

main().catch((error) => {
  console.error('Error running example:', error);
  process.exit(1);
});
