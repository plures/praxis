const praxis = require('./dist/node/index.cjs');
console.log('ReactiveLogicEngine:', praxis.ReactiveLogicEngine);

try {
    const engine = new praxis.ReactiveLogicEngine({ initialContext: {} });
    console.log('Engine created successfully');
    console.log('Initial state:', engine.state);
} catch (e) {
    console.error('Error creating engine:', e);
}

